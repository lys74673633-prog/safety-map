const { sendJson, setCors } = require('./_http');

function inKorea(lat, lng) {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

function stripDetail(q) {
  return String(q || '')
    .replace(/\s*\d+\s*동(\s*\d+\s*호)?/g, ' ')
    .replace(/\s*\d+\s*호/g, ' ')
    .replace(/\s*[A-Za-z]?\d+층/g, ' ')
    .replace(/\s*(아파트|APT|빌라|오피스텔|단지)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function queryVariants(q) {
  const base = String(q || '').trim();
  const stripped = stripDetail(base);
  const out = [];
  function add(v) {
    if (v && out.indexOf(v) < 0) out.push(v);
  }
  add(base);
  add(stripped);
  add(base + ', South Korea');
  add(stripped + ', South Korea');
  add(base + ' 대한민국');
  add(stripped + ' 대한민국');
  return out.slice(0, 6);
}

async function nominatimSearch(q) {
  const params = new URLSearchParams({
    q: q,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'kr',
    'accept-language': 'ko',
  });
  const res = await fetch('https://nominatim.openstreetmap.org/search?' + params.toString(), {
    headers: {
      'User-Agent': 'Oasi5/1.0 (safety-map; contact: local-dev)',
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
    const addr = row.address || {};
    const label =
      row.namedetails && row.namedetails.name
        ? row.namedetails.name
        : (row.display_name || q).split(',')[0].trim();
    const address = [
      addr.road,
      addr.neighbourhood || addr.suburb || addr.quarter,
      addr.borough || addr.city_district,
      addr.city || addr.town || addr.county,
      addr.state,
    ]
      .filter(Boolean)
      .join(' ');
    return {
      name: label || q,
      address: address || row.display_name || '',
      lat: lat,
      lng: lng,
      source: 'nominatim',
    };
  }
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
    let point = null;
    for (const variant of queryVariants(q)) {
      point = await nominatimSearch(variant);
      if (point) break;
      // Nominatim rate-limit friendly pause between variants
      await new Promise(function (r) { setTimeout(r, 200); });
    }

    if (!point) {
      return sendJson(res, 404, {
        error: true,
        message: '위치를 찾지 못했습니다. 도로명·동·건물명 위주로 입력해 주세요.',
        query: q,
      });
    }

    if (/[가-힣].*(로|길|동|아파트|빌라|단지|번지)/.test(q)) {
      point = Object.assign({}, point, { name: q });
    }

    return sendJson(res, 200, { query: q, point: point });
  } catch (err) {
    return sendJson(res, 502, { error: true, message: '지오코딩에 실패했습니다.', query: q });
  }
};
