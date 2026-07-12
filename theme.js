(function (global) {
  var STORAGE_KEY = 'oasi5-theme';

  function getTheme() {
    var theme = document.documentElement.getAttribute('data-theme');
    return theme === 'light' ? 'light' : 'dark';
  }

  function updateMeta(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'light' ? '#f4f6f9' : '#0a0e14');
    }
  }

  function updateToggleUI(theme) {
    document.querySelectorAll('.theme-switch-btn').forEach(function (btn) {
      var active = btn.getAttribute('data-theme') === theme;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function apply(theme) {
    if (theme !== 'light' && theme !== 'dark') theme = 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateMeta(theme);
    updateToggleUI(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }

  function refreshLabels() {
    document.querySelectorAll('.theme-switch-btn').forEach(function (btn) {
      var theme = btn.getAttribute('data-theme');
      if (theme === 'light') btn.textContent = (global.I18n && I18n.t('theme.light')) || '낮';
      else if (theme === 'dark') btn.textContent = (global.I18n && I18n.t('theme.dark')) || '밤';
    });
    var group = document.getElementById('theme-switch');
    if (group) {
      group.setAttribute('aria-label', (global.I18n && I18n.t('theme.group')) || '테마 선택');
    }
  }

  function mountToggle(container) {
    if (!container || container.dataset.mounted) return;
    container.dataset.mounted = '1';
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', (global.I18n && I18n.t('theme.group')) || '테마 선택');
    var light = (global.I18n && I18n.t('theme.light')) || '낮';
    var dark = (global.I18n && I18n.t('theme.dark')) || '밤';
    container.innerHTML =
      '<button type="button" class="theme-switch-btn" data-theme="light" aria-pressed="false">' + light + '</button>' +
      '<button type="button" class="theme-switch-btn" data-theme="dark" aria-pressed="false">' + dark + '</button>';

    container.addEventListener('click', function (e) {
      var btn = e.target.closest('.theme-switch-btn');
      if (!btn) return;
      apply(btn.getAttribute('data-theme'));
    });

    updateToggleUI(getTheme());
  }

  function init() {
    var stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}

    if (stored !== 'light' && stored !== 'dark') {
      stored = document.documentElement.getAttribute('data-theme') || 'dark';
    }

    apply(stored);
    mountToggle(document.getElementById('theme-switch'));
  }

  global.ThemeManager = {
    init: init,
    apply: apply,
    get: getTheme,
    refreshLabels: refreshLabels
  };
})(window);
