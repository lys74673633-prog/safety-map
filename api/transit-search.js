const { sendJson, setCors, fetchJson } = require('./_http');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const q = String((req.query && req.query.q) || '').trim();
  const limit = Math.min(Number(req.query.limit) || 8, 15);
  if (!q) return sendJson(res, 200, { query: q, items: [] });

  try {
    const url =
      'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(q) +
      '&count=' + limit +
      '&language=ko&format=json';
    const data = await fetchJson(url);
    const results = Array.isArray(data.results) ? data.results : [];
    const items = results
      .filter(function (r) {
        return (
          r.country_code === 'KR' ||
          (r.latitude >= 33 && r.latitude <= 39 && r.longitude >= 124 && r.longitude <= 132)
        );
      })
      .map(function (r) {
        return {
          name: r.name,
          address: [r.admin3, r.admin2, r.admin1].filter(Boolean).join(' '),
          lat: r.latitude,
          lng: r.longitude,
          kind: r.feature_code || '장소',
          source: 'geocode',
        };
      });
    return sendJson(res, 200, { query: q, items: items, source: 'open-meteo' });
  } catch (err) {
    return sendJson(res, 200, { query: q, items: [] });
  }
};
