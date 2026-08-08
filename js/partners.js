/* ============================================================
   DAR MAROC - RENDU DYNAMIQUE DES PARTENAIRES (partners.js)
   Génère la bande de logos défilants de la section Partenaires
   depuis le CMS (localStorage) ou les données statiques (data.js),
   synchronisées avec Supabase si configuré. Compatible 2 langues.
   ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'darmaroc-admin-data-v1';
  var track = document.getElementById('partnersTrack');
  if (!track) return;

  var Utils = window.DarMarocUtils || {};
  function esc(v) { return Utils.escapeHTML ? Utils.escapeHTML(v) : String(v == null ? '' : v); }

  function getData() {
    var list = [];
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.partners) && parsed.partners.length) {
          list = parsed.partners;
        }
      }
    } catch (e) { /* ignore */ }
    if (!list.length) {
      var staticData = window.DARMAROC_DATA || {};
      list = (staticData.partners || []).slice();
    }
    return list.slice().sort(function (a, b) {
      var ta = typeof a.delay === 'number' ? a.delay : 0;
      var tb = typeof b.delay === 'number' ? b.delay : 0;
      return ta - tb;
    });
  }

  function partnerHTML(p, lang) {
    var isAr = lang === 'ar';
    var fr = esc(p.fr || p.name || '');
    var ar = esc(p.ar || fr);
    var name = isAr ? ar : fr;
    return '<div class="partner-logo">' +
      '<i class="fas ' + esc(p.icon || 'fa-handshake') + '"></i>' +
      '<span data-fr="' + fr + '" data-ar="' + ar + '">' + name + '</span>' +
      '</div>';
  }

  function render(list) {
    var lang = (document.documentElement.lang || 'fr') === 'ar' ? 'ar' : 'fr';
    var partners = list || getData();
    if (!partners.length) return;
    var logos = partners.map(function (p) { return partnerHTML(p, lang); }).join('');
    track.innerHTML = logos + logos + logos;
  }

  render();

  /* Synchronisation Supabase : les partenaires de la base remplacent le cache. */
  if (window.DarMarocStore && window.DarMarocStore.hasBackend()) {
    window.DarMarocStore.fetchCollection('partners').then(function (items) {
      if (items && items.length) render(items);
    });
  }
})();
