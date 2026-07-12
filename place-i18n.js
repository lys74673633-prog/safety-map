var PlaceI18n = (function () {
  var CACHE_KEY = 'oasi5-place-text-en-v1';
  var memory = {};
  var inflight = null;

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

  function t(text) {
    var s = String(text || '');
    if (!s) return s;
    if (!isEn() || !needsHangul(s)) return s;
    return memory[s] || s;
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
      if (!s || !needsHangul(s) || memory[s] || seen[s]) return;
      seen[s] = true;
      out.push(s);
    });
    return out;
  }

  function translateMissing(texts) {
    var pending = uniquePending(texts);
    if (!pending.length) return Promise.resolve();

    var chunks = [];
    var i;
    for (i = 0; i < pending.length; i += 12) {
      chunks.push(pending.slice(i, i + 12));
    }

    var chain = Promise.resolve();
    chunks.forEach(function (chunk) {
      chain = chain.then(function () {
        return translateBatch(chunk).then(function (parts) {
          chunk.forEach(function (src, idx) {
            var en = (parts[idx] && String(parts[idx]).trim()) || src;
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
        if (p.canDo && p.canDo.length) {
          p.canDo.forEach(function (line) { list.push(line); });
        }
        if (p.howToUse && p.howToUse.length) {
          p.howToUse.forEach(function (line) { list.push(line); });
        }
      });
    }
    if (typeof DisabilityAccess !== 'undefined' && DisabilityAccess.getNameTexts) {
      list = list.concat(DisabilityAccess.getNameTexts());
    }
    return list;
  }

  function prepareAll(extraTexts) {
    if (!isEn()) return Promise.resolve();
    loadCache();
    var texts = collectPlaceTexts().concat(extraTexts || []);
    if (inflight) {
      return inflight.then(function () { return translateMissing(texts); });
    }
    inflight = translateMissing(texts).then(function () {
      inflight = null;
    }).catch(function () {
      inflight = null;
    });
    return inflight;
  }

  function prepareAnd(callback) {
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
