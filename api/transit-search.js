const { sendJson, setCors } = require('./_http');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const q = String((req.query && req.query.q) || '');
  return sendJson(res, 200, { query: q, items: [], source: 'local-client' });
};
