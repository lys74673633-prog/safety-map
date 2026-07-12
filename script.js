var REGIONS = {
  '전국': { center: [36.2, 127.9], zoom: 7 },
  '서울': { center: [37.5665, 126.978], zoom: 11 },
  '부산': { center: [35.1796, 129.0756], zoom: 11 },
  '대구': { center: [35.8714, 128.6014], zoom: 11 },
  '인천': { center: [37.4563, 126.7052], zoom: 11 },
  '광주': { center: [35.1595, 126.8526], zoom: 11 },
  '대전': { center: [36.3504, 127.3845], zoom: 11 },
  '울산': { center: [35.5384, 129.3114], zoom: 11 },
  '세종': { center: [36.4801, 127.289], zoom: 12 },
  '경기': { center: [37.4138, 127.5183], zoom: 9 },
  '강원': { center: [37.8228, 128.1555], zoom: 8 },
  '충북': { center: [36.6424, 127.489], zoom: 9 },
  '충남': { center: [36.5184, 126.800], zoom: 9 },
  '전북': { center: [35.8242, 127.148], zoom: 9 },
  '전남': { center: [34.8161, 126.463], zoom: 9 },
  '경북': { center: [36.4919, 128.8889], zoom: 8 },
  '경남': { center: [35.4606, 128.2132], zoom: 9 },
  '제주': { center: [33.4996, 126.5312], zoom: 10 }
};

var REGION_BOUNDS = {
  '서울': { minLat: 37.41, maxLat: 37.72, minLng: 126.73, maxLng: 127.22 },
  '부산': { minLat: 34.95, maxLat: 35.35, minLng: 128.85, maxLng: 129.35 },
  '대구': { minLat: 35.72, maxLat: 36.00, minLng: 128.42, maxLng: 128.78 },
  '인천': { minLat: 37.35, maxLat: 37.58, minLng: 126.55, maxLng: 126.82 },
  '광주': { minLat: 35.05, maxLat: 35.28, minLng: 126.72, maxLng: 127.00 },
  '대전': { minLat: 36.25, maxLat: 36.48, minLng: 127.30, maxLng: 127.55 },
  '울산': { minLat: 35.40, maxLat: 35.70, minLng: 129.20, maxLng: 129.50 },
  '세종': { minLat: 36.42, maxLat: 36.65, minLng: 127.18, maxLng: 127.38 },
  '경기': { minLat: 36.95, maxLat: 38.10, minLng: 126.65, maxLng: 127.65 },
  '강원': { minLat: 37.00, maxLat: 38.50, minLng: 127.50, maxLng: 129.40 },
  '충북': { minLat: 36.30, maxLat: 37.20, minLng: 127.30, maxLng: 128.30 },
  '충남': { minLat: 36.00, maxLat: 37.00, minLng: 126.00, maxLng: 127.60 },
  '전북': { minLat: 35.20, maxLat: 36.10, minLng: 126.40, maxLng: 127.80 },
  '전남': { minLat: 34.20, maxLat: 35.70, minLng: 125.90, maxLng: 127.60 },
  '경북': { minLat: 35.50, maxLat: 37.20, minLng: 127.80, maxLng: 129.60 },
  '경남': { minLat: 34.70, maxLat: 35.70, minLng: 127.60, maxLng: 129.30 },
  '제주': { minLat: 33.10, maxLat: 33.60, minLng: 126.15, maxLng: 126.98 }
};



var currentRegion = '전국';
var selectedIndex = null;
var markers = [];

function getRegionAtPoint(lat, lng) {
  var found = null;
  Object.keys(REGION_BOUNDS).forEach(function (name) {
    var b = REGION_BOUNDS[name];
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) {
      found = name;
    }
  });
  return found;
}

function getFilteredPlaces() {
  if (currentRegion === '전국') return places;
  return places.filter(function (p) { return p.region === currentRegion; });
}

var map = L.map('map', {
  zoomControl: true,
  tap: true,
  touchZoom: true,
  dragging: true,
  scrollWheelZoom: true
}).setView(REGIONS['전국'].center, REGIONS['전국'].zoom);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: '위성 &copy; Esri',
  maxZoom: 19
}).addTo(map);

L.tileLayer('https://tiles.osm.kr/hot/{z}/{x}/{y}.png', {
  maxZoom: 19,
  opacity: 0.5,
  className: 'korean-label-layer',
  interactive: false
}).addTo(map);

