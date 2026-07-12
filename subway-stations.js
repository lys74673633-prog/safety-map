var SubwayStations = (function () {
  // KRIC 레일포털 역 코드 (주요 역·환승역). 카카오맵 교통약자정보와 동일 공공데이터 기반.
  var ENTRIES = [
    { name: '서울역', railOprIsttCd: 'S1', lnCd: '4', stinCd: '426', lineName: '4호선' },
    { name: '서울역', railOprIsttCd: 'KR', lnCd: '1', stinCd: '150', lineName: '1호선' },
    { name: '강남역', railOprIsttCd: 'S1', lnCd: '2', stinCd: '222', lineName: '2호선' },
    { name: '강남역', railOprIsttCd: 'S1', lnCd: '9', stinCd: '925', lineName: '신분당선' },
    { name: '홍대입구', railOprIsttCd: 'S1', lnCd: '2', stinCd: '239', lineName: '2호선' },
    { name: '홍대입구', railOprIsttCd: 'S1', lnCd: '6', stinCd: '626', lineName: '6호선' },
    { name: '홍대입구', railOprIsttCd: 'S1', lnCd: 'A', stinCd: 'A04', lineName: '공항철도' },
    { name: '잠실', railOprIsttCd: 'S1', lnCd: '2', stinCd: '215', lineName: '2호선' },
    { name: '잠실', railOprIsttCd: 'S1', lnCd: '8', stinCd: '814', lineName: '8호선' },
    { name: '여의도', railOprIsttCd: 'S1', lnCd: '5', stinCd: '526', lineName: '5호선' },
    { name: '여의도', railOprIsttCd: 'S1', lnCd: '9', stinCd: '920', lineName: '9호선' },
    { name: '충무로', railOprIsttCd: 'S1', lnCd: '3', stinCd: '321', lineName: '3호선' },
    { name: '충무로', railOprIsttCd: 'S1', lnCd: '4', stinCd: '423', lineName: '4호선' },
    { name: '불광', railOprIsttCd: 'S1', lnCd: '3', stinCd: '322', lineName: '3호선' },
    { name: '불광', railOprIsttCd: 'S1', lnCd: '6', stinCd: '622', lineName: '6호선' },
    { name: '합정', railOprIsttCd: 'S1', lnCd: '2', stinCd: '238', lineName: '2호선' },
    { name: '합정', railOprIsttCd: 'S1', lnCd: '6', stinCd: '623', lineName: '6호선' },
    { name: '당산', railOprIsttCd: 'S1', lnCd: '2', stinCd: '237', lineName: '2호선' },
    { name: '당산', railOprIsttCd: 'S1', lnCd: '9', stinCd: '910', lineName: '9호선' },
    { name: '사당', railOprIsttCd: 'S1', lnCd: '2', stinCd: '226', lineName: '2호선' },
    { name: '사당', railOprIsttCd: 'S1', lnCd: '4', stinCd: '434', lineName: '4호선' },
    { name: '고속터미널', railOprIsttCd: 'S1', lnCd: '3', stinCd: '334', lineName: '3호선' },
    { name: '고속터미널', railOprIsttCd: 'S1', lnCd: '7', stinCd: '733', lineName: '7호선' },
    { name: '고속터미널', railOprIsttCd: 'S1', lnCd: '9', stinCd: '917', lineName: '9호선' },
    { name: '신도림', railOprIsttCd: 'S1', lnCd: '2', stinCd: '234', lineName: '2호선' },
    { name: '신도림', railOprIsttCd: 'S1', lnCd: '1', stinCd: '140', lineName: '1호선' },
    { name: '왕십리', railOprIsttCd: 'S1', lnCd: '2', stinCd: '211', lineName: '2호선' },
    { name: '왕십리', railOprIsttCd: 'S1', lnCd: '5', stinCd: '508', lineName: '5호선' },
    { name: '건대입구', railOprIsttCd: 'S1', lnCd: '2', stinCd: '212', lineName: '2호선' },
    { name: '건대입구', railOprIsttCd: 'S1', lnCd: '7', stinCd: '709', lineName: '7호선' },
    { name: '종로3가', railOprIsttCd: 'S1', lnCd: '1', stinCd: '131', lineName: '1호선' },
    { name: '종로3가', railOprIsttCd: 'S1', lnCd: '3', stinCd: '315', lineName: '3호선' },
    { name: '종로3가', railOprIsttCd: 'S1', lnCd: '5', stinCd: '505', lineName: '5호선' },
    { name: '을지로3가', railOprIsttCd: 'S1', lnCd: '2', stinCd: '203', lineName: '2호선' },
    { name: '을지로3가', railOprIsttCd: 'S1', lnCd: '3', stinCd: '314', lineName: '3호선' },
    { name: '을지로4가', railOprIsttCd: 'S1', lnCd: '2', stinCd: '204', lineName: '2호선' },
    { name: '을지로4가', railOprIsttCd: 'S1', lnCd: '5', stinCd: '504', lineName: '5호선' },
    { name: '동대문', railOprIsttCd: 'S1', lnCd: '1', stinCd: '128', lineName: '1호선' },
    { name: '동대문', railOprIsttCd: 'S1', lnCd: '4', stinCd: '421', lineName: '4호선' },
    { name: '동대문역사문화공원', railOprIsttCd: 'S1', lnCd: '2', stinCd: '205', lineName: '2호선' },
    { name: '동대문역사문화공원', railOprIsttCd: 'S1', lnCd: '4', stinCd: '422', lineName: '4호선' },
    { name: '동대문역사문화공원', railOprIsttCd: 'S1', lnCd: '5', stinCd: '507', lineName: '5호선' },
    { name: '교대', railOprIsttCd: 'S1', lnCd: '2', stinCd: '220', lineName: '2호선' },
    { name: '교대', railOprIsttCd: 'S1', lnCd: '3', stinCd: '331', lineName: '3호선' },
    { name: '선릉', railOprIsttCd: 'S1', lnCd: '2', stinCd: '221', lineName: '2호선' },
    { name: '선릉', railOprIsttCd: 'S1', lnCd: '9', stinCd: '921', lineName: '분당선' },
    { name: '코엑스', railOprIsttCd: 'S1', lnCd: '2', stinCd: '219', lineName: '2호선' },
    { name: '삼성', railOprIsttCd: 'S1', lnCd: '2', stinCd: '219', lineName: '2호선' },
    { name: '부산역', railOprIsttCd: 'S2', lnCd: '1', stinCd: '101', lineName: '1호선' },
    { name: '해운대', railOprIsttCd: 'S2', lnCd: '2', stinCd: '203', lineName: '2호선' },
    { name: '센텀시티', railOprIsttCd: 'S2', lnCd: '2', stinCd: '205', lineName: '2호선' },
    { name: '대구역', railOprIsttCd: 'S3', lnCd: '1', stinCd: '101', lineName: '1호선' },
    { name: '대전역', railOprIsttCd: 'D1', lnCd: '1', stinCd: '101', lineName: '1호선' },
    { name: '광주송정', railOprIsttCd: 'G1', lnCd: '1', stinCd: '101', lineName: '1호선' }
  ];

  function normalize(name) {
    return String(name || '')
      .replace(/\(.*?\)/g, '')
      .replace(/\s+/g, '')
      .replace(/역$/g, '')
      .toLowerCase();
  }

  function lineHint(lineName) {
    if (!lineName) return '';
    var m = String(lineName).match(/(\d+)호선|(\d+)호|분당|신분당|공항|경의|경춘|수인|안산|우이|김포|신림|GTX/i);
    return m ? String(lineName) : '';
  }

  function findByName(stationName, lineName) {
    var key = normalize(stationName);
    if (!key) return [];

    var hint = lineHint(lineName);
    var hits = ENTRIES.filter(function (e) { return normalize(e.name) === key; });

    if (hint && hits.length > 1) {
      var filtered = hits.filter(function (e) {
        return String(e.lineName).indexOf(hint.replace(/[^0-9분당신분당공항]/g, '')) >= 0
          || String(lineName).indexOf(String(e.lineName).replace('호선', '')) >= 0;
      });
      if (filtered.length) hits = filtered;
    }

    return hits;
  }

  function findOne(stationName, lineName) {
    var list = findByName(stationName, lineName);
    return list.length ? list[0] : null;
  }

  return {
    findByName: findByName,
    findOne: findOne,
    normalize: normalize
  };
})();
