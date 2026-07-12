var CityView = (function () {
  function tt(key, varsOrFb, maybeVars) {
    if (typeof I18n !== 'undefined' && I18n.t) return I18n.t(key, varsOrFb, maybeVars);
    if (varsOrFb && typeof varsOrFb === 'object') return key;
    return varsOrFb != null ? varsOrFb : key;
  }

  function openPlace(region, city, placeId) {
    AppNav.goPlace(placeId, { region: region, city: city });
  }

  function renderList(containerId, items, type, region, city) {
    var ul = document.getElementById(containerId);
    if (!ul) return;
    ul.innerHTML = '';

    if (!items.length) {
      ul.innerHTML = '<li class="empty-msg">' +
        (type === 'help'
          ? tt('city.listEmptyHelp', '등록된 도움 시설이 없습니다.')
          : tt('city.listEmptyDanger', '등록된 위험 지역이 없습니다.')) +
        '</li>';
      return;
    }

    items.forEach(function (place) {
      var li = document.createElement('li');
      li.className = 'place-item city-place-item' + (place.type === 'danger' ? ' danger-item' : '');
      li.innerHTML =
        '<div class="place-item-top">' +
          '<div class="name">' + place.name + '</div>' +
          (typeof PlaceScores !== 'undefined' ? PlaceScores.renderBadge(place, true) : '') +
        '</div>' +
        '<div class="cat">' +
          (typeof PlaceInfo !== 'undefined' && PlaceInfo.categoryLabel ? PlaceInfo.categoryLabel(place.category) : place.category) +
        '</div>' +
        '<div class="preview">' + place.description + '</div>' +
        '<div class="open-hint">' + tt('city.tapHint', '탭하면 상세 정보 보기 →') + '</div>';
      li.addEventListener('click', function () {
        openPlace(region, city, place.id);
      });
      ul.appendChild(li);
    });
  }

  function render(region, city, existingMap) {
    var root = document.getElementById('view-city');
    if (!root) return null;

    if (existingMap) {
      existingMap.remove();
      existingMap = null;
    }

    var cityPlaces = RegionData.getPlacesForCity(region, city);
    if (!cityPlaces.length) {
      root.innerHTML =
        '<div class="app-view-inner"><div class="error-msg"><p>' +
          tt('city.noPlaces', {
            region: (typeof regionDisplayName === 'function' ? regionDisplayName(region) : region),
            city: city
          }) +
        '</p></div></div>';
      return null;
    }

    var helpItems = cityPlaces.filter(function (p) { return p.type === 'help'; });
    var dangerItems = cityPlaces.filter(function (p) { return p.type === 'danger'; });
    var center = RegionData.getCityCenter(region, city);

    root.innerHTML =
      '<div class="app-view-inner city-main">' +
        '<section class="city-hero">' +
          '<p class="city-breadcrumb">' + tt('city.breadcrumb', { region: (typeof regionDisplayName === 'function' ? regionDisplayName(region) : region) }) + '</p>' +
          '<h1>' + city + '</h1>' +
          '<p class="city-summary">' + tt('city.summary', '등록된 도움 시설과 위험 지역입니다. 항목을 누르면 상세 화면으로 이동합니다.') + '</p>' +
          '<div class="city-stats">' +
            '<span class="stat help-stat">' + tt('home.statHelp', '도움') + ' <strong>' + helpItems.length + '</strong></span>' +
            '<span class="stat danger-stat">' + tt('home.statDanger', '위험') + ' <strong>' + dangerItems.length + '</strong></span>' +
          '</div>' +
        '</section>' +
        '<div class="city-layout">' +
          '<section class="city-map-section">' +
            '<h2>' + tt('city.mapTitle', '지도') + '</h2>' +
            '<div id="city-map"></div>' +
          '</section>' +
          '<section class="city-lists">' +
            '<div class="city-list-col">' +
              '<h2><span class="col-icon help"></span> ' + tt('home.helpTitle', '도움 시설') + '</h2>' +
              '<ul id="city-help-list" class="place-list city-place-list"></ul>' +
            '</div>' +
            '<div class="city-list-col">' +
              '<h2><span class="col-icon danger"></span> ' + tt('home.dangerTitle', '위험 지역') + '</h2>' +
              '<ul id="city-danger-list" class="place-list city-place-list"></ul>' +
            '</div>' +
          '</section>' +
        '</div>' +
      '</div>';

    renderList('city-help-list', helpItems, 'help', region, city);
    renderList('city-danger-list', dangerItems, 'danger', region, city);

    var map = L.map('city-map', { zoomControl: true, tap: true, touchZoom: true, dragging: true }).setView(
      center ? [center.lat, center.lng] : [36.2, 127.9],
      center ? center.zoom : 11
    );

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Satellite &copy; Esri',
      maxZoom: 19
    }).addTo(map);

    L.tileLayer('https://tiles.osm.kr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      opacity: 0.5,
      className: 'korean-label-layer',
      interactive: false
    }).addTo(map);

    cityPlaces.forEach(function (place) {
      if (!place.lat || !place.lng || place.lat === 0) return;
      var color = place.type === 'help' ? '#00a854' : '#e53935';
      L.marker([place.lat, place.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;background:' + color + ';border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        }),
        title: place.name
      }).addTo(map).on('click', function () {
        openPlace(region, city, place.id);
      });
    });

    setTimeout(function () { map.invalidateSize(); }, 120);
    return map;
  }

  return { render: render };
})();
