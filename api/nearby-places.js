const { sendJson, setCors } = require('./_http');
const allHandler = require('./nearby-places-all');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const kind = String(req.query.kind || 'cafe');
  const capture = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader: function (k, v) { this.headers[k] = v; },
    end: function (body) { this.body = body; },
  };

  await allHandler(req, capture);

  try {
    const data = JSON.parse(capture.body || '{}');
    return sendJson(res, 200, {
      lat: data.lat,
      lng: data.lng,
      kind: kind,
      radiusKm: data.radiusKm,
      items: (data && data[kind]) ? data[kind] : [],
      source: data.source || 'osm',
    });
  } catch (err) {
    return sendJson(res, 200, {
      lat: Number(req.query.lat) || 0,
      lng: Number(req.query.lng) || 0,
      kind: kind,
      radiusKm: 5,
      items: [],
    });
  }
};
