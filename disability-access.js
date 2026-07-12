var DisabilityAccess = (function () {
  var NEARBY_RADIUS_KM = 3;
  var NEARBY_MAX_KM = 8;
  var NEARBY_LIMIT = 12;

  var state = {
    destination: '',
    destinationPoint: null,
    suggestDest: [],
    loadingNearby: { cafe: false, food: false, shop: false },
    resolvingDestination: false,
    nearbyError: false,
    nearbyPartialError: false,
    nearbyRemote: { cafe: [], food: [], shop: [] },
    textHits: [],
    suggestRequestId: 0
  };

  var docClickBound = false;
  var RECOMMENDATIONS = [
    {
      kind: '카페',
      name: '카페 레이어드 (연남)',
      address: '서울특별시 마포구 성미산로 161-8',
      lat: 37.5662,
      lng: 126.9234,
      photoQuery: '카페 레이어드 연남',
      audienceFor: '유모차·보행 보조기 — 1층 매장·테이크아웃',
      note: '인기 카페지만 주말·점심엔 대기·혼잡할 수 있습니다. 1층 매장·테이크아웃 이용을 권장합니다.'
    },
    {
      kind: '카페',
      name: '스타벅스 코엑스몰점',
      address: '서울특별시 강남구 영동대로 513',
      lat: 37.5125,
      lng: 127.0592,
      photoQuery: '스타벅스 코엑스몰',
      audienceFor: '휠체어·유모차 — 쇼핑몰 내 평탄·엘리베이터',
      note: '코엑스몰 안 카페. 계단 없이 지하철·별마당도서관·식당가와 연결되어 이동하기 수월합니다.'
    },
    {
      kind: '카페',
      name: '카페 온수',
      address: '서울특별시 성동구 성수동2가 277-22',
      lat: 37.5435,
      lng: 127.0549,
      photoQuery: '카페 온수 성수',
      audienceFor: '유모차·보행 보조기 — 1층 단독 매장',
      note: '1층 단독 매장이라 계단 없이 들어갈 수 있습니다. 다만 성수 일대는 주말에 보행로·카페가 혼잡할 수 있습니다.'
    },
    {
      kind: '카페',
      name: '블루보틀 성수',
      address: '서울특별시 성동구 연무장17길 19',
      lat: 37.5415,
      lng: 127.0543,
      photoQuery: '블루보틀 성수',
      audienceFor: '휠체어·유모차 — 1층 바·넓은 실내',
      note: '성수동 스페셜티 커피 대표 브랜드. SNS에 자주 올라오는 공간으로, 1층 바 좌석은 계단 없이 이용할 수 있습니다.'
    },
    {
      kind: '카페',
      name: '포스투커피 (이태원)',
      address: '서울특별시 용산구 이태원로 142',
      lat: 37.5345,
      lng: 126.9948,
      photoQuery: '포스투커피 이태원',
      audienceFor: '보행 보조기 — 1층 매장',
      note: '이태원·경리단길 쪽에서 유명한 로스터리 카페. 커피·브런치 사진이 SNS에 많이 올라오는 곳입니다.'
    },
    {
      kind: '카페',
      name: '오설록 티 뮤지엄 (제주)',
      address: '제주특별자치도 서귀포시 안덕면 신화역사로 15',
      lat: 33.306,
      lng: 126.2893,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Osulloc_Tea_Museum_%26_Fields%2C_Jeju.jpg/960px-Osulloc_Tea_Museum_%26_Fields%2C_Jeju.jpg',
      audienceFor: '휠체어·유모차·가족 — 넓은 야외·실내',
      note: '제주 여행 필수 코스. 녹차밭·카페·기념품숍 사진이 인스타그램에서 자주 보이는 대표 관광 카페입니다.'
    },
    {
      kind: '카페',
      name: '앤트러사이트 커피 (연희)',
      address: '서울특별시 마포구 연희로45길 18',
      lat: 37.568,
      lng: 126.9265,
      photoQuery: '앤트러사이트 커피 연희',
      audienceFor: '보행 보조기 — 1층 테이블·경사로',
      note: '연희동 대표 로스터리. 커피 매니아·인플루언서들이 자주 찾는 카페로, 1층 좌석 이용을 추천합니다.'
    },
    {
      kind: '카페',
      name: '스타벅스 리저브 로스터리 서울',
      address: '서울특별시 용산구 한남대로27길 69',
      lat: 37.521,
      lng: 126.9912,
      photoQuery: '스타벅스 리저브 로스터리 서울',
      audienceFor: '휠체어·유모차 — 넓은 1층·승강기',
      note: '국내 최대 스타벅스 플래그십. 관광객·데이트 코스로 유명하고, 1층은 경사로·넓은 통로로 이동하기 쉽습니다.'
    },
    {
      kind: '식당',
      name: '애슐리퀸즈 (더현대 서울)',
      address: '서울특별시 영등포구 여의대로 108',
      lat: 37.5264,
      lng: 126.9282,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/The_Hyundai_Seoul_Yeoui-dong_3.jpg/960px-The_Hyundai_Seoul_Yeoui-dong_3.jpg',
      audienceFor: '휠체어·유모차·가족 — 쇼핑몰 내 넓은 좌석·엘리베이터',
      note: '더현대 서울 안 뷔페. 실내가 넓고 좌석 간격이 있어 휠체어·유모차 동반이 비교적 수월합니다. 시장·노점과 달리 통로가 확보된 실내 식사 공간입니다.'
    },
    {
      kind: '식당',
      name: '육회바른연어 (성수)',
      address: '서울특별시 성동구 연무장7길 11',
      lat: 37.5418,
      lng: 127.0532,
      photoQuery: '육회바른연어 성수',
      audienceFor: '보행 보조기 — 1층 매장',
      note: '1층 매장이지만 성수 일대는 주말·저녁에 줄·혼잡할 수 있습니다. 이동이 불편하면 쇼핑몰 안 식당·카페 이용을 권장합니다.'
    },
    {
      kind: '식당',
      name: '우래옥',
      address: '서울특별시 중구 창경궁로 62-29',
      lat: 37.5685,
      lng: 126.9988,
      photoQuery: '우래옥 설렁탕',
      audienceFor: '고령·보행 보조기 — 1층 좌석',
      note: '을지로 대표 설령탕·냉면 맛집. 오래된 노포로 TV·SNS 먹방에도 자주 등장하는 보편적인 한식당입니다.'
    },
    {
      kind: '식당',
      name: '더현대 서울 푸드코트',
      address: '서울특별시 영등포구 여의대로 108',
      lat: 37.5264,
      lng: 126.9282,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/The_Hyundai_Seoul_Yeoui-dong_3.jpg/960px-The_Hyundai_Seoul_Yeoui-dong_3.jpg',
      audienceFor: '휠체어·유모차·가족 — 엘리베이터·넓은 통로',
      note: '여의도 더현대 서울 지하·상층 식당가. 데이트·가족 외식으로 많이 가는 쇼핑몰 안 맛집·푸드코트입니다.'
    },
    {
      kind: '식당',
      name: '롯데월드몰 식당가',
      address: '서울특별시 송파구 올림픽로 300',
      lat: 37.5115,
      lng: 127.098,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Lotte_World_morning_view_7.jpg/960px-Lotte_World_morning_view_7.jpg',
      audienceFor: '휠체어·유모차·어린이 — 실내 평탄',
      note: '잠실 롯데월드·아쿠아리움와 함께 가는 대표 쇼핑·외식 장소. 푸드코트·외식 브랜드가 한곳에 모여 있습니다.'
    },
    {
      kind: '식당',
      name: 'VIPS (타임스퀘어)',
      address: '서울특별시 영등포구 영중로 15',
      lat: 37.5171,
      lng: 126.9034,
      photoQuery: 'VIPS 타임스퀘어',
      audienceFor: '휠체어·유모차·가족 — 쇼핑몰 내 평탄·엘리베이터',
      note: '타임스퀘어 몰 안 패밀리 레스토랑. 좁은 시장 통로 없이 넓은 실내 좌석·엘리베이터로 이동할 수 있습니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '신세계백화점 본점 (명동)',
      address: '서울특별시 중구 소공로 63',
      lat: 37.5609,
      lng: 126.9822,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Shinsegae_Department_Store_in_Seoul.jpg/960px-Shinsegae_Department_Store_in_Seoul.jpg',
      audienceFor: '휠체어·유모차·고령 이용자 — 엘리베이터',
      note: '백화점 건물 안은 엘리베이터·넓은 통로가 있습니다. 다만 명동 야외 거리는 관광객·인파가 많아, 이동이 불편하면 실내 쇼핑·식사 위주로 이용하세요.'
    },
    {
      kind: '가게·쇼핑',
      name: '롯데백화점 본점 (명동)',
      address: '서울특별시 중구 남대문로 81',
      lat: 37.5646,
      lng: 126.9816,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Lotte_Department_Main_Store.JPG/960px-Lotte_Department_Main_Store.JPG',
      audienceFor: '휠체어·유모차 — 엘리베이터·에스컬레이터',
      note: '명동·을지로 대표 백화점. 관광객·시민 모두 자주 찾는 서울 대표 쇼핑 건물입니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '더현대 서울',
      address: '서울특별시 영등포구 여의대로 108',
      lat: 37.5264,
      lng: 126.9282,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/The_Hyundai_Seoul_Yeoui-dong_3.jpg/960px-The_Hyundai_Seoul_Yeoui-dong_3.jpg',
      audienceFor: '휠체어·유모차 — 최신 무장애 쇼핑몰',
      note: '여의도 대표 쇼핑몰. SNS에 자주 올라오는 실내 정원·폭포 등 볼거리와 브랜드 매장이 모여 있습니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '코엑스',
      address: '서울특별시 강남구 영동대로 513',
      lat: 37.512,
      lng: 127.0595,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Charles_%26_Keith_COEX_Mall_Store.jpg/960px-Charles_%26_Keith_COEX_Mall_Store.jpg',
      audienceFor: '휠체어·유모차 — 실내 연결 통로',
      note: '삼성역 대표 쇼핑몰. 별마당도서관·아쿠아리움·전시와 연결되어 데이트·가족 나들이에 인기 있습니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '동대문 DDP',
      address: '서울특별시 중구 을지로 281',
      lat: 37.5668,
      lng: 127.0094,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Dongdaemun_Design_Plaza_at_night%2C_Seoul%2C_Korea.jpg/960px-Dongdaemun_Design_Plaza_at_night%2C_Seoul%2C_Korea.jpg',
      audienceFor: '휠체어·유모차 — 경사로·승강기',
      note: '동대문 랜드마크. 야경·전시·플리마켓 사진이 SNS에 많이 올라오는 대표 서울 명소입니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '현대백화점 압구정본점',
      address: '서울특별시 강남구 압구정로 429',
      lat: 37.5274,
      lng: 127.0276,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Apgujeong_20170825_173841.jpg/960px-Apgujeong_20170825_173841.jpg',
      audienceFor: '휠체어·유모차 — 엘리베이터',
      note: '압구정·청담 대표 백화점. 명품·패션 쇼핑으로 유명한 서울 대표 상권입니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '무신사 스탠다드 (성수)',
      address: '서울특별시 성동구 아차산로 104',
      lat: 37.5442,
      lng: 127.0588,
      photoQuery: '무신사 스탠다드 성수',
      audienceFor: '보행 보조기 — 1층·평탄 매장',
      note: '1층 매장은 평탄하지만, 성수 일대는 주말에 매우 혼잡할 수 있습니다. 이동이 불편하면 쇼핑몰 안 매장을 권장합니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '카카오프렌즈 (IFC몰)',
      address: '서울특별시 영등포구 국제금융로 10',
      lat: 37.5252,
      lng: 126.9265,
      photoQuery: '카카오프렌즈 IFC몰',
      audienceFor: '유모차·휠체어·가족 — 쇼핑몰 내 엘리베이터',
      note: '여의도 IFC몰 안 굿즈 매장. 명동·시장처럼 좁지 않고 엘리베이터·넓은 통로로 이동할 수 있습니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '올리브영 (더현대 서울)',
      address: '서울특별시 영등포구 여의대로 108',
      lat: 37.5264,
      lng: 126.9282,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/The_Hyundai_Seoul_Yeoui-dong_3.jpg/960px-The_Hyundai_Seoul_Yeoui-dong_3.jpg',
      audienceFor: '유모차·휠체어 — 쇼핑몰 내 평탄',
      note: '더현대 서울 안 대형 올리브영. 혼잡한 거리 대신 실내 넓은 통로·엘리베이터로 쇼핑할 수 있습니다.'
    },
    {
      kind: '카페',
      name: '카페 공명 (연남)',
      address: '서울특별시 마포구 연희로 45-1',
      lat: 37.5668,
      lng: 126.9238,
      photoQuery: '카페 공명 연남',
      audienceFor: '유모차·보행 보조기 — 1층 매장',
      note: '연남·연희동에서 인기 있는 브런치·커피 카페. SNS에 자주 올라오는 대표 연남 카페 거리 맛집입니다.'
    },
    {
      kind: '카페',
      name: '스타벅스 (IFC몰)',
      address: '서울특별시 영등포구 국제금융로 10',
      lat: 37.5254,
      lng: 126.9263,
      photoQuery: '스타벅스 IFC몰 여의도',
      audienceFor: '휠체어·유모차 — 쇼핑몰 내 평탄',
      note: 'IFC몰·공항철도 연결 쇼핑센터 안 카페. 야외 시장·혼잡 거리 없이 실내에서 이용할 수 있습니다.'
    },
    {
      kind: '카페',
      name: '테레스606 (성수)',
      address: '서울특별시 성동구 성수동2가 277-55',
      lat: 37.544,
      lng: 127.0552,
      photoQuery: '테레스606 성수',
      audienceFor: '휠체어·유모차 — 1층·옥상 엘리베이터',
      note: '1층·옥상 모두 엘리베이터가 있지만, 성수 일대는 주말에 주변 보행로가 혼잡할 수 있습니다.'
    },
    {
      kind: '카페',
      name: '스타벅스 경복궁점',
      address: '서울특별시 종로구 사직로 161',
      lat: 37.5759,
      lng: 126.9769,
      photoQuery: '스타벅스 경복궁점',
      audienceFor: '휠체어·유모차 — 1층',
      note: '관광지 인근이라 낮 시간대엔 주변 보행로가 붐빌 수 있습니다. 매장 자체는 1층·경사로가 있습니다.'
    },
    {
      kind: '카페',
      name: '카페 드롭탑 (강남)',
      address: '서울특별시 강남구 강남대로 396',
      lat: 37.4985,
      lng: 127.0275,
      photoQuery: '카페 드롭탑 강남',
      audienceFor: '휠체어·유모차 — 1층 체인 매장',
      note: '전국적으로 많이 찾는 커피·음료 체인. 강남역·명동 등 주요 상권 1층 매장이 많아 누구나 쉽게 이용할 수 있습니다.'
    },
    {
      kind: '카페',
      name: '부산 카페 1987 (광안리)',
      address: '부산광역시 수영구 광안해변로 279',
      lat: 35.1532,
      lng: 129.1188,
      photoQuery: '카페1987 광안리',
      audienceFor: '유모차·보행 보조기 — 1층',
      note: '해변가 카페지만 여름·주말엔 주변이 혼잡할 수 있습니다. 실내 좌석·1층 입구 이용을 권장합니다.'
    },
    {
      kind: '식당',
      name: '홍콩반점0410 (코엑스몰)',
      address: '서울특별시 강남구 영동대로 513',
      lat: 37.5123,
      lng: 127.0594,
      photoQuery: '홍콩반점0410 코엑스',
      audienceFor: '휠체어·유모차 — 쇼핑몰 내 1층',
      note: '코엑스몰 지하·지상 식당가. 좁은 시장 통로 없이 엘리베이터로 바로 들어갈 수 있습니다.'
    },
    {
      kind: '식당',
      name: '교촌치킨 (코엑스몰)',
      address: '서울특별시 강남구 영동대로 513',
      lat: 37.5121,
      lng: 127.0596,
      photoQuery: '교촌치킨 코엑스',
      audienceFor: '휠체어·유모차·가족 — 쇼핑몰 내',
      note: '코엑스몰 안 1층 매장. 명동·시장처럼 좁은 길·줄 없이 쇼핑과 함께 식사할 수 있습니다.'
    },
    {
      kind: '식당',
      name: '샤브올데이 (강남)',
      address: '서울특별시 서초구 강남대로 429',
      lat: 37.5012,
      lng: 127.0265,
      photoQuery: '샤브올데이 강남',
      audienceFor: '휠체어·유모차·가족 — 1층·엘리베이터',
      note: '뷔페식 샤브샤브 체인. 가족·친구 모임에 많이 가는 보편적인 외식 브랜드입니다.'
    },
    {
      kind: '식당',
      name: '쿠우쿠우 (잠실)',
      address: '서울특별시 송파구 올림픽로 240',
      lat: 37.5118,
      lng: 127.1022,
      photoQuery: '쿠우쿠우 롯데월드몰',
      audienceFor: '휠체어·유모차·어린이 — 쇼핑몰 내 평탄',
      note: '롯데월드·잠실 쪽에서 많이 가는 뷔페 체인. 쇼핑몰 안에 있어 엘리베이터로 바로 들어갈 수 있습니다.'
    },
    {
      kind: '식당',
      name: '이삭토스트 (더현대 서울)',
      address: '서울특별시 영등포구 여의대로 108',
      lat: 37.5263,
      lng: 126.9281,
      photoQuery: '이삭토스트 더현대 서울',
      audienceFor: '유모차·휠체어 — 쇼핑몰 내 테이크아웃',
      note: '더현대 서울 지하·푸드코트 인근. 실내 평탄 통로에서 간단히 식사할 수 있습니다.'
    },
    {
      kind: '식당',
      name: 'IFC몰 푸드코트 (여의도)',
      address: '서울특별시 영등포구 국제금융로 10',
      lat: 37.5253,
      lng: 126.9264,
      photoQuery: 'IFC몰 푸드코트',
      audienceFor: '휠체어·유모차·고령 — 넓은 실내·엘리베이터',
      note: '여의도 IFC몰 지하 푸드코트. 전통시장과 달리 통로가 넓고 의자·엘리베이터가 잘 갖춰져 있습니다.'
    },
    {
      kind: '식당',
      name: '서울식물원 & 카페 (마곡)',
      address: '서울특별시 강서구 마곡동로 161',
      lat: 37.5668,
      lng: 126.8356,
      photoQuery: '서울식물원',
      audienceFor: '휠체어·유모차·고령 — 무장애·넓은 실내·온실',
      note: '2024년 개장한 공공 식물원. 경사로·엘리베이터·장애인 화장실이 잘 갖춰져 있고, 실내 카페·식당도 평탄합니다.'
    },
    {
      kind: '식당',
      name: '맥도날드 (롯데월드몰)',
      address: '서울특별시 송파구 올림픽로 300',
      lat: 37.5116,
      lng: 127.0981,
      photoQuery: '맥도날드 롯데월드몰',
      audienceFor: '유모차·휠체어·어린이 — 쇼핑몰 내',
      note: '롯데월드몰 안 패스트푸드. 명동·시장 대신 실내 넓은 좌석·엘리베이터로 이용할 수 있습니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '롯데백화점 잠실점',
      address: '서울특별시 송파구 올림픽로 240',
      lat: 37.5118,
      lng: 127.1022,
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Lotte_World_morning_view_7.jpg/960px-Lotte_World_morning_view_7.jpg',
      audienceFor: '휠체어·유모차·가족 — 엘리베이터·몰 연결',
      note: '잠실·롯데월드와 연결된 대형 백화점. 쇼핑·식사·놀이를 한곳에서 하는 대표 나들이 코스입니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '스타필드 수원',
      address: '경기도 수원시 장안구 수성로 175',
      lat: 37.2632,
      lng: 127.0286,
      photoQuery: '스타필드 수원',
      audienceFor: '휠체어·유모차·가족 — 대형 평탄 몰',
      note: '수원·경기권 대표 쇼핑몰. 아쿠아필드·식당·브랜드 매장이 넓은 통로로 연결되어 있습니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '신세계 센텀시티 (부산)',
      address: '부산광역시 해운대구 센텀남대로 35',
      lat: 35.1695,
      lng: 129.131,
      photoQuery: '신세계 센텀시티',
      audienceFor: '휠체어·유모차 — 지하철·몰 직결·엘리베이터',
      note: '부산 대표 복합 쇼핑몰. 국제시장처럼 좁은 통로가 아니라 넓은 실내·엘리베이터로 이동할 수 있습니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '대구 이월드 (몰·놀이)',
      address: '대구광역시 달서구 두류공원로 200',
      lat: 35.8531,
      lng: 128.4782,
      photoQuery: '대구 이월드',
      audienceFor: '휠체어·유모차·가족 — 넓은 실내·야외 경사로',
      note: '대구 대표 테마파크·쇼핑몰. 번화가 거리보다 실내·정원 통로가 넓어 휠체어·유모차 이동이 비교적 수월합니다.'
    },
    {
      kind: '가게·쇼핑',
      name: 'IFC몰 (여의도)',
      address: '서울특별시 영등포구 국제금융로 10',
      lat: 37.5253,
      lng: 126.9264,
      photoQuery: 'IFC몰 서울',
      audienceFor: '휠체어·유모차 — 지하철 연결·넓은 실내',
      note: '여의도 대형 쇼핑몰. 명동·시장처럼 붐비는 야외 거리 없이 실내에서 쇼핑·식사·카페를 이용할 수 있습니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '이케아 고양',
      address: '경기도 고양시 덕양구 향동로 217',
      lat: 37.6015,
      lng: 126.8948,
      photoQuery: '이케아 고양',
      audienceFor: '휠체어·유모차·가족 — 넓은 평탄 매장',
      note: '경기 북부 대표 이케아. 넓은 통로·레스토랑·키즈존이 있어 가족 쇼핑·나들이에 인기입니다.'
    },
    {
      kind: '가게·쇼핑',
      name: 'HYBE INSIGHT (용산)',
      address: '서울특별시 용산구 한강대로 42',
      lat: 37.5295,
      lng: 126.9645,
      photoQuery: 'HYBE INSIGHT 용산',
      audienceFor: '유모차·휠체어 — 엘리베이터·실내',
      note: 'K-POP 팬들이 많이 찾는 전시·굿즈 공간. 용산 아이파크몰 안에 있어 엘리베이터로 이동할 수 있습니다.'
    },
    {
      kind: '가게·쇼핑',
      name: '강남역 지하상가',
      address: '서울특별시 강남구 강남대로 지하',
      lat: 37.498,
      lng: 127.0276,
      photoQuery: '강남역 지하상가',
      audienceFor: '휠체어·보행 보조기 — 지하 평탄',
      note: '강남역과 직결된 지하 쇼핑·먹거리 공간. 계단 없이 지하철·상가를 오갈 수 있어 많이 이용합니다.'
    }
  ];

  var FACILITY_IMAGES = {
    '카페 레이어드 (연남)': 'https://ldb-phinf.pstatic.net/20240618_134/1718671159145WEfro_JPEG/KakaoTalk_Photo_2024-06-18-09-30-50_012.jpeg',
    '스타벅스 코엑스몰점': 'https://ldb-phinf.pstatic.net/20190828_93/1566953601239OT9MQ_PNG/xX7Wv642gXMoTI0DAv0hRymS.png',
    '카페 온수': 'https://ldb-phinf.pstatic.net/20230303_13/1677832557031XLIV6_PNG/%B7%CE%B0%ED1.png',
    '블루보틀 성수': 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDA5MTdfNTUg%2FMDAxNzI2NTM1NDEwMTk0.RztbrTO7-OhXRyPxiyeOPwilCx_FdX2syzZLvMlyCHIg.JPdn4VEnga3VXoiDQPZBenYPxvF_RqVySCJ9c_jmmS0g.JPEG%2F1726535406510.jpg&type=sc960_832',
    '포스투커피 (이태원)': 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNjAyMTFfMjQ5%2FMDAxNzcwODA5MDY5NTI2.gATMRZ9fj0-okpGA3QgLP92eXYngNWszALcoKleDKQgg.Tar-TfaFlI8TrZMGkN_XCN8zF9N1AGbTQFPA2Fgv6-Ag.JPEG%2F900%25A3%25DF20260208%25A3%25DF181307.jpg&type=sc960_832',
    '오설록 티 뮤지엄 (제주)': 'https://search.pstatic.net/common/?autoRotate=true&type=w560_sharpen&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20230719_94%2F1689736746273pug65_JPEG%2F888888.jpg',
    '앤트러사이트 커피 (연희)': 'https://search.pstatic.net/common/?src=https%3A%2F%2Fclip-service-phinf.pstatic.net%2FMjAyNTA4MzBfNzgg%2FMDAxNzU2NDkxOTU4NzI4.WxeR9luY2-YfetyVKGaW28_pyjrmpCAEG6GZC0xa0bQg.cM7cWF1ZW0po62X783sX8M2VyZ_YJUSmekLop4ZLqKog.JPEG%2F18A99B6B-B637-411F-AA53-3FEB16FE13A4.jpeg&type=w560_sharpen',
    '스타벅스 리저브 로스터리 서울': 'https://search.pstatic.net/common/?src=http%3A%2F%2Fcafefiles.naver.net%2FMjAyNTA4MTFfNjUg%2FMDAxNzU0ODg1MTA1OTQ3.CBYwvRRPq_pR1Vj2WSobBVOZSNtFnZY_aWHrbC49mwQg.Xkp_Ij4USoy9Lf5k5eXJog1bC2C2kEQp7nMABtyb6DQg.JPEG%2F%25EB%25AF%25B8%25EC%2597%25AC%25EB%2594%2594%25EB%25A1%259C%25EA%25B3%25A0%25EB%25AA%25A8%25EB%25B0%2594%25EC%259D%25BC.jpg&type=w560_sharpen',
    '애슐리퀸즈 (더현대 서울)': 'https://search.pstatic.net/common/?autoRotate=true&type=w560_sharpen&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20260624_273%2F178230367489138IVB_JPEG%2F%25B8%25C5%25C0%25E5_DID_%25C4%25A1%25C1%25EE2_%2528%25BF%25C3%25B5%25A5%25C0%25CC_199%25B8%25C5%25C0%25E5_%25B9%25CC%25C3%25E2%25BD%25C3%2529.jpg',
    '육회바른연어 (성수)': 'https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20250910_144%2F1757469414024Dv0uJ_JPEG%2F4.jpg&type=w560_sharpen',
    '우래옥': 'https://search.pstatic.net/common/?autoRotate=true&quality=100&type=w560_sharpen&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20150831_131%2F1441017839808DchkO_JPEG%2F11679381_0.jpg',
    '더현대 서울 푸드코트': 'https://ldb-phinf.pstatic.net/20230918_36/1694999105306Le9Ra_JPEG/IMG_4617_3.jpg',
    '롯데월드몰 식당가': 'https://search.pstatic.net/common/?autoRotate=true&type=w278_sharpen&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20210119_258%2F1611044759190mznHY_JPEG%2FBB-9xsw1039G9knmjxBDgC3W.JPG.jpg',
    'VIPS (타임스퀘어)': 'https://search.pstatic.net/common/?src=http%3A%2F%2Fcafefiles.naver.net%2FMjAyMzAyMTRfMTI0%2FMDAxNjc2MzUzMTUzMzIx.yUVvEfTvlxIDjEf7YKPd65TCChAsofXK2ybylY4pHIQg.-xMGB6kYtPUc3-7ejAHlCPL0laef4K3h-WYMPS4ih78g.PNG%2FKakaoTalk_20230211_194647696.png&type=w560_sharpen',
    '신세계백화점 본점 (명동)': 'https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20260705_280%2F1783239899125RUtkI_JPEG%2F%25C0%25D4%25B1%25B8%25BB%25E7%25C1%25F8_12.jpg&type=w560_sharpen',
    '롯데백화점 본점 (명동)': 'https://search.pstatic.net/common/?autoRotate=true&type=w560_sharpen&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20220829_279%2F1661757350453tddlR_JPEG%2F%25BF%25B5%25C7%25C3%25B6%25F3%25C0%25DA.jpg',
    '더현대 서울': 'https://search.pstatic.net/common/?autoRotate=true&type=w560_sharpen&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20210527_1%2F1622098670243mqSFW_JPEG%2F2.jpg',
    '코엑스': 'https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20240920_171%2F1726820492599w3BHe_JPEG%2F%25B8%25B6%25C2%25EA%25B0%25A1%25C1%25A6%25C4%25DA%25BD%25BA_%25BB%25E7%25C0%25CC%25C1%25EE%25C1%25B6%25C1%25A4.jpg&type=w560_sharpen',
    '동대문 DDP': 'https://ldb-phinf.pstatic.net/20221221_152/1671609313328W9m9g_PNG/%B3%D7%C0%CC%B9%F6%C7%C3%B7%B9%C0%CC%BD%BA.png',
    '현대백화점 압구정본점': 'https://search.pstatic.net/common/?autoRotate=true&quality=100&type=w560_sharpen&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20201120_84%2F1605856855291aWGyp_JPEG%2FK5e10WFWlyguWAMZsRfFmh4v.jpg',
    '무신사 스탠다드 (성수)': 'https://ldb-phinf.pstatic.net/20231023_267/1698052879102R4BcH_JPEG/%B9%AB%BD%C5%BB%E7%BD%BA%C5%C4%B4%D9%B5%E5_%BC%BA%BC%F6%C1%A1_%B7%BB%B4%F5%B8%B5_%B8%AE%C5%CD%C4%AA_%C3%D6%C1%BE%BA%BB.jpg',
    '카카오프렌즈 (IFC몰)': 'https://search.pstatic.net/common/?src=http%3A%2F%2Fcafefiles.naver.net%2F20160410_85%2Fmibk8937_1460295713636V9zJj_JPEG%2Fapp_150x150.jpg&type=w560_sharpen',
    '올리브영 (더현대 서울)': 'https://ldb-phinf.pstatic.net/20240318_170/1710751914074PYz9R_JPEG/%B5%BF%BF%A9%C0%C7%B5%B5%C1%A1.jpg',
    '카페 공명 (연남)': 'https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20240117_38%2F17054697671813XWDJ_JPEG%2F%25BF%25AC%25B3%25B2%25C1%25A1_%25281%2529.jpg&type=w560_sharpen',
    '스타벅스 (IFC몰)': 'https://ldb-phinf.pstatic.net/20190828_93/1566953601239OT9MQ_PNG/xX7Wv642gXMoTI0DAv0hRymS.png',
    '테레스606 (성수)': 'https://search.pstatic.net/common/?src=https%3A%2F%2Fcafefiles.pstatic.net%2FMjAxODAyMTFfNzcg%2FMDAxNTE4Mjc3MzQ2NTA4.qrTP5K2z43-toNTjmknKlhbRwoZN6k967zl0nxexOA0g.UQ1aSpe5ixT_uF48iAqfYZiJ3Jd48OnEVWwS1k2Xntgg.PNG.qupid98%2FDVVQ2w0UMAAMinC.png&type=w560_sharpen',
    '스타벅스 경복궁점': 'https://ldb-phinf.pstatic.net/20190828_93/1566953601239OT9MQ_PNG/xX7Wv642gXMoTI0DAv0hRymS.png',
    '카페 드롭탑 (강남)': 'https://search.pstatic.net/common/?src=http%3A%2F%2Fcafefiles.naver.net%2FMjAyNjA1MDdfMjM3%2FMDAxNzc4MDk5ODUyNjkw.c-yw4mzVTGFPPyU2fvyk6Up1HAbUtgyrQUQPkHHNU60g.3qo7XtF6tH1DoOr62nKoRw_JfnYg1eF1qr8FvUxSXaAg.PNG%2FI_01.png&type=w560_sharpen',
    '부산 카페 1987 (광안리)': 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyMTA3MDVfMTU3%2FMDAxNjI1NDg3MDA4ODc1.2lFHNkjOsj-jFlFg2hpCU-kxrKEuiqrZIAko95RE7xQg.44eJCLOZOQT4MEdVuENMmrOMG2lDYisK5jOK4LSwFiAg.JPEG.xiao3824%2Foutput_2610811233.jpg&type=sc960_832',
    '홍콩반점0410 (코엑스몰)': 'https://search.pstatic.net/common/?autoRotate=true&quality=100&type=w560_sharpen&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20260424_150%2F1777008083991uOoU6_JPEG%2F260420_%25C8%25AB%25C4%25E1%25B9%25DD%25C1%25A1_%25C7%25D1%25BB%25F3%25C2%25F7%25B8%25B2_%25B3%25D7%25C0%25CC%25B9%25F6%25C7%25C3%25B7%25B9%25C0%25CC%25BD%25BA_1200x1200.jpg',
    '교촌치킨 (코엑스몰)': 'https://ldb-phinf.pstatic.net/20221130_290/1669782289053g3gih_JPEG/%B1%B3%C3%CC%C4%A1%C5%B2_%BD%C5%B1%D4_BI_%BE%C6%C0%CC%C4%DC%28%C4%AB%C4%AB%BF%C0%29.jpg',
    '샤브올데이 (강남)': 'https://ldb-phinf.pstatic.net/20260605_62/1780649107683ewPkV_JPEG/1.jpg',
    '쿠우쿠우 (잠실)': 'https://search.pstatic.net/common/?src=http%3A%2F%2Fcafefiles.naver.net%2F20160226_148%2Fneoswr_1456470766075NqJX4_JPEG%2FIMG_4804.JPG&type=w560_sharpen',
    '이삭토스트 (더현대 서울)': 'https://search.pstatic.net/common/?autoRotate=true&type=w560_sharpen&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20251102_287%2F1762094314443hC8Iv_JPEG%2F%25BA%25EA%25B8%25AE%25BF%25C0%25BD%25B4_%25B3%25D7%25C0%25CC%25B9%25F6_1080%25A1%25BF1080.jpg',
    'IFC몰 푸드코트 (여의도)': 'https://search.pstatic.net/common/?autoRotate=true&type=w560_sharpen&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20230918_80%2F16949991048644wpkc_JPEG%2FIMG_4810_1.jpg',
    '서울식물원 & 카페 (마곡)': 'https://ldb-phinf.pstatic.net/20230525_203/1685005116553KubYs_JPEG/KakaoTalk_20230525_175543273_11.jpg',
    '맥도날드 (롯데월드몰)': 'https://ldb-phinf.pstatic.net/20210401_137/16172802881853JgPl_JPEG/c5AkMPePKkwA2MFsZVFDWrZk.jpg',
    '롯데백화점 잠실점': 'https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20251013_283%2F1760322402263dSo1t_JPEG%2F%25B7%25D4%25B9%25E9%25C0%25E1%25BD%25C7_2.jpeg&type=sc960_832',
    '스타필드 수원': 'https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20250726_30%2F1753496352816caTs6_JPEG%2F%25BC%25F6%25BF%25F8%25BF%25AA_%25B9%25DD%25C1%25F6%25B0%25F8%25B9%25E6_%25B9%25DD%25C1%25F6%25B8%25B8%25B5%25E9%25B1%25E2_12.jpg&type=w560_sharpen',
    '신세계 센텀시티 (부산)': 'https://ldb-phinf.pstatic.net/20251027_189/1761559793245h3juX_JPEG/KakaoTalk_20251027_005013249.jpg',
    '대구 이월드 (몰·놀이)': 'https://search.pstatic.net/common/?src=http%3A%2F%2Fcafefiles.naver.net%2FMjAyNjA3MDVfOTMg%2FMDAxNzgzMjIxOTU2OTgy.fW05A_RT8PGqDUSSdQKA0DZuYh3vGE2H0DK7kEH2cg8g._mkyPSTLro31M20m1pJrHB0j8_Cvh185QwtwsA4UG3og.JPEG%2F1280_20260705_122201.jpg%7C1280x1707&type=ff192_192',
    'IFC몰 (여의도)': 'https://search.pstatic.net/common/?autoRotate=true&quality=100&type=w560_sharpen&src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20190819_219%2F1566193143811GRABu_JPEG%2F2kg_faxjKMhb87RYsH3BSUPN.jpg',
    '이케아 고양': 'https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20220929_300%2F1664440030828Y4VYp_JPEG%2F20200831_175030.jpg&type=w560_sharpen',
    'HYBE INSIGHT (용산)': 'https://search.pstatic.net/common/?src=http%3A%2F%2Fimgnews.naver.net%2Fimage%2F5641%2F2021%2F05%2F14%2F2021051380174_0_20210514060012218.jpg&type=ff332_332',
    '강남역 지하상가': 'https://ldb-phinf.pstatic.net/20170725_111/1500976302666TBc1j_JPEG/186675588162290_0.jpeg'
  };

  var KIND_CLASS = {
    '카페': 'hub-tag-child',
    '식당': 'hub-tag-elder',
    '가게·쇼핑': 'hub-tag-traffic'
  };

  function haversineKm(a, b) {
    if (typeof NaverTransit !== 'undefined' && NaverTransit.haversineKm) {
      return NaverTransit.haversineKm(a, b);
    }
    if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
    var R = 6371;
    var dLat = (b.lat - a.lat) * Math.PI / 180;
    var dLng = (b.lng - a.lng) * Math.PI / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180)
      * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function formatDistance(km) {
    if (km == null || km < 0) return '';
    if (km < 1) return Math.max(1, Math.round(km * 1000)) + 'm';
    return km.toFixed(1) + 'km';
  }

  function encodePlaceData(item) {
    return encodeURIComponent(JSON.stringify({
      name: item.name || '',
      address: item.address || '',
      lat: item.lat,
      lng: item.lng,
      kind: item.kind || '',
      source: item.source || ''
    }));
  }

  function parsePlaceData(el) {
    var raw = el.getAttribute('data-place');
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch (err) {
      return null;
    }
  }

  function renderSuggestions(items) {
    if (!items.length) return '';
    return (
      '<ul class="transit-suggest access-suggest">' +
        items.map(function (item, i) {
          var sub = item.address || item.kind || '';
          var badge = item.source === 'naver' ? '연관검색'
            : (item.source === 'geocode' ? '주소검색' : '');
          return (
            '<li><button type="button" class="transit-suggest-item access-suggest-item" data-index="' + i + '" data-place="' + encodePlaceData(item) + '">' +
              '<strong>' + escapeHtml(item.name) + '</strong>' +
              '<span>' + escapeHtml(sub) + (badge ? ' · ' + badge : '') + '</span>' +
            '</button></li>'
          );
        }).join('') +
      '</ul>'
    );
  }

  function applyDestination(item) {
    if (!item || !item.name) return;
    state.destination = item.name;
    state.suggestDest = [];
    var input = document.querySelector('#access-dest');
    if (input) input.value = item.name;
    if (item.lat && item.lng) {
      state.destinationPoint = Object.assign({}, item);
      refreshNearbyLists();
      return;
    }
    resolveDestinationFromInput();
  }

  function normalizeSearch(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, '');
  }

  function searchFacilitiesByText(query) {
    var q = normalizeSearch(query);
    if (!q || q.length < 2) return [];
    // Avoid weak matches like kind-only ("카페") flooding unrelated places for regional queries.
    return RECOMMENDATIONS.map(resolveEntry).filter(function (item) {
      var name = normalizeSearch(item.name);
      var addr = normalizeSearch(item.address);
      var photo = normalizeSearch(item.photoQuery);
      return name.indexOf(q) >= 0 || photo.indexOf(q) >= 0 || (q.length >= 3 && addr.indexOf(q) >= 0);
    });
  }

  function looksLikeRegionalPlace(query) {
    return /아파트|빌라|오피스텔|단지|[시군구]|읍|면|동|리|로\s*\d|길\s*\d|번지|해운대|수원|부산|대구|광주|대전|울산|인천|제주|창원|청주|전주|포항|경주/.test(query);
  }

  function resolveDestinationFromInput() {
    var trimmed = state.destination.trim();
    if (!trimmed) {
      state.destinationPoint = null;
      state.textHits = [];
      resetNearbyState();
      state.resolvingDestination = false;
      mount();
      return;
    }

    var regional = looksLikeRegionalPlace(trimmed);
    // Only show curated text hits for non-regional keyword searches (e.g. "코엑스", "성수").
    state.textHits = regional ? [] : searchFacilitiesByText(trimmed);
    state.resolvingDestination = true;
    state.nearbyRemote = { cafe: [], food: [], shop: [] };
    mount();
    if (state.textHits.length) scheduleFacilityPhotos();

    if (state.destinationPoint && state.destinationPoint.name === trimmed) {
      state.resolvingDestination = false;
      refreshNearbyLists();
      return;
    }

    var localPoint = null;
    if (typeof NaverTransit !== 'undefined') {
      var local = NaverTransit.searchLocal(trimmed, 8);
      var trimmedNorm = normalizeSearch(trimmed);
      localPoint = local.find(function (p) {
        return p.lat && p.lng && normalizeSearch(p.name) === trimmedNorm;
      }) || null;
    }

    if (!localPoint && !regional && state.textHits.length && state.textHits[0].lat) {
      localPoint = {
        name: trimmed,
        address: state.textHits[0].address || '',
        lat: state.textHits[0].lat,
        lng: state.textHits[0].lng,
        source: 'text-hit'
      };
    }

    function finishResolve(point) {
      state.resolvingDestination = false;
      if (point && point.lat && point.lng) {
        state.destinationPoint = Object.assign({}, point, {
          name: regional ? trimmed : (point.name || trimmed)
        });
        refreshNearbyLists();
        return;
      }
      state.destinationPoint = null;
      resetNearbyState();
      mount();
      scheduleFacilityPhotos();
    }

    function geocodeNow() {
      return fetch(apiUrl('/api/geocode?q=' + encodeURIComponent(trimmed)))
        .then(function (res) {
          var ct = (res.headers.get('content-type') || '');
          if (!res.ok || ct.indexOf('application/json') < 0) throw new Error('geocode-api');
          return res.json();
        })
        .then(function (data) {
          if (data && data.point && data.point.lat) return data.point;
          throw new Error('geocode-empty');
        });
    }

    // Regional / apartment queries: geocode first (don't wait on unrelated curated hits).
    if (regional || !localPoint) {
      geocodeNow()
        .then(finishResolve)
        .catch(function () {
          return geocodeClient(trimmed).then(function (point) {
            if (point) return finishResolve(point);
            if (typeof NaverTransit !== 'undefined') {
              return NaverTransit.resolvePoint(trimmed).then(finishResolve);
            }
            finishResolve(null);
          });
        });
      return;
    }

    finishResolve(localPoint);
  }

  function submitDestinationSearch() {
    var input = document.querySelector('#access-dest');
    if (input) state.destination = input.value.trim();
    resolveDestinationFromInput();
  }

  function isNearbyLoading() {
    return state.loadingNearby.cafe || state.loadingNearby.food || state.loadingNearby.shop;
  }

  function resetNearbyState() {
    state.nearbyRemote = { cafe: [], food: [], shop: [] };
    state.loadingNearby = { cafe: false, food: false, shop: false };
    state.nearbyError = false;
    state.nearbyPartialError = false;
  }

  function fetchNearbyAll(point) {
    var url = apiUrl('/api/nearby-places-all?lat=' + encodeURIComponent(point.lat)
      + '&lng=' + encodeURIComponent(point.lng)
      + '&radius=' + NEARBY_RADIUS_KM
      + '&limit=' + NEARBY_LIMIT);
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('nearby-timeout')); }, 6500);
      fetch(url)
        .then(function (res) {
          clearTimeout(timer);
          var ct = (res.headers.get('content-type') || '');
          if (!res.ok || ct.indexOf('application/json') < 0) throw new Error('nearby-api');
          return res.json();
        })
        .then(resolve)
        .catch(function (err) {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  function fetchNearbyKind(kind) {
    var p = state.destinationPoint;
    var url = apiUrl('/api/nearby-places?lat=' + encodeURIComponent(p.lat)
      + '&lng=' + encodeURIComponent(p.lng)
      + '&kind=' + encodeURIComponent(kind)
      + '&radius=' + NEARBY_RADIUS_KM
      + '&limit=' + NEARBY_LIMIT);
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('nearby-timeout')); }, 90000);
      fetch(url)
        .then(function (res) {
          clearTimeout(timer);
          if (!res.ok) throw new Error('nearby-api');
          return res.json();
        })
        .then(function (data) {
          resolve((data && data.items) ? data.items : []);
        })
        .catch(function (err) {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  function refreshNearbyLists() {
    if (!state.destinationPoint || !state.destinationPoint.lat) {
      resetNearbyState();
      mount();
      return;
    }

    // Show nearby OSM results with a clear loading state. Skip unrelated curated dumps.
    state.nearbyRemote = { cafe: [], food: [], shop: [] };
    state.loadingNearby = { cafe: true, food: true, shop: true };
    state.nearbyError = false;
    state.nearbyPartialError = false;
    mount();

    var point = state.destinationPoint;
    fetchNearbyAll(point)
      .then(function (data) {
        state.nearbyRemote = {
          cafe: (data && data.cafe) ? data.cafe : [],
          food: (data && data.food) ? data.food : [],
          shop: (data && data.shop) ? data.shop : []
        };
        state.loadingNearby = { cafe: false, food: false, shop: false };
        state.nearbyError = false;
        state.nearbyPartialError = false;
        mount();
        scheduleFacilityPhotos();
      })
      .catch(function () {
        state.loadingNearby = { cafe: false, food: false, shop: false };
        state.nearbyError = true;
        state.nearbyPartialError = false;
        mount();
      });
  }

  var photoLoadTimer = null;
  function scheduleFacilityPhotos() {
    if (photoLoadTimer) clearTimeout(photoLoadTimer);
    photoLoadTimer = setTimeout(function () {
      photoLoadTimer = null;
      var el = document.getElementById('view-access');
      if (el) loadFacilityPhotos(el);
    }, 50);
  }

  function remotePlaceToEntry(item, kindKey) {
    var kindMap = { cafe: '카페', food: '식당', shop: '가게·쇼핑' };
    // Fast path: map tile first. Shop photos upgrade later in the background.
    var image = item.image || mapThumbUrl(item.lat, item.lng) || '';
    return {
      kind: kindMap[kindKey] || '장소',
      name: item.name,
      address: item.address || '',
      lat: item.lat,
      lng: item.lng,
      image: image,
      photoUrl: image,
      photoQuery: item.name,
      source: 'nearby',
      distanceKm: item.distanceKm,
      upgradePhoto: true,
      audienceFor: '휠체어·유모차·보행 보조 — 주변 검색',
      note: '목적지에서 ' + formatDistance(item.distanceKm) + ' 거리입니다. 입장 전 계단·통로 여부를 확인하세요.'
    };
  }

  function mergeCategory(curated, remote, point, kindKey) {
    var list = [];
    var seen = {};
    var regional = looksLikeRegionalPlace(state.destination);

    (remote || []).forEach(function (remoteItem) {
      if (remoteItem.distanceKm != null && remoteItem.distanceKm > NEARBY_MAX_KM) return;
      var entry = remotePlaceToEntry(remoteItem, kindKey);
      var key = entry.name + '|' + entry.lat + ',' + entry.lng;
      if (seen[key]) return;
      seen[key] = true;
      list.push(entry);
    });

    // Regional searches: only OSM nearby. Curated Seoul-heavy lists feel unrelated.
    if (!regional) {
      filterNearby(curated, point).forEach(function (item) {
        var key = (item.name || '') + '|' + item.lat + ',' + item.lng;
        if (seen[key]) return;
        seen[key] = true;
        list.push(item);
      });
    }

    list.sort(function (a, b) {
      return (a.distanceKm == null ? 999 : a.distanceKm) - (b.distanceKm == null ? 999 : b.distanceKm);
    });
    return list.slice(0, NEARBY_LIMIT);
  }

  function filterNearby(items, point) {
    if (!point || !point.lat || !point.lng) return items;

    var withDist = items.map(function (item) {
      var km = (item.lat && item.lng) ? haversineKm(item, point) : null;
      return Object.assign({}, item, { distanceKm: km });
    }).filter(function (item) {
      return item.distanceKm != null;
    }).sort(function (a, b) {
      return a.distanceKm - b.distanceKm;
    });

    var nearby = withDist.filter(function (item) {
      return item.distanceKm <= NEARBY_RADIUS_KM;
    });

    if (nearby.length < 3) {
      nearby = withDist.filter(function (item) {
        return item.distanceKm <= NEARBY_MAX_KM;
      });
    }

    // Do NOT dump nationwide curated places for regional searches — that feels unrelated.
    return nearby.slice(0, NEARBY_LIMIT);
  }

  function renderSearchButton() {
    var hasQuery = !!state.destination.trim();
    var busy = state.resolvingDestination || isNearbyLoading();
    var hidden = hasQuery ? '' : ' hidden';
    var disabled = busy ? ' disabled' : '';
    var label = busy ? '검색 중…' : '검색';
    return (
      '<button type="button" id="access-dest-search" class="access-dest-search-btn"' + hidden + disabled +
        ' aria-label="' + label + '" title="' + label + '">' +
        (busy
          ? '<span class="access-dest-search-spinner" aria-hidden="true"></span>'
          : '<svg class="access-dest-search-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
              '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2" />' +
              '<line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />' +
            '</svg>') +
      '</button>'
    );
  }

  function renderDestinationPanel() {
    var status = '';
    if (state.resolvingDestination) {
      status = '<p class="access-dest-status access-loading-note">목적지를 찾는 중…</p>';
    } else if (state.destinationPoint && state.destinationPoint.lat) {
      status = '<p class="access-dest-status is-active">' +
        '<strong>' + escapeHtml(state.destinationPoint.name || state.destination) + '</strong> 주변 ' +
        NEARBY_RADIUS_KM + 'km 이내 시설을 가까운 순으로 보여줍니다.</p>';
    } else if (state.destination.trim()) {
      status = '<p class="access-dest-status is-warning">위치를 찾지 못했습니다. 연관 검색어를 선택하거나 검색어를 바꿔 다시 검색해 주세요.</p>';
    } else {
      status = '<p class="access-dest-status">목적지를 입력하면 <strong>예상 검색어</strong>가 뜹니다. 선택하거나 <strong>검색(돋보기)</strong> 버튼으로 찾을 수 있습니다.</p>';
    }

    return (
      '<section class="hub-section access-dest-panel">' +
        '<h2>가게 될 곳</h2>' +
        '<div class="access-dest-search-row">' +
          '<div class="access-dest-field transit-field-suggest">' +
            '<input type="text" id="access-dest" class="transit-input access-dest-input" ' +
              'placeholder="예: 해운대 센텀 · 수원 광교" ' +
              'value="' + escapeHtml(state.destination) + '" autocomplete="off" aria-label="가게 될 곳" />' +
            '<div id="access-dest-suggest">' + renderSuggestions(state.suggestDest) + '</div>' +
          '</div>' +
          renderSearchButton() +
        '</div>' +
        status +
      '</section>'
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function geocodeClient(query) {
    var q = String(query || '').trim();
    if (!q) return Promise.resolve(null);
    // Prefer server geocode (Nominatim). Browser Nominatim often fails CORS.
    return fetch(apiUrl('/api/geocode?q=' + encodeURIComponent(q)))
      .then(function (res) {
        var ct = (res.headers.get('content-type') || '');
        if (!res.ok || ct.indexOf('application/json') < 0) throw new Error('geocode');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.point) return null;
        if (/[가-힣].*(로|길|동|아파트|번지)/.test(q)) {
          return Object.assign({}, data.point, { name: q });
        }
        return data.point;
      })
      .catch(function () { return null; });
  }

  function apiUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    if (location.protocol === 'file:') {
      return 'http://127.0.0.1:3456' + (path.charAt(0) === '/' ? path : '/' + path);
    }
    return path;
  }

  function resolveImage(entry) {
    if (entry.image) return entry.image;
    return FACILITY_IMAGES[entry.name] || '';
  }

  function resolveEntry(entry) {
    var image = resolveImage(entry) || mapThumbUrl(entry.lat, entry.lng);
    return {
      kind: entry.kind,
      name: entry.name,
      address: entry.address || '',
      lat: entry.lat,
      lng: entry.lng,
      image: image,
      photoUrl: image,
      photoQuery: entry.photoQuery || '',
      audienceFor: entry.audienceFor,
      note: entry.note,
      source: 'oasi5-curated'
    };
  }

  function kindClass(kind) {
    return KIND_CLASS[kind] || 'hub-tag-traffic';
  }

  function latLngToTile(lat, lng, zoom) {
    var n = Math.pow(2, zoom);
    var x = Math.floor(((Number(lng) + 180) / 360) * n);
    var latRad = Number(lat) * Math.PI / 180;
    var y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return { z: zoom, x: x, y: y };
  }

  function mapThumbUrl(lat, lng) {
    if (lat == null || lng == null || lat === '' || lng === '') return '';
    var t = latLngToTile(lat, lng, 16);
    return 'https://a.basemaps.cartocdn.com/rastertiles/voyager/' + t.z + '/' + t.x + '/' + t.y + '@2x.png';
  }

  function placeholderThumb(name) {
    var title = String(name || '장소').slice(0, 10);
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop stop-color="#d9efe6"/><stop offset="1" stop-color="#b7d8c8"/>' +
      '</linearGradient></defs>' +
      '<rect width="640" height="400" fill="url(#g)"/>' +
      '<circle cx="320" cy="160" r="46" fill="#2f6f5e" opacity="0.9"/>' +
      '<path d="M320 130c-16 0-28 12-28 28 0 22 28 48 28 48s28-26 28-48c0-16-12-28-28-28z" fill="#fff"/>' +
      '<text x="320" y="280" text-anchor="middle" font-size="36" font-family="sans-serif" fill="#245346">' +
      title.replace(/[<>&]/g, '') +
      '</text></svg>';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function cleanImageUrl(url) {
    if (!url) return '';
    return String(url)
      .replace(/&amp;/g, '&')
      .replace(/\\u0026/g, '&')
      .trim();
  }

  function photoImgUrl(name, address, lat, lng, directSrc, photoUrl) {
    var direct = cleanImageUrl(photoUrl) || cleanImageUrl(directSrc);
    if (direct && /^https?:\/\//i.test(direct)) return direct;
    if (name && FACILITY_IMAGES[name]) {
      var mapped = cleanImageUrl(FACILITY_IMAGES[name]);
      if (mapped && /^https?:\/\//i.test(mapped)) return mapped;
    }
    return mapThumbUrl(lat, lng) || placeholderThumb(name);
  }

  function shopPhotoProxyUrl(name, address, lat, lng) {
    if (!name) return '';
    var params = ['name=' + encodeURIComponent(name)];
    if (address) params.push('address=' + encodeURIComponent(address));
    if (lat != null && lng != null && lat !== '' && lng !== '') {
      params.push('lat=' + encodeURIComponent(lat));
      params.push('lng=' + encodeURIComponent(lng));
    }
    return apiUrl('/api/place-photo/img?' + params.join('&'));
  }

  function renderThumb(item) {
    var src = photoImgUrl(
      item.name,
      item.address || '',
      item.lat,
      item.lng,
      item.image || '',
      item.photoUrl || ''
    );
    if (src) {
      return (
        '<div class="facility-recommend-thumb-empty" data-facility-placeholder hidden></div>' +
        '<img src="' + escapeAttr(src) + '" alt="' + escapeHtml(item.name) + ' 사진" loading="lazy" decoding="async" data-facility-thumb referrerpolicy="no-referrer" />'
      );
    }
    return (
      '<div class="facility-recommend-thumb-empty" data-facility-placeholder>' +
        '<span class="facility-recommend-thumb-loading-text">📷</span>' +
      '</div>' +
      '<img src="" alt="" loading="lazy" data-facility-thumb hidden />'
    );
  }

  function renderRow(item, index) {
    var tagClass = kindClass(item.kind);

    var actions = '';
    if (item.lat && item.lng) {
      actions += '<a class="facility-recommend-btn" href="https://www.google.com/maps?q=' + item.lat + ',' + item.lng + '" target="_blank" rel="noopener noreferrer">지도 열기</a>';
    }
    if (item.address) {
      actions += '<a class="facility-recommend-btn secondary" href="https://search.naver.com/search.naver?query=' + encodeURIComponent(item.name + ' ' + item.address) + '" target="_blank" rel="noopener noreferrer">길찾기</a>';
    }

    return (
      '<li class="facility-recommend-row" data-index="' + index + '"' +
        ' data-place-name="' + escapeHtml(item.name) + '"' +
        ' data-place-address="' + escapeHtml(item.address || '') + '"' +
        ' data-place-source="' + escapeHtml(item.source || '') + '"' +
        (item.image ? ' data-place-img="' + escapeHtml(item.image) + '"' : '') +
        (item.photoUrl ? ' data-photo-url="' + escapeHtml(item.photoUrl) + '"' : '') +
        (item.upgradePhoto ? ' data-upgrade-photo="1"' : '') +
        (item.lat ? ' data-place-lat="' + item.lat + '"' : '') +
        (item.lng ? ' data-place-lng="' + item.lng + '"' : '') +
        '>' +
        '<article class="facility-recommend-card">' +
          '<div class="facility-recommend-thumb">' +
            renderThumb(item) +
          '</div>' +
          '<div class="facility-recommend-body">' +
            '<div class="facility-recommend-tags">' +
              '<span class="hub-tag ' + tagClass + '">' + escapeHtml(item.kind) + '</span>' +
              (item.source === 'nearby' || item.source === 'oasi5-curated'
                ? '<span class="hub-tag hub-tag-traffic">' + (item.source === 'nearby' ? '주변검색' : 'Oasi5') + '</span>'
                : '') +
              (item.distanceKm != null
                ? '<span class="facility-recommend-distance">' + escapeHtml(formatDistance(item.distanceKm)) + '</span>'
                : '') +
            '</div>' +
            '<h3 class="facility-recommend-name">' + escapeHtml(item.name) + '</h3>' +
            '<p class="facility-recommend-audience">' +
              '<span class="facility-recommend-audience-label">도움이 되는 분</span>' +
              escapeHtml(item.audienceFor) +
            '</p>' +
            (item.address ? '<p class="facility-recommend-addr">' + escapeHtml(item.address) + '</p>' : '') +
            (item.note ? '<p class="facility-recommend-note">' + escapeHtml(item.note) + '</p>' : '') +
            (actions ? '<div class="facility-recommend-actions">' + actions + '</div>' : '') +
          '</div>' +
        '</article>' +
      '</li>'
    );
  }

  function render() {
    var resolved = RECOMMENDATIONS.map(resolveEntry);
    var point = state.destinationPoint;
    var hasPoint = !!(point && point.lat && point.lng);
    var hasTextHits = !!(state.textHits && state.textHits.length);
    var cafes = [];
    var food = [];
    var shops = [];

    if (hasTextHits) {
      cafes = state.textHits.filter(function (r) { return r.kind === '카페'; });
      food = state.textHits.filter(function (r) { return r.kind === '식당'; });
      shops = state.textHits.filter(function (r) { return r.kind === '가게·쇼핑'; });
    }

    if (hasPoint) {
      // For regional destinations, prefer nearby OSM results and only keep curated places that are actually near.
      cafes = mergeCategory(resolved.filter(function (r) { return r.kind === '카페'; }), state.nearbyRemote.cafe, point, 'cafe');
      food = mergeCategory(resolved.filter(function (r) { return r.kind === '식당'; }), state.nearbyRemote.food, point, 'food');
      shops = mergeCategory(resolved.filter(function (r) { return r.kind === '가게·쇼핑'; }), state.nearbyRemote.shop, point, 'shop');
    }

    function section(title, note, items, offset) {
      if (!hasPoint && !hasTextHits) return '';
      if (!items.length) {
        if (state.resolvingDestination || isNearbyLoading()) {
          return '<section class="hub-section"><h2>' + escapeHtml(title) + '</h2><p class="hub-section-note access-loading-note">주변 관련 장소를 찾는 중…</p></section>';
        }
        return '<section class="hub-section"><h2>' + escapeHtml(title) + '</h2><p class="hub-section-note">「' +
          escapeHtml((point && point.name) || state.destination) + '」 근처 ' + escapeHtml(title) + ' 추천이 없습니다.</p></section>';
      }
      var sectionNote = hasPoint
        ? ('「' + (point.name || state.destination) + '」 주변 · ' + note)
        : ('「' + state.destination + '」 검색 결과 · ' + note);
      return (
        '<section class="hub-section">' +
          '<h2>' + escapeHtml(title) + '</h2>' +
          '<p class="hub-section-note">' + escapeHtml(sectionNote) + '</p>' +
          '<ul class="facility-recommend-list">' +
            items.map(function (item, i) { return renderRow(item, offset + i); }).join('') +
          '</ul>' +
        '</section>'
      );
    }

    return (
      '<main class="app-view-inner hub-view">' +
        '<div class="hub-hero">' +
          '<h1 class="hub-page-title">' +
            '<span class="hub-page-brand">Oasi<span class="brand-five">5</span></span>' +
            '<span class="hub-page-en">Facilities</span>' +
          '</h1>' +
        '</div>' +
        renderDestinationPanel() +
        (!hasPoint && !hasTextHits
          ? '<section class="hub-section access-intro"><p class="hub-section-note">목적지를 입력한 뒤 검색하면 관련 카페·식당·쇼핑 추천이 바로 표시됩니다.</p></section>'
          : '') +
        section('카페', '접근이 비교적 쉬운 카페', cafes, 0) +
        section('식당', '통로·엘리베이터가 있는 식당', food, cafes.length) +
        section('가게·쇼핑', '백화점·쇼핑몰 위주', shops, cafes.length + food.length) +
      '</main>'
    );
  }

  function revealPhoto(row) {
    var img = row.querySelector('[data-facility-thumb]');
    var placeholder = row.querySelector('[data-facility-placeholder]');
    if (!img) return;
    img.removeAttribute('hidden');
    if (placeholder) placeholder.setAttribute('hidden', '');
  }

  function loadPhotoForRow(row) {
    var img = row.querySelector('[data-facility-thumb]');
    if (!img) return;
    var name = row.getAttribute('data-place-name') || '';
    var address = row.getAttribute('data-place-address') || '';
    var lat = row.getAttribute('data-place-lat');
    var lng = row.getAttribute('data-place-lng');
    var upgrade = row.getAttribute('data-upgrade-photo') === '1';

    img.onload = function () { revealPhoto(row); };
    img.onerror = function () {
      var mapSrc = mapThumbUrl(lat, lng) || placeholderThumb(name);
      if (img.src !== mapSrc) {
        img.src = mapSrc;
        return;
      }
      img.src = placeholderThumb(name);
    };

    var initialSrc = img.getAttribute('src') || '';
    if (!initialSrc) {
      img.src = mapThumbUrl(lat, lng) || placeholderThumb(name);
    }
    if (img.complete && img.naturalWidth > 0) {
      revealPhoto(row);
    }

    // Upgrade a few nearby rows to shop photos after first paint (slow Naver scrape).
    if (upgrade && name && !row.dataset.photoUpgraded) {
      row.dataset.photoUpgraded = '1';
      setTimeout(function () {
        var proxy = shopPhotoProxyUrl(name, address, lat, lng);
        if (!proxy) return;
        var probe = new Image();
        probe.onload = function () {
          img.src = proxy;
          revealPhoto(row);
        };
        probe.src = proxy;
      }, 800 + Math.floor(Math.random() * 1200));
    }
  }

  function loadFacilityPhotos(container) {
    var rows = Array.prototype.slice.call(container.querySelectorAll('.facility-recommend-row'));
    // Instant thumbs first; upgrades are staggered inside loadPhotoForRow.
    rows.forEach(loadPhotoForRow);
  }

  function mergeSuggest(local, remote) {
    var out = [];
    var seen = {};
    function push(item) {
      if (!item || !item.name) return;
      var key = item.name + '|' + (item.lat || '') + ',' + (item.lng || '');
      if (seen[key]) return;
      seen[key] = true;
      out.push(item);
    }
    (local || []).forEach(push);
    (remote || []).forEach(push);
    return out.slice(0, 12);
  }

  function updateSuggest(query, container) {
    var box = container.querySelector('#access-dest-suggest');
    var input = container.querySelector('#access-dest');
    if (!box) return;

    if (query.length < 1) {
      state.suggestDest = [];
      box.innerHTML = '';
      return;
    }

    var localItems = [];
    if (typeof NaverTransit !== 'undefined') {
      localItems = NaverTransit.searchLocal(query, 8);
    }
    state.suggestDest = localItems;
    if (input && input.value.trim() === query) {
      box.innerHTML = localItems.length ? renderSuggestions(localItems) : '';
    }

    var reqId = ++state.suggestRequestId;
    fetch(apiUrl('/api/transit-search?q=' + encodeURIComponent(query) + '&limit=10'))
      .then(function (res) {
        if (!res.ok) throw new Error('suggest');
        return res.json();
      })
      .then(function (data) {
        if (reqId !== state.suggestRequestId) return;
        var remoteItems = (data && data.items) ? data.items : [];
        var merged = mergeSuggest(localItems, remoteItems);
        state.suggestDest = merged;
        if (input && input.value.trim() === query) {
          box.innerHTML = merged.length ? renderSuggestions(merged) : '';
        }
      })
      .catch(function () {
        if (reqId !== state.suggestRequestId) return;
        if (input && input.value.trim() === query && localItems.length) {
          box.innerHTML = renderSuggestions(localItems);
        }
      });
  }

  function toggleSearchButton(container) {
    var btn = container.querySelector('#access-dest-search');
    if (!btn) return;
    var hasQuery = !!state.destination.trim();
    btn.hidden = !hasQuery;
    btn.disabled = state.resolvingDestination || isNearbyLoading();
  }

  function bindEvents(container) {
    var input = container.querySelector('#access-dest');
    var searchBtn = container.querySelector('#access-dest-search');
    if (input && !input.dataset.bound) {
      input.dataset.bound = '1';
      var timer;
      input.addEventListener('input', function () {
        state.destination = input.value.trim();
        if (state.destinationPoint && state.destinationPoint.name !== state.destination) {
          state.destinationPoint = null;
          resetNearbyState();
        }
        toggleSearchButton(container);
        clearTimeout(timer);
        timer = setTimeout(function () {
          updateSuggest(state.destination, container);
        }, 200);
      });
      input.addEventListener('focus', function () {
        var value = input.value.trim();
        if (value) updateSuggest(value, container);
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (state.suggestDest.length) {
            applyDestination(state.suggestDest[0]);
            return;
          }
          submitDestinationSearch();
        }
      });
    }

    if (searchBtn && !searchBtn.dataset.bound) {
      searchBtn.dataset.bound = '1';
      searchBtn.addEventListener('click', function () {
        submitDestinationSearch();
      });
    }

    if (!container.dataset.accessSuggestBound) {
      container.dataset.accessSuggestBound = '1';
      container.addEventListener('mousedown', function (e) {
        var suggest = e.target.closest('.access-suggest-item');
        if (!suggest) return;
        e.preventDefault();
        var item = parsePlaceData(suggest);
        if (item) applyDestination(item);
      });
    }

    if (!docClickBound) {
      docClickBound = true;
      document.addEventListener('click', function (e) {
        var root = document.getElementById('view-access');
        if (!root || root.contains(e.target)) return;
        state.suggestDest = [];
        var box = root.querySelector('#access-dest-suggest');
        if (box) box.innerHTML = '';
      });
    }
  }

  function mount() {
    var el = document.getElementById('view-access');
    if (!el) return;
    el.innerHTML = render();
    bindEvents(el);
    if (!isNearbyLoading()) scheduleFacilityPhotos();
  }

  return { render: render, mount: mount, RECOMMENDATIONS: RECOMMENDATIONS };
})();
