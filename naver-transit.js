var NaverTransit = (function () {
  var APP_NAME = 'oasi5';

  var MODES = {
    transit: { id: 'transit', label: '대중교통', path: 'transit', appType: 'public' },
    walk: { id: 'walk', label: '도보', path: 'walk', appType: 'walk' },
    car: { id: 'car', label: '자동차', path: 'car', appType: 'car' },
    bicycle: { id: 'bicycle', label: '자전거', path: 'bicycle', appType: 'bike' }
  };

  var LANDMARKS = [
    { name: '서울역', address: '서울특별시 용산구 한강대로 405', lat: 37.554678, lng: 126.970606, kind: '역' },
    { name: '강남역', address: '서울특별시 강남구 강남대로 지하 396', lat: 37.497942, lng: 127.027621, kind: '역' },
    { name: '여의도역', address: '서울특별시 영등포구 여의나루로 46', lat: 37.521961, lng: 126.924333, kind: '역' },
    { name: '코엑스', address: '서울특별시 강남구 영동대로 513', lat: 37.512522, lng: 127.059248, kind: '쇼핑·전시' },
    { name: '더현대 서울', address: '서울특별시 영등포구 여의대로 108', lat: 37.5264, lng: 126.9282, kind: '쇼핑몰' },
    { name: 'IFC몰', address: '서울특별시 영등포구 국제금융로 10', lat: 37.5253, lng: 126.9264, kind: '쇼핑몰' },
    { name: '잠실역', address: '서울특별시 송파구 올림픽로 지하 265', lat: 37.513262, lng: 127.100092, kind: '역' },
    { name: '홍대입구역', address: '서울특별시 마포구 양화로 지하 160', lat: 37.557192, lng: 126.925381, kind: '역' },
    { name: '부산역', address: '부산광역시 동구 중앙대로 206', lat: 35.115174, lng: 129.041433, kind: '역' },
    { name: '해운대역', address: '부산광역시 해운대구 해운대로 570', lat: 35.163064, lng: 129.160072, kind: '역' },
    { name: '센텀시티역', address: '부산광역시 해운대구 센텀중앙로 90', lat: 35.1695, lng: 129.131, kind: '역' },
    { name: '대구역', address: '대구광역시 북구 태평로 161', lat: 35.876003, lng: 128.628054, kind: '역' },
    { name: '인천역', address: '인천광역시 미추홀구 인천역로 142', lat: 37.476693, lng: 126.616931, kind: '역' },
    { name: '광주송정역', address: '광주광역시 광산구 송정로 271', lat: 35.137922, lng: 126.791768, kind: '역' },
    { name: '대전역', address: '대전광역시 동구 중앙로 215', lat: 36.332078, lng: 127.434706, kind: '역' },
    { name: '울산역', address: '울산광역시 남구 삼산로 277', lat: 35.551431, lng: 129.138506, kind: '역' },
    { name: '수원역', address: '경기도 수원시 팔달구 경수대로 270', lat: 37.265974, lng: 127.000736, kind: '역' },
    { name: '제주시청', address: '제주특별자치도 제주시 연삼로 17', lat: 33.499621, lng: 126.531188, kind: '관공서' },
    { name: '경주여자고등학교', address: '경상북도 경주시 화랑로 123', lat: 35.8458, lng: 129.2034, kind: '학교' },
    { name: '경주여고', address: '경상북도 경주시 화랑로 123', lat: 35.8458, lng: 129.2034, kind: '학교' },
    { name: '경주역', address: '경상북도 경주시 화랑로 148', lat: 35.8004, lng: 129.1382, kind: '역' }
  ];

  var PROFILE_TIPS = {
    wheelchair: [
      '저상버스·리프트 버스는 정류장과 차량 앞 표시를 확인하세요.',
      '역사 환승 시 엘리베이터 간 이동 거리가 길 수 있으니 환승 시간을 넉넉히 잡으세요.'
    ],
    stroller: [
      '유모차는 엘리베이터·완만한 경사로가 있는 역·쇼핑몰 연결 통로를 우선 선택하세요.',
      '에스컬레이터만 있는 출구는 피하고 엘리베이터 표시 출구를 이용하세요.'
    ],
    walker: [
      '도보 구간이 긴 경로는 버스·지하철로 나누어 이동하면 부담이 줄어듭니다.',
      '휴식이 필요하면 역사 내 의자·대합실을 이용할 수 있습니다.'
    ],
    visual: [
      '시각장애인 안내견은 「장애인 보조견」 표시와 함께 대중교통에 동반 탑승할 수 있습니다.',
      '역사 브레일·음성 안내 시설은 역무원에게 문의하면 안내받을 수 있습니다.'
    ],
    elderly: [
      '환승 횟수가 적은 경로를 우선 선택하면 이동 부담이 줄어듭니다.',
      '지하철·버스 교통약자 좌석·우선석 이용이 가능합니다.'
    ]
  };
  var searchIndex = null;
  var remoteSearchUrl = '/api/transit-search';
  var geocodeUrl = '/api/geocode';

  function normalize(text) {
    return String(text || '').replace(/\s+/g, '').toLowerCase();
  }

  function encodeName(name) {
    return encodeURIComponent(String(name || '').trim());
  }

  function buildSearchIndex() {
    if (searchIndex) return searchIndex;

    var list = [];
    var seen = {};

    function add(item) {
      if (!item || !item.name) return;
      var key = normalize(item.name) + '|' + (item.lat || '') + ',' + (item.lng || '');
      if (seen[key]) return;
      seen[key] = true;
      list.push(item);
    }

    if (typeof places !== 'undefined') {
      places.forEach(function (p) {
        if (!p.name) return;
        add({
          name: p.name,
          address: p.address || '',
          lat: p.lat,
          lng: p.lng,
          region: p.region || '',
          kind: p.type === 'help' ? (p.category || '도움 시설') : (p.category || '장소'),
          source: 'oasi5'
        });
      });
    }

    LANDMARKS.forEach(function (lm) {
      add({
        name: lm.name,
        address: lm.address || '',
        lat: lm.lat,
        lng: lm.lng,
        kind: lm.kind || '장소',
        source: 'landmark'
      });
    });

    if (typeof DisabilityAccess !== 'undefined' && DisabilityAccess.RECOMMENDATIONS) {
      DisabilityAccess.RECOMMENDATIONS.forEach(function (r) {
        add({
          name: r.name,
          address: r.address || '',
          lat: r.lat,
          lng: r.lng,
          kind: r.kind || '시설 추천',
          source: 'facility'
        });
      });
    }

    searchIndex = list;
    return list;
  }

  function scoreMatch(nameNorm, addrNorm, queryNorm) {
    if (!queryNorm) return -1;

    if (nameNorm === queryNorm) return 10000;
    if (nameNorm.indexOf(queryNorm) === 0) return 9000 - nameNorm.length;
    if (addrNorm.indexOf(queryNorm) === 0) return 8500 - addrNorm.length;

    var idx = nameNorm.indexOf(queryNorm);
    if (idx >= 0) return 7000 - idx;

    idx = addrNorm.indexOf(queryNorm);
    if (idx >= 0) return 6500 - idx;

    var qLen = queryNorm.length;
    for (var i = 0; i <= nameNorm.length - qLen; i++) {
      if (nameNorm.slice(i, i + qLen) === queryNorm) {
        return 6000 - i;
      }
    }

    return -1;
  }

  function searchLocal(query, limit) {
    var q = normalize(query);
    if (!q) return [];

    var index = buildSearchIndex();
    var scored = [];

    index.forEach(function (item) {
      var nameN = normalize(item.name);
      var addrN = normalize(item.address);
      var score = scoreMatch(nameN, addrN, q);
      if (score >= 0) {
        scored.push({ score: score, item: item });
      }
    });

    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.name.length - b.item.name.length;
    });

    return scored.slice(0, limit || 8).map(function (row) {
      return Object.assign({}, row.item);
    });
  }

  function searchRemote(query, limit) {
    var q = String(query || '').trim();
    if (q.length < 1) return Promise.resolve([]);

    var url = remoteSearchUrl + '?q=' + encodeURIComponent(q) + '&limit=' + (limit || 8);
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('search failed');
        return res.json();
      })
      .then(function (data) {
        return (data && data.items) ? data.items : [];
      })
      .catch(function () { return []; });
  }

  function geocodeRemote(query) {
    var q = String(query || '').trim();
    if (!q) return Promise.resolve(null);

    function stripDetail(text) {
      return String(text || '')
        .replace(/\s*\d+\s*동(\s*\d+\s*호)?/g, ' ')
        .replace(/\s*\d+\s*호/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function keepAddressName(point) {
      if (!point) return null;
      if (/[가-힣].*(로|길|동|아파트|빌라|단지)/.test(q)) {
        return Object.assign({}, point, { name: q });
      }
      return point;
    }

    function fromPhoton(text) {
      var url = 'https://photon.komoot.io/api/?q=' + encodeURIComponent(text) +
        '&limit=5&lang=ko&lat=36.5&lon=127.8';
      return fetch(url)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var features = (data && data.features) || [];
          for (var i = 0; i < features.length; i++) {
            var f = features[i];
            var coords = (f.geometry && f.geometry.coordinates) || [];
            var lng = Number(coords[0]);
            var lat = Number(coords[1]);
            if (!(lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132)) continue;
            var p = f.properties || {};
            return {
              name: p.name || p.street || text,
              address: [p.street, p.housenumber, p.district, p.city, p.state].filter(Boolean).join(' '),
              lat: lat,
              lng: lng,
              source: 'photon'
            };
          }
          return null;
        })
        .catch(function () { return null; });
    }

    return fetch(geocodeUrl + '?q=' + encodeURIComponent(q))
      .then(function (res) {
        var ct = (res.headers.get('content-type') || '');
        if (!res.ok || ct.indexOf('application/json') < 0) throw new Error('geocode');
        return res.json().then(function (data) {
          if (!data || !data.point) return null;
          return keepAddressName(data.point);
        });
      })
      .catch(function () {
        var stripped = stripDetail(q);
        return fromPhoton(q).then(function (point) {
          if (point) return keepAddressName(point);
          if (stripped && stripped !== q) return fromPhoton(stripped).then(keepAddressName);
          return null;
        }).then(function (point) {
          if (point) return point;
          return geocodeNominatim(q).then(keepAddressName);
        });
      });
  }

  function mergeResults(local, remote, limit) {
    var out = [];
    var seen = {};

    function push(item) {
      if (!item || !item.name) return;
      var key = normalize(item.name) + '|' + (item.lat || '') + ',' + (item.lng || '');
      if (seen[key]) return;
      seen[key] = true;
      out.push(item);
    }

    local.forEach(push);
    remote.forEach(push);
    return out.slice(0, limit || 8);
  }

  function searchPlaces(query, limit) {
    var local = searchLocal(query, limit);
    return searchRemote(query, limit).then(function (remote) {
      return mergeResults(local, remote, limit);
    });
  }

  function geocodeNominatim(query) {
    var url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&q='
      + encodeURIComponent(query.trim() + ' 대한민국');

    return fetch(url, { headers: { 'Accept-Language': 'ko' } })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.length) return null;
        var item = data[0];
        return {
          name: query.trim(),
          address: item.display_name || '',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          kind: '검색',
          source: 'nominatim'
        };
      })
      .catch(function () { return null; });
  }

  function resolvePoint(query) {
    var trimmed = String(query || '').trim();
    if (!trimmed) return Promise.resolve(null);

    var local = searchLocal(trimmed, 5);
    var exact = local.find(function (p) { return normalize(p.name) === normalize(trimmed); });
    if (exact && exact.lat && exact.lng) {
      return Promise.resolve(Object.assign({}, exact));
    }

    return Promise.all([
      searchRemote(trimmed, 6),
      geocodeRemote(trimmed)
    ]).then(function (results) {
      var remote = results[0] || [];
      var geo = results[1];
      var merged = mergeResults(local, remote, 8);
      if (merged.length) {
        var best = merged.find(function (p) { return normalize(p.name) === normalize(trimmed); }) || merged[0];
        if (best.lat && best.lng) return Object.assign({}, best);
      }
      if (geo && geo.lat && geo.lng) return geo;
      return geocodeNominatim(trimmed).then(function (nom) {
        return nom || null;
      });
    });
  }

  function formatEndpoint(point) {
    if (point.lat && point.lng) {
      return point.lat + ',' + point.lng + ',' + encodeName(point.name);
    }
    return encodeName(point.name);
  }

  function getMode(modeId) {
    return MODES[modeId] || MODES.transit;
  }

  function buildDirectionsWebUrl(from, to, modeId) {
    var mode = getMode(modeId);
    var sp = formatEndpoint(from);
    var ep = formatEndpoint(to);
    return 'https://map.naver.com/p/directions/' + sp + '/' + ep + '/-/' + mode.path;
  }

  function buildDirectionsAppUrl(from, to, modeId) {
    var mode = getMode(modeId);
    var params = [
      'slat=' + (from.lat || ''),
      'slng=' + (from.lng || ''),
      'sname=' + encodeName(from.name),
      'dlat=' + (to.lat || ''),
      'dlng=' + (to.lng || ''),
      'dname=' + encodeName(to.name),
      'appname=' + APP_NAME
    ];
    return 'nmap://route/' + mode.appType + '?' + params.join('&');
  }

  function buildSearchUrl(name) {
    return 'https://map.naver.com/p/search/' + encodeName(name);
  }

  function haversineKm(a, b) {
    if (!a.lat || !a.lng || !b.lat || !b.lng) return null;
    var R = 6371;
    var dLat = (b.lat - a.lat) * Math.PI / 180;
    var dLng = (b.lng - a.lng) * Math.PI / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180)
      * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function getProfileTips(profileId) {
    return PROFILE_TIPS[profileId] || PROFILE_TIPS.wheelchair;
  }

  return {
    MODES: MODES,
    searchLocal: searchLocal,
    searchRemote: searchRemote,
    searchPlaces: searchPlaces,
    resolvePoint: resolvePoint,
    buildDirectionsWebUrl: buildDirectionsWebUrl,
    buildDirectionsAppUrl: buildDirectionsAppUrl,
    buildSearchUrl: buildSearchUrl,
    haversineKm: haversineKm,
    getProfileTips: getProfileTips,
    getMode: getMode
  };
})();
