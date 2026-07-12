var PlaceReviews = (function () {
  var STORAGE_KEY = 'oasi5-place-reviews';
  var OWNERSHIP_KEY = 'oasi5-review-ownership';
  var DEV_MODE_KEY = 'oasi5-dev-mode';
  var DEV_PIN = 'oasi5dev';
  var MAX_TEXT = 500;
  var MAX_AUTHOR = 20;

  function loadAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveAll(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function loadOwnership() {
    try {
      var raw = localStorage.getItem(OWNERSHIP_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveOwnership(data) {
    try {
      localStorage.setItem(OWNERSHIP_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function generateToken() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function isDeveloperMode() {
    return localStorage.getItem(DEV_MODE_KEY) === '1';
  }

  function enableDeveloperMode() {
    localStorage.setItem(DEV_MODE_KEY, '1');
  }

  function canDeleteReview(review) {
    if (!review) return false;
    if (isDeveloperMode()) return true;
    if (!review.ownerToken) return false;
    var ownership = loadOwnership();
    return ownership[review.id] === review.ownerToken;
  }

  function findReview(placeId, reviewId) {
    var all = loadAll();
    var list = all[String(placeId)] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === reviewId) return list[i];
    }
    return null;
  }

  function getReviews(placeId) {
    var all = loadAll();
    var list = all[String(placeId)] || [];
    return list.slice().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function addReview(placeId, payload) {
    var text = (payload.text || '').trim();
    if (!text) return false;

    var author = (payload.author || '방문자').trim().slice(0, MAX_AUTHOR) || '방문자';
    var rating = Math.min(5, Math.max(1, Number(payload.rating) || 5));
    var reviewId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    var ownerToken = generateToken();

    var all = loadAll();
    var key = String(placeId);
    if (!all[key]) all[key] = [];

    all[key].push({
      id: reviewId,
      author: author,
      text: text.slice(0, MAX_TEXT),
      rating: rating,
      ownerToken: ownerToken,
      createdAt: new Date().toISOString()
    });

    saveAll(all);

    var ownership = loadOwnership();
    ownership[reviewId] = ownerToken;
    saveOwnership(ownership);

    return true;
  }

  function deleteReview(placeId, reviewId) {
    var review = findReview(placeId, reviewId);
    if (!review || !canDeleteReview(review)) return false;

    var all = loadAll();
    var key = String(placeId);
    if (!all[key]) return false;
    var next = all[key].filter(function (r) { return r.id !== reviewId; });
    if (next.length === all[key].length) return false;
    if (next.length) all[key] = next;
    else delete all[key];
    saveAll(all);

    var ownership = loadOwnership();
    delete ownership[reviewId];
    saveOwnership(ownership);

    return true;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
    } catch (e) {
      return '';
    }
  }

  function renderStars(rating, interactive) {
    var html = '<span class="review-stars' + (interactive ? ' review-stars-input' : '') + '"';
    if (interactive) html += ' role="radiogroup" aria-label="별점"';
    html += '>';
    for (var i = 1; i <= 5; i++) {
      html += '<button type="button" class="review-star' + (i <= rating ? ' filled' : '') + '" data-value="' + i + '" aria-label="' + i + '점">';
      html += i <= rating ? '★' : '☆';
      html += '</button>';
    }
    html += '</span>';
    return html;
  }

  function averageRating(reviews) {
    if (!reviews.length) return 0;
    var sum = reviews.reduce(function (acc, r) { return acc + (r.rating || 5); }, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  function renderReviewItem(review) {
    var deleteBtn = canDeleteReview(review)
      ? '<button type="button" class="review-delete" data-review-id="' + escapeHtml(review.id) + '" aria-label="후기 삭제">삭제</button>'
      : '';

    return (
      '<li class="review-item" data-review-id="' + escapeHtml(review.id) + '">' +
        '<div class="review-item-head">' +
          '<strong class="review-author">' + escapeHtml(review.author) + '</strong>' +
          renderStars(review.rating || 5, false) +
          '<time class="review-date" datetime="' + escapeHtml(review.createdAt) + '">' + formatDate(review.createdAt) + '</time>' +
          deleteBtn +
        '</div>' +
        '<p class="review-text">' + escapeHtml(review.text) + '</p>' +
      '</li>'
    );
  }

  function renderListHtml(placeId) {
    var reviews = getReviews(placeId);
    if (!reviews.length) {
      return '<p class="review-empty">아직 작성된 방문 후기가 없습니다. 다녀오신 경험을 첫 번째로 남겨 보세요.</p>';
    }
    return '<ul class="review-list">' + reviews.map(renderReviewItem).join('') + '</ul>';
  }

  function renderSummary(placeId) {
    var reviews = getReviews(placeId);
    var count = reviews.length;
    if (!count) {
      return '<span class="review-summary-empty">후기 0개</span>';
    }
    var avg = averageRating(reviews);
    return (
      '<span class="review-summary">' +
        renderStars(Math.round(avg), false) +
        '<span class="review-summary-text">평균 ' + avg + ' · 후기 ' + count + '개</span>' +
      '</span>'
    );
  }

  function renderSection(placeId) {
    var devBadge = isDeveloperMode()
      ? '<span class="review-dev-badge" title="개발자 모드: 모든 후기 삭제 가능">개발자</span>'
      : '';

    return (
      '<section class="section place-reviews-section" id="place-reviews" data-place-id="' + placeId + '">' +
        '<div class="review-section-head">' +
          '<div>' +
            '<h2>방문 후기' + devBadge + '</h2>' +
            '<p class="section-note">다녀오신 분들이 남긴 이용 경험입니다. 후기는 이 기기(브라우저)에 저장되며, <strong>본인이 작성한 후기만</strong> 삭제할 수 있습니다.</p>' +
          '</div>' +
          '<div id="review-summary">' + renderSummary(placeId) + '</div>' +
        '</div>' +
        '<form class="review-form" id="review-form" autocomplete="off">' +
          '<div class="review-form-row">' +
            '<label class="review-label" for="review-author">닉네임</label>' +
            '<input type="text" id="review-author" class="review-input" maxlength="' + MAX_AUTHOR + '" placeholder="익명 가능 (미입력 시 방문자)" />' +
          '</div>' +
          '<div class="review-form-row">' +
            '<span class="review-label">별점</span>' +
            '<input type="hidden" id="review-rating" name="rating" value="5" />' +
            renderStars(5, true) +
          '</div>' +
          '<div class="review-form-row">' +
            '<label class="review-label" for="review-text">후기 내용</label>' +
            '<textarea id="review-text" class="review-textarea" rows="4" maxlength="' + MAX_TEXT + '" required placeholder="시설 이용 방법, 접근성, 직원 응대, 주변 환경 등 실제로 도움이 되는 경험을 적어 주세요."></textarea>' +
            '<span class="review-char-count"><span id="review-char-num">0</span> / ' + MAX_TEXT + '</span>' +
          '</div>' +
          '<button type="submit" class="btn primary review-submit">후기 등록</button>' +
        '</form>' +
        '<div id="review-list-wrap">' + renderListHtml(placeId) + '</div>' +
      '</section>'
    );
  }

  function refresh(placeId) {
    var summary = document.getElementById('review-summary');
    var listWrap = document.getElementById('review-list-wrap');
    if (summary) summary.innerHTML = renderSummary(placeId);
    if (listWrap) listWrap.innerHTML = renderListHtml(placeId);
  }

  function promptDeveloperMode(placeId) {
    var input = window.prompt('개발자 비밀번호를 입력하세요.');
    if (input === null) return;
    if (input !== DEV_PIN) {
      window.alert('비밀번호가 올바르지 않습니다.');
      return;
    }
    enableDeveloperMode();
    refresh(placeId);
    bindDeleteHandlers(placeId);
    var badgeHost = document.querySelector('#place-reviews .review-section-head h2');
    if (badgeHost && !badgeHost.querySelector('.review-dev-badge')) {
      badgeHost.insertAdjacentHTML('beforeend', '<span class="review-dev-badge" title="개발자 모드: 모든 후기 삭제 가능">개발자</span>');
    }
  }

  function bindDeveloperUnlock(section, placeId) {
    var title = section.querySelector('.review-section-head h2');
    if (!title || title.dataset.devUnlockBound === '1') return;
    title.dataset.devUnlockBound = '1';

    var clickCount = 0;
    var clickTimer = null;

    title.addEventListener('click', function () {
      if (isDeveloperMode()) return;
      clickCount += 1;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(function () {
        clickCount = 0;
      }, 1200);
      if (clickCount >= 5) {
        clickCount = 0;
        promptDeveloperMode(placeId);
      }
    });
  }

  function mount(placeId) {
    var section = document.getElementById('place-reviews');
    var form = document.getElementById('review-form');
    if (!section || !form || Number(section.dataset.placeId) !== placeId) return;

    var ratingInput = document.getElementById('review-rating');
    var textArea = document.getElementById('review-text');
    var charNum = document.getElementById('review-char-num');

    bindDeveloperUnlock(section, placeId);

    section.querySelectorAll('.review-stars-input .review-star').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = Number(btn.getAttribute('data-value'));
        ratingInput.value = String(val);
        section.querySelectorAll('.review-stars-input .review-star').forEach(function (star, idx) {
          star.classList.toggle('filled', idx < val);
          star.textContent = idx < val ? '★' : '☆';
        });
      });
    });

    if (textArea && charNum) {
      textArea.addEventListener('input', function () {
        charNum.textContent = String(textArea.value.length);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = addReview(placeId, {
        author: document.getElementById('review-author').value,
        rating: ratingInput.value,
        text: textArea.value
      });
      if (!ok) return;

      form.reset();
      ratingInput.value = '5';
      if (charNum) charNum.textContent = '0';
      section.querySelectorAll('.review-stars-input .review-star').forEach(function (star, idx) {
        star.classList.toggle('filled', idx < 5);
        star.textContent = idx < 5 ? '★' : '☆';
      });

      refresh(placeId);
      bindDeleteHandlers(placeId);
      var listWrap = document.getElementById('review-list-wrap');
      if (listWrap) {
        listWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    bindDeleteHandlers(placeId);
  }

  function bindDeleteHandlers(placeId) {
    var listWrap = document.getElementById('review-list-wrap');
    if (!listWrap) return;

    listWrap.querySelectorAll('.review-delete').forEach(function (btn) {
      btn.onclick = function () {
        var reviewId = btn.getAttribute('data-review-id');
        if (!reviewId) return;
        var review = findReview(placeId, reviewId);
        if (!canDeleteReview(review)) {
          window.alert('본인이 작성한 후기만 삭제할 수 있습니다.');
          return;
        }
        if (!window.confirm('이 후기를 삭제할까요?')) return;
        if (deleteReview(placeId, reviewId)) {
          refresh(placeId);
          bindDeleteHandlers(placeId);
        }
      };
    });
  }

  return {
    getReviews: getReviews,
    addReview: addReview,
    deleteReview: deleteReview,
    canDeleteReview: canDeleteReview,
    isDeveloperMode: isDeveloperMode,
    renderSection: renderSection,
    mount: mount
  };
})();
