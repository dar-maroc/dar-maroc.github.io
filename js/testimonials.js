/* ============================================================
   DAR MAROC - RENDU DYNAMIQUE DES TÉMOIGNAGES (testimonials.js)
   Génère la grille d'avis depuis le CMS (localStorage)
   ou les données statiques (data.js). Compatible 3 langues.
   ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'darmaroc-admin-data-v1';
  var grid = document.getElementById('testimonialsGrid');
  if (!grid) return;

  var Utils = window.DarMarocUtils || {};
  function esc(v) { return Utils.escapeHTML ? Utils.escapeHTML(v) : String(v == null ? '' : v); }

  function getData() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.testimonials) && parsed.testimonials.length) {
          return parsed.testimonials;
        }
      }
    } catch (e) { /* ignore */ }
    var staticData = window.DARMAROC_DATA || {};
    return (staticData.testimonials || []).slice();
  }

  function getLang() {
    try { return localStorage.getItem('darmaroc-lang') || document.documentElement.lang || 'fr'; }
    catch (e) { return 'fr'; }
  }

  function stars(rating) {
    var r = Number(rating) || 5;
    var out = '';
    for (var i = 0; i < 5; i++) {
      out += i < r ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return out;
  }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/);
    var a = parts[0] ? parts[0][0] : '?';
    var b = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (a + b).toUpperCase();
  }

  function cardHTML(t, lang, index) {
    var name = esc(t.name || 'Client DarMaroc');
    var city = esc(t.city || '');
    var fr = esc(t.fr || t.text || '');
    var ar = esc(t.ar || fr);
    var role = city ? (lang === 'ar' ? 'زبون، ' + city : 'Client, ' + city) : (lang === 'ar' ? 'زبون' : 'Client');

    return '<div class="testimonial-card" data-aos="fade-up" data-aos-delay="' + (index * 100) + '">' +
      '<div class="testimonial-stars">' + stars(t.rating) + '</div>' +
      '<p class="testimonial-text" data-fr="' + fr + '" data-ar="' + ar + '">' + fr + '</p>' +
      '<div class="testimonial-author">' +
      '<div class="testimonial-avatar">' + initials(name) + '</div>' +
      '<div><h5>' + name + '</h5>' +
      '<p data-fr="' + role + '" data-ar="' + role + '">' + role + '</p>' +
      '</div></div></div>';
  }

  function render(list) {
    var lang = getLang();
    var testimonials = (list || getData()).slice(0, 6);
    grid.innerHTML = testimonials.map(function (t, i) { return cardHTML(t, lang, i); }).join('');

    if (window.AOS) {
      try { AOS.refreshHard(); } catch (e) { try { AOS.refresh(); } catch (e2) {} }
    }
  }

  render();

  /* Synchronisation Supabase : les témoignages de la base remplacent le cache. */
  if (window.DarMarocStore && window.DarMarocStore.hasBackend()) {
    window.DarMarocStore.fetchCollection('testimonials').then(function (items) {
      if (items && items.length) render(items);
    });
  }
})();
