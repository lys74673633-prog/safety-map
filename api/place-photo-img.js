const { sendJson, setCors } = require('./_http');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }
  return sendJson(res, 404, { error: true, message: '이미지를 찾지 못했습니다.' });
};
