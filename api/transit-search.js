const { sendJson, setCors, fetchJson } = require('./_http');

function inKorea(lat, lng) {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

function looksLikeHome(q) {
  return /아파트|빌라|오피스텔|단지|[시군구]|읍|면|동|리|로\s*\d|길\s*\d|번지/.test(q) || /\s/.test(q);
}

async function nominatimItems(q, limit) {
  const params = new URLSearchParams({
    q: q,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(limit),
    countrycodes: 'kr',
    'accept-language': 'ko',
  });
  const res = await fetch('https://nominatim.openstreetmap.org/search?' + params.toString(), {
    headers: {
      'User-Agent': 'Oasi5/1.0 (safety-map transit-search)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .map(function (row) {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!inKorea(lat, lng)) return null;
      const addr = row.address || {};
      return {
        name: looksLikeHome(q) ? q : (row.name || String(row.display_name || q).split(',')[0].trim() || q),
        address: [
          addr.road,
          addr.neighbourhood || addr.suburb,
          addr.city_district || addr.borough,
          addr.city || addr.town || addr.county,
          addr.state,
        ]
          .filter(Boolean)
          .join(' ') || row.display_name || '',
        lat: lat,
        lng: lng,
        kind: '주소검색',
        source: 'geocode',
      };
    })
    .filter(Boolean);
}

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
    const items = [];
    const seen = {};

    function push(item) {
      if (!item || item.lat == null || item.lng == null) return;
      const key = String(item.name) + '|' + Number(item.lat).toFixed(4) + ',' + Number(item.lng).toFixed(4);
      if (seen[key]) return;
      seen[key] = true;
      items.push(item);
    }

    // Prefer Nominatim for Korean apartment / address style queries.
    if (looksLikeHome(q) || /[가-힣]/.test(q)) {
      const cleaned = q
        .replace(/\s*\d+\s*동(\s*\d+\s*호)?/g, ' ')
        .replace(/\s*\d+\s*호/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const nom = await nominatimItems(cleaned || q, limit);
      nom.forEach(push);
    }

    if (items.length < limit) {
      const url =
        'https://geocoding-api.open-meteo.com/v1/search?name=' +
        encodeURIComponent(q) +
        '&count=' + limit +
        '&language=ko&format=json&countryCode=KR';
      const data = await fetchJson(url);
      const results = Array.isArray(data.results) ? data.results : [];
      results.forEach(function (r) {
        if (!(r.country_code === 'KR' || inKorea(r.latitude, r.longitude))) return;
        push({
          name: looksLikeHome(q) ? q : r.name,
          address: [r.admin3, r.admin2, r.admin1].filter(Boolean).join(' '),
          lat: r.latitude,
          lng: r.longitude,
          kind: r.feature_code || '장소',
          source: 'geocode',
        });
      });
    }

    return sendJson(res, 200, { query: q, items: items.slice(0, limit), source: 'mixed' });
  } catch (err) {
    return sendJson(res, 200, { query: q, items: [] });
  }
};
