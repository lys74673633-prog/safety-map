const { sendJson, setCors, fetchJson } = require('./_http');

const OSRM = 'https://router.project-osrm.org/route/v1';

async function searchOsrm(mode, sx, sy, ex, ey, fromName, toName) {
  const profileMap = { walk: 'foot', car: 'driving', bicycle: 'bike' };
  const profile = profileMap[mode] || 'foot';
  const url =
    OSRM +
    '/' +
    profile +
    '/' +
    sx +
    ',' +
    sy +
    ';' +
    ex +
    ',' +
    ey +
    '?overview=full&geometries=geojson&steps=true';
  const data = await fetchJson(url);
  if (data.code !== 'Ok' || !data.routes || !data.routes.length) {
    return { error: true, code: 'NO_ROUTE', message: '경로를 찾지 못했습니다.' };
  }
  const route = data.routes[0];
  const labels = { walk: '도보', car: '자동차', bicycle: '자전거' };
  const totalMin = Math.max(1, Math.round((route.duration || 0) / 60));
  const polyline = (route.geometry.coordinates || []).map(function (pt) {
    return [pt[1], pt[0]];
  });
  return {
    mode: mode,
    source: 'osrm',
    routes: [
      {
        id: 0,
        summary: {
          totalMinutes: totalMin,
          payment: null,
          transfers: 0,
          walkMeters: mode === 'walk' ? Math.round(route.distance || 0) : 0,
          walkMinutes: mode === 'walk' ? totalMin : 0,
          busCount: 0,
          subwayCount: 0,
          label: labels[mode] || mode,
          firstStop: fromName,
          lastStop: toName,
        },
        steps: [
          {
            type: mode,
            duration: totalMin,
            distance: Math.round(route.distance || 0),
            from: fromName,
            to: toName,
            line: null,
            notes: [],
          },
        ],
        polyline: polyline,
      },
    ],
  };
}

async function searchOdsay(sx, sy, ex, ey, fromName, toName) {
  const key = process.env.ODSAY_API_KEY;
  if (!key) {
    return {
      error: true,
      code: 'ODSAY_KEY_REQUIRED',
      message: '대중교통 경로는 ODsay API 키가 필요합니다. 도보·자동차·자전거는 바로 이용할 수 있습니다.',
    };
  }
  const qs = new URLSearchParams({
    apiKey: key,
    SX: String(sx),
    SY: String(sy),
    EX: String(ex),
    EY: String(ey),
    lang: '0',
  });
  const data = await fetchJson('https://api.odsay.com/v1/api/searchPubTransPathT?' + qs.toString());
  if (!data || !data.result || !data.result.path || !data.result.path.length) {
    return { error: true, code: 'NO_ROUTE', message: '대중교통 경로를 찾지 못했습니다.' };
  }

  const routes = data.result.path.slice(0, 5).map(function (path, idx) {
    const info = path.info || {};
    const walkM = Math.max(0, Number(info.totalWalk) || 0);
    const walkMin = Math.max(0, Number(info.totalWalkTime) || Math.round(walkM / 80));
    return {
      id: idx,
      summary: {
        totalMinutes: Math.max(1, Number(info.totalTime) || 1),
        payment: info.payment != null ? Number(info.payment) : null,
        transfers: Math.max(0, Number(info.busTransitCount || 0) + Number(info.subwayTransitCount || 0)),
        walkMeters: walkM,
        walkMinutes: walkMin,
        busCount: Number(info.busTransitCount) || 0,
        subwayCount: Number(info.subwayTransitCount) || 0,
        label: '대중교통',
        firstStop: fromName,
        lastStop: toName,
      },
      steps: (path.subPath || [])
        .map(function (sub) {
          const t = Number(sub.trafficType);
          const type = t === 1 ? 'subway' : t === 2 ? 'bus' : 'walk';
          return {
            type: type,
            duration: Math.max(0, Number(sub.sectionTime) || 0),
            distance: Math.max(0, Number(sub.distance) || 0),
            from: sub.startName || fromName,
            to: sub.endName || toName,
            line: (sub.lane && sub.lane[0] && (sub.lane[0].name || sub.lane[0].busNo)) || null,
            notes: [],
          };
        })
        .filter(Boolean),
      polyline: [],
    };
  });

  return { mode: 'transit', source: 'odsay', routes: routes };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    return res.end();
  }

  const sx = Number(req.query.fromLng);
  const sy = Number(req.query.fromLat);
  const ex = Number(req.query.toLng);
  const ey = Number(req.query.toLat);
  const mode = String(req.query.mode || 'transit');
  const fromName = String(req.query.fromName || '출발');
  const toName = String(req.query.toName || '도착');

  if (![sx, sy, ex, ey].every(Number.isFinite)) {
    return sendJson(res, 400, { error: true, code: 'BAD_COORDS', message: '좌표 형식이 올바르지 않습니다.' });
  }
  if (!(sx >= 124 && sx <= 132 && sy >= 33 && sy <= 39 && ex >= 124 && ex <= 132 && ey >= 33 && ey <= 39)) {
    return sendJson(res, 400, {
      error: true,
      code: 'BAD_COORDS',
      message: '한국 내 출발·도착 좌표를 선택해 주세요.',
    });
  }

  try {
    let result;
    if (mode === 'transit') {
      result = await searchOdsay(sx, sy, ex, ey, fromName, toName);
    } else if (mode === 'walk' || mode === 'car' || mode === 'bicycle') {
      result = await searchOsrm(mode, sx, sy, ex, ey, fromName, toName);
    } else {
      result = { error: true, code: 'BAD_MODE', message: '지원하지 않는 이동 수단입니다.' };
    }

    if (result.error) {
      const status = result.code === 'ODSAY_KEY_REQUIRED' ? 503 : 400;
      return sendJson(res, status, result);
    }
    return sendJson(res, 200, result);
  } catch (err) {
    return sendJson(res, 502, { error: true, message: '경로를 불러오지 못했습니다.' });
  }
};
