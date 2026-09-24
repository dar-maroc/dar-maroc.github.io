/* ============================================================
   DAR MAROC - CARTES BIENS ACCUEIL (home-properties.js)
   Affiche les 3 premiers biens (CMS/Supabase/data.js) sur
   l'accueil, même rendu que properties.html, lien #slug.
   ============================================================ */
(function () {
  'use strict';

  var grid = document.getElementById('homePropertiesGrid');
  if (!grid) return;

  var STORE_KEY = 'darmaroc-admin-data-v1';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugify(s) {
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }

  function sortNewest(list) {
    return list.slice().sort(function (a, b) {
      var ta = a.createdAt || '', tb = b.createdAt || '';
      if (ta && tb) return ta < tb ? 1 : ta > tb ? -1 : 0;
      if (ta) return -1;
      if (tb) return 1;
      return 0;
    });
  }

  function loadLocalProps() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.properties) && parsed.properties.length) return parsed.properties;
      }
    } catch (e) {}
    if (window.DARMAROC_DATA && window.DARMAROC_DATA.properties) return window.DARMAROC_DATA.properties;
    return [];
  }

  var CATS = {
    sale: { badge: 'À vendre', badgeAr: 'للبيع' },
    rent: { badge: 'À louer', badgeAr: 'للإيجار' },
    renovation: { badge: 'Rénové', badgeAr: 'مجدّد' },
    decoration: { badge: 'Décoration', badgeAr: 'ديكور' }
  };

  function renderCards(list) {
    var top = sortNewest(list || loadLocalProps()).slice(0, 3);
    if (!top.length) return;
    grid.innerHTML = top.map(function (p, i) {
      var cat = CATS[p.cat] || CATS.sale;
      var slug = slugify(p.id || p.fr || 'bien');
      var href = 'properties.html#' + slug;

      var priceHTML = esc(p.price || '');
      if (p.period) {
        priceHTML = esc(p.price || '') + ' / <span data-fr="' + esc(p.period) + '" data-ar="' + esc(p.period) + '">' + esc(p.period) + '</span>';
      }

      var details = '';
      if (p.area) details += '<span class="property-detail"><i class="fas fa-arrows-alt"></i> ' + esc(p.area) + '</span>';
      if (p.beds) details += '<span class="property-detail"><i class="fas fa-bed"></i> ' + esc(p.beds) + '</span>';
      if (p.baths) details += '<span class="property-detail"><i class="fas fa-bath"></i> ' + esc(p.baths) + '</span>';

      return '<div class="property-card glow-card" data-aos="fade-up" data-aos-delay="' + (i * 100) + '">' +
        '<div class="property-image">' +
        '<img src="' + esc(p.img || '') + '" alt="' + esc(p.alt || p.fr || '') + '" loading="lazy" decoding="async">' +
        '<span class="property-badge" data-fr="' + esc(cat.badge) + '" data-ar="' + esc(cat.badgeAr) + '">' + esc(cat.badge) + '</span>' +
        '</div>' +
        '<div class="property-body">' +
        '<div class="property-price">' + priceHTML + '</div>' +
        '<div class="property-city"><i class="fas fa-location-dot"></i> ' + esc(p.city || '') + '</div>' +
        '<div class="property-details">' + details + '</div>' +
        '<a href="' + href + '" class="btn btn-outline btn-sm"><span data-fr="Voir" data-ar="عرض">Voir</span> <i class="fas fa-arrow-right"></i></a>' +
        '</div></div>';
    }).join('');
  }

  renderCards();

  if (window.DarMarocStore && window.DarMarocStore.hasBackend()) {
    window.DarMarocStore.fetchCollection('properties').then(function (items) {
      if (items && items.length) renderCards(items);
    });
  }
})();
