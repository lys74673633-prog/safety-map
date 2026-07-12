const { sendJson, setCors } = require('./_http');
const { searchPlaces } = require('./_naver-places');

function inKorea(lat, lng) {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

async function openMeteoSearch(q) {
  const params = new URLSearchParams({
    name: q,
    count: '5',
    language: 'ko',
    format: 'json',
    countryCode: 'KR',
  });
  try {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, 2200);
    const res = await fetch('https://geocoding-api.open-meteo.com/v1/search?' + params.toString(), {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const rows = (data && data.results) || [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lat = Number(row.latitude);
      const lng = Number(row.longitude);
      if (!inKorea(lat, lng)) continue;
      return {
        name: row.name || q,
        address: [row.admin3, row.admin2, row.admin1].filter(Boolean).join(' ') || '',
        lat: lat,
        lng: lng,
        source: 'open-meteo',
      };
    }
  } catch (err) {}
  return null;
}

async function nominatimSearch(q) {
  const params = new URLSearchParams({
    q: q,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '2',
    countrycodes: 'kr',
    'accept-language': 'ko',
  });
  try {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, 2500);
    const res = await fetch('https://nominatim.openstreetmap.org/search?' + params.toString(), {
      headers: {
        'User-Agent': 'Oasi5/1.0 (safety-map geocoder)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
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
    const naverP = searchPlaces(q, 3).then(function (items) {
      return items && items[0] ? items[0] : null;
    });
    const meteoP = openMeteoSearch(q);

    let point = null;
    await new Promise(function (resolve) {
      var left = 2;
      var done = false;
      function one(p) {
        if (!done && p) {
          done = true;
          point = p;
          resolve();
          return;
        }
        left -= 1;
        if (!done && left <= 0) resolve();
      }
      naverP.then(one).catch(function () { one(null); });
      meteoP.then(one).catch(function () { one(null); });
    });

    if (!point) {
      point = (await naverP) || (await meteoP) || (await nominatimSearch(q + ' 대한민국')) || (await nominatimSearch(q));
    }

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
