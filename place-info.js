(function (global) {
  var HELP_TEMPLATES = {
    '장애인 시설': {
      canDo: [
        '재활·물리치료·작업치료 프로그램 상담 및 이용',
        '직업훈련·취업 연계 프로그램 참여',
        '보조기기 대여·수리·맞춤 상담',
        '이동 지원·돌봄·주간 보호 서비스 신청'
      ],
      whyImportant:
        '장애인과 보호자가 일상생활과 사회 참여를 이어가도록 전문 지원을 한곳에서 받을 수 있습니다. ' +
        '응급 상황이 아니어도 상담·프로그램을 통해 자립과 안전을 함께 지킬 수 있습니다.'
    },
    '여성 안전': {
      canDo: [
        '24시간 전화·채팅 상담 (☎ 1366, 무료·비밀보장)',
        '긴급 보호·임시 거처·병원·경찰 연계',
        '법률·의료·수사 절차 안내',
        '피해 회복·심리·자립 지원 프로그램 참여'
      ],
      whyImportant:
        '가정폭력·성폭력·스토킹 등 위기 상황에서 즉시 도움을 받을 수 있는 공식 지원 창구입니다. ' +
        '혼자 참아야 하는 상황을 줄이고, 안전한 공간과 전문 상담으로 피해자·약자를 보호합니다.'
    },
    '아동 안전': {
      canDo: [
        '아동학대 신고·상담·조사 접수',
        '피해 아동 보호·치료·법률 연계',
        '가족·보호자 상담 및 사례관리'
      ],
      whyImportant:
        '아동학대 전문기관으로 학대 의심 시 공식 신고·보호 절차를 받을 수 있습니다. ' +
        '아동의 안전을 위해 24시간 신고·상담 창구로 활용할 수 있습니다.'
    },
    '복합 복지 시설': {
      canDo: [
        '노인·장애인·아동 대상 복지 프로그램 상담',
        '건강·여가·평생교육 프로그램 참여',
        '가족 돌봄·지역사회 연계 서비스 신청',
        '복지 혜택·지원 제도 안내'
      ],
      whyImportant:
        '연령·신체 조건과 관계없이 지역 주민이 필요한 복지 서비스를 가까운 곳에서 받을 수 있습니다. ' +
        '돌봄이 필요한 가족에게 실질적인 도움과 정보를 제공합니다.'
    },
    '노인복지 시설': {
      canDo: [
        '건강검진·운동·여가 프로그램 참여',
        '급식·방문요양·돌봄 서비스 상담',
        '노인 일자리·평생교육 프로그램 이용',
        '치매·낙상 예방 교육 및 상담'
      ],
      whyImportant:
        '고령자가 건강하게 지내고 사회와 연결되도록 돕는 거점입니다. ' +
        '혼자 계신 어르신도 안전·건강·복지 지원을 받으며 외로움과 사고 위험을 줄일 수 있습니다.'
    }
  };

  var DANGER_TEMPLATES = {
    '보행자 안전': {
      canDo: [
        '반드시 횡단보도·육교·지하도 이용',
        '신호등·보행 신호 확인 후 횡단',
        '야간에는 밝고 사람 많은 길로 이동',
        '어린이·휠체어·지팡이 사용자와 함께 천천히 이동'
      ],
      whyImportant:
        '교통안전공단(TAAS) 등에 등록된 보행자 교통사고 다발 구간입니다. ' +
        '반응이 느린 노인, 시야·청각이 약한 분, 어린이에게 무단횡단·급한 횡단은 치명적일 수 있습니다.'
    },
    '노인 안전': {
      canDo: [
        '보호자·가족과 함께 이동하거나 연락 유지',
        '미끄럼·낙상 주의 (완만한 길·횡단보도 이용)',
        '야간 외출 자제, 밝은 구역 이용',
        '응급 연락처·위치 공유 준비'
      ],
      whyImportant:
        '노인 보행자 사고·낙상이 자주 보고되는 구역입니다. ' +
        '고령층은 회복이 더디고 후유증이 크므로 사전에 위험 요인을 알고 대비하는 것이 중요합니다.'
    },
    '관광객 안전': {
      canDo: [
        '날씨·파고·안내 표지 확인 후 이동',
        '절벽·파도·험로 구간은 안전펜스·지정 구역만 이용',
        '야간·혼자 방문 시 특히 주의',
        '구조·응급 연락처(119) 미리 확인'
      ],
      whyImportant:
        '관광객·지역민 모두에게 사고가 발생할 수 있는 자연·해안·험로 지역입니다. ' +
        '낯선 환경, 체력 차이, 조명 부족 등으로 어린이·노인·장애인에게 더 큰 위험이 될 수 있습니다.'
    },
    '교통 안전': {
      canDo: [
        '횡단보도·육교 이용, 신호 준수',
        '차량·보행자 동선 혼잡 시간대 피하기',
        '짐·유모차·휠체어 이동 시 여유 있게 횡단',
        '공항·역 주변 안내 표지 확인'
      ],
      whyImportant:
        '차량·보행자가 많이 교차하는 교통 요충지입니다. ' +
        '유동 인구가 많고 서두르는 보행이 잦아 사고 위험이 높습니다.'
    }
  };

  var NAME_OVERRIDES = {
    '해운대해수욕장': {
      whyImportant:
        '여름철 관광객·가족 단위 방문이 몰리는 해수욕장입니다. ' +
        '파도·조류·익수 사고와 야간 해변 이동 시 조명 부족으로 어린이·노인·장애인에게 특히 위험할 수 있습니다.'
    },
    '성산일출봉': {
      whyImportant:
        '해안 절벽과 가파른 오르막이 있는 UNESCO 세계자연유산입니다. ' +
        '바람·절벽·돌길로 인해 노인·어린이·지체·시각 장애인의 낙상·추락 위험이 큽니다.'
    },
    '한라산 백록담 코스': {
      whyImportant:
        '고지대·험한 등산로로 기온 변화와 체력 소모가 큽니다. ' +
        '고령자·심장·호흡기 질환자·지체 장애인에게 급격한 컨디션 악화·고립 위험이 있습니다.'
    },
    '경주 불국사 황토현길': {
      whyImportant:
        '돌길·언덕·계단이 많은 관광 구간입니다. ' +
        '노인·휠체어·보행 보조기 사용자에게 미끄럼·낙상·이동 피로 위험이 큽니다.'
    },
    '여수 오동도': {
      whyImportant:
        '해상 연육교와 관광지 특성상 야간·혼잡 시간대 안전에 취약합니다. ' +
        '어린이·노인·시각·청각 약자는 바다·난간·조명 부족 구간에서 사고 위험이 높습니다.'
    },
    '강릉 안목해변': {
      whyImportant:
        '커피거리·해변이 연결된 관광지로 성수기 유동 인구가 많습니다. ' +
        '파도·야간 해변·차량 혼잡으로 보호자 없는 아동·노인에게 위험할 수 있습니다.'
    },
    '김해국제공항 인근': {
      whyImportant:
        '공항·도로·횡단보도가 밀집한 교통 혼잡 지역입니다. ' +
        '짐을 든 보행자·노인·장애인이 서두를 때 횡단 사고 위험이 높아집니다.'
    },
    '부산 교대역 앞 횡단보도': {
      whyImportant:
        '부산자치경찰단이 무단횡단 개선 대상으로 지정한 구간입니다. ' +
        '역 주변 유동 인구·차량 속도로 보행 약자의 교통사고 위험이 큽니다.'
    }
  };

  function parsePhone(text) {
    if (!text) return '';
    var m = text.match(/(?:☎|☏)\s*([\d-]+)/);
    return m ? m[1] : '';
  }

  function stripPhoneFromDescription(text) {
    if (!text) return '';
    return text.replace(/\s*\(?(?:☎|☏)\s*[\d-]+\)?\s*$/, '').trim();
  }

  function getTemplate(place) {
    var map = place.type === 'help' ? HELP_TEMPLATES : DANGER_TEMPLATES;
    return map[place.category] || (place.type === 'help'
      ? HELP_TEMPLATES['복합 복지 시설']
      : DANGER_TEMPLATES['보행자 안전']);
  }

  function getVerifiedDetail(place) {
    if (typeof FacilityDetails === 'undefined') return null;
    return FacilityDetails.lookup(place.name);
  }

  function buildDefaultHowToUse(place) {
    var steps = [];
    if (place.phone) {
      steps.push('☎ ' + place.phone + '로 전화해 이용·프로그램 안내 받기');
    }
    if (place.type === 'help') {
      steps.push('방문 주소: ' + place.address);
      if (place.website) {
        steps.push('홈페이지에서 프로그램·운영 시간 확인');
      }
    }
    if (place.type === 'danger') {
      steps.push('Google·네이버 지도로 정확한 위치 확인 후 이동');
      steps.push('보호자·동행과 함께 이동하고 안전 수칙 준수');
    }
    return steps;
  }

  function getPlaceInfo(place, verified) {
    var template = getTemplate(place);
    var nameOverride = NAME_OVERRIDES[place.name] || {};
    var canDo = (verified && verified.canDo) ||
      nameOverride.canDo ||
      template.canDo;
    var whyImportant = (verified && verified.whyImportant) ||
      nameOverride.whyImportant ||
      template.whyImportant;

    if (place.type === 'help' && place.phone && !verified) {
      var summary = stripPhoneFromDescription(place.description);
      if (summary) {
        canDo = [summary + ' (☎ ' + place.phone + ')'].concat(canDo.slice(0, 3));
      }
    }

    return { canDo: canDo, whyImportant: whyImportant };
  }

  function enrichPlaces(list) {
    list.forEach(function (place) {
      var verified = getVerifiedDetail(place);
      place.phone = (verified && verified.phone) || parsePhone(place.description || '');
      place.hours = (verified && verified.hours) || '';
      place.website = (verified && verified.website) || '';
      place.operator = (verified && verified.operator) || '';
      place.howToUse = (verified && verified.howToUse && verified.howToUse.length)
        ? verified.howToUse.slice()
        : buildDefaultHowToUse(place);

      var info = getPlaceInfo(place, verified);
      place.canDo = info.canDo;
      place.whyImportant = info.whyImportant;
      place.summary = stripPhoneFromDescription(place.description) || place.description;
    });
  }

  function renderCanDoList(items) {
    return items.map(function (item) {
      return '<li>' + item + '</li>';
    }).join('');
  }

  function renderPracticalInfo(place) {
    var rows = [];

    if (place.phone) {
      var tel = place.phone.replace(/[^\d]/g, '');
      rows.push(
        '<div class="practical-row">' +
          '<span class="practical-label">전화</span>' +
          '<a class="practical-value practical-phone" href="tel:' + tel + '">' + place.phone + '</a>' +
        '</div>'
      );
    }
    if (place.hours) {
      rows.push(
        '<div class="practical-row">' +
          '<span class="practical-label">이용시간</span>' +
          '<span class="practical-value">' + place.hours + '</span>' +
        '</div>'
      );
    }
    if (place.operator) {
      rows.push(
        '<div class="practical-row">' +
          '<span class="practical-label">운영</span>' +
          '<span class="practical-value">' + place.operator + '</span>' +
        '</div>'
      );
    }
    if (place.website) {
      rows.push(
        '<div class="practical-row">' +
          '<span class="practical-label">홈페이지</span>' +
          '<a class="practical-value" href="' + place.website + '" target="_blank" rel="noopener">' +
            place.website.replace(/^https?:\/\//, '') +
          '</a>' +
        '</div>'
      );
    }

    if (!rows.length && !place.howToUse.length) return '';

    var howBlock = place.howToUse.length
      ? '<ol class="howto-list">' + place.howToUse.map(function (s) {
          return '<li>' + s + '</li>';
        }).join('') + '</ol>'
      : '';

    return (
      '<section class="practical-info ' + (place.type === 'help' ? 'help-type' : 'danger-type') + '">' +
        '<h2>이용 정보</h2>' +
        (rows.length ? '<div class="practical-grid">' + rows.join('') + '</div>' : '') +
        (howBlock ? '<h3 class="practical-subhead">이용 방법</h3>' + howBlock : '') +
      '</section>'
    );
  }

  function renderMetaChips(place) {
    var chips = ['<span class="meta-chip">지역 ' + place.region + '</span>'];
    if (place.city) chips.push('<span class="meta-chip">' + place.city + '</span>');
    if (place.phone) chips.push('<span class="meta-chip meta-phone">☎ ' + place.phone + '</span>');
    if (place.hours) chips.push('<span class="meta-chip">' + place.hours + '</span>');
    return chips.join('');
  }

  function renderInfoSections(place) {
    var whyTitle = place.type === 'help' ? '왜 도움이 되나요?' : '왜 주의가 필요한가요?';
    var whyClass = place.type === 'help' ? 'info-box help-box' : 'info-box danger-box';

    return (
      renderPracticalInfo(place) +
      '<div class="info-sections">' +
        '<section class="info-box">' +
          '<h2>이곳에서 할 수 있는 것</h2>' +
          '<ul class="info-list">' + renderCanDoList(place.canDo) + '</ul>' +
        '</section>' +
        '<section class="' + whyClass + '">' +
          '<h2>' + whyTitle + '</h2>' +
          '<p>' + place.whyImportant + '</p>' +
        '</section>' +
      '</div>'
    );
  }

  function renderInfoSectionsCompact(place) {
    var whyTitle = place.type === 'help' ? '왜 도움이 되나요?' : '왜 주의가 필요한가요?';
    var phoneLine = place.phone
      ? '<p class="detail-phone"><a href="tel:' + place.phone.replace(/[^\d]/g, '') + '">☎ ' + place.phone + '</a></p>'
      : '';
    return (
      (typeof PlaceScores !== 'undefined' ? PlaceScores.renderBadge(place) : '') +
      phoneLine +
      '<div class="detail-info-compact">' +
        '<p class="detail-subhead">할 수 있는 것</p>' +
        '<ul class="info-list compact">' + renderCanDoList(place.canDo.slice(0, 3)) + '</ul>' +
        '<p class="detail-subhead">' + whyTitle + '</p>' +
        '<p class="detail-why">' + place.whyImportant + '</p>' +
      '</div>'
    );
  }

  global.PlaceInfo = {
    enrichPlaces: enrichPlaces,
    getPlaceInfo: getPlaceInfo,
    renderPracticalInfo: renderPracticalInfo,
    renderMetaChips: renderMetaChips,
    renderInfoSections: renderInfoSections,
    renderInfoSectionsCompact: renderInfoSectionsCompact
  };
})(window);
