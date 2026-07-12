const { sendJson, setCors, fetchJson } = require('./_http');
const fs = require('fs');
const path = require('path');

const OSRM = 'https://router.project-osrm.org/route/v1';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function getOdsayKey() {
  const env = String(process.env.ODSAY_API_KEY || '').trim();
  if (env) return env;
  try {
    const localPath = path.join(__dirname, '..', 'odsay-config.local.json');
    if (fs.existsSync(localPath)) {
      const raw = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      const key = String((raw && raw.apiKey) || '').trim();
      if (key && !/발급|example|입력/i.test(key)) return key;
    }
  } catch (err) {}
  return '';
}

async function searchOsrm(mode, sx, sy, ex, ey, fromName, toName) {
  const profileMap = { walk: 'foot', car: 'driving', bicycle: 'bike' };
  const profile = profileMap[mode] || 'foot';
  const url =
    OSRM + '/' + profile + '/' + sx + ',' + sy + ';' + ex + ',' + ey +
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
    routes: [{
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
      steps: [{
        type: mode,
        duration: totalMin,
        distance: Math.round(route.distance || 0),
        from: fromName,
        to: toName,
        line: null,
        notes: [],
      }],
      polyline: polyline,
    }],
  };
}

function pushPoint(polyline, lng, lat) {
  if (!lng || !lat) return;
  const pt = [lat, lng];
  if (!polyline.length || polyline[polyline.length - 1][0] !== pt[0] || polyline[polyline.length - 1][1] !== pt[1]) {
    polyline.push(pt);
  }
}

  function parseNaverStep(step, fromName, toName) {
  const stype = step.type;
  const duration = Math.max(0, Math.round((step.duration || 0) / 60000));
  const distance = Math.max(0, Number(step.distance) || 0);

  if (stype === 'WALKING') {
    const goal = (((step.walkPath || {}).summary || {}).goal) || {};
    return {
      type: 'walk',
      duration: duration,
      distance: distance,
      from: fromName,
      to: goal.name || toName,
      line: null,
      notes: [],
    };
  }
  if (stype === 'SUBWAY' || stype === 'BUS') {
    const routes = step.routes || [];
    let line = (routes[0] && (routes[0].name || routes[0].longName || routes[0].shortName)) || '';
    if (stype === 'BUS') {
      if (!line) line = '버스';
      else if (!/버스/.test(line) && /^[\dA-Za-z]/.test(line)) line = '버스 ' + line;
    } else if (!line) {
      line = '지하철';
    }
    line = String(line)
      .replace(/\bBus\b/gi, '버스')
      .replace(/\bSubway\b/gi, '지하철')
      .replace(/\bLine\s*(\d+)\b/gi, '$1호선');
    const stops = step.stops || [];
    const fromSt = stops[0] ? (stops[0].displayName || stops[0].name) : '';
    const toSt = stops.length ? (stops[stops.length - 1].displayName || stops[stops.length - 1].name) : '';
    return {
      type: stype === 'SUBWAY' ? 'subway' : 'bus',
      duration: duration,
      distance: distance,
      from: fromSt,
      to: toSt,
      line: line,
      stationCount: Math.max(0, stops.length - 1),
      notes: stype === 'BUS' ? ['버스는 저상버스·리프트 장착 여부가 노선·차량마다 다릅니다.'] : [],
    };
  }
  return null;
}

function parseNaverPath(path, fromName, toName, idx) {
  const totalMin = Math.max(1, Math.round((path.duration || 0) / 60000));
  const walkMin = Math.max(0, Math.round((path.walkingDuration || 0) / 60000));
  const steps = [];
  const polyline = [];
  let busCount = 0;
  let subwayCount = 0;
  let firstStop = '';
  let lastStop = '';

  (path.legs || []).forEach(function (leg) {
    (leg.steps || []).forEach(function (step) {
      const parsed = parseNaverStep(step, fromName, toName);
      if (!parsed) return;
      if (parsed.type === 'bus') busCount += 1;
      if (parsed.type === 'subway') subwayCount += 1;
      if (!firstStop && parsed.from) firstStop = parsed.from;
      if (parsed.to) lastStop = parsed.to;
      steps.push(parsed);

      const walkPath = ((step.walkPath || {}).path) || [];
      walkPath.forEach(function (pt) {
        if (Array.isArray(pt) && pt.length >= 2) pushPoint(polyline, pt[0], pt[1]);
      });
      (step.points || []).forEach(function (pt) {
        if (pt && typeof pt === 'object') pushPoint(polyline, pt.x, pt.y);
      });
    });
  });

  const labels = path.pathLabels || [];
  let label = labels[0] && labels[0].labelText ? labels[0].labelText : '대중교통';
  label = String(label)
    .replace(/\bBus\b/gi, '버스')
    .replace(/\bSubway\b/gi, '지하철')
    .replace(/\bWalk(?:ing)?\b/gi, '도보')
    .replace(/\bTransit\b/gi, '대중교통');
  if (!/[가-힣]/.test(label)) label = '대중교통';
  let payment = null;
  const fareGroups = path.fareGroups || [];
  if (fareGroups[0] && fareGroups[0].fareOptions && fareGroups[0].fareOptions[0]) {
    payment = fareGroups[0].fareOptions[0].fare;
  }

  return {
    id: idx,
    summary: {
      totalMinutes: totalMin,
      payment: payment,
      transfers: Math.max(0, busCount + subwayCount - 1),
      walkMeters: walkMin * 80,
      walkMinutes: walkMin,
      busCount: busCount,
      subwayCount: subwayCount,
      label: label,
      firstStop: firstStop || fromName,
      lastStop: lastStop || toName,
    },
    steps: steps,
    polyline: polyline,
  };
}

