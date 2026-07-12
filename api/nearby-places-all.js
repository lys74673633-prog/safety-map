const { sendJson, setCors } = require('./_http');

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
  // Remote Naver scrape is not available on Vercel; client falls back to curated places.
  return sendJson(res, 200, {
    lat: lat,
    lng: lng,
    radiusKm: radius,
    cafe: [],
    food: [],
    shop: [],
    source: 'curated-client',
  });
};
