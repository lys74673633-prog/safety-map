const { sendJson, setCors, fetchJson } = require('./_http');

async function geocodeOpenMeteo(q) {
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
  return korea[0] || results[0] || null;
}

async function geocodeNominatim(q) {
  const params = new URLSearchParams({
    q: q,
    format: 'json',
    limit: '5',
    countrycodes: 'kr',
    'accept-language': 'ko',
  });
  const res = await fetch('https://nominatim.openstreetmap.org/search?' + params.toString(), {
    headers: { 'User-Agent': 'Oasi5/1.0 (safety-map)' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) return null;
  return data[0];
}

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
    let point = null;
    const om = await geocodeOpenMeteo(q);
    if (om) {
      point = {
        name: om.name || q,
        address: [om.admin3, om.admin2, om.admin1, om.country].filter(Boolean).join(' '),
        lat: om.latitude,
        lng: om.longitude,
        source: 'open-meteo',
      };
    }
    if (!point) {
      const nom = await geocodeNominatim(q);
      if (nom) {
        point = {
          name: nom.display_name.split(',')[0] || q,
          address: nom.display_name || '',
          lat: Number(nom.lat),
          lng: Number(nom.lon),
          source: 'nominatim',
        };
      }
    }
    if (!point) {
      return sendJson(res, 404, { error: true, message: '위치를 찾지 못했습니다.', query: q });
    }
    return sendJson(res, 200, { query: q, point: point });
  } catch (err) {
    return sendJson(res, 502, { error: true, message: '지오코딩에 실패했습니다.', query: q });
  }
};