async function searchTransitNaver(sx, sy, ex, ey, fromName, toName) {
  const q = new URLSearchParams({ start: sx + ',' + sy, goal: ex + ',' + ey });
  const url = 'https://map.naver.com/p/api/directions/transit?' + q.toString();
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Referer: 'https://map.naver.com/',
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    return { error: true, code: 'NAVER_TRANSIT_ERROR', message: '대중교통 경로를 불러오지 못했습니다.' };
  }
  const data = await res.json();
  const paths = data.paths || [];
  const routes = [];
  paths.slice(0, 4).forEach(function (path, i) {
    const parsed = parseNaverPath(path, fromName, toName, i);
    if (parsed.steps && parsed.steps.length) routes.push(parsed);
  });
  if (!routes.length) {
    return { error: true, code: 'NO_ROUTE', message: '대중교통 경로를 찾지 못했습니다. 출발·도착지를 다시 확인해 주세요.' };
  }
  return { mode: 'transit', routes: routes, source: 'naver' };
}

async function searchOdsay(sx, sy, ex, ey, fromName, toName, profile) {
  const key = getOdsayKey();
  if (!key) return null;

  let opt = 0;
  if (profile === 'elderly' || profile === 'visual' || profile === 'walker') opt = 5;
  else if (profile === 'wheelchair' || profile === 'stroller') opt = 4;

  const qs = new URLSearchParams({
    apiKey: key,
    SX: String(sx),
    SY: String(sy),
    EX: String(ex),
    EY: String(ey),
    OPT: String(opt),
    SearchPathType: '0',
    lang: '0',
  });
  const data = await fetchJson('https://api.odsay.com/v1/api/searchPubTransPathT?' + qs.toString());
  if (data.error) {
    return { error: true, code: 'ODSAY_ERROR', message: 'ODsay 경로 조회에 실패했습니다.' };
  }
  const paths = ((data.result || {}).path) || [];
  if (!paths.length) return { error: true, code: 'NO_ROUTE', message: '대중교통 경로를 찾지 못했습니다.' };

  const routes = paths.slice(0, 5).map(function (pathItem, idx) {
    const info = pathItem.info || {};
    const walkM = Math.max(0, Number(info.totalWalk) || 0);
    const walkMin = Math.max(0, Number(info.totalWalkTime) || Math.round(walkM / 80));
    const polyline = [[sy, sx]];
    const steps = (pathItem.subPath || []).map(function (sub) {
      const t = Number(sub.trafficType);
      const type = t === 1 ? 'subway' : t === 2 ? 'bus' : 'walk';
      const startX = Number(sub.startX);
      const startY = Number(sub.startY);
      const endX = Number(sub.endX);
      const endY = Number(sub.endY);
      if (Number.isFinite(startX) && Number.isFinite(startY)) pushPoint(polyline, startX, startY);
      const stops = (((sub.passStopList || {}).stations) || []);
      stops.forEach(function (st) {
        const x = Number(st.x);
        const y = Number(st.y);
        if (Number.isFinite(x) && Number.isFinite(y)) pushPoint(polyline, x, y);
      });
      if (Number.isFinite(endX) && Number.isFinite(endY)) pushPoint(polyline, endX, endY);

      let line = null;
      if (sub.lane && sub.lane[0]) {
        const lane = sub.lane[0];
        if (type === 'bus') {
          const busNo = lane.busNoKor || lane.busNo || '';
          const busName = lane.nameKor || lane.name || '';
          if (busNo && /[가-힣]/.test(String(busName))) line = String(busName);
          else if (busNo) line = '버스 ' + String(busNo);
          else if (busName) line = String(busName);
          else line = '버스';
        } else if (type === 'subway') {
          line = lane.nameKor || lane.name || lane.subwayCode || '지하철';
        } else {
          line = lane.nameKor || lane.name || null;
        }
      }
      if (!line) {
        if (type === 'bus') line = '버스';
        else if (type === 'subway') line = '지하철';
      }

      return {
        type: type,
        duration: Math.max(0, Number(sub.sectionTime) || 0),
        distance: Math.max(0, Number(sub.distance) || 0),
        from: sub.startNameKor || sub.startName || fromName,
        to: sub.endNameKor || sub.endName || toName,
        line: line,
        stationCount: Math.max(0, Number(sub.stationCount) || 0),
        notes: [],
      };
    });
    pushPoint(polyline, ex, ey);

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
      steps: steps,
      polyline: polyline,
    };
  });
  return { mode: 'transit', source: 'odsay', routes: routes };
}

