const { sendJson, setCors } = require('./_http');
const { searchPlaces } = require('./_naver-places');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const q = String((req.query && (req.query.q || req.query.query)) || '').trim();
  const limit = Math.min(Number(req.query.limit) || 20, 30);
  if (!q) return sendJson(res, 200, { query: q, items: [] });

  try {
    const items = await searchPlaces(q, limit);
    return sendJson(res, 200, { query: q, items: items, source: 'naver' });
  } catch (err) {
    return sendJson(res, 200, { query: q, items: [] });
  }
};
