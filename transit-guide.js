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
    routes: [],
    selectedRouteIndex: 0,
    routeSource: ''
  };

  var mapInstance = null;

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

  function brandHtml() {
    if (typeof Oasi5Brand !== 'undefined' && Oasi5Brand.render) {
      return Oasi5Brand.render({ size: 'sm' });
    }
    return '<span class="brand-wordmark">Oasi<span class="brand-five">5</span></span>';
  }

  function modeLabel(id) {
    if (typeof NaverTransit !== 'undefined' && NaverTransit.MODES[id]) {
      return NaverTransit.MODES[id].label;
    }
    return id;
  }

  function renderModeTabs(activeMode) {
    var modes = typeof NaverTransit !== 'undefined' ? NaverTransit.MODES : { transit: {}, walk: {}, car: {}, bicycle: {} };
    return Object.keys(modes).map(function (id) {
      var mode = modes[id];
      var active = id === activeMode ? ' is-active' : '';
      return (
        '<button type="button" class="transit-map-mode' + active + '" data-mode="' + id + '">' +
          escapeHtml(mode.label || id) +
        '</button>'
      );
    }).join('');
  }

  function destroyMap() {
    if (mapInstance) {
      try { mapInstance.remove(); } catch (e) {}
      mapInstance = null;
    }
  }

  function renderNativeSteps(route) {
    var TR = typeof TransitRoutes !== 'undefined' ? TransitRoutes : null;
    var steps = TR ? TR.annotateSteps(route.steps || [], state.profileId) : (route.steps || []);
    if (!steps.length) return '<p class="hub-section-note">상세 구간 정보가 없습니다.</p>';
    return (
      '<ol class="transit-step-list">' +
        steps.map(function (step) {
          var icon = TR ? TR.stepIcon(step.type) : 'walk';
          var title = TR ? TR.stepTitle(step) : (step.label || step.instruction || '이동');
          var meta = [];
          if (TR && step.duration != null && step.duration > 0) meta.push(TR.formatDuration(step.duration));
          if (TR && step.distance) meta.push(TR.formatDistance(step.distance));
          if (step.stationCount) meta.push(step.stationCount + '개 역');
          return (
            '<li class="transit-step">' +
              '<span class="transit-step-icon" data-type="' + escapeHtml(icon) + '" aria-hidden="true"></span>' +
              '<div class="transit-step-body">' +
                '<p class="transit-step-title">' + escapeHtml(title) + '</p>' +
                (meta.length ? '<p class="transit-step-meta">' + escapeHtml(meta.join(' · ')) + '</p>' : '') +
                ((step.notes || []).length
                  ? '<ul class="transit-step-notes">' +
                      step.notes.map(function (n) { return '<li>' + escapeHtml(n) + '</li>'; }).join('') +
                    '</ul>'
                  : '') +
              '</div>' +
            '</li>'
          );
        }).join('') +
      '</ol>'
    );
  }

  function renderNativeResult(profile) {
    var TR = typeof TransitRoutes !== 'undefined' ? TransitRoutes : null;
    var routes = state.routes || [];
    var selected = routes[state.selectedRouteIndex] || routes[0];
    var label = modeLabel(state.mode);

    if (state.loading) {
      return (
        '<div class="transit-native-pane">' +
          '<p class="hub-section-note access-loading-note">Oasi5 경로를 찾는 중…</p>' +
        '</div>'
      );
    }

    if (!selected) {
      return (
        '<div class="transit-native-pane">' +
          '<div class="transit-map-empty-card" style="margin:24px auto;">' +
            brandHtml() +
            '<p class="transit-map-empty-title">경로를 찾지 못했습니다</p>' +
            '<p class="transit-map-empty-desc">출발·도착지를 다시 확인하거나, 다른 이동 수단을 선택해 보세요.</p>' +
          '</div>' +
        '</div>'
      );
    }

    var summary = selected.summary || {};
    var comfort = TR && selected.comfortScore != null ? TR.comfortLabel(selected.comfortScore) : null;
    var metaBits = [label, profile.label];
    if (summary.transfers != null) metaBits.push('환승 ' + summary.transfers + '회');
    if (TR && summary.payment != null) metaBits.push(TR.formatPayment(summary.payment));
    if (TR && summary.walkMeters) metaBits.push('도보 ' + TR.formatDistance(summary.walkMeters));

    var cards = routes.map(function (route, i) {
      var s = route.summary || {};
      var c = TR && route.comfortScore != null ? TR.comfortLabel(route.comfortScore) : null;
      var active = i === state.selectedRouteIndex ? ' is-active' : '';
      var routeLabel = TR && TR.localizeTransitText
        ? TR.localizeTransitText(s.label || label)
        : (s.label || label);
      if (!/[가-힣]/.test(String(routeLabel || ''))) routeLabel = label;
      var cardMeta = [routeLabel];
      if (s.transfers != null) cardMeta.push('환승 ' + s.transfers);
      if (s.walkMeters && TR) cardMeta.push('도보 ' + TR.formatDistance(s.walkMeters));
      return (
        '<button type="button" class="transit-route-card' + active + '" data-route-index="' + i + '">' +
          '<span class="transit-route-card-time">' +
            escapeHtml(TR ? TR.formatDuration(s.totalMinutes) : ((s.totalMinutes || '?') + '분')) +
          '</span>' +
          '<span class="transit-route-card-meta">' + escapeHtml(cardMeta.join(' · ')) + '</span>' +
          (c ? '<span class="transit-route-card-comfort ' + c.className + '">' + escapeHtml(c.text) + '</span>' : '') +
        '</button>'
      );
    }).join('');

    var tips = (typeof NaverTransit !== 'undefined' && NaverTransit.getProfileTips)
      ? NaverTransit.getProfileTips(state.profileId)
      : [];

    return (
      '<div class="transit-native-pane">' +
        '<div class="transit-result-layout">' +
          '<div class="transit-detail-panel">' +
            '<div class="transit-detail-summary">' +
              '<p class="transit-detail-time">' +
                escapeHtml(TR ? TR.formatDuration(summary.totalMinutes) : '') +
              '</p>' +
              '<p class="transit-detail-meta">' +
                escapeHtml(metaBits.join(' · ')) +
                (comfort
                  ? ' · <span class="transit-detail-comfort ' + comfort.className + '">' + escapeHtml(comfort.text) + '</span>'
                  : '') +
              '</p>' +
            '</div>' +
            (routes.length > 1 ? '<div class="transit-route-cards">' + cards + '</div>' : '') +
            renderNativeSteps(selected) +
            (tips.length
              ? '<ul class="transit-tip-list">' +
                  tips.slice(0, 2).map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join('') +
                '</ul>'
              : '') +
          '</div>' +
          '<div class="transit-map-wrap">' +
            '<div id="transit-oasi-map" class="transit-map" role="img" aria-label="경로 지도"></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderMapPane() {
    if (!state.showResult) {
      return (
        '<div class="transit-map-empty">' +
          '<div class="transit-map-empty-card">' +
            brandHtml() +
            '<p class="transit-map-empty-title">Oasi5 길찾기</p>' +
            '<p class="transit-map-empty-desc">대중교통·도보·자동차·자전거 경로를 Oasi5에서 바로 안내합니다. 출발지와 도착지를 입력해 주세요.</p>' +
          '</div>' +
        '</div>'
      );
    }
    return renderNativeResult(getProfile(state.profileId));
  }

  function statusHint(profile) {
    if (state.error) return '<p class="transit-map-error">' + escapeHtml(state.error) + '</p>';
    if (state.showResult && state.fromPoint && state.toPoint) {
      return (
        '<p class="transit-map-route">' +
          escapeHtml(state.fromPoint.name) + ' → ' + escapeHtml(state.toPoint.name) +
          ' · ' + escapeHtml(modeLabel(state.mode)) +
          ' · ' + escapeHtml(profile.label) +
          ' · <span class="transit-map-privacy">Oasi5 자체 경로</span>' +
        '</p>'
      );
    }
    return '<p class="transit-map-hint">카카오맵 창이 아니라 Oasi5 길찾기로 안내합니다</p>';
  }

  function render() {
    var profile = getProfile(state.profileId);
    return (
      '<main class="transit-map-shell">' +
        '<header class="transit-map-topbar">' +
          '<div class="transit-map-brand">' +
            brandHtml() +
            '<span class="transit-map-brand-label">길찾기</span>' +
          '</div>' +
          '<div class="transit-map-modes" id="transit-mode-tabs">' + renderModeTabs(state.mode) + '</div>' +
          '<form class="transit-map-form" id="transit-form" autocomplete="off">' +
            '<input type="text" id="transit-from" name="from" class="transit-map-input" placeholder="출발지" value="' + escapeHtml(state.from) + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="출발지" />' +
            '<button type="button" class="transit-map-swap" id="transit-swap" aria-label="출발지와 도착지 바꾸기">⇅</button>' +
            '<input type="text" id="transit-to" name="to" class="transit-map-input" placeholder="도착지" value="' + escapeHtml(state.to) + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="도착지" />' +
            '<button type="submit" class="transit-map-go"' + (state.loading ? ' disabled' : '') + '>' +
              (state.loading ? '…' : '길찾기') +
            '</button>' +
          '</form>' +
        '</header>' +
        '<div class="transit-map-subbar">' +
          '<div class="transit-map-profiles" id="transit-profiles">' +
            PROFILES.map(function (p) {
              var active = p.id === state.profileId ? ' is-active' : '';
              return (
                '<button type="button" class="transit-map-chip' + active + '" data-profile="' + p.id + '" title="' + escapeHtml(p.desc) + '">' +
                  escapeHtml(p.label) +
                '</button>'
              );
            }).join('') +
          '</div>' +
          statusHint(profile) +
        '</div>' +
        renderMapPane() +
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

  function loadRoutes() {
    if (typeof TransitRoutes === 'undefined') {
      state.routes = [];
      state.error = '경로 모듈을 불러오지 못했습니다.';
      state.loading = false;
      mount();
      return;
    }
    if (!state.fromPoint || !state.toPoint || !state.fromPoint.lat || !state.toPoint.lat) {
      state.routes = [];
      state.error = '출발·도착 좌표를 찾지 못했습니다.';
      state.loading = false;
      mount();
      return;
    }

    TransitRoutes.fetchRoutes(state.fromPoint, state.toPoint, state.mode, state.profileId)
      .then(function (data) {
        var list = (data && data.routes) || [];
        state.routeSource = (data && data.source) || '';
        state.routes = TransitRoutes.rankRoutes(list, state.profileId);
        state.selectedRouteIndex = 0;
        state.loading = false;
        state.error = state.routes.length ? '' : '경로를 찾지 못했습니다.';
        mount();
      })
      .catch(function (err) {
        state.routes = [];
        state.loading = false;
        state.error = (err && err.message) || '경로를 불러오지 못했습니다.';
        mount();
      });
  }

  function runRouteSearch() {
    if (!state.from || !state.to) {
      state.error = '출발지와 도착지를 입력해 주세요.';
      state.showResult = false;
      state.routes = [];
      mount();
      return;
    }

    state.error = '';
    state.loading = true;
    state.showResult = true;
    state.routes = [];
    mount();

    var NT = NaverTransit;

    function asPoint(name, point) {
      if (point && point.lat && point.lng) {
        return Object.assign({}, point, { name: name });
      }
      return { name: name, lat: null, lng: null, source: 'text' };
    }

    Promise.all([
      state.fromPoint && state.fromPoint.name === state.from && state.fromPoint.lat
        ? Promise.resolve(state.fromPoint)
        : NT.resolvePoint(state.from).catch(function () { return null; }),
      state.toPoint && state.toPoint.name === state.to && state.toPoint.lat
        ? Promise.resolve(state.toPoint)
        : NT.resolvePoint(state.to).catch(function () { return null; })
    ]).then(function (pts) {
      state.fromPoint = asPoint(state.from, pts[0]);
      state.toPoint = asPoint(state.to, pts[1]);
      if (!state.fromPoint.lat || !state.toPoint.lat) {
        state.loading = false;
        state.error = '출발·도착 위치를 찾지 못했습니다.';
        mount();
        return;
      }
      loadRoutes();
    }).catch(function () {
      state.loading = false;
      state.fromPoint = asPoint(state.from, null);
      state.toPoint = asPoint(state.to, null);
      state.routes = [];
      state.error = '출발·도착 위치를 찾지 못했습니다.';
      mount();
    });
  }

  function paintNativeMap() {
    destroyMap();
    if (typeof L === 'undefined') return;
    var el = document.getElementById('transit-oasi-map');
    var route = state.routes[state.selectedRouteIndex] || state.routes[0];
    if (!el || !route || !state.fromPoint || !state.toPoint) return;

    mapInstance = L.map(el, { zoomControl: true, attributionControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstance);

    var from = [state.fromPoint.lat, state.fromPoint.lng];
    var to = [state.toPoint.lat, state.toPoint.lng];
    L.marker(from, { title: state.fromPoint.name }).addTo(mapInstance);
    L.marker(to, { title: state.toPoint.name }).addTo(mapInstance);

    var line = route.polyline && route.polyline.length >= 2 ? route.polyline : [from, to];
    var poly = L.polyline(line, { color: '#10b981', weight: 5, opacity: 0.9 }).addTo(mapInstance);
    mapInstance.fitBounds(poly.getBounds().pad(0.18));
    setTimeout(function () {
      if (mapInstance) mapInstance.invalidateSize();
    }, 80);
    setTimeout(function () {
      if (mapInstance) mapInstance.invalidateSize();
    }, 320);
  }

  function bindEvents(container) {
    var modeTabs = container.querySelector('#transit-mode-tabs');
    if (modeTabs && !modeTabs.dataset.bound) {
      modeTabs.dataset.bound = '1';
      modeTabs.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-mode]');
        if (!btn) return;
        saveFormState(container);
        state.mode = btn.getAttribute('data-mode');
        state.routes = [];
        state.selectedRouteIndex = 0;
        if (state.from && state.to) runRouteSearch();
        else {
          state.showResult = false;
          mount();
        }
      });
    }

    var profiles = container.querySelector('#transit-profiles');
    if (profiles && !profiles.dataset.bound) {
      profiles.dataset.bound = '1';
      profiles.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-profile]');
        if (!btn) return;
        state.profileId = btn.getAttribute('data-profile');
        if (state.from && state.to && state.fromPoint && state.toPoint) {
          runRouteSearch();
        } else {
          mount();
        }
      });
    }

    var routeCards = container.querySelector('.transit-route-cards');
    if (routeCards && !routeCards.dataset.bound) {
      routeCards.dataset.bound = '1';
      routeCards.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-route-index]');
        if (!btn) return;
        state.selectedRouteIndex = Number(btn.getAttribute('data-route-index')) || 0;
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
        if (state.from && state.to) runRouteSearch();
        else {
          state.showResult = false;
          state.routes = [];
          mount();
        }
      });
    }

    ['from', 'to'].forEach(function (field) {
      var input = container.querySelector('#transit-' + field);
      if (!input || input.dataset.bound) return;
      input.dataset.bound = '1';
      var prefetchTimer = null;
      input.addEventListener('input', function () {
        clearPointIfEdited(field, input.value.trim());
        if (prefetchTimer) clearTimeout(prefetchTimer);
        prefetchTimer = setTimeout(function () {
          var q = input.value.trim();
          if (typeof OasiFast !== 'undefined' && q.length >= 2) OasiFast.prefetchGeocode(q);
        }, 160);
      });
    });

    var form = container.querySelector('#transit-form');
    if (form && !form.dataset.bound) {
      form.dataset.bound = '1';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        saveFormState(container);
        runRouteSearch();
      });
    }
  }

  function mount() {
    var el = document.getElementById('view-transit');
    if (!el) return;
    destroyMap();
    el.innerHTML = render();
    bindEvents(el);
    if (state.showResult && state.routes.length) {
      paintNativeMap();
    }
  }

  return {
    mount: mount,
    PROFILES: PROFILES
  };
})();
