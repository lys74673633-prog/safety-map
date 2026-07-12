const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const photoCache = new Map();
const imageCache = new Map();

function scoreImageUrl(url) {
  const u = String(url || '').toLowerCase();
  if (!u.startsWith('https://')) return 0;
  if (/favicon|banner|profile|sprite|1x1|blank|logo\.png|\/logo\//.test(u)) return 0;
  if (u.includes('ldb-phinf.pstatic.net')) return 100;
  if (u.includes('search.pstatic.net/common')) return 80;
  if (u.includes('pstatic.net')) return 60;
  if (u.includes('encrypted-tbn') || u.includes('gstatic.com/images')) return 55;
  if (u.includes('googleusercontent.com')) return 50;
  if (/\.(jpe?g|png|webp)(\?|$)/.test(u)) return 40;
  return 0;
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

function pickBestImage(urls) {
  let best = '';
  let bestScore = 0;
  (urls || []).forEach(function (raw) {
    const url = decodeNaverUrl(raw);
    const score = scoreImageUrl(url);
    if (score > bestScore) {
      bestScore = score;
      best = url;
    }
  });
  return best;
}

function collectImageUrls(html) {
  const urls = [];
  const patterns = [
    /"imageUrl":"((?:[^"\\]|\\.)*)"/g,
    /https:\/\/ldb-phinf\.pstatic\.net\/[^"'\\\s<>]+/g,
    /https:\/\/search\.pstatic\.net\/common\/\?[^"'\\\s<>]+/g,
    /https:\/\/[^"'\\\s<>]*pstatic\.net\/[^"'\\\s<>]+/g,
  ];
  patterns.forEach(function (re) {
    let m;
    while ((m = re.exec(html || ''))) {
      urls.push(m[1] || m[0]);
    }
  });
  return urls;
}

async function fetchText(url, referer) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Referer: referer || 'https://search.naver.com/',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      Accept: 'text/html,application/json,*/*',
    },
  });
  if (!res.ok) throw new Error('fetch ' + res.status);
  return res.text();
}

async function fetchPlacePhoto(name, address) {
  const query = String(name || '').trim();
  if (!query) return '';
  const cacheKey = query + '|' + (address || '');
  const cached = photoCache.get(cacheKey);
  if (cached && Date.now() - cached.t < 86400000) return cached.url;

  let urls = [];
  const searchQ = address ? query + ' ' + address : query;
  const enc = encodeURIComponent(searchQ);

  // 1) Naver place list (often has shop photos)
  try {
    const placeHtml = await fetchText(
      'https://pcmap.place.naver.com/place/list?query=' + enc + '&display=40&page=1',
      'https://map.naver.com/'
    );
    urls = urls.concat(collectImageUrls(placeHtml));
  } catch (err) {}

  // 2) Naver image/web search fallback
  if (!urls.length) {
    for (const where of ['image', 'nexearch']) {
      try {
        const html = await fetchText(
          'https://search.naver.com/search.naver?where=' + where + '&query=' + enc,
          'https://search.naver.com/'
        );
        urls = urls.concat(collectImageUrls(html));
        if (urls.length) break;
      } catch (err) {}
    }
  }

  // 3) Google image-ish via web search og:image (best-effort)
  if (!urls.length) {
    try {
      const html = await fetchText(
        'https://www.google.com/search?tbm=isch&q=' + enc + '&hl=ko',
        'https://www.google.com/'
      );
      const m = html.match(/https:\/\/encrypted-tbn[^"'\s]+/g) || [];
      urls = urls.concat(m.slice(0, 8));
    } catch (err) {}
  }

  const url = pickBestImage(urls);
  photoCache.set(cacheKey, { t: Date.now(), url: url });
  return url;
}

async function fetchImageBytes(url) {
  if (!scoreImageUrl(url)) return null;
  const cached = imageCache.get(url);
  if (cached && Date.now() - cached.t < 86400000) return cached;

  const referer = url.includes('ldb-phinf') ? 'https://map.naver.com/' : 'https://search.naver.com/';
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Referer: referer,
      Accept: 'image/*,*/*',
    },
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 80) return null;
  let contentType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
  if (!contentType.startsWith('image/')) contentType = 'image/jpeg';
  const out = { t: Date.now(), data: buf, contentType: contentType };
  imageCache.set(url, out);
  return out;
}

module.exports = {
  fetchPlacePhoto,
  fetchImageBytes,
  scoreImageUrl,
};
