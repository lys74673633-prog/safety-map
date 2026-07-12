const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const SKIP_NAMES = {
  거리1km: 1, 거리2km: 1, 거리3km: 1, 거리4km: 1, 거리5km: 1, 거리10km: 1,
  정렬: 1, 관련도순: 1, 리뷰많은순: 1, 신규장소: 1, 펼치기: 1, 접기: 1,
};

const KIND_QUERY = { cafe: '카페', food: '식당', shop: '마트' };
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function inKorea(lat, lng) {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = Math.PI / 180;
  const dLat = (bLat - aLat) * toRad;
  const dLng = (bLng - aLng) * toRad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * toRad) * Math.cos(bLat * toRad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function decodeNaverUrl(raw) {
  let s = String(raw || '').replace(/\\\//g, '/');
  for (let i = 0; i < 3; i++) {
    if (!s.includes('\\u')) break;
    try {
      s = JSON.parse('"' + s.replace(/"/g, '\\"') + '"');
    } catch (err) {
      break;
    }
  }
  return s.trim();
}

function scoreImage(url) {
  const u = String(url || '').toLowerCase();
  if (!u.startsWith('https://')) return 0;
  if (/favicon|banner|profile|sprite|1x1|blank|logo\.png|\/logo\//.test(u)) return 0;
  if (u.includes('ldb-phinf.pstatic.net')) return 100;
  if (u.includes('search.pstatic.net/common')) return 80;
  if (u.includes('pstatic.net')) return 50;
  return 10;
}

async function fetchNaverHtml(query, lat, lng) {
  const q = String(query || '').trim();
  if (!q) return '';
  const cacheKey = q + '|' + (lat || '') + ',' + (lng || '');
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.t < CACHE_TTL) return cached.html;

  const enc = encodeURIComponent(q);
  let url = 'https://pcmap.place.naver.com/place/list?query=' + enc + '&display=60&page=1';
  if (lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
    url +=
      '&x=' + encodeURIComponent(lng) +
      '&y=' + encodeURIComponent(lat) +
      '&clientX=' + encodeURIComponent(lng) +
      '&clientY=' + encodeURIComponent(lat);
  }

  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, 8000);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'ko-KR,ko;q=0.9',
        Referer: 'https://map.naver.com/',
        Accept: 'text/html,application/json,*/*',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('naver ' + res.status);
    const html = await res.text();
    cache.set(cacheKey, { t: Date.now(), html: html });
    return html;
  } catch (err) {
    clearTimeout(timer);
    return '';
  }
}

function pushPlace(out, seen, name, lat, lng, address, image) {
  const n = String(name || '').trim();
  if (!n || SKIP_NAMES[n] || n.length < 2) return;
  if (!inKorea(lat, lng)) return;
  const key = n + '|' + lat.toFixed(4) + ',' + lng.toFixed(4);
  if (seen[key]) return;
  seen[key] = true;
  out.push({
    name: n,
    address: address || '',
    lat: lat,
    lng: lng,
    kind: '장소',
    source: 'naver',
    image: image && scoreImage(image) > 0 ? image : '',
  });
}

function parsePlaces(html, limit) {
  const out = [];
  const seen = {};
  if (!html) return out;

  const imageBlock = /"name":"([^"\\]{2,80})"[\s\S]{0,5000}?"imageUrl":"((?:[^"\\]|\\.)*)"[\s\S]{0,2000}?"x":"([0-9.]+)"[\s\S]{0,300}?"y":"([0-9.]+)"/g;
  let m;
  while ((m = imageBlock.exec(html)) && out.length < limit) {
    const addrM = m[0].match(/"fullAddress":"((?:[^"\\]|\\.)*)"/);
    pushPlace(
      out,
      seen,
      m[1],
      Number(m[4]),
      Number(m[3]),
      addrM ? decodeNaverUrl(addrM[1]) : '',
      decodeNaverUrl(m[2])
    );
  }

  const block = /"name":"([^"\\]{2,80})"[\s\S]{0,900}?"x":"([0-9.]+)"[\s\S]{0,120}?"y":"([0-9.]+)"/g;
  while ((m = block.exec(html)) && out.length < limit) {
    const addrM = m[0].match(/"fullAddress":"((?:[^"\\]|\\.)*)"/);
    pushPlace(out, seen, m[1], Number(m[3]), Number(m[2]), addrM ? decodeNaverUrl(addrM[1]) : '', '');
  }

  const normalized = /"normalizedName":"([^"\\]{2,80})"[\s\S]{0,400}?"x":"([0-9.]+)"[\s\S]{0,120}?"y":"([0-9.]+)"/g;
  while ((m = normalized.exec(html)) && out.length < limit) {
    pushPlace(out, seen, m[1], Number(m[3]), Number(m[2]), '', '');
  }

  return out.slice(0, limit);
}

async function searchPlaces(query, limit) {
  const html = await fetchNaverHtml(query);
  return parsePlaces(html, limit || 12);
}

async function searchNearbyKind(lat, lng, kind, radiusKm, limit) {
  const q = KIND_QUERY[kind] || '카페';
  const html = await fetchNaverHtml(q, lat, lng);
  const items = parsePlaces(html, Math.max((limit || 12) * 3, 24));
  const within = [];
  const outside = [];
  items.forEach(function (item) {
    const distanceKm = haversineKm(lat, lng, item.lat, item.lng);
    const row = Object.assign({}, item, {
      distanceKm: Math.round(distanceKm * 100) / 100,
      kind: kind,
      source: 'naver',
    });
    if (distanceKm <= radiusKm) within.push(row);
    else outside.push(row);
  });
  within.sort(function (a, b) { return a.distanceKm - b.distanceKm; });
  if (within.length >= limit) return within.slice(0, limit);
  outside.sort(function (a, b) { return a.distanceKm - b.distanceKm; });
  outside.forEach(function (row) {
    if (within.length >= limit) return;
    if (row.distanceKm <= radiusKm + 3) within.push(row);
  });
  return within.slice(0, limit);
}

async function searchNearbyAll(lat, lng, radiusKm, limit) {
  const [cafe, food, shop] = await Promise.all([
    searchNearbyKind(lat, lng, 'cafe', radiusKm, limit),
    searchNearbyKind(lat, lng, 'food', radiusKm, limit),
    searchNearbyKind(lat, lng, 'shop', radiusKm, limit),
  ]);
  return { cafe: cafe, food: food, shop: shop, source: 'naver' };
}

module.exports = {
  searchPlaces,
  searchNearbyKind,
  searchNearbyAll,
  fetchNaverHtml,
  parsePlaces,
};
