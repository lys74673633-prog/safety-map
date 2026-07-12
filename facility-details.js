(function (global) {
  /** 공식 홈페이지·전화·운영 정보로 검증된 시설 상세 */
  var FACILITY_DETAILS = {
    '유성구장애인종합복지관': {
      phone: '042-822-3637',
      hours: '월~금 09:00~18:00 (공휴일·주말 휴무)',
      website: 'https://withway.or.kr/xe/',
      operator: '대전광역시 유성구 위탁 · (재)한국지체장애인협회 유성구지회',
      howToUse: [
        '042-822-3637로 전화해 이용 프로그램 상담·예약',
        '방문 시 장애인등록증·복지카드 지참',
        '홈페이지(withway.or.kr)에서 프로그램·복지관 일정 확인'
      ],
      canDo: [
        '현장중심 직업재활·취업성공반·직업훈련 상담',
        '주간보호·장애아동 방과후(초등) 프로그램 이용',
        '장애인활동지원·일상돌봄·가사지원 서비스 신청',
        '감각통합·작업치료 등 재활치료 및 평생교육 참여'
      ],
      whyImportant:
        '유성구 거주 장애인·가족이 직업재활부터 돌봄·교육까지 한곳에서 받을 수 있는 구립 종합복지관입니다. ' +
        '전화 한 통으로 프로그램 안내를 받을 수 있어 처음 이용하는 분도 접근하기 쉽습니다.'
    },
    '대덕구장애인종합복지관': {
      phone: '042-637-8848',
      hours: '월~금 09:00~18:00',
      website: 'https://www.ddwelfare.or.kr/',
      operator: '대전광역시 대덕구 · 사회복지법인 대한가톨릭사회복지회',
      howToUse: [
        '042-637-8848로 직업재활·프로그램 상담',
        '방문 전 홈페이지(ddwelfare.or.kr)에서 사업 안내 확인',
        '중증장애인 직업재활 이용 시 사전 상담·사정 진행'
      ],
      canDo: [
        '중증장애인 현장중심 직업재활·직업훈련',
        '장애인·가족 상담 및 사례관리',
        '지역사회 연계 복지 프로그램 참여'
      ],
      whyImportant:
        '대덕구 및 인근 거주 장애인의 직업재활 거점입니다. 2007년 개관한 공식 구립 복지관으로 취업 연계·재활 서비스를 제공합니다.'
    },
    '대전광역시립장애인종합복지관': {
      phone: '042-540-3500',
      hours: '월~금 09:00~18:00',
      website: 'https://www.djrc.or.kr/',
      operator: '대전광역시 · 사회복지법인 성재원',
      howToUse: [
        '042-540-3500으로 재활·직업재활 상담',
        '홈페이지(djrc.or.kr)에서 프로그램·셔틀버스 안내 확인',
        '유성구 유성대로298번길 175 방문 (셔틀버스·버스 이용 가능)'
      ],
      canDo: [
        '직업재활·직업훈련·보호작업장 연계',
        '물리·작업·언어 등 재활치료 프로그램',
        '이동 지원·돌봄 서비스 상담'
      ],
      whyImportant:
        '대전광역시 대표 시립 장애인종합복지관입니다. 1988년 설립된 공식 시설로 광역 단위 재활·직업 지원을 받을 수 있습니다.'
    },
    '여성긴급전화1366 중앙센터': {
      phone: '1366',
      hours: '24시간 연중무휴',
      website: 'https://www.m1366.or.kr/',
      howToUse: [
        '전화 1366 (무료·비밀보장·24시간)',
        '가정폭력·성폭력·스토킹·디지털성범죄 등 긴급 상담',
        '필요 시 임시 보호·병원·경찰·법률 연계'
      ]
    },
    '성산일출봉': {
      hours: '상시 개방 (일출·관광 성수기 혼잡)',
      howToUse: [
        '입구 안내소·표지판에서 안전 수칙 확인',
        '절벽·난간 밖 출입 금지, 지정 산책로만 이용',
        '어르신·어린이·지체 약자는 보호자 동반·완만한 코스 선택'
      ],
      canDo: [
        '지정 산책로·전망대에서 일출·경관 감상',
        '안내 표지·울타리 구간만 이용해 안전하게 관람',
        '날씨·바람 상태 확인 후 이동'
      ]
    }
  };

  /** 이름 패턴으로 1366 센터 등 공통 정보 적용 */
  var PATTERN_DETAILS = [
    {
      test: function (name) { return name.indexOf('여성긴급전화1366') === 0; },
      data: {
        phone: '1366',
        hours: '24시간 연중무휴',
        website: 'https://www.m1366.or.kr/',
        howToUse: [
          '전화 1366 (무료·비밀·24시간)',
          '가정폭력·성폭력·스토킹 피해 긴급 상담·보호 요청',
          '의료·법률·수사·임시 보호 기관 연계'
        ]
      }
    }
  ];

  function lookup(name) {
    if (FACILITY_DETAILS[name]) {
      return Object.assign({}, FACILITY_DETAILS[name]);
    }
    for (var i = 0; i < PATTERN_DETAILS.length; i++) {
      if (PATTERN_DETAILS[i].test(name)) {
        return Object.assign({}, PATTERN_DETAILS[i].data);
      }
    }
    return null;
  }

  global.FacilityDetails = {
    lookup: lookup,
    all: FACILITY_DETAILS
  };
})(window);
