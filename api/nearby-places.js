const { sendJson, setCors } = require('./_http');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const kind = String(req.query.kind || 'cafe');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return sendJson(res, 400, { error: true, message: '좌표 형식이 올바르지 않습니다.' });
  }

  const radius = Math.min(Math.max(Number(req.query.radius) || 5, 1), 10);
  return sendJson(res, 200, {
    lat: lat,
    lng: lng,
    kind: kind,
    radiusKm: radius,
    items: [],
    source: 'curated-client',
  });
};