function createIcon(type, active) {
  var color = type === 'help' ? '#34d399' : '#f87171';
  var size = active ? 18 : 14;
  var border = active ? 3 : 2;
  return L.divIcon({
    className: '',
    html: '<div style="width:' + size + 'px;height:' + size + 'px;background:' + color + ';border:' + border + 'px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

places.forEach(function (place) {
  var marker = L.marker([place.lat, place.lng], {
    icon: createIcon(place.type, false),
    title: place.name
  }).addTo(map);

  marker.on('click', function (e) {
    L.DomEvent.stopPropagation(e);
    selectRegion(place.region, false);
    RegionData.openPlacePage(place.id, { region: place.region, city: place.city });
  });

  markers[place.id] = marker;
});

map.on('click', function (e) {
  var region = getRegionAtPoint(e.latlng.lat, e.latlng.lng);
  if (region) {
    selectRegion(region, true);
  }
});

function buildRegionBar() {
  var bar = document.getElementById('region-bar');
  if (!bar) return;
  bar.innerHTML = '';
  Object.keys(REGIONS).forEach(function (name) {
    var btn = document.createElement('button');
    btn.className = 'region-btn' + (name === currentRegion ? ' active' : '');
    btn.type = 'button';
    btn.setAttribute('data-region', name);
    btn.textContent = regionDisplayName(name);
    btn.addEventListener('click', function () {
      selectRegion(name, true);
    });
    bar.appendChild(btn);
  });
}

function tt(key, varsOrFb, maybeVars) {
  if (typeof I18n !== 'undefined' && I18n.t) return I18n.t(key, varsOrFb, maybeVars);
  if (varsOrFb && typeof varsOrFb === 'object') return key;
  return varsOrFb != null ? varsOrFb : key;
}

function regionDisplayName(name) {
  if (!name) return '';
  var key = 'region.' + name;
  var translated = tt(key, name);
  if (translated && translated !== key) return translated;
  if (name === '전국') return tt('home.nation', '전국');
  return name;
}

function renderCityBar() {
  var cityBar = document.getElementById('city-bar');
  var label = document.getElementById('city-bar-label');
  var buttons = document.getElementById('city-bar-buttons');

  if (currentRegion === '전국') {
    cityBar.classList.add('hidden');
    buttons.innerHTML = '';
    return;
  }

  var cities = RegionData.getCitiesForRegion(currentRegion);
  if (!cities.length) {
    cityBar.classList.add('hidden');
    buttons.innerHTML = '';
    return;
  }

  cityBar.classList.remove('hidden');
  label.textContent = tt('home.cityPickFor', { region: regionDisplayName(currentRegion) });
  buttons.innerHTML = '';

  cities.forEach(function (city) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'city-btn';
    btn.innerHTML =
      city.label +
      '<span class="city-btn-count">' + tt('home.cityCount', { help: city.help, danger: city.danger }) + '</span>';
    btn.addEventListener('click', function () {
      RegionData.openCityPage(currentRegion, city.name);
    });
    buttons.appendChild(btn);
  });
}

function selectRegion(name, fly) {
  currentRegion = name;
  selectedIndex = null;

  document.querySelectorAll('.region-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.getAttribute('data-region') === name);
  });

  if (fly && REGIONS[name]) {
    map.flyTo(REGIONS[name].center, REGIONS[name].zoom, { duration: 0.8 });
  }

  renderCityBar();
  renderPanel();
  if (typeof GrowthChart !== 'undefined') {
    GrowthChart.render('growth-chart', name);
  }
}

function selectPlace(id) {
  selectedIndex = id;
  var place = places[id];

  markers.forEach(function (m, i) {
    m.setIcon(createIcon(places[i].type, i === id));
  });

  map.setView([place.lat, place.lng], Math.max(map.getZoom(), 14));

  var card = document.getElementById('detail-card');
  card.className = 'detail-card ' + (place.type === 'danger' ? 'danger-type' : '');
  card.innerHTML =
    '<span class="tag ' + place.type + '">' + (place.type === 'help' ? tt('place.typeHelp', '도움 시설') : tt('place.typeDanger', '위험 지역')) + ' · ' +
      (typeof PlaceInfo !== 'undefined' && PlaceInfo.categoryLabel ? PlaceInfo.categoryLabel(place.category) : place.category) + '</span>' +
    (typeof PlaceScores !== 'undefined' ? PlaceScores.renderBadge(place) : '') +
    '<h4>' + place.name + '</h4>' +
    '<p class="address">' + place.address + '</p>' +
    '<p class="desc">' + place.description + '</p>' +
    PlaceInfo.renderInfoSectionsCompact(place) +
    '<button type="button" class="detail-link detail-link-btn">' + tt('home.viewDetail', '사진·전체 상세 보기 →') + '</button>';
  card.classList.remove('hidden');
  card.querySelector('.detail-link-btn').addEventListener('click', function () {
    RegionData.openPlacePage(place.id, { region: place.region, city: place.city });
  });

  document.querySelectorAll('.place-item').forEach(function (el) {
    el.classList.toggle('active', Number(el.dataset.id) === id);
  });
}

function openPlace(id) {
  selectPlace(id);
}

function renderList(containerId, items, type) {
  var ul = document.getElementById(containerId);
  ul.innerHTML = '';

  if (items.length === 0) {
    ul.innerHTML = '<li class="empty-msg">' +
      (type === 'help' ? tt('home.listEmptyHelp', '해당 지역에 등록된 도움 시설이 없습니다.') : tt('home.listEmptyDanger', '해당 지역에 등록된 위험 지역이 없습니다.')) +
      '</li>';
    return;
  }

  items.forEach(function (place) {
    var li = document.createElement('li');
    li.className = 'place-item' + (place.type === 'danger' ? ' danger-item' : '') + (place.id === selectedIndex ? ' active' : '');
    li.dataset.id = place.id;
    li.innerHTML =
      '<div class="place-item-top">' +
        '<div class="name">' + place.name + '</div>' +
        (typeof PlaceScores !== 'undefined' ? PlaceScores.renderBadge(place, true) : '') +
      '</div>' +
      '<div class="cat">' +
        (typeof PlaceInfo !== 'undefined' && PlaceInfo.categoryLabel ? PlaceInfo.categoryLabel(place.category) : place.category) +
      '</div>' +
      '<div class="preview">' + place.description + '</div>' +
      '<div class="open-hint">' + tt('home.tapHint', '탭하면 상세 화면으로 이동 →') + '</div>';
    li.addEventListener('click', function () {
      RegionData.openPlacePage(place.id, { region: place.region, city: place.city });
    });
    ul.appendChild(li);
  });
}

function renderPanel() {
  var filtered = getFilteredPlaces();
  var helpItems = filtered.filter(function (p) { return p.type === 'help'; });
  var dangerItems = filtered.filter(function (p) { return p.type === 'danger'; });

  document.getElementById('panel-region').textContent = regionDisplayName(currentRegion);
  document.getElementById('panel-summary').textContent =
    currentRegion === '전국'
      ? tt('home.summaryNational', '전국 도움 시설과 위험 지역 목록입니다. 지역을 선택하면 아래에 시·군 버튼이 나타납니다.')
      : tt('home.summaryRegion', { region: regionDisplayName(currentRegion) });
  document.getElementById('stat-help').textContent = helpItems.length;
  document.getElementById('stat-danger').textContent = dangerItems.length;

  var helpTitle = document.querySelector('#info-panel .panel-col:first-child h3');
  var dangerTitle = document.querySelector('#info-panel .panel-col:last-child h3');
  if (helpTitle) helpTitle.innerHTML = '<span class="col-icon help"></span> ' + tt('home.helpTitle', '도움 시설');
  if (dangerTitle) dangerTitle.innerHTML = '<span class="col-icon danger"></span> ' + tt('home.dangerTitle', '위험 지역');
  var mapHint = document.querySelector('.map-hint');
  if (mapHint) mapHint.textContent = tt('home.mapHint', '지역 → 시·군 → 시설 순으로 앱 안에서 이동합니다');
  var helpStat = document.querySelector('.help-stat');
  var dangerStat = document.querySelector('.danger-stat');
  if (helpStat) helpStat.innerHTML = tt('home.statHelp', '도움') + ' <strong id="stat-help">' + helpItems.length + '</strong>';
  if (dangerStat) dangerStat.innerHTML = tt('home.statDanger', '위험') + ' <strong id="stat-danger">' + dangerItems.length + '</strong>';
  var footerSources = document.getElementById('footer-sources');
  if (footerSources) footerSources.textContent = tt('footer.sources', '데이터 출처: 공공복지시설, 여성긴급전화1366, TAAS 교통사고다발지역 등');

  renderList('help-list', helpItems, 'help');
  renderList('danger-list', dangerItems, 'danger');

  if (selectedIndex !== null) {
    var stillVisible = filtered.some(function (p) { return p.id === selectedIndex; });
    if (stillVisible) {
      selectPlace(selectedIndex);
    } else {
      document.getElementById('detail-card').classList.add('hidden');
      markers.forEach(function (m, i) {
        m.setIcon(createIcon(places[i].type, false));
      });
      selectedIndex = null;
    }
  } else {
    document.getElementById('detail-card').classList.add('hidden');
  }
}

buildRegionBar();
renderPanel();
if (typeof GrowthChart !== 'undefined') {
  GrowthChart.render('growth-chart', currentRegion);
}

window.onAppHomeShow = function () {
  buildRegionBar();
  renderCityBar();
  renderPanel();
  setTimeout(function () {
    map.invalidateSize();
  }, 120);
};
