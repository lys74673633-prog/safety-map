function getRegionFromAddress(address) {
  if (address.indexOf("서울") === 0) return "서울";
  if (address.indexOf("부산") === 0) return "부산";
  if (address.indexOf("대구") === 0) return "대구";
  if (address.indexOf("인천") === 0) return "인천";
  if (address.indexOf("광주") === 0) return "광주";
  if (address.indexOf("대전") === 0) return "대전";
  if (address.indexOf("울산") === 0) return "울산";
  if (address.indexOf("세종") === 0) return "세종";
  if (address.indexOf("경기") === 0) return "경기";
  if (address.indexOf("강원") === 0) return "강원";
  if (address.indexOf("충청북도") === 0 || address.indexOf("충북") === 0) return "충북";
  if (address.indexOf("충청남도") === 0 || address.indexOf("충남") === 0) return "충남";
  if (address.indexOf("전북") === 0 || address.indexOf("전라북도") === 0) return "전북";
  if (address.indexOf("전남") === 0 || address.indexOf("전라남도") === 0) return "전남";
  if (address.indexOf("경북") === 0 || address.indexOf("경상북도") === 0) return "경북";
  if (address.indexOf("경남") === 0 || address.indexOf("경상남도") === 0) return "경남";
  if (address.indexOf("제주") === 0) return "제주";
  return "전국";
}

