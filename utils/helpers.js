/* ============================================================
   DAR MAROC - UTILITAIRES PARTAGÉS (helpers.js)
   ============================================================ */
window.DarMarocUtils = (function () {
  'use strict';

  function escapeHTML(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getLang() {
    try {
      return localStorage.getItem('darmaroc-lang') || document.documentElement.lang || 'fr';
    } catch (e) {
      return 'fr';
    }
  }

  function formatPrice(value, currency) {
    const n = Number(value);
    if (isNaN(n)) return value;
    const c = currency || 'MAD';
    return n.toLocaleString('fr-FR') + ' ' + c;
  }

  function debounce(fn, wait) {
    let t;
    return function () {
      const ctx = this;
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 250);
    };
  }

  function truncate(str, n) {
    if (!str) return '';
    return str.length > n ? str.slice(0, n) + '…' : str;
  }

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* --- détection CMS actif (Firebase configuré) --- */
  function cmsEnabled() {
    try {
      var cfg = window.DARMAROC_CONFIG && window.DARMAROC_CONFIG.firebase;
      return !!(cfg && cfg.enabled && cfg.projectId);
    } catch (e) {
      return false;
    }
  }

  return {
    escapeHTML: escapeHTML,
    getLang: getLang,
    formatPrice: formatPrice,
    debounce: debounce,
    truncate: truncate,
    onReady: onReady,
    cmsEnabled: cmsEnabled
  };
})();