function buildExternalLinks(sx, sy, ex, ey, fromName, toName) {
  const fromLabel = String(fromName || '출발').replace(/[\/,]/g, ' ').trim() || '출발';
  const toLabel = String(toName || '도착').replace(/[\/,]/g, ' ').trim() || '도착';
  const fromEnc = encodeURIComponent(fromLabel);
  const toEnc = encodeURIComponent(toLabel);
  return {
    naver:
      'https://map.naver.com/p/directions/' +
      sy + ',' + sx + ',' + fromEnc + '/' +
      ey + ',' + ex + ',' + toEnc + '/-/transit',
    // Official Kakao Map link (WGS84). mode: traffic = 대중교통
    kakao:
      'https://map.kakao.com/link/by/traffic/' +
      fromLabel + ',' + sy + ',' + sx + '/' +
      toLabel + ',' + ey + ',' + ex,
    kakaoScheme:
      'https://map.kakao.com/scheme/route?sp=' + sy + ',' + sx +
      '&ep=' + ey + ',' + ex + '&by=publictransit',
    kakaoApp:
      'kakaomap://route?sp=' + sy + ',' + sx + '&ep=' + ey + ',' + ex + '&by=publictransit',
    google:
      'https://www.google.com/maps/dir/?api=1&origin=' + sy + ',' + sx +
      '&destination=' + ey + ',' + ex + '&travelmode=transit',
  };
}

async function transitExternalFallback(sx, sy, ex, ey, fromName, toName) {
  const links = buildExternalLinks(sx, sy, ex, ey, fromName, toName);
  let walk = null;
  try {
    walk = await searchOsrm('walk', sx, sy, ex, ey, fromName, toName);
  } catch (err) {
    walk = null;
  }

  const routes = [];
  routes.push({
    id: 0,
    summary: {
      totalMinutes: null,
      payment: null,
      transfers: null,
      walkMeters: 0,
      walkMinutes: 0,
      busCount: 0,
      subwayCount: 0,
      label: '대중교통 안내',
      firstStop: fromName,
      lastStop: toName,
    },
    steps: [
      {
        type: 'walk',
        duration: 0,
        distance: 0,
        from: fromName,
        to: toName,
        line: null,
        instruction: '버스·지하철 환승 경로를 확인해 주세요.',
        notes: ['상세 노선은 경로 안내에서 확인할 수 있습니다.'],
      },
    ],
    polyline: [[sy, sx], [ey, ex]],
    externalLinks: links,
  });

  if (walk && !walk.error && walk.routes && walk.routes[0]) {
    const wr = walk.routes[0];
    routes.push(Object.assign({}, wr, {
      id: 1,
      summary: Object.assign({}, wr.summary, { label: '도보로 이동' }),
    }));
  }

  return {
    mode: 'transit',
    source: 'external-fallback',
    routes: routes,
    links: links,
    message: 'Oasi5에서 안내할 수 있는 대중교통 상세 노선을 찾지 못했습니다. 출발·도착을 바꿔 보거나 도보 경로를 확인해 주세요.',
  };
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
  const profile = String(req.query.profile || 'wheelchair');
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
      result = await searchOdsay(sx, sy, ex, ey, fromName, toName, profile);
      if (!result || result.error) {
        try {
          result = await searchTransitNaver(sx, sy, ex, ey, fromName, toName);
        } catch (err) {
          result = { error: true };
        }
      }
      if (!result || result.error) {
        result = await transitExternalFallback(sx, sy, ex, ey, fromName, toName);
      }
    } else if (mode === 'walk' || mode === 'car' || mode === 'bicycle') {
      result = await searchOsrm(mode, sx, sy, ex, ey, fromName, toName);
    } else {
      result = { error: true, code: 'BAD_MODE', message: '지원하지 않는 이동 수단입니다.' };
    }

    if (result.error) {
      return sendJson(res, result.code === 'ODSAY_KEY_REQUIRED' ? 503 : 400, result);
    }
    return sendJson(res, 200, result);
  } catch (err) {
    try {
      if (mode === 'transit') {
        const fallback = await transitExternalFallback(sx, sy, ex, ey, fromName, toName);
        return sendJson(res, 200, fallback);
      }
    } catch (ignore) {}
    return sendJson(res, 502, { error: true, message: '경로를 불러오지 못했습니다.' });
  }
};
