var KricMobility = (function () {
  var API = '/api/kric/station-mobility';

  var ELVT_LABELS = {
    EV: '엘리베이터',
    ES: '에스컬레이터',
    WL: '휠체어리프트',
    EL: '휠체어리프트'
  };

  var FACILITY_LABELS = {
    disabledToilet: '장애인 화장실',
    nursingRoom: '수유실',
    wheelchairCharge: '휠체어 충전',
    elevator: '엘리베이터',
    wheelchairLift: '휠체어 리프트'
  };

  function fetchStationMobility(stationRef, options) {
    if (!stationRef) return Promise.resolve(null);

    var qs = [
      'rail=' + encodeURIComponent(stationRef.railOprIsttCd || ''),
      'ln=' + encodeURIComponent(stationRef.lnCd || ''),
      'stin=' + encodeURIComponent(stationRef.stinCd || ''),
      'name=' + encodeURIComponent(stationRef.name || stationRef.stinNm || '')
    ];

    if (options && options.nextStinCd) {
      qs.push('nextStin=' + encodeURIComponent(options.nextStinCd));
    }
    if (options && options.prevStinCd) {
      qs.push('prevStin=' + encodeURIComponent(options.prevStinCd));
    }
    if (options && options.transferLn) {
      qs.push('transferLn=' + encodeURIComponent(options.transferLn));
    }
    if (options && options.transferNextStin) {
      qs.push('transferNext=' + encodeURIComponent(options.transferNextStin));
    }

    return fetch(API + '?' + qs.join('&'))
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error && !data.fallback) return null;
        return data;
      })
      .catch(function () { return null; });
  }

  function resolveStationRef(step) {
    if (!step || typeof SubwayStations === 'undefined') return null;
    if (step.stationRef) return step.stationRef;
    return SubwayStations.findOne(step.from || step.stationName, step.line);
  }

  function collectSubwayContexts(steps) {
    var contexts = [];
    var subwaySteps = (steps || []).filter(function (s) { return s.type === 'subway'; });

    subwaySteps.forEach(function (step, idx) {
      var ref = resolveStationRef(step);
      if (!ref) return;

      var prevSub = idx > 0 ? subwaySteps[idx - 1] : null;
      var nextSub = idx < subwaySteps.length - 1 ? subwaySteps[idx + 1] : null;
      var isTransfer = prevSub && normalizeName(prevSub.to) === normalizeName(step.from);

      contexts.push({
        stepIndex: (steps || []).indexOf(step),
        role: 'board',
        stationName: step.from,
        line: step.line,
        ref: ref,
        nextStinCd: step.endId || (step.stations && step.stations[1] && step.stations[1].id) || null,
        transfer: isTransfer,
        prevLine: prevSub ? prevSub.line : null,
        prevRef: prevSub ? resolveStationRef(prevSub) : null
      });

      var alightRef = SubwayStations.findOne(step.to, step.line) || ref;
      contexts.push({
        stepIndex: (steps || []).indexOf(step),
        role: 'alight',
        stationName: step.to,
        line: step.line,
        ref: alightRef,
        nextStinCd: null
      });
    });

    var seen = {};
    return contexts.filter(function (ctx) {
      var key = ctx.role + '|' + ctx.stationName + '|' + (ctx.ref.lnCd || '');
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function normalizeName(n) {
    return typeof SubwayStations !== 'undefined'
      ? SubwayStations.normalize(n)
      : String(n || '').replace(/역$/g, '');
  }

  function enrichRouteSteps(steps) {
    var contexts = collectSubwayContexts(steps);
    if (!contexts.length) return Promise.resolve({ steps: steps, stations: [] });

    return Promise.all(contexts.map(function (ctx) {
      var opts = {};
      if (ctx.role === 'board' && ctx.nextStinCd) opts.nextStinCd = ctx.nextStinCd;
      if (ctx.transfer && ctx.prevRef) {
        opts.prevStinCd = ctx.prevRef.stinCd;
        opts.transferLn = ctx.ref.lnCd;
        opts.transferNextStin = ctx.nextStinCd;
      }
      return fetchStationMobility(Object.assign({ name: ctx.stationName }, ctx.ref), opts)
        .then(function (data) {
          return { context: ctx, data: data };
        });
    })).then(function (results) {
      var stationMap = {};
      results.forEach(function (row) {
        if (!row.data) return;
        var key = row.context.stationName + '|' + row.context.ref.lnCd;
        stationMap[key] = {
          name: row.context.stationName,
          line: row.context.line,
          ref: row.context.ref,
          role: row.context.role,
          data: row.data
        };
      });

      var enriched = (steps || []).map(function (step) {
        if (step.type !== 'subway') return step;
        var ref = resolveStationRef(step);
        var key = step.from + '|' + (ref && ref.lnCd);
        var mobility = stationMap[key];
        if (!mobility) return step;
        return Object.assign({}, step, {
          mobility: mobility.data,
          mobilityStation: mobility.data.stationName || step.from
        });
      });

      return {
        steps: enriched,
        stations: Object.keys(stationMap).map(function (k) { return stationMap[k]; })
      };
    });
  }

  function elvtLabel(code) {
    return ELVT_LABELS[code] || code || '승강기';
  }

  function renderGateList(gates) {
    if (!gates || !gates.length) {
      return '<p class="kric-empty">출구별 승강기 정보가 없습니다.</p>';
    }
    return (
      '<ul class="kric-gate-list">' +
        gates.map(function (g) {
          var tags = [];
          if (g.elevator) tags.push('<span class="kric-tag kric-tag-ev">엘리베이터</span>');
          if (g.escalator) tags.push('<span class="kric-tag kric-tag-es">에스컬레이터</span>');
          if (g.wheelchairLift) tags.push('<span class="kric-tag kric-tag-wl">휠체어리프트</span>');
          if (!tags.length) tags.push('<span class="kric-tag kric-tag-none">승강기 없음</span>');
          return (
            '<li class="kric-gate-item">' +
              '<strong>' + escapeHtml(g.exitNo || g.gateNo || '출구') + '</strong>' +
              '<span class="kric-gate-tags">' + tags.join('') + '</span>' +
            '</li>'
          );
        }).join('') +
      '</ul>'
    );
  }

  function renderMovementList(movements) {
    if (!movements || !movements.length) {
      return '<p class="kric-empty">역사 내 이동 동선 정보가 없습니다.</p>';
    }
    return (
      '<ol class="kric-move-list">' +
        movements.map(function (m, i) {
          return (
            '<li class="kric-move-item">' +
              '<span class="kric-move-order">' + (i + 1) + '</span>' +
              '<div class="kric-move-body">' +
                '<strong>' + escapeHtml(m.from || m.stMovePath || '') + ' → ' + escapeHtml(m.to || m.edMovePath || '') + '</strong>' +
                (m.detail ? '<p>' + escapeHtml(m.detail) + '</p>' : '') +
                (m.elevatorType ? '<span class="kric-tag kric-tag-ev">' + escapeHtml(elvtLabel(m.elevatorType)) + '</span>' : '') +
              '</div>' +
            '</li>'
          );
        }).join('') +
      '</ol>'
    );
  }

  function renderFacilityList(facilities) {
    if (!facilities || !facilities.length) return '';
    return (
      '<ul class="kric-facility-list">' +
        facilities.map(function (f) {
          return (
            '<li><span class="kric-facility-icon" aria-hidden="true">♿</span> ' +
              escapeHtml(f.label || f.type || '') +
              (f.location ? ' · ' + escapeHtml(f.location) : '') +
            '</li>'
          );
        }).join('') +
      '</ul>'
    );
  }

  function renderStationPanel(station) {
    if (!station || !station.data) return '';
    var d = station.data;

    return (
      '<article class="kric-station-card">' +
        '<header class="kric-station-head">' +
          '<h4>' + escapeHtml(d.stationName || station.name) + '</h4>' +
          '<span class="kric-station-line">' + escapeHtml(station.line || d.lineName || '') + '</span>' +
          (d.source === 'fallback' ? '<span class="kric-badge-sample">샘플</span>' : '') +
        '</header>' +
        '<div class="kric-station-section">' +
          '<h5>출구별 승강기·리프트</h5>' +
          renderGateList(d.gates) +
        '</div>' +
        (d.movement && d.movement.length ? (
          '<div class="kric-station-section">' +
            '<h5>교통약자 이동경로</h5>' +
            renderMovementList(d.movement) +
          '</div>'
        ) : '') +
        (d.transfer && d.transfer.length ? (
          '<div class="kric-station-section">' +
            '<h5>환승 이동경로</h5>' +
            renderMovementList(d.transfer) +
          '</div>'
        ) : '') +
        (d.facilities && d.facilities.length ? (
          '<div class="kric-station-section">' +
            '<h5>편의·안전시설</h5>' +
            renderFacilityList(d.facilities) +
          '</div>'
        ) : '') +
      '</article>'
    );
  }

  function renderMobilitySection(stations) {
    if (!stations || !stations.length) return '';

    var unique = [];
    var seen = {};
    stations.forEach(function (s) {
      var key = s.name + '|' + (s.ref && s.ref.lnCd);
      if (seen[key] || !s.data) return;
      seen[key] = true;
      unique.push(s);
    });

    if (!unique.length) return '';

    return (
      '<section class="transit-kric-section hub-section">' +
        '<div class="transit-kric-head">' +
          '<h3>역사 교통약자 안내</h3>' +
          '<p class="hub-section-note">카카오맵 교통약자정보와 동일한 <strong>철도산업정보센터(KRIC)</strong> 공공데이터를 Oasi5에 맞게 표시합니다. 출구·엘리베이터·역사 내 이동 동선을 확인하세요.</p>' +
        '</div>' +
        '<div class="kric-station-grid">' +
          unique.map(renderStationPanel).join('') +
        '</div>' +
      '</section>'
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    fetchStationMobility: fetchStationMobility,
    enrichRouteSteps: enrichRouteSteps,
    collectSubwayContexts: collectSubwayContexts,
    renderMobilitySection: renderMobilitySection,
    renderStationPanel: renderStationPanel,
    elvtLabel: elvtLabel
  };
})();
