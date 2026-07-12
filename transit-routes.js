var TransitRoutes = (function () {
  var ROUTE_API = '/api/transit-route';

  // Public project-osrm.org only has a car graph — foot/bike URLs still return car times.
  // FOSSGIS hosts separate foot / bike / car routers.
  var MODE_OSRM = {
    walk: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving/',
    bicycle: 'https://routing.openstreetmap.de/routed-bike/route/v1/driving/',
    car: 'https://routing.openstreetmap.de/routed-car/route/v1/driving/'
  };
  // Rough urban speeds (m/min) used only if routing APIs fail.
  var MODE_SPEED_M_PER_MIN = { walk: 75, bicycle: 250, car: 500 };

  function modeLabelText(mode) {
    var labels = {
      walk: (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('transit.mode.walk') : '도보',
      car: (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('transit.mode.car') : '자동차',
      bicycle: (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('transit.mode.bicycle') : '자전거'
    };
    return labels[mode] || mode;
  }

  function haversineMeters(from, to) {
    var R = 6371000;
    var toRad = function (d) { return d * Math.PI / 180; };
    var dLat = toRad(to.lat - from.lat);
    var dLng = toRad(to.lng - from.lng);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat))
      * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function buildModeRoute(from, to, mode, durationSec, distanceM, polyline, source) {
    var totalMin = Math.max(1, Math.round((durationSec || 0) / 60));
    var dist = Math.round(distanceM || 0);
    return {
      mode: mode,
      source: source || 'osrm',
      routes: [{
        id: 0,
        summary: {
          totalMinutes: totalMin,
          payment: null,
          transfers: 0,
          walkMeters: mode === 'walk' ? dist : 0,
          walkMinutes: mode === 'walk' ? totalMin : 0,
          busCount: 0,
          subwayCount: 0,
          label: modeLabelText(mode),
          firstStop: from.name,
          lastStop: to.name
        },
        steps: [{
          type: mode,
          duration: totalMin,
          distance: dist,
          from: from.name,
          to: to.name,
          line: null,
          notes: []
        }],
        polyline: polyline || [[from.lat, from.lng], [to.lat, to.lng]]
      }]
    };
  }

  function estimateModeRoute(from, to, mode) {
    var straight = haversineMeters(from, to);
    // Road distance is typically longer than straight-line.
    var factor = mode === 'walk' ? 1.35 : mode === 'bicycle' ? 1.3 : 1.4;
    var dist = Math.max(50, straight * factor);
    var speed = MODE_SPEED_M_PER_MIN[mode] || MODE_SPEED_M_PER_MIN.walk;
    var durationSec = (dist / speed) * 60;
    return buildModeRoute(from, to, mode, durationSec, dist, null, 'estimate');
  }

  function fetchOsrmClient(from, to, mode) {
    var base = MODE_OSRM[mode] || MODE_OSRM.walk;
    var coords = from.lng + ',' + from.lat + ';' + to.lng + ',' + to.lat;
    var url = base + coords + '?overview=full&geometries=geojson&steps=true';

    return fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.code !== 'Ok' || !data.routes || !data.routes.length) {
          throw new Error('경로를 찾지 못했습니다.');
        }
        var route = data.routes[0];
        var polyline = ((route.geometry && route.geometry.coordinates) || []).map(function (pt) {
          return [pt[1], pt[0]];
        });
        return buildModeRoute(
          from,
          to,
          mode,
          route.duration || 0,
          route.distance || 0,
          polyline,
          'osrm-client'
        );
      })
      .catch(function () {
        return estimateModeRoute(from, to, mode);
      });
  }

  function fetchRoutes(from, to, mode, profileId) {
    if (!from || !to) return Promise.reject(new Error('missing points'));
    if (!from.lat || !from.lng || !to.lat || !to.lng) {
      return Promise.reject(new Error('좌표가 없는 장소입니다. 장소명을 다시 입력해 주세요.'));
    }

    // Walk / car / bicycle: go straight to public OSRM from the browser (instant, no Vercel).
    if (mode === 'walk' || mode === 'car' || mode === 'bicycle') {
      return fetchOsrmClient(from, to, mode);
    }

    var url = ROUTE_API
      + '?fromLat=' + encodeURIComponent(from.lat)
      + '&fromLng=' + encodeURIComponent(from.lng)
      + '&toLat=' + encodeURIComponent(to.lat)
      + '&toLng=' + encodeURIComponent(to.lng)
      + '&fromName=' + encodeURIComponent(from.name || '')
      + '&toName=' + encodeURIComponent(to.name || '')
      + '&mode=' + encodeURIComponent(mode || 'transit')
      + '&profile=' + encodeURIComponent(profileId || 'wheelchair');

    return fetch(url)
      .then(function (res) {
        var ct = (res.headers.get('content-type') || '');
        if (!res.ok || ct.indexOf('application/json') < 0) {
          throw new Error('경로를 불러오지 못했습니다.');
        }
        return res.json().then(function (data) {
          if (!res.ok) {
            var err = new Error((data && data.message) || '경로를 불러오지 못했습니다.');
            err.code = data && data.code;
            err.data = data;
            throw err;
          }
          return data;
        });
      });
  }

  function getProfile(id) {
    if (typeof TransitGuide !== 'undefined' && TransitGuide.PROFILES) {
      return TransitGuide.PROFILES.find(function (p) { return p.id === id; }) || TransitGuide.PROFILES[0];
    }
    return { id: id || 'wheelchair', prefs: { minWalk: true, minTransfer: true } };
  }

  function scoreRoute(route, profile) {
    var s = 100;
    var info = route.summary || {};
    var prefs = profile.prefs || {};

    if (prefs.minWalk) {
      s -= (info.walkMinutes || 0) * 1.4;
      s -= Math.max(0, (info.walkMeters || 0) - 400) / 80;
    }
    if (prefs.minTransfer) s -= (info.transfers || 0) * 14;
    if (prefs.lowFloorBus && (info.busCount || 0) > 0) s -= (info.busCount || 0) * 6;
    if (prefs.preferElevator && (info.subwayCount || 0) > 0) s += Math.min(12, (info.subwayCount || 0) * 4);
    if (prefs.avoidStairs && (info.walkMeters || 0) > 600) s -= 8;
    if (prefs.gentleSlope && (info.walkMinutes || 0) > 15) s -= 6;
    if (prefs.seating && (info.totalMinutes || 0) > 50) s -= 4;

    return Math.max(0, Math.min(100, Math.round(s)));
  }

  function rankRoutes(routes, profileId) {
    var profile = getProfile(profileId);
    return routes
      .map(function (route) {
        return Object.assign({}, route, {
          comfortScore: scoreRoute(route, profile),
          profileLabel: profile.label || ''
        });
      })
      .sort(function (a, b) {
        if (b.comfortScore !== a.comfortScore) return b.comfortScore - a.comfortScore;
        return (a.summary.totalMinutes || 999) - (b.summary.totalMinutes || 999);
      });
  }

  function formatDuration(minutes) {
    function t(key, vars, fb) {
      if (typeof I18n !== 'undefined' && I18n.t) return I18n.t(key, vars);
      return fb;
    }
    if (minutes == null || minutes === '' || isNaN(Number(minutes))) return t('transit.checking', {}, '경로 확인');
    var m = Math.max(0, Math.round(minutes || 0));
    if (m < 60) return t('transit.min', { n: m }, m + '분');
    var h = Math.floor(m / 60);
    var rest = m % 60;
    return rest
      ? t('transit.hourMin', { h: h, m: rest }, h + '시간 ' + rest + '분')
      : t('transit.hour', { n: h }, h + '시간');
  }

  function formatDistance(meters) {
    function t(key, vars, fb) {
      if (typeof I18n !== 'undefined' && I18n.t) return I18n.t(key, vars);
      return fb;
    }
    var m = Math.max(0, Math.round(meters || 0));
    if (m < 1000) return t('transit.meters', { n: m }, m + '미터');
    return t('transit.kilometers', { n: (m / 1000).toFixed(1) }, (m / 1000).toFixed(1) + '킬로미터');
  }

  function formatPayment(won) {
    if (won == null || won < 0) return '';
    var n = Number(won).toLocaleString(typeof I18n !== 'undefined' && I18n.getLang && I18n.getLang() === 'en' ? 'en-US' : 'ko-KR');
    if (typeof I18n !== 'undefined' && I18n.t) return I18n.t('transit.won', { n: n });
    return n + '원';
  }

  function isEn() {
    return typeof I18n !== 'undefined' && I18n.getLang && I18n.getLang() === 'en';
  }

  function localizeTransitText(text) {
    var s = String(text || '').trim();
    if (!s) return s;
    if (isEn()) return s;
    s = s
      .replace(/Green\s*Bus/gi, '지선버스')
      .replace(/Blue\s*Bus/gi, '간선버스')
      .replace(/Red\s*Bus/gi, '광역버스')
      .replace(/Yellow\s*Bus/gi, '순환버스')
      .replace(/Express\s*Bus/gi, '광역버스')
      .replace(/Intercity\s*Bus/gi, '시외버스')
      .replace(/Airport\s*Bus/gi, '공항버스')
      .replace(/Village\s*Bus/gi, '마을버스')
      .replace(/Town\s*Bus/gi, '마을버스')
      .replace(/Local\s*Bus/gi, '시내버스')
      .replace(/City\s*Bus/gi, '시내버스')
      .replace(/General\s*Bus/gi, '일반버스')
      .replace(/Trunk\s*Bus/gi, '간선버스')
      .replace(/Branch\s*Bus/gi, '지선버스')
      .replace(/Rapid\s*Bus/gi, '급행버스')
      .replace(/Circulat(?:e|ion|or)?\s*Bus/gi, '순환버스')
      .replace(/Subway/gi, '지하철')
      .replace(/Metro/gi, '지하철')
      .replace(/Walk(?:ing)?/gi, '도보')
      .replace(/Transfer/gi, '환승')
      .replace(/Station/gi, '역')
      .replace(/Line\s*(\d+)/gi, '$1호선')
      .replace(/(\d+)(?:st|nd|rd|th)?\s*Line/gi, '$1호선')
      .replace(/Green/gi, '지선')
      .replace(/Blue/gi, '간선')
      .replace(/Red/gi, '광역')
      .replace(/Yellow/gi, '순환')
      .replace(/Bus/gi, '')
      .replace(/[()\[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return s;
  }

  function cleanRouteCode(text) {
    var s = String(text || '');
    var matches = s.match(/[A-Za-z]?\d{1,5}[A-Za-z]?/g) || [];
    var i;
    for (i = 0; i < matches.length; i++) {
      if (/\d/.test(matches[i])) return matches[i].toUpperCase();
    }
    return '';
  }

  function detectBusKindKo(text) {
    var s = localizeTransitText(text);
    if (/광역버스|광역/.test(s)) return '광역버스';
    if (/시외버스|시외/.test(s)) return '시외버스';
    if (/공항버스|공항/.test(s)) return '공항버스';
    if (/마을버스|마을/.test(s)) return '마을버스';
    if (/시내버스|시내/.test(s)) return '시내버스';
    if (/일반버스|일반/.test(s)) return '일반버스';
    if (/간선버스|간선/.test(s)) return '간선버스';
    if (/지선버스|지선/.test(s)) return '지선버스';
    if (/급행버스|급행/.test(s)) return '급행버스';
    if (/순환버스|순환/.test(s)) return '순환버스';
    return '버스';
  }

  function formatLineLabel(step) {
    var type = step.type;
    var raw = [step.line, step.label, step.instruction].filter(Boolean).join(' ');
    if (type === 'bus') {
      var no = cleanRouteCode(raw);
      if (isEn()) return no ? ('Bus ' + no) : 'Bus';
      // Rebuild Korean-only label. Never pass through leftover English.
      var kind = detectBusKindKo(raw);
      return no ? (kind + ' ' + no) : kind;
    }
    if (type === 'subway') {
      var line = localizeTransitText(step.line || '');
      if (isEn()) {
        var lineNo = cleanRouteCode(raw || line);
        if (lineNo) return 'Line ' + lineNo.replace(/[^0-9]/g, '');
        return line || 'Subway';
      }
      if (!line) return '지하철';
      line = line.replace(/[A-Za-z]/g, ' ').replace(/\s+/g, ' ').trim();
      if (/호선|지하철|선/.test(line)) return line;
      var subNo = cleanRouteCode(raw);
      if (subNo && /^\d+$/.test(subNo)) return subNo + '호선';
      return line || '지하철';
    }
    return localizeTransitText(step.line || '');
  }

  function stepIcon(type) {
    if (type === 'walk') return 'walk';
    if (type === 'subway') return 'subway';
    if (type === 'bus') return 'bus';
    if (type === 'car') return 'car';
    if (type === 'bicycle') return 'bicycle';
    return 'walk';
  }

  function stepTitle(step) {
    function t(key, vars, fb) {
      if (typeof I18n !== 'undefined' && I18n.t) return I18n.t(key, vars);
      return fb;
    }
    var from = localizeTransitText(step.from || '');
    var to = localizeTransitText(step.to || '');
    if (!isEn()) {
      from = from.replace(/[A-Za-z]+/g, ' ').replace(/\s+/g, ' ').trim();
      to = to.replace(/[A-Za-z]+/g, ' ').replace(/\s+/g, ' ').trim();
    }
    if (step.type === 'walk') {
      return t('transit.walkStep', {
        from: from || t('transit.depart', {}, '출발'),
        to: to || t('transit.arrive', {}, '도착')
      }, (from || '출발') + ' → ' + (to || '도착') + ' 도보');
    }
    if (step.type === 'subway' || step.type === 'bus') {
      var head = formatLineLabel(step);
      if (from || to) return head + ' · ' + (from || '') + ' → ' + (to || '');
      return head;
    }
    if (step.type === 'car') return t('transit.carMove', {}, '자동차 이동');
    if (step.type === 'bicycle') return t('transit.bikeMove', {}, '자전거 이동');
    return localizeTransitText(step.label || step.instruction || t('transit.move', {}, '이동'));
  }

  function annotateSteps(steps, profileId) {
    function t(key, fb) {
      if (typeof I18n !== 'undefined' && I18n.t) return I18n.t(key, fb);
      return fb;
    }
    var profile = getProfile(profileId);
    var prefs = profile.prefs || {};

    return (steps || []).map(function (step) {
      var notes = (step.notes || []).slice();
      if (step.type === 'walk') {
        if (prefs.avoidStairs) notes.push(t('transit.note.stairs', '계단·육교 대신 엘리베이터·경사로가 있는 출입구를 선택하세요.'));
        if (prefs.gentleSlope) notes.push(t('transit.note.slope', '경사·횡단보도가 있으면 여유 있게 이동하세요.'));
        if (prefs.minWalk && (step.distance || 0) > 500) notes.push(t('transit.note.longWalk', '도보 구간이 깁니다. 휴식이 필요하면 중간에 벤치·역 대합실을 이용하세요.'));
      }
      if (step.type === 'subway') {
        if (prefs.preferElevator) notes.push(t('transit.note.elevator', '역사 내 엘리베이터·휠체어 리프트 위치를 안내판에서 확인하세요.'));
        if (prefs.minTransfer) notes.push(t('transit.note.transfer', '환승 통로가 길 수 있으니 환승 시간을 넉넉히 잡으세요.'));
        if (prefs.voiceGuide || prefs.tactilePaving) notes.push(t('transit.note.voice', '브레일·음성 안내가 필요하면 역무원에게 도움을 요청할 수 있습니다.'));
      }
      if (step.type === 'bus') {
        if (prefs.lowFloorBus) notes.push(t('transit.note.lowFloor', '저상버스·리프트 버스 여부는 정류장·차량 앞 표시를 확인하세요.'));
        if (prefs.seating) notes.push(t('transit.note.seating', '교통약자·임산부석·우선석 이용이 가능합니다.'));
      }
      return Object.assign({}, step, { notes: notes });
    });
  }

  function comfortLabel(score) {
    function t(key, fb) {
      if (typeof I18n !== 'undefined' && I18n.t) return I18n.t(key, fb);
      return fb;
    }
    if (score >= 85) return { text: t('transit.comfort.best', '매우 편함'), className: 'is-best' };
    if (score >= 70) return { text: t('transit.comfort.good', '편함'), className: 'is-good' };
    if (score >= 55) return { text: t('transit.comfort.ok', '보통'), className: 'is-ok' };
    return { text: t('transit.comfort.caution', '주의'), className: 'is-caution' };
  }

  return {
    fetchRoutes: fetchRoutes,
    rankRoutes: rankRoutes,
    scoreRoute: scoreRoute,
    formatDuration: formatDuration,
    formatDistance: formatDistance,
    formatPayment: formatPayment,
    localizeTransitText: localizeTransitText,
    stepIcon: stepIcon,
    stepTitle: stepTitle,
    annotateSteps: annotateSteps,
    comfortLabel: comfortLabel
  };
})();
