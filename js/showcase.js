/* ============================================================
   DAR MAROC - RENDU DYNAMIQUE DE LA DÉMONSTRATION (showcase.js)
   Génère les slides du carrousel "Visitez Nos Biens en Vidéo"
   depuis le CMS (localStorage) ou les données statiques (data.js),
   synchronisées avec Supabase si configuré. Compatible 2 langues.
   ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'darmaroc-admin-data-v1';
  var slider = document.querySelector('.showcase-slider');
  if (!slider) return;

  var Utils = window.DarMarocUtils || {};
  function esc(v) { return Utils.escapeHTML ? Utils.escapeHTML(v) : String(v == null ? '' : v); }

  function getData() {
    var list = [];
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.showcase) && parsed.showcase.length) {
          list = parsed.showcase;
        }
      }
    } catch (e) { /* ignore */ }
    if (!list.length) {
      var staticData = window.DARMAROC_DATA || {};
      list = (staticData.showcase || []).slice();
    }
    return list.slice().sort(function (a, b) {
      var ta = typeof a.delay === 'number' ? a.delay : 0;
      var tb = typeof b.delay === 'number' ? b.delay : 0;
      return ta - tb;
    });
  }

  var BADGES = {
    sale: { fr: 'À vendre', ar: 'للبيع' },
    rent: { fr: 'À louer', ar: 'للإيجار' }
  };
  var AR_PERIOD = { jour: 'يوم', mois: 'شهر', nuit: 'ليلة' };

  function slideHTML(s) {
    var badge = BADGES[s.badge] || BADGES.sale;
    var fr = esc(s.fr || '');
    var ar = esc(s.ar || fr);
    var price = esc(s.price || '');
    if (s.period) {
      var arP = AR_PERIOD[s.period] || s.period;
      price = esc(s.price || '') + ' / <span data-fr="' + esc(s.period) + '" data-ar="' + esc(arP) + '">' + esc(s.period) + '</span>';
    }
    return '<div class="showcase-slide">' +
      '<img src="' + esc(s.img || '') + '" loading="lazy" alt="' + esc(s.alt || fr) + '">' +
      '<div class="showcase-overlay">' +
      '<span class="showcase-badge ' + esc(s.badge === 'rent' ? 'rent' : 'sale') + '" data-fr="' + esc(badge.fr) + '" data-ar="' + esc(badge.ar) + '">' + esc(badge.fr) + '</span>' +
      '<h3 data-fr="' + fr + '" data-ar="' + ar + '">' + fr + '</h3>' +
      '<div class="showcase-info">' +
      (s.surface ? '<span><i class="fas fa-arrows-alt"></i> ' + esc(s.surface) + '</span>' : '') +
      (s.beds ? '<span><i class="fas fa-bed"></i> ' + esc(s.beds) + '</span>' : '') +
      (s.baths ? '<span><i class="fas fa-bath"></i> ' + esc(s.baths) + '</span>' : '') +
      '</div>' +
      '<div class="showcase-price">' + price + '</div>' +
      '</div></div>';
  }

  function logoSlideHTML() {
    return '<div class="showcase-slide">' +
      '<div class="showcase-logo-slide">' +
      '<div class="showcase-logo-inner">' +
      '<img src="images/logo.png" alt="DarMaroc Immobilier" class="showcase-logo-img">' +
      '<div class="gold-divider" style="margin:20px auto;"></div>' +
      '<p class="showcase-logo-text" data-fr="Votre partenaire de confiance au Maroc" data-ar="شريكك الموثوق في المغرب">Votre partenaire de confiance au Maroc</p>' +
      '<div class="showcase-logo-contact">' +
      '<span><i class="fas fa-phone"></i> +212 665 310 308</span>' +
      '<span><i class="fas fa-globe"></i> www.darmaroc.com</span>' +
      '</div></div></div></div>';
  }

  function render(list) {
    var slides = list || getData();
    slider.innerHTML = slides.map(slideHTML).join('') + logoSlideHTML();

    if (window.DarMarocShowcaseCtrl && window.DarMarocShowcaseCtrl.init) {
      window.DarMarocShowcaseCtrl.init();
    }
  }

  render();

  /* Synchronisation Supabase : les slides de la base remplacent le cache. */
  if (window.DarMarocStore && window.DarMarocStore.hasBackend()) {
    window.DarMarocStore.fetchCollection('showcase').then(function (items) {
      if (items && items.length) render(items);
    });
  }
})();
