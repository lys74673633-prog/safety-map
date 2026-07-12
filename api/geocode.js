const { sendJson, setCors, fetchJson } = require('./_http');

function inKorea(lat, lng) {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

function stripDetail(q) {
  return String(q || '')
    .replace(/\s*\d+\s*동(\s*\d+\s*호)?/g, ' ')
    .replace(/\s*\d+\s*호/g, ' ')
    .replace(/\s*[A-Za-z]?\d+층/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function queryVariants(q) {
  const base = String(q || '').trim();
  const stripped = stripDetail(base);
  const variants = [base];
  if (stripped && stripped !== base) variants.push(stripped);
  if (!/대한민국|한국|Korea/i.test(base)) {
    variants.push(base + ' 대한민국');
    if (stripped && stripped !== base) variants.push(stripped + ' 대한민국');
  }
  return variants.filter(function (v, i, arr) {
    return v && arr.indexOf(v) === i;
  }).slice(0, 4);
}

async function geocodePhoton(q) {
  const url =
    'https://photon.komoot.io/api/?q=' +
    encodeURIComponent(q) +
    '&limit=5&lang=ko&lat=36.5&lon=127.8';
  const data = await fetchJson(url);
  const features = (data && data.features) || [];
  for (const f of features) {
    const coords = (f.geometry && f.geometry.coordinates) || [];
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!inKorea(lat, lng)) continue;
    const p = f.properties || {};
    const name = p.name || p.street || q;
    const address = [p.street, p.housenumber, p.district, p.city, p.state, p.country]
      .filter(Boolean)
      .join(' ');
    return { name: name, address: address || p.country || '', lat: lat, lng: lng, source: 'photon' };
  }
  return null;
}

async function geocodeNominatim(q) {
  const params = new URLSearchParams({
    q: q,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'kr',
    'accept-language': 'ko',
  });
  const res = await fetch('https://nominatim.openstreetmap.org/search?' + params.toString(), {
    headers: { 'User-Agent': 'Oasi5/1.0 (safety-map geocoder)' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) return null;
  for (const row of data) {
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!inKorea(lat, lng)) continue;
    const name = (row.display_name || q).split(',')[0].trim();
    return {
      name: name || q,
      address: row.display_name || '',
      lat: lat,
      lng: lng,
      source: 'nominatim',
    };
  }
  return null;
}

async function geocodeOpenMeteo(q) {
  const url =
    'https://geocoding-api.open-meteo.com/v1/search?name=' +
    encodeURIComponent(q) +
    '&count=8&language=ko&format=json';
  const data = await fetchJson(url);
  const results = Array.isArray(data.results) ? data.results : [];
  const hit =
    results.find(function (r) {
      return r.country_code === 'KR' || inKorea(r.latitude, r.longitude);
    }) || null;
  if (!hit) return null;
  return {
    name: hit.name || q,
    address: [hit.admin3, hit.admin2, hit.admin1, hit.country].filter(Boolean).join(' '),
    lat: hit.latitude,
    lng: hit.longitude,
    source: 'open-meteo',
  };
}

async function geocodeOneVariant(q) {
  // Prefer Photon/Nominatim for street-level home addresses.
  const photon = await geocodePhoton(q).catch(function () { return null; });
  if (photon) return photon;
  const nominatim = await geocodeNominatim(q).catch(function () { return null; });
  if (nominatim) return nominatim;
  return geocodeOpenMeteo(q).catch(function () { return null; });
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
      point = await geocodeOneVariant(variant);
      if (point) break;
    }
    if (!point) {
      return sendJson(res, 404, {
        error: true,
        message: '위치를 찾지 못했습니다. 도로명·동 단위로 조금 더 구체적으로 입력해 주세요.',
        query: q,
      });
    }
    // Keep user's original typed text as display name when it looks like an address.
    if (/[가-힣].*(로|길|동|아파트|빌라|단지)/.test(q)) {
      point = Object.assign({}, point, { name: q, query: q });
    }
    return sendJson(res, 200, { query: q, point: point });
  } catch (err) {
    return sendJson(res, 502, { error: true, message: '지오코딩에 실패했습니다.', query: q });
  }
};
