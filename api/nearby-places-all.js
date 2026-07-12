const { sendJson, setCors } = require('./_http');

const nearbyCache = new Map();
const CACHE_TTL_MS = 8 * 60 * 1000;

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
  if (tags.amenity === 'cafe' || tags.amenity === 'ice_cream') return 'cafe';
  if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food' || tags.amenity === 'food_court') {
    return 'food';
  }
  if (tags.shop) return 'shop';
  return null;
}

function nameFromTags(tags) {
  return (tags && (tags['name:ko'] || tags.name || tags.brand || tags.operator)) || '';
}

function mapThumb(lat, lng) {
  const n = Math.pow(2, 15);
  const x = Math.floor(((Number(lng) + 180) / 360) * n);
  const latRad = Number(lat) * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return 'https://a.basemaps.cartocdn.com/rastertiles/voyager/15/' + x + '/' + y + '@2x.png';
}

function elementCoords(el) {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lng: el.lon };
  if (el.center && el.center.lat != null && el.center.lon != null) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
}

async function fetchOverpass(lat, lng, radiusM) {
  // nwr + out center: catches shops mapped as ways, not only nodes.
  const query =
    '[out:json][timeout:6];(' +
    'nwr["amenity"="cafe"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'nwr["amenity"="restaurant"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'nwr["amenity"="fast_food"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'nwr["amenity"="food_court"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'nwr["shop"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    ');out center 50;';

  const endpoints = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter',
  ];

  let lastErr;
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(function () { controller.abort(); }, 6500);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Oasi5/1.0',
        },
        body: 'data=' + encodeURIComponent(query),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error('overpass ' + res.status);
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('overpass failed');
}

async function nominatimAround(lat, lng, keyword, kind, radiusKm, limit) {
  const delta = Math.max(0.01, radiusKm / 100);
  const viewbox = [
    (lng - delta).toFixed(5),
    (lat + delta).toFixed(5),
    (lng + delta).toFixed(5),
    (lat - delta).toFixed(5),
  ].join(',');
  const params = new URLSearchParams({
    q: keyword,
    format: 'jsonv2',
    limit: String(limit),
    countrycodes: 'kr',
    viewbox: viewbox,
    bounded: '1',
    'accept-language': 'ko',
  });
  try {
    const res = await fetch('https://nominatim.openstreetmap.org/search?' + params.toString(), {
      headers: {
        'User-Agent': 'Oasi5/1.0 (nearby places)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map(function (row) {
        const itemLat = Number(row.lat);
        const itemLng = Number(row.lon);
        if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng)) return null;
        const distanceKm = haversineKm(lat, lng, itemLat, itemLng);
        if (distanceKm > radiusKm) return null;
        const name = row.name || String(row.display_name || '').split(',')[0].trim();
        if (!name) return null;
        return {
          name: name,
          address: row.display_name || '',
          lat: itemLat,
          lng: itemLng,
          distanceKm: Math.round(distanceKm * 100) / 100,
          kind: kind,
          source: 'nominatim',
          image: mapThumb(itemLat, itemLng),
        };
      })
      .filter(Boolean);
  } catch (err) {
    return [];
  }
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
    const coords = elementCoords(el);
    if (!coords) return;
    const distanceKm = haversineKm(lat, lng, coords.lat, coords.lng);
    if (distanceKm > radiusKm) return;
    const key = name + '|' + coords.lat.toFixed(4) + ',' + coords.lng.toFixed(4);
    if (seen[key]) return;
    seen[key] = true;
    items.push({
      name: name,
      address: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ') || '',
      lat: coords.lat,
      lng: coords.lng,
      distanceKm: Math.round(distanceKm * 100) / 100,
      kind: kind,
      source: 'osm',
      image: mapThumb(coords.lat, coords.lng),
    });
  });

  items.sort(function (a, b) { return a.distanceKm - b.distanceKm; });
  return items.slice(0, limit);
}

function mergeLists(primary, secondary, limit) {
  const out = [];
  const seen = {};
  primary.concat(secondary).forEach(function (item) {
    if (!item || !item.name) return;
    const key = item.name + '|' + Number(item.lat).toFixed(4) + ',' + Number(item.lng).toFixed(4);
    if (seen[key]) return;
    seen[key] = true;
    out.push(item);
  });
  out.sort(function (a, b) { return a.distanceKm - b.distanceKm; });
  return out.slice(0, limit);
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

  const radius = Math.min(Math.max(Number(req.query.radius) || 3, 1), 6);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 4), 20);
  const cacheKey = lat.toFixed(3) + ',' + lng.toFixed(3) + '|' + radius + '|' + limit;
  const cached = nearbyCache.get(cacheKey);
  if (cached && Date.now() - cached.t < CACHE_TTL_MS) {
    return sendJson(res, 200, cached.data);
  }

  const radiusM = Math.round(radius * 1000);
  let cafe = [];
  let food = [];
  let shop = [];
  let source = 'osm';

  try {
    const data = await fetchOverpass(lat, lng, radiusM);
    cafe = collectItems(data, lat, lng, 'cafe', radius, limit);
    food = collectItems(data, lat, lng, 'food', radius, limit);
    shop = collectItems(data, lat, lng, 'shop', radius, limit);
  } catch (err) {
    source = 'nominatim';
  }

  // Fill gaps with Nominatim keyword search around the destination.
  if (cafe.length < 3 || food.length < 3 || shop.length < 3) {
    const [cafeExtra, foodExtra, shopExtra] = await Promise.all([
      cafe.length < 3 ? nominatimAround(lat, lng, '카페', 'cafe', radius, limit) : Promise.resolve([]),
      food.length < 3 ? nominatimAround(lat, lng, '식당', 'food', radius, limit) : Promise.resolve([]),
      shop.length < 3 ? nominatimAround(lat, lng, '마트', 'shop', radius, limit) : Promise.resolve([]),
    ]);
    cafe = mergeLists(cafe, cafeExtra, limit);
    food = mergeLists(food, foodExtra, limit);
    shop = mergeLists(shop, shopExtra, limit);
    if (source === 'nominatim' || cafeExtra.length || foodExtra.length || shopExtra.length) {
      source = cafe.length || food.length || shop.length ? 'mixed' : source;
    }
  }

  const payload = {
    lat: lat,
    lng: lng,
    radiusKm: radius,
    cafe: cafe,
    food: food,
    shop: shop,
    source: source,
  };
  nearbyCache.set(cacheKey, { t: Date.now(), data: payload });
  return sendJson(res, 200, payload);
};
