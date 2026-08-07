/* ============================================================
   DAR MAROC - RENDU DYNAMIQUE DES SERVICES (services.js)
   Génère la grille de services depuis le CMS (localStorage)
   ou les données statiques (data.js). Compatible 3 langues.
   ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'darmaroc-admin-data-v1';
  var grid = document.getElementById('servicesGrid');
  if (!grid) return;

  var Utils = window.DarMarocUtils || {};
  function esc(v) { return Utils.escapeHTML ? Utils.escapeHTML(v) : String(v == null ? '' : v); }

  function getData() {
    var list = [];
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.services) && parsed.services.length) {
          list = parsed.services;
        }
      }
    } catch (e) { /* ignore */ }
    if (!list.length) {
      var staticData = window.DARMAROC_DATA || {};
      list = (staticData.services || []).slice();
    }
    return list.slice().sort(function (a, b) {
      var ta = a.createdAt || '', tb = b.createdAt || '';
      if (ta && tb) return ta < tb ? 1 : ta > tb ? -1 : 0;
      if (ta) return -1;
      if (tb) return 1;
      return 0;
    });
  }

  function getLang() {
    try { return localStorage.getItem('darmaroc-lang') || document.documentElement.lang || 'fr'; }
    catch (e) { return 'fr'; }
  }

  function getFilter() {
    try { return new URLSearchParams(window.location.search).get('filter') || ''; }
    catch (e) { return ''; }
  }

  function cardHTML(s, lang, filter) {
    var fr = esc(s.fr || s.name || '');
    var ar = esc(s.ar || fr);
    var desc = esc(s.desc || s.text || '');
    var descAr = esc(s.descAr || desc);
    var href = esc(s.href || 'services.html');
    var img = esc(s.img || 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?fm=webp&w=600&q=80');
    var alt = esc(s.alt || (lang === 'ar' ? ar : fr));
    var icon = esc(s.icon || 'fa-wrench');
    var delay = typeof s.delay === 'number' ? s.delay : 0;

    if (filter) {
      var match = false;
      if (s.cat === filter) match = true;
      if (s.tags && s.tags.indexOf(filter) !== -1) match = true;
      if (!match && fr.toLowerCase().indexOf(filter.toLowerCase()) !== -1) match = true;
      if (!match) return '';
    }

    return '<a href="' + href + '" class="service-card" data-aos="fade-up" data-aos-delay="' + delay + '">' +
      '<img class="service-card-img" loading="lazy" decoding="async" alt="' + alt + '" src="' + img + '">' +
      '<div class="service-icon"><i class="fas ' + icon + '"></i></div>' +
      '<h3 data-fr="' + fr + '" data-ar="' + ar + '">' + fr + '</h3>' +
      '<p data-fr="' + desc + '" data-ar="' + descAr + '">' + desc + '</p>' +
      '</a>';
  }

  function render(list) {
    var lang = getLang();
    var filter = getFilter();
    var services = list || getData();
    var html = services.map(function (s) { return cardHTML(s, lang, filter); }).join('');
    grid.innerHTML = html;

    var first = grid.querySelector('.service-card');
    if (first) first.classList.add('glow-card');

    var langEl = document.querySelector('[data-lang="' + lang + '"]');
    if (langEl) langEl.classList.add('active');

    if (window.AOS) {
      try { AOS.refreshHard(); } catch (e) { try { AOS.refresh(); } catch (e2) {} }
    }
  }

  render();

  /* Synchronisation Supabase : les services de la base remplacent le cache. */
  if (window.DarMarocStore && window.DarMarocStore.hasBackend()) {
    window.DarMarocStore.fetchCollection('services').then(function (items) {
      if (items && items.length) render(items);
    });
  }
})();
