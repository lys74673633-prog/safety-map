const { sendJson, setCors } = require('./_http');

function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = Math.PI / 180;
  const dLat = (bLat - aLat) * toRad;
  const dLng = (bLng - aLng) * toRad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * toRad) * Math.cos(bLat * toRad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function kindFromTags(tags) {
  if (!tags) return null;
  if (tags.amenity === 'cafe' || tags.amenity === 'ice_cream' || tags.cuisine === 'coffee_shop') return 'cafe';
  if (
    tags.amenity === 'restaurant' ||
    tags.amenity === 'fast_food' ||
    tags.amenity === 'food_court' ||
    tags.amenity === 'cafe'
  ) {
    if (tags.amenity === 'cafe') return 'cafe';
    return 'food';
  }
  if (tags.shop || tags.amenity === 'marketplace') return 'shop';
  return null;
}

function nameFromTags(tags) {
  return (tags && (tags.name || tags['name:ko'] || tags.brand)) || '';
}

async function fetchOverpass(lat, lng, radiusM) {
  const query =
    '[out:json][timeout:20];(' +
    'node["amenity"="cafe"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'node["amenity"="restaurant"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'node["amenity"="fast_food"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'node["amenity"="food_court"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'node["shop"~"mall|department_store|supermarket|convenience|clothes|bakery"](around:' +
    radiusM + ',' + lat + ',' + lng + ');' +
    'way["amenity"="cafe"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'way["amenity"="restaurant"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'way["shop"~"mall|department_store|supermarket"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    ');out center 60;';

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  let lastErr;
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Oasi5/1.0',
        },
        body: 'data=' + encodeURIComponent(query),
      });
      if (!res.ok) throw new Error('overpass ' + res.status);
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('overpass failed');
}

function collectItems(data, lat, lng, kind, radiusKm, limit) {
  const elements = (data && data.elements) || [];
  const items = [];
  const seen = {};

  elements.forEach(function (el) {
    const tags = el.tags || {};
    const itemKind = kindFromTags(tags);
    if (itemKind !== kind) return;
    const name = nameFromTags(tags);
    if (!name) return;
    const itemLat = el.lat != null ? el.lat : (el.center && el.center.lat);
    const itemLng = el.lon != null ? el.lon : (el.center && el.center.lon);
    if (itemLat == null || itemLng == null) return;
    const distanceKm = haversineKm(lat, lng, itemLat, itemLng);
    if (distanceKm > radiusKm) return;
    const key = name + '|' + itemLat.toFixed(4) + ',' + itemLng.toFixed(4);
    if (seen[key]) return;
    seen[key] = true;
    items.push({
      name: name,
      address: [tags['addr:full'], tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ') || '',
      lat: itemLat,
      lng: itemLng,
      distanceKm: Math.round(distanceKm * 100) / 100,
      kind: kind,
      source: 'osm',
      image: '',
    });
  });

  items.sort(function (a, b) { return a.distanceKm - b.distanceKm; });
  return items.slice(0, limit);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return sendJson(res, 400, { error: true, message: '좌표 형식이 올바르지 않습니다.' });
  }
  if (!(lng >= 124 && lng <= 132 && lat >= 33 && lat <= 39)) {
    return sendJson(res, 400, { error: true, message: '한국 내 좌표만 지원합니다.' });
  }

  const radius = Math.min(Math.max(Number(req.query.radius) || 5, 1), 10);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 5), 25);
  const radiusM = Math.round(radius * 1000);

  try {
    const data = await fetchOverpass(lat, lng, radiusM);
    return sendJson(res, 200, {
      lat: lat,
      lng: lng,
      radiusKm: radius,
      cafe: collectItems(data, lat, lng, 'cafe', radius, limit),
      food: collectItems(data, lat, lng, 'food', radius, limit),
      shop: collectItems(data, lat, lng, 'shop', radius, limit),
      source: 'osm',
    });
  } catch (err) {
    return sendJson(res, 200, {
      lat: lat,
      lng: lng,
      radiusKm: radius,
      cafe: [],
      food: [],
      shop: [],
      source: 'curated-client',
      warning: '주변 검색을 불러오지 못해 추천 목록만 표시합니다.',
    });
  }
};
