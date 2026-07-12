const { setCors, sendJson } = require('./_http');
const { fetchPlacePhoto, fetchImageBytes, scoreImageUrl } = require('./_photos');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const name = String((req.query && req.query.name) || '').trim();
  const address = String((req.query && req.query.address) || '').trim();
  const src = String((req.query && req.query.src) || '').trim();

  try {
    const remote = scoreImageUrl(src) ? src : await fetchPlacePhoto(name, address);
    if (!remote) {
      return sendJson(res, 404, { error: true, message: '이미지를 찾지 못했습니다.' });
    }
    const img = await fetchImageBytes(remote);
    if (!img) {
      return sendJson(res, 404, { error: true, message: '이미지를 찾지 못했습니다.' });
    }
    setCors(res);
    res.statusCode = 200;
    res.setHeader('Content-Type', img.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(img.data);
  } catch (err) {
    return sendJson(res, 502, { error: true, message: '이미지를 찾지 못했습니다.' });
  }
};
