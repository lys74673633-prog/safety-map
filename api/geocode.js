const { sendJson, setCors } = require('./_http');

function inKorea(lat, lng) {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

function unique(list) {
  const out = [];
  const seen = {};
  list.forEach(function (v) {
    if (!v || seen[v]) return;
    seen[v] = true;
    out.push(v);
  });
  return out;
}

function stripAptNoise(q) {
  return String(q || '')
    .replace(/\s*\d+\s*동(\s*\d+\s*호)?/g, ' ')
    .replace(/\s*\d+\s*호/g, ' ')
    .replace(/\s*[A-Za-z]?\d+\s*층/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function queryVariants(q) {
  const base = stripAptNoise(q);
  const variants = [base, base + ', South Korea', base + ' 대한민국'];

  // "수원 힐스테이트" <-> "힐스테이트 수원"
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    variants.push(parts.slice().reverse().join(' '));
    variants.push(parts.slice().reverse().join(' ') + ' 대한민국');
  }

  // Ensure 아파트 suffix variants
  if (/아파트|APT|apt/i.test(base) === false && /[가-힣]{2,}/.test(base)) {
    const maybeApt = parts[parts.length - 1];
    if (maybeApt && maybeApt.length >= 2) {
      variants.push(base + ' 아파트');
      variants.push(parts.slice(0, -1).concat([maybeApt + '아파트']).join(' '));
    }
  }

  return unique(variants).slice(0, 8);
}

function toPoint(row, q, source) {
  const lat = Number(row.lat != null ? row.lat : row.latitude);
  const lng = Number(row.lon != null ? row.lon : row.lng != null ? row.lng : row.longitude);
  if (!inKorea(lat, lng)) return null;
  const addr = row.address || {};
  const address = [
    addr.road,
    addr.neighbourhood || addr.suburb || addr.quarter,
    addr.borough || addr.city_district,
    addr.city || addr.town || addr.county || addr.village,
    addr.state,
    row.admin3,
    row.admin2,
    row.admin1,
  ]
    .filter(Boolean)
    .join(' ');
  return {
    name: row.name || String(row.display_name || q).split(',')[0].trim() || q,
    address: address || row.display_name || '',
    lat: lat,
    lng: lng,
    source: source,
  };
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
      'User-Agent': 'Oasi5/1.0 (safety-map geocoder)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) return null;

  for (const row of data) {
    const point = toPoint(row, q, 'nominatim');
    if (point) return point;
  }
  return null;
}

async function openMeteoSearch(q) {
  const params = new URLSearchParams({
    name: q,
    count: '5',
    language: 'ko',
    format: 'json',
    countryCode: 'KR',
  });
  const res = await fetch('https://geocoding-api.open-meteo.com/v1/search?' + params.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': 'Oasi5/1.0' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const results = Array.isArray(data.results) ? data.results : [];
  for (const row of results) {
    const point = toPoint(row, q, 'open-meteo');
    if (point) return point;
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
    const variants = queryVariants(q);
    for (const variant of variants) {
      point = await nominatimSearch(variant);
      if (point) break;
      await new Promise(function (r) { setTimeout(r, 120); });
    }
    if (!point) {
      for (const variant of variants.slice(0, 4)) {
        point = await openMeteoSearch(variant);
        if (point) break;
      }
    }

    if (!point) {
      return sendJson(res, 404, {
        error: true,
        message: '위치를 찾지 못했습니다. "지역명 + 아파트명"처럼 입력해 보세요. 예: 해운대 경동아파트',
        query: q,
      });
    }

    // Keep user-friendly label for apartment/region queries.
    if (/아파트|빌라|오피스텔|단지|[시군구]|동|읍|면|리/.test(q) || /\s/.test(q)) {
      point = Object.assign({}, point, { name: q });
    }

    return sendJson(res, 200, { query: q, point: point });
  } catch (err) {
    return sendJson(res, 502, { error: true, message: '지오코딩에 실패했습니다.', query: q });
  }
};
