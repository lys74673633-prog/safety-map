var TransitRoutes = (function () {
  var ROUTE_API = '/api/transit-route';

  function fetchOsrmClient(from, to, mode) {
    var profileMap = { walk: 'foot', car: 'driving', bicycle: 'bike' };
    var osrmProfile = profileMap[mode] || 'foot';
    var coords = from.lng + ',' + from.lat + ';' + to.lng + ',' + to.lat;
    var url = 'https://router.project-osrm.org/route/v1/' + osrmProfile + '/'
      + coords + '?overview=full&geometries=geojson&steps=true';

    return fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.code !== 'Ok' || !data.routes || !data.routes.length) {
          throw new Error('경로를 찾지 못했습니다.');
        }
        var route = data.routes[0];
        var labels = { walk: '도보', car: '자동차', bicycle: '자전거' };
        var totalMin = Math.max(1, Math.round((route.duration || 0) / 60));
        var polyline = (route.geometry.coordinates || []).map(function (pt) {
          return [pt[1], pt[0]];
        });
        return {
          mode: mode,
          source: 'osrm-client',
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
              firstStop: from.name,
              lastStop: to.name
            },
            steps: [{
              type: mode,
              duration: totalMin,
              distance: Math.round(route.distance || 0),
              from: from.name,
              to: to.name,
              line: null,
              notes: []
            }],
            polyline: polyline
          }]
        };
      });
  }

  function fetchRoutes(from, to, mode, profileId) {
    if (!from || !to) return Promise.reject(new Error('missing points'));
    if (!from.lat || !from.lng || !to.lat || !to.lng) {
      return Promise.reject(new Error('좌표가 없는 장소입니다. 연관 검색어에서 장소를 선택해 주세요.'));
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
          if (mode === 'walk' || mode === 'car' || mode === 'bicycle') {
            return fetchOsrmClient(from, to, mode);
          }
          throw new Error('경로를 불러오지 못했습니다.');
        }
        return res.json().then(function (data) {
          if (!res.ok) {
            if ((mode === 'walk' || mode === 'car' || mode === 'bicycle') && (res.status === 404 || data.code === 'ODSAY_KEY_REQUIRED')) {
              return fetchOsrmClient(from, to, mode);
            }
            var err = new Error((data && data.message) || '경로를 불러오지 못했습니다.');
            err.code = data && data.code;
            err.data = data;
            throw err;
          }
          return data;
        });
      })
      .catch(function (err) {
        if (mode === 'walk' || mode === 'car' || mode === 'bicycle') {
          return fetchOsrmClient(from, to, mode);
        }
        throw err;
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
    var m = Math.max(0, Math.round(minutes || 0));
    if (m < 60) return m + '분';
    var h = Math.floor(m / 60);
    var rest = m % 60;
    return rest ? h + '시간 ' + rest + '분' : h + '시간';
  }

  function formatDistance(meters) {
    var m = Math.max(0, Math.round(meters || 0));
    if (m < 1000) return m + 'm';
    return (m / 1000).toFixed(1) + 'km';
  }

  function formatPayment(won) {
    if (won == null || won < 0) return '';
    return Number(won).toLocaleString('ko-KR') + '원';
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
    if (step.type === 'walk') {
      return (step.from || '출발') + ' → ' + (step.to || '도착') + ' 도보';
    }
    if (step.type === 'subway') {
      return (step.line || '지하철') + ' · ' + (step.from || '') + ' → ' + (step.to || '');
    }
    if (step.type === 'bus') {
      return (step.line || '버스') + ' · ' + (step.from || '') + ' → ' + (step.to || '');
    }
    if (step.type === 'car') return '자동차 이동';
    if (step.type === 'bicycle') return '자전거 이동';
    return step.label || '이동';
  }

  function annotateSteps(steps, profileId) {
    var profile = getProfile(profileId);
    var prefs = profile.prefs || {};

    return (steps || []).map(function (step) {
      var notes = (step.notes || []).slice();
      if (step.type === 'walk') {
        if (prefs.avoidStairs) notes.push('계단·육교 대신 엘리베이터·경사로가 있는 출입구를 선택하세요.');
        if (prefs.gentleSlope) notes.push('경사·횡단보도가 있으면 여유 있게 이동하세요.');
        if (prefs.minWalk && (step.distance || 0) > 500) notes.push('도보 구간이 깁니다. 휴식이 필요하면 중간에 벤치·역 대합실을 이용하세요.');
      }
      if (step.type === 'subway') {
        if (prefs.preferElevator) notes.push('역사 내 엘리베이터·휠체어 리프트 위치를 안내판에서 확인하세요.');
        if (prefs.minTransfer) notes.push('환승 통로가 길 수 있으니 환승 시간을 넉넉히 잡으세요.');
        if (prefs.voiceGuide || prefs.tactilePaving) notes.push('브레일·음성 안내가 필요하면 역무원에게 도움을 요청할 수 있습니다.');
      }
      if (step.type === 'bus') {
        if (prefs.lowFloorBus) notes.push('저상버스·리프트 버스 여부는 정류장·차량 앞 표시를 확인하세요.');
        if (prefs.seating) notes.push('교통약자·임산부석·우선석 이용이 가능합니다.');
      }
      return Object.assign({}, step, { notes: notes });
    });
  }

  function comfortLabel(score) {
    if (score >= 85) return { text: '매우 편함', className: 'is-best' };
    if (score >= 70) return { text: '편함', className: 'is-good' };
    if (score >= 55) return { text: '보통', className: 'is-ok' };
    return { text: '주의', className: 'is-caution' };
  }

  return {
    fetchRoutes: fetchRoutes,
    rankRoutes: rankRoutes,
    scoreRoute: scoreRoute,
    formatDuration: formatDuration,
    formatDistance: formatDistance,
    formatPayment: formatPayment,
    stepIcon: stepIcon,
    stepTitle: stepTitle,
    annotateSteps: annotateSteps,
    comfortLabel: comfortLabel
  };
})();
