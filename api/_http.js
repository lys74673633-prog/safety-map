function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', status >= 400 ? 'no-store' : 'public, max-age=180, s-maxage=300, stale-while-revalidate=600');
  res.end(JSON.stringify(payload));
}

async function fetchJson(url, headers) {
  const res = await fetch(url, {
    headers: Object.assign({ 'User-Agent': 'Oasi5/1.0' }, headers || {}),
  });
  if (!res.ok) throw new Error('fetch failed ' + res.status);
  return res.json();
}

module.exports = { setCors, sendJson, fetchJson };
