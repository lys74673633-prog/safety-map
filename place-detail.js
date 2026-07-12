(function () {
  var params = new URLSearchParams(window.location.search);
  var id = Number(params.get('id'));
  var root = document.getElementById('place-root');

  if (!Number.isInteger(id) || id < 0 || id >= places.length) {
    root.innerHTML =
      '<div class="error-msg">' +
      '<p>장소를 찾을 수 없습니다.</p>' +
      '<p style="margin-top:12px"><a href="index.html">Oasi5로 돌아가기</a></p>' +
      '</div>';
    document.title = '장소를 찾을 수 없음 · Oasi5';
    return;
  }

  var place = places[id];
  if (typeof RegionData !== 'undefined') {
    RegionData.enrichPlaces(places);
  }
  var typeLabel = place.type === 'help' ? '도움 시설' : '위험 지역';
  var googleUrl = PhotoLoader.getGoogleMapUrl(place);
  var osmUrl = 'https://www.openstreetmap.org/?mlat=' + place.lat + '&mlon=' + place.lng + '#map=17/' + place.lat + '/' + place.lng;
  var streetViewUrl = PhotoLoader.getStreetViewUrl(place.lat, place.lng);
  var naverUrl = PhotoLoader.getNaverMapUrl(place.name, place.address);
  var isFacility = PhotoLoader.isNamedFacility(place);
  var satUrl = typeof getSatelliteImageUrl === 'function'
    ? getSatelliteImageUrl(place.lat, place.lng)
    : '';

  document.title = place.name + ' · Oasi5';

  var backLink = document.getElementById('place-back-link');
  var fromRegion = params.get('region');
  var fromCity = params.get('city');
  if (backLink && fromRegion && fromCity) {
    backLink.href = 'city.html?region=' + encodeURIComponent(fromRegion) + '&city=' + encodeURIComponent(fromCity);
    backLink.textContent = '← ' + fromRegion + ' ' + fromCity + ' 목록';
  }

  root.innerHTML =
    '<section class="hero hero-loading" id="hero">' +
      (satUrl
        ? '<img src="' + satUrl + '" alt="' + place.name + ' 위성 이미지" class="hero-satellite" />'
        : '') +
      '<div class="hero-placeholder">' +
        '<p class="hero-status">시설·장소 사진 검색 중…</p>' +
        '<p class="hero-sub">위 정보와 지도는 바로 볼 수 있습니다</p>' +
      '</div>' +
    '</section>' +
    '<section class="place-head ' + (place.type === 'danger' ? 'danger-type' : 'help-type') + '">' +
      '<span class="tag ' + place.type + '">' + typeLabel + ' · ' + place.category + '</span>' +
      '<h1>' + place.name + '</h1>' +
      '<p class="address">' + place.address + '</p>' +
      '<p class="desc">' + place.description + '</p>' +
      '<div class="meta-row">' +
        '<span class="meta-chip">지역 ' + place.region + '</span>' +
        (place.city ? '<span class="meta-chip">' + place.city + '</span>' : '') +
        '<span class="meta-chip">위도 ' + place.lat.toFixed(5) + '</span>' +
        '<span class="meta-chip">경도 ' + place.lng.toFixed(5) + '</span>' +
      '</div>' +
      '<div class="actions">' +
        '<a class="btn primary" href="' + naverUrl + '" target="_blank" rel="noopener">네이버 지도</a>' +
        '<a class="btn" href="' + streetViewUrl + '" target="_blank" rel="noopener">Google 거리뷰</a>' +
        '<a class="btn" href="' + googleUrl + '" target="_blank" rel="noopener">Google 지도</a>' +
        '<a class="btn" href="' + osmUrl + '" target="_blank" rel="noopener">OpenStreetMap</a>' +
      '</div>' +
    '</section>' +
    PlaceInfo.renderInfoSections(place) +
    '<div class="content-grid">' +
      '<section class="section">' +
        '<h2>위치 지도</h2>' +
        '<div id="detail-map"></div>' +
      '</section>' +
      '<section class="section">' +
        '<h2>시설·장소 사진</h2>' +
        '<p class="section-note">' + (isFacility
          ? '복지관·센터 등은 해당 시설 이름과 일치하는 사진만 표시합니다. 관련 없는 거리 사진은 넣지 않습니다.'
          : '장소 이름과 일치하는 사진만 표시합니다.') + '</p>' +
        '<div class="photo-grid" id="photo-grid">' +
          '<p class="photo-loading" id="photo-loading">사진 검색 중…</p>' +
        '</div>' +
      '</section>' +
    '</div>';

  var map = L.map('detail-map', { zoomControl: true }).setView([place.lat, place.lng], 16);

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '위성 &copy; Esri',
    maxZoom: 19
  }).addTo(map);

  L.tileLayer('https://tiles.osm.kr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    opacity: 0.55
  }).addTo(map);

  var markerColor = place.type === 'help' ? '#00a854' : '#e53935';
  L.marker([place.lat, place.lng], {
    icon: L.divIcon({
      className: '',
      html: '<div style="width:16px;height:16px;background:' + markerColor + ';border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    })
  }).addTo(map);

  setTimeout(function () {
    map.invalidateSize();
  }, 100);

  PhotoLoader.loadRealPhotos(place).then(function (photos) {
    renderPhotos(photos);
  }).catch(function () {
    renderPhotos([]);
  });

  function renderPhotos(photos) {
    var hero = document.getElementById('hero');
    var grid = document.getElementById('photo-grid');
    var loadingEl = document.getElementById('photo-loading');
    if (loadingEl) loadingEl.remove();

    if (photos.length === 0) {
      var emptyHint = isFacility
        ? '공개 DB에 「' + place.name + '」 사진이 없습니다. 네이버 지도에서 검색하면 건물 사진을 볼 수 있는 경우가 많습니다.'
        : '공개 DB에 「' + place.name + '」와 일치하는 사진이 없습니다. 네이버 지도나 Google 거리뷰에서 확인해 보세요.';

      hero.className = 'hero hero-empty';
      hero.innerHTML =
        '<div class="hero-placeholder">' +
          '<p class="hero-status">해당 시설·장소 사진 없음</p>' +
          '<p class="hero-sub">' + emptyHint + '</p>' +
          '<div class="hero-actions">' +
            '<a class="btn primary" href="' + naverUrl + '" target="_blank" rel="noopener">네이버 지도에서 검색</a>' +
            '<a class="btn" href="' + streetViewUrl + '" target="_blank" rel="noopener">Google 거리뷰</a>' +
          '</div>' +
        '</div>';

      grid.innerHTML =
        '<p class="photo-empty">' + emptyHint + ' ' +
          '<a href="' + naverUrl + '" target="_blank" rel="noopener">네이버 지도</a> · ' +
          '<a href="' + streetViewUrl + '" target="_blank" rel="noopener">Google 거리뷰</a>' +
        '</p>';
      return;
    }

    var heroPhoto = photos[0];
    hero.className = 'hero';
    hero.innerHTML =
      '<img src="' + heroPhoto.url + '" alt="' + place.name + ' 사진" />' +
      '<span class="hero-label">' + heroPhoto.caption + '</span>';

    grid.innerHTML = '';
    photos.forEach(function (photo, index) {
      var fig = document.createElement('figure');
      fig.className = 'photo-card' + (index === 0 ? ' wide featured' : '');
      fig.innerHTML =
        '<img src="' + photo.url + '" alt="' + place.name + ' 사진 ' + (index + 1) + '" loading="lazy" />' +
        '<figcaption>' + photo.caption + '</figcaption>';
      grid.appendChild(fig);
    });
  }
})();