var places = [
  { name: "서울특별시립 남부장애인종합복지관", address: "서울특별시 동작구 여의대방로20나길 40", lat: 37.492956, lng: 126.918141, type: "help", category: "장애인 시설", description: "재활·직업훈련·이동 지원 (☎ 02-829-7100)" },
  { name: "서울특별시립 북부장애인종합복지관", address: "서울특별시 노원구 공릉로 232", lat: 37.633079, lng: 127.0768, type: "help", category: "장애인 시설", description: "북부권 장애인 종합복지·재활 서비스 (☎ 02-971-9700)" },
  { name: "서울특별시립발달장애인복지관", address: "서울특별시 동작구 여의대방로20나길 39", lat: 37.492956, lng: 126.918141, type: "help", category: "장애인 시설", description: "발달장애인 전문 재활·교육·돌봄 서비스" },
  { name: "여성긴급전화1366 중앙센터", address: "서울특별시 용산구 효창원로 158", lat: 37.551088, lng: 126.963205, type: "help", category: "여성 안전", description: "전국 1366 통합 운영 중앙센터 (☎ 1366)" },
  { name: "여성긴급전화1366 서울센터", address: "서울특별시 동작구 여의대방로54길 18", lat: 37.51161, lng: 126.927227, type: "help", category: "여성 안전", description: "24시간 가정폭력·성폭력 상담·보호 (☎ 1366)" },
  { name: "종로구종합사회복지관", address: "서울특별시 종로구 종로 347", lat: 37.570131, lng: 126.985482, type: "help", category: "복합 복지 시설", description: "노인·장애인·아동 통합 복지 서비스" },
  { name: "여성긴급전화1366 부산센터", address: "부산광역시 부산진구 중앙대로 845", lat: 35.146142, lng: 129.058369, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "부산광역시장애인종합복지관", address: "부산광역시 연제구 중앙대로1150번길 15", lat: 35.190441, lng: 129.082352, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련·복지 서비스 (☎ 051-790-6100)" },
  { name: "부산시립 노인종합복지관", address: "부산광역시 해운대구 해운대로 548", lat: 35.164738, lng: 129.142212, type: "help", category: "노인복지 시설", description: "노인 건강·여가·복지 프로그램" },
  { name: "여성긴급전화1366 대구센터", address: "대구광역시 중구 태평로 53-13", lat: 35.876048, lng: 128.592008, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "대구광역시립 북부장애인종합복지관", address: "대구광역시 북구 침산로 107", lat: 35.901882, lng: 128.588735, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원" },
  { name: "대구시립 노인종합복지관", address: "대구광역시 수성구 동대구로 57", lat: 35.842246, lng: 128.624562, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램" },
  { name: "여성긴급전화1366 인천센터", address: "인천광역시 부평구 백범로577번길 20", lat: 37.473225, lng: 126.688179, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "인천광역시립 장애인종합복지관", address: "인천광역시 남동구 인주대로 593", lat: 37.448513, lng: 126.729046, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련 종합복지관" },
  { name: "여성긴급전화1366 광주센터", address: "광주광역시 서구 상무자유로 73", lat: 35.152274, lng: 126.842177, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "광주광역시립 노인종합복지관", address: "광주광역시 북구 첨단연신로 90", lat: 35.206726, lng: 126.864357, type: "help", category: "노인복지 시설", description: "노인 건강·여가·복지 프로그램" },
  { name: "여성긴급전화1366 대전센터", address: "대전광역시 중구 대흥로 128", lat: 36.323088, lng: 127.422011, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "대전광역시립장애인종합복지관", address: "대전광역시 유성구 유성대로298번길 175", lat: 36.331585, lng: 127.327685, type: "help", category: "장애인 시설", description: "직업재활·이동 지원·재활치료 (☎ 042-540-3500)" },
  { name: "여성긴급전화1366 울산센터", address: "울산광역시 남구 대학로3번길 1-1", lat: 35.536876, lng: 129.253241, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "여성긴급전화1366 세종센터", address: "세종특별자치시 대평4길 17", lat: 36.473247, lng: 127.275952, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "세종종합사회복지관", address: "세종특별자치시 조치원읍 산책1길 65", lat: 36.59614, lng: 127.301224, type: "help", category: "복합 복지 시설", description: "통합 복지 프로그램 (☎ 044-868-2004)" },
  { name: "종촌종합사회복지관", address: "세종특별자치시 도움1로 116", lat: 36.502662, lng: 127.246775, type: "help", category: "복합 복지 시설", description: "장애인·노인·아동 통합 복지 (☎ 044-850-3000)" },
  { name: "여성긴급전화1366 경기센터", address: "경기도 안양시 만안구 장내로 113", lat: 37.39452, lng: 126.92382, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "여성긴급전화1366 경기북부센터", address: "경기도 의정부시 둔야로 54-1", lat: 37.736364, lng: 127.041378, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "경기도립 장애인종합복지관", address: "경기도 수원시 장안구 송원로 380", lat: 37.28082, lng: 126.98848, type: "help", category: "장애인 시설", description: "경기도 대표 장애인 재활·직업훈련" },
  { name: "여성긴급전화1366 강원센터", address: "강원특별자치도 춘천시 동내면 학곡동1길 13", lat: 37.88452, lng: 127.76452, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "춘천동부노인복지관", address: "강원특별자치도 춘천시 동면 세실로 250", lat: 37.869536, lng: 127.763846, type: "help", category: "노인복지 시설", description: "노인 건강·급식·방문요양 (☎ 033-255-8866)" },
  { name: "원주시장애인종합복지관", address: "강원특별자치도 원주시 동부순환로 9-8", lat: 37.334571, lng: 127.973931, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원 (☎ 033-766-5990)" },
  { name: "강릉노인종합복지관", address: "강원특별자치도 강릉시 경강로 1956", lat: 37.746356, lng: 128.872058, type: "help", category: "노인복지 시설", description: "노인 건강·여가·복지 프로그램 (☎ 033-640-4800)" },
  { name: "여성긴급전화1366 충북센터", address: "충청북도 청주시 상당구 목련로 27", lat: 36.615797, lng: 127.540819, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "청주시장애인종합복지관", address: "충청북도 청주시 상당구 상당로 82", lat: 36.630399, lng: 127.491088, type: "help", category: "장애인 시설", description: "보조기기·재활·이동 지원" },
  { name: "여성긴급전화1366 충남센터", address: "충청남도 공주시 무령로 586", lat: 36.475128, lng: 127.152269, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "여성긴급전화1366 전북센터", address: "전북특별자치도 전주시 완산구 효자로 67-5", lat: 35.819103, lng: 127.112976, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "전북특별자치도립 장애인종합복지관", address: "전북특별자치도 전주시 덕진구 덕진산3로 60", lat: 35.85201, lng: 127.11248, type: "help", category: "장애인 시설", description: "재활·직업훈련·보행훈련" },
  { name: "여성긴급전화1366 전남센터", address: "전라남도 무안군 삼향읍 어진누리길 30", lat: 34.816654, lng: 126.467531, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "목포시립 노인종합복지관", address: "전라남도 목포시 옥암로 221", lat: 34.805205, lng: 126.428163, type: "help", category: "노인복지 시설", description: "도서 지역 노인 복지 서비스" },
  { name: "여성긴급전화1366 경북센터", address: "경상북도 김천시 평화12길 10", lat: 36.13952, lng: 128.11352, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "여성긴급전화1366 경남센터", address: "경상남도 창원시 의창구 북면 동전로 179-18", lat: 35.24672, lng: 128.65783, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "경남장애인종합복지관", address: "경상남도 창원시 성산구 중앙대로 100", lat: 35.219078, lng: 128.676199, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련 종합 서비스" },
  { name: "여성긴급전화1366 제주센터", address: "제주특별자치도 제주시 서해안로 192", lat: 33.509155, lng: 126.478384, type: "help", category: "여성 안전", description: "24시간 여성폭력 피해 지원 (☎ 1366)" },
  { name: "제주특별자치도장애인종합복지관", address: "제주특별자치도 제주시 516로 3120", lat: 33.447806, lng: 126.555712, type: "help", category: "장애인 시설", description: "재활·직업훈련 (☎ 064-702-0295)" },
  { name: "구로 만민중앙교회 인근 무단횡단 사고다발지", address: "서울특별시 구로구 구로동", lat: 37.49562, lng: 126.88732, type: "danger", category: "보행자 안전", description: "서울시 무단횡단 사고 최다 발생 지점 (TAAS)" },
  { name: "신설동역 인근 무단횡단 사고다발지", address: "서울특별시 동대문구 신설동", lat: 37.574519, lng: 127.025447, type: "danger", category: "보행자 안전", description: "서울시 무단횡단 사고 다발지역 (TAAS)" },
  { name: "영등포역 인근 무단횡단 사고다발지", address: "서울특별시 영등포구 영등포동", lat: 37.515565, lng: 126.907505, type: "danger", category: "보행자 안전", description: "무단횡단 교통사고 다발지 (TAAS)" },
  { name: "부전시장 앞 무단횡단 사고다발지", address: "부산광역시 부산진구 부전동", lat: 35.160665, lng: 129.061432, type: "danger", category: "노인 안전", description: "부산시 무단횡단 사고 다발지" },
  { name: "부산 교대역 앞 횡단보도", address: "부산광역시 해운대구 우동", lat: 35.01252, lng: 129.08252, type: "danger", category: "보행자 안전", description: "부산자치경찰 무단횡단 개선 대상지" },
  { name: "해운대해수욕장", address: "부산광역시 해운대구 해운대해변로 264", lat: 35.162939, lng: 129.139332, type: "danger", category: "관광객 안전", description: "여름철 관광객 집중. 해안·파도 주의" },
  { name: "부평역 사거리 무단횡단 사고다발지", address: "인천광역시 부평구 부평동", lat: 37.491413, lng: 126.721391, type: "danger", category: "보행자 안전", description: "보행자 교통사고 다발지 (TAAS)" },
  { name: "대전 은행네거리 무단횡단 사고다발지", address: "대전광역시 중구 은행동", lat: 36.32928, lng: 127.42704, type: "danger", category: "노인 안전", description: "무단횡단·노인 보행 사고 다발지 (TAAS)" },
  { name: "강릉 안목해변", address: "강원특별자치도 강릉시 견소동 안목해변", lat: 37.76672, lng: 128.94258, type: "danger", category: "관광객 안전", description: "여름철 관광객 집중 해안" },
  { name: "여수 오동도", address: "전라남도 여수시 수정동 오동도", lat: 34.742989, lng: 127.750795, type: "danger", category: "관광객 안전", description: "관광지·야간 조명 부족 구간" },
  { name: "경주 불국사 황토현길", address: "경상북도 경주시 불국로 385", lat: 35.788995, lng: 129.33089, type: "danger", category: "노인 안전", description: "언덕·돌길. 고령 관광객 낙상 주의" },
  { name: "성산일출봉", address: "제주특별자치도 서귀포시 성산읍 일출로 284", lat: 33.462756, lng: 126.935044, type: "danger", category: "관광객 안전", description: "해안 절벽·추락 위험 구간" },
  { name: "한라산 백록담 코스", address: "제주특별자치도 서귀포시 상효동", lat: 33.289625, lng: 126.594509, type: "danger", category: "관광객 안전", description: "고령·장애인 등산 접근 어려운 험로" },
  { name: "김해국제공항 인근", address: "경상남도 김해시 공항로 108", lat: 35.17952, lng: 128.93852, type: "danger", category: "교통 안전", description: "교통 혼잡·횡단보도 사고 주의" },
  { name: "서울시립 동부장애인종합복지관", address: "서울특별시 송파구 백제고분로 364", lat: 37.514315, lng: 127.077661, type: "help", category: "장애인 시설", description: "동부권 장애인 재활·직업훈련·복지 (☎ 02-403-7100)" },
  { name: "서울시립 중앙노인종합복지관", address: "서울특별시 중구 을지로45길 37", lat: 37.566558, lng: 127.012212, type: "help", category: "노인복지 시설", description: "서울 대표 노인 건강·여가·복지 프로그램" },
  { name: "서울시립 서북보도아리랑복지관", address: "서울특별시 은평구 증산로 212", lat: 37.59212, lng: 126.913866, type: "help", category: "장애인 시설", description: "시각·청각 장애인 전문 재활·교육" },
  { name: "강남구립 강남구복지관", address: "서울특별시 강남구 학동로 61", lat: 37.519356, lng: 127.05359, type: "help", category: "복합 복지 시설", description: "노인·장애인·아동 통합 복지 서비스" },
  { name: "마포구립 장애인복지관", address: "서울특별시 마포구 월드컵북로 248", lat: 37.565612, lng: 126.911474, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원" },
  { name: "동작구 아동보호전문기관", address: "서울특별시 동작구 노량진로32길 79", lat: 37.510441, lng: 126.956153, type: "help", category: "아동 안전", description: "아동학대 상담·조사·보호 전문기관 (☎ 1577-1391)" },
  { name: "부산광역시립 동부종합사회복지관", address: "부산광역시 수영구 좌수영로 243", lat: 35.174124, lng: 129.119831, type: "help", category: "복합 복지 시설", description: "동부권 통합 복지·돌봄 서비스" },
  { name: "부산광역시립 중앙여성해바라기센터", address: "부산광역시 부산진구 중앙대로 686", lat: 35.153945, lng: 129.059603, type: "help", category: "여성 안전", description: "성폭력 피해자 지원·상담·의료·수사 연계" },
  { name: "인천광역시립 노인종합복지관", address: "인천광역시 남동구 백범로 587", lat: 37.458347, lng: 126.728336, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램" },
  { name: "대구광역시립 남부장애인종합복지관", address: "대구광역시 수성구 범어천로 113", lat: 35.856397, lng: 128.622403, type: "help", category: "장애인 시설", description: "남부권 장애인 재활·직업훈련" },
  { name: "광주광역시립 장애인종합복지관", address: "광주광역시 북구 첨단연신로 33", lat: 35.199279, lng: 126.858893, type: "help", category: "장애인 시설", description: "재활·직업훈련·이동 지원" },
  { name: "울산광역시장애인종합복지관", address: "울산광역시 중구 백양로 160", lat: 35.574423, lng: 129.311295, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련·복지 서비스 (☎ 052-242-1778)" },
  { name: "수원시립장애인복지관", address: "경기도 수원시 팔달구 효원로 297", lat: 37.268181, lng: 127.009411, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원" },
  { name: "성남시립중앙노인종합복지관", address: "경기도 성남시 분당구 불정로 389", lat: 37.377077, lng: 127.140708, type: "help", category: "노인복지 시설", description: "노인 건강·급식·방문요양" },
  { name: "고양시립 노인종합복지관", address: "경기도 고양시 덕양구 향동로 128", lat: 37.600844, lng: 126.890241, type: "help", category: "노인복지 시설", description: "노인 건강·여가·복지 프로그램" },
  { name: "강원특별자치도립 장애인복지관", address: "강원특별자치도 춘천시 후석로462번길 7", lat: 37.890477, lng: 127.74525, type: "help", category: "장애인 시설", description: "강원도 대표 장애인 재활·직업훈련" },
  { name: "천안시장애인종합복지관", address: "충청남도 천안시 서북구 두정고2길 51", lat: 36.837885, lng: 127.131518, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원 (☎ 041-551-0420)" },
  { name: "순천시장애인종합복지관", address: "전라남도 순천시 서면 청소년수련원길 2", lat: 35.006669, lng: 127.47943, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련·복지 서비스 (☎ 061-755-4450)" },
  { name: "경주시노인종합복지관", address: "경상북도 경주시 원효로 38", lat: 35.841869, lng: 129.216223, type: "help", category: "노인복지 시설", description: "노인 건강·여가·복지 프로그램" },
  { name: "제주특별자치도 노인복지관", address: "제주특별자치도 제주시 과원북4길 12", lat: 33.480679, lng: 126.482263, type: "help", category: "노인복지 시설", description: "제주 노인 건강·돌봄·여가 서비스" },
  { name: "마포역 인근 무단횡단 사고다발지", address: "서울특별시 마포구 마포동", lat: 37.540902, lng: 126.947848, type: "danger", category: "보행자 안전", description: "서울시 무단횡단 교통사고 다발지 (TAAS)" },
  { name: "강남역 인근 무단횡단 사고다발지", address: "서울특별시 강남구 역삼동", lat: 37.494264, lng: 127.029632, type: "danger", category: "보행자 안전", description: "유동인구·무단횡단 사고 다발지 (TAAS)" },
  { name: "종로3가역 인근 무단횡단 사고다발지", address: "서울특별시 종로구 종로3가", lat: 37.57044, lng: 126.992324, type: "danger", category: "보행자 안전", description: "서울시 무단횡단 사고 다발지 (TAAS)" },
  { name: "서울역 환승구역 무단횡단 사고다발지", address: "서울특별시 중구 봉래동", lat: 37.554824, lng: 126.972217, type: "danger", category: "보행자 안전", description: "교통·보행 혼잡 다발지 (TAAS)" },
  { name: "대구 반월당역 인근 무단횡단 사고다발지", address: "대구광역시 중구 공평동", lat: 35.866491, lng: 128.593267, type: "danger", category: "보행자 안전", description: "대구시 무단횡단 사고 다발지 (TAAS)" },
  { name: "광주 금남로4가 무단횡단 사고다발지", address: "광주광역시 동구 금남로4가", lat: 35.150706, lng: 126.914581, type: "danger", category: "노인 안전", description: "무단횡단·보행 사고 다발지 (TAAS)" },
  { name: "창원중앙역 앞 무단횡단 사고다발지", address: "경상남도 창원시 의창구 중앙동", lat: 35.242367, lng: 128.701193, type: "danger", category: "보행자 안전", description: "보행자 교통사고 다발지 (TAAS)" },
  { name: "부산 서면역 인근 무단횡단 사고다발지", address: "부산광역시 부산진구 부전동", lat: 35.158165, lng: 129.059526, type: "danger", category: "보행자 안전", description: "부산시 무단횡단 사고 다발지 (TAAS)" },
  { name: "전주 한옥마을", address: "전북특별자치도 전주시 완산구 기린로 99", lat: 35.815988, lng: 127.153077, type: "danger", category: "노인 안전", description: "돌길·경사. 고령·휠체어 이동 낙상 주의" },
  { name: "설악산 권금성 코스", address: "강원특별자치도 속초시 설악동", lat: 38.16691, lng: 128.517205, type: "danger", category: "관광객 안전", description: "험로·낙석·기상 변화. 고령·지체 약자 등산 위험" },
  { name: "제주 용두암 해안", address: "제주특별자치도 제주시 용두암길 15", lat: 33.515202, lng: 126.511926, type: "danger", category: "관광객 안전", description: "파도·절벽·바람. 해안 낙상·익수 주의" },
  { name: "속초해수욕장", address: "강원특별자치도 속초시 조양로 116", lat: 38.187329, lng: 128.588106, type: "danger", category: "관광객 안전", description: "여름철 관광객 집중. 해안·파도·야간 주의" },
  { name: "서울시립 서초노인종합복지관", address: "서울특별시 서초구 서초대로38길 12", lat: 37.490048, lng: 127.005695, type: "help", category: "노인복지 시설", description: "서초권 노인 건강·여가·복지 프로그램" },
  { name: "서울시립은평노인종합복지관", address: "서울특별시 은평구 통일로 855", lat: 37.619277, lng: 126.919805, type: "help", category: "노인복지 시설", description: "은평권 노인 건강·급식·방문요양" },
  { name: "서울시립서부장애인종합복지관", address: "서울특별시 강서구 공항대로 376", lat: 37.556681, lng: 126.848401, type: "help", category: "장애인 시설", description: "서부권 장애인 재활·직업훈련·복지" },
  { name: "용산구종합사회복지관", address: "서울특별시 용산구 한강대로 211", lat: 37.537218, lng: 126.972834, type: "help", category: "복합 복지 시설", description: "노인·장애인·아동 통합 복지 서비스" },
  { name: "대전광역시노인복지관", address: "대전광역시 중구 테미로 26", lat: 36.318623, lng: 127.420411, type: "help", category: "노인복지 시설", description: "대전 노인 건강·급식·여가 프로그램" },
  { name: "울산광역시 노인복지관", address: "울산광역시 남구 삼산중로 136", lat: 35.537658, lng: 129.335776, type: "help", category: "노인복지 시설", description: "노인 건강·여가·복지 프로그램 (☎ 052-256-6820)" },
  { name: "안양시관악장애인종합복지관", address: "경기도 안양시 만안구 경수대로 1132", lat: 37.432023, lng: 126.903863, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원" },
  { name: "부천시장애인종합복지관", address: "경기도 부천시 오정구 역곡로 367", lat: 37.50922, lng: 126.812127, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련·복지 서비스" },
  { name: "여수시장애인종합복지관", address: "전라남도 여수시 만성로 173", lat: 34.773274, lng: 127.714751, type: "help", category: "장애인 시설", description: "재활·직업훈련·이동 지원 (☎ 061-652-5005)" },
  { name: "홍대입구역 인근 무단횡단 사고다발지", address: "서울특별시 마포구 서교동", lat: 37.557414, lng: 126.923773, type: "danger", category: "보행자 안전", description: "서울시 무단횡단 교통사고 다발지 (TAAS)" },
  { name: "수원역 인근 무단횡단 사고다발지", address: "경기도 수원시 팔달구 매산로", lat: 37.26714, lng: 127.002303, type: "danger", category: "보행자 안전", description: "경기 TAAS 무단횡단 사고 다발지" },
  { name: "울산 태화강역 인근 무단횡단 사고다발지", address: "울산광역시 중구 태화동", lat: 35.538809, lng: 129.354011, type: "danger", category: "보행자 안전", description: "울산시 무단횡단 사고 다발지 (TAAS)" },
  { name: "경포대 해수욕장", address: "강원특별자치도 강릉시 경포로 365", lat: 37.781774, lng: 128.889277, type: "danger", category: "관광객 안전", description: "여름철 관광객 집중. 해안·파도·야간 주의" },
  { name: "남이섬", address: "강원특별자치도 춘천시 남산면 남이섬길 1", lat: 37.791728, lng: 127.525144, type: "danger", category: "관광객 안전", description: "섬·계단·혼잡. 고령·지체 약자 이동 주의" },
  { name: "정동진 해변", address: "강원특별자치도 강릉시 강동면 정동진리", lat: 37.69183, lng: 129.032508, type: "danger", category: "관광객 안전", description: "기차·해변 관광지. 야간·파도 주의" },
  { name: "구미시장애인종합복지관", address: "경상북도 구미시 공원로 340", lat: 36.106405, lng: 128.316751, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원 (☎ 054-457-3172)" },
  { name: "구미시노인종합복지관", address: "경상북도 구미시 산책길 51", lat: 36.123305, lng: 128.326062, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램 (☎ 054-480-4853)" },
  { name: "경주시장애인종합복지관", address: "경상북도 경주시 유림로5번길 99-11", lat: 35.879793, lng: 129.219481, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스 (☎ 054-776-7522)" },
  { name: "경주시종합사회복지관", address: "경상북도 경주시 승삼1길 32", lat: 35.877034, lng: 129.229242, type: "help", category: "복합 복지 시설", description: "노인·장애인·아동 통합 복지 (☎ 054-771-8107)" },
  { name: "안동시장애인종합복지관", address: "경상북도 안동시 옥동1길 21", lat: 36.55921, lng: 128.701996, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스 (☎ 054-855-7801)" },
  { name: "김천시장애인종합복지관", address: "경상북도 김천시 환경로 136-6", lat: 36.133861, lng: 128.14404, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원 (☎ 054-434-2400)" },
  { name: "김천시노인복지관", address: "경상북도 김천시 중앙공원1길 16", lat: 36.139722, lng: 128.113889, type: "help", category: "노인복지 시설", description: "노인 건강·여가·복지 프로그램" },
  { name: "경산시장애인종합복지관", address: "경상북도 경산시 경청로222길 79", lat: 35.825632, lng: 128.741024, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스 (☎ 053-719-2340)" },
  { name: "포항시장애인종합복지관", address: "경상북도 포항시 남구 형산강북로 389", lat: 36.009763, lng: 129.36762, type: "help", category: "장애인 시설", description: "재활·직업훈련·이동 지원 (☎ 054-282-4009)" },
  { name: "포항시노인복지회관", address: "경상북도 포항시 북구 삼호로 355", lat: 36.051791, lng: 129.372545, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램 (☎ 054-280-9450)" },
  { name: "영주시장애인종합복지관", address: "경상북도 영주시 원당로52번길 25", lat: 36.805812, lng: 128.624218, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스 (☎ 054-633-6415)" },
  { name: "영주시노인복지관", address: "경상북도 영주시 원당로52번길 19", lat: 36.806512, lng: 128.623518, type: "help", category: "노인복지 시설", description: "노인 건강·여가·복지 프로그램" },
  { name: "상주시장애인종합복지관", address: "경상북도 상주시 만산8길 11", lat: 36.428512, lng: 128.159312, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스 (☎ 054-534-6933)" },
  { name: "상주시노인종합복지관", address: "경상북도 상주시 중앙로 111", lat: 36.415683, lng: 128.155787, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램 (☎ 054-536-6232)" },
  { name: "진주시장애인종합복지관", address: "경상남도 진주시 동진로 273", lat: 35.179606, lng: 128.108152, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스 (☎ 055-762-0179)" },
  { name: "김해시노인종합복지관", address: "경상남도 김해시 김해대로1902번길 12", lat: 35.250733, lng: 128.867215, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램 (☎ 055-310-8400)" },
  { name: "김해시장애인종합복지관", address: "경상남도 김해시 삼계로 140", lat: 35.263789, lng: 128.875615, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스 (☎ 055-310-8930)" },
  { name: "양산시장애인복지관", address: "경상남도 양산시 북안남5길 15", lat: 35.345846, lng: 129.040313, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원 (☎ 055-367-9655)" },
  { name: "거제시장애인복지관", address: "경상남도 거제시 양정1길 45", lat: 34.869197, lng: 128.646089, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련·복지 서비스" },
  { name: "통영시장애인종합복지관", address: "경상남도 통영시 용남면 기호바깥길 7-89", lat: 34.876885, lng: 128.419872, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스 (☎ 055-650-9900)" },
  { name: "충청북도장애인종합복지관", address: "충청북도 충주시 도장관주로 34-17", lat: 36.947672, lng: 127.929238, type: "help", category: "장애인 시설", description: "충북 대표 장애인 재활·직업훈련 (☎ 043-856-1100)" },
  { name: "제천시노인종합복지관", address: "충청북도 제천시 의림대로 174", lat: 37.129382, lng: 128.206028, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램" },
  { name: "제천시장애인종합복지관", address: "충청북도 제천시 의림대로 242", lat: 37.148829, lng: 128.216662, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원" },
  { name: "익산시노인종합복지관", address: "전북특별자치도 익산시 동서로 103", lat: 35.955761, lng: 126.95067, type: "help", category: "노인복지 시설", description: "노인 건강·여가·복지 프로그램" },
  { name: "익산시장애인종합복지관", address: "전북특별자치도 익산시 인북로 21", lat: 35.956699, lng: 126.961616, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스" },
  { name: "군산시장애인종합복지관", address: "전북특별자치도 군산시 칠성안3길 37", lat: 35.959581, lng: 126.67582, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원 (☎ 063-466-7981)" },
  { name: "전라남도장애인종합복지관", address: "전라남도 나주시 내영산1길 67", lat: 35.007617, lng: 126.697639, type: "help", category: "장애인 시설", description: "전남 대표 장애인 재활·직업훈련 (☎ 061-332-4107)" },
  { name: "충청남도서부장애인종합복지관", address: "충청남도 보령시 주교면 보령북로 404", lat: 36.353037, lng: 126.596305, type: "help", category: "장애인 시설", description: "충남 서부권 장애인 재활·직업훈련 (☎ 041-934-7230)" },
  { name: "경주 대릉원", address: "경상북도 경주시 화랑로 44", lat: 35.837403, lng: 129.212534, type: "danger", category: "노인 안전", description: "고분·잔디·경사. 고령·휠체어 이동 낙상 주의" },
  { name: "안동 하회마을", address: "경상북도 안동시 풍천면 하회종길 63", lat: 36.563253, lng: 128.730742, type: "danger", category: "노인 안전", description: "돌길·경사·관광 혼잡. 고령·지체 약자 이동 주의" },
  { name: "구미역 인근 무단횡단 사고다발지", address: "경상북도 구미시 원평동", lat: 36.128312, lng: 128.331045, type: "danger", category: "보행자 안전", description: "구미시 보행자 교통사고 다발지 (TAAS)" },
  { name: "진주성", address: "경상남도 진주시 남강로 626", lat: 35.188817, lng: 128.077604, type: "danger", category: "노인 안전", description: "성곽·계단·경사. 고령 관광객 낙상 주의" },
  { name: "통영 동피랑항", address: "경상남도 통영시 동호로 16", lat: 34.845669, lng: 128.427728, type: "danger", category: "관광객 안전", description: "해안·계단·야간 조명 부족 구간 주의" },
  { name: "유성구장애인종합복지관", address: "대전광역시 유성구 북유성대로 166", lat: 36.381389, lng: 127.323333, type: "help", category: "장애인 시설", description: "구립 장애인 재활·직업훈련·일상돌봄 (☎ 042-820-6851)" },
  { name: "대덕구장애인종합복지관", address: "대전광역시 대덕구 신탄진로 77", lat: 36.40657, lng: 127.423569, type: "help", category: "장애인 시설", description: "구립 장애인 재활·직업훈련 (☎ 042-637-8848)" },
  { name: "춘천시장애인종합복지관", address: "강원특별자치도 춘천시 영서로 1925-21", lat: 37.856282, lng: 127.737259, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원 (☎ 033-262-0035)" },
  { name: "포항시북부장애인종합복지관", address: "경상북도 포항시 북구 새천년대로 1486", lat: 36.078784, lng: 129.40961, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스 (☎ 054-231-1117)" },
  { name: "용인시처인장애인복지관", address: "경기도 용인시 처인구 경안천로 318", lat: 37.259606, lng: 127.219327, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원 (☎ 031-320-4800)" },
  { name: "용인시기흥장애인복지관", address: "경기도 용인시 기흥구 용구대로2469번길 94", lat: 37.313116, lng: 127.104893, type: "help", category: "장애인 시설", description: "구립 장애인 재활·직업훈련 (☎ 031-895-3200)" },
  { name: "화성시아르딤복지관", address: "경기도 화성시 향남읍 도이1길 104", lat: 37.136643, lng: 126.919127, type: "help", category: "장애인 시설", description: "장애인 종합 재활·직업훈련 (☎ 031-5183-8900)" },
  { name: "화성시동탄아르딤복지관", address: "경기도 화성시 동탄대로10길 17-12", lat: 37.176574, lng: 127.107887, type: "help", category: "장애인 시설", description: "동탄권 장애인 재활·복지 (☎ 031-8077-0800)" },
  { name: "에바다장애인종합복지관", address: "경기도 평택시 팽성읍 노와길 447", lat: 36.759892, lng: 127.075421, type: "help", category: "장애인 시설", description: "재활·직업훈련·주간보호 (☎ 031-692-2362)" },
  { name: "평택북부장애인복지관", address: "경기도 평택시 서정로 295", lat: 37.072202, lng: 127.046438, type: "help", category: "장애인 시설", description: "북부권 장애인 종합 재활 (☎ 031-615-3975)" },
  { name: "안산시장애인종합복지관", address: "경기도 안산시 단원구 원초로 80", lat: 37.317842, lng: 126.802341, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 (☎ 031-403-0078)" },
  { name: "의정부시장애인종합복지관", address: "경기도 의정부시 용민로 160", lat: 37.744422, lng: 127.092296, type: "help", category: "장애인 시설", description: "활동지원·재활·직업훈련 (☎ 031-837-5300)" },
  { name: "남양주시장애인종합복지관", address: "경기도 남양주시 홍유릉로 273-1", lat: 37.632742, lng: 127.205911, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스 (☎ 031-590-0200)" },
  { name: "시흥시장애인복지관", address: "경기도 시흥시 서울대학로278번길 25", lat: 37.369769, lng: 126.729141, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 지원 (☎ 031-496-7700)" },
  { name: "광명시장애인종합복지관", address: "경기도 광명시 광명로 721", lat: 37.463327, lng: 126.845663, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련·복지 (☎ 02-2680-6600)" },
  { name: "파주시장애인종합복지관", address: "경기도 파주시 경의로 1080", lat: 37.713831, lng: 126.759973, type: "help", category: "장애인 시설", description: "재활·직업훈련·이동 지원 (☎ 031-940-6600)" },
  { name: "안양시노인종합복지관", address: "경기도 안양시 만안구 석수로 97", lat: 37.379718, lng: 126.950773, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램 (☎ 031-463-6900)" },
  { name: "서울동부해바라기센터", address: "서울특별시 송파구 송이로 123", lat: 37.48757, lng: 127.132157, type: "help", category: "여성 안전", description: "성폭력·가정폭력 24시간 통합지원 (☎ 02-3400-1700)" },
  { name: "서울해바라기아동센터", address: "서울특별시 구로구 구프라자1로 68", lat: 37.484512, lng: 126.898421, type: "help", category: "아동 안전", description: "아동·청소년 성폭력 피해 전문 지원 (☎ 02-3274-1375)" },
  { name: "인천북부해바라기센터", address: "인천광역시 부평구 동수로 56", lat: 37.485831, lng: 126.737311, type: "help", category: "여성 안전", description: "365일 성폭력 피해자 상담·의료·수사 연계 (☎ 032-280-5678)" },
  { name: "인천동부해바라기센터", address: "인천광역시 동구 방축로 217", lat: 37.48039, lng: 126.663562, type: "help", category: "여성 안전", description: "성폭력·가정폭력 위기 지원 (☎ 032-582-1170)" },
  { name: "인천아동보호전문기관", address: "인천광역시 남동구 남동대로 769", lat: 37.450065, lng: 126.707599, type: "help", category: "아동 안전", description: "아동학대 상담·조사·보호 (☎ 1577-1391)" },
  { name: "대구해바라기아동센터", address: "대구광역시 중구 동덕로 125", lat: 35.865873, lng: 128.603042, type: "help", category: "아동 안전", description: "아동·청소년 성폭력 피해 지원 (☎ 053-421-1375)" },
  { name: "아산시장애인복지관", address: "충청남도 아산시 곡교천로27번길 10", lat: 36.789421, lng: 127.002341, type: "help", category: "장애인 시설", description: "재활·직업훈련·보조기기 (☎ 041-545-8800)" },
  { name: "공주시장애인종합복지관", address: "충청남도 공주시 번영1로 70", lat: 36.469495, lng: 127.131421, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련·복지" },
  { name: "서산시장애인종합복지관", address: "충청남도 서산시 예천2로 28", lat: 36.768748, lng: 126.443784, type: "help", category: "장애인 시설", description: "재활·직업훈련·이동 지원" },
  { name: "충주시노인종합복지관", address: "충청북도 충주시 중원대로 3019", lat: 36.992593, lng: 127.747852, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램" },
  { name: "광양시장애인복지관", address: "전라남도 광양시 광양읍 대림오성로 117", lat: 34.874512, lng: 127.582341, type: "help", category: "장애인 시설", description: "재활·직업훈련 (☎ 061-761-4438)" },
  { name: "나주시장애인종합복지관", address: "전라남도 나주시 빛가람로 685", lat: 35.021571, lng: 126.786661, type: "help", category: "장애인 시설", description: "전남 서부권 장애인 재활·복지" },
  { name: "정읍시장애인종합복지관", address: "전북특별자치도 정읍시 연지2길 20", lat: 35.570971, lng: 126.840932, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스" },
  { name: "군산시노인종합복지관", address: "전북특별자치도 군산시 수송로 195", lat: 35.96396, lng: 126.713776, type: "help", category: "노인복지 시설", description: "노인 건강·급식·방문요양" },
  { name: "강원도장애인종합복지관 속초분관", address: "강원특별자치도 속초시 청초호반로 201", lat: 38.19022, lng: 128.590988, type: "help", category: "장애인 시설", description: "속초·고성·양양권 재활·활동지원 (☎ 033-636-2491)" },
  { name: "동해시노인종합복지관", address: "강원특별자치도 동해시 발한로 67", lat: 37.546929, lng: 129.105945, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램" },
  { name: "영천시장애인종합복지관", address: "경상북도 영천시 보목2길 10", lat: 35.974512, lng: 128.942341, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 (☎ 054-333-3535)" },
  { name: "문경시장애인종합복지관", address: "경상북도 문경시 중앙로 27", lat: 36.591131, lng: 128.195819, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련" },
  { name: "밀양시장애인종합복지관", address: "경상남도 밀양시 삼문중앙로 36", lat: 35.484375, lng: 128.754716, type: "help", category: "장애인 시설", description: "재활·직업훈련·이동 지원" },
  { name: "창원시성산노인종합복지관", address: "경상남도 창원시 성산구 중앙대로100번길 16", lat: 35.222829, lng: 128.680772, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램" },
  { name: "청주역 인근 무단횡단 사고다발지", address: "충청북도 청주시 흥덕구 가경동", lat: 36.620066, lng: 127.434147, type: "danger", category: "보행자 안전", description: "청주시 무단횡단 교통사고 다발지 (TAAS)" },
  { name: "전주역 인근 무단횡단 사고다발지", address: "전북특별자치도 전주시 덕진구 인후동", lat: 35.850421, lng: 127.162341, type: "danger", category: "보행자 안전", description: "전주시 보행자 교통사고 다발지 (TAAS)" },
  { name: "춘천 중앙로 무단횡단 사고다발지", address: "강원특별자치도 춘천시 조양동", lat: 37.879924, lng: 127.730335, type: "danger", category: "보행자 안전", description: "춘천시 무단횡단 사고 다발지 (TAAS)" },
  { name: "원주역 인근 무단횡단 사고다발지", address: "강원특별자치도 원주시 무실동", lat: 37.338281, lng: 127.929048, type: "danger", category: "보행자 안전", description: "원주시 보행자 교통사고 다발지 (TAAS)" },
  { name: "제주연동 무단횡단 사고다발지", address: "제주특별자치도 제주시 연동", lat: 33.47575, lng: 126.49418, type: "danger", category: "보행자 안전", description: "제주시 무단횡단 사고 다발지 (TAAS)" },
  { name: "안양역 인근 무단횡단 사고다발지", address: "경기도 안양시 만안구 안양동", lat: 37.39769, lng: 126.922572, type: "danger", category: "보행자 안전", description: "경기 TAAS 무단횡단 사고 다발지" },
  { name: "부천역 인근 무단횡단 사고다발지", address: "경기도 부천시 원미구 중동", lat: 37.486778, lng: 126.763967, type: "danger", category: "보행자 안전", description: "부천시 보행자 교통사고 다발지 (TAAS)" },
  { name: "천안역 인근 무단횡단 사고다발지", address: "충청남도 천안시 동남구 대흥동", lat: 36.809348, lng: 127.147823, type: "danger", category: "보행자 안전", description: "천안시 무단횡단 사고 다발지 (TAAS)" },
  { name: "포항역 인근 무단횡단 사고다발지", address: "경상북도 포항시 북구 대도동", lat: 36.071842, lng: 129.342341, type: "danger", category: "보행자 안전", description: "포항시 보행자 교통사고 다발지 (TAAS)" },
  { name: "순천역 인근 무단횡단 사고다발지", address: "전라남도 순천시 조례동", lat: 34.959248, lng: 127.523377, type: "danger", category: "보행자 안전", description: "순천시 무단횡단 사고 다발지 (TAAS)" },
  { name: "인천 차이나타운 무단횡단 사고다발지", address: "인천광역시 중구 차이나타운로", lat: 37.47471, lng: 126.618198, type: "danger", category: "노인 안전", description: "인천시 보행·무단횡단 사고 다발지 (TAAS)" },
  { name: "동대구역 인근 무단횡단 사고다발지", address: "대구광역시 동구 신암동", lat: 35.88399, lng: 128.62359, type: "danger", category: "보행자 안전", description: "대구시 보행자 교통사고 다발지 (TAAS)" },
  { name: "익산역 인근 무단횡단 사고다발지", address: "전북특별자치도 익산시 모현동", lat: 35.948177, lng: 126.945426, type: "danger", category: "보행자 안전", description: "익산시 무단횡단 사고 다발지 (TAAS)" },
  { name: "목포역 인근 무단횡단 사고다발지", address: "전라남도 목포시 용당동", lat: 34.804756, lng: 126.397675, type: "danger", category: "보행자 안전", description: "목포시 보행자 교통사고 다발지 (TAAS)" },
  { name: "공주역 인근 무단횡단 사고다발지", address: "충청남도 공주시 금학동", lat: 36.431295, lng: 127.12403, type: "danger", category: "노인 안전", description: "공주시 무단횡단·노인 보행 사고 다발지 (TAAS)" },
  { name: "의정부역 인근 무단횡단 사고다발지", address: "경기도 의정부시 의정부동", lat: 37.739354, lng: 127.046458, type: "danger", category: "보행자 안전", description: "의정부시 보행자 교통사고 다발지 (TAAS)" },
  { name: "삼척종합사회복지관", address: "강원특별자치도 삼척시 원당로2길 72-6", lat: 37.438916, lng: 129.153575, type: "help", category: "복합 복지 시설", description: "노인·장애인·아동 통합 복지 (☎ 033-573-6168)" },
  { name: "태백시장애인종합복지관", address: "강원특별자치도 태백시 태붐로 16", lat: 37.164989, lng: 128.986546, type: "help", category: "장애인 시설", description: "재활·직업훈련·복지 서비스 (☎ 033-550-7800)" },
  { name: "속초시노인종합복지관", address: "강원특별자치도 속초시 청호로 80", lat: 38.190374, lng: 128.599564, type: "help", category: "노인복지 시설", description: "노인 건강·급식·여가 프로그램 (☎ 033-638-8800)" },
  { name: "강원서부해바라기센터", address: "강원특별자치도 춘천시 백령로 156", lat: 37.878989, lng: 127.74917, type: "help", category: "여성 안전", description: "성폭력 피해자 24시간 통합지원 (☎ 033-252-1375)" },
  { name: "강원남부해바라기센터", address: "강원특별자치도 원주시 일산로36번길 12", lat: 37.34718, lng: 127.946379, type: "help", category: "여성 안전", description: "성폭력·가정폭력 위기 지원 (☎ 033-735-1375)" },
  { name: "당진시장애인복지관", address: "충청남도 당진시 시청1로 38", lat: 36.89102, lng: 126.642328, type: "help", category: "장애인 시설", description: "재활·직업훈련·사회통합 지원 (☎ 041-360-3040)" },
  { name: "전북해바라기센터", address: "전북특별자치도 전주시 덕진구 건지로 20", lat: 35.827412, lng: 127.085231, type: "help", category: "여성 안전", description: "성폭력 피해자 통합지원 (☎ 063-250-1375)" },
  { name: "광주해바라기센터", address: "광주광역시 동구 필문대로 365", lat: 35.140354, lng: 126.923277, type: "help", category: "여성 안전", description: "24시간 성폭력·가정폭력 위기 지원 (☎ 062-225-3117)" },
  { name: "광주해바라기아동센터", address: "광주광역시 동구 제봉로 57", lat: 35.152808, lng: 126.917023, type: "help", category: "아동 안전", description: "아동·청소년 성폭력 피해 전문 지원 (☎ 062-232-1375)" },
  { name: "거창군장애인종합복지관", address: "경상남도 거창군 거창읍 중앙로 77", lat: 35.684922, lng: 127.904658, type: "help", category: "장애인 시설", description: "군 지역 장애인 재활·복지 (☎ 055-940-8800)" },
  { name: "성주군장애인복지관", address: "경상북도 성주군 성주읍 성주로 77", lat: 35.928666, lng: 128.272467, type: "help", category: "장애인 시설", description: "장애인 재활·직업훈련·복지 (☎ 054-930-8800)" },
  { name: "울산해바라기센터", address: "울산광역시 남구 삼산로 277", lat: 35.539857, lng: 129.341688, type: "help", category: "여성 안전", description: "성폭력·가정폭력 위기 지원 (☎ 052-250-1375)" },
  { name: "삼척역 인근 무단횡단 사고다발지", address: "강원특별자치도 삼척시 남양동", lat: 37.412362, lng: 129.166287, type: "danger", category: "보행자 안전", description: "삼척시 보행자 교통사고 다발지 (TAAS)" },
  { name: "태백역 인근 무단횡단 사고다발지", address: "강원특별자치도 태백시 황지동", lat: 37.164986, lng: 128.985449, type: "danger", category: "노인 안전", description: "태백시 무단횡단·보행 사고 다발지 (TAAS)" },
  { name: "당진역 인근 무단횡단 사고다발지", address: "충청남도 당진시 읍내동", lat: 36.89431, lng: 126.636024, type: "danger", category: "보행자 안전", description: "당진시 보행자 교통사고 다발지 (TAAS)" },
  { name: "여수역 인근 무단횡단 사고다발지", address: "전라남도 여수시 학동", lat: 34.758105, lng: 127.665867, type: "danger", category: "보행자 안전", description: "여수시 무단횡단 사고 다발지 (TAAS)" },
  { name: "강릉역 인근 무단횡단 사고다발지", address: "강원특별자치도 강릉시 옥천동", lat: 37.760626, lng: 128.903583, type: "danger", category: "보행자 안전", description: "강릉시 보행자 교통사고 다발지 (TAAS)" },

];

places.forEach(function (p, i) {
  p.id = i;
  p.region = getRegionFromAddress(p.address);
});

if (typeof RegionData !== 'undefined') {
  RegionData.enrichPlaces(places);
}

if (typeof PlaceInfo !== 'undefined') {
  PlaceInfo.enrichPlaces(places);
}

if (typeof PlaceScores !== 'undefined') {
  PlaceScores.enrichPlaces(places);
}

function getSatelliteImageUrl(lat, lng) {
  var d = 0.006;
  var bbox = (lng - d) + "," + (lat - d) + "," + (lng + d) + "," + (lat + d);
  return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox="
    + bbox + "&bboxSR=4326&imageSR=4326&size=960,540&format=jpg&f=image";
}

function getStreetMapImageUrl(lat, lng) {
  var zoom = 16;
  var x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  var y = Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI)
    / 2 * Math.pow(2, zoom)
  );
  return "https://tiles.osm.kr/hot/" + zoom + "/" + x + "/" + y + ".png";
}

function openPlacePage(id) {
  if (typeof RegionData !== "undefined") {
    var place = places[id];
    RegionData.openPlacePage(id, place ? { region: place.region, city: place.city } : null);
    return;
  }
  location.href = "index.html#/place/" + id;
}
