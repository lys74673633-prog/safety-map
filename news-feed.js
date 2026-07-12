var NewsFeed = (function () {
  var CACHE_KEY = 'oasi5-articles-cache-v3';
  var CACHE_TTL_MS = 3 * 60 * 60 * 1000;
  var FETCH_TIMEOUT_MS = 8000;
  var RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

  var FEEDS = [
    {
      source: 'Google 뉴스',
      sourceType: 'google',
      lang: 'ko',
      translate: false,
      defaultTags: ['장애인'],
      tagClass: 'hub-tag-disability',
      rss: 'https://news.google.com/rss/search?q=%EC%9E%A5%EC%95%A0%EC%9D%B8+OR+%EC%95%88%EB%82%B4%EA%B2%AC+OR+%ED%9C%A0%EC%9B%94%EC%9D%98%EC%96%B4&hl=ko&gl=KR&ceid=KR:ko'
    },
    {
      source: 'Google 뉴스',
      sourceType: 'google',
      lang: 'ko',
      translate: false,
      defaultTags: ['여성·아동'],
      tagClass: 'hub-tag-women',
      rss: 'https://news.google.com/rss/search?q=%EC%97%AC%EC%84%B1%ED%8F%AD%EB%A0%A5+OR+1366+OR+%EC%95%84%EB%8F%99%ED%95%99%EB%8C%80&hl=ko&gl=KR&ceid=KR:ko'
    },
    {
      source: 'Google 뉴스',
      sourceType: 'google',
      lang: 'ko',
      translate: false,
      defaultTags: ['노인', '교통·보행'],
      tagClass: 'hub-tag-elder',
      rss: 'https://news.google.com/rss/search?q=%EB%85%B8%EC%9D%B8+OR+%EB%B3%B4%ED%96%89%EC%9E%90+OR+%ED%9A%A1%EB%8B%A8%EB%B3%B4%EB%8F%84&hl=ko&gl=KR&ceid=KR:ko'
    },
    {
      source: 'CNN',
      sourceType: 'cnn',
      lang: 'en',
      translate: true,
      defaultTags: ['CNN'],
      tagClass: 'hub-tag-traffic',
      rss: 'http://rss.cnn.com/rss/cnn_health.rss',
      filterKeywords: true
    }
  ];

  var TAG_IMAGES = {
    'hub-tag-disability': 'https://imgnews.pstatic.net/image/448/2026/04/29/2026042990308_thumb_093936_20260429214111731.jpg?type=w800',
    'hub-tag-women': 'https://imgnews.pstatic.net/image/025/2022/04/26/0003190458_001_20220426171902698.jpg?type=w800',
    'hub-tag-child': 'https://imgnews.pstatic.net/image/028/2026/04/22/0002801950_001_20260423065611107.jpg?type=w800',
    'hub-tag-elder': 'https://imgnews.pstatic.net/image/032/2026/04/15/0003439997_001_20260415120012993.png?type=w800',
    'hub-tag-traffic': 'https://imgnews.pstatic.net/image/018/2026/04/20/0006261654_001_20260420095424888.jpg?type=w800'
  };

  var CURATED = [
    {
      tags: ['장애인', '안내견'],
      tagClass: 'hub-tag-disability',
      title: '"짐승인데"…\'조이법\' 1년 됐지만 안내견 출입 거부 여전',
      source: '네이버 · TV조선',
      sourceType: 'naver',
      translated: false,
      date: '2026.04.29',
      pubTime: 0,
      url: 'https://n.news.naver.com/article/448/0000607831',
      image: 'https://imgnews.pstatic.net/image/448/2026/04/29/2026042990308_thumb_093936_20260429214111731.jpg?type=w800',
      summary: '시각장애인이 안내견과 함께 식당에 들어섰다가 직원의 거부로 발길을 돌리는 장면이 포착됐습니다. 정당한 사유 없이 안내견 출입을 막으면 최대 300만 원 과태료가 부과됩니다.',
      related: '시각장애 · 안내견 동반 · Oasi5 시설 추천'
    },
    {
      tags: ['장애인', '안내견'],
      tagClass: 'hub-tag-disability',
      title: '"우리 캠핑장은 사유지라"…KBS 앵커 출신 유튜버, 안내견 거부당했다',
      source: '네이버 · KBS',
      sourceType: 'naver',
      translated: false,
      date: '2026.05.13',
      pubTime: 0,
      url: 'https://n.news.naver.com/article/056/0012180051',
      image: 'https://imgnews.pstatic.net/image/056/2026/05/13/0012180051_001_20260513111714022.png?type=w800',
      summary: '시각장애 유튜버가 안내견과 캠핑장 예약을 시도했으나 거절당했습니다. 장애인 보조견은 정당한 사유 없이 거부할 수 없습니다.',
      related: '안내견 출입권 · 사회적 약자 이동권'
    },
    {
      tags: ['여성·아동', '스토킹'],
      tagClass: 'hub-tag-women',
      title: '"직접 피해 없어도 피해자"…스토킹피해자보호법, 보호 대상 확대될까',
      source: '네이버 · 중앙일보',
      sourceType: 'naver',
      translated: false,
      date: '2022.04.26',
      pubTime: 0,
      url: 'https://n.news.naver.com/article/025/0003190458',
      image: 'https://imgnews.pstatic.net/image/025/2022/04/26/0003190458_001_20220426171902698.jpg?type=w800',
      summary: '스토킹 피해자 보호법으로 국가의 지원 책무가 분명해졌습니다. 1366 등 긴급 상담과 연계됩니다.',
      related: '여성긴급전화 1366 · 스토킹 · 가정폭력'
    },
    {
      tags: ['여성·아동', '디지털성범죄'],
      tagClass: 'hub-tag-women',
      title: '디지털 성범죄 피해 \'삭제데이터\'로 가해자 형량 높였다',
      source: '네이버 · 세계일보',
      sourceType: 'naver',
      translated: false,
      date: '2026.04.16',
      pubTime: 0,
      url: 'https://n.news.naver.com/article/022/0004121385',
      image: 'https://imgnews.pstatic.net/image/022/2026/04/16/20260416517502_20260416150913468.jpg?type=w800',
      summary: '디지털 성범죄 피해자는 1366으로 즉시 상담할 수 있습니다.',
      related: '1366 · 디지털 성범죄 · 아동·청소년 피해'
    },
    {
      tags: ['여성·아동', '가정폭력'],
      tagClass: 'hub-tag-women',
      title: '분리조치 몇 시간 됐다고…술 취해 아내에게 차 돌진 50대 검거',
      source: '네이버 · 연합뉴스TV',
      sourceType: 'naver',
      translated: false,
      date: '2026.04.16',
      pubTime: 0,
      url: 'https://n.news.naver.com/article/422/0000855762',
      image: 'https://imgnews.pstatic.net/image/422/2026/04/16/AKR2026041615500253r_01_i_20260416155015025.jpg?type=w800',
      summary: '가정폭력 위기 시 ☎ 112, ☎ 1366으로 즉시 도움을 요청할 수 있습니다.',
      related: '가정폭력 · 1366 · 여성 안전'
    },
    {
      tags: ['노인', '교통·보행'],
      tagClass: 'hub-tag-elder',
      title: '경찰, \'우회전 일시정지\' 2개월 집중단속···사망자 56%가 보행자, 절반은 노인',
      source: '네이버 · 경향신문',
      sourceType: 'naver',
      translated: false,
      date: '2026.04.15',
      pubTime: 0,
      url: 'https://n.news.naver.com/article/032/0003439997',
      image: 'https://imgnews.pstatic.net/image/032/2026/04/15/0003439997_001_20260415120012993.png?type=w800',
      summary: '우회전 교통사고 사망자의 56%가 보행자이며, 그중 54.8%가 65세 이상 고령자였습니다.',
      related: '노인 보행 · TAAS · Oasi5 위험 지역'
    },
    {
      tags: ['노인', '교통·보행'],
      tagClass: 'hub-tag-elder',
      title: '"아차!"하면 \'6만원\' 날린다…오늘부터 우회전 집중단속',
      source: '네이버 · 이데일리',
      sourceType: 'naver',
      translated: false,
      date: '2026.04.20',
      pubTime: 0,
      url: 'https://n.news.naver.com/article/018/0006261654',
      image: 'https://imgnews.pstatic.net/image/018/2026/04/20/0006261654_001_20260420095424888.jpg?type=w800',
      summary: '우회전 시 횡단보도 앞 일시정지를 지키지 않으면 범칙금 6만 원·벌점 15점이 부과됩니다.',
      related: '고령 보행자 · 교통약자 · 보행자 안전'
    },
    {
      tags: ['노인', '교통·보행'],
      tagClass: 'hub-tag-traffic',
      title: '안성서 70대 운전자가 80대 보행자 뺑소니',
      source: '네이버 · 뉴시스',
      sourceType: 'naver',
      translated: false,
      date: '2026.05.02',
      pubTime: 0,
      url: 'https://n.news.naver.com/article/003/0013922644',
      image: 'https://imgnews.pstatic.net/image/003/2026/05/02/NISI20250923_0001950761_web_20250923104745_20260502224915326.jpg?type=w800',
      summary: '고령 보행자 사고는 Oasi5 지도에서 지역별 TAAS·노인 위험 구간을 확인하며 예방할 수 있습니다.',
      related: '횡단보도 · 고령 보행 · 교통사고'
    },
    {
      tags: ['장애인', '시설'],
      tagClass: 'hub-tag-disability',
      title: '색동원 사건이 드러낸 민낯…장애인 시설 학대, 왜 반복되나',
      source: '네이버 · 이데일리',
      sourceType: 'naver',
      translated: false,
      date: '2026.03.23',
      pubTime: 0,
      url: 'https://n.news.naver.com/article/018/0006241079',
      image: 'https://imgnews.pstatic.net/image/018/2026/03/23/0006241079_001_20260323153916880.jpg?type=w800',
      summary: '학대 의심 시 ☎ 1644-8295(장애인권익), ☎ 1577-1330으로 신고할 수 있습니다.',
      related: '장애인 시설 · 학대 신고'
    },
    {
      tags: ['아동'],
      tagClass: 'hub-tag-child',
      title: '\'아동학대\' 위기아동 찾는다…병원 안 간 6살 이하 5만8천명 전수조사',
      source: '네이버 · 한겨레',
      sourceType: 'naver',
      translated: false,
      date: '2026.04.22',
      pubTime: 0,
      url: 'https://n.news.naver.com/article/028/0002801950',
      image: 'https://imgnews.pstatic.net/image/028/2026/04/22/0002801950_001_20260423065611107.jpg?type=w800',
      summary: '학대 신고는 ☎ 112, ☎ 1577-1391(전국 아동학대 신고)로 할 수 있습니다.',
      related: '아동학대 · 1577-1391 · 아동보호전문기관'
    },
    {
      tags: ['장애인', '시설'],
      tagClass: 'hub-tag-disability',
      title: '[단독] \'말\' 못하면 학대도 없다?... 정부 합동점검서 중증장애인 제외됐다',
      source: '네이버 · JTBC',
      sourceType: 'naver',
      translated: false,
      date: '2026.03.31',
      pubTime: 0,
      url: 'https://n.news.naver.com/article/310/0000135246',
      image: 'https://imgnews.pstatic.net/image/310/2026/03/31/0000135246_001_20260331095817697.jpg?type=w800',
      summary: '의사소통이 어려운 중증·발달장애인이 점검에서 배제됐다는 지적이 나왔습니다.',
      related: '중증장애 · 발달장애 · 시설 학대 · 인권'
    },
    {
      tags: ['장애인', '여성·아동'],
      tagClass: 'hub-tag-disability',
      title: '장애인 성폭행한 \'장애인 권익옹호기관\' 조사관…항소심도 \'징역 10년\'',
      source: '네이버 · KBS',
      sourceType: 'naver',
      translated: false,
      date: '2026.04.06',
      pubTime: 0,
      url: 'https://n.news.naver.com/article/056/0012156090',
      image: 'https://imgnews.pstatic.net/image/056/2026/04/06/0012156090_001_20260406060110837.png?type=w800',
      summary: '장애 여성·아동 피해 지원은 1366·해바라기센터와 연계됩니다.',
      related: '장애 여성 · 성폭력 · 1366 · 피해자 지원'
    }
  ];

  var KEYWORDS = [
    '장애', '안내견', '휠체어', '복지', '1366', '해바라기', '아동', '노인', '여성', '폭력', '학대',
    'disability', 'disabled', 'wheelchair', 'accessibility', 'accessible', 'elderly', 'senior',
    'child', 'children', 'abuse', 'women', 'violence', 'domestic', 'blind', 'deaf', 'guide dog',
    'caregiver', 'dementia', 'autism', 'health care', 'vulnerable'
  ];

  function stripHtml(html) {
    return String(html || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatDate(raw) {
    if (!raw) return '';
    var d = new Date(raw);
    if (isNaN(d.getTime())) {
      var parts = String(raw).split(/[\sT]/);
      return parts[0] ? parts[0].replace(/-/g, '.') : raw;
    }
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + day;
  }

  function parsePublisher(title) {
    var parts = String(title || '').split(' - ');
    if (parts.length < 2) return { title: title, publisher: '' };
    var publisher = parts.pop().trim();
    return { title: parts.join(' - ').trim(), publisher: publisher };
  }

  function matchesKeywords(text) {
    var lower = String(text || '').toLowerCase();
    for (var i = 0; i < KEYWORDS.length; i++) {
      if (lower.indexOf(KEYWORDS[i].toLowerCase()) >= 0) return true;
    }
    return false;
  }

  function classifyArticle(text, defaults) {
    var lower = String(text || '').toLowerCase();
    var tags = (defaults.tags || []).slice();
    var tagClass = defaults.tagClass || 'hub-tag-traffic';

    if (/장애|disabilit|wheelchair|안내견|guide dog|accessib/i.test(lower)) {
      tags = ['장애인'];
      tagClass = 'hub-tag-disability';
    } else if (/여성|1366|해바라기|성폭|가정폭|women|domestic viol/i.test(lower)) {
      tags = ['여성·아동'];
      tagClass = 'hub-tag-women';
    } else if (/아동|학대|child|abuse/i.test(lower)) {
      tags = ['아동'];
      tagClass = 'hub-tag-child';
    } else if (/노인|고령|보행|elder|senior|pedestrian/i.test(lower)) {
      tags = ['노인', '교통·보행'];
      tagClass = 'hub-tag-elder';
    }

    return { tags: tags, tagClass: tagClass };
  }

  function relatedFromTags(tags) {
    return (tags || []).join(' · ') + ' · Oasi5';
  }

  function openLabel(article) {
    if (article.sourceType === 'naver') return '네이버 뉴스에서 기사 보기 →';
    if (article.sourceType === 'cnn') return 'CNN 원문 기사 보기 →';
    if (article.sourceType === 'google') return 'Google 뉴스에서 기사 보기 →';
    return '원문 기사 보기 →';
  }

  function ensureImage(article) {
    if (!article.image && article.tagClass && TAG_IMAGES[article.tagClass]) {
      article.image = TAG_IMAGES[article.tagClass];
    }
    return article;
  }

  function fetchWithTimeout(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error('timeout'));
      }, timeoutMs || FETCH_TIMEOUT_MS);

      fetch(url)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          clearTimeout(timer);
          resolve(data);
        })
        .catch(function (err) {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  function fetchFeedItems(feed) {
    return fetchWithTimeout(RSS2JSON + encodeURIComponent(feed.rss))
      .then(function (data) {
        if (!data || data.status !== 'ok' || !data.items) return [];
        return data.items.slice(0, 6);
      })
      .catch(function () { return []; });
  }

  function translateBatch(texts) {
    var combined = texts.filter(Boolean).join('\n---\n');
    if (!combined) return Promise.resolve([]);

    var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q='
      + encodeURIComponent(combined.slice(0, 1200));

    return fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data[0]) return texts;
        var translated = data[0].map(function (part) { return part[0]; }).join('').trim();
        return translated.split('\n---\n');
      })
      .catch(function () { return texts; });
  }

  function translateArticlesParallel(articles) {
    var queue = articles.filter(function (a) { return a.needsTranslation; }).slice(0, 5);
    if (!queue.length) return Promise.resolve(articles);

    var promises = queue.map(function (article) {
      return translateBatch([article.titleOriginal, article.summaryOriginal]).then(function (parts) {
        if (parts[0]) article.title = parts[0].trim() || article.title;
        if (parts[1]) article.summary = parts[1].trim() || article.summary;
        article.translated = true;
        delete article.needsTranslation;
        ensureImage(article);
        return article;
      });
    });

    return Promise.all(promises).then(function () { return articles; });
  }

  function mapFeedItem(item, feed) {
    var parsed = parsePublisher(item.title || '');
    var body = stripHtml(item.description || item.content || '');
    var textBlob = (parsed.title + ' ' + body).trim();

    if (feed.filterKeywords && !matchesKeywords(textBlob)) return null;

    var classified = classifyArticle(textBlob, {
      tags: feed.defaultTags,
      tagClass: feed.tagClass
    });

    var publisher = parsed.publisher || feed.source;
    var sourceLabel = feed.sourceType === 'cnn'
      ? 'CNN · 번역'
      : feed.source + (publisher && feed.sourceType === 'google' ? ' · ' + publisher : '');

    var article = {
      tags: classified.tags,
      tagClass: classified.tagClass,
      title: parsed.title,
      titleOriginal: parsed.title,
      source: sourceLabel,
      sourceType: feed.sourceType,
      translated: !!feed.translate,
      needsTranslation: !!feed.translate,
      date: formatDate(item.pubDate),
      pubTime: new Date(item.pubDate || 0).getTime() || 0,
      url: item.link || item.guid || '',
      image: item.thumbnail || (item.enclosure && item.enclosure.link) || '',
      summary: body || parsed.title,
      summaryOriginal: body || parsed.title,
      related: relatedFromTags(classified.tags)
    };

    return ensureImage(article);
  }

  function normalizeTitleKey(title) {
    var t = String(title || '')
      .replace(/^[\s\[(\『「"']+(단독|속보|기획|영상|사설)?[\]\)」"']*\s*/gi, '')
      .replace(/["'""''…]/g, '')
      .replace(/\.{2,}/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    var dash = t.indexOf(' - ');
    if (dash > 10) t = t.slice(0, dash);

    return t.replace(/[^\uac00-\ud7a3a-z0-9]/gi, '');
  }

  function canonicalUrl(url) {
    if (!url) return '';
    try {
      var u = new URL(url);
      if (u.hostname.indexOf('naver.com') >= 0) {
        var naverMatch = u.pathname.match(/\/article\/(\d+\/\d+)/);
        if (naverMatch) return 'naver:' + naverMatch[1];
      }
      return u.origin + u.pathname;
    } catch (e) {
      return String(url).split('?')[0];
    }
  }

  function isSimilarTitle(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.length < 14 || b.length < 14) return false;

    var short = a.length < b.length ? a : b;
    var long = a.length < b.length ? b : a;
    if (long.indexOf(short) >= 0 && short.length >= 16) return true;

    var prefixLen = Math.min(22, a.length, b.length);
    return a.slice(0, prefixLen) === b.slice(0, prefixLen);
  }

  function dedupeArticles(list) {
    var seenUrl = {};
    var titleKeys = [];
    var out = [];

    list.forEach(function (article) {
      var urlKey = canonicalUrl(article.url);
      var titleKey = normalizeTitleKey(article.titleOriginal || article.title);

      if (urlKey && seenUrl[urlKey]) return;

      if (titleKey && titleKey.length >= 10) {
        for (var i = 0; i < titleKeys.length; i++) {
          if (isSimilarTitle(titleKey, titleKeys[i])) return;
        }
      }

      if (urlKey) seenUrl[urlKey] = true;
      if (titleKey && titleKey.length >= 10) titleKeys.push(titleKey);
      out.push(ensureImage(article));
    });

    return out;
  }

  function readCache(allowStale) {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.updatedAt || !data.articles) return null;
      if (!allowStale && Date.now() - data.updatedAt > CACHE_TTL_MS) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function writeCache(articles) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        updatedAt: Date.now(),
        articles: articles.map(function (a) { return ensureImage(a); })
      }));
    } catch (e) {}
  }

  function mergeArticles(live) {
    live.sort(function (a, b) { return (b.pubTime || 0) - (a.pubTime || 0); });
    var merged = dedupeArticles(live.concat(CURATED));
    merged.sort(function (a, b) {
      if ((b.pubTime || 0) !== (a.pubTime || 0)) return (b.pubTime || 0) - (a.pubTime || 0);
      return 0;
    });
    return merged.slice(0, 28);
  }

  function fetchLiveArticles() {
    return Promise.all(FEEDS.map(function (feed) {
      return fetchFeedItems(feed).then(function (items) {
        return items.map(function (item) { return mapFeedItem(item, feed); }).filter(Boolean);
      });
    })).then(function (groups) {
      var live = [];
      groups.forEach(function (group) { live = live.concat(group); });
      return translateArticlesParallel(live);
    });
  }

  var backgroundRefreshPromise = null;

  function refreshBackground() {
    if (backgroundRefreshPromise) return backgroundRefreshPromise;
    backgroundRefreshPromise = fetchLiveArticles().then(function (live) {
      var merged = mergeArticles(live);
      writeCache(merged);
      backgroundRefreshPromise = null;
      return {
        articles: merged,
        updatedAt: Date.now(),
        fromCache: false
      };
    }).catch(function () {
      backgroundRefreshPromise = null;
      return null;
    });
    return backgroundRefreshPromise;
  }

  function loadArticles() {
    var cached = readCache(true);

    if (cached) {
      return Promise.resolve({
        articles: cached.articles,
        updatedAt: cached.updatedAt,
        fromCache: true
      });
    }

    return fetchLiveArticles().then(function (live) {
      var merged = mergeArticles(live);
      writeCache(merged);
      return {
        articles: merged,
        updatedAt: Date.now(),
        fromCache: false
      };
    }).catch(function () {
      var curated = CURATED.map(function (a) { return ensureImage(Object.assign({}, a)); });
      return {
        articles: curated,
        updatedAt: Date.now(),
        fromCache: false,
        error: true
      };
    });
  }

  function formatUpdatedAt(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var h = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');
    return y + '.' + m + '.' + day + ' ' + h + ':' + min;
  }

  function getCuratedPreview() {
    return CURATED.map(function (a) { return ensureImage(Object.assign({}, a)); });
  }

  return {
    loadArticles: loadArticles,
    refreshBackground: refreshBackground,
    getCuratedPreview: getCuratedPreview,
    openLabel: openLabel,
    formatUpdatedAt: formatUpdatedAt,
    CURATED: CURATED
  };
})();
