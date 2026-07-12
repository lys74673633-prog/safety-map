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

  function brandHtml() {
    if (typeof Oasi5Brand !== 'undefined' && Oasi5Brand.render) {
      return Oasi5Brand.render({ size: 'sm' });
    }
    return '<span class="brand-wordmark">Oasi<span class="brand-five">5</span></span>';
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

  function kakaoDirectionsUrl(fromPoint, toPoint, modeId) {
    if (typeof NaverTransit !== 'undefined' && fromPoint && toPoint && fromPoint.lat && toPoint.lat) {
      return NaverTransit.buildKakaoRouteUrl(fromPoint, toPoint, modeId || state.mode);
    }
    var fromName = encodeURIComponent((fromPoint && fromPoint.name) || state.from || '출발');
    var toName = encodeURIComponent((toPoint && toPoint.name) || state.to || '도착');
    return 'https://map.kakao.com/?sName=' + fromName + '&eName=' + toName;
  }

  function kakaoFrameSrc() {
    if (state.showResult && state.fromPoint && state.toPoint) {
      return kakaoDirectionsUrl(state.fromPoint, state.toPoint, state.mode);
    }
    return 'https://map.kakao.com/';
  }

  function render() {
    var profile = getProfile(state.profileId);
    var frameSrc = kakaoFrameSrc();
    var openUrl = state.showResult && state.fromPoint && state.toPoint
      ? kakaoDirectionsUrl(state.fromPoint, state.toPoint, state.mode)
      : 'https://map.kakao.com/';

    return (
      '<main class="transit-map-shell">' +
        '<header class="transit-map-topbar">' +
          '<div class="transit-map-brand">' +
            brandHtml() +
            '<span class="transit-map-brand-label">길찾기</span>' +
          '</div>' +
          '<div class="transit-map-modes" id="transit-mode-tabs">' + renderModeTabs(state.mode) + '</div>' +
          '<form class="transit-map-form" id="transit-form">' +
            '<input type="text" id="transit-from" name="from" class="transit-map-input" placeholder="출발지" value="' + escapeHtml(state.from) + '" autocomplete="off" aria-label="출발지" />' +
            '<button type="button" class="transit-map-swap" id="transit-swap" aria-label="출발지와 도착지 바꾸기">⇅</button>' +
            '<input type="text" id="transit-to" name="to" class="transit-map-input" placeholder="도착지" value="' + escapeHtml(state.to) + '" autocomplete="off" aria-label="도착지" />' +
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
          (state.error
            ? '<p class="transit-map-error">' + escapeHtml(state.error) + '</p>'
            : (state.showResult && state.fromPoint && state.toPoint
              ? '<p class="transit-map-route">' +
                  escapeHtml(state.fromPoint.name) + ' → ' + escapeHtml(state.toPoint.name) +
                  ' · ' + escapeHtml(profile.label) +
                  ' · <a class="transit-map-open" href="' + escapeHtml(openUrl) + '" target="_blank" rel="noopener noreferrer">새 창</a>' +
                '</p>'
              : '<p class="transit-map-hint">출발·도착을 입력하면 지도에서 경로를 보여 줍니다.</p>')) +
        '</div>' +
        '<div class="transit-map-frame-clip">' +
          '<iframe class="transit-map-frame" id="transit-kakao-frame" title="Oasi5 길찾기" src="' + escapeHtml(frameSrc) + '" loading="eager" referrerpolicy="no-referrer-when-downgrade"></iframe>' +
        '</div>' +
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
        if (state.from && state.to) runRouteSearch();
        else {
          state.showResult = false;
          mount();
        }
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
    el.innerHTML = render();
    bindEvents(el);
  }

  return {
    mount: mount,
    PROFILES: PROFILES
  };
})();
