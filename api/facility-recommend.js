const { sendJson, setCors } = require('./_http');
const { searchPlaces, searchNearbyAll } = require('./_naver-places');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const q = String((req.query && req.query.q) || '').trim();
  if (!q) {
    return sendJson(res, 400, { error: true, message: 'q 파라미터가 필요합니다.' });
  }

  const radius = Math.min(Math.max(Number(req.query.radius) || 2.5, 1), 5);
  const limit = Math.min(Math.max(Number(req.query.limit) || 8, 4), 12);

  try {
    const places = await searchPlaces(q, 4);
    const point = places[0]
      ? Object.assign({}, places[0], { name: q })
      : null;

    if (!point || !point.lat || !point.lng) {
      return sendJson(res, 200, {
        query: q,
        point: null,
        cafe: [],
        food: [],
        shop: [],
        source: 'empty',
        message: '위치를 찾지 못했습니다.',
      });
    }

    const nearby = await searchNearbyAll(point.lat, point.lng, radius, limit);
    return sendJson(res, 200, {
      query: q,
      point: point,
      cafe: nearby.cafe || [],
      food: nearby.food || [],
      shop: nearby.shop || [],
      source: nearby.source || 'naver',
      radiusKm: radius,
    });
  } catch (err) {
    return sendJson(res, 200, {
      query: q,
      point: null,
      cafe: [],
      food: [],
      shop: [],
      source: 'empty',
      message: '추천을 불러오지 못했습니다.',
    });
  }
};
