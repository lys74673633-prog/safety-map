(function (global) {
  var STORAGE_KEY = 'oasi5-lang';
  var current = 'ko';

  var STRINGS = {
    ko: {
      'nav.home': '지도',
      'nav.articles': '기사·정보',
      'nav.access': '시설 추천',
      'nav.transit': '길찾기',
      'nav.back': '← 뒤로',
      'legend.help': '도움 시설',
      'legend.danger': '위험 지역',
      'theme.light': '낮',
      'theme.dark': '밤',
      'theme.group': '테마 선택',
      'lang.ko': '한',
      'lang.en': 'EN',
      'lang.group': '언어 선택',
      'brand.tagline': '사회적 약자를 위한 도움·안전 정보',
      'city.pick': '시·군 선택',
      'transit.title': '길찾기',
      'transit.from': '출발지',
      'transit.to': '도착지',
      'transit.go': '길찾기',
      'transit.loading': '…',
      'transit.swap': '출발지와 도착지 바꾸기',
      'transit.hint': '카카오맵 창이 아니라 Oasi5 길찾기로 안내합니다',
      'transit.emptyTitle': 'Oasi5 길찾기',
      'transit.emptyDesc': '대중교통·도보·자동차·자전거 경로를 Oasi5에서 바로 안내합니다. 출발지와 도착지를 입력해 주세요.',
      'transit.needBoth': '출발지와 도착지를 입력해 주세요.',
      'transit.noCoords': '출발·도착 좌표를 찾지 못했습니다.',
      'transit.noRoute': '경로를 찾지 못했습니다.',
      'transit.finding': 'Oasi5 경로를 찾는 중…',
      'transit.mode.transit': '대중교통',
      'transit.mode.walk': '도보',
      'transit.mode.car': '자동차',
      'transit.mode.bicycle': '자전거',
      'transit.transfer': '환승',
      'transit.walkPart': '도보',
      'transit.ownRoute': 'Oasi5 자체 경로',
      'access.search': '검색',
      'access.searching': '검색 중…',
      'access.placeholder': '가게 될 곳',
      'access.statusIdle': '가고 싶은 장소를 입력한 뒤 검색하면 주변 카페·식당·쇼핑을 추천합니다.',
      'access.statusLoading': '목적지를 찾는 중…',
      'access.statusFail': '위치를 찾지 못했습니다. 장소명을 바꿔 다시 검색해 주세요.',
      'access.around': '주변',
      'access.cafe': '카페',
      'access.food': '식당',
      'access.shop': '가게·쇼핑'
    },
    en: {
      'nav.home': 'Map',
      'nav.articles': 'News',
      'nav.access': 'Places',
      'nav.transit': 'Directions',
      'nav.back': '← Back',
      'legend.help': 'Help spots',
      'legend.danger': 'Hazard areas',
      'theme.light': 'Day',
      'theme.dark': 'Night',
      'theme.group': 'Theme',
      'lang.ko': '한',
      'lang.en': 'EN',
      'lang.group': 'Language',
      'brand.tagline': 'Help and safety info for people who need it',
      'city.pick': 'Choose city',
      'transit.title': 'Directions',
      'transit.from': 'From',
      'transit.to': 'To',
      'transit.go': 'Go',
      'transit.loading': '…',
      'transit.swap': 'Swap from and to',
      'transit.hint': 'Oasi5 directions — not a Kakao Map window',
      'transit.emptyTitle': 'Oasi5 Directions',
      'transit.emptyDesc': 'Get transit, walk, drive, and bike routes in Oasi5. Enter a start and destination.',
      'transit.needBoth': 'Please enter both start and destination.',
      'transit.noCoords': 'Could not find start or destination coordinates.',
      'transit.noRoute': 'No route found.',
      'transit.finding': 'Finding an Oasi5 route…',
      'transit.mode.transit': 'Transit',
      'transit.mode.walk': 'Walk',
      'transit.mode.car': 'Drive',
      'transit.mode.bicycle': 'Bike',
      'transit.transfer': 'Transfers',
      'transit.walkPart': 'Walk',
      'transit.ownRoute': 'Oasi5 route',
      'access.search': 'Search',
      'access.searching': 'Searching…',
      'access.placeholder': 'Where are you going?',
      'access.statusIdle': 'Search a place to get nearby cafes, restaurants, and shops.',
      'access.statusLoading': 'Finding your destination…',
      'access.statusFail': 'Location not found. Try a different place name.',
      'access.around': 'Near',
      'access.cafe': 'Cafes',
      'access.food': 'Food',
      'access.shop': 'Shopping'
    }
  };

  function getLang() {
    return current === 'en' ? 'en' : 'ko';
  }

  function t(key, fallback) {
    var pack = STRINGS[getLang()] || STRINGS.ko;
    if (pack[key] != null) return pack[key];
    if (STRINGS.ko[key] != null) return STRINGS.ko[key];
    return fallback != null ? fallback : key;
  }

  function applyDom() {
    document.documentElement.setAttribute('lang', getLang() === 'en' ? 'en' : 'ko');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      el.setAttribute('placeholder', t(key));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (!key) return;
      el.setAttribute('aria-label', t(key));
    });
    updateLangToggleUI();
    if (global.ThemeManager && typeof global.ThemeManager.refreshLabels === 'function') {
      global.ThemeManager.refreshLabels();
    }
  }

  function updateLangToggleUI() {
    document.querySelectorAll('.lang-switch-btn').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === getLang();
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    var group = document.getElementById('lang-switch');
    if (group) group.setAttribute('aria-label', t('lang.group'));
  }

  function setLang(lang, opts) {
    current = lang === 'en' ? 'en' : 'ko';
    try {
      localStorage.setItem(STORAGE_KEY, current);
    } catch (e) {}
    applyDom();
    if (!(opts && opts.silent)) {
      try {
        document.dispatchEvent(new CustomEvent('oasi5:langchange', { detail: { lang: current } }));
      } catch (e) {}
    }
  }

  function mountToggle(container) {
    if (!container || container.dataset.mounted) return;
    container.dataset.mounted = '1';
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', t('lang.group'));
    container.innerHTML =
      '<button type="button" class="lang-switch-btn" data-lang="ko" aria-pressed="false">' + t('lang.ko') + '</button>' +
      '<button type="button" class="lang-switch-btn" data-lang="en" aria-pressed="false">' + t('lang.en') + '</button>';
    container.addEventListener('click', function (e) {
      var btn = e.target.closest('.lang-switch-btn');
      if (!btn) return;
      setLang(btn.getAttribute('data-lang'));
    });
    updateLangToggleUI();
  }

  function init() {
    var stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}
    if (stored !== 'en' && stored !== 'ko') {
      stored = (document.documentElement.getAttribute('lang') === 'en') ? 'en' : 'ko';
    }
    current = stored;
    mountToggle(document.getElementById('lang-switch'));
    applyDom();
  }

  global.I18n = {
    init: init,
    t: t,
    get: getLang,
    set: setLang,
    apply: applyDom
  };
})(window);
