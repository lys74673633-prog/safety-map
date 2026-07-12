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
    error: ''
  };

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

  function kakaoDirectionsUrl(fromPoint, toPoint, modeId) {
    if (typeof NaverTransit !== 'undefined' && fromPoint && toPoint && fromPoint.lat && toPoint.lat) {
      return NaverTransit.buildKakaoRouteUrl(fromPoint, toPoint, modeId || state.mode);
    }
    var fromName = encodeURIComponent((fromPoint && fromPoint.name) || state.from || '출발');
    var toName = encodeURIComponent((toPoint && toPoint.name) || state.to || '도착');
    return 'https://map.kakao.com/?sName=' + fromName + '&eName=' + toName;
  }

  function renderRoutePanel(profile) {
    return (
      '<section class="hub-section transit-route-panel">' +
        '<div class="transit-mode-tabs" id="transit-mode-tabs">' + renderModeTabs(state.mode) + '</div>' +
        '<form class="transit-route-form" id="transit-form">' +
          '<div class="transit-route-inputs">' +
            '<div class="transit-route-row">' +
              '<span class="transit-route-dot transit-route-dot-from" aria-hidden="true"></span>' +
              '<input type="text" id="transit-from" name="from" class="transit-input transit-route-input" placeholder="출발지" value="' + escapeHtml(state.from) + '" autocomplete="off" aria-label="출발지" />' +
            '</div>' +
            '<button type="button" class="transit-swap-btn" id="transit-swap" aria-label="출발지와 도착지 바꾸기">⇅</button>' +
            '<div class="transit-route-row">' +
              '<span class="transit-route-dot transit-route-dot-to" aria-hidden="true"></span>' +
              '<input type="text" id="transit-to" name="to" class="transit-input transit-route-input" placeholder="도착지" value="' + escapeHtml(state.to) + '" autocomplete="off" aria-label="도착지" />' +
            '</div>' +
          '</div>' +
          (state.error ? '<p class="transit-error">' + escapeHtml(state.error) + '</p>' : '') +
          '<button type="submit" class="transit-submit transit-route-submit"' + (state.loading ? ' disabled' : '') + '>' +
            (state.loading ? '길 찾는 중…' : '길찾기') +
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

  function renderRouteResult(profile, fromPoint, toPoint) {
    if (!fromPoint || !toPoint) return '';
    var kakaoUrl = kakaoDirectionsUrl(fromPoint, toPoint, state.mode);
    var modeLabel = typeof NaverTransit !== 'undefined'
      ? (NaverTransit.getMode(state.mode).label || '길찾기')
      : '길찾기';

    return (
      '<section class="hub-section transit-result" id="transit-result">' +
        '<div class="transit-result-head">' +
          '<h2>' + escapeHtml(modeLabel) + ' · ' + escapeHtml(profile.label) + '</h2>' +
          '<p class="hub-section-note">' +
            escapeHtml(fromPoint.name) + ' → ' + escapeHtml(toPoint.name) +
          '</p>' +
        '</div>' +
        '<div class="transit-kakao-embed-wrap">' +
          '<iframe class="transit-kakao-embed" title="카카오맵 길찾기" src="' + escapeHtml(kakaoUrl) + '" loading="eager" referrerpolicy="no-referrer-when-downgrade"></iframe>' +
        '</div>' +
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
          '</h1>' +
          '<p class="hub-hero-lead">출발지와 도착지를 입력하면 카카오맵 길찾기로 안내합니다.</p>' +
        '</div>' +
        renderRoutePanel(profile) +
        (showResult && state.fromPoint && state.toPoint
          ? renderRouteResult(profile, state.fromPoint, state.toPoint)
          : (
            '<section class="hub-section transit-empty">' +
              '<p class="hub-section-note">출발지와 도착지를 입력한 뒤 「길찾기」를 눌러 주세요.</p>' +
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
      state.loading = false;
      state.fromPoint = asPoint(state.from, pts[0]);
      state.toPoint = asPoint(state.to, pts[1]);
      state.showResult = true;
      mount();
      var result = document.querySelector('#transit-result');
      if (result) result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function () {
      state.loading = false;
      state.fromPoint = asPoint(state.from, null);
      state.toPoint = asPoint(state.to, null);
      state.showResult = true;
      mount();
    });
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
        if (state.from && state.to) runRouteSearch();
        else mount();
      });
    }

    var profiles = container.querySelector('#transit-profiles');
    if (profiles && !profiles.dataset.bound) {
      profiles.dataset.bound = '1';
      profiles.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-profile]');
        if (!btn) return;
        state.profileId = btn.getAttribute('data-profile');
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
        mount();
      });
    }

    ['from', 'to'].forEach(function (field) {
      var input = container.querySelector('#transit-' + field);
      if (!input || input.dataset.bound) return;
      input.dataset.bound = '1';
      input.addEventListener('input', function () {
        clearPointIfEdited(field, input.value.trim());
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
    el.innerHTML = render(state.showResult);
    bindEvents(el);
  }

  return {
    mount: mount,
    PROFILES: PROFILES
  };
})();
