/**
 * Optienergy — Detección y persistencia de fuente de tráfico + integración GA4
 * Sitio estático (sin backend). Requiere: ga-consent-loader.js, cookies.js (consentimiento).
 *
 * - Captura UTMs, gclid, referrer (prioridad: UTM > gclid > referrer > directo)
 * - Clasificación: organic | social | cpc | referral | direct | email
 * - Persistencia SOLO en la primera visita (no sobrescribe): localStorage + cookie 30 días
 * - Evento GA4: traffic_source_detected (tras consentimiento analytics)
 * - Inyecta <input type="hidden" name="source|medium|campaign"> en todos los formularios
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'optienergy_traffic';
  var COOKIE_NAME = 'optienergy_traffic';
  var COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; /* 30 días */
  var CONSENT_KEY = 'optienergy_cookie_consent';
  var HOST_SELF = (typeof location !== 'undefined' && location.hostname) ? location.hostname.replace(/^www\./, '') : '';

  /* ——— Utilidades cookie ——— */
  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function setCookie(name, value, maxAgeSec) {
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      name +
      '=' +
      encodeURIComponent(value) +
      '; path=/; max-age=' +
      maxAgeSec +
      '; SameSite=Lax' +
      secure;
  }

  /* ——— Lectura / escritura almacenamiento atribución ——— */
  function parseTrafficJson(str) {
    try {
      var o = JSON.parse(str);
      if (o && typeof o.source === 'string') return o;
    } catch (e) {}
    return null;
  }

  function getStoredTraffic() {
    try {
      var ls = localStorage.getItem(STORAGE_KEY);
      if (ls) {
        var a = parseTrafficJson(ls);
        if (a) return a;
      }
    } catch (e) {}
    var c = getCookie(COOKIE_NAME);
    if (c) {
      var b = parseTrafficJson(c);
      if (b) return b;
    }
    return null;
  }

  function setStoredTraffic(data) {
    var str = JSON.stringify(data);
    try {
      localStorage.setItem(STORAGE_KEY, str);
    } catch (e) {}
    setCookie(COOKIE_NAME, str, COOKIE_MAX_AGE_SEC);
  }

  /* ——— Referrer interno (no cambiar atribución al navegar dentro del sitio) ——— */
  function isInternalHostname(hostname) {
    if (!hostname || !HOST_SELF) return false;
    var h = hostname.replace(/^www\./, '').toLowerCase();
    return h === HOST_SELF || h.indexOf('optienergy.es') !== -1;
  }

  function parseQuery() {
    var params = {};
    var q = window.location.search;
    if (!q || q.length < 2) return params;
    q.substring(1).split('&').forEach(function (pair) {
      var i = pair.indexOf('=');
      var k = i >= 0 ? pair.substring(0, i) : pair;
      var v = i >= 0 ? pair.substring(i + 1) : '';
      if (k) {
        try {
          params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
        } catch (e) {
          params[k] = v;
        }
      }
    });
    return params;
  }

  /** Clasificación de canal a partir de UTMs */
  function channelFromUtm(medium, source) {
    var m = (medium || '').toLowerCase();
    if (m === 'cpc' || m === 'ppc' || m === 'paid' || m === 'paidsearch') return 'cpc';
    if (m === 'social' || m === 'social-network' || m === 'social-media') return 'social';
    if (m === 'email' || m === 'e-mail') return 'email';
    if (m === 'referral') return 'referral';
    if (m === 'organic' || m === 'natural') return 'organic';
    if (source && /facebook|instagram|linkedin|twitter|tiktok|youtube/i.test(source)) return 'social';
    return 'organic';
  }

  function detectTraffic() {
    var params = parseQuery();

    /* 1) UTMs (prioridad máxima) */
    if (params.utm_source) {
      return {
        source: params.utm_source,
        medium: params.utm_medium || '(not set)',
        campaign: params.utm_campaign || '(not set)',
        channel: channelFromUtm(params.utm_medium, params.utm_source)
      };
    }

    /* 2) Google Ads (gclid) */
    if (params.gclid) {
      return {
        source: 'google',
        medium: 'cpc',
        campaign: params.utm_campaign || '(not set)',
        channel: 'cpc'
      };
    }

    /* 3) Referrer */
    var ref = document.referrer || '';
    if (ref) {
      try {
        var u = new URL(ref);
        var host = u.hostname.toLowerCase();
        if (isInternalHostname(host)) {
          /* Primera carga sin datos: tráfico interno → directo */
          return {
            source: '(direct)',
            medium: '(none)',
            campaign: '(not set)',
            channel: 'direct'
          };
        }

        if (/google\.(com|es|cat|de|fr|it|co\.uk|nl|be)/i.test(host)) {
          return {
            source: 'google',
            medium: 'organic',
            campaign: '(not set)',
            channel: 'organic'
          };
        }
        if (/bing\.com$/i.test(host)) {
          return {
            source: 'bing',
            medium: 'organic',
            campaign: '(not set)',
            channel: 'organic'
          };
        }

        var socialMap = [
          ['facebook.com', 'facebook'],
          ['instagram.com', 'instagram'],
          ['linkedin.com', 'linkedin'],
          ['twitter.com', 'twitter'],
          ['t.co', 'twitter'],
          ['youtube.com', 'youtube'],
          ['tiktok.com', 'tiktok'],
          ['pinterest.com', 'pinterest']
        ];
        for (var s = 0; s < socialMap.length; s++) {
          if (host.indexOf(socialMap[s][0]) !== -1) {
            return {
              source: socialMap[s][1],
              medium: 'social',
              campaign: '(not set)',
              channel: 'social'
            };
          }
        }

        return {
          source: host,
          medium: 'referral',
          campaign: '(not set)',
          channel: 'referral'
        };
      } catch (e) {}
    }

    /* 4) Directo */
    return {
      source: '(direct)',
      medium: '(none)',
      campaign: '(not set)',
      channel: 'direct'
    };
  }

  function ensureFirstTouchTraffic() {
    if (getStoredTraffic()) return;
    var t = detectTraffic();
    setStoredTraffic(t);
    if (typeof console !== 'undefined' && console.log) {
      console.log('[Optienergy] Traffic source (first touch):', t);
    }
  }

  /* ——— Consentimiento analytics (localStorage optienergy_cookie_consent) ——— */
  function hasAnalyticsConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return false;
      var c = JSON.parse(raw);
      return !!(c && c.analytics === true);
    } catch (e) {
      return false;
    }
  }

  var trafficEventSent = false;

  function sendTrafficSourceEvent() {
    if (trafficEventSent) return;
    if (typeof gtag !== 'function') return;
    if (!hasAnalyticsConsent()) return;

    var data = getStoredTraffic();
    if (!data) return;

    gtag('event', 'traffic_source_detected', {
      traffic_source: data.source,
      traffic_medium: data.medium,
      traffic_campaign: data.campaign,
      traffic_channel: data.channel || ''
    });
    trafficEventSent = true;
    if (typeof console !== 'undefined' && console.log) {
      console.log('[Optienergy] GA4 event traffic_source_detected:', {
        traffic_source: data.source,
        traffic_medium: data.medium,
        traffic_campaign: data.campaign,
        traffic_channel: data.channel
      });
    }
  }

  /* ——— Inyección de campos ocultos en formularios ——— */
  function injectFormHiddenFields() {
    var data = getStoredTraffic();
    if (!data) return;

    function addHidden(form, name, value) {
      if (form.querySelector('input[name="' + name + '"]')) return;
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value == null ? '' : String(value);
      form.appendChild(input);
    }

    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) {
      var f = forms[i];
      addHidden(f, 'source', data.source);
      addHidden(f, 'medium', data.medium);
      addHidden(f, 'campaign', data.campaign);
    }
  }

  function run() {
    ensureFirstTouchTraffic();
    injectFormHiddenFields();

    if (hasAnalyticsConsent()) {
      sendTrafficSourceEvent();
    } else {
      window.addEventListener(
        'optienergy-consent-updated',
        function () {
          injectFormHiddenFields();
          sendTrafficSourceEvent();
        },
        { once: false }
      );
    }

    /* MutationObserver: formularios añadidos después (p. ej. widgets) */
    if (typeof MutationObserver !== 'undefined' && document.body) {
      var obs = new MutationObserver(function () {
        injectFormHiddenFields();
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  /* API mínima para depuración / tests */
  window.OptienergyTracking = {
    getStoredTraffic: getStoredTraffic,
    refreshFormFields: injectFormHiddenFields,
    sendTrafficSourceEvent: sendTrafficSourceEvent
  };
})();
