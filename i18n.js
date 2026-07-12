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
      'nav.backHome': '← 지도 홈',
      'legend.help': '도움 시설',
      'legend.danger': '위험 지역',
      'theme.light': '낮',
      'theme.dark': '밤',
      'theme.group': '테마 선택',
      'lang.ko': '한',
      'lang.en': 'EN',
      'lang.group': '언어 선택',
      'brand.tagline': '사회적 약자를 위한 도움·안전 정보',
      'title.home': 'Oasi5',
      'title.articles': '소식 · Oasi5',
      'title.access': '시설 추천 · Oasi5',
      'title.transit': '길찾기 · Oasi5',
      'title.city': '{region} {city} · Oasi5',
      'title.place': '{name} · Oasi5',
      'place.unnamed': '장소',
      'home.cityPick': '시·군 선택',
      'home.cityPickFor': '{region} 시·군 선택',
      'home.mapHint': '지역 → 시·군 → 시설 순으로 앱 안에서 이동합니다',
      'home.nation': '전국',
      'region.전국': '전국',
      'region.서울': '서울',
      'region.부산': '부산',
      'region.대구': '대구',
      'region.인천': '인천',
      'region.광주': '광주',
      'region.대전': '대전',
      'region.울산': '울산',
      'region.세종': '세종',
      'region.경기': '경기',
      'region.강원': '강원',
      'region.충북': '충북',
      'region.충남': '충남',
      'region.전북': '전북',
      'region.전남': '전남',
      'region.경북': '경북',
      'region.경남': '경남',
      'region.제주': '제주',
      'home.summaryNational': '전국 도움 시설과 위험 지역 목록입니다. 지역을 선택하면 아래에 시·군 버튼이 나타납니다.',
      'home.summaryRegion': '{region} 지역입니다. 시·군을 선택하면 해당 도시 화면으로 이동합니다.',
      'home.summaryList': '등록된 도움 시설과 위험 지역 목록입니다.',
      'home.statHelp': '도움',
      'home.statDanger': '위험',
      'home.helpTitle': '도움 시설',
      'home.dangerTitle': '위험 지역',
      'home.listEmptyHelp': '해당 지역에 등록된 도움 시설이 없습니다.',
      'home.listEmptyDanger': '해당 지역에 등록된 위험 지역이 없습니다.',
      'home.viewDetail': '사진·전체 상세 보기 →',
      'home.tapHint': '탭하면 상세 화면으로 이동 →',
      'home.cityCount': '도움 {help} · 위험 {danger}',
      'footer.sources': '데이터 출처: 공공복지시설, 여성긴급전화1366, TAAS 교통사고다발지역 등',
      'city.noPlaces': '{region} {city}에 등록된 장소가 없습니다.',
      'city.summary': '등록된 도움 시설과 위험 지역입니다. 항목을 누르면 상세 화면으로 이동합니다.',
      'city.mapTitle': '지도',
      'city.tapHint': '탭하면 상세 정보 보기 →',
      'city.listEmpty': '등록된 도움 시설/위험 지역이 없습니다.',
      'city.listEmptyHelp': '등록된 도움 시설이 없습니다.',
      'city.listEmptyDanger': '등록된 위험 지역이 없습니다.',
      'city.breadcrumb': '{region} · 시·군',
      'place.notFound': '장소를 찾을 수 없습니다.',
      'place.typeHelp': '도움 시설',
      'place.typeDanger': '위험 지역',
      'place.photoLoading': '시설·장소 사진 불러오는 중…',
      'place.photoLoadingSub': '아래 정보와 지도는 바로 볼 수 있습니다',
      'place.photoEmpty': '해당 시설·장소 사진 없음',
      'place.searchNaver': '네이버 지도에서 검색',
      'place.naverMap': '네이버 지도',
      'place.streetView': 'Google 거리뷰',
      'place.googleMap': 'Google 지도',
      'place.locationMap': '위치 지도',
      'place.photosTitle': '시설·장소 사진',
      'place.photosNote': '네이버·공개 DB에서 찾은 「{name}」 관련 사진입니다.',
      'place.gridLoading': '사진 불러오는 중…',
      'place.photoFailFacility': '「{name}」 사진을 불러오지 못했습니다. 네이버 지도에서 검색해 보세요.',
      'place.photoFailArea': '「{name}」 사진을 불러오지 못했습니다. 네이버 지도나 Google 거리뷰에서 확인해 보세요.',
      'place.photoAlt': '{name} 사진',
      'place.photoAltN': '{name} 사진 {n}',
      'place.satelliteAlt': '{name} 위성 이미지',
      'articles.translated': '번역',
      'articles.cnnSource': 'CNN · 번역',
      'articles.thumb': '기사',
      'articles.open': '원문 기사 보기 →',
      'articles.openNaver': '네이버 뉴스에서 기사 보기 →',
      'articles.openCnn': 'CNN 원문 기사 보기 →',
      'articles.openGoogle': 'Google 뉴스에서 기사 보기 →',
      'articles.related': '관련 키워드',
      'articles.sectionTitle': '최근 보도',
      'articles.sectionNote': '네이버·Google·CNN 기사를 모아 자동으로 갱신합니다. CNN 등 영문 기사는 한국어로 번역합니다.',
      'articles.refreshing': '기사 자동 갱신 중…',
      'articles.error': '최신 기사를 불러오지 못했습니다. 잠시 후 자동으로 다시 시도합니다.',
      'articles.lastUpdated': '마지막 갱신: {time}',
      'tag.장애인': '장애인',
      'tag.안내견': '안내견',
      'tag.여성·아동': '여성·아동',
      'tag.스토킹': '스토킹',
      'tag.디지털성범죄': '디지털성범죄',
      'tag.노인': '노인',
      'tag.교통·보행': '교통·보행',
      'tag.아동': '아동',
      'tag.CNN': 'CNN',
      'access.meters': '{n}미터',
      'access.kilometers': '{n}킬로미터',
      'transit.checking': '경로 확인',
      'transit.min': '{n}분',
      'transit.hour': '{n}시간',
      'transit.hourMin': '{h}시간 {m}분',
      'transit.meters': '{n}미터',
      'transit.kilometers': '{n}킬로미터',
      'transit.won': '{n}원',
      'transit.transfersN': '환승 {n}회',
      'transit.transfersShort': '환승 {n}',
      'transit.walkMeta': '도보 {dist}',
      'transit.depart': '출발',
      'transit.arrive': '도착',
      'transit.walkStep': '{from} → {to} 도보',
      'transit.bus': '버스',
      'transit.subway': '지하철',
      'transit.carMove': '자동차 이동',
      'transit.bikeMove': '자전거 이동',
      'transit.move': '이동',
      'transit.note.stairs': '계단·육교 대신 엘리베이터·경사로가 있는 출입구를 선택하세요.',
      'transit.note.slope': '경사·횡단보도가 있으면 여유 있게 이동하세요.',
      'transit.note.longWalk': '도보 구간이 깁니다. 휴식이 필요하면 중간에 벤치·역 대합실을 이용하세요.',
      'transit.note.elevator': '역사 내 엘리베이터·휠체어 리프트 위치를 안내판에서 확인하세요.',
      'transit.note.transfer': '환승 통로가 길 수 있으니 환승 시간을 넉넉히 잡으세요.',
      'transit.note.voice': '브레일·음성 안내가 필요하면 역무원에게 도움을 요청할 수 있습니다.',
      'transit.note.lowFloor': '저상버스·리프트 버스 여부는 정류장·차량 앞 표시를 확인하세요.',
      'transit.note.seating': '교통약자·임산부석·우선석 이용이 가능합니다.',
      'access.destTitle': '가게 될 곳',
      'access.placeholder': '가고 싶은 장소',
      'access.search': '검색',
      'access.searching': '검색 중…',
      'access.statusLoading': '목적지를 찾는 중…',
      'access.statusIdle': '가고 싶은 장소를 입력한 뒤 검색하면 주변 카페·식당·쇼핑을 추천합니다.',
      'access.statusFail': '위치를 찾지 못했습니다. 장소명을 바꿔 다시 검색해 주세요.',
      'access.statusActive': '{place} 주변 {km}km 이내 시설을 가까운 순으로 보여줍니다.',
      'access.intro': '가고 싶은 장소를 입력하면 그 주변 카페·식당·쇼핑을 바로 추천합니다.',
      'access.cafe': '카페',
      'access.food': '식당',
      'access.shop': '가게·쇼핑',
      'access.cafeNote': '접근이 비교적 쉬운 카페',
      'access.foodNote': '통로·엘리베이터가 있는 식당',
      'access.shopNote': '마트·쇼핑몰 위주',
      'access.sectionLoading': '주변 관련 장소를 찾는 중…',
      'access.sectionEmpty': '「{place}」 근처 {category} 추천이 없습니다.',
      'access.sectionHeader': '「{place}」 주변 · {note}',
      'access.audienceLabel': '도움이 되는 분',
      'access.source.naver': '네이버',
      'access.source.nearby': '주변검색',
      'access.openMap': '지도 열기',
      'access.directions': '길찾기',
      'access.nearbyAudience': '휠체어·유모차·보행 보조 — 주변 검색',
      'access.nearbyNote': '목적지에서 {dist} 거리입니다. 입장 전 계단·통로 여부를 확인하세요.',
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
      'transit.noRoute': '경로를 찾지 못했습니다',
      'transit.noRouteHint': '출발·도착지를 다시 확인하거나, 다른 이동 수단을 선택해 보세요.',
      'transit.finding': 'Oasi5 경로를 찾는 중…',
      'transit.mode.transit': '대중교통',
      'transit.mode.walk': '도보',
      'transit.mode.car': '자동차',
      'transit.mode.bicycle': '자전거',
      'transit.transfer': '환승',
      'transit.walkPart': '도보',
      'transit.ownRoute': 'Oasi5 자체 경로',
      'transit.noSteps': '상세 구간 정보가 없습니다.',
      'transit.mapAria': '경로 지도',
      'transit.error.module': '경로 모듈을 불러오지 못했습니다.',
      'transit.error.load': '경로를 불러오지 못했습니다.',
      'transit.noLocation': '출발·도착 위치를 찾지 못했습니다.',
      'transit.stations': '{n}개 역',
      'transit.profile.wheelchair': '휠체어',
      'transit.profile.wheelchair.desc': '엘리베이터·저상버스 위주',
      'transit.profile.stroller': '유모차',
      'transit.profile.stroller.desc': '넓은 통로·엘리베이터',
      'transit.profile.walker': '보행 보조기',
      'transit.profile.walker.desc': '짧은 도보·완만한 경사',
      'transit.profile.visual': '시각장애·안내견',
      'transit.profile.visual.desc': '음성 안내·안내견 동반',
      'transit.profile.elderly': '고령·보행 느림',
      'transit.profile.elderly.desc': '환승 적게·좌석 우선',
      'transit.comfort.best': '매우 편함',
      'transit.comfort.good': '편함',
      'transit.comfort.ok': '보통',
      'transit.comfort.caution': '주의',
      'transit.tip.wheelchair1': '저상버스·리프트 버스는 정류장과 차량 앞 표시를 확인하세요.',
      'transit.tip.wheelchair2': '역사 환승 시 엘리베이터 간 이동 거리가 길 수 있으니 환승 시간을 넉넉히 잡으세요.',
      'transit.tip.stroller1': '유모차는 엘리베이터·완만한 경사로가 있는 역·쇼핑몰 연결 통로를 우선 선택하세요.',
      'transit.tip.stroller2': '에스컬레이터만 있는 출구는 피하고 엘리베이터 표시 출구를 이용하세요.',
      'transit.tip.walker1': '도보 구간이 긴 경로는 버스·지하철로 나누어 이동하면 부담이 줄어듭니다.',
      'transit.tip.walker2': '휴식이 필요하면 역사 내 의자·대합실을 이용할 수 있습니다.',
      'transit.tip.visual1': '시각장애인 안내견은 「장애인 보조견」 표시와 함께 대중교통에 동반 탑승할 수 있습니다.',
      'transit.tip.visual2': '역사 브레일·음성 안내 시설은 역무원에게 문의하면 안내받을 수 있습니다.',
      'transit.tip.elderly1': '환승 횟수가 적은 경로를 우선 선택하면 이동 부담이 줄어듭니다.',
      'transit.tip.elderly2': '지하철·버스 교통약자 좌석·우선석 이용이 가능합니다.',
      'score.help': '도움 {n}%',
      'score.danger': '위험 {n}%',
      'score.helpLabel': '도움 정도',
      'score.dangerLabel': '위험도',
      'score.helpTitle': '도움 정도: 서비스 접근성·지원 범위 기준',
      'score.dangerTitle': '위험도: 사고·피해 가능성 기준',
      'score.helpNote': '전화·홈페이지·프로그램·공식 시설 정보 등을 반영한 도움 지수입니다.',
      'score.dangerNote': 'TAAS·지형·관광·교통 특성 등을 반영한 위험 지수입니다.',
      'cat.장애인 시설': '장애인 시설',
      'cat.여성 안전': '여성 안전',
      'cat.아동 안전': '아동 안전',
      'cat.복합 복지 시설': '복합 복지 시설',
      'cat.노인복지 시설': '노인복지 시설',
      'cat.보행자 안전': '보행자 안전',
      'cat.노인 안전': '노인 안전',
      'cat.관광객 안전': '관광객 안전',
      'cat.교통 안전': '교통 안전',
      'place.whyHelp': '왜 도움이 되나요?',
      'place.whyDanger': '왜 주의가 필요한가요?',
      'place.infoTitle': '이용 정보',
      'place.howTo': '이용 방법',
      'place.phone': '전화',
      'place.hours': '이용시간',
      'place.operator': '운영',
      'place.website': '홈페이지',
      'place.regionChip': '지역 {region}',
      'place.canDo': '할 수 있는 일',
      'place.canDoHere': '이곳에서 할 수 있는 것',
      'place.canDoShort': '할 수 있는 것'
    },
    en: {
      'nav.home': 'Map',
      'nav.articles': 'News',
      'nav.access': 'Places',
      'nav.transit': 'Directions',
      'nav.back': '← Back',
      'nav.backHome': '← Map home',
      'legend.help': 'Help spots',
      'legend.danger': 'Hazard areas',
      'theme.light': 'Day',
      'theme.dark': 'Night',
      'theme.group': 'Theme',
      'lang.ko': '한',
      'lang.en': 'EN',
      'lang.group': 'Language',
      'brand.tagline': 'Help and safety info for people who need it',
      'title.home': 'Oasi5',
      'title.articles': 'News · Oasi5',
      'title.access': 'Places · Oasi5',
      'title.transit': 'Directions · Oasi5',
      'title.city': '{region} {city} · Oasi5',
      'title.place': '{name} · Oasi5',
      'place.unnamed': 'Place',
      'home.cityPick': 'Choose city',
      'home.cityPickFor': 'Choose a city in {region}',
      'home.mapHint': 'Region → city → place — browse inside the app',
      'home.nation': 'Nationwide',
      'region.전국': 'Nationwide',
      'region.서울': 'Seoul',
      'region.부산': 'Busan',
      'region.대구': 'Daegu',
      'region.인천': 'Incheon',
      'region.광주': 'Gwangju',
      'region.대전': 'Daejeon',
      'region.울산': 'Ulsan',
      'region.세종': 'Sejong',
      'region.경기': 'Gyeonggi',
      'region.강원': 'Gangwon',
      'region.충북': 'North Chungcheong',
      'region.충남': 'South Chungcheong',
      'region.전북': 'North Jeolla',
      'region.전남': 'South Jeolla',
      'region.경북': 'North Gyeongsang',
      'region.경남': 'South Gyeongsang',
      'region.제주': 'Jeju',
      'home.summaryNational': 'Help spots and hazard areas nationwide. Pick a region to see city buttons.',
      'home.summaryRegion': '{region} region. Pick a city to open its map.',
      'home.summaryList': 'Registered help spots and hazard areas.',
      'home.statHelp': 'Help',
      'home.statDanger': 'Hazard',
      'home.helpTitle': 'Help spots',
      'home.dangerTitle': 'Hazard areas',
      'home.listEmptyHelp': 'No help spots registered in this area.',
      'home.listEmptyDanger': 'No hazard areas registered in this area.',
      'home.viewDetail': 'Photos & full details →',
      'home.tapHint': 'Tap for details →',
      'home.cityCount': 'Help {help} · Hazard {danger}',
      'footer.sources': 'Sources: public welfare facilities, Women’s Hotline 1366, TAAS crash hotspots, and more',
      'city.noPlaces': 'No places registered for {region} {city}.',
      'city.summary': 'Registered help spots and hazard areas. Tap an item for details.',
      'city.mapTitle': 'Map',
      'city.tapHint': 'Tap for details →',
      'city.listEmpty': 'No help spots or hazard areas registered.',
      'city.listEmptyHelp': 'No help spots registered.',
      'city.listEmptyDanger': 'No hazard areas registered.',
      'city.breadcrumb': '{region} · City',
      'place.notFound': 'Place not found.',
      'place.typeHelp': 'Help spot',
      'place.typeDanger': 'Hazard area',
      'place.photoLoading': 'Loading place photos…',
      'place.photoLoadingSub': 'Info and map below are ready now',
      'place.photoEmpty': 'No photos for this place',
      'place.searchNaver': 'Search on Naver Map',
      'place.naverMap': 'Naver Map',
      'place.streetView': 'Google Street View',
      'place.googleMap': 'Google Maps',
      'place.locationMap': 'Location map',
      'place.photosTitle': 'Place photos',
      'place.photosNote': 'Photos related to “{name}” from Naver and open databases.',
      'place.gridLoading': 'Loading photos…',
      'place.photoFailFacility': 'Could not load photos for “{name}”. Try searching on Naver Map.',
      'place.photoFailArea': 'Could not load photos for “{name}”. Check Naver Map or Google Street View.',
      'place.photoAlt': '{name} photo',
      'place.photoAltN': '{name} photo {n}',
      'place.satelliteAlt': '{name} satellite image',
      'articles.translated': 'Translated',
      'articles.cnnSource': 'CNN',
      'articles.thumb': 'Article',
      'articles.open': 'Read original →',
      'articles.openNaver': 'Read on Naver News →',
      'articles.openCnn': 'Read on CNN →',
      'articles.openGoogle': 'Read on Google News →',
      'articles.related': 'Keywords',
      'articles.sectionTitle': 'Latest news',
      'articles.sectionNote': 'News from Naver, Google, and CNN — shown in English when possible.',
      'articles.refreshing': 'Refreshing articles…',
      'articles.error': 'Could not load the latest articles. Retrying automatically soon.',
      'articles.lastUpdated': 'Updated: {time}',
      'tag.장애인': 'Disability',
      'tag.안내견': 'Guide dog',
      'tag.여성·아동': 'Women & children',
      'tag.스토킹': 'Stalking',
      'tag.디지털성범죄': 'Digital sex crime',
      'tag.노인': 'Seniors',
      'tag.교통·보행': 'Traffic & walking',
      'tag.아동': 'Children',
      'tag.CNN': 'CNN',
      'access.meters': '{n} m',
      'access.kilometers': '{n} km',
      'transit.checking': 'Checking route',
      'transit.min': '{n} min',
      'transit.hour': '{n} hr',
      'transit.hourMin': '{h} hr {m} min',
      'transit.meters': '{n} m',
      'transit.kilometers': '{n} km',
      'transit.won': '₩{n}',
      'transit.transfersN': '{n} transfers',
      'transit.transfersShort': '{n} transfers',
      'transit.walkMeta': 'Walk {dist}',
      'transit.depart': 'Start',
      'transit.arrive': 'End',
      'transit.walkStep': 'Walk {from} → {to}',
      'transit.bus': 'Bus',
      'transit.subway': 'Subway',
      'transit.carMove': 'Drive',
      'transit.bikeMove': 'Bike',
      'transit.move': 'Move',
      'transit.note.stairs': 'Prefer entrances with elevators or ramps instead of stairs or overpasses.',
      'transit.note.slope': 'Take extra time if there are slopes or crosswalks.',
      'transit.note.longWalk': 'This walk is long. Rest on a bench or in a station waiting area if needed.',
      'transit.note.elevator': 'Check signs for elevators and wheelchair lifts inside the station.',
      'transit.note.transfer': 'Transfer corridors can be long — leave extra time.',
      'transit.note.voice': 'Ask station staff if you need braille or voice guidance.',
      'transit.note.lowFloor': 'Check the stop or front of the bus for low-floor or lift service.',
      'transit.note.seating': 'Priority seats for mobility needs and pregnancy are available.',
      'access.destTitle': 'Destination',
      'access.placeholder': 'Where are you going?',
      'access.search': 'Search',
      'access.searching': 'Searching…',
      'access.statusLoading': 'Finding your destination…',
      'access.statusIdle': 'Search a place to get nearby cafes, restaurants, and shops.',
      'access.statusFail': 'Location not found. Try a different place name.',
      'access.statusActive': 'Showing places within {km} km of {place}, nearest first.',
      'access.intro': 'Enter a place to get nearby cafe, food, and shopping picks.',
      'access.cafe': 'Cafes',
      'access.food': 'Food',
      'access.shop': 'Shopping',
      'access.cafeNote': 'Cafes that are usually easier to access',
      'access.foodNote': 'Restaurants with aisles or elevators',
      'access.shopNote': 'Markets and malls',
      'access.sectionLoading': 'Finding nearby places…',
      'access.sectionEmpty': 'No {category} recommendations near “{place}”.',
      'access.sectionHeader': 'Near “{place}” · {note}',
      'access.audienceLabel': 'Helpful for',
      'access.source.naver': 'Naver',
      'access.source.nearby': 'Nearby',
      'access.openMap': 'Open map',
      'access.directions': 'Directions',
      'access.nearbyAudience': 'Wheelchair · stroller · mobility aid — nearby search',
      'access.nearbyNote': '{dist} from your destination. Check stairs and aisles before entering.',
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
      'transit.noRoute': 'No route found',
      'transit.noRouteHint': 'Check the places or try another travel mode.',
      'transit.finding': 'Finding an Oasi5 route…',
      'transit.mode.transit': 'Transit',
      'transit.mode.walk': 'Walk',
      'transit.mode.car': 'Drive',
      'transit.mode.bicycle': 'Bike',
      'transit.transfer': 'Transfers',
      'transit.walkPart': 'Walk',
      'transit.ownRoute': 'Oasi5 route',
      'transit.noSteps': 'No step-by-step details.',
      'transit.mapAria': 'Route map',
      'transit.error.module': 'Could not load the routing module.',
      'transit.error.load': 'Could not load the route.',
      'transit.noLocation': 'Could not find start or destination.',
      'transit.stations': '{n} stops',
      'transit.profile.wheelchair': 'Wheelchair',
      'transit.profile.wheelchair.desc': 'Elevators & low-floor buses',
      'transit.profile.stroller': 'Stroller',
      'transit.profile.stroller.desc': 'Wide paths & elevators',
      'transit.profile.walker': 'Walker',
      'transit.profile.walker.desc': 'Shorter walks & gentle slopes',
      'transit.profile.visual': 'Vision / guide dog',
      'transit.profile.visual.desc': 'Voice guidance & guide dogs',
      'transit.profile.elderly': 'Slower walking',
      'transit.profile.elderly.desc': 'Fewer transfers & seating',
      'transit.comfort.best': 'Very easy',
      'transit.comfort.good': 'Easy',
      'transit.comfort.ok': 'OK',
      'transit.comfort.caution': 'Caution',
      'transit.tip.wheelchair1': 'Check the stop and front of the bus for low-floor or lift service.',
      'transit.tip.wheelchair2': 'Elevator-to-elevator transfers can be long — leave extra time.',
      'transit.tip.stroller1': 'Prefer stations and mall links with elevators or gentle ramps.',
      'transit.tip.stroller2': 'Avoid escalator-only exits; look for elevator-marked exits.',
      'transit.tip.walker1': 'Split long walks with bus or subway segments when possible.',
      'transit.tip.walker2': 'Rest on station seating or in the concourse if you need a break.',
      'transit.tip.visual1': 'Guide dogs may ride public transit with a service-dog badge.',
      'transit.tip.visual2': 'Ask station staff for braille or voice guidance if needed.',
      'transit.tip.elderly1': 'Fewer transfers usually means an easier trip.',
      'transit.tip.elderly2': 'Priority seats on subway and bus are available.',
      'score.help': 'Help {n}%',
      'score.danger': 'Hazard {n}%',
      'score.helpLabel': 'Help level',
      'score.dangerLabel': 'Hazard level',
      'score.helpTitle': 'Help level: based on access and support range',
      'score.dangerTitle': 'Hazard level: based on accident or harm risk',
      'score.helpNote': 'Help index based on phone, website, programs, and facility info.',
      'score.dangerNote': 'Hazard index based on TAAS, terrain, tourism, and traffic factors.',
      'cat.장애인 시설': 'Disability support',
      'cat.여성 안전': 'Women’s safety',
      'cat.아동 안전': 'Child safety',
      'cat.복합 복지 시설': 'Community welfare',
      'cat.노인복지 시설': 'Senior welfare',
      'cat.보행자 안전': 'Pedestrian safety',
      'cat.노인 안전': 'Senior safety',
      'cat.관광객 안전': 'Tourist safety',
      'cat.교통 안전': 'Traffic safety',
      'place.whyHelp': 'Why is this helpful?',
      'place.whyDanger': 'Why be careful?',
      'place.infoTitle': 'Visit info',
      'place.howTo': 'How to use',
      'place.phone': 'Phone',
      'place.hours': 'Hours',
      'place.operator': 'Operator',
      'place.website': 'Website',
      'place.regionChip': 'Region {region}',
      'place.canDo': 'What you can do',
      'place.canDoHere': 'What you can do here',
      'place.canDoShort': 'What you can do'
    }
  };

  function getLang() {
    return current === 'en' ? 'en' : 'ko';
  }

  function format(str, vars) {
    var out = String(str || '');
    if (!vars) return out;
    Object.keys(vars).forEach(function (k) {
      out = out.split('{' + k + '}').join(String(vars[k]));
    });
    return out;
  }

  function t(key, fallbackOrVars, maybeVars) {
    var pack = STRINGS[getLang()] || STRINGS.ko;
    var fallback = fallbackOrVars;
    var vars = maybeVars;
    if (fallbackOrVars && typeof fallbackOrVars === 'object' && !Array.isArray(fallbackOrVars)) {
      vars = fallbackOrVars;
      fallback = key;
    }
    var raw = pack[key];
    if (raw == null) raw = STRINGS.ko[key];
    if (raw == null) raw = typeof fallback === 'string' ? fallback : key;
    return format(raw, vars);
  }

  function applyDom() {
    document.documentElement.setAttribute('lang', getLang() === 'en' ? 'en' : 'ko');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (!key) return;
      el.innerHTML = t(key);
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
    getLang: getLang,
    set: setLang,
    apply: applyDom
  };
})(window);
