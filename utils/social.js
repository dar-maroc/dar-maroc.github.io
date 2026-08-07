/* ============================================================
   DAR MAROC - GÉNÉRATEUR DE CONTENU RÉSEAUX SOCIAUX (utils/social.js)
   Produit, pour chaque annonce, des publications prêtes à publier :
   - Textes FR / AR / EN (accroche + description + appel à l'action)
   - Hashtags optimisés (immobilier Maroc)
   - Emoji et mentions @
   - Lien WhatsApp avec message pré-rempli
   Semble "généré par IA" mais tourne 100% localement (aucune clé,
   aucune dépendance). Le téléversement reste manuel (Phase 5 semi-auto).
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.DARMAROC_CONFIG || {};
  var WA = cfg.whatsapp || {};
  var SITE = cfg.site || {};

  var CAT_LABEL_FR = {
    sale: 'À vendre', rent: 'À louer', renovation: 'Rénovation', decoration: 'Décoration', project: 'Projet'
  };
  var CAT_LABEL_AR = {
    sale: 'للبيع', rent: 'للإيجار', renovation: 'ترميم', decoration: 'ديكور', project: 'مشروع'
  };
  var CAT_LABEL_EN = {
    sale: 'For sale', rent: 'For rent', renovation: 'Renovation', decoration: 'Decoration', project: 'Project'
  };

  var HASHTAGS = [
    'maroc', 'immobilier', 'agadir', 'villa', 'riad', 'appartement',
    'realestate', 'morocco', 'luxe', 'investissement', 'maison', 'propriete',
    'casablanca', 'marrakech', 'mouvement', 'achat', 'location', 'darMaroc'
  ];

  function esc(s) {
    return String(s == null ? '' : s);
  }

  function normalize(s) {
    return esc(s)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF ]+/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function hashtags(p) {
    var set = new Set(HASHTAGS);
    if (p.city) set.add(normalize(p.city).toLowerCase().replace(/\s+/g, ''));
    if (p.categorie) set.add(normalize(p.categorie).toLowerCase());
    var out = [];
    set.forEach(function (h) { out.push('#' + h.toLowerCase()); });
    return out.slice(0, 12).join(' ');
  }

  function waLink(p) {
    var msg = 'Bonjour DarMaroc, je suis intéressé(e) par : ' + (p.fr || '') +
      (p.city ? ' (' + p.city + ')' : '') + (p.price ? ' — ' + p.price : '') + '.';
    var num = WA.number || '33772208885';
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
  }

  function title(p, lang) {
    var base = p.fr || p.ar || 'Bien DarMaroc';
    var catLabel = lang === 'ar' ? (CAT_LABEL_AR[p.cat] || '') : lang === 'en' ? (CAT_LABEL_EN[p.cat] || '') : (CAT_LABEL_FR[p.cat] || '');
    var out = [];
    if (catLabel) out.push(catLabel);
    out.push(base);
    if (p.city) out.push(p.city);
    if (p.price) out.push(p.price);
    return out.filter(Boolean).join(' | ');
  }

  function body(p, lang) {
    var sep = lang === 'ar' ? '، ' : ' • ';
    var details = [];
    if (p.area) details.push('🟦 ' + p.area);
    if (p.beds) details.push('🛏 ' + p.beds + (lang === 'ar' ? ' غرف' : lang === 'en' ? ' rooms' : ' ch.'));
    if (p.baths) details.push('🛁 ' + p.baths + (lang === 'ar' ? ' حمامات' : lang === 'en' ? ' baths' : ' sdb'));
    if (p.period) details.push('⏱ ' + p.period);

    if (lang === 'ar') {
      return '✨ ' + (p.fr || p.ar || '') +
        (p.city ? '\n📍 ' + p.city : '') +
        (details.length ? '\n' + details.join(sep) : '') +
        (p.price ? '\n💰 ' + p.price : '') +
        '\n\n📲 للتواصل والاستفسار راسلنا واتساب الآن !\n' + waLink(p);
    }
    if (lang === 'en') {
      return '✨ ' + (p.fr || p.ar || '') +
        (p.city ? '\n📍 ' + p.city : '') +
        (details.length ? '\n' + details.join(sep) : '') +
        (p.price ? '\n💰 ' + p.price : '') +
        '\n\n📲 Contact us now on WhatsApp!\n' + waLink(p);
    }
    return '✨ ' + (p.fr || p.ar || '') +
      (p.city ? '\n📍 ' + p.city : '') +
      (details.length ? '\n' + details.join(sep) : '') +
      (p.price ? '\n💰 ' + p.price : '') +
      '\n\n📲 Contactez-nous dès maintenant sur WhatsApp !\n' + waLink(p);
  }

  function post(p, lang) {
    var t = title(p, lang);
    var b = body(p, lang);
    var tags = hashtags(p);
    var mention = lang === 'ar' ? '🔖 دارالمغرب' : '@DarMaroc';
    return t + '\n\n' + b + '\n\n' + mention + '\n' + tags;
  }

  function all(p) {
    return {
      fr: post(p, 'fr'),
      ar: post(p, 'ar'),
      en: post(p, 'en'),
      wa: waLink(p),
      hashtags: hashtags(p),
      title: title(p, 'fr')
    };
  }

  window.DarMarocSocial = {
    VERSION: 'v1.0',
    post: post,
    all: all,
    waLink: waLink,
    hashtags: hashtags,
    title: title
  };
})();
