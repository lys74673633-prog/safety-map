var PlaceView = (function () {
  function tt(key, varsOrFb, maybeVars) {
    if (typeof I18n !== 'undefined' && I18n.t) return I18n.t(key, varsOrFb, maybeVars);
    if (varsOrFb && typeof varsOrFb === 'object') return key;
    return varsOrFb != null ? varsOrFb : key;
  }

  function pn(text) {
    return (typeof PlaceI18n !== 'undefined' && PlaceI18n.t) ? PlaceI18n.t(text) : text;
  }

  function renderPhotos(place, photos, isFacility, naverUrl, streetViewUrl) {
    var hero = document.getElementById('hero');
    var grid = document.getElementById('photo-grid');
    var loadingEl = document.getElementById('photo-loading');
    if (!hero || !grid) return;
    if (loadingEl) loadingEl.remove();
    var displayName = pn(place.name);

    if (!photos.length) {
      var emptyHint = isFacility
        ? tt('place.photoFailFacility', { name: displayName })
        : tt('place.photoFailArea', { name: displayName });

      hero.className = 'hero hero-empty';
      hero.innerHTML =
        '<div class="hero-placeholder">' +
          '<p class="hero-status">' + tt('place.photoEmpty', '해당 시설·장소 사진 없음') + '</p>' +
          '<p class="hero-sub">' + emptyHint + '</p>' +
          '<div class="hero-actions">' +
            '<a class="btn primary" href="' + naverUrl + '" target="_blank" rel="noopener">' + tt('place.searchNaver', '네이버 지도에서 검색') + '</a>' +
            '<a class="btn" href="' + streetViewUrl + '" target="_blank" rel="noopener">' + tt('place.streetView', 'Google 거리뷰') + '</a>' +
          '</div>' +
        '</div>';

      grid.innerHTML =
        '<p class="photo-empty">' + emptyHint + ' ' +
          '<a href="' + naverUrl + '" target="_blank" rel="noopener">' + tt('place.naverMap', '네이버 지도') + '</a> · ' +
          '<a href="' + streetViewUrl + '" target="_blank" rel="noopener">' + tt('place.streetView', 'Google 거리뷰') + '</a>' +
        '</p>';
      return;
    }

    var heroPhoto = photos[0];
    hero.className = 'hero';
    hero.innerHTML =
      '<img src="' + heroPhoto.url + '" alt="' + tt('place.photoAlt', { name: displayName }) + '" />' +
      '<span class="hero-label">' + heroPhoto.caption + '</span>';

    grid.innerHTML = '';
    photos.forEach(function (photo, index) {
      var fig = document.createElement('figure');
      fig.className = 'photo-card' + (index === 0 ? ' wide featured' : '');
      fig.innerHTML =
        '<img src="' + photo.url + '" alt="' + tt('place.photoAltN', { name: displayName, n: index + 1 }) + '" loading="lazy" />' +
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
        '<div class="app-view-inner place-main"><div class="error-msg"><p>' +
          tt('place.notFound', '장소를 찾을 수 없습니다.') +
        '</p></div></div>';
      return null;
    }

    var place = places[placeId];
    var displayName = pn(place.name);
    var typeLabel = place.type === 'help' ? tt('place.typeHelp', '도움 시설') : tt('place.typeDanger', '위험 지역');
    var catLabel = typeof PlaceInfo !== 'undefined' && PlaceInfo.categoryLabel
      ? PlaceInfo.categoryLabel(place.category)
      : place.category;
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
        '<img src="' + preloaded[0].url + '" alt="' + tt('place.photoAlt', { name: displayName }) + '" />' +
        '<span class="hero-label">' + preloaded[0].caption + '</span>';
    } else {
      heroInner =
        (satUrl ? '<img src="' + satUrl + '" alt="' + tt('place.satelliteAlt', { name: displayName }) + '" class="hero-satellite" />' : '') +
        '<div class="hero-placeholder">' +
          '<p class="hero-status">' + tt('place.photoLoading', '시설·장소 사진 불러오는 중…') + '</p>' +
          '<p class="hero-sub">' + tt('place.photoLoadingSub', '아래 정보와 지도는 바로 볼 수 있습니다') + '</p>' +
        '</div>';
    }

    root.innerHTML =
      '<div class="app-view-inner place-main">' +
        '<section class="' + heroClass + '" id="hero">' +
          heroInner +
        '</section>' +
        '<section class="place-head ' + (place.type === 'danger' ? 'danger-type' : 'help-type') + '">' +
          '<span class="tag ' + place.type + '">' + typeLabel + ' · ' + catLabel + '</span>' +
          (typeof PlaceScores !== 'undefined' ? PlaceScores.renderMeter(place) : '') +
          '<h1>' + displayName + '</h1>' +
          '<p class="address">' + pn(place.address) + '</p>' +
          '<p class="desc">' + pn(place.summary || place.description) + '</p>' +
          '<div class="meta-row">' +
            PlaceInfo.renderMetaChips(place) +
          '</div>' +
          '<div class="actions">' +
            '<a class="btn primary" href="' + naverUrl + '" target="_blank" rel="noopener">' + tt('place.naverMap', '네이버 지도') + '</a>' +
            '<a class="btn" href="' + streetViewUrl + '" target="_blank" rel="noopener">' + tt('place.streetView', 'Google 거리뷰') + '</a>' +
            '<a class="btn" href="' + googleUrl + '" target="_blank" rel="noopener">' + tt('place.googleMap', 'Google 지도') + '</a>' +
            '<a class="btn" href="' + osmUrl + '" target="_blank" rel="noopener">OpenStreetMap</a>' +
          '</div>' +
        '</section>' +
        PlaceInfo.renderInfoSections(place) +
        '<div class="content-grid">' +
          '<section class="section">' +
            '<h2>' + tt('place.locationMap', '위치 지도') + '</h2>' +
            '<div id="detail-map"></div>' +
          '</section>' +
          '<section class="section">' +
            '<h2>' + tt('place.photosTitle', '시설·장소 사진') + '</h2>' +
            '<p class="section-note">' + tt('place.photosNote', { name: displayName }) + '</p>' +
            '<div class="photo-grid" id="photo-grid">' +
              (preloaded && preloaded.length
                ? preloaded.map(function (photo, index) {
                    return (
                      '<figure class="photo-card' + (index === 0 ? ' wide featured' : '') + '">' +
                        '<img src="' + photo.url + '" alt="' + tt('place.photoAltN', { name: displayName, n: index + 1 }) + '" loading="lazy" />' +
                        '<figcaption>' + photo.caption + '</figcaption>' +
                      '</figure>'
                    );
                  }).join('')
                : '<p class="photo-loading" id="photo-loading">' + tt('place.gridLoading', '사진 불러오는 중…') + '</p>') +
            '</div>' +
          '</section>' +
        '</div>' +
        (typeof PlaceArticles !== 'undefined' ? PlaceArticles.renderSection(place) : '') +
        (typeof PlaceReviews !== 'undefined' ? PlaceReviews.renderSection(placeId) : '') +
      '</div>';

    var map = L.map('detail-map', { zoomControl: true, tap: true, touchZoom: true, dragging: true }).setView([place.lat, place.lng], 16);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Satellite &copy; Esri',
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
