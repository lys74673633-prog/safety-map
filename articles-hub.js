var ArticlesHub = (function () {
  var AUTO_REFRESH_MS = 30 * 60 * 1000;
  var autoRefreshTimer = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderRow(article) {
    var tags = article.tags.map(function (t) {
      return '<span class="hub-tag ' + escapeHtml(article.tagClass) + '">' + escapeHtml(t) + '</span>';
    }).join('');

    var sourceBadge = '';
    if (article.sourceType === 'cnn') {
      sourceBadge = '<span class="news-source-badge news-source-cnn">CNN</span>';
    } else if (article.sourceType === 'google') {
      sourceBadge = '<span class="news-source-badge news-source-google">Google</span>';
    } else if (article.sourceType === 'naver') {
      sourceBadge = '<span class="news-source-badge news-source-naver">Naver</span>';
    }

    var translatedNote = article.translated
      ? ' <span class="news-translated-badge">번역</span>'
      : '';

    var thumb = article.image
      ? '<div class="news-article-thumb"><img src="' + escapeHtml(article.image) + '" alt="" loading="lazy" decoding="async" /></div>'
      : '<div class="news-article-thumb news-article-thumb-empty" aria-hidden="true"><span>기사</span></div>';

    var openLabel = typeof NewsFeed !== 'undefined'
      ? NewsFeed.openLabel(article)
      : '원문 기사 보기 →';

    return (
      '<li class="news-article-row">' +
        '<a class="news-article-link" href="' + escapeHtml(article.url) + '" target="_blank" rel="noopener noreferrer">' +
          thumb +
          '<div class="news-article-body">' +
            '<div class="news-article-tags">' + tags + sourceBadge + translatedNote + '</div>' +
            '<h3 class="news-article-title">' + escapeHtml(article.title) + '</h3>' +
            '<p class="news-article-meta">' + escapeHtml(article.source) + ' · ' + escapeHtml(article.date) + '</p>' +
            '<p class="news-article-summary">' + escapeHtml(article.summary) + '</p>' +
            '<p class="news-article-related"><span class="news-article-related-label">관련 키워드</span> ' + escapeHtml(article.related) + '</p>' +
            '<span class="news-article-open">' + escapeHtml(openLabel) + '</span>' +
          '</div>' +
        '</a>' +
      '</li>'
    );
  }

  function renderArticles(articles, meta) {
    var updatedText = '';
    if (meta && typeof NewsFeed !== 'undefined') {
      if (meta.error) {
        updatedText = '최신 기사를 불러오지 못했습니다. 잠시 후 자동으로 다시 시도합니다.';
      } else if (meta.refreshing) {
        updatedText = '기사 자동 갱신 중…';
      } else if (meta.updatedAt) {
        updatedText = '마지막 갱신: ' + NewsFeed.formatUpdatedAt(meta.updatedAt);
      }
    }

    return (
      '<main class="app-view-inner hub-view">' +
        '<div class="hub-hero">' +
          '<h1 class="hub-page-title">' +
            '<span class="hub-page-brand">Oasi<span class="brand-five">5</span></span>' +
            '<span class="hub-page-en">Articles</span>' +
          '</h1>' +
        '</div>' +
        '<section class="hub-section">' +
          '<div class="hub-section-toolbar">' +
            '<div>' +
              '<h2>최근 보도</h2>' +
              '<p class="hub-section-note">네이버·Google·CNN 기사를 모아 자동으로 갱신합니다. CNN 등 영문 기사는 한국어로 번역합니다.</p>' +
            '</div>' +
            (updatedText ? '<span class="hub-updated-at" id="articles-updated">' + escapeHtml(updatedText) + '</span>' : '') +
          '</div>' +
          '<ul class="news-article-list" id="articles-list">' + articles.map(renderRow).join('') + '</ul>' +
        '</section>' +
      '</main>'
    );
  }

  function setRefreshing(el, refreshing) {
    var updated = el.querySelector('#articles-updated');
    if (!updated || typeof NewsFeed === 'undefined') return;
    if (refreshing) {
      updated.textContent = '기사 자동 갱신 중…';
    }
  }

  function applyResult(el, result) {
    var list = el.querySelector('#articles-list');
    var updated = el.querySelector('#articles-updated');
    if (list) {
      list.innerHTML = result.articles.map(renderRow).join('');
    } else {
      el.innerHTML = renderArticles(result.articles, result);
      return;
    }
    if (updated && typeof NewsFeed !== 'undefined') {
      if (result.error) {
        updated.textContent = '최신 기사를 불러오지 못했습니다. 잠시 후 자동으로 다시 시도합니다.';
      } else if (result.refreshing) {
        updated.textContent = '기사 자동 갱신 중…';
      } else if (result.updatedAt) {
        updated.textContent = '마지막 갱신: ' + NewsFeed.formatUpdatedAt(result.updatedAt);
      }
    }
  }

  function refreshLive(el) {
    if (typeof NewsFeed === 'undefined') return Promise.resolve();
    setRefreshing(el, true);
    return NewsFeed.refreshBackground().then(function (fresh) {
      if (fresh) applyResult(el, fresh);
      return fresh;
    });
  }

  function showArticles(el) {
    if (typeof NewsFeed === 'undefined') {
      el.innerHTML = renderArticles([], { error: true });
      return Promise.resolve();
    }

    if (!el.querySelector('#articles-list')) {
      el.innerHTML = renderArticles(NewsFeed.getCuratedPreview(), {
        updatedAt: Date.now(),
        refreshing: true
      });
    }

    return NewsFeed.loadArticles().then(function (result) {
      applyResult(el, result);
      if (result.fromCache) {
        return refreshLive(el);
      }
    });
  }

  function startAutoRefresh(el) {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(function () {
      refreshLive(el);
    }, AUTO_REFRESH_MS);
  }

  function mount() {
    var el = document.getElementById('view-articles');
    if (!el) return;

    showArticles(el);
    startAutoRefresh(el);
  }

  return { mount: mount, renderRow: renderRow };
})();
