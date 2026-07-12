var RegionData = (function () {
  var METRO = {
    '서울': '서울',
    '부산': '부산',
    '대구': '대구',
    '인천': '인천',
    '광주': '광주',
    '대전': '대전',
    '울산': '울산',
    '세종': '세종'
  };

  function getCityFromAddress(address, region) {
    if (!address) return region || '전국';

    if (address.indexOf('서울특별시') === 0) return '서울';
    if (address.indexOf('부산광역시') === 0) return '부산';
    if (address.indexOf('대구광역시') === 0) return '대구';
    if (address.indexOf('인천광역시') === 0) return '인천';
    if (address.indexOf('광주광역시') === 0) return '광주';
    if (address.indexOf('대전광역시') === 0) return '대전';
    if (address.indexOf('울산광역시') === 0) return '울산';
    if (address.indexOf('세종특별자치시') === 0) return '세종';

    if (address.indexOf('제주특별자치도') === 0) {
      if (address.indexOf('서귀포시') !== -1) return '서귀포';
      if (address.indexOf('제주시') !== -1) return '제주';
      return '제주';
    }

    var match = address.match(/(?:특별자치도|광역시|도)\s*([가-힣]+(?:시|군))/);
    if (match) {
      return match[1].replace(/(시|군)$/, '');
    }

    return METRO[region] || region || '전국';
  }

  function enrichPlaces(list) {
    list.forEach(function (p) {
      p.city = getCityFromAddress(p.address, p.region);
    });
  }

  function getCitiesForRegion(region) {
    var counts = {};
    places.forEach(function (p) {
      if (p.region !== region || !p.city) return;
      if (!counts[p.city]) counts[p.city] = { help: 0, danger: 0 };
      counts[p.city][p.type] += 1;
    });

    return Object.keys(counts)
      .sort(function (a, b) { return a.localeCompare(b, 'ko'); })
      .map(function (name) {
        return {
          name: name,
          label: name,
          help: counts[name].help,
          danger: counts[name].danger,
          total: counts[name].help + counts[name].danger
        };
      });
  }

  function getPlacesForCity(region, city) {
    return places.filter(function (p) {
      return p.region === region && p.city === city;
    });
  }

  function getCityCenter(region, city) {
    var items = getPlacesForCity(region, city).filter(function (p) {
      return p.lat && p.lng && p.lat !== 0;
    });
    if (!items.length) return null;
    var lat = 0;
    var lng = 0;
    items.forEach(function (p) {
      lat += p.lat;
      lng += p.lng;
    });
    return {
      lat: lat / items.length,
      lng: lng / items.length,
      zoom: METRO[city] ? 12 : 13
    };
  }

  function openCityPage(region, city) {
    if (typeof AppNav !== 'undefined') {
      AppNav.goCity(region, city);
      return;
    }
    location.href = 'index.html#/city/' + encodeURIComponent(region) + '/' + encodeURIComponent(city);
  }

  function openPlacePage(id, ctx) {
    if (typeof AppNav !== 'undefined') {
      AppNav.goPlace(id, ctx);
      return;
    }
    var url = 'index.html#/place/' + id;
    if (ctx && ctx.region && ctx.city) {
      url += '?region=' + encodeURIComponent(ctx.region) + '&city=' + encodeURIComponent(ctx.city);
    }
    location.href = url;
  }

  function isMetroRegion(region) {
    return !!METRO[region];
  }

  return {
    METRO: METRO,
    getCityFromAddress: getCityFromAddress,
    enrichPlaces: enrichPlaces,
    getCitiesForRegion: getCitiesForRegion,
    getPlacesForCity: getPlacesForCity,
    getCityCenter: getCityCenter,
    openCityPage: openCityPage,
    openPlacePage: openPlacePage,
    isMetroRegion: isMetroRegion
  };
})();
