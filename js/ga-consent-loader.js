/**
 * Google Analytics 4 + Consent Mode v2 (Google Tag)
 * optienergy.es — Measurement ID: G-RSL3XMXCFC
 *
 * Orden requerido: este script ANTES que cualquier uso de gtag.
 * - Establece consentimiento por defecto DENEGADO (RGPD / ePrivacy).
 * - Carga gtag.js de forma asíncrona y ejecuta gtag('config') al terminar.
 *
 * No bloquea el análisis del HTML (script sin defer en <head> recomendado).
 */
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  /* Consent Mode v2 — valores por defecto (denied) hasta actualización vía cookies.js */
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-RSL3XMXCFC';
  script.onload = function () {
    gtag('js', new Date());
    gtag('config', 'G-RSL3XMXCFC', {
      anonymize_ip: true,
      send_page_view: true
    });
    try {
      window.dispatchEvent(new CustomEvent('optienergy:gtag-ready'));
    } catch (e) {}
  };
  script.onerror = function () {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[Optienergy] No se pudo cargar gtag.js');
    }
  };
  document.head.appendChild(script);
})();
