var PlaceArticles = (function () {
  var CATEGORY_LINKS = {
    '여성 안전': [
      {
        title: '여성긴급전화 1366 공식 홈페이지',
        source: '여성가족부',
        url: 'https://www.m1366.or.kr/',
        summary: '24시간 가정·성폭력·스토킹 상담·보호 안내와 관련 보도자료를 확인할 수 있습니다.'
      },
      {
        title: '성폭력피해자 지원 제도 안내',
        source: '여성가족부',
        url: 'https://www.mogef.go.kr/korea/view/policyGuide/policyGuide04.do',
        summary: '해바라기센터·1366 등 국가 지원 체계를 설명합니다.'
      }
    ],
    '아동 안전': [
      {
        title: '아동학대 신고·상담 안내 (아동권리보장원)',
        source: '아동권리보장원',
        url: 'https://www.ncrc.or.kr/',
        summary: '아동보호전문기관·학대 신고 112·전국 아동학대 신고 1577-1391 안내.'
      }
    ],
    '장애인 시설': [
      {
        title: '공공복지시설 정보 (복지로)',
        source: '보건복지부',
        url: 'https://www.bokjiro.go.kr/ssis-tbu/ssis-tbu/twataa/wlfareInfo/moveTWAT520010M.do',
        summary: '전국 장애인복지관·재활시설의 공식 등록 정보를 검색할 수 있습니다.'
      },
      {
        title: '장애인 등록·복지 서비스 안내',
        source: '복지로',
        url: 'https://www.bokjiro.go.kr/',
        summary: '장애인 활동지원·직업재활 등 이용 방법을 확인할 수 있습니다.'
      }
    ],
    '노인복지 시설': [
      {
        title: '노인복지시설 정보 (복지로)',
        source: '보건복지부',
        url: 'https://www.bokjiro.go.kr/',
        summary: '노인복지관·주야간보호 등 공공시설 정보를 검색할 수 있습니다.'
      }
    ],
    '복합 복지 시설': [
      {
        title: '지역 사회복지관 안내 (사회복지협의회)',
        source: '사회복지협의회',
        url: 'https://www.welfare.net/',
        summary: '종합사회복지관 프로그램·이용 안내를 확인할 수 있습니다.'
      }
    ],
    '보행자 안전': [
      {
        title: '교통사고분석시스템(TAAS)',
        source: '한국도로교통공단',
        url: 'https://taas.koroad.or.kr/',
        summary: '무단횡단·보행자 사고 다발지역 공식 통계·지도를 제공합니다.'
      },
      {
        title: '보행자 교통안전 캠페인 (도로교통공단)',
        source: '한국도로교통공단',
        url: 'https://www.koroad.or.kr/',
        summary: '횡단보도·어린이·노인 보행 안전 관련 안내 자료를 볼 수 있습니다.'
      }
    ],
    '노인 안전': [
      {
        title: '교통사고분석시스템(TAAS) — 보행노인 사고',
        source: '한국도로교통공단',
        url: 'https://taas.koroad.or.kr/',
        summary: '노인 보행자 교통사고 다발지역 정보를 확인할 수 있습니다.'
      }
    ],
    '관광객 안전': [
      {
        title: '여행안전정보 (외교부)',
        source: '외교부',
        url: 'https://www.0404.go.kr/',
        summary: '국내·해외 여행 시 안전 유의사항을 확인할 수 있습니다.'
      }
    ],
    '교통 안전': [
      {
        title: '교통사고분석시스템(TAAS)',
        source: '한국도로교통공단',
        url: 'https://taas.koroad.or.kr/',
        summary: '교통사고 다발지·통계 정보를 제공합니다.'
      }
    ]
  };

  var CURATED_BY_NAME = {
    '여성긴급전화1366': {
      title: '1366 이용 안내 및 관련 소식',
      source: '여성긴급전화1366',
      url: 'https://www.m1366.or.kr/',
      summary: '전국 1366 센터 운영 안내·공지·관련 콘텐츠를 확인할 수 있습니다.'
    },
    '해바라기': {
      title: '전국 해바라기센터 안내',
      source: '여성가족부',
      url: 'https://sexual-violence-therapy-mhrnd.re.kr/home/information/info07001.do',
      summary: '성폭력피해자 통합지원센터(해바라기) 전국 목록·연락처입니다.'
    },
    '성산일출봉': {
      title: '성산일출봉 UNESCO·관광 안전 안내',
      source: '제주관광공사',
      url: 'https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_00000000000000152',
      summary: '입장·운영·안전 수칙 등 공식 관광 정보를 확인할 수 있습니다.'
    },
    '한라산': {
      title: '한라산국립공원 공식 안내',
      source: '국립공원공단',
      url: 'https://www.nps.go.kr/kns/index.do',
      summary: '등산로·기상·안전 유의사항 등 공식 정보를 제공합니다.'
    },
    '설악산': {
      title: '설악산국립공원 공식 안내',
      source: '국립공원공단',
      url: 'https://www.nps.go.kr/snp/index.do',
      summary: '등산 코스·기상·안전 안내를 확인할 수 있습니다.'
    }
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function uniqueByUrl(list) {
    var seen = {};
    return list.filter(function (item) {
      if (seen[item.url]) return false;
      seen[item.url] = true;
      return true;
    });
  }

  function getCuratedForName(name) {
    var found = [];
    Object.keys(CURATED_BY_NAME).forEach(function (key) {
      if (name.indexOf(key) !== -1) found.push(CURATED_BY_NAME[key]);
    });
    return found;
  }

  function getNewsSearchLinks(place) {
    var q = encodeURIComponent(place.name);
    var addrQ = encodeURIComponent(place.name + ' ' + (place.address || '').split(' ').slice(0, 2).join(' '));
    return [
      {
        title: '「' + place.name + '」 네이버 뉴스 검색',
        source: '네이버 뉴스',
        url: 'https://search.naver.com/search.naver?where=news&sm=tab_jum&query=' + q,
        summary: '해당 시설·장소 이름으로 최신 뉴스·보도를 검색합니다.',
        isSearch: true
      },
      {
        title: '「' + place.name + '」 Google 뉴스 검색',
        source: 'Google 뉴스',
        url: 'https://news.google.com/search?q=' + q + '&hl=ko&gl=KR&ceid=KR:ko',
        summary: '관련 기사를 Google 뉴스에서 모아 볼 수 있습니다.',
        isSearch: true
      },
      {
        title: '「' + place.name + '」 네이버 통합 검색',
        source: '네이버',
        url: 'https://search.naver.com/search.naver?query=' + addrQ,
        summary: '뉴스·블로그·카페 등 웹상 관련 글을 함께 검색합니다.',
        isSearch: true
      }
    ];
  }

  function getArticles(place) {
    var items = [];

    items = items.concat(getCuratedForName(place.name));

    var categoryLinks = CATEGORY_LINKS[place.category] || [];
    if (place.type === 'danger' && place.description && place.description.indexOf('TAAS') !== -1) {
      categoryLinks = (CATEGORY_LINKS['보행자 안전'] || []).concat(categoryLinks);
    }

    items = items.concat(categoryLinks);
    items = items.concat(getNewsSearchLinks(place));

    return uniqueByUrl(items);
  }

  function renderArticleItem(article) {
    return (
      '<li class="article-item' + (article.isSearch ? ' article-item-search' : '') + '">' +
        '<a class="article-link" href="' + escapeHtml(article.url) + '" target="_blank" rel="noopener noreferrer">' +
          '<div class="article-link-head">' +
            '<span class="article-source">' + escapeHtml(article.source) + '</span>' +
            (article.isSearch ? '<span class="article-badge">검색</span>' : '<span class="article-badge article-badge-link">기사·자료</span>') +
          '</div>' +
          '<h3 class="article-title">' + escapeHtml(article.title) + '</h3>' +
          (article.summary ? '<p class="article-summary">' + escapeHtml(article.summary) + '</p>' : '') +
          '<span class="article-open">새 창에서 열기 →</span>' +
        '</a>' +
      '</li>'
    );
  }

  function renderSection(place) {
    var articles = getArticles(place);
    return (
      '<section class="section place-articles-section" id="place-articles">' +
        '<h2>관련 기사·자료</h2>' +
        '<p class="section-note">시설·장소와 관련된 공식 안내와 뉴스 검색 링크입니다. 링크를 누르면 새 창에서 열립니다.</p>' +
        '<ul class="article-list">' + articles.map(renderArticleItem).join('') + '</ul>' +
      '</section>'
    );
  }

  return {
    getArticles: getArticles,
    renderSection: renderSection
  };
})();
