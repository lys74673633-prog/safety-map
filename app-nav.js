var AppNav = (function () {
  var TOP_VIEWS = ['home', 'articles', 'access', 'transit'];

  var state = {
    view: 'home',
    region: null,
    city: null,
    placeId: null,
    back: null
  };

  var cityMapInstance = null;
  var placeMapInstance = null;

  function parseHash() {
    var raw = (location.hash || '#/').replace(/^#/, '');
    var split = raw.indexOf('?');
    var path = split >= 0 ? raw.slice(0, split) : raw;
    var query = new URLSearchParams(split >= 0 ? raw.slice(split + 1) : '');
    var segs = path.split('/').filter(Boolean);

    if (!segs.length) return { view: 'home' };

    if (segs[0] === 'articles') return { view: 'articles' };
    if (segs[0] === 'access') return { view: 'access' };
    if (segs[0] === 'transit') return { view: 'transit' };

    if (segs[0] === 'city' && segs[1] && segs[2]) {
      return {
        view: 'city',
        region: decodeURIComponent(segs[1]),
        city: decodeURIComponent(segs[2])
      };
    }

    if (segs[0] === 'place' && segs[1]) {
      return {
        view: 'place',
        placeId: Number(segs[1]),
        region: query.get('region'),
        city: query.get('city')
      };
    }

    return { view: 'home' };
  }

  function setHash(route, replace) {
    var hash = '#/';
    if (route.view === 'articles') {
      hash = '#/articles';
    } else if (route.view === 'access') {
      hash = '#/access';
    } else if (route.view === 'transit') {
      hash = '#/transit';
    } else if (route.view === 'city') {
      hash = '#/city/' + encodeURIComponent(route.region) + '/' + encodeURIComponent(route.city);
    } else if (route.view === 'place') {
      hash = '#/place/' + route.placeId;
      if (route.region && route.city) {
        hash += '?region=' + encodeURIComponent(route.region) + '&city=' + encodeURIComponent(route.city);
      }
    }
    if (replace) {
      history.replaceState(null, '', hash);
    } else if (location.hash !== hash) {
      location.hash = hash;
    }
  }

  function destroyCityMap() {
    if (cityMapInstance) {
      cityMapInstance.remove();
      cityMapInstance = null;
    }
  }

  function destroyPlaceMap() {
    if (placeMapInstance) {
      placeMapInstance.remove();
      placeMapInstance = null;
    }
  }

  function updateHeaderNav() {
    var nav = document.getElementById('header-nav');
    if (!nav) return;
    var showNav = TOP_VIEWS.indexOf(state.view) >= 0;
    nav.classList.toggle('hidden', !showNav);
    if (!showNav) return;

    nav.querySelectorAll('.header-nav-btn').forEach(function (btn) {
      var target = btn.getAttribute('data-nav');
      btn.classList.toggle('active', target === state.view);
    });
  }

  function updateHeader() {
    var backBtn = document.getElementById('nav-back');
    var legend = document.querySelector('.header .legend');
    if (!backBtn) return;

    function tt(key, varsOrFb, maybeVars) {
      if (typeof I18n !== 'undefined' && I18n.t) return I18n.t(key, varsOrFb, maybeVars);
      if (varsOrFb && typeof varsOrFb === 'object') return key;
      return varsOrFb != null ? varsOrFb : key;
    }

    updateHeaderNav();

    if (TOP_VIEWS.indexOf(state.view) >= 0) {
      backBtn.classList.add('hidden');
      if (legend) legend.classList.toggle('hidden', state.view !== 'home');
      if (state.view === 'home') document.title = tt('title.home', 'Oasi5');
      else if (state.view === 'articles') document.title = tt('title.articles', '소식 · Oasi5');
      else if (state.view === 'access') document.title = tt('title.access', '시설 추천 · Oasi5');
      else if (state.view === 'transit') document.title = tt('title.transit', '길찾기 · Oasi5');
      return;
    }

    backBtn.classList.remove('hidden');
    if (legend) legend.classList.add('hidden');

    if (state.view === 'city') {
      backBtn.textContent = tt('nav.backHome', '← 지도 홈');
      document.title = tt('title.city', { region: state.region, city: state.city });
    } else if (state.view === 'place') {
      if (state.back && state.back.region && state.back.city) {
        backBtn.textContent = '← ' + state.back.region + ' ' + state.back.city;
      } else {
        backBtn.textContent = tt('nav.backHome', '← 지도 홈');
      }
      var place = typeof places !== 'undefined' ? places[state.placeId] : null;
      document.title = tt('title.place', { name: place ? place.name : tt('place.unnamed', '장소') });
    }
  }

  function showView(name) {
    ['view-home', 'view-city', 'view-place', 'view-articles', 'view-access', 'view-transit'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var active = id === 'view-' + name;
      el.classList.toggle('hidden', !active);
      el.classList.toggle('app-view-active', active);
    });
    document.body.dataset.view = name;
    window.scrollTo(0, 0);
  }

  function renderRoute(route) {
    if (route.view === 'home') {
      destroyCityMap();
      destroyPlaceMap();
      state = { view: 'home', region: null, city: null, placeId: null, back: null };
      showView('home');
      updateHeader();
      if (typeof window.onAppHomeShow === 'function') window.onAppHomeShow();
      return;
    }

    if (route.view === 'articles') {
      destroyCityMap();
      destroyPlaceMap();
      state = { view: 'articles', region: null, city: null, placeId: null, back: null };
      showView('articles');
      updateHeader();
      if (typeof ArticlesHub !== 'undefined') ArticlesHub.mount();
      return;
    }

    if (route.view === 'access') {
      destroyCityMap();
      destroyPlaceMap();
      state = { view: 'access', region: null, city: null, placeId: null, back: null };
      showView('access');
      updateHeader();
      if (typeof DisabilityAccess !== 'undefined') DisabilityAccess.mount();
      return;
    }

    if (route.view === 'transit') {
      destroyCityMap();
      destroyPlaceMap();
      state = { view: 'transit', region: null, city: null, placeId: null, back: null };
      showView('transit');
      updateHeader();
      if (typeof TransitGuide !== 'undefined') TransitGuide.mount();
      return;
    }

    if (route.view === 'city') {
      destroyPlaceMap();
      state = {
        view: 'city',
        region: route.region,
        city: route.city,
        placeId: null,
        back: null
      };
      showView('city');
      updateHeader();
      if (typeof CityView !== 'undefined') {
        cityMapInstance = CityView.render(route.region, route.city, cityMapInstance);
      }
      return;
    }

    if (route.view === 'place') {
      destroyCityMap();
      state = {
        view: 'place',
        region: route.region,
        city: route.city,
        placeId: route.placeId,
        back: route.region && route.city ? { region: route.region, city: route.city } : null
      };
      showView('place');
      updateHeader();
      if (typeof PlaceView !== 'undefined') {
        placeMapInstance = PlaceView.render(route.placeId, route.region, route.city, placeMapInstance);
      }
    }
  }

  function navigate(route, replace) {
    setHash(route, replace);
    if (replace) {
      renderRoute(route);
    }
  }

  function goHome(replace) {
    navigate({ view: 'home' }, replace);
  }

  function goArticles(replace) {
    navigate({ view: 'articles' }, replace);
  }

  function goAccess(replace) {
    navigate({ view: 'access' }, replace);
  }

  function goTransit(replace) {
    navigate({ view: 'transit' }, replace);
  }

  function goCity(region, city, replace) {
    navigate({ view: 'city', region: region, city: city }, replace);
  }

  function goPlace(id, ctx, replace) {
    navigate({
      view: 'place',
      placeId: id,
      region: ctx && ctx.region,
      city: ctx && ctx.city
    }, replace);
  }

  function back() {
    if (state.view === 'place' && state.back) {
      goCity(state.back.region, state.back.city);
    } else {
      goHome();
    }
  }

  function bindHeaderNav() {
    var nav = document.getElementById('header-nav');
    if (!nav || nav.dataset.bound) return;
    nav.dataset.bound = '1';

    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('.header-nav-btn');
      if (!btn) return;
      var target = btn.getAttribute('data-nav');
      if (target === 'home') goHome();
      else if (target === 'articles') goArticles();
      else if (target === 'access') goAccess();
      else if (target === 'transit') goTransit();
    });
  }

  function refreshLanguage() {
    if (typeof I18n !== 'undefined') I18n.apply();
    updateHeader();
    if (state.view === 'home') {
      if (typeof window.onAppHomeShow === 'function') window.onAppHomeShow();
    }
    if (state.view === 'transit' && typeof TransitGuide !== 'undefined') TransitGuide.mount();
    if (state.view === 'access' && typeof DisabilityAccess !== 'undefined') DisabilityAccess.mount();
    if (state.view === 'articles' && typeof ArticlesHub !== 'undefined') ArticlesHub.mount();
    if (state.view === 'city' && typeof CityView !== 'undefined' && state.region && state.city) {
      cityMapInstance = CityView.render(state.region, state.city, cityMapInstance);
    }
    if (state.view === 'place' && typeof PlaceView !== 'undefined' && state.placeId != null) {
      placeMapInstance = PlaceView.render(state.placeId, state.region, state.city, placeMapInstance);
    }
  }

  function init() {
    var backBtn = document.getElementById('nav-back');
    if (backBtn) {
      backBtn.addEventListener('click', back);
    }

    bindHeaderNav();

    var brandLink = document.querySelector('.brand-lockup');
    if (brandLink) {
      brandLink.addEventListener('click', function (e) {
        e.preventDefault();
        goHome();
      });
    }

    window.addEventListener('hashchange', function () {
      renderRoute(parseHash());
    });

    var initial = parseHash();
    if (initial.view !== 'home') {
      renderRoute(initial);
    } else {
      setHash({ view: 'home' }, true);
      updateHeader();
    }
  }

  return {
    init: init,
    goHome: goHome,
    goArticles: goArticles,
    goAccess: goAccess,
    goTransit: goTransit,
    goCity: goCity,
    goPlace: goPlace,
    back: back,
    refreshLanguage: refreshLanguage,
    getState: function () { return state; }
  };
})();
