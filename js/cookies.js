/**
 * Banner de cookies — LSSI-CE / RGPD + Google Consent Mode v2
 * Actualiza gtag('consent', 'update', …) al aceptar o guardar preferencias.
 * Si no existe #cookie-banner en la página, inserta un banner mínimo (“Usamos cookies para analytics”).
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'optienergy_cookie_consent';
  var BANNER_ID = 'cookie-banner';
  var PREFS_ID = 'cookie-prefs';

  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (e) {}
  }

  /**
   * Sincroniza el estado de consentimiento con Google Tag (Consent Mode v2).
   * Debe llamarse después de que gtag exista (ga-consent-loader.js).
   */
  function applyConsentToGtag(consent) {
    if (typeof gtag !== 'function') return;
    var analytics = !!(consent && consent.analytics);
    var marketing = !!(consent && consent.marketing);
    gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: marketing ? 'granted' : 'denied',
      ad_user_data: marketing ? 'granted' : 'denied',
      ad_personalization: marketing ? 'granted' : 'denied'
    });
    try {
      window.dispatchEvent(
        new CustomEvent('optienergy-consent-updated', { detail: { consent: consent } })
      );
    } catch (e) {}
  }

  function policyCookiesHref() {
    var path = location.pathname || '';
    if (path.indexOf('/ca/') === 0) return '/ca/legal/politica-cookies.html';
    if (path.indexOf('/es/') === 0) return '/es/legal/politica-cookies.html';
    return '/es/legal/politica-cookies.html';
  }

  /** Banner mínimo si la página no incluye el bloque HTML completo */
  function ensureMinimalBanner() {
    if (document.getElementById(BANNER_ID)) return;
    var href = policyCookiesHref();
    var wrap = document.createElement('div');
    wrap.className = 'cookie-banner';
    wrap.id = BANNER_ID;
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-labelledby', 'cookie-banner-title');
    wrap.setAttribute('aria-describedby', 'cookie-banner-desc');
    wrap.setAttribute('hidden', '');
    wrap.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#0f172a;color:#e2e8f0;padding:12px 16px;box-shadow:0 -4px 20px rgba(0,0,0,.35);font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.5;';
    wrap.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;max-width:960px;margin:0 auto;">' +
      '<div style="flex:1;min-width:200px;">' +
      '<strong id="cookie-banner-title" style="display:block;margin-bottom:4px;">Cookies</strong>' +
      '<span id="cookie-banner-desc">Usamos cookies para analytics. <a href="' +
      href +
      '" style="color:#4ade80;">Política de cookies</a>.</span>' +
      '</div>' +
      '<div>' +
      '<button type="button" id="cookie-accept" aria-label="Aceptar cookies" style="background:#22c55e;color:#052e16;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;">Aceptar</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(wrap);
  }

  function showBanner() {
    var banner = document.getElementById(BANNER_ID);
    var prefs = document.getElementById(PREFS_ID);
    if (banner) {
      banner.removeAttribute('hidden');
      if (prefs) prefs.setAttribute('hidden', '');
    }
  }

  function hideBanner() {
    var banner = document.getElementById(BANNER_ID);
    if (banner) banner.setAttribute('hidden', '');
  }

  function acceptAll() {
    var consent = {
      essential: true,
      analytics: true,
      marketing: true,
      date: new Date().toISOString()
    };
    setConsent(consent);
    applyConsentToGtag(consent);
    hideBanner();
  }

  function rejectNonEssential() {
    var consent = {
      essential: true,
      analytics: false,
      marketing: false,
      date: new Date().toISOString()
    };
    setConsent(consent);
    applyConsentToGtag(consent);
    hideBanner();
  }

  function savePrefs() {
    var analytics = document.getElementById('cookie-analytics');
    var marketing = document.getElementById('cookie-marketing');
    var consent = {
      essential: true,
      analytics: analytics ? analytics.checked : false,
      marketing: marketing ? marketing.checked : false,
      date: new Date().toISOString()
    };
    setConsent(consent);
    applyConsentToGtag(consent);
    hideBanner();
    var prefs = document.getElementById(PREFS_ID);
    if (prefs) prefs.setAttribute('hidden', '');
  }

  function openPrefs() {
    var prefs = document.getElementById(PREFS_ID);
    var consent = getConsent();
    if (prefs) {
      prefs.removeAttribute('hidden');
      var analytics = document.getElementById('cookie-analytics');
      var marketing = document.getElementById('cookie-marketing');
      if (analytics) analytics.checked = consent && consent.analytics;
      if (marketing) marketing.checked = consent && consent.marketing;
    }
  }

  function init() {
    ensureMinimalBanner();

    var consent = getConsent();
    if (consent && consent.date) {
      applyConsentToGtag(consent);
      hideBanner();
      return;
    }

    showBanner();

    var accept = document.getElementById('cookie-accept');
    var reject = document.getElementById('cookie-reject');
    var config = document.getElementById('cookie-config');
    var savePrefsBtn = document.getElementById('cookie-save-prefs');

    if (accept) accept.addEventListener('click', acceptAll);
    if (reject) reject.addEventListener('click', rejectNonEssential);
    if (config) config.addEventListener('click', openPrefs);
    if (savePrefsBtn) savePrefsBtn.addEventListener('click', savePrefs);

    var footerConfig = document.getElementById('footer-cookie-config');
    if (footerConfig) {
      footerConfig.addEventListener('click', function (e) {
        e.preventDefault();
        showBanner();
        openPrefs();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
