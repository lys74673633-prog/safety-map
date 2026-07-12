(function (global) {
  var GENERIC_TERMS = [
    '서울특별시립', '부산광역시립', '대구광역시립', '인천광역시립', '광주광역시립',
    '대전광역시립', '울산광역시립', '세종특별자치', '경기도립', '전북특별자치도립',
    '제주특별자치도', '경남', '경북', '전남', '전북', '충남', '충북', '강원특별자치도',
    '여성긴급전화1366', '경찰청', '지정', '아동안전지킴이집', '대한민국', '한국'
  ];

  function normalize(text) {
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '');
  }

  function cleanPlaceName(name) {
    return name
      .replace(/\([^)]*\)/g, '')
      .replace(/무단횡단 사고다발지/g, '')
      .replace(/인근/g, '')
      .replace(/일대/g, '')
      .trim();
  }

  function isNamedFacility(place) {
    if (place.type === 'help') return true;
    return /복지관|센터|지킴이|^CU |^GS25 /.test(place.name);
  }

  function getCoreName(name) {
    var core = cleanPlaceName(name);
    GENERIC_TERMS.forEach(function (term) {
      core = core.split(term).join('');
    });
    core = core.replace(/\s+/g, '').trim();
    return core;
  }

  function getLandmarkKeyword(name) {
    var cleaned = cleanPlaceName(name);
    var patterns = [
      /([가-힣0-9]+역)/,
      /([가-힣]+해수욕장)/,
      /([가-힣]+일출봉)/,
      /([가-힣]+국립공원)/,
      /([가-힣]+사)/,
      /([가-힣]+공항)/,
      /([가-힣]+센트럴파크)/,
      /([가-힣]+해변)/,
      /([가-힣]+동)/,
      /([가-힣]+로)/,
      /([가-힣]+시장)/
    ];

    for (var i = 0; i < patterns.length; i++) {
      var match = cleaned.match(patterns[i]);
      if (match && match[1] && match[1].length >= 2) {
        return match[1];
      }
    }

    return cleaned.split(/\s+/)[0] || cleaned;
  }

  function extractKeywords(name) {
    var keywords = [];
    var core = getCoreName(name);
    if (core.length >= 3) keywords.push(core);

    var chunks = name.match(/[가-힣0-9]{2,}/g) || [];
    chunks.forEach(function (chunk) {
      if (GENERIC_TERMS.indexOf(chunk) >= 0) return;
      if (chunk.length < 2) return;
      if (keywords.indexOf(chunk) < 0) keywords.push(chunk);
    });

    return keywords.sort(function (a, b) { return b.length - a.length; });
  }

  function isRelevantTitle(title, place) {
    if (!title) return false;

    var titleNorm = normalize(title);
    var core = normalize(getCoreName(place.name));

    if (core.length >= 4 && titleNorm.indexOf(core) >= 0) return true;

    var keywords = extractKeywords(place.name);
    var strong = keywords.filter(function (k) { return k.length >= 4; });
    if (strong.some(function (k) { return titleNorm.indexOf(normalize(k)) >= 0; })) {
      return true;
    }

    if (isNamedFacility(place)) {
      var facilityHints = keywords.filter(function (k) {
        return /복지관|센터|지킴이|편의점/.test(k) || k.length >= 5;
      });
      return facilityHints.some(function (k) { return titleNorm.indexOf(normalize(k)) >= 0; });
    }

    var landmark = normalize(getLandmarkKeyword(place.name));
    if (landmark.length >= 3 && titleNorm.indexOf(landmark) >= 0) return true;

    return false;
  }

  function dedupePhotos(photos) {
    var seen = {};
    return photos.filter(function (photo) {
      if (!photo.url || seen[photo.url]) return false;
      seen[photo.url] = true;
      return true;
    });
  }

  function fetchJson(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('fetch failed');
      return res.json();
    });
  }

  function mapWikiPages(pages, label, place) {
    if (!pages) return [];

    return Object.keys(pages).map(function (key) {
      var page = pages[key];
      if (!page.thumbnail || !page.thumbnail.source) return null;
      if (!isRelevantTitle(page.title, place)) return null;

      return {
        url: page.thumbnail.source,
        thumb: page.thumbnail.source,
        caption: page.title + ' (' + label + ')',
        source: 'wiki'
      };
    }).filter(Boolean);
  }

  function mapCommonsPages(pages, place) {
    if (!pages) return [];

    return Object.keys(pages).map(function (key) {
      var page = pages[key];
      if (!page.thumbnail || !page.thumbnail.source) return null;

      var title = (page.title || '').replace('File:', '');
      if (!isRelevantTitle(title, place) && !isRelevantTitle(page.title, place)) return null;

      return {
        url: page.thumbnail.source,
        thumb: page.thumbnail.source,
        caption: title + ' (위키미디어)',
        source: 'commons'
      };
    }).filter(Boolean);
  }

  function fetchWikiSearchPhotos(query, host, label, place) {
    if (!query) return Promise.resolve([]);
    var url = host + '/w/api.php?action=query&generator=search&gsrsearch='
      + encodeURIComponent(query) + '&gsrlimit=4&prop=pageimages'
      + '&piprop=thumbnail&pithumbsize=960&format=json&origin=*';

    return fetchJson(url).then(function (data) {
      return mapWikiPages(data.query && data.query.pages, label, place);
    }).catch(function () { return []; });
  }

  function fetchCommonsSearchPhotos(query, place) {
    if (!query) return Promise.resolve([]);
    var url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch='
      + encodeURIComponent(query) + '&gsrlimit=4&prop=pageimages'
      + '&piprop=thumbnail&pithumbsize=960&format=json&origin=*';

    return fetchJson(url).then(function (data) {
      return mapCommonsPages(data.query && data.query.pages, place);
    }).catch(function () { return []; });
  }

  function fetchWikiGeoPhotos(lat, lng, host, label, place) {
    var url = host + '/w/api.php?action=query&generator=geosearch&ggscoord='
      + lat + '|' + lng + '&ggsradius=600&ggslimit=8&prop=pageimages'
      + '&piprop=thumbnail&pithumbsize=960&format=json&origin=*';

    return fetchJson(url).then(function (data) {
      return mapWikiPages(data.query && data.query.pages, label, place);
    }).catch(function () { return []; });
  }

  function buildSearchQueries(place) {
    var queries = [];
    var full = cleanPlaceName(place.name);
    var core = getCoreName(place.name);
    var landmark = getLandmarkKeyword(place.name);

    if (full) queries.push(full);
    if (core && core !== full) queries.push(core);
    if (landmark && queries.indexOf(landmark) < 0) queries.push(landmark);

    if (isNamedFacility(place) && /복지관/.test(place.name)) {
      queries.push(core.replace(/종합/g, ''));
    }

    return queries.filter(function (q, i, arr) {
      return q && q.length >= 2 && arr.indexOf(q) === i;
    });
  }

  function searchByQueries(queries, place) {
    var limited = queries.slice(0, 2);

    function tryAt(index) {
      if (index >= limited.length) {
        if (!isNamedFacility(place)) {
          return Promise.all([
            fetchWikiGeoPhotos(place.lat, place.lng, 'https://ko.wikipedia.org', '한국어 위키백과', place)
          ]).then(function (groups) {
            return dedupePhotos(groups[0]).slice(0, 6);
          }).catch(function () { return []; });
        }
        return Promise.resolve([]);
      }

      var query = limited[index];
      return Promise.all([
        fetchWikiSearchPhotos(query, 'https://ko.wikipedia.org', '한국어 위키백과', place),
        fetchCommonsSearchPhotos(query, place)
      ]).then(function (groups) {
        var photos = dedupePhotos(groups[0].concat(groups[1]));
        if (photos.length > 0) return photos.slice(0, 6);
        return tryAt(index + 1);
      }).catch(function () {
        return tryAt(index + 1);
      });
    }

    return tryAt(0);
  }

  function loadRealPhotos(place) {
    var cached = global.PLACE_IMAGES && place && place.name && global.PLACE_IMAGES[place.name];
    if (cached && cached.length) {
      return Promise.resolve(cached.slice(0, 6));
    }

    var queries = buildSearchQueries(place);
    return searchByQueries(queries, place);
  }

  function getGoogleMapUrl(place) {
    var name = place && place.name ? place.name : '';
    var address = place && place.address ? place.address : '';
    var query = name ? (name + ' ' + address) : address;
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query.trim());
  }

  function getStreetViewUrl(placeOrLat, lng) {
    if (placeOrLat && typeof placeOrLat === 'object') {
      return getGoogleMapUrl(placeOrLat);
    }
    return 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + placeOrLat + ',' + lng;
  }

  function getNaverMapUrl(name, address) {
    return 'https://map.naver.com/p/search/' + encodeURIComponent(name || address);
  }

  global.PhotoLoader = {
    loadRealPhotos: loadRealPhotos,
    getGoogleMapUrl: getGoogleMapUrl,
    getStreetViewUrl: getStreetViewUrl,
    getNaverMapUrl: getNaverMapUrl,
    cleanPlaceName: cleanPlaceName,
    isNamedFacility: isNamedFacility
  };
})(window);
