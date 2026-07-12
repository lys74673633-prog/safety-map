const { sendJson, setCors } = require('./_http');
const { fetchPlacePhoto, scoreImageUrl } = require('./_photos');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const name = String((req.query && (req.query.name || req.query.q)) || '').trim();
  const address = String((req.query && req.query.address) || '').trim();
  const src = String((req.query && req.query.src) || '').trim();
  if (!name && !src) {
    return sendJson(res, 400, { error: true, message: 'name 파라미터가 필요합니다.' });
  }

  try {
    const remote = scoreImageUrl(src) ? src : await fetchPlacePhoto(name, address);
    if (!remote) {
      return sendJson(res, 404, { error: true, name: name, url: '' });
    }
    const params = new URLSearchParams({ name: name, src: remote });
    if (address) params.set('address', address);
    return sendJson(res, 200, {
      name: name,
      url: '/api/place-photo/img?' + params.toString(),
      remote: remote,
    });
  } catch (err) {
    return sendJson(res, 502, { error: true, name: name, url: '' });
  }
};
