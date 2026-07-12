const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const SKIP_NAMES = {
  거리1km: 1, 거리2km: 1, 거리3km: 1, 거리4km: 1, 거리5km: 1, 거리10km: 1,
  정렬: 1, 관련도순: 1, 리뷰많은순: 1, 신규장소: 1, 펼치기: 1, 접기: 1,
};

const KIND_QUERY = { cafe: '카페', food: '식당', shop: '마트' };

const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;
const NAVER_TIMEOUT_MS = 2800;
const OSM_TIMEOUT_MS = 3200;

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

function cacheGet(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.t < CACHE_TTL) return cached.v;
  return null;
}

function cacheSet(key, value) {
  cache.set(key, { t: Date.now(), v: value });
  if (cache.size > 200) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
}

async function fetchNaverHtml(query, lat, lng) {
  const q = String(query || '').trim();
  if (!q) return '';
  const cacheKey = 'html|' + q + '|' + (lat || '') + ',' + (lng || '');
  const hit = cacheGet(cacheKey);
  if (hit != null) return hit;

  const enc = encodeURIComponent(q);
  let url = 'https://pcmap.place.naver.com/place/list?query=' + enc + '&display=12&page=1';
  if (lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
    url +=
      '&x=' + encodeURIComponent(lng) +
      '&y=' + encodeURIComponent(lat) +
      '&clientX=' + encodeURIComponent(lng) +
      '&clientY=' + encodeURIComponent(lat);
  }

  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, NAVER_TIMEOUT_MS);
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
    cacheSet(cacheKey, html);
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

  const imageBlock = /"name":"([^"\\]{2,80})"[\s\S]{0,4000}?"imageUrl":"((?:[^"\\]|\\.)*)"[\s\S]{0,1600}?"x":"([0-9.]+)"[\s\S]{0,240}?"y":"([0-9.]+)"/g;
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

  if (out.length >= limit) return out.slice(0, limit);

  const block = /"name":"([^"\\]{2,80})"[\s\S]{0,700}?"x":"([0-9.]+)"[\s\S]{0,100}?"y":"([0-9.]+)"/g;
  while ((m = block.exec(html)) && out.length < limit) {
    const addrM = m[0].match(/"fullAddress":"((?:[^"\\]|\\.)*)"/);
    pushPlace(out, seen, m[1], Number(m[3]), Number(m[2]), addrM ? decodeNaverUrl(addrM[1]) : '', '');
  }

  return out.slice(0, limit);
}

async function searchPlaces(query, limit) {
  const cacheKey = 'places|' + String(query || '').trim() + '|' + (limit || 8);
  const hit = cacheGet(cacheKey);
  if (hit) return hit;
  const html = await fetchNaverHtml(query);
  const items = parsePlaces(html, limit || 8);
  cacheSet(cacheKey, items);
  return items;
}

