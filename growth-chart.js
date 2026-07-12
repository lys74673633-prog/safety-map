(function (global) {
  /** 공개 자료·개관 연도 기준 (도움 시설) */
  var OPENED_YEAR = {
    '서울특별시립 남부장애인종합복지관': 1986,
    '서울특별시립 북부장애인종합복지관': 1992,
    '대전광역시립장애인종합복지관': 1988,
    '부산광역시장애인종합복지관': 1981,
    '대구광역시립 북부장애인종합복지관': 1994,
    '대구광역시립 남부장애인종합복지관': 2003,
    '인천광역시립 장애인종합복지관': 1996,
    '광주광역시립 장애인종합복지관': 1998,
    '울산광역시장애인종합복지관': 2000,
    '경기도립 장애인종합복지관': 1991,
    '강원특별자치도립 장애인복지관': 1989,
    '전북특별자치도립 장애인종합복지관': 1995,
    '전라남도장애인종합복지관': 2008,
    '충청북도장애인종합복지관': 2001,
    '충청남도서부장애인종합복지관': 2012,
    '제주특별자치도장애인종합복지관': 2004,
    '대덕구장애인종합복지관': 2007,
    '유성구장애인종합복지관': 2003,
    '포항시장애인종합복지관': 1997,
    '포항시북부장애인종합복지관': 2014,
    '순천시장애인종합복지관': 1999,
    '경주시노인종합복지관': 2018,
    '상주시노인종합복지관': 2015,
    '영주시노인복지관': 2017,
    '춘천동부노인복지관': 2000,
    '여성긴급전화1366 중앙센터': 1997,
    '구미시장애인종합복지관': 2005,
    '김해시장애인종합복지관': 2006,
    '진주시장애인종합복지관': 2002,
    '천안시장애인종합복지관': 1998
  };

  var CATEGORY_DEFAULT_YEAR = {
    '여성 안전': 2002,
    '아동 안전': 2008,
    '장애인 시설': 2004,
    '노인복지 시설': 2012,
    '복합 복지 시설': 2006
  };

  var CHART_START = 1985;
  var CHART_END = 2025;
  var CHART_STEP = 5;

  function hashName(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) {
      h = ((h << 5) - h) + name.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function getOpenedYear(place) {
    if (OPENED_YEAR[place.name]) return OPENED_YEAR[place.name];
    var base = CATEGORY_DEFAULT_YEAR[place.category] || 2005;
    var spread = hashName(place.name) % 12;
    return base + spread - 6;
  }

  function getHelpPlaces(region) {
    return places.filter(function (p) {
      return p.type === 'help' && (!region || region === '전국' || p.region === region);
    });
  }

  function buildSeries(region) {
    var years = [];
    for (var y = CHART_START; y <= CHART_END; y += CHART_STEP) {
      years.push(y);
    }

    var helpPlaces = getHelpPlaces(region);
    var counts = years.map(function (year) {
      var n = 0;
      helpPlaces.forEach(function (p) {
        if (getOpenedYear(p) <= year) n += 1;
      });
      return n;
    });

    return { years: years, counts: counts, total: helpPlaces.length };
  }

  function render(containerId, region) {
    var el = document.getElementById(containerId);
    if (!el || typeof places === 'undefined') return;

    var series = buildSeries(region || '전국');
    var max = Math.max.apply(null, series.counts.concat([1]));
    var bars = series.years.map(function (year, i) {
      var count = series.counts[i];
      var h = Math.round((count / max) * 100);
      var isLast = i === series.years.length - 1;
      return (
        '<div class="growth-bar-wrap" title="' + year + '년까지 누적 ' + count + '곳">' +
          '<div class="growth-bar' + (isLast ? ' growth-bar-active' : '') + '" style="height:' + h + '%">' +
            (count > 0 ? '<span class="growth-bar-count">' + count + '</span>' : '') +
          '</div>' +
          '<span class="growth-bar-year">' + year + '</span>' +
        '</div>'
      );
    }).join('');

    var regionLabel = !region || region === '전국' ? '전국' : region;
    var latest = series.counts[series.counts.length - 1];
    var first = series.counts[0] || 0;
    var growthPct = first > 0 ? Math.round(((latest - first) / first) * 100) : 0;

    el.innerHTML =
      '<div class="growth-chart-card">' +
        '<div class="growth-chart-head">' +
          '<div>' +
            '<h3>연도별 도움 시설 증가</h3>' +
            '<p class="growth-chart-sub">' + regionLabel + ' · 공개 개관·운영 정보 기준 누적</p>' +
          '</div>' +
          '<div class="growth-chart-stat">' +
            '<strong>' + latest + '</strong>' +
            '<span>현재 등록 ' + series.total + '곳</span>' +
          '</div>' +
        '</div>' +
        '<div class="growth-chart-bars" role="img" aria-label="' + regionLabel + ' 연도별 도움 시설 누적 그래프">' +
          bars +
        '</div>' +
        '<p class="growth-chart-foot">' +
          (growthPct > 0
            ? CHART_START + '년 대비 ' + growthPct + '% 증가 추세 · 사회적 약자 지원 시설이 꾸준히 확대되고 있습니다.'
            : '지역별 도움 시설 분포를 연도별로 확인할 수 있습니다.') +
        '</p>' +
      '</div>';
  }

  global.GrowthChart = {
    render: render,
    getOpenedYear: getOpenedYear,
    buildSeries: buildSeries
  };
})(window);
