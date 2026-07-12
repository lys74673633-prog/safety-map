(function () {
  var params = new URLSearchParams(window.location.search);
  var region = params.get('region') || '';
  var city = params.get('city') || '';
  var root = document.getElementById('city-root');

  RegionData.enrichPlaces(places);

  function renderError(message) {
    root.innerHTML =
      '<div class="error-msg">' +
      '<p>' + message + '</p>' +
      '<p style="margin-top:12px"><a href="index.html">Oasi5로 돌아가기</a></p>' +
      '</div>';
  }

  if (!region || !city) {
    renderError('지역 또는 도시 정보가 없습니다.');
    document.title = '도시를 찾을 수 없음 · Oasi5';
    return;
  }

  var cityPlaces = RegionData.getPlacesForCity(region, city);
  if (!cityPlaces.length) {
    renderError(region + ' ' + city + '에 등록된 장소가 없습니다.');
    document.title = city + ' · Oasi5';
    return;
  }

  var helpItems = cityPlaces.filter(function (p) { return p.type === 'help'; });
  var dangerItems = cityPlaces.filter(function (p) { return p.type === 'danger'; });
  var center = RegionData.getCityCenter(region, city);

  document.title = region + ' ' + city + ' · Oasi5';

  root.innerHTML =
    '<section class="city-hero">' +
      '<p class="city-breadcrumb">' + region + ' · 시·군</p>' +
      '<h1>' + city + '</h1>' +
      '<p class="city-summary">등록된 도움 시설과 위험 지역입니다. 항목을 클릭하면 사진·상세 정보 페이지가 새 창으로 열립니다.</p>' +
      '<div class="city-stats">' +
        '<span class="stat help-stat">도움 <strong>' + helpItems.length + '</strong></span>' +
        '<span class="stat danger-stat">위험 <strong>' + dangerItems.length + '</strong></span>' +
      '</div>' +
    '</section>' +
    '<div class="city-layout">' +
      '<section class="city-map-section">' +
        '<h2>지도</h2>' +
        '<div id="city-map"></div>' +
      '</section>' +
      '<section class="city-lists">' +
        '<div class="city-list-col">' +
          '<h2><span class="col-icon help"></span> 도움 시설</h2>' +
          '<ul id="city-help-list" class="place-list city-place-list"></ul>' +
        '</div>' +
        '<div class="city-list-col">' +
          '<h2><span class="col-icon danger"></span> 위험 지역</h2>' +
          '<ul id="city-danger-list" class="place-list city-place-list"></ul>' +
        '</div>' +
      '</section>' +
    '</div>';

  function renderList(containerId, items, type) {
    var ul = document.getElementById(containerId);
    if (!items.length) {
      ul.innerHTML = '<li class="empty-msg">등록된 ' + (type === 'help' ? '도움 시설' : '위험 지역') + '이 없습니다.</li>';
      return;
    }

    items.forEach(function (place) {
      var li = document.createElement('li');
      li.className = 'place-item city-place-item' + (place.type === 'danger' ? ' danger-item' : '');
      li.innerHTML =
        '<div class="name">' + place.name + '</div>' +
        '<div class="cat">' + place.category + '</div>' +
        '<div class="preview">' + place.description + '</div>' +
        '<div class="open-hint">클릭하면 사진·상세 정보 새 창 열기 →</div>';
      li.addEventListener('click', function () {
        var url = 'place.html?id=' + place.id
          + '&region=' + encodeURIComponent(region)
          + '&city=' + encodeURIComponent(city);
        window.open(url, '_blank');
      });
      ul.appendChild(li);
    });
  }

  renderList('city-help-list', helpItems, 'help');
  renderList('city-danger-list', dangerItems, 'danger');

  var map = L.map('city-map', { zoomControl: true }).setView(
    center ? [center.lat, center.lng] : [36.2, 127.9],
    center ? center.zoom : 11
  );

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '위성 &copy; Esri',
    maxZoom: 19
  }).addTo(map);

  L.tileLayer('https://tiles.osm.kr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    opacity: 0.5
  }).addTo(map);

  cityPlaces.forEach(function (place) {
    if (!place.lat || !place.lng || place.lat === 0) return;
    var color = place.type === 'help' ? '#00a854' : '#e53935';
    var marker = L.marker([place.lat, place.lng], {
      icon: L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;background:' + color + ';border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      }),
      title: place.name
    }).addTo(map);

    marker.on('click', function () {
      window.open(
        'place.html?id=' + place.id + '&region=' + encodeURIComponent(region) + '&city=' + encodeURIComponent(city),
        '_blank'
      );
    });
  });

  setTimeout(function () { map.invalidateSize(); }, 100);
})();
