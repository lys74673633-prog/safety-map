(function (global) {
  var HELP_CATEGORY_BASE = {
    '여성 안전': 92,
    '아동 안전': 90,
    '장애인 시설': 84,
    '노인복지 시설': 78,
    '복합 복지 시설': 80
  };

  var DANGER_CATEGORY_BASE = {
    '보행자 안전': 78,
    '노인 안전': 74,
    '관광객 안전': 82,
    '교통 안전': 76
  };

  var HELP_NAME_BOOST = {
    '여성긴급전화1366 중앙센터': 8,
    '유성구장애인종합복지관': 6,
    '대전광역시립장애인종합복지관': 6,
    '대덕구장애인종합복지관': 5,
    '동작구 아동보호전문기관': 7
  };

  var DANGER_NAME_BOOST = {
    '성산일출봉': 10,
    '한라산 백록담 코스': 9,
    '해운대해수욕장': 7,
    '경주 불국사 황토현길': 6,
    '전주 한옥마을': 5
  };

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function scoreHelp(place) {
    var score = HELP_CATEGORY_BASE[place.category] || 75;
    score += HELP_NAME_BOOST[place.name] || 0;
    if (place.phone) score += 4;
    if (place.hours) score += 2;
    if (place.website) score += 3;
    if (place.operator) score += 2;
    if (place.howToUse && place.howToUse.length >= 3) score += 2;
    if (typeof FacilityDetails !== 'undefined' && FacilityDetails.lookup(place.name)) score += 5;
    if ((place.description || '').indexOf('1366') !== -1) score += 3;
    return clamp(Math.round(score), 55, 99);
  }

  function scoreDanger(place) {
    var score = DANGER_CATEGORY_BASE[place.category] || 70;
    score += DANGER_NAME_BOOST[place.name] || 0;
    if ((place.description || '').indexOf('TAAS') !== -1) score += 6;
    if ((place.description || '').indexOf('다발') !== -1) score += 4;
    if ((place.description || '').indexOf('절벽') !== -1 ||
        (place.description || '').indexOf('추락') !== -1) score += 5;
    if ((place.description || '').indexOf('해안') !== -1 ||
        (place.description || '').indexOf('파도') !== -1) score += 3;
    if ((place.description || '').indexOf('노인') !== -1) score += 2;
    return clamp(Math.round(score), 58, 97);
  }

  function enrichPlaces(list) {
    list.forEach(function (place) {
      if (place.type === 'help') {
        place.helpScore = scoreHelp(place);
        place.dangerScore = null;
      } else {
        place.dangerScore = scoreDanger(place);
        place.helpScore = null;
      }
    });
  }

  function renderBadge(place, compact) {
    var cls = 'score-badge ' + (place.type === 'help' ? 'help-score' : 'danger-score');
    if (compact) cls += ' compact';
    if (place.type === 'help') {
      return (
        '<span class="' + cls + '" title="도움 정도: 서비스 접근성·지원 범위 기준">' +
          '도움 ' + place.helpScore + '%' +
        '</span>'
      );
    }
    return (
      '<span class="' + cls + '" title="위험도: 사고·피해 가능성 기준">' +
        '위험 ' + place.dangerScore + '%' +
      '</span>'
    );
  }

  function renderMeter(place) {
    var isHelp = place.type === 'help';
    var value = isHelp ? place.helpScore : place.dangerScore;
    var label = isHelp ? '도움 정도' : '위험도';
    var cls = isHelp ? 'help-score' : 'danger-score';
    return (
      '<div class="score-meter ' + cls + '">' +
        '<div class="score-meter-head">' +
          '<span class="score-meter-label">' + label + '</span>' +
          '<strong class="score-meter-value">' + value + '%</strong>' +
        '</div>' +
        '<div class="score-meter-track">' +
          '<div class="score-meter-fill" style="width:' + value + '%"></div>' +
        '</div>' +
        '<p class="score-meter-note">' +
          (isHelp
            ? '전화·홈페이지·프로그램·공식 시설 정보 등을 반영한 도움 지수입니다.'
            : 'TAAS·지형·관광·교통 특성 등을 반영한 위험 지수입니다.') +
        '</p>' +
      '</div>'
    );
  }

  global.PlaceScores = {
    enrichPlaces: enrichPlaces,
    renderBadge: renderBadge,
    renderMeter: renderMeter,
    scoreHelp: scoreHelp,
    scoreDanger: scoreDanger
  };
})(window);
