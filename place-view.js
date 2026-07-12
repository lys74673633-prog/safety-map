var PlaceView = (function () {
  function renderPhotos(place, photos, isFacility, naverUrl, streetViewUrl) {
    var hero = document.getElementById('hero');
    var grid = document.getElementById('photo-grid');
    var loadingEl = document.getElementById('photo-loading');
    if (!hero || !grid) return;
    if (loadingEl) loadingEl.remove();

    if (!photos.length) {
      var emptyHint = isFacility
        ? '「' + place.name + '」 사진을 불러오지 못했습니다. 네이버 지도에서 검색해 보세요.'
        : '「' + place.name + '」 사진을 불러오지 못했습니다. 네이버 지도나 Google 거리뷰에서 확인해 보세요.';

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

  function render(placeId, fromRegion, fromCity, existingMap) {
    var root = document.getElementById('view-place');
    if (!root) return null;

    if (existingMap) {
      existingMap.remove();
      existingMap = null;
    }

    if (!Number.isInteger(placeId) || placeId < 0 || placeId >= places.length) {
      root.innerHTML =
        '<div class="app-view-inner place-main"><div class="error-msg"><p>장소를 찾을 수 없습니다.</p></div></div>';
      return null;
    }

    var place = places[placeId];
    var typeLabel = place.type === 'help' ? '도움 시설' : '위험 지역';
    var googleUrl = PhotoLoader.getGoogleMapUrl(place);
    var osmUrl = 'https://www.openstreetmap.org/?mlat=' + place.lat + '&mlon=' + place.lng + '#map=17/' + place.lat + '/' + place.lng;
    var streetViewUrl = PhotoLoader.getStreetViewUrl(place.lat, place.lng);
    var naverUrl = PhotoLoader.getNaverMapUrl(place.name, place.address);
    var isFacility = PhotoLoader.isNamedFacility(place);
    var satUrl = typeof getSatelliteImageUrl === 'function'
      ? getSatelliteImageUrl(place.lat, place.lng)
      : '';

    var preloaded = typeof PLACE_IMAGES !== 'undefined' && PLACE_IMAGES[place.name];
    var heroClass = preloaded && preloaded.length ? 'hero' : 'hero hero-loading';
    var heroInner = '';
    if (preloaded && preloaded.length) {
      heroInner =
        '<img src="' + preloaded[0].url + '" alt="' + place.name + ' 사진" />' +
        '<span class="hero-label">' + preloaded[0].caption + '</span>';
    } else {
      heroInner =
        (satUrl ? '<img src="' + satUrl + '" alt="' + place.name + ' 위성 이미지" class="hero-satellite" />' : '') +
        '<div class="hero-placeholder">' +
          '<p class="hero-status">시설·장소 사진 불러오는 중…</p>' +
          '<p class="hero-sub">아래 정보와 지도는 바로 볼 수 있습니다</p>' +
        '</div>';
    }

    root.innerHTML =
      '<div class="app-view-inner place-main">' +
        '<section class="' + heroClass + '" id="hero">' +
          heroInner +
        '</section>' +
        '<section class="place-head ' + (place.type === 'danger' ? 'danger-type' : 'help-type') + '">' +
          '<span class="tag ' + place.type + '">' + typeLabel + ' · ' + place.category + '</span>' +
          (typeof PlaceScores !== 'undefined' ? PlaceScores.renderMeter(place) : '') +
          '<h1>' + place.name + '</h1>' +
          '<p class="address">' + place.address + '</p>' +
          '<p class="desc">' + (place.summary || place.description) + '</p>' +
          '<div class="meta-row">' +
            PlaceInfo.renderMetaChips(place) +
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
            '<p class="section-note">네이버·공개 DB에서 찾은 「' + place.name + '」 관련 사진입니다.</p>' +
            '<div class="photo-grid" id="photo-grid">' +
              (preloaded && preloaded.length
                ? preloaded.map(function (photo, index) {
                    return (
                      '<figure class="photo-card' + (index === 0 ? ' wide featured' : '') + '">' +
                        '<img src="' + photo.url + '" alt="' + place.name + ' 사진 ' + (index + 1) + '" loading="lazy" />' +
                        '<figcaption>' + photo.caption + '</figcaption>' +
                      '</figure>'
                    );
                  }).join('')
                : '<p class="photo-loading" id="photo-loading">사진 불러오는 중…</p>') +
            '</div>' +
          '</section>' +
        '</div>' +
        (typeof PlaceArticles !== 'undefined' ? PlaceArticles.renderSection(place) : '') +
        (typeof PlaceReviews !== 'undefined' ? PlaceReviews.renderSection(placeId) : '') +
      '</div>';

    var map = L.map('detail-map', { zoomControl: true, tap: true, touchZoom: true, dragging: true }).setView([place.lat, place.lng], 16);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '위성 &copy; Esri',
      maxZoom: 19
    }).addTo(map);

    L.tileLayer('https://tiles.osm.kr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      opacity: 0.55,
      className: 'korean-label-layer',
      interactive: false
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

    setTimeout(function () { map.invalidateSize(); }, 120);

    if (preloaded && preloaded.length) {
      if (typeof PlaceReviews !== 'undefined') {
        PlaceReviews.mount(placeId);
      }
      return map;
    }

    PhotoLoader.loadRealPhotos(place).then(function (photos) {
      renderPhotos(place, photos, isFacility, naverUrl, streetViewUrl);
    }).catch(function () {
      renderPhotos(place, [], isFacility, naverUrl, streetViewUrl);
    });

    if (typeof PlaceReviews !== 'undefined') {
      PlaceReviews.mount(placeId);
    }

    return map;
  }

  return { render: render };
})();
