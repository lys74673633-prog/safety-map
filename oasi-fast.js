var OasiFast = (function () {
  var LS_PREFIX = 'oasi5-fast:';
  var GEO_TTL = 7 * 24 * 60 * 60 * 1000;
  var NEAR_TTL = 2 * 60 * 60 * 1000;

  function haversineKm(aLat, aLng, bLat, bLng) {
    var toRad = Math.PI / 180;
    var dLat = (bLat - aLat) * toRad;
    var dLng = (bLng - aLng) * toRad;
    var s =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(aLat * toRad) * Math.cos(bLat * toRad) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  function lsGet(key, ttl) {
    try {
      var raw = localStorage.getItem(LS_PREFIX + key);
      if (!raw) return null;
      var row = JSON.parse(raw);
      if (!row || !row.t || Date.now() - row.t > ttl) return null;
      return row.v;
    } catch (e) {
      return null;
    }
  }

  function lsSet(key, value) {
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify({ t: Date.now(), v: value }));
    } catch (e) {}
  }

  function inKorea(lat, lng) {
    return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
  }

  function geocode(query) {
    var q = String(query || '').trim();
    if (!q) return Promise.resolve(null);
    var cached = lsGet('geo:' + q.toLowerCase(), GEO_TTL);
    if (cached && cached.lat) return Promise.resolve(cached);

    var url = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(q) + '&count=6&language=ko&format=json&countryCode=KR';
    return fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var rows = (data && data.results) || [];
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var lat = Number(row.latitude);
          var lng = Number(row.longitude);
          if (!inKorea(lat, lng)) continue;
          var point = {
            name: q,
            address: [row.admin3, row.admin2, row.admin1].filter(Boolean).join(' ') || '',
            lat: lat,
            lng: lng,
            source: 'open-meteo'
          };
          lsSet('geo:' + q.toLowerCase(), point);
          return point;
        }
        return null;
      })
      .catch(function () { return null; });
  }

  function classifyOsm(tags) {
    var amenity = tags.amenity || '';
    var shop = tags.shop || '';
    if (amenity === 'cafe') return 'cafe';
    if (amenity === 'restaurant' || amenity === 'fast_food' || amenity === 'food_court') return 'food';
    if (/supermarket|convenience|mall|department_store/.test(shop)) return 'shop';
    return null;
  }

  function nearby(lat, lng, radiusKm, limit) {
    var key = 'near:' + lat.toFixed(3) + ',' + lng.toFixed(3) + ':' + radiusKm + ':' + limit;
    var cached = lsGet(key, NEAR_TTL);
    if (cached) return Promise.resolve(cached);

    var radiusM = Math.round(Math.min(Math.max(radiusKm || 2.5, 1), 4) * 1000);
    var query =
      '[out:json][timeout:4];(' +
      'node["amenity"="cafe"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
      'node["amenity"="restaurant"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
      'node["amenity"="fast_food"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
      'node["shop"~"supermarket|convenience|mall|department_store"](around:' + radiusM + ',' + lat + ',' + lng + ');' +
      ');out body 50;';

    var endpoints = [
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass-api.de/api/interpreter'
    ];

    function tryEndpoint(i) {
      if (i >= endpoints.length) {
        return Promise.resolve({ cafe: [], food: [], shop: [], source: 'empty' });
      }
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 3500);
      return fetch(endpoints[i], {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: 'data=' + encodeURIComponent(query),
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (res) {
          clearTimeout(timer);
          if (!res.ok) throw new Error('overpass');
          return res.json();
        })
        .then(function (data) {
          var buckets = { cafe: [], food: [], shop: [] };
          var seen = {};
          (data.elements || []).forEach(function (el) {
            if (el.lat == null || el.lon == null) return;
            var tags = el.tags || {};
            var kind = classifyOsm(tags);
            if (!kind) return;
            var name = tags.name || tags['name:ko'];
            if (!name) return;
            var sk = name + '|' + el.lat.toFixed(4) + ',' + el.lon.toFixed(4);
            if (seen[sk]) return;
            seen[sk] = true;
            var distanceKm = Math.round(haversineKm(lat, lng, el.lat, el.lon) * 100) / 100;
            buckets[kind].push({
              name: name,
              address: '',
              lat: el.lat,
              lng: el.lon,
              kind: kind,
              source: 'osm',
              image: '',
              distanceKm: distanceKm
            });
          });
          ['cafe', 'food', 'shop'].forEach(function (k) {
            buckets[k].sort(function (a, b) { return a.distanceKm - b.distanceKm; });
            buckets[k] = buckets[k].slice(0, limit || 6);
          });
          var out = {
            cafe: buckets.cafe,
            food: buckets.food,
            shop: buckets.shop,
            source: 'osm'
          };
          lsSet(key, out);
          return out;
        })
        .catch(function () {
          clearTimeout(timer);
          return tryEndpoint(i + 1);
        });
    }

    return tryEndpoint(0);
  }

  function prefetchGeocode(query) {
    var q = String(query || '').trim();
    if (q.length < 2) return;
    geocode(q);
  }

  return {
    geocode: geocode,
    nearby: nearby,
    prefetchGeocode: prefetchGeocode,
    haversineKm: haversineKm,
    lsGet: lsGet,
    lsSet: lsSet
  };
})();
