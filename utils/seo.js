/* ============================================================
   DAR MAROC - SEO AUTOMATIQUE (utils/seo.js)
   Génère et injecte automatiquement, à chaque annonce affichée :
   - <title> + meta description
   - Open Graph (og:*) + Twitter Cards
   - URL canonique avec # (partage de l'annonce)
   - JSON-LD Schema.org (RealEstateListing / Product / Service)
   Restaure les métadonnées de la page à la fermeture.
   N'ajoute rien d'autre : le design et le contenu restent intacts.
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.DARMAROC_CONFIG || {};
  var SITE = cfg.site || {};
  var SITE_NAME = SITE.fullName || 'DarMaroc';
  var BASE = 'https://dar-maroc.github.io';
  var OG_IMG = (cfg.seo && cfg.seo.ogImage) || BASE + '/images/banner-with-logo.png';

  var DEFAULTS = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function slugify(s) {
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }

  function getMeta(attr) {
    return document.querySelector('meta[' + attr + ']');
  }

  function setMeta(attr, value) {
    var el = getMeta(attr);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr.split('=')[0], attr.split('=')[1].replace(/^"|"$/g, ''));
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  /* Sauvegarde les métas d'origine au premier appel pour pouvoir restaurer. */
  function saveDefaults() {
    if (DEFAULTS) return;
    DEFAULTS = {
      title: document.title,
      description: getMeta('name="description"') ? getMeta('name="description"').getAttribute('content') : '',
      ogTitle: getMeta('property="og:title"') ? getMeta('property="og:title"').getAttribute('content') : '',
      ogDesc: getMeta('property="og:description"') ? getMeta('property="og:description"').getAttribute('content') : '',
      ogImage: getMeta('property="og:image"') ? getMeta('property="og:image"').getAttribute('content') : '',
      twTitle: getMeta('name="twitter:title"') ? getMeta('name="twitter:title"').getAttribute('content') : '',
      twDesc: getMeta('name="twitter:description"') ? getMeta('name="twitter:description"').getAttribute('content') : '',
      twImage: getMeta('name="twitter:image"') ? getMeta('name="twitter:image"').getAttribute('content') : ''
    };
  }

  function humanize(o) {
    if (!o) return '';
    return String(o);
  }

  /* Construit le JSON-LD Schema.org selon le type d'annonce. */
  function jsonLd(p) {
    var img = (p.photos && p.photos.length) ? (typeof p.photos[0] === 'string' ? p.photos[0] : (p.photos[0] && p.photos[0].url) || '') : (p.img || '');
    var title = p.fr || p.ar || SITE_NAME + ' - Annonce';
    var desc = (p.alt) || (title + (p.city ? ' à ' + p.city : '') + (p.price ? ' — ' + p.price : '') + '. DarMaroc Immobilier, Maroc.');
    var priceNum = String(p.price || '').replace(/[^\d.,]/g, '').replace(/,/g, '.');
    var isSale = p.cat === 'sale';
    var schema = {
      '@context': 'https://schema.org',
      '@type': isSale ? 'Residence' : 'Product',
      name: title,
      description: desc,
      image: img,
      url: BASE + '/properties.html#' + slugify((p.id || title)),
      provider: { '@type': 'Organization', name: SITE_NAME, url: BASE }
    };
    if (priceNum) schema.offers = {
      '@type': 'Offer',
      price: priceNum,
      priceCurrency: 'MAD',
      availability: 'https://schema.org/' + (isSale ? 'InStock' : 'PreOrder'),
      url: BASE + '/properties.html#' + slugify((p.id || title))
    };
    if (p.city || p.pays) {
      schema.address = {
        '@type': 'PostalAddress',
        addressLocality: p.city || '',
        addressCountry: p.pays || 'MA'
      };
    }
    return schema;
  }

  function upsertJsonLd(p) {
    var id = 'darmaroc-seo-ld';
    removeJsonLd();
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(jsonLd(p));
    if (document.head) document.head.appendChild(script);
  }

  function removeJsonLd() {
    var old = document.getElementById('darmaroc-seo-ld');
    if (old) {
      try {
        if (document.head && document.head.removeChild) { document.head.removeChild(old); }
        else if (old.parentNode && old.parentNode.removeChild) { old.parentNode.removeChild(old); }
        else if (old.remove) { old.remove(); }
      } catch (e) {}
    }
  }

  /* Applique les métadonnées SEO d'une annonce. */
  function update(p) {
    if (!p) return;
    saveDefaults();
    var title = p.fr || p.ar || SITE_NAME;
    var base = title + ' | ' + SITE_NAME;
    var desc = (p.alt) || (title + (p.city ? ' à ' + p.city : '') + (p.price ? ' — ' + p.price : '') + '. ' + SITE_NAME + ', Maroc.');
    var img = (p.photos && p.photos.length) ? (typeof p.photos[0] === 'string' ? p.photos[0] : (p.photos[0] && p.photos[0].url) || '') : (p.img || OG_IMG);
    var shareUrl = BASE + '/properties.html#' + slugify((p.id || title));

    document.title = base;
    setMeta('name="description"', desc);
    setMeta('property="og:title"', base);
    setMeta('property="og:description"', desc);
    setMeta('property="og:type"', 'website');
    setMeta('property="og:url"', shareUrl);
    setMeta('property="og:image"', img);
    setMeta('name="twitter:title"', base);
    setMeta('name="twitter:description"', desc);
    setMeta('name="twitter:image"', img);
    setMeta('name="twitter:card"', 'summary_large_image');
    upsertJsonLd(p);
    return base;
  }

  /* Restaure les métadonnées par défaut de la page. */
  function reset() {
    if (!DEFAULTS) return;
    document.title = DEFAULTS.title;
    if (DEFAULTS.description) setMeta('name="description"', DEFAULTS.description);
    if (DEFAULTS.ogTitle) setMeta('property="og:title"', DEFAULTS.ogTitle);
    if (DEFAULTS.ogDesc) setMeta('property="og:description"', DEFAULTS.ogDesc);
    if (DEFAULTS.ogImage) setMeta('property="og:image"', DEFAULTS.ogImage);
    if (DEFAULTS.twTitle) setMeta('name="twitter:title"', DEFAULTS.twTitle);
    if (DEFAULTS.twDesc) setMeta('name="twitter:description"', DEFAULTS.twDesc);
    if (DEFAULTS.twImage) setMeta('name="twitter:image"', DEFAULTS.twImage);
    removeJsonLd();
  }

  window.DarMarocSEO = {
    VERSION: 'v1.0',
    update: update,
    reset: reset,
    jsonLd: jsonLd,
    slugify: slugify,
    humanize: humanize
  };
})();
