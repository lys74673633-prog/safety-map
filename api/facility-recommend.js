const { sendJson, setCors } = require('./_http');
const { searchPlaces, searchNearbyAll } = require('./_naver-places');

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
      if (!(lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132)) continue;
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

  const radius = Math.min(Math.max(Number(req.query.radius) || 2.5, 1), 4);
  const limit = Math.min(Math.max(Number(req.query.limit) || 6, 4), 10);

  try {
    const naverP = searchPlaces(q, 3).then(function (items) {
      return items && items[0] ? Object.assign({}, items[0], { name: q }) : null;
    });
    const meteoP = openMeteoSearch(q).then(function (p) {
      return p ? Object.assign({}, p, { name: q }) : null;
    });

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
    if (!point) point = (await naverP) || (await meteoP);

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