function filterByDistance(items, lat, lng, radiusKm, limit, kind) {
  const within = [];
  const outside = [];
  items.forEach(function (item) {
    const distanceKm = haversineKm(lat, lng, item.lat, item.lng);
    const row = Object.assign({}, item, {
      distanceKm: Math.round(distanceKm * 100) / 100,
      kind: kind,
      source: item.source || 'naver',
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

async function fetchOverpassNearby(lat, lng, radiusKm) {
  const radiusM = Math.round(Math.min(Math.max(radiusKm, 1), 4) * 1000);
  const query =
    '[out:json][timeout:3];(' +
    'node["amenity"="cafe"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'node["amenity"="restaurant"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'node["amenity"="fast_food"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    'node["shop"~"supermarket|convenience|mall|department_store"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
    ');out body 40;';

  const endpoints = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter',
  ];

  for (let i = 0; i < endpoints.length; i++) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, OSM_TIMEOUT_MS);
    try {
      const res = await fetch(endpoints[i], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Oasi5/1.0',
        },
        body: 'data=' + encodeURIComponent(query),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
    }
  }
  return null;
}

function classifyOsmElement(tags) {
  const amenity = tags.amenity || '';
  const shop = tags.shop || '';
  if (amenity === 'cafe') return 'cafe';
  if (amenity === 'restaurant' || amenity === 'fast_food' || amenity === 'food_court') return 'food';
  if (/supermarket|convenience|mall|department_store/.test(shop)) return 'shop';
  return null;
}

async function searchNearbyAllOsm(lat, lng, radiusKm, limit) {
  const cacheKey = 'osm|' + lat.toFixed(4) + ',' + lng.toFixed(4) + '|' + radiusKm + '|' + limit;
  const hit = cacheGet(cacheKey);
  if (hit) return hit;

  const data = await fetchOverpassNearby(lat, lng, radiusKm);
  const buckets = { cafe: [], food: [], shop: [] };
  const seen = {};
  if (!data || !data.elements) {
    return { cafe: [], food: [], shop: [], source: 'empty' };
  }

  data.elements.forEach(function (el) {
    if (el.lat == null || el.lon == null) return;
    const tags = el.tags || {};
    const kind = classifyOsmElement(tags);
    if (!kind || !buckets[kind]) return;
    const name = tags.name || tags['name:ko'];
    if (!name) return;
    const key = name + '|' + el.lat.toFixed(4) + ',' + el.lon.toFixed(4);
    if (seen[key]) return;
    seen[key] = true;
    const distanceKm = haversineKm(lat, lng, el.lat, el.lon);
    buckets[kind].push({
      name: name,
      address: '',
      lat: el.lat,
      lng: el.lon,
      kind: kind,
      source: 'osm',
      image: '',
      distanceKm: Math.round(distanceKm * 100) / 100,
    });
  });

  ['cafe', 'food', 'shop'].forEach(function (kind) {
    buckets[kind].sort(function (a, b) { return a.distanceKm - b.distanceKm; });
    buckets[kind] = buckets[kind].slice(0, limit);
  });

  const out = {
    cafe: buckets.cafe,
    food: buckets.food,
    shop: buckets.shop,
    source: 'osm',
  };
  cacheSet(cacheKey, out);
  return out;
}

async function searchNearbyKind(lat, lng, kind, radiusKm, limit) {
  const q = KIND_QUERY[kind] || '카페';
  const html = await fetchNaverHtml(q, lat, lng);
  const items = parsePlaces(html, Math.max((limit || 6) * 2, 12));
  return filterByDistance(items, lat, lng, radiusKm, limit || 6, kind);
}

function hasNearbyItems(data) {
  return !!(data && ((data.cafe && data.cafe.length) || (data.food && data.food.length) || (data.shop && data.shop.length)));
}

async function searchNearbyAllNaver(lat, lng, radiusKm, limit) {
  const [cafe, food, shop] = await Promise.all([
    searchNearbyKind(lat, lng, 'cafe', radiusKm, limit),
    searchNearbyKind(lat, lng, 'food', radiusKm, limit),
    searchNearbyKind(lat, lng, 'shop', radiusKm, limit),
  ]);
  return { cafe: cafe, food: food, shop: shop, source: 'naver' };
}

async function searchNearbyAll(lat, lng, radiusKm, limit) {
  const cacheKey = 'nearby|' + lat.toFixed(4) + ',' + lng.toFixed(4) + '|' + radiusKm + '|' + limit;
  const hit = cacheGet(cacheKey);
  if (hit) return hit;

  const naverP = searchNearbyAllNaver(lat, lng, radiusKm, limit);
  const osmP = searchNearbyAllOsm(lat, lng, radiusKm, limit);

  const first = await Promise.race([
    naverP.then(function (r) { return { r: r, src: 'naver' }; }),
    osmP.then(function (r) { return { r: r, src: 'osm' }; }),
  ]);

  let result = first.r;
  if (!hasNearbyItems(result)) {
    result = first.src === 'naver' ? await osmP : await naverP;
  } else if (first.src === 'osm') {
    // Prefer Naver if it finishes soon with richer data; don't wait full timeout.
    try {
      const richer = await Promise.race([
        naverP,
        new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 900); }),
      ]);
      if (richer && hasNearbyItems(richer)) result = richer;
    } catch (err) {}
  }

  if (!hasNearbyItems(result)) {
    result = { cafe: [], food: [], shop: [], source: 'empty' };
  }
  cacheSet(cacheKey, result);
  return result;
}

module.exports = {
  searchPlaces,
  searchNearbyKind,
  searchNearbyAll,
  searchNearbyAllOsm,
  fetchNaverHtml,
  parsePlaces,
};
