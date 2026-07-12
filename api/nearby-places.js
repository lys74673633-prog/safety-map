const { sendJson, setCors } = require('./_http');
const { searchNearbyKind } = require('./_naver-places');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const kind = String(req.query.kind || 'cafe');
  const radius = Math.min(Math.max(Number(req.query.radius) || 2.5, 1), 5);
  const limit = Math.min(Math.max(Number(req.query.limit) || 8, 4), 12);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return sendJson(res, 400, { error: true, message: 'lat/lng가 필요합니다.' });
  }

  try {
    const items = await searchNearbyKind(lat, lng, kind, radius, limit);
    return sendJson(res, 200, {
      lat: lat,
      lng: lng,
      kind: kind,
      radiusKm: radius,
      items: items,
      source: 'naver',
    });
  } catch (err) {
    return sendJson(res, 200, {
      lat: lat,
      lng: lng,
      kind: kind,
      radiusKm: radius,
      items: [],
      source: 'empty',
    });
  }
};
