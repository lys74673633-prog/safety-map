var PlaceI18n = (function () {
  var CACHE_KEY = 'oasi5-place-text-en-v2';
  var memory = {};
  var inflight = null;

  // Longest phrases first so replacements don't get clipped.
  var PHRASES = [
    ['여성긴급전화1366 중앙센터', "Women's Hotline 1366 Central Center"],
    ['여성긴급전화1366 경기북부센터', "Women's Hotline 1366 Northern Gyeonggi Center"],
    ['여성긴급전화1366', "Women's Hotline 1366"],
    ['서울특별시립발달장애인복지관', 'Seoul Municipal Developmental Disability Welfare Center'],
    ['서울특별시립 남부장애인종합복지관', 'Seoul Municipal Southern Disability Welfare Center'],
    ['서울특별시립 북부장애인종합복지관', 'Seoul Municipal Northern Disability Welfare Center'],
    ['서울시립 동부장애인종합복지관', 'Seoul Municipal Eastern Disability Welfare Center'],
    ['서울시립 중앙노인종합복지관', 'Seoul Municipal Central Senior Welfare Center'],
    ['서울시립 서북보도아리랑복지관', 'Seoul Municipal Northwest Arirang Welfare Center'],
    ['부산광역시립 중앙여성해바라기센터', 'Busan Municipal Central Sunflower Center for Women'],
    ['부산광역시립 동부종합사회복지관', 'Busan Municipal Eastern Community Welfare Center'],
    ['부산광역시장애인종합복지관', 'Busan Metropolitan Disability Welfare Center'],
    ['부산시립 노인종합복지관', 'Busan Municipal Senior Welfare Center'],
    ['대구광역시립 북부장애인종합복지관', 'Daegu Municipal Northern Disability Welfare Center'],
    ['대구광역시립 남부장애인종합복지관', 'Daegu Municipal Southern Disability Welfare Center'],
    ['대구시립 노인종합복지관', 'Daegu Municipal Senior Welfare Center'],
    ['인천광역시립 장애인종합복지관', 'Incheon Municipal Disability Welfare Center'],
    ['인천광역시립 노인종합복지관', 'Incheon Municipal Senior Welfare Center'],
    ['광주광역시립 노인종합복지관', 'Gwangju Municipal Senior Welfare Center'],
    ['광주광역시립 장애인종합복지관', 'Gwangju Municipal Disability Welfare Center'],
    ['대전광역시립장애인종합복지관', 'Daejeon Municipal Disability Welfare Center'],
    ['울산광역시장애인종합복지관', 'Ulsan Metropolitan Disability Welfare Center'],
    ['경기도립 장애인종합복지관', 'Gyeonggi Provincial Disability Welfare Center'],
    ['전북특별자치도립 장애인종합복지관', 'Jeonbuk Provincial Disability Welfare Center'],
    ['강원특별자치도립 장애인복지관', 'Gangwon Provincial Disability Welfare Center'],
    ['제주특별자치도장애인종합복지관', 'Jeju Disability Welfare Center'],
    ['제주특별자치도 노인복지관', 'Jeju Senior Welfare Center'],
    ['경남장애인종합복지관', 'Gyeongnam Disability Welfare Center'],
    ['장애인종합복지관', 'Disability Welfare Center'],
    ['노인종합복지관', 'Senior Welfare Center'],
    ['종합사회복지관', 'Community Welfare Center'],
    ['아동보호전문기관', 'Child Protection Agency'],
    ['장애인복지관', 'Disability Welfare Center'],
    ['노인복지관', 'Senior Welfare Center'],
    ['복지관', 'Welfare Center'],
    ['해바라기센터', 'Sunflower Center'],
    ['무단횡단 사고다발지', 'Jaywalking Accident Hotspot'],
    ['무단횡단 사고 다발지', 'Jaywalking Accident Hotspot'],
    ['사고다발지', 'Accident Hotspot'],
    ['횡단보도', 'Crosswalk'],
    ['인근', 'Area'],
    ['앞', ''],
    ['서울특별시립', 'Seoul Municipal'],
    ['서울시립', 'Seoul Municipal'],
    ['부산광역시립', 'Busan Municipal'],
    ['대구광역시립', 'Daegu Municipal'],
    ['인천광역시립', 'Incheon Municipal'],
    ['광주광역시립', 'Gwangju Municipal'],
    ['대전광역시립', 'Daejeon Municipal'],
    ['울산광역시', 'Ulsan'],
    ['경기도립', 'Gyeonggi Provincial'],
    ['강원특별자치도립', 'Gangwon Provincial'],
    ['전북특별자치도립', 'Jeonbuk Provincial'],
    ['제주특별자치도', 'Jeju'],
    ['서울특별시', 'Seoul'],
    ['부산광역시', 'Busan'],
    ['대구광역시', 'Daegu'],
    ['인천광역시', 'Incheon'],
    ['광주광역시', 'Gwangju'],
    ['대전광역시', 'Daejeon'],
    ['세종특별자치시', 'Sejong'],
    ['강원특별자치도', 'Gangwon'],
    ['전북특별자치도', 'Jeonbuk'],
    ['충청북도', 'North Chungcheong'],
    ['충청남도', 'South Chungcheong'],
    ['전라남도', 'South Jeolla'],
    ['경상북도', 'North Gyeongsang'],
    ['경상남도', 'South Gyeongsang'],
    ['경기도', 'Gyeonggi'],
    ['서울', 'Seoul'],
    ['부산', 'Busan'],
    ['대구', 'Daegu'],
    ['인천', 'Incheon'],
    ['광주', 'Gwangju'],
    ['대전', 'Daejeon'],
    ['울산', 'Ulsan'],
    ['세종', 'Sejong'],
    ['경기', 'Gyeonggi'],
    ['강원', 'Gangwon'],
    ['충북', 'North Chungcheong'],
    ['충남', 'South Chungcheong'],
    ['전북', 'North Jeolla'],
    ['전남', 'South Jeolla'],
    ['경북', 'North Gyeongsang'],
    ['경남', 'South Gyeongsang'],
    ['제주', 'Jeju'],
    ['중앙센터', 'Central Center'],
    ['서울센터', 'Seoul Center'],
    ['부산센터', 'Busan Center'],
    ['대구센터', 'Daegu Center'],
    ['인천센터', 'Incheon Center'],
    ['광주센터', 'Gwangju Center'],
    ['대전센터', 'Daejeon Center'],
    ['울산센터', 'Ulsan Center'],
    ['세종센터', 'Sejong Center'],
    ['경기센터', 'Gyeonggi Center'],
    ['강원센터', 'Gangwon Center'],
    ['충북센터', 'North Chungcheong Center'],
    ['충남센터', 'South Chungcheong Center'],
    ['전북센터', 'North Jeolla Center'],
    ['전남센터', 'South Jeolla Center'],
    ['경북센터', 'North Gyeongsang Center'],
    ['경남센터', 'South Gyeongsang Center'],
    ['제주센터', 'Jeju Center'],
    ['구로구', 'Guro-gu'],
    ['동대문구', 'Dongdaemun-gu'],
    ['영등포구', 'Yeongdeungpo-gu'],
    ['부산진구', 'Busanjin-gu'],
    ['해운대구', 'Haeundae-gu'],
    ['부평구', 'Bupyeong-gu'],
    ['중구', 'Jung-gu'],
    ['종로구', 'Jongno-gu'],
    ['동작구', 'Dongjak-gu'],
    ['노원구', 'Nowon-gu'],
    ['용산구', 'Yongsan-gu'],
    ['송파구', 'Songpa-gu'],
    ['은평구', 'Eunpyeong-gu'],
    ['강남구', 'Gangnam-gu'],
    ['마포구', 'Mapo-gu'],
    ['수영구', 'Suyeong-gu'],
    ['남동구', 'Namdong-gu'],
    ['수성구', 'Suseong-gu'],
    ['북구', 'Buk-gu'],
    ['유성구', 'Yuseong-gu'],
    ['팔달구', 'Paldal-gu'],
    ['분당구', 'Bundang-gu'],
    ['덕양구', 'Deogyang-gu'],
    ['서북구', 'Seobuk-gu'],
    ['성산구', 'Seongsan-gu'],
    ['의창구', 'Uichang-gu'],
    ['완산구', 'Wansan-gu'],
    ['덕진구', 'Deokjin-gu'],
    ['상당구', 'Sangdang-gu'],
    ['서구', 'Seo-gu'],
    ['남구', 'Nam-gu'],
    ['강남구립', 'Gangnam-gu'],
    ['마포구립', 'Mapo-gu'],
    ['구로', 'Guro'],
    ['신설동역', 'Sindaeapyeong Station'],
    ['영등포역', 'Yeongdeungpo Station'],
    ['부전시장', 'Bujeon Market'],
    ['교대역', 'Gyodae Station'],
    ['부평역', 'Bupyeong Station'],
    ['마포역', 'Mapo Station'],
    ['강남역', 'Gangnam Station'],
    ['종로3가역', 'Jongno 3-ga Station'],
    ['해운대해수욕장', 'Haeundae Beach'],
    ['안목해변', 'Anmok Beach'],
    ['오동도', 'Odongdo'],
    ['불국사 황토현길', 'Bulguksa Hwangtohyeon Path'],
    ['성산일출봉', 'Seongsan Ilchulbong'],
    ['한라산 백록담 코스', 'Hallasan Baengnokdam Course'],
    ['김해국제공항', 'Gimhae International Airport'],
    ['은행네거리', 'Eunhaeng Intersection'],
    ['사거리', 'Intersection'],
    ['남부', 'Southern'],
    ['북부', 'Northern'],
    ['동부', 'Eastern'],
    ['서부', 'Western'],
    ['중앙', 'Central'],
    ['시립', 'Municipal'],
    ['구립', 'District'],
    ['발달장애인', 'Developmental Disability'],
    ['재활', 'Rehab'],
    ['직업훈련', 'Job Training'],
    ['이동 지원', 'Mobility Support'],
    ['보조기기', 'Assistive Devices'],
    ['방문요양', 'Home Care'],
    ['급식', 'Meals'],
    ['여가', 'Leisure'],
    ['건강', 'Health'],
    ['복지', 'Welfare'],
    ['통합', 'Integrated'],
    ['상담', 'Counseling'],
    ['보호', 'Protection'],
    ['지원', 'Support'],
    ['프로그램', 'Programs'],
    ['서비스', 'Services'],
    ['전문', 'Specialized'],
    ['대표', 'Main'],
    ['전국', 'Nationwide'],
    ['관광객', 'Tourist'],
    ['집중', 'Crowds'],
    ['해안', 'Coast'],
    ['파도', 'Waves'],
    ['주의', 'Caution'],
    ['낙상', 'Falls'],
    ['절벽', 'Cliff'],
    ['추락', 'Fall hazard'],
    ['험로', 'Rough trail'],
    ['혼잡', 'Congestion'],
    ['고령', 'Elderly'],
    ['장애인', 'Disability'],
    ['노인', 'Senior'],
    ['아동', 'Child'],
    ['여성', 'Women'],
    ['보행', 'Pedestrian'],
    ['교통사고', 'Traffic Accident'],
    ['다발', 'Frequent'],
    ['지역', 'Area'],
    ['지점', 'Spot'],
    ['구간', 'Section'],
    ['코스', 'Course'],
    ['인근', 'Nearby']
  ];

  function isEn() {
    return typeof I18n !== 'undefined' && I18n.getLang && I18n.getLang() === 'en';
  }

  function loadCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        Object.keys(data).forEach(function (k) {
          if (data[k]) memory[k] = data[k];
        });
      }
    } catch (e) {}
  }

  function saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(memory));
    } catch (e) {}
  }

  function needsHangul(text) {
    return /[가-힣]/.test(String(text || ''));
  }

  function applyPhrases(text) {
    var s = String(text || '');
    PHRASES.forEach(function (pair) {
      if (s.indexOf(pair[0]) >= 0) s = s.split(pair[0]).join(pair[1]);
    });
    // Common district / city suffixes left as romanized particles
    s = s
      .replace(/([A-Za-z0-9)\]»"'])\s*구\b/g, '$1-gu')
      .replace(/([A-Za-z0-9)\]»"'])\s*시\b/g, '$1-si')
      .replace(/([A-Za-z0-9)\]»"'])\s*군\b/g, '$1-gun')
      .replace(/([A-Za-z0-9)\]»"'])\s*동\b/g, '$1-dong')
      .replace(/([A-Za-z0-9)\]»"'])\s*읍\b/g, '$1-eup')
      .replace(/([A-Za-z0-9)\]»"'])\s*면\b/g, '$1-myeon')
      .replace(/([A-Za-z0-9)\]»"'])\s*역\b/g, '$1 Station')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+,/g, ',')
      .trim();
    return s;
  }

  function translateSync(text) {
    var s = String(text || '');
    if (!s) return s;
    if (!isEn() || !needsHangul(s)) return s;
    if (memory[s]) return memory[s];
    var out = applyPhrases(s);
    // Clean leftover separators
    out = out.replace(/\s*[·•]\s*/g, ' · ').replace(/\s{2,}/g, ' ').trim();
    if (out && out !== s) {
      memory[s] = out;
    }
    return out || s;
  }

  function t(text) {
    return translateSync(text);
  }

  function translateBatch(texts) {
    var combined = texts.join('\n---\n');
    if (!combined) return Promise.resolve([]);
    var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=' +
      encodeURIComponent(combined.slice(0, 1400));
    return fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data[0]) return texts;
        var translated = data[0].map(function (part) { return part[0]; }).join('').trim();
        return translated.split('\n---\n');
      })
      .catch(function () { return texts; });
  }

  function uniquePending(list) {
    var seen = {};
    var out = [];
    (list || []).forEach(function (text) {
      var s = String(text || '').trim();
      if (!s || !needsHangul(s) || seen[s]) return;
      // Skip if sync phrase translation already removed Hangul
      var sync = translateSync(s);
      if (!needsHangul(sync)) {
        memory[s] = sync;
        return;
      }
      if (memory[s] && !needsHangul(memory[s])) return;
      seen[s] = true;
      out.push(s);
    });
    return out;
  }

  function translateMissing(texts) {
    var pending = uniquePending(texts);
    if (!pending.length) {
      saveCache();
      return Promise.resolve();
    }

    var chunks = [];
    var i;
    for (i = 0; i < pending.length; i += 10) {
      chunks.push(pending.slice(i, i + 10));
    }

    var chain = Promise.resolve();
    chunks.forEach(function (chunk) {
      chain = chain.then(function () {
        return translateBatch(chunk).then(function (parts) {
          chunk.forEach(function (src, idx) {
            var en = (parts[idx] && String(parts[idx]).trim()) || translateSync(src);
            memory[src] = en;
          });
          saveCache();
        });
      });
    });
    return chain;
  }

  function collectPlaceTexts() {
    var list = [];
    if (typeof places !== 'undefined' && places && places.length) {
      places.forEach(function (p) {
        if (p.name) list.push(p.name);
        if (p.description) list.push(p.description);
        if (p.summary) list.push(p.summary);
        if (p.whyImportant) list.push(p.whyImportant);
        if (p.city) list.push(p.city);
        if (p.address) list.push(p.address);
        if (p.canDo && p.canDo.length) p.canDo.forEach(function (line) { list.push(line); });
        if (p.howToUse && p.howToUse.length) p.howToUse.forEach(function (line) { list.push(line); });
      });
    }
    if (typeof DisabilityAccess !== 'undefined' && DisabilityAccess.getNameTexts) {
      list = list.concat(DisabilityAccess.getNameTexts());
    }
    return list;
  }

  function prepareAll(extraTexts) {
    if (!isEn()) return Promise.resolve();
    // Seed sync translations first so UI can remount immediately.
    collectPlaceTexts().concat(extraTexts || []).forEach(function (text) {
      translateSync(text);
    });
    saveCache();
    if (inflight) return inflight;
    inflight = translateMissing(collectPlaceTexts().concat(extraTexts || [])).then(function () {
      inflight = null;
    }).catch(function () {
      inflight = null;
    });
    return inflight;
  }

  function prepareAnd(callback) {
    // Always refresh UI immediately (regions + phrase-based names).
    if (typeof callback === 'function') callback();
    if (!isEn()) return Promise.resolve();
    return prepareAll().then(function () {
      if (typeof callback === 'function') callback();
    });
  }

  loadCache();

  return {
    t: t,
    prepareAll: prepareAll,
    prepareAnd: prepareAnd,
    isEn: isEn
  };
})();
