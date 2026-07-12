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

async function fetchOverpass(lat, lng, radiusM) {
  const query =
    '[out:json][timeout:8];(' +
    'node["highway"="bus_stop"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'node["public_transport"="platform"]["bus"="yes"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'node["amenity"="bus_station"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    ');out body 30;';

  const endpoints = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter',
  ];

  let lastErr;
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(function () { controller.abort(); }, 9000);
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

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Math.min(Math.max(Number(req.query.radius) || 0.8, 0.3), 2);
  const limit = Math.min(Math.max(Number(req.query.limit) || 8, 3), 15);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return sendJson(res, 400, { error: true, message: '좌표 형식이 올바르지 않습니다.' });
  }

  try {
    const data = await fetchOverpass(lat, lng, Math.round(radius * 1000));
    const items = [];
    const seen = {};
    (data.elements || []).forEach(function (el) {
      const tags = el.tags || {};
      const name = tags.name || tags['name:ko'] || '버스정류장';
      if (el.lat == null || el.lon == null) return;
      const distanceKm = haversineKm(lat, lng, el.lat, el.lon);
      const key = name + '|' + el.lat.toFixed(5) + ',' + el.lon.toFixed(5);
      if (seen[key]) return;
      seen[key] = true;
      items.push({
        name: name,
        lat: el.lat,
        lng: el.lon,
        distanceKm: Math.round(distanceKm * 1000) / 1000,
        distanceM: Math.round(distanceKm * 1000),
        source: 'osm',
        kind: 'bus_stop',
      });
    });
    items.sort(function (a, b) { return a.distanceKm - b.distanceKm; });
    return sendJson(res, 200, {
      lat: lat,
      lng: lng,
      radiusKm: radius,
      items: items.slice(0, limit),
    });
  } catch (err) {
    return sendJson(res, 200, { lat: lat, lng: lng, radiusKm: radius, items: [] });
  }
};
