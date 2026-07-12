var TransitGuide = (function () {
  var PROFILES = [
    {
      id: 'wheelchair',
      label: '휠체어',
      desc: '엘리베이터·저상버스 위주',
      tagClass: 'hub-tag-disability',
      prefs: { avoidStairs: true, preferElevator: true, lowFloorBus: true, minWalk: true }
    },
    {
      id: 'stroller',
      label: '유모차',
      desc: '넓은 통로·엘리베이터',
      tagClass: 'hub-tag-child',
      prefs: { avoidStairs: true, preferElevator: true, minWalk: true }
    },
    {
      id: 'walker',
      label: '보행 보조기',
      desc: '짧은 도보·완만한 경사',
      tagClass: 'hub-tag-elder',
      prefs: { avoidStairs: true, minWalk: true, gentleSlope: true }
    },
    {
      id: 'visual',
      label: '시각장애·안내견',
      desc: '음성 안내·안내견 동반',
      tagClass: 'hub-tag-disability',
      prefs: { voiceGuide: true, tactilePaving: true, minTransfer: true }
    },
    {
      id: 'elderly',
      label: '고령·보행 느림',
      desc: '환승 적게·좌석 우선',
      tagClass: 'hub-tag-elder',
      prefs: { minTransfer: true, minWalk: true, seating: true }
    }
  ];

  var state = {
    profileId: 'wheelchair',
    mode: 'transit',
    from: '',
    to: '',
    fromPoint: null,
    toPoint: null,
    showResult: false,
    loading: false,
    error: '',
    suggestFrom: [],
    suggestTo: [],
    routes: [],
    selectedRouteIndex: 0,
    routeMeta: null,
    mobilityStations: [],
    fromBusStops: [],
    toBusStops: [],
    fromBusStop: null,
    toBusStop: null
  };

  var mapInstance = null;
  var routeLayer = null;
  var docClickBound = false;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getProfile(id) {
    return PROFILES.find(function (p) { return p.id === id; }) || PROFILES[0];
  }

  function renderPrefChips(profile) {
    var labels = {
      avoidStairs: '계단 회피',
      preferElevator: '엘리베이터 우선',
      lowFloorBus: '저상버스 우선',
      minWalk: '도보 최소',
      minTransfer: '환승 최소',
      gentleSlope: '완만한 경사',
      voiceGuide: '음성 안내',
      tactilePaving: '촉지 블록',
      seating: '좌석·휴식 구간'
    };
    var chips = [];
    Object.keys(profile.prefs || {}).forEach(function (key) {
      if (profile.prefs[key] && labels[key]) {
        chips.push('<span class="transit-pref-chip">' + escapeHtml(labels[key]) + '</span>');
      }
    });
    return chips.join('');
  }

  function renderModeTabs(activeMode) {
    var modes = typeof NaverTransit !== 'undefined' ? NaverTransit.MODES : { transit: {}, walk: {}, car: {}, bicycle: {} };
    return Object.keys(modes).map(function (id) {
      var mode = modes[id];
      var active = id === activeMode ? ' is-active' : '';
      return (
        '<button type="button" class="transit-mode-tab' + active + '" data-mode="' + id + '">' +
          escapeHtml(mode.label || id) +
        '</button>'
      );
    }).join('');
  }

  function suggestKey(field) {
    return field === 'from' ? 'suggestFrom' : 'suggestTo';
  }

  function encodePlaceData(item) {
    return encodeURIComponent(JSON.stringify({
      name: item.name || '',
      address: item.address || '',
      lat: item.lat,
      lng: item.lng,
      kind: item.kind || '',
      source: item.source || ''
    }));
  }

  function parsePlaceData(el) {
    var raw = el.getAttribute('data-place');
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch (err) {
      return null;
    }
  }

  function applySuggestion(field, item) {
    if (!item || !item.name) return;

    if (field === 'from') {
      state.from = item.name;
      state.fromPoint = item;
    } else {
      state.to = item.name;
      state.toPoint = item;
    }

    state[suggestKey(field)] = [];
    state.showResult = false;
    state.routes = [];
    state.error = '';

    var root = document.getElementById('view-transit');
    if (!root) return;

    var input = root.querySelector('#transit-' + field);
    if (input) {
      input.value = item.name;
      input.focus();
    }

    var box = root.querySelector('#transit-' + field + '-suggest');
    if (box) box.innerHTML = '';
  }

  function renderSuggestions(items, field) {
    if (!items.length) return '';
    return (
      '<ul class="transit-suggest" data-field="' + field + '">' +
        items.map(function (item, i) {
          var sub = item.address || item.kind || '';
          var badge = item.source === 'naver' ? '연관검색'
            : (item.source === 'geocode' ? '주소검색'
              : (item.source === 'oasi5' ? 'Oasi5' : ''));
          return (
            '<li><button type="button" class="transit-suggest-item" data-field="' + field + '" data-index="' + i + '" data-place="' + encodePlaceData(item) + '">' +
              '<strong>' + escapeHtml(item.name) + '</strong>' +
              '<span>' + escapeHtml(sub) + (badge ? ' · ' + badge : '') + '</span>' +
            '</button></li>'
          );
        }).join('') +
      '</ul>'
    );
  }

  function renderRoutePanel(profile) {
    return (
      '<section class="hub-section transit-route-panel">' +
        '<div class="transit-mode-tabs" id="transit-mode-tabs">' + renderModeTabs(state.mode) + '</div>' +
        '<form class="transit-route-form" id="transit-form">' +
          '<div class="transit-route-inputs">' +
            '<div class="transit-route-row transit-field-suggest">' +
              '<span class="transit-route-dot transit-route-dot-from" aria-hidden="true"></span>' +
              '<input type="text" id="transit-from" name="from" class="transit-input transit-route-input" placeholder="출발지 (장소·역·주소)" value="' + escapeHtml(state.from) + '" autocomplete="off" aria-label="출발지" />' +
              '<div id="transit-from-suggest">' + renderSuggestions(state.suggestFrom, 'from') + '</div>' +
            '</div>' +
            '<button type="button" class="transit-swap-btn" id="transit-swap" aria-label="출발지와 도착지 바꾸기">⇅</button>' +
            '<div class="transit-route-row transit-field-suggest">' +
              '<span class="transit-route-dot transit-route-dot-to" aria-hidden="true"></span>' +
              '<input type="text" id="transit-to" name="to" class="transit-input transit-route-input" placeholder="도착지 (장소·역·주소)" value="' + escapeHtml(state.to) + '" autocomplete="off" aria-label="도착지" />' +
              '<div id="transit-to-suggest">' + renderSuggestions(state.suggestTo, 'to') + '</div>' +
            '</div>' +
          '</div>' +
          (state.error ? '<p class="transit-error">' + escapeHtml(state.error) + '</p>' : '') +
          '<button type="submit" class="transit-submit transit-route-submit"' + (state.loading ? ' disabled' : '') + '>' +
            (state.loading ? '편한 길 찾는 중…' : '편한 길 찾기') +
          '</button>' +
        '</form>' +
        '<div class="transit-profile-bar">' +
          '<span class="transit-label">나의 이동 상황</span>' +
          '<div class="transit-profile-grid" id="transit-profiles">' +
            PROFILES.map(function (p) {
              var active = p.id === state.profileId ? ' is-active' : '';
              return (
                '<button type="button" class="transit-profile-card' + active + '" data-profile="' + p.id + '" title="' + escapeHtml(p.desc) + '">' +
                  '<span class="hub-tag ' + p.tagClass + '">' + escapeHtml(p.label) + '</span>' +
                '</button>'
              );
            }).join('') +
          '</div>' +
          '<div class="transit-pref-row">' + renderPrefChips(profile) + '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderRouteCards(routes, selectedIndex) {
    if (!routes.length || typeof TransitRoutes === 'undefined') return '';

    return (
      '<div class="transit-route-cards" id="transit-route-cards">' +
        routes.map(function (route, i) {
          var s = route.summary || {};
          var comfort = TransitRoutes.comfortLabel(route.comfortScore || 0);
          var active = i === selectedIndex ? ' is-active' : '';
          var meta = [
            TransitRoutes.formatDuration(s.totalMinutes),
            s.transfers ? '환승 ' + s.transfers + '회' : '',
            s.walkMeters ? '도보 ' + TransitRoutes.formatDistance(s.walkMeters) : '',
            TransitRoutes.formatPayment(s.payment)
          ].filter(Boolean).join(' · ');

          return (
            '<button type="button" class="transit-route-card' + active + '" data-route-index="' + i + '">' +
              '<span class="transit-route-card-time">' + escapeHtml(TransitRoutes.formatDuration(s.totalMinutes)) + '</span>' +
              '<span class="transit-route-card-meta">' + escapeHtml(meta) + '</span>' +
              '<span class="transit-route-card-comfort ' + comfort.className + '">편의 ' + (route.comfortScore || 0) + ' · ' + escapeHtml(comfort.text) + '</span>' +
            '</button>'
          );
        }).join('') +
      '</div>'
    );
  }

  function renderStepList(steps) {
    return (
      '<ol class="transit-step-list">' +
        steps.map(function (step, idx) {
          var icon = typeof TransitRoutes !== 'undefined' ? TransitRoutes.stepIcon(step.type) : 'walk';
          var title = typeof TransitRoutes !== 'undefined' ? TransitRoutes.stepTitle(step) : '';
          var meta = [];
          if (step.duration) meta.push(step.duration + '분');
          if (step.distance) meta.push(TransitRoutes.formatDistance(step.distance));
          if (step.stationCount) meta.push(step.stationCount + '개 역·정류장');

          return (
            '<li class="transit-step' + (step.type === 'subway' && step.mobility ? ' has-mobility' : '') + '">' +
              '<span class="transit-step-icon" data-type="' + escapeHtml(icon) + '" aria-hidden="true"></span>' +
              '<div class="transit-step-body">' +
                '<strong class="transit-step-title">' + escapeHtml(title) + '</strong>' +
                (meta.length ? '<span class="transit-step-meta">' + escapeHtml(meta.join(' · ')) + '</span>' : '') +
                (step.type === 'subway' && step.mobility ? (
                  '<p class="transit-step-kric-hint">♿ 역사 교통약자 안내 · 출구 ' +
                    (step.mobility.gates ? step.mobility.gates.filter(function (g) { return g.elevator; }).length : 0) +
                    '곳 엘리베이터</p>'
                ) : '') +
                (step.instruction ? '<p class="transit-step-instruction">' + escapeHtml(step.instruction) + '</p>' : '') +
                (step.notes && step.notes.length ? (
                  '<ul class="transit-step-notes">' +
                    step.notes.map(function (n) { return '<li>' + escapeHtml(n) + '</li>'; }).join('') +
                  '</ul>'
                ) : '') +
              '</div>' +
            '</li>'
          );
        }).join('') +
      '</ol>'
    );
  }

  function renderRouteResult(profile, fromPoint, toPoint) {
    if (!fromPoint || !toPoint) return '';

    var routes = state.routes || [];
    var selected = routes[state.selectedRouteIndex] || routes[0];
    if (!selected) {
      return (
        '<section class="hub-section transit-result" id="transit-result">' +
          '<div class="transit-result-head">' +
            '<h2>경로를 찾는 중…</h2>' +
            '<p class="hub-section-note">' +
              escapeHtml(fromPoint.name) + ' → ' + escapeHtml(toPoint.name) +
            '</p>' +
          '</div>' +
          '<p class="hub-section-note access-loading-note">맞춤 경로를 불러오는 중입니다.</p>' +
        '</section>'
      );
    }

    var steps = typeof TransitRoutes !== 'undefined'
      ? TransitRoutes.annotateSteps(selected.steps || [], state.profileId)
      : (selected.steps || []);

    var modeLabel = typeof NaverTransit !== 'undefined'
      ? (NaverTransit.getMode(state.mode).label || state.mode)
      : state.mode;

    var tips = typeof NaverTransit !== 'undefined'
      ? NaverTransit.getProfileTips(profile.id).slice(0, 2)
      : [];

    return (
      '<section class="hub-section transit-result" id="transit-result">' +
        '<div class="transit-result-head">' +
          '<h2>' + escapeHtml(modeLabel) + ' · ' + escapeHtml(profile.label) + ' 맞춤 경로</h2>' +
          '<p class="hub-section-note">' +
            escapeHtml(fromPoint.name) + ' → ' + escapeHtml(toPoint.name) +
            (routes.length > 1 ? ' · 추천 ' + routes.length + '개 경로' : '') +
          '</p>' +
        '</div>' +
        renderRouteCards(routes, state.selectedRouteIndex) +
        '<div class="transit-result-layout">' +
          '<div class="transit-map-wrap">' +
            '<div id="transit-map" class="transit-map" aria-label="경로 지도"></div>' +
          '</div>' +
          '<div class="transit-detail-panel">' +
            '<div class="transit-detail-summary">' +
              '<span class="transit-detail-time">' + escapeHtml(TransitRoutes.formatDuration(selected.summary.totalMinutes)) + '</span>' +
              '<span class="transit-detail-meta">' +
                escapeHtml([
                  selected.summary.transfers ? '환승 ' + selected.summary.transfers + '회' : '환승 없음',
                  selected.summary.walkMeters ? '도보 ' + TransitRoutes.formatDistance(selected.summary.walkMeters) : '',
                  TransitRoutes.formatPayment(selected.summary.payment)
                ].filter(Boolean).join(' · ')) +
              '</span>' +
              '<span class="transit-detail-comfort">교통약자 편의 점수 ' + (selected.comfortScore || 0) + '/100</span>' +
            '</div>' +
            renderStepList(steps) +
            (tips.length ? (
              '<ul class="transit-tip-list">' +
                tips.map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join('') +
              '</ul>'
            ) : '') +
          '</div>' +
        '</div>' +
        (typeof KricMobility !== 'undefined' && state.mobilityStations.length
          ? KricMobility.renderMobilitySection(state.mobilityStations)
          : '') +
      '</section>'
    );
  }

  function render(showResult) {
    var profile = getProfile(state.profileId);

    return (
      '<main class="app-view-inner hub-view transit-view">' +
        '<div class="hub-hero transit-hero-compact">' +
          '<h1 class="hub-page-title">' +
            '<span class="hub-page-brand">Oasi<span class="brand-five">5</span></span>' +
            '<span class="hub-page-en">길찾기</span>' +
          '</h1>' +
          '<p class="hub-hero-lead">출발·도착을 입력하면 이동 상황에 맞는 경로와 단계별 안내를 보여줍니다.</p>' +
        '</div>' +
        renderRoutePanel(profile) +
        (showResult && state.fromPoint && state.toPoint
          ? renderRouteResult(profile, state.fromPoint, state.toPoint)
          : (
            '<section class="hub-section transit-empty">' +
              '<p class="hub-section-note">출발지와 도착지를 입력한 뒤 「편한 길 찾기」를 누르면 맞춤 경로가 표시됩니다.</p>' +
            '</section>'
          )) +
      '</main>'
    );
  }

  function saveFormState(container) {
    var form = container && container.querySelector('#transit-form');
    if (!form) return;
    state.from = (form.from && form.from.value || '').trim();
    state.to = (form.to && form.to.value || '').trim();
  }

  function clearPointIfEdited(field, value) {
    if (field === 'from') {
      if (state.fromPoint && state.fromPoint.name !== value) state.fromPoint = null;
    } else if (field === 'to') {
      if (state.toPoint && state.toPoint.name !== value) state.toPoint = null;
    }
  }

  function updateSuggest(field, query, container) {
    if (typeof NaverTransit === 'undefined') return;
    var box = container.querySelector('#transit-' + field + '-suggest');
    if (!box) return;

    if (query.length < 1) {
      state[suggestKey(field)] = [];
      box.innerHTML = '';
      return;
    }

    NaverTransit.searchPlaces(query, 8).then(function (items) {
      state[suggestKey(field)] = items;
      var input = container.querySelector('#transit-' + field);
      if (input && input.value.trim() === query) {
        box.innerHTML = items.length ? renderSuggestions(items, field) : '';
      }
    });
  }

  function localizePlaceLabel(text) {
    if (text == null || text === '') return text;
    return String(text)
      .replace(/\bWalk\b/g, '도보')
      .replace(/\bWalking\b/gi, '도보')
      .replace(/\bSubway\b/gi, '지하철')
      .replace(/\bMetro\b/gi, '지하철')
      .replace(/\bBus\b/g, '버스')
      .replace(/\bTransit\b/gi, '대중교통')
      .replace(/\bDestination\b/gi, '도착')
      .replace(/\bOrigin\b/gi, '출발')
      .replace(/\bStart\b/g, '출발')
      .replace(/\bEnd\b/g, '도착')
      .replace(/\bTransfer\b/gi, '환승')
      .replace(/\bminutes?\b/gi, '분')
      .replace(/\bhours?\b/gi, '시간')
      .replace(/\bexternal\b/gi, '안내')
      .replace(/South Korea/gi, '대한민국')
      .replace(/Republic of Korea/gi, '대한민국');
  }

  function pickSuggestion(field, index) {
    var items = state[suggestKey(field)] || [];
    var item = items[index];
    if (!item) return;
    applySuggestion(field, item);
  }

  function runRouteSearch() {
    if (!state.from || !state.to) {
      state.error = '출발지와 도착지를 입력해 주세요.';
      state.showResult = false;
      mount();
      return;
    }

    state.error = '';
    state.loading = true;
    state.showResult = false;
    state.routes = [];
    state.fromBusStops = [];
    state.toBusStops = [];
    state.fromBusStop = null;
    state.toBusStop = null;
    state.mobilityStations = [];
    mount();

    var NT = NaverTransit;
    Promise.all([
      state.fromPoint && state.fromPoint.name === state.from
        ? Promise.resolve(state.fromPoint)
        : NT.resolvePoint(state.from),
      state.toPoint && state.toPoint.name === state.to
        ? Promise.resolve(state.toPoint)
        : NT.resolvePoint(state.to)
    ]).then(function (pts) {
      if (!pts[0] || !pts[1]) {
        state.loading = false;
        state.error = '위치를 찾지 못했습니다. 연관 검색어에서 장소를 선택하거나, 장소·역·도로명 주소를 입력해 주세요.';
        mount();
        return;
      }
      if (!pts[0].lat || !pts[1].lat) {
        state.loading = false;
        state.error = '정확한 좌표가 필요합니다. 연관 검색어에서 장소를 선택해 주세요.';
        mount();
        return;
      }

      state.fromPoint = pts[0];
      state.toPoint = pts[1];

      // 위치가 잡히면 바로 결과 영역을 열고, 경로 API는 이어서 채웁니다.
      state.loading = false;
      state.showResult = true;
      state.routes = [];
      mount();
      var resultEarly = document.querySelector('#transit-result');
      if (resultEarly) resultEarly.scrollIntoView({ behavior: 'smooth', block: 'start' });

      return TransitRoutes.fetchRoutes(pts[0], pts[1], state.mode, state.profileId)
        .then(function (data) {
          var ranked = TransitRoutes.rankRoutes(data.routes || [], state.profileId);
          // Hide external-link-only dummy routes from the card list if real steps exist elsewhere,
          // but keep them if they're the only option — localize labels first.
          ranked = ranked.map(function (route) {
            var summary = Object.assign({}, route.summary || {});
            if (summary.label) {
              summary.label = String(summary.label)
                .replace(/external/gi, '안내')
                .replace(/walk/gi, '도보')
                .replace(/transit/gi, '대중교통')
                .replace(/public transit/gi, '대중교통');
            }
            var steps = (route.steps || []).map(function (step) {
              return Object.assign({}, step, {
                from: localizePlaceLabel(step.from),
                to: localizePlaceLabel(step.to),
                line: localizePlaceLabel(step.line),
                instruction: localizePlaceLabel(step.instruction),
                notes: (step.notes || []).map(localizePlaceLabel)
              });
            });
            return Object.assign({}, route, { summary: summary, steps: steps });
          });
          state.routes = ranked;
          state.selectedRouteIndex = 0;
          state.routeMeta = { source: data.source, mode: data.mode };

          var selected = state.routes[0];
          if (state.mode === 'transit' && selected && typeof KricMobility !== 'undefined' && selected.steps) {
            return KricMobility.enrichRouteSteps(selected.steps).then(function (enriched) {
              state.routes = state.routes.map(function (route, i) {
                if (i !== 0) return route;
                return Object.assign({}, route, { steps: enriched.steps });
              });
              state.mobilityStations = enriched.stations || [];
              mount();
            });
          }
          mount();
        })
        .catch(function () {
          mount();
        });
    }).catch(function (err) {
      state.loading = false;
      state.error = (err && err.message) || '경로 검색 중 오류가 발생했습니다.';
      mount();
    });
  }

  function updateRouteMap(container) {
    if (!container || typeof L === 'undefined') return;

    var el = container.querySelector('#transit-map');
    if (!el) return;

    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
      routeLayer = null;
    }

    if (!state.fromPoint || !state.toPoint) return;

    var routes = state.routes || [];
    var route = routes[state.selectedRouteIndex] || routes[0];

    mapInstance = L.map(el, { zoomControl: true });

    L.tileLayer('https://tiles.osm.kr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM Korea',
      maxZoom: 19
    }).addTo(mapInstance);

    var poly = (route && route.polyline) || [];
    if (poly.length >= 2) {
      routeLayer = L.polyline(poly, { color: '#03c75a', weight: 5, opacity: 0.9 }).addTo(mapInstance);
      mapInstance.fitBounds(routeLayer.getBounds(), { padding: [28, 28] });
    } else {
      routeLayer = L.polyline(
        [[state.fromPoint.lat, state.fromPoint.lng], [state.toPoint.lat, state.toPoint.lng]],
        { color: '#03c75a', weight: 4, opacity: 0.7, dashArray: '8 6' }
      ).addTo(mapInstance);
      mapInstance.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
    }

    L.circleMarker([state.fromPoint.lat, state.fromPoint.lng], {
      radius: 8, color: '#fff', weight: 2, fillColor: '#03c75a', fillOpacity: 1
    }).addTo(mapInstance).bindPopup(state.fromPoint.name);
    L.circleMarker([state.toPoint.lat, state.toPoint.lng], {
      radius: 8, color: '#fff', weight: 2, fillColor: '#e53935', fillOpacity: 1
    }).addTo(mapInstance).bindPopup(state.toPoint.name);

    setTimeout(function () { mapInstance.invalidateSize(); }, 120);
  }

  function bindEvents(container) {
    var modeTabs = container.querySelector('#transit-mode-tabs');
    if (modeTabs && !modeTabs.dataset.bound) {
      modeTabs.dataset.bound = '1';
      modeTabs.addEventListener('click', function (e) {
        var tab = e.target.closest('[data-mode]');
        if (!tab) return;
        saveFormState(container);
        state.mode = tab.getAttribute('data-mode');
        if (state.from && state.to && state.fromPoint && state.toPoint) {
          runRouteSearch();
        } else {
          mount();
        }
      });
    }

    var profiles = container.querySelector('#transit-profiles');
    if (profiles && !profiles.dataset.bound) {
      profiles.dataset.bound = '1';
      profiles.addEventListener('click', function (e) {
        var card = e.target.closest('[data-profile]');
        if (!card) return;
        saveFormState(container);
        state.profileId = card.getAttribute('data-profile');
        if (state.routes.length) {
          state.routes = TransitRoutes.rankRoutes(state.routes, state.profileId);
          state.selectedRouteIndex = 0;
          var sel = state.routes[state.selectedRouteIndex];
          if (state.mode === 'transit' && typeof KricMobility !== 'undefined' && sel && sel.steps) {
            KricMobility.enrichRouteSteps(sel.steps).then(function (enriched) {
              state.routes[state.selectedRouteIndex] = Object.assign({}, sel, { steps: enriched.steps });
              state.mobilityStations = enriched.stations || [];
              mount();
            });
            return;
          }
        }
        mount();
      });
    }

    var routeCards = container.querySelector('#transit-route-cards');
    if (routeCards && !routeCards.dataset.bound) {
      routeCards.dataset.bound = '1';
      routeCards.addEventListener('click', function (e) {
        var card = e.target.closest('[data-route-index]');
        if (!card) return;
        state.selectedRouteIndex = Number(card.getAttribute('data-route-index'));
        var sel = state.routes[state.selectedRouteIndex];
        if (state.mode === 'transit' && typeof KricMobility !== 'undefined' && sel && sel.steps) {
          KricMobility.enrichRouteSteps(sel.steps).then(function (enriched) {
            state.routes[state.selectedRouteIndex] = Object.assign({}, sel, { steps: enriched.steps });
            state.mobilityStations = enriched.stations || [];
            mount();
          });
          return;
        }
        mount();
      });
    }

    var swapBtn = container.querySelector('#transit-swap');
    if (swapBtn && !swapBtn.dataset.bound) {
      swapBtn.dataset.bound = '1';
      swapBtn.addEventListener('click', function () {
        saveFormState(container);
        var tmpText = state.from;
        var tmpPoint = state.fromPoint;
        state.from = state.to;
        state.fromPoint = state.toPoint;
        state.to = tmpText;
        state.toPoint = tmpPoint;
        state.showResult = false;
        state.routes = [];
        mount();
      });
    }

    ['from', 'to'].forEach(function (field) {
      var input = container.querySelector('#transit-' + field);
      if (!input || input.dataset.bound) return;
      input.dataset.bound = '1';
      var timer;
      input.addEventListener('input', function () {
        var value = input.value.trim();
        clearPointIfEdited(field, value);
        clearTimeout(timer);
        timer = setTimeout(function () {
          updateSuggest(field, value, container);
        }, 200);
      });
      input.addEventListener('focus', function () {
        var value = input.value.trim();
        if (value) updateSuggest(field, value, container);
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var items = state[suggestKey(field)] || [];
          if (items.length) {
            e.preventDefault();
            pickSuggestion(field, 0);
          }
        }
      });
    });

    if (!container.dataset.suggestBound) {
      container.dataset.suggestBound = '1';
      container.addEventListener('mousedown', function (e) {
        var suggest = e.target.closest('.transit-suggest-item');
        if (!suggest) return;
        e.preventDefault();
        var field = suggest.getAttribute('data-field');
        var item = parsePlaceData(suggest);
        if (item) {
          applySuggestion(field, item);
          return;
        }
        pickSuggestion(field, Number(suggest.getAttribute('data-index')));
      });
    }

    var form = container.querySelector('#transit-form');
    if (form && !form.dataset.bound) {
      form.dataset.bound = '1';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        saveFormState(container);
        runRouteSearch();
      });
    }

    if (!docClickBound) {
      docClickBound = true;
      document.addEventListener('click', function (e) {
        var root = document.getElementById('view-transit');
        if (!root || root.contains(e.target)) return;
        state.suggestFrom = [];
        state.suggestTo = [];
        var fromBox = root.querySelector('#transit-from-suggest');
        var toBox = root.querySelector('#transit-to-suggest');
        if (fromBox) fromBox.innerHTML = '';
        if (toBox) toBox.innerHTML = '';
      });
    }
  }

  function mount() {
    var el = document.getElementById('view-transit');
    if (!el) return;
    el.innerHTML = render(state.showResult);
    bindEvents(el);
    if (state.showResult && state.fromPoint && state.toPoint) {
      updateRouteMap(el);
    }
  }

  return {
    mount: mount,
    PROFILES: PROFILES
  };
})();
