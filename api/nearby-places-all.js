const { sendJson, setCors } = require('./_http');
const { searchNearbyAll } = require('./_naver-places');

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

  try {
    const data = await searchNearbyAll(lat, lng, radius, limit);
    return sendJson(res, 200, {
      lat: lat,
      lng: lng,
      radiusKm: radius,
      cafe: data.cafe || [],
      food: data.food || [],
      shop: data.shop || [],
      source: data.source || 'naver',
    });
  } catch (err) {
    return sendJson(res, 200, {
      lat: lat,
      lng: lng,
      radiusKm: radius,
      cafe: [],
      food: [],
      shop: [],
      source: 'empty',
      warning: '주변 장소를 불러오지 못했습니다. 다시 검색해 주세요.',
    });
  }
};
