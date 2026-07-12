const { sendJson, setCors } = require('./_http');
const { searchPlaces } = require('./_naver-places');

function inKorea(lat, lng) {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

async function nominatimSearch(q) {
  const params = new URLSearchParams({
    q: q,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '3',
    countrycodes: 'kr',
    'accept-language': 'ko',
  });
  try {
    const res = await fetch('https://nominatim.openstreetmap.org/search?' + params.toString(), {
      headers: {
        'User-Agent': 'Oasi5/1.0 (safety-map geocoder)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    for (const row of data) {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!inKorea(lat, lng)) continue;
      return {
        name: row.name || String(row.display_name || q).split(',')[0].trim() || q,
        address: row.display_name || '',
        lat: lat,
        lng: lng,
        source: 'nominatim',
      };
    }
  } catch (err) {}
  return null;
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
    // Naver place search first — same source as map.naver.com place list.
    const naver = await searchPlaces(q, 5);
    let point = naver[0] || null;
    if (!point) point = await nominatimSearch(q + ' 대한민국');
    if (!point) point = await nominatimSearch(q);

    if (!point) {
      return sendJson(res, 404, {
        error: true,
        message: '위치를 찾지 못했습니다. 장소명이나 주소를 다시 입력해 주세요.',
        query: q,
      });
    }

    point = Object.assign({}, point, { name: q });
    return sendJson(res, 200, { query: q, point: point });
  } catch (err) {
    return sendJson(res, 502, { error: true, message: '지오코딩에 실패했습니다.', query: q });
  }
};
