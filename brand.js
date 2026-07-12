(function (global) {
  var uid = 0;

  function iconSvg(suffix) {
    var g = 'oasisIconGrad' + suffix;
    var s = 'oasisShine' + suffix;
    return '<svg class="brand-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs>' +
        '<linearGradient id="' + g + '" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">' +
          '<stop stop-color="#5eead4"/>' +
          '<stop offset="0.45" stop-color="#10b981"/>' +
          '<stop offset="1" stop-color="#047857"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + s + '" x1="10" y1="6" x2="26" y2="18" gradientUnits="userSpaceOnUse">' +
          '<stop stop-color="#ffffff" stop-opacity="0.45"/>' +
          '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect width="40" height="40" rx="11" fill="url(#' + g + ')"/>' +
      '<rect width="40" height="40" rx="11" fill="url(#' + s + ')"/>' +
      '<path d="M20 9.5c5.2 2.8 8.5 5.4 8.5 9.2 0 4.8-3.8 8.8-8.5 10.8-4.7-2-8.5-6-8.5-10.8 0-3.8 3.3-6.4 8.5-9.2z" fill="#ffffff" fill-opacity="0.18"/>' +
      '<path d="M20 11.5c4.1 2.2 6.8 4.4 6.8 7.4 0 3.8-3 7-6.8 8.6-3.8-1.6-6.8-4.8-6.8-8.6 0-3 2.7-5.2 6.8-7.4z" stroke="#ffffff" stroke-width="1.4" fill="none"/>' +
      '<path d="M13.5 21.2c2.2-2.4 4.2-3.4 6.5-3.4s4.3 1 6.5 3.4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="20" cy="15.2" r="2.2" fill="#ffffff"/>' +
    '</svg>';
  }

  function renderBrand(options) {
    var opts = options || {};
    var size = opts.size || 'md';
    var href = opts.href;
    var tagline = opts.tagline;
    var suffix = ++uid;
    var inner =
      '<span class="brand-icon-wrap">' + iconSvg(suffix) + '</span>' +
      '<span class="brand-wordmark">Oasi<span class="brand-five">5</span></span>';

    var lockupClass = 'brand-lockup brand-lockup-' + size;
    var html;

    if (href) {
      html = '<a href="' + href + '" class="' + lockupClass + '">' + inner + '</a>';
    } else {
      html = '<div class="' + lockupClass + '">' + inner + '</div>';
    }

    if (tagline) {
      html = '<div class="header-brand">' + html + '<p class="brand-tagline">' + tagline + '</p></div>';
    }

    return html;
  }

  function mount(selector, options) {
    var el = document.querySelector(selector);
    if (el) el.innerHTML = renderBrand(options);
  }

  global.Oasi5Brand = {
    render: renderBrand,
    mount: mount
  };
  global.FiveasisBrand = global.Oasi5Brand;
  global.OasisBrand = global.Oasi5Brand;
})(window);
