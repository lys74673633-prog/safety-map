const { sendJson, setCors, fetchJson } = require('./_http');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const q = String((req.query && req.query.q) || '').trim();
  if (!q) {
    return sendJson(res, 400, { error: true, message: 'q 파라미터가 필요합니다.', query: q });
  }

  try {
    const url =
      'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(q) +
      '&count=8&language=ko&format=json';
    const data = await fetchJson(url);
    const results = Array.isArray(data.results) ? data.results : [];
    const korea = results.filter(function (r) {
      return (
        r.country_code === 'KR' ||
        (r.latitude >= 33 && r.latitude <= 39 && r.longitude >= 124 && r.longitude <= 132)
      );
    });
    const hit = korea[0] || results[0];
    if (!hit) {
      return sendJson(res, 404, { error: true, message: '위치를 찾지 못했습니다.', query: q });
    }

    const address = [hit.admin3, hit.admin2, hit.admin1, hit.country].filter(Boolean).join(' ');
    return sendJson(res, 200, {
      query: q,
      point: {
        name: hit.name || q,
        address: address,
        lat: hit.latitude,
        lng: hit.longitude,
        source: 'open-meteo',
      },
    });
  } catch (err) {
    return sendJson(res, 502, { error: true, message: '지오코딩에 실패했습니다.', query: q });
  }
};
