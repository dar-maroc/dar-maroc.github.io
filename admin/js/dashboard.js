/* ============================================================
   DAR MAROC ADMIN - TABLEAU DE BORD (dashboard.js)
   CRUD complet. Stockage local par défaut, migration vers
   Firestore automatique quand Firebase est configuré.
   ============================================================ */
(function () {
  'use strict';

  if (!window.DarMarocAuth || !window.DarMarocAuth.guard()) return;

  var AUTH = window.DarMarocAuth;
  var ROLE = AUTH.role ? AUTH.role() : 'admin';
  var USERNAME = AUTH.user ? AUTH.user() : 'darmaroc';
  var IS_ADMIN = ROLE !== 'contrib';

  var STORE_KEY = 'darmaroc-admin-data-v1';
  var cfg = window.DARMAROC_CONFIG || {};

  var DB = {
    services: [],
    categories: [],
    testimonials: [],
    faq: [],
    properties: [],
    showcase: [],
    partners: [],
    contacts: [],
    settings: {}
  };

  /* ---------- Stockage local ---------- */
  function loadLocal() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        DB = {
          services: parsed.services || [],
          categories: parsed.categories || [],
          testimonials: parsed.testimonials || [],
          faq: parsed.faq || [],
          properties: parsed.properties || [],
          showcase: parsed.showcase || [],
          partners: parsed.partners || [],
          contacts: parsed.contacts || [],
          settings: parsed.settings || {}
        };
      } else {
        seedFromStatic();
        saveLocal();
      }
    } catch (e) { seedFromStatic(); }
    if (!DB.properties.length && window.DARMAROC_DATA && (window.DARMAROC_DATA.properties || []).length) {
      seedProperties();
      saveLocal();
    }
    if (!DB.showcase.length && window.DARMAROC_DATA && (window.DARMAROC_DATA.showcase || []).length) {
      seedShowcase();
      saveLocal();
    }
    if (!DB.partners.length && window.DARMAROC_DATA && (window.DARMAROC_DATA.partners || []).length) {
      seedPartners();
      saveLocal();
    }
    if (!DB.contacts.length) {
      seedContacts();
      saveLocal();
    }
  }

  function seedPartners() {
    var staticData = window.DARMAROC_DATA || {};
    DB.partners = (staticData.partners || []).map(function (p) {
      return {
        id: p.id || uid(),
        name: p.name || '', fr: p.fr || '', ar: p.ar || '',
        icon: p.icon || 'fa-handshake',
        img: p.img || p.logo || '',
        delay: typeof p.delay === 'number' ? p.delay : 0,
        createdAt: p.createdAt || ''
      };
    });
  }

  var CONTACT_ICONS = [
    { v: 'fa-building', l: '🔧 Fixe / Bureau' },
    { v: 'fa-mobile-alt', l: '📱 Mobile' },
    { v: 'fa-whatsapp', l: '💬 WhatsApp' },
    { v: 'fa-envelope', l: '📧 Email' },
    { v: 'fa-phone-alt', l: '📞 Téléphone' }
  ];

  function seedContacts() {
    var staticData = window.DARMAROC_DATA || {};
    var seeded = (staticData.contacts || []).map(function (c) {
      return { id: c.id || uid(), label: c.label || '', value: c.value || '', icon: c.icon || 'fa-phone-alt' };
    });
    if (seeded.length) {
      DB.contacts = seeded;
    } else {
      DB.contacts = [
        { id: uid(), label: 'Bureau', value: '05 25 26 14 86', icon: 'fa-building' },
        { id: uid(), label: 'Mobile 1', value: '+212 665 310 308', icon: 'fa-mobile-alt' },
        { id: uid(), label: 'Mobile 2', value: '+212 667 090 303', icon: 'fa-mobile-alt' },
        { id: uid(), label: 'WhatsApp France', value: '+33 7 72 20 88 85', icon: 'fa-whatsapp' },
        { id: uid(), label: 'Email', value: 'Dar.maroc4@gmail.com', icon: 'fa-envelope' }
      ];
    }
  }

  function seedShowcase() {
    var staticData = window.DARMAROC_DATA || {};
    DB.showcase = (staticData.showcase || []).map(function (s) {
      return {
        id: s.id || uid(),
        badge: s.badge || 'sale',
        fr: s.fr || '', ar: s.ar || '',
        surface: s.surface || '', beds: s.beds || '', baths: s.baths || '',
        price: s.price || '', period: s.period || '',
        img: s.img || '', alt: s.alt || '',
        delay: typeof s.delay === 'number' ? s.delay : 0,
        createdAt: s.createdAt || ''
      };
    });
  }

  function seedProperties() {
    var staticData = window.DARMAROC_DATA || {};
    DB.properties = (staticData.properties || []).map(function (p) {
      return {
        id: p.id || uid(),
        fr: p.fr, ar: p.ar || '', cat: p.cat || 'sale', price: p.price || '',
        period: p.period || '', city: p.city || '', pays: p.pays || '',
        categorie: p.categorie || '', area: p.area || '',
        beds: p.beds || '', baths: p.baths || '', time: p.time || '',
        style: p.style || '', photos: p.photos || [], photoDates: p.photoDates || [], img: p.img || '',
        link: p.link || '', alt: p.alt || '', href: p.href || 'contact.html',
        owner: p.owner || '',
        createdAt: p.createdAt || ''
      };
    });
  }

  function seedFromStatic() {
    var staticData = window.DARMAROC_DATA || {};
    DB.services = (staticData.services || []).map(function (s) {
      return {
        id: s.id || uid(),
        fr: s.fr, ar: s.ar, cat: s.cat || '', icon: s.icon || 'fa-wrench', desc: s.desc || '',
        descAr: s.descAr || '', href: s.href || 'services.html', img: s.img || '',
        alt: s.alt || '', delay: typeof s.delay === 'number' ? s.delay : 0,
        createdAt: s.createdAt || ''
      };
    });
    DB.categories = (staticData.categories || []).map(function (c) { return { id: c.id || uid(), fr: c.fr, ar: c.ar, icon: c.icon || 'fa-layer-group' }; });
    DB.testimonials = (staticData.testimonials || []).map(function (t) { return { id: t.id || uid(), name: t.name, city: t.city || '', rating: t.rating || 5, fr: t.fr, ar: t.ar || '' };     });
    DB.faq = (staticData.faq || []).map(function (q) { return { id: q.id || uid(), fr: q.fr, ar: q.ar, aFR: q.aFR || '', aAR: q.aAR || '' }; });
    seedShowcase();
    seedPartners();
    seedProperties();
    seedContacts();
    DB.settings = {
      siteName: (cfg.site && cfg.site.name) || 'DarMaroc',
      sloganFR: (cfg.site && cfg.site.sloganFR) || '',
      sloganAR: (cfg.site && cfg.site.sloganAR) || '',
      whatsapp: (cfg.whatsapp && cfg.whatsapp.number) || '',
      email: (cfg.site && cfg.site.email) || '',
      phoneFixed: (cfg.site && cfg.site.phoneFixed) || '',
      phoneMobile1: (cfg.site && cfg.site.phoneMobile1) || '',
      phoneMobile2: (cfg.site && cfg.site.phoneMobile2) || ''
    };
  }

  function saveLocal() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(DB));
      return true;
    } catch (e) {
      try { toast('Stockage du navigateur plein : supprimez des photos ou des anciens éléments puis réessayez.', true); } catch (e2) {}
      return false;
    }
  }

  /* ---------- UI helpers ---------- */
  function toast(msg, isErr) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.toggle('error', !!isErr);
    t.hidden = false;
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  function uid() { return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function esc(s) { return window.DarMarocUtils ? window.DarMarocUtils.escapeHTML(s) : String(s || ''); }

  /* ---------- Compression d'images (évite de saturer localStorage) ----------
     Délègue au pipeline photos DarMaroc (WebP + HD + watermark logo) dès que
     disponible ; sinon conserve le comportement d'origine (JPEG 75%). */
  function compressImage(dataUrl, maxW, quality, cb) {
    if (window.DarMarocPhotos && window.DarMarocPhotos.processImage) {
      window.DarMarocPhotos.processImage(dataUrl, { maxWidth: maxW || 1280, quality: quality == null ? 0.75 : quality }, cb);
      return;
    }
    try {
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.width || 1, h = img.height || 1;
          var scale = Math.min(1, (maxW || 1280) / w);
          var nw = Math.max(1, Math.round(w * scale));
          var nh = Math.max(1, Math.round(h * scale));
          var canvas = document.createElement('canvas');
          canvas.width = nw;
          canvas.height = nh;
          canvas.getContext('2d').drawImage(img, 0, 0, nw, nh);
          var out = canvas.toDataURL('image/jpeg', quality == null ? 0.75 : quality);
          cb(out && out.length < dataUrl.length ? out : dataUrl);
        } catch (e) { cb(dataUrl); }
      };
      img.onerror = function () { cb(dataUrl); };
      img.src = dataUrl;
    } catch (e) { cb(dataUrl); }
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    try { return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return iso; }
  }

  /* ---------- Persistance cloud (Supabase) ---------- */
  var pendingCloud = [];
  var formDraftId = null;

  function sortNewest(arr) {
    return arr.slice().sort(function (a, b) {
      var ta = a.createdAt || '', tb = b.createdAt || '';
      if (ta && tb) return ta < tb ? 1 : ta > tb ? -1 : 0;
      if (ta) return -1;
      if (tb) return 1;
      return 0;
    });
  }

  function persist(collections) {
    saveLocal();
    if (window.DarMarocStore && window.DarMarocStore.hasBackend()) {
      collections.forEach(function (c) {
        if (pendingCloud.indexOf(c) === -1) pendingCloud.push(c);
      });
      pendingCloud.forEach(function (col) {
        window.DarMarocStore.pushCollection(col, DB[col] || []).then(function (ok) {
          if (!ok) toast('Échec enregistrement Supabase : ' + col + ' — voir la console (F12).', true);
        });
      });
      pendingCloud = [];
    }
  }

  function syncFromCloud() {
    var cols = ['properties', 'services', 'categories', 'testimonials', 'faq', 'showcase', 'partners', 'contacts'];
    Promise.all(cols.map(function (c) { return window.DarMarocStore.fetchCollection(c); }))
      .then(function (results) {
        cols.forEach(function (c, i) {
          if (results[i] && results[i].length) DB[c] = results[i];
        });
        saveLocal();
        renderAll();
        toast('Données synchronisées depuis la base (Supabase).');
      })
      .catch(function (e) {
        try { console.warn('Synchronisation Supabase :', e); } catch (e2) {}
      });
    window.DarMarocStore.fetchSettings().then(function (s) {
      if (s) {
        DB.settings = {
          siteName: s.site_nom || DB.settings.siteName,
          sloganFR: s.slogan_fr || DB.settings.sloganFR,
          sloganAR: s.slogan_ar || DB.settings.sloganAR,
          whatsapp: s.whatsapp || DB.settings.whatsapp,
          email: s.email || DB.settings.email,
          phoneFixed: s.telephone_fixe || DB.settings.phoneFixed,
          phoneMobile1: s.telephone_mobile || DB.settings.phoneMobile1,
          phoneMobile2: s.telephone_mobile2 || DB.settings.phoneMobile2
        };
        saveLocal();
        fillSettings();
      }
    });
  }

  /* ---------- Upload des photos vers Supabase Storage ---------- */
  function dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl).split(',');
    var mime = (parts[0].match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
    var bin = atob(parts[1]);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function uploadPhotoToStorage(dataUrl, fileName, cb) {
    var SB = window.Supabase;
    if (!SB || !SB.client || !SB.isConfigured || !SB.isConfigured()) { cb(dataUrl); return; }
    try {
      var blob = dataUrlToBlob(dataUrl);
      var cleanName = String(fileName || 'photo').replace(/\.[^.]+$/, '') || 'photo';
      var path = SB.storagePath(formDraftId || 'annonce', cleanName);
      SB.client.storage.from(SB.bucket).upload(path, blob, { contentType: blob.type, upsert: false })
        .then(function (res) {
          if (res.error) { toast('Upload échoué : ' + res.error.message, true); cb(null); return; }
          var pub = SB.client.storage.from(SB.bucket).getPublicUrl(res.data.path).data.publicUrl;
          cb(pub);
        })
        .catch(function () { toast('Upload échoué.', true); cb(null); });
    } catch (e) { cb(dataUrl); }
  }

  /* ---------- Rendu des listes ---------- */
  function renderServices() {
    var body = document.getElementById('svcBody');
    body.innerHTML = DB.services.map(function (s, i) {
      return '<tr><td>' + esc(s.fr) + '</td><td>' + esc(s.ar) + '</td><td>' + esc(s.cat) + '</td><td><i class="fas ' + esc(s.icon) + '"></i></td><td>' + fmtDate(s.createdAt) + '</td>' +
        '<td><div class="row-actions">' +
        '<button class="btn-icon" data-edit="service" data-index="' + i + '" title="Modifier"><i class="fas fa-pen"></i></button>' +
        '<button class="btn-icon danger" data-del="service" data-index="' + i + '" title="Supprimer"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    }).join('');
    document.getElementById('statServices').textContent = DB.services.length;
  }

  function renderCategories() {
    var body = document.getElementById('catBody');
    body.innerHTML = DB.categories.map(function (c, i) {
      return '<tr><td>' + esc(c.fr) + '</td><td>' + esc(c.ar) + '</td><td><i class="fas ' + esc(c.icon) + '"></i></td>' +
        '<td><div class="row-actions">' +
        '<button class="btn-icon" data-edit="category" data-index="' + i + '" title="Modifier"><i class="fas fa-pen"></i></button>' +
        '<button class="btn-icon danger" data-del="category" data-index="' + i + '" title="Supprimer"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    }).join('');
    document.getElementById('statCats').textContent = DB.categories.length;
  }

  function renderTestimonials() {
    var body = document.getElementById('testiBody');
    body.innerHTML = DB.testimonials.map(function (t, i) {
      var stars = '';
      for (var k = 0; k < 5; k++) { stars += '<i class="fas fa-star' + (k < (t.rating || 0) ? '' : ' fa-regular') + '"></i> '; }
      return '<tr><td>' + esc(t.name) + '</td><td class="stars">' + stars + '</td><td>' + esc(t.fr) + '</td>' +
        '<td><div class="row-actions">' +
        '<button class="btn-icon" data-edit="testimonial" data-index="' + i + '" title="Modifier"><i class="fas fa-pen"></i></button>' +
        '<button class="btn-icon danger" data-del="testimonial" data-index="' + i + '" title="Supprimer"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    }).join('');
    document.getElementById('statTesti').textContent = DB.testimonials.length;
  }

  function renderFaq() {
    var body = document.getElementById('faqBody');
    body.innerHTML = DB.faq.map(function (q, i) {
      return '<tr><td>' + esc(q.fr) + '</td><td>' + esc(q.ar) + '</td>' +
        '<td><div class="row-actions">' +
        '<button class="btn-icon" data-edit="faq" data-index="' + i + '" title="Modifier"><i class="fas fa-pen"></i></button>' +
        '<button class="btn-icon danger" data-del="faq" data-index="' + i + '" title="Supprimer"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    }).join('');
    document.getElementById('statFaq').textContent = DB.faq.length;
  }

  function renderProperties() {
    var body = document.getElementById('propBody');
    if (!body) return;
    var typeLabel = { sale: 'Vente', rent: 'Location', renovation: 'Rénovation', decoration: 'Décoration' };
    var rows = [];
    DB.properties.forEach(function (p, i) {
      if (!IS_ADMIN && (p.owner || '') !== USERNAME) return;
      rows.push('<tr><td>' + esc(p.fr) + '</td><td>' + esc(typeLabel[p.cat] || p.cat) + '</td><td>' + esc(p.price || '') + '</td><td>' + esc(p.city || '') + '</td><td>' + fmtDate(p.createdAt) + '</td>' +
        '<td><div class="row-actions">' +
        '<button class="btn-icon" data-edit="property" data-index="' + i + '" title="Modifier"><i class="fas fa-pen"></i></button>' +
        '<button class="btn-icon danger" data-del="property" data-index="' + i + '" title="Supprimer"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>');
    });
    body.innerHTML = rows.join('');
    var st = document.getElementById('statProps');
    if (st) st.textContent = DB.properties.length;
  }

  function renderShowcase() {
    var body = document.getElementById('showcaseBody');
    if (!body) return;
    var badgeLabel = { sale: 'Vente', rent: 'Location' };
    body.innerHTML = DB.showcase.map(function (s, i) {
      var img = s.img ? '<img src="' + esc(s.img) + '" alt="" style="width:64px;height:40px;object-fit:cover;border-radius:4px;">' : '—';
      return '<tr><td>' + img + '</td><td>' + esc(s.fr) + '</td><td>' + esc(badgeLabel[s.badge] || s.badge) + '</td><td>' + esc(s.price || '') + (s.period ? ' / ' + esc(s.period) : '') + '</td><td>' + (typeof s.delay === 'number' ? s.delay + 1 : '—') + '</td>' +
        '<td><div class="row-actions">' +
        '<button class="btn-icon" data-edit="showcase" data-index="' + i + '" title="Modifier"><i class="fas fa-pen"></i></button>' +
        '<button class="btn-icon danger" data-del="showcase" data-index="' + i + '" title="Supprimer"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucune slide. Cliquez sur « Ajouter une slide » pour commencer.</td></tr>';
  }

  function renderPartners() {
    var body = document.getElementById('partnerBody');
    if (!body) return;
    body.innerHTML = DB.partners.map(function (p, i) {
      return '<tr><td>' + esc(p.fr || p.name) + '</td><td>' + esc(p.ar || '') + '</td><td>' + (p.img ? '<img src="' + esc(p.img) + '" alt="" style="width:34px;height:34px;object-fit:contain;border-radius:8px;">' : '<i class="fas ' + esc(p.icon || 'fa-handshake') + '"></i>') + '</td><td>' + (typeof p.delay === 'number' ? p.delay + 1 : '—') + '</td>' +
        '<td><div class="row-actions">' +
        '<button class="btn-icon" data-edit="partner" data-index="' + i + '" title="Modifier"><i class="fas fa-pen"></i></button>' +
        '<button class="btn-icon danger" data-del="partner" data-index="' + i + '" title="Supprimer"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    }).join('') || '<tr><td colspan="5" class="muted">Aucun partenaire. Cliquez sur « Ajouter un partenaire » pour commencer.</td></tr>';
  }

  function renderContacts() {
    var body = document.getElementById('contactBody');
    if (!body) return;
    body.innerHTML = DB.contacts.map(function (c, i) {
      return '<tr><td><i class="fas ' + esc(c.icon || 'fa-phone-alt') + '" style="color:var(--gold);margin-right:6px;"></i> ' + esc(c.icon || '') + '</td><td><strong>' + esc(c.label || '') + '</strong></td><td>' + esc(c.value || '') + '</td>' +
        '<td><div class="row-actions">' +
        '<button class="btn-icon" data-edit="contact" data-index="' + i + '" title="Modifier"><i class="fas fa-pen"></i></button>' +
        '<button class="btn-icon danger" data-del="contact" data-index="' + i + '" title="Supprimer"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    }).join('') || '<tr><td colspan="4" class="muted">Aucun contact. Cliquez sur « Ajouter un contact » pour commencer.</td></tr>';
    var st = document.getElementById('statContacts');
    if (st) st.textContent = DB.contacts.length;
  }

  function renderAll() {
    renderProperties();
    renderShowcase();
    renderPartners();
    renderContacts();
    renderServices();
    renderCategories();
    renderTestimonials();
    renderFaq();
    fillSettings();
    renderStats();
  }

  /* ---------- Statistiques (Phase 4) ---------- */
  function esc2(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderStats() {
    var st = window.DarMarocStats ? window.DarMarocStats.summary() : null;
    var views = st ? st.views : 0;
    var wa = st ? st.whatsapp : 0;
    var social = st ? st.social : 0;
    var chat = st ? st.chat : 0;
    var email = st ? st.email : 0;
    var last7 = st ? st.last7 : 0;
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('stViews', views);
    set('stWa', wa);
    set('stSocial', social);
    set('stChat', chat);
    set('stEmail', email);
    set('st7', last7);
    var tbody = document.getElementById('stTopProps');
    var props = (st && st.topProperties) || [];
    var localProps = props.slice();

    /* Agrégation multi-appareils : événements stockés dans Supabase. */
    if (window.Supabase && window.Supabase.client && window.Supabase.isConfigured && window.Supabase.isConfigured()) {
      window.Supabase.client.from('stat_events').select('action, label').limit(20000)
        .then(function (res) {
          if (!res || res.error || !res.data || !res.data.length) return;
          var agg = { property_view: {}, whatsapp: 0, social: {}, email: 0, chat: 0 };
          var total = 0, l7 = 0;
          res.data.forEach(function (e) {
            total++;
            if (e.action === 'property_view' && e.label) agg.property_view[e.label] = (agg.property_view[e.label] || 0) + 1;
            else if (e.action === 'whatsapp') agg.whatsapp++;
            else if (e.action === 'social' && e.label) agg.social[e.label] = (agg.social[e.label] || 0) + 1;
            else if (e.action === 'email') agg.email++;
            else if (e.action === 'chat') agg.chat++;
          });
          var cloudViews = Object.keys(agg.property_view).map(function (k) { return { label: k, count: agg.property_view[k] }; })
            .sort(function (a, b) { return b.count - a.count; }).slice(0, 10);
          var cloudViewTotal = cloudViews.reduce(function (s, p) { return s + p.count; }, 0);
          var merged = cloudViews.slice();
          localProps.forEach(function (p) {
            var found = merged.find(function (m) { return m.label === p.label; });
            if (found) found.count += p.count; else merged.push(p);
          });
          merged.sort(function (a, b) { return b.count - a.count; });
          set('stViews', views + cloudViewTotal);
          set('stWa', wa + agg.whatsapp);
          set('stSocial', social + Object.keys(agg.social).reduce(function (s, k) { return s + agg.social[k]; }, 0));
          set('stChat', chat + agg.chat);
          set('stEmail', email + agg.email);
          renderPropsTable(merged);
        })
        .catch(function () { renderPropsTable(localProps); });
    } else {
      renderPropsTable(localProps);
    }

    function renderPropsTable(list) {
      if (!tbody) return;
      tbody.innerHTML = list.length
        ? list.map(function (t) {
            return '<tr><td>' + esc2(t.label) + '</td><td><strong>' + t.count + '</strong></td></tr>';
          }).join('')
        : '<tr><td colspan="2" class="muted">Aucune vue pour le moment — consultez le site public pour commencer à collecter.</td></tr>';
    }
  }

  /* ---------- Modal (formulaires) ---------- */
  var modal = document.getElementById('modal');
  var modalTitle = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');
  var modalForm = document.getElementById('modalForm');

  function openModal(title, html) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
    modalBody.innerHTML = '';
    modalForm._confirm = false;
    modal._onYes = null;
    setConfirmMode(false);
  }

  /* ---------- Confirmation personnalisée (fiable sur mobile, contrairement
     à window.confirm qui peut être bloqué) ---------- */
  function setConfirmMode(on) {
    var saveBtn = document.querySelector('.modal-foot .btn-save');
    if (saveBtn) saveBtn.textContent = on ? 'Oui, confirmer' : 'Enregistrer';
  }

  function askConfirm(message, onYes) {
    modalTitle.textContent = 'Confirmation';
    modalBody.innerHTML = '<p style="margin:0;">' + esc(message) + '</p>';
    modal._onYes = onYes;
    modalForm._confirm = true;
    setConfirmMode(true);
    modal.hidden = false;
  }

  function field(label, id, value, opts) {
    opts = opts || {};
    return '<div class="field"><label>' + esc(label) + '</label>' +
      (opts.type === 'select'
        ? '<select id="' + id + '">' + opts.options.map(function (o) { return '<option value="' + esc(o.v) + '"' + (o.v === value ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('') + '</select>'
        : '<input type="' + (opts.type || 'text') + '" id="' + id + '" value="' + esc(value) + '"' + (opts.required ? ' required' : '') + '>') +
      '</div>';
  }

  function imgUploadBlock() {
    return '<div class="field"><label>Ou importer une photo depuis l\'appareil (PC / smartphone / tablette)</label>' +
      '<input type="file" id="fImgFile" accept="image/*">' +
      '<small class="muted" id="fImgHint"></small></div>';
  }

  function bindImgUpload() {
    var fileEl = document.getElementById('fImgFile');
    var urlEl = document.getElementById('fImg');
    var hint = document.getElementById('fImgHint');
    if (!fileEl || !urlEl) return;
    fileEl.addEventListener('change', function () {
      var file = fileEl.files && fileEl.files[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        toast('Image trop lourde (maximum 8 Mo).', true);
        fileEl.value = '';
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        compressImage(reader.result, 1280, 0.75, function (compressed) {
          urlEl.value = compressed;
          if (hint) hint.textContent = 'Photo chargée depuis l\'appareil ✓';
          toast('Photo chargée.');
        });
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- Galerie de photos (biens) ---------- */
  var formPhotos = [];
  var formPhotoDates = [];

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function photoListHTML(photos, dates) {
    dates = dates || [];
    if (!photos.length) return '<p class="muted">Aucune photo ajoutée. La photo de couverture est la 1re photo.</p>';
    return '<div class="photo-grid">' + photos.map(function (src, i) {
      var d = dates[i];
      var dateLabel = d ? 'Ajoutée le ' + fmtDate(d) : '';
      return '<div class="photo-item"><img src="' + esc(src) + '" alt="Photo ' + (i + 1) + '"><span class="photo-item-num">' + (i + 1) + '</span>' +
        (dateLabel ? '<span class="photo-item-date">' + esc(dateLabel) + '</span>' : '') +
        '<button type="button" class="photo-del" data-pdel="' + i + '" title="Supprimer"><i class="fas fa-trash"></i></button></div>';
    }).join('') + '</div>';
  }

  function photosBlockHTML(photos, dates) {
    dates = dates || [];
    return '<div class="field"><label>Photos du bien (couvre = 1re photo) — chaque photo affiche sa date d\'ajout sur le site</label>' +
      '<div class="photo-list" id="fPhotosList">' + photoListHTML(photos, dates) + '</div>' +
      '<div class="photo-add-row"><input type="text" id="fPhotoUrl" placeholder="Coller une URL de photo…">' +
      '<button type="button" class="btn-add" id="fPhotoAddUrl" style="padding:9px 14px;font-size:0.85rem;"><i class="fas fa-plus"></i> Ajouter</button></div>' +
      '<input type="file" id="fPhotoFiles" accept="image/*" multiple>' +
      '<small class="muted">Importez plusieurs photos depuis l\'appareil (PC / smartphone / tablette) — sans limite de nombre. Elles sont optimisées en WebP (HD + watermark logo DarMaroc) puis envoyées dans le Storage.</small>' +
      '<div class="photo-actions" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button type="button" class="btn-add" id="fVirtualTour" style="padding:8px 12px;font-size:0.85rem;"><i class="fas fa-street-view"></i> Visite virtuelle</button>' +
      '<button type="button" class="btn-add" id="fGenVideo" style="padding:8px 12px;font-size:0.85rem;"><i class="fas fa-video"></i> Vidéo de présentation</button>' +
      '<button type="button" class="btn-add" id="fGenSocial" style="padding:8px 12px;font-size:0.85rem;"><i class="fas fa-hashtag"></i> Publications réseaux</button>' +
      '</div><small class="muted" id="fGenVideoHint"></small></div>';
  }

  function bindPhotoList() {
    var list = document.getElementById('fPhotosList');
    var addUrl = document.getElementById('fPhotoAddUrl');
    var urlInput = document.getElementById('fPhotoUrl');
    var fileInput = document.getElementById('fPhotoFiles');
    if (!list) return;

    function rerender() { list.innerHTML = photoListHTML(formPhotos, formPhotoDates); }

    function addPhoto(src, date) {
      formPhotos.push(src);
      formPhotoDates.push(date || todayStr());
      rerender();
      if (urlInput) urlInput.value = '';
    }

    if (addUrl && urlInput) {
      addUrl.addEventListener('click', function () {
        var v = urlInput.value.trim();
        if (!v) { toast('Collez une URL de photo.', true); return; }
        addPhoto(v, todayStr());
        toast('Photo ajoutée.');
      });
    }
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        Array.prototype.forEach.call(fileInput.files || [], function (file) {
          if (file.size > 8 * 1024 * 1024) { toast('Une image dépasse 8 Mo — ignorée.', true); return; }
          var reader = new FileReader();
          reader.onload = function () {
            compressImage(reader.result, 1280, 0.75, function (compressed) {
              if (window.Supabase && window.Supabase.isConfigured && window.Supabase.isConfigured()) {
                uploadPhotoToStorage(compressed, file.name, function (url) {
                  if (url) addPhoto(url, todayStr());
                });
              } else {
                addPhoto(compressed, todayStr());
              }
            });
          };
          reader.readAsDataURL(file);
        });
        fileInput.value = '';
        toast('Photos chargées.');
      });
    }
    list.addEventListener('click', function (e) {
      var del = e.target.closest('[data-pdel]');
      if (del) {
        formPhotos.splice(Number(del.dataset.pdel), 1);
        formPhotoDates.splice(Number(del.dataset.pdel), 1);
        rerender();
        toast('Photo supprimée.');
      }
    });

    /* Visite virtuelle + Vidéo de présentation (Pipeline photos) */
    var vtBtn = document.getElementById('fVirtualTour');
    var vidBtn = document.getElementById('fGenVideo');
    var socBtn = document.getElementById('fGenSocial');
    var vidHint = document.getElementById('fGenVideoHint');
    function currentTitle() {
      var el = document.getElementById('fFr');
      return el ? el.value.trim() : '';
    }
    function currentPrice() {
      var el = document.getElementById('fPrice');
      return el ? el.value.trim() : '';
    }
    if (vtBtn) {
      vtBtn.addEventListener('click', function () {
        if (!formPhotos.length) { toast('Ajoutez des photos d\'abord.', true); return; }
        if (window.DarMarocPhotos && window.DarMarocPhotos.openVirtualTour) {
          window.DarMarocPhotos.openVirtualTour(formPhotos, currentTitle() || 'Visite virtuelle');
        } else { toast('Module photo indisponible.', true); }
      });
    }
    if (vidBtn) {
      vidBtn.addEventListener('click', function () {
        if (!formPhotos.length) { toast('Ajoutez des photos d\'abord.', true); return; }
        if (!(window.DarMarocPhotos && window.DarMarocPhotos.recordVideo)) { toast('Module photo indisponible.', true); return; }
        if (!window.MediaRecorder) { toast('Votre navigateur ne peut pas enregistrer la vidéo.', true); return; }
        if (vidHint) vidHint.textContent = '⏳ Génération de la vidéo en cours… (quelques secondes)';
        if (vidBtn) vidBtn.disabled = true;
        window.DarMarocPhotos.recordVideo(formPhotos, { title: currentTitle(), price: currentPrice() })
          .then(function (blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'darmaroc-presentation-' + Date.now() + '.webm';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 3000);
            if (vidHint) vidHint.textContent = '✓ Vidéo générée (WebM) — publiez-la sur Instagram / TikTok / Facebook.';
            toast('Vidéo générée ✓');
          })
          .catch(function () {
            if (vidHint) vidHint.textContent = 'Échec de la génération vidéo.';
            toast('Échec de la génération vidéo.', true);
          })
          .finally(function () {
            if (vidBtn) vidBtn.disabled = false;
          });
      });
    }
    if (socBtn) {
      socBtn.addEventListener('click', function () {
        if (!(window.DarMarocSocial && window.DarMarocSocial.all)) { toast('Module réseaux indisponible.', true); return; }
        var data = {
          fr: currentTitle() || '', ar: '', cat: 'sale', price: currentPrice(),
          city: '', categorie: '', area: '', beds: '', baths: '', period: ''
        };
        var f = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
        data.fr = f('fFr') || data.fr;
        data.ar = f('fAr');
        data.price = f('fPrice');
        data.city = f('fVille') || f('fCity');
        data.categorie = f('fCategorie');
        data.area = f('fArea');
        data.beds = f('fBeds');
        data.baths = f('fBaths');
        data.period = f('fPeriod');
        var ad = document.getElementById('fAdType');
        if (ad) data.cat = ad.value === 'rent' ? 'rent' : 'sale';
        if (!data.fr && !data.ar) { toast('Remplissez le titre (FR ou AR) d\'abord.', true); return; }
        var out = window.DarMarocSocial.all(data);
        var html = '<div style="max-height:60vh;overflow:auto;">' +
          '<p class="muted" style="margin-bottom:8px;">Copiez et publiez sur Facebook / Instagram / TikTok. La publication reste manuelle (semi-automatique).</p>' +
          '<h4 style="margin:10px 0 4px;">🇫🇷 Français</h4>' +
          '<textarea id="socFR" rows="8" style="width:100%;box-sizing:border-box;" readonly></textarea>' +
          '<h4 style="margin:10px 0 4px;">🇦🇪 العربية</h4>' +
          '<textarea id="socAR" rows="8" style="width:100%;box-sizing:border-box;" readonly></textarea>' +
          '<h4 style="margin:10px 0 4px;">🇬🇧 English</h4>' +
          '<textarea id="socEN" rows="8" style="width:100%;box-sizing:border-box;" readonly></textarea>' +
          '</div>';
        var body = document.getElementById('modalBody');
        body.innerHTML = html;
        document.getElementById('socFR').value = out.fr;
        document.getElementById('socAR').value = out.ar;
        document.getElementById('socEN').value = out.en;
        toast('Publications générées ✓');
      });
    }
  }

  /* ---------- Formulaires par entité ---------- */
  function serviceForm(index) {
    var s = index >= 0 ? DB.services[index] : { fr: '', ar: '', cat: '', icon: 'fa-wrench', desc: '', descAr: '', img: '', href: 'services.html', alt: '', delay: 0 };
    var catOpts = DB.categories.map(function (c) { return { v: c.id || c.fr, l: c.fr }; });
    catOpts.unshift({ v: '', l: '— Aucune —' });
    openModal(index >= 0 ? 'Modifier le service' : 'Ajouter un service',
      field('Nom (FR)', 'fFr', s.fr, { required: true }) +
      field('Nom (AR)', 'fAr', s.ar, { required: true }) +
      field('Description (FR)', 'fDesc', s.desc) +
      field('Description (AR)', 'fDescAr', s.descAr) +
      field('Catégorie', 'fCat', s.cat, { type: 'select', options: catOpts }) +
      field('Icône FontAwesome', 'fIcon', s.icon) +
      field('URL de l\'image', 'fImg', s.img) + imgUploadBlock() +
      field('Texte alternatif (alt)', 'fAlt', s.alt) +
      field('Lien (href)', 'fHref', s.href));
    modalForm._index = index;
    modalForm._type = 'service';
    bindImgUpload();
  }

  function categoryForm(index) {
    var c = index >= 0 ? DB.categories[index] : { fr: '', ar: '', icon: 'fa-layer-group' };
    openModal(index >= 0 ? 'Modifier la catégorie' : 'Ajouter une catégorie',
      field('Nom (FR)', 'fFr', c.fr, { required: true }) +
      field('Nom (AR)', 'fAr', c.ar, { required: true }) +
      field('Icône FontAwesome', 'fIcon', c.icon));
    modalForm._index = index;
    modalForm._type = 'category';
  }

  function testimonialForm(index) {
    var t = index >= 0 ? DB.testimonials[index] : { name: '', city: '', rating: 5, fr: '', ar: '' };
    var ratingOpts = [1,2,3,4,5].map(function (r) { return { v: String(r), l: r + ' étoile' + (r > 1 ? 's' : '') }; });
    openModal(index >= 0 ? 'Modifier le témoignage' : 'Ajouter un témoignage',
      field('Nom', 'fName', t.name, { required: true }) +
      field('Ville', 'fCity', t.city) +
      field('Note', 'fRating', String(t.rating), { type: 'select', options: ratingOpts }) +
      field('Texte (FR)', 'fFr', t.fr, { required: true }) +
      field('Texte (AR)', 'fAr', t.ar));
    modalForm._index = index;
    modalForm._type = 'testimonial';
  }

  function faqForm(index) {
    var q = index >= 0 ? DB.faq[index] : { fr: '', ar: '', aFR: '', aAR: '' };
    openModal(index >= 0 ? 'Modifier la question' : 'Ajouter une question',
      field('Question (FR)', 'fFr', q.fr, { required: true }) +
      field('Question (AR)', 'fAr', q.ar) +
      field('Réponse (FR)', 'fAFR', q.aFR, { required: true }) +
      field('Réponse (AR)', 'fAAR', q.aAR));
    modalForm._index = index;
    modalForm._type = 'faq';
  }

  function showcaseForm(index) {
    var s = index >= 0 ? DB.showcase[index] : { badge: 'sale', fr: '', ar: '', surface: '', beds: '', baths: '', price: '', period: '', img: '', alt: '', delay: 0 };
    var badgeOpts = [
      { v: 'sale', l: 'À vendre' },
      { v: 'rent', l: 'À louer' }
    ];
    var periodOpts = [
      { v: '', l: '— Aucun —' },
      { v: 'jour', l: 'jour' },
      { v: 'mois', l: 'mois' },
      { v: 'nuit', l: 'nuit' }
    ];
    openModal(index >= 0 ? 'Modifier la slide' : 'Ajouter une slide',
      field('Titre (FR)', 'fFr', s.fr, { required: true }) +
      field('Titre (AR)', 'fAr', s.ar) +
      field('Badge', 'fBadge', s.badge || 'sale', { type: 'select', options: badgeOpts }) +
      field('Surface (ex: 250 m²)', 'fSurface', s.surface) +
      field('Chambres (ex: 4 chambres)', 'fBeds', s.beds) +
      field('Salles de bain (ex: 3 sdb)', 'fBaths', s.baths) +
      field('Prix (ex: 2 500 000 DH)', 'fPrice', s.price) +
      field('Période (jour / mois / nuit)', 'fPeriod', s.period, { type: 'select', options: periodOpts }) +
      field('URL de l\'image', 'fImg', s.img) + imgUploadBlock() +
      field('Texte alternatif (alt)', 'fAlt', s.alt) +
      field('Position (ordre d\'affichage)', 'fDelay', String(typeof s.delay === 'number' ? s.delay : 0)));
    modalForm._index = index;
    modalForm._type = 'showcase';
    bindImgUpload();
  }

  function partnerForm(index) {
    var p = index >= 0 ? DB.partners[index] : { name: '', fr: '', ar: '', icon: 'fa-handshake', img: '', delay: 0 };
    openModal(index >= 0 ? 'Modifier le partenaire' : 'Ajouter un partenaire',
      field('Nom (FR)', 'fName', p.fr || p.name, { required: true }) +
      field('Nom (AR)', 'fAr', p.ar) +
      '<div class="field"><label>Icône <i class="fas ' + esc(p.icon || 'fa-handshake') + '" id="fIconPreview"></i></label>' + iconPicker(p.icon || 'fa-handshake') + '</div>' +
      field('Logo (URL ou upload ci-dessous)', 'fImg', p.img || '') +
      logoUploadBlock() +
      field('Position (ordre d\'affichage)', 'fDelay', String(typeof p.delay === 'number' ? p.delay : 0)));
    modalForm._index = index;
    modalForm._type = 'partner';
    bindIconPicker();
    bindLogoUpload();
  }

  function contactForm(index) {
    var c = index >= 0 ? DB.contacts[index] : { label: '', value: '', icon: 'fa-phone-alt' };
    openModal(index >= 0 ? 'Modifier le contact' : 'Ajouter un contact',
      field('Libellé (ex: Bureau, Mobile 1)', 'fLabel', c.label, { required: true }) +
      field('Valeur / Numéro (ex: +212 665 310 308)', 'fValue', c.value, { required: true }) +
      field('Type d\'icône (combobox)', 'fIcon', c.icon || 'fa-phone-alt', { type: 'select', options: CONTACT_ICONS }));
    modalForm._index = index;
    modalForm._type = 'contact';
  }

  var PARTNER_ICONS = [
    { v: 'fa-handshake', l: 'Poignée de main' },
    { v: 'fa-building', l: 'Immeuble' },
    { v: 'fa-hotel', l: 'Hôtel' },
    { v: 'fa-home', l: 'Maison' },
    { v: 'fa-house-chimney', l: 'Villa' },
    { v: 'fa-basket-shopping', l: 'Supermarché' },
    { v: 'fa-bus', l: 'Transport / Bus' },
    { v: 'fa-truck', l: 'Camion' },
    { v: 'fa-plane', l: 'Avion' },
    { v: 'fa-ship', l: 'Bateau' },
    { v: 'fa-tower-cell', l: 'Télécom' },
    { v: 'fa-industry', l: 'Industrie' },
    { v: 'fa-truck-ramp-box', l: 'Logistique' },
    { v: 'fa-shield-halved', l: 'Assurance' },
    { v: 'fa-landmark', l: 'Banque' },
    { v: 'fa-bank', l: 'Banque 2' },
    { v: 'fa-piggy-bank', l: 'Épargne' },
    { v: 'fa-credit-card', l: 'Carte bancaire' },
    { v: 'fa-phone', l: 'Téléphone' },
    { v: 'fa-laptop', l: 'Technologie' },
    { v: 'fa-plug', l: 'Électricité' },
    { v: 'fa-droplet', l: 'Eau' },
    { v: 'fa-gas-pump', l: 'Énergie' },
    { v: 'fa-solar-panel', l: 'Solaire' },
    { v: 'fa-graduation-cap', l: 'Éducation' },
    { v: 'fa-heart-pulse', l: 'Santé' },
    { v: 'fa-utensils', l: 'Restauration' },
    { v: 'fa-cart-shopping', l: 'Commerce' },
    { v: 'fa-store', l: 'Boutique' },
    { v: 'fa-gem', l: 'Luxe' },
    { v: 'fa-globe', l: 'International' },
    { v: 'fa-users', l: 'Partenaires' },
    { v: 'fa-star', l: 'Étoile' }
  ];

  function iconPicker(value) {
    var opts = PARTNER_ICONS.map(function (o) {
      return '<option value="' + esc(o.v) + '"' + (o.v === value ? ' selected' : '') + '>' + esc(o.l) + '</option>';
    }).join('');
    return '<select id="fIcon" data-preview="fIconPreview">' + opts + '</select>';
  }

  function bindIconPicker() {
    var sel = document.getElementById('fIcon');
    var prev = document.getElementById('fIconPreview');
    if (!sel) return;
    var update = function () {
      if (prev) prev.className = 'fas ' + esc(sel.value || 'fa-handshake');
    };
    sel.addEventListener('change', update);
    update();
  }

  function logoUploadBlock() {
    return '<div class="field"><label>Ou importer un logo depuis l\'appareil (PC / smartphone / tablette)</label>' +
      '<input type="file" id="fLogoFile" accept="image/*">' +
      '<small class="muted" id="fLogoHint"></small></div>';
  }

  function bindLogoUpload() {
    var fileEl = document.getElementById('fLogoFile');
    var urlEl = document.getElementById('fImg');
    var hint = document.getElementById('fLogoHint');
    if (!fileEl || !urlEl) return;
    fileEl.addEventListener('change', function () {
      var file = fileEl.files && fileEl.files[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        toast('Image trop lourde (maximum 8 Mo).', true);
        fileEl.value = '';
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        compressImage(reader.result, 1280, 0.75, function (compressed) {
          urlEl.value = compressed;
          if (hint) hint.textContent = 'Logo chargé depuis l\'appareil ✓';
          toast('Logo chargé.');
        });
      };
      reader.readAsDataURL(file);
    });
  }

  var CATEGORIES = ['Appartement', 'Villa', 'Riad', 'Terrain', 'Local commercial', 'Bureau', 'Immeuble', 'Autre'];

  function countrySelect(value) {
    var geo = window.DarMarocGeo;
    var names = (geo && geo.countryNames) ? geo.countryNames() : [];
    var opts = '<option value="">— Sélectionnez un pays —</option>' +
      names.map(function (n) { return '<option value="' + esc(n) + '"' + (n === value ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('');
    return '<div class="field"><label>Pays</label><select id="fPays">' + opts + '</select></div>';
  }

  function citiesOptions(pays, city) {
    var geo = window.DarMarocGeo;
    var cities = (geo && geo.citiesOf) ? geo.citiesOf(pays) : [];
    var hasCity = city && cities.indexOf(city) === -1;
    var opts = '<option value="">— Sélectionnez une ville —</option>' +
      (hasCity ? '<option value="' + esc(city) + '" selected>' + esc(city) + '</option>' : '') +
      cities.map(function (c) { return '<option value="' + esc(c) + '"' + (c === city ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
    return opts;
  }

  function citySelect(pays, city) {
    return '<div class="field"><label>Ville</label><select id="fVille">' + citiesOptions(pays, city) + '</select></div>';
  }

  function bindGeoCascade() {
    var paysEl = document.getElementById('fPays');
    var villeEl = document.getElementById('fVille');
    if (!paysEl || !villeEl) return;
    paysEl.addEventListener('change', function () {
      villeEl.innerHTML = citiesOptions(paysEl.value, '');
    });
  }

  function propertyForm(index) {
    var p = index >= 0 ? DB.properties[index] : { fr: '', ar: '', cat: 'sale', price: '', period: '', city: '', pays: '', categorie: '', area: '', beds: '', baths: '', time: '', style: '', photos: [], photoDates: [], img: '', link: '', alt: '', href: 'contact.html' };
    formDraftId = (p.id && p.id !== '') ? p.id : uid();
    formPhotos = (p.photos && p.photos.length ? p.photos.slice() : (p.img ? [p.img] : [])).slice();
    formPhotoDates = (p.photoDates && p.photoDates.length ? p.photoDates.slice() : []).slice();
    var typeOpts = [
      { v: 'sale', l: 'À Vendre' },
      { v: 'rent', l: 'À Louer' }
    ];
    var catOpts = CATEGORIES.map(function (c) { return { v: c, l: c }; });
    catOpts.unshift({ v: '', l: '— Aucune —' });
    var periodOpts = [
      { v: '', l: '— Aucun —' },
      { v: 'jour', l: 'jour' },
      { v: 'mois', l: 'mois' },
      { v: 'nuit', l: 'nuit' }
    ];
    var curType = (p.cat === 'sale' || p.cat === 'rent') ? p.cat : 'sale';
    openModal(index >= 0 ? 'Modifier le bien' : 'Ajouter un bien',
      field('Titre (FR)', 'fFr', p.fr, { required: true }) +
      field('Titre (AR)', 'fAr', p.ar) +
      field('Type d\'annonce', 'fAdType', curType, { type: 'select', options: typeOpts }) +
      field('Catégorie', 'fCategorie', p.categorie || '', { type: 'select', options: catOpts }) +
      countrySelect(p.pays || '') +
      citySelect(p.pays || '', p.city || '') +
      field('Prix (ex: 2 500 000 DH ou 400 DH)', 'fPrice', p.price) +
      field('Période (jour / mois / nuit)', 'fPeriod', p.period, { type: 'select', options: periodOpts }) +
      field('Surface (m²)', 'fArea', p.area) +
      field('Chambres', 'fBeds', p.beds) +
      field('Salles de bain', 'fBaths', p.baths) +
      field('Délai (rénovation, ex: 2 semaines)', 'fTime', p.time) +
      field('Style (décoration)', 'fStyle', p.style) +
      photosBlockHTML(formPhotos, formPhotoDates) +
      field('Texte alternatif (alt)', 'fAlt', p.alt) +
      field('Lien externe (page Facebook / Instagram / TikTok / YouTube)', 'fLink', p.link) +
      field('Lien de secours (href)', 'fHref', p.href));
    modalForm._index = index;
    modalForm._type = 'property';
    bindPhotoList();
    bindGeoCascade();
  }

  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  function submitForm() {
    if (modalForm._type === 'entity' && modalForm._save) {
      var vals = {};
      (ENTITY_FORMS[modalForm._entity] || { fields: [] }).fields.forEach(function (f) { vals[f.id] = getVal(f.id); });
      var missing = (ENTITY_FORMS[modalForm._entity] || { fields: [] }).fields.filter(function (f) { return f.required && !String(vals[f.id] || '').trim(); });
      if (missing.length) { toast('Champ obligatoire : ' + missing[0].label, true); return; }
      modalForm._save(vals);
      saveLocal();
      closeModal();
      renderAllExtended();
      toast((ENTITY_FORMS[modalForm._entity] || {}).title + ' enregistré.');
      modalForm._save = null;
      return;
    }
    var type = modalForm._type;
    var index = modalForm._index;
    if (type === 'user') { submitUserForm(); return; }
    if (type === 'service') {
      var svc = {
        id: index >= 0 && DB.services[index] ? (DB.services[index].id || uid()) : uid(),
        fr: getVal('fFr'), ar: getVal('fAr'), cat: getVal('fCat'), icon: getVal('fIcon') || 'fa-wrench',
        desc: getVal('fDesc'), descAr: getVal('fDescAr'), img: getVal('fImg'),
        alt: getVal('fAlt'), href: getVal('fHref') || 'services.html',
        delay: index >= 0 && DB.services[index] ? (DB.services[index].delay || 0) : 0
      };
      svc.createdAt = index >= 0 && DB.services[index] ? (DB.services[index].createdAt || '') : new Date().toISOString();
      if (index >= 0) DB.services[index] = svc; else DB.services.push(svc);
      DB.services = sortNewest(DB.services);
      renderServices(); toast('Service enregistré.');
      persist(['services']);
    } else if (type === 'category') {
      var cat = {
        id: index >= 0 && DB.categories[index] ? (DB.categories[index].id || uid()) : uid(),
        fr: getVal('fFr'), ar: getVal('fAr'), icon: getVal('fIcon') || 'fa-layer-group'
      };
      if (index >= 0) DB.categories[index] = cat; else DB.categories.push(cat);
      renderCategories(); toast('Catégorie enregistrée.');
      persist(['categories']);
    } else if (type === 'testimonial') {
      var t = {
        id: index >= 0 && DB.testimonials[index] ? (DB.testimonials[index].id || uid()) : uid(),
        name: getVal('fName'), city: getVal('fCity'), rating: Number(getVal('fRating')) || 5, fr: getVal('fFr'), ar: getVal('fAr')
      };
      if (index >= 0) DB.testimonials[index] = t; else DB.testimonials.push(t);
      renderTestimonials(); toast('Témoignage enregistré.');
      persist(['testimonials']);
    } else if (type === 'faq') {
      var q = {
        id: index >= 0 && DB.faq[index] ? (DB.faq[index].id || uid()) : uid(),
        fr: getVal('fFr'), ar: getVal('fAr'), aFR: getVal('fAFR'), aAR: getVal('fAAR')
      };
      if (index >= 0) DB.faq[index] = q; else DB.faq.push(q);
      renderFaq(); toast('FAQ enregistrée.');
      persist(['faq']);
    } else if (type === 'showcase') {
      var sh = {
        id: index >= 0 && DB.showcase[index] ? (DB.showcase[index].id || uid()) : uid(),
        badge: getVal('fBadge') || 'sale',
        fr: getVal('fFr'), ar: getVal('fAr'),
        surface: getVal('fSurface'), beds: getVal('fBeds'), baths: getVal('fBaths'),
        price: getVal('fPrice'), period: getVal('fPeriod'),
        img: getVal('fImg'), alt: getVal('fAlt'),
        delay: Number(getVal('fDelay')) || 0
      };
      sh.createdAt = index >= 0 && DB.showcase[index] ? (DB.showcase[index].createdAt || '') : new Date().toISOString();
      if (index >= 0) DB.showcase[index] = sh; else DB.showcase.push(sh);
      DB.showcase.sort(function (a, b) {
        var da = typeof a.delay === 'number' ? a.delay : 0;
        var db2 = typeof b.delay === 'number' ? b.delay : 0;
        return da - db2;
      });
      renderShowcase(); toast('Slide enregistrée.');
      persist(['showcase']);
    } else if (type === 'partner') {
      var pt = {
        id: index >= 0 && DB.partners[index] ? (DB.partners[index].id || uid()) : uid(),
        name: getVal('fName'), fr: getVal('fName'), ar: getVal('fAr'),
        icon: getVal('fIcon') || 'fa-handshake',
        img: getVal('fImg') || '',
        delay: Number(getVal('fDelay')) || 0
      };
      pt.createdAt = index >= 0 && DB.partners[index] ? (DB.partners[index].createdAt || '') : new Date().toISOString();
      if (index >= 0) DB.partners[index] = pt; else DB.partners.push(pt);
      DB.partners.sort(function (a, b) {
        var da = typeof a.delay === 'number' ? a.delay : 0;
        var db2 = typeof b.delay === 'number' ? b.delay : 0;
        return da - db2;
      });
      renderPartners(); toast('Partenaire enregistré.');
      persist(['partners']);
    } else if (type === 'contact') {
      var ct = {
        id: index >= 0 && DB.contacts[index] ? (DB.contacts[index].id || uid()) : uid(),
        label: getVal('fLabel'),
        value: getVal('fValue'),
        icon: getVal('fIcon') || 'fa-phone-alt'
      };
      if (index >= 0) DB.contacts[index] = ct; else DB.contacts.push(ct);
      renderContacts(); toast('Contact enregistré.');
      persist(['contacts']);
    } else if (type === 'property') {
      var p = {
        id: index >= 0 && DB.properties[index] ? (DB.properties[index].id || uid()) : uid(),
        fr: getVal('fFr'), ar: getVal('fAr'),
        cat: getVal('fAdType') || 'sale', categorie: getVal('fCategorie'),
        price: getVal('fPrice'), period: getVal('fPeriod'),
        city: getVal('fVille'), pays: getVal('fPays'),
        area: getVal('fArea'), beds: getVal('fBeds'), baths: getVal('fBaths'),
        time: getVal('fTime'), style: getVal('fStyle'),
        photos: formPhotos.slice(), photoDates: formPhotoDates.slice(),
        img: formPhotos[0] || '',
        link: getVal('fLink'),
        alt: getVal('fAlt'), href: getVal('fHref') || 'contact.html',
        owner: index >= 0 && DB.properties[index] ? (DB.properties[index].owner || USERNAME) : USERNAME
      };
      p.createdAt = index >= 0 && DB.properties[index] ? (DB.properties[index].createdAt || '') : new Date().toISOString();
      if (index >= 0) DB.properties[index] = p; else DB.properties.push(p);
      DB.properties = sortNewest(DB.properties);
      renderProperties(); toast('Bien enregistré.');
      persist(['properties']);
    }
    saveLocal();
    closeModal();
  }

  /* ---------- Événements ---------- */
  document.querySelector('.sidebar-nav').addEventListener('click', function (e) {
    var link = e.target.closest('.nav-link');
    if (!link) return;
    e.preventDefault();
    var view = link.getAttribute('data-view');
    if (view) switchView(view);
    document.getElementById('sidebar').classList.remove('open');
  });

  document.getElementById('menuToggle').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.addEventListener('pointerdown', function (e) {
    var sidebar = document.getElementById('sidebar');
    var menuToggle = document.getElementById('menuToggle');
    if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  var statsRefreshBtn = document.getElementById('statsRefresh');
  if (statsRefreshBtn) {
    statsRefreshBtn.addEventListener('click', function () {
      renderStats();
      toast('Statistiques actualisées.');
    });
  }

  /* ---------- Formulaires nouvelles entites ---------- */
  var ENTITY_FORMS = {
    reservation: { title: 'Reservation', fields: [
      { id: 'eTraveler', label: 'Voyageur', required: true },
      { id: 'eProperty', label: 'Logement', required: true },
      { id: 'eDates', label: 'Dates (AAAA-MM-JJ - AAAA-MM-JJ)', required: true },
      { id: 'eAmount', label: 'Montant (DH)', type: 'number' },
      { id: 'eStatus', label: 'Statut', type: 'select', options: [{v:'pending',l:'En attente'},{v:'confirmed',l:'Confirmee'},{v:'cancelled',l:'Annulee'}] }
    ], save: function (v) { reservations.unshift({ id: uid(), traveler: v.eTraveler, property: v.eProperty, dates: v.eDates, status: v.eStatus || 'pending', amount: v.eAmount || '0' }); logAudit('Reservation', 'Creation', '', v.eTraveler); persistOps(); } },
    traveler: { title: 'Voyageur', fields: [
      { id: 'eName', label: 'Nom', required: true },
      { id: 'eEmail', label: 'Email', type: 'email' },
      { id: 'ePhone', label: 'Telephone' },
      { id: 'eCountry', label: 'Pays' }
    ], save: function (v) { travelers.unshift({ name: v.eName, email: v.eEmail, phone: v.ePhone, country: v.eCountry, lastVisit: '' }); logAudit('Voyageur', 'Creation', '', v.eName); persistOps(); } },
    cleaning: { title: 'Menage', fields: [
      { id: 'eProperty', label: 'Logement', required: true },
      { id: 'eDate', label: 'Date', type: 'date', required: true },
      { id: 'eType', label: 'Type', type: 'select', options: [{v:'Complet',l:'Complet'},{v:'Partiel',l:'Partiel'},{v:'Sortie',l:'Depart'},{v:'Arrivee',l:'Arrivee'}] },
      { id: 'eDuration', label: 'Duree' },
      { id: 'eStatus', label: 'Statut', type: 'select', options: [{v:'pending',l:'A faire'},{v:'in-progress',l:'En cours'},{v:'confirmed',l:'Termine'},{v:'cancelled',l:'Probleme'}] }
    ], save: function (v) { cleanings.unshift({ property: v.eProperty, date: v.eDate, type: v.eType, duration: v.eDuration, status: v.eStatus || 'pending' }); logAudit('Menage', 'Creation', '', v.eProperty + ' ' + v.eDate); persistOps(); } },
    maintenance: { title: 'Maintenance', fields: [
      { id: 'eProperty', label: 'Logement', required: true },
      { id: 'eIssue', label: 'Probleme', required: true },
      { id: 'ePriority', label: 'Priorite', type: 'select', options: [{v:'high',l:'Haute'},{v:'medium',l:'Moyenne'},{v:'low',l:'Basse'}] },
      { id: 'eDate', label: 'Date', type: 'date' },
      { id: 'eStatus', label: 'Statut', type: 'select', options: [{v:'pending',l:'A faire'},{v:'in-progress',l:'En cours'},{v:'confirmed',l:'Termine'}] }
    ], save: function (v) { maintenances.unshift({ property: v.eProperty, issue: v.eIssue, priority: v.ePriority || 'medium', date: v.eDate, status: v.eStatus || 'pending' }); logAudit('Maintenance', 'Creation', '', v.eIssue); persistOps(); } },
    access: { title: 'Acces', fields: [
      { id: 'eProperty', label: 'Logement', required: true },
      { id: 'eType', label: 'Type', type: 'select', options: [{v:'Code',l:'Code'},{v:'Cle',l:'Cle'},{v:'Badge',l:'Badge'},{v:'Tuya',l:'Serrure connectee'}] },
      { id: 'eCode', label: 'Code / Reference' },
      { id: 'eDate', label: 'Date', type: 'date' },
      { id: 'eStatus', label: 'Statut', type: 'select', options: [{v:'active',l:'Actif'},{v:'pending',l:'Temporaire'},{v:'cancelled',l:'Inactif'}] }
    ], save: function (v) { accesses.unshift({ property: v.eProperty, type: v.eType, code: v.eCode, date: v.eDate, status: v.eStatus || 'active' }); logAudit('Acces', 'Creation', '', v.eProperty); persistOps(); } },
    owner: { title: 'Proprietaire', fields: [
      { id: 'eName', label: 'Nom', required: true },
      { id: 'eEmail', label: 'Email', type: 'email' },
      { id: 'ePhone', label: 'Telephone' },
      { id: 'eProps', label: 'Nombre de biens', type: 'number' },
      { id: 'eComm', label: 'Commission (%)', type: 'number' }
    ], save: function (v) { owners.unshift({ name: v.eName, email: v.eEmail, phone: v.ePhone, props: v.eProps || 0, commission: (v.eComm || 0) + '%' }); logAudit('Proprietaire', 'Creation', '', v.eName); persistOps(); } },
    document: { title: 'Document', fields: [
      { id: 'eName', label: 'Nom du fichier', required: true },
      { id: 'eType', label: 'Type', type: 'select', options: [{v:'PDF',l:'PDF'},{v:'IMG',l:'Image'},{v:'DOC',l:'Document'}] },
      { id: 'eSize', label: 'Taille' }
    ], save: function (v) { documents.unshift({ name: v.eName, type: v.eType || 'PDF', size: v.eSize || '-', date: new Date().toISOString().slice(0, 10) }); logAudit('Document', 'Ajout', '', v.eName); persistOps(); } },
    prestataire: { title: 'Prestataire', fields: [
      { id: 'eName', label: 'Nom / Societe', required: true },
      { id: 'eTrade', label: 'Metier', required: true },
      { id: 'ePhone', label: 'Telephone' },
      { id: 'eEmail', label: 'Email', type: 'email' }
    ], save: function (v) { providers.unshift({ name: v.eName, trade: v.eTrade, phone: v.ePhone, email: v.eEmail, tasks: 0 }); logAudit('Prestataire', 'Creation', '', v.eName); persistOps(); } },
    automation: { title: 'Automatisation', fields: [
      { id: 'eTrigger', label: 'Declencheur', required: true },
      { id: 'eAction', label: 'Action', required: true }
    ], save: function (v) { automations.unshift({ trigger: v.eTrigger, action: v.eAction, active: true, last: '-' }); logAudit('Automatisation', 'Creation', '', v.eTrigger); persistOps(); } },
    pricing: { title: 'Tarification', fields: [
      { id: 'eProperty', label: 'Logement', required: true },
      { id: 'eCurrent', label: 'Prix actuel (DH)', required: true },
      { id: 'eMin', label: 'Minimum' },
      { id: 'eMax', label: 'Maximum' },
      { id: 'eSeason', label: 'Saison' }
    ], save: function (v) { pricing.unshift({ property: v.eProperty, current: v.eCurrent, recommended: '', min: v.eMin, max: v.eMax, season: v.eSeason }); logAudit('Tarification', 'Creation', '', v.eProperty); persistOps(); } },
    channel: { title: 'Canal', fields: [
      { id: 'ePlatform', label: 'Plateforme', required: true },
      { id: 'eTypeC', label: 'Type', type: 'select', options: [{v:'OTA',l:'OTA'},{v:'Paiement',l:'Paiement'},{v:'IoT',l:'IoT'},{v:'Calendar',l:'Calendrier'},{v:'Pricing',l:'Tarification'},{v:'API',l:'API'},{v:'Webhook',l:'Webhook'},{v:'Messaging',l:'Messagerie'}] },
      { id: 'eId', label: 'Identifiant public (jamais de secret)' }
    ], save: function (v) { channels.push({ platform: v.ePlatform, type: v.eTypeC, id: v.eId, connected: false, sync: 'Non connecte', color: '#D4AF37', lastSync: '-', error: 'Configuration requise' }); logAudit('Canal', 'Ajout', '', v.ePlatform); persistOps(); } },
    'calendar-event': { title: 'Evenement calendrier', fields: [
      { id: 'eTitle', label: 'Titre', required: true },
      { id: 'eDate', label: 'Date', type: 'date', required: true },
      { id: 'eKind', label: 'Type', type: 'select', options: [{v:'reservation',l:'Reservation'},{v:'arrival',l:'Arrivee'},{v:'departure',l:'Depart'},{v:'block',l:'Blocage'},{v:'maintenance',l:'Maintenance'},{v:'cleaning',l:'Menage'}] }
    ], save: function (v) { notifications.unshift({ icon: 'fa-calendar', text: 'Evenement : ' + v.eTitle + ' (' + v.eDate + ')', time: 'a l\u2019instant', unread: true }); logAudit('Calendrier', 'Evenement', '', v.eTitle); persistOps(); } }
  };

  function newEntityForm(type, index) {
    var cfgE = ENTITY_FORMS[type];
    if (!cfgE) { openModal('Ajouter', '<div class="muted">Formulaire non disponible pour : ' + esc(type) + '.</div>'); modalForm._type = ''; return; }
    var html = cfgE.fields.map(function (f) {
      if (f.type === 'select') return field(f.label, f.id, (f.options[0] || {}).v, { type: 'select', options: f.options });
      return field(f.label, f.id, '', { type: f.type || 'text' });
    }).join('');
    openModal((index >= 0 ? 'Modifier ' : 'Ajouter ') + cfgE.title, html);
    modalForm._type = 'entity';
    modalForm._entity = type;
    modalForm._index = index;
    modalForm._save = cfgE.save;
  }

  /* Persist operational data (reservations, tasks, etc.) */
  var OPS_KEY = 'darmaroc-ops-data-v1';
  function persistOps() {
    try {
      localStorage.setItem(OPS_KEY, JSON.stringify({
        reservations: reservations, travelers: travelers, cleanings: cleanings,
        maintenances: maintenances, accesses: accesses, documents: documents,
        owners: owners, notifications: notifications, automations: automations,
        providers: providers, pricing: pricing, channels: channels
      }));
    } catch (e) {}
  }
  function loadOps() {
    try {
      var raw = localStorage.getItem(OPS_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (o.reservations) reservations = o.reservations;
      if (o.travelers) travelers = o.travelers;
      if (o.cleanings) cleanings = o.cleanings;
      if (o.maintenances) maintenances = o.maintenances;
      if (o.accesses) accesses = o.accesses;
      if (o.documents) documents = o.documents;
      if (o.owners) owners = o.owners;
      if (o.notifications) notifications = o.notifications;
      if (o.automations) automations = o.automations;
      if (o.providers) providers = o.providers;
      if (o.pricing) pricing = o.pricing;
      if (o.channels) channels = o.channels;
    } catch (e) {}
  }

  document.querySelectorAll('[data-new]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.dataset.new === 'service') serviceForm(-1);
      else if (btn.dataset.new === 'category') categoryForm(-1);
      else if (btn.dataset.new === 'testimonial') testimonialForm(-1);
      else if (btn.dataset.new === 'faq') faqForm(-1);
      else if (btn.dataset.new === 'showcase') showcaseForm(-1);
      else if (btn.dataset.new === 'partner') partnerForm(-1);
      else if (btn.dataset.new === 'property') propertyForm(-1);
      else if (btn.dataset.new === 'contact') contactForm(-1);
      else if (btn.dataset.new === 'user') userForm(-1);
      else newEntityForm(btn.dataset.new, -1);
    });
  });

  /* Correspondance type de bouton -> collection (propertys/faqs n'existent pas). */
  var COLMAP = { property: 'properties', service: 'services', category: 'categories', testimonial: 'testimonials', faq: 'faq', showcase: 'showcase', partner: 'partners', contact: 'contacts' };
  function colName(t) { return COLMAP[t] || (t + 's'); }

  document.body.addEventListener('click', function (e) {
    var editBtn = e.target.closest('[data-edit]');
    var delBtn = e.target.closest('[data-del]');
    if (editBtn) {
      var i = Number(editBtn.dataset.index);
      var et = editBtn.dataset.edit;
      var ecol = colName(et);
      var target = DB[ecol] ? DB[ecol][i] : undefined;
      if (!IS_ADMIN && target && (target.owner || '') !== USERNAME) { toast('Vous ne pouvez modifier que vos propres annonces.', true); return; }
      if (et === 'service') serviceForm(i);
      else if (et === 'category') categoryForm(i);
      else if (et === 'testimonial') testimonialForm(i);
      else if (et === 'faq') faqForm(i);
      else if (et === 'showcase') showcaseForm(i);
      else if (et === 'partner') partnerForm(i);
      else if (et === 'property') propertyForm(i);
      else if (et === 'contact') contactForm(i);
      else if (et === 'user') userForm(i);
    } else if (delBtn) {
      var idx = Number(delBtn.dataset.index);
      var type = delBtn.dataset.del;
      if (type === 'user') { deleteUser(idx); return; }
      var col = colName(type);
      var item = DB[col] ? DB[col][idx] : undefined;
      if (!IS_ADMIN && item && (item.owner || '') !== USERNAME) { toast('Vous ne pouvez supprimer que vos propres annonces.', true); return; }
      askConfirm('Supprimer cet élément ?', function () {
        DB[col].splice(idx, 1);
        if (window.DarMarocStore && window.DarMarocStore.hasBackend() && item && item.id) {
          window.DarMarocStore.deleteItem(col, item);
        } else {
          saveLocal();
        }
        renderAll();
        toast('Élément supprimé.');
      });
    }
  });

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  modalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (modalForm._confirm) {
      var cb = modal._onYes;
      modalForm._confirm = false;
      closeModal();
      if (cb) cb();
      return;
    }
    submitForm();
  });

  /* ---------- Utilisateurs (admin uniquement, stockés en base Supabase) ---------- */
  var appUsers = [];

  function hashPw(str) {
    if (window.crypto && crypto.subtle) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('00' + b.toString(16)).slice(-2); }).join('');
      });
    }
    return Promise.resolve('');
  }

  function usersHeaders() {
    return {
      apikey: window.Supabase.anonKey,
      Authorization: 'Bearer ' + window.Supabase.anonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal,resolution=merge-duplicates'
    };
  }

  function usersErrText(t) {
    try {
      var o = JSON.parse(t);
      if (o && o.code === 'PGRST205') {
        return 'Table admin_users absente : exécutez le SQL de création dans Supabase > SQL Editor (voir le message précédent).';
      }
      if (o && o.code) return (o.message || o.code) + (o.details ? ' — ' + o.details : '');
      return String(t);
    } catch (e) {
      return String(t);
    }
  }

  function loadUsers() {
    appUsers = [];
    var SB = window.Supabase;
    if (SB && SB.client && SB.isConfigured && SB.isConfigured()) {
      SB.client.from('admin_users').select('username, role, actif').order('username')
        .then(function (res) {
          if (!res.error) {
            appUsers = (res.data || []).filter(function (r) { return r.actif !== false; }).map(function (r) {
              return { user: r.username, role: r.role || 'contrib' };
            });
          }
          renderUsers();
        })
        .catch(function () { renderUsers(); });
    } else {
      var defs = (AUTH.defaultUsers) ? AUTH.defaultUsers() : [];
      appUsers = defs.map(function (d) { return { user: d.user, role: d.role }; });
      renderUsers();
    }
  }

  function renderUsers() {
    var body = document.getElementById('userBody');
    if (!body) return;
    body.innerHTML = appUsers.map(function (u, i) {
      return '<tr><td>' + esc(u.user) + '</td><td>' + (u.role === 'admin' ? 'Administrateur' : 'Contributeur') + '</td>' +
        '<td><div class="row-actions">' +
        '<button class="btn-icon" data-edit="user" data-index="' + i + '" title="Modifier"><i class="fas fa-pen"></i></button>' +
        '<button class="btn-icon danger" data-del="user" data-index="' + i + '" title="Supprimer"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    }).join('') || '<tr><td colspan="3" class="muted">Aucun utilisateur.</td></tr>';
  }

  function userForm(index) {
    var u = index >= 0 && appUsers[index] ? appUsers[index] : { user: '', role: 'contrib' };
    var roleOpts = [
      { v: 'contrib', l: 'Contributeur' },
      { v: 'admin', l: 'Administrateur' }
    ];
    openModal(index >= 0 ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur',
      '<div class="field"><label>Identifiant</label>' +
        '<input type="text" id="uUser" value="' + esc(u.user) + '"' + (index < 0 ? ' required minlength="3"' : ' minlength="3"') + ' placeholder="ex: user6">' +
        '</div>' +
        field('Rôle', 'uRole', u.role, { type: 'select', options: roleOpts }) +
        '<div class="field"><label>' + (index >= 0 ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe (8 caractères min.)') + '</label>' +
        '<input type="password" id="uPass"' + (index >= 0 ? '' : ' required minlength="8"') + ' placeholder="••••••••"></div>' +
        (index >= 0 ? '<small class="muted">Vous pouvez renommer l\'identifiant et/ou changer le mot de passe.</small>' : ''));
    modalForm._index = index;
    modalForm._type = 'user';
  }

  function submitUserForm() {
    var index = modalForm._index;
    var username = String(getVal('uUser') || '').trim();
    var role = getVal('uRole') || 'contrib';
    var pw = getVal('uPass');
    var SB = window.Supabase;
    if (!SB || !SB.client || !SB.isConfigured || !SB.isConfigured()) { toast('Supabase est requis pour gérer les utilisateurs.', true); return; }
    var isEdit = index >= 0 && appUsers[index];
    var oldName = isEdit ? appUsers[index].user : '';
    if (username.length < 3) { toast('Identifiant trop court (3+ caractères).', true); return; }
    if (isEdit && username === oldName && !pw) { toast('Aucune modification : changez le nom et/ou le mot de passe.', true); return; }
    function commit(hash) {
      var body = { username: username, role: role, actif: true };
      if (hash) body.pass_hash = hash;
      if (!isEdit) {
        fetch(SB.restUrl + '/admin_users?on_conflict=username', { method: 'POST', headers: usersHeaders(), body: JSON.stringify([body]) })
          .then(function (r) { return r.ok ? 'ok' : r.text(); })
          .then(function (t) {
            if (t === 'ok') { toast('Utilisateur ajouté.'); loadUsers(); closeModal(); }
            else { toast('Échec : ' + usersErrText(t), true); }
          })
          .catch(function () { toast('Échec de l\'ajout.', true); });
      } else {
        var headers = { apikey: SB.anonKey, Authorization: 'Bearer ' + SB.anonKey, 'Content-Type': 'application/json' };
        fetch(SB.restUrl + '/admin_users?username=eq.' + encodeURIComponent(oldName), { method: 'PATCH', headers: headers, body: JSON.stringify(body) })
          .then(function (r) { return r.ok ? 'ok' : r.text(); })
          .then(function (t) {
            if (t === 'ok') { toast('Utilisateur modifié.'); loadUsers(); closeModal(); }
            else { toast('Échec : ' + usersErrText(t), true); }
          })
          .catch(function () { toast('Échec de la modification.', true); });
      }
    }
    if (pw) {
      hashPw(pw).then(function (h) {
        if (!h) { toast('Hash impossible (crypto non supportée).', true); return; }
        commit(h);
      });
    } else {
      commit('');
    }
  }

  function deleteUser(index) {
    var u = appUsers[index];
    if (!u) return;
    if (u.user === 'darmaroc') { toast('Impossible de supprimer l\'administrateur principal.', true); return; }
    if (u.user === USERNAME) { toast('Vous ne pouvez pas supprimer votre propre compte.', true); return; }
    var SB = window.Supabase;
    askConfirm('Supprimer l\'utilisateur "' + u.user + '" ?', function () {
      fetch(SB.restUrl + '/admin_users?username=eq.' + encodeURIComponent(u.user), { method: 'DELETE', headers: usersHeaders() })
        .then(function (r) {
          if (r.ok) { toast('Utilisateur supprimé.'); loadUsers(); }
          else { r.text().then(function (t) { toast('Échec : ' + usersErrText(t), true); }); }
        })
        .catch(function () { toast('Échec de la suppression.', true); });
    });
  }

  /* ---------- Réglages ---------- */
  function fillSettings() {
    var s = DB.settings || {};
    document.getElementById('setSiteName').value = s.siteName || '';
    document.getElementById('setSloganFR').value = s.sloganFR || '';
    document.getElementById('setSloganAR').value = s.sloganAR || '';
    document.getElementById('setWhatsApp').value = s.whatsapp || '';
    document.getElementById('setEmail').value = s.email || '';
    document.getElementById('setPhoneFixed').value = s.phoneFixed || '';
    document.getElementById('setPhoneMobile1').value = s.phoneMobile1 || '';
    document.getElementById('setPhoneMobile2').value = s.phoneMobile2 || '';
  }

  document.getElementById('settingsForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!IS_ADMIN) { toast('Réservé à l\'administrateur.', true); return; }
    DB.settings = {
      siteName: getVal('setSiteName'),
      sloganFR: getVal('setSloganFR'),
      sloganAR: getVal('setSloganAR'),
      whatsapp: getVal('setWhatsApp'),
      email: getVal('setEmail'),
      phoneFixed: getVal('setPhoneFixed'),
      phoneMobile1: getVal('setPhoneMobile1'),
      phoneMobile2: getVal('setPhoneMobile2')
    };
    saveLocal();
    if (window.DarMarocStore && window.DarMarocStore.hasBackend()) {
      window.DarMarocStore.pushSettings(DB.settings);
    }
    toast('Réglages enregistrés.');
    if (typeof logAudit === 'function') logAudit('Paramètres', 'Modification', '', 'mis à jour');
  });

  document.getElementById('passForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!IS_ADMIN) { toast('Réservé à l\'administrateur.', true); return; }
    var np = document.getElementById('newPass').value;
    if (np.length < 8) { toast('Mot de passe trop court (8+ caractères).', true); return; }
    hashPw(np).then(function (hash) {
      if (!hash) { toast('Mise à jour impossible (crypto non supportée).', true); return; }
      try { localStorage.setItem('darmaroc-admin-hash', hash); } catch (err) {}
      var SB = window.Supabase;
      if (SB && SB.client && SB.isConfigured && SB.isConfigured() && USERNAME) {
        fetch(SB.restUrl + '/admin_users?on_conflict=username', {
          method: 'POST',
          headers: usersHeaders(),
          body: JSON.stringify([{ username: USERNAME, pass_hash: hash, actif: true }])
        });
      }
      toast('Mot de passe mis à jour.');
      logAudit('Sécurité', 'Changement mot de passe', '***', '***');
      document.getElementById('newPass').value = '';
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', function () {
    window.DarMarocAuth.logout();
  });

  document.getElementById('roleLabel').textContent = IS_ADMIN ? 'Super Admin' : 'Contributeur';
  document.getElementById('userLabel').textContent = USERNAME || 'darmaroc';

  /* Contributeur : accès limité aux biens (ajout de photos et annonces). */
  if (!IS_ADMIN) {
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(function (l) {
      if (l.dataset.view !== 'properties') l.style.display = 'none';
    });
    document.querySelectorAll('.nav-link').forEach(function (l) { l.classList.remove('active'); });
    var propsLink = document.querySelector('.sidebar-nav .nav-link[data-view="properties"]');
    if (propsLink) propsLink.classList.add('active');
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
    var vp = document.getElementById('view-properties');
    if (vp) vp.classList.add('active');
    document.getElementById('viewTitle').textContent = 'Biens';
  }

  /* ---------- Mode de stockage ---------- */
  var modeEl = document.getElementById('storageMode');
  if (window.Supabase && window.Supabase.isConfigured && window.Supabase.isConfigured()) {
    modeEl.innerHTML = '<i class="fas fa-database"></i> Supabase PostgreSQL actif — données <strong>persistantes</strong> (photos dans le Storage). <span style="opacity:.7">[store ' + (window.DarMarocStore.VERSION || '?') + ']</span>';
  } else if (window.DarMarocUtils && window.DarMarocUtils.cmsEnabled()) {
    modeEl.innerHTML = '<i class="fas fa-fire"></i> Firebase Firestore actif — synchronisation temps réel.';
  } else {
    try {
      var usedKB = Math.round(JSON.stringify(DB).length / 1024);
      var pct = Math.round((usedKB / 5000) * 100);
      modeEl.innerHTML = '<i class="fas fa-database"></i> Stockage local (navigateur) — <strong>' + usedKB + ' Ko</strong> utilisés sur ~5 Mo (' + Math.min(100, pct) + ' %). Les photos sont compressées automatiquement. <a href="supabase/schema.sql" style="color:var(--gold);">Configurer Supabase →</a>';
    } catch (e) {}
  }

  /* ---------- Init ---------- */
  loadLocal();
  renderAll();
  if (IS_ADMIN) loadUsers();
  if (window.DarMarocStore && window.DarMarocStore.hasBackend()) {
    syncFromCloud();
  }

  /* ---------- Nouvelles sections 19 vues ---------- */

  /* CALENDRIER */
  function renderCalendar() {
    var grid = document.getElementById('calendarGrid');
    if (!grid) return;
    var now = new Date();
    var month = now.getMonth(), year = now.getFullYear();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var html = '<div class="cal-header" colspan="7">' + now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) + '</div>';
    ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'].forEach(function(d) { html += '<div class="cal-header">' + d + '</div>'; });
    for (var i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
    for (var d = 1; d <= daysInMonth; d++) {
      var isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
      html += '<div class="cal-day' + (isToday ? ' today' : '') + '"><div class="cal-date">' + d + '</div></div>';
    }
    grid.innerHTML = html;
  }

  /* RESERVATIONS */
  var reservations = [];
  function renderReservations() {
    var body = document.getElementById('resBody');
    if (!body) return;
    body.innerHTML = reservations.map(function(r) {
      return '<tr><td>' + esc(r.traveler) + '</td><td>' + esc(r.property) + '</td><td>' + r.dates + '</td><td><span class="status-badge ' + r.status + '">' + r.status + '</span></td><td>' + r.amount + '</td>' +
        '<td><div class="row-actions"><button class="btn-icon" data-edit="reservation"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucune reservation.</td></tr>';
  }

  /* VOYAGEURS */
  var travelers = [];
  function renderTravelers() {
    var body = document.getElementById('travelerBody');
    if (!body) return;
    body.innerHTML = travelers.map(function(t) {
      return '<tr><td>' + esc(t.name) + '</td><td>' + esc(t.email) + '</td><td>' + esc(t.phone) + '</td><td>' + esc(t.country) + '</td><td>' + t.lastVisit + '</td>' +
        '<td><div class="row-actions"><button class="btn-icon" data-edit="traveler"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucun voyageur.</td></tr>';
  }

  /* REVENUS */
  function renderRevenue() {
    var total = 0, paid = 0, pending = 0, month = 0;
    var now = new Date();
    var ym = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
    reservations.forEach(function (r) {
      var amt = Number(String(r.amount || '').replace(/[^0-9.]/g, '')) || 0;
      total += amt;
      if (r.status === 'confirmed' || r.status === 'paid') paid += amt; else pending += amt;
      if ((r.dates || '').indexOf(ym) === 0) month += amt;
    });
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('revTotal', total.toLocaleString('fr-FR'));
    set('revThisMonth', month.toLocaleString('fr-FR'));
    set('revPaid', paid.toLocaleString('fr-FR'));
    set('revPending', pending.toLocaleString('fr-FR'));
    var body = document.getElementById('revBody');
    if (body) {
      body.innerHTML = reservations.map(function (r, i) {
        return '<tr><td>' + esc(r.traveler || '—') + '</td><td>' + esc(r.property || '—') + '</td><td>' + esc(r.amount || '0') + '</td><td>' + esc(r.dates || '—') + '</td><td><span class="status-badge ' + (r.status === 'confirmed' || r.status === 'paid' ? 'confirmed' : 'pending') + '">' + esc(r.status || 'pending') + '</span></td>' +
          '<td><button class="btn-icon"><i class="fas fa-file-invoice"></i></button></td></tr>';
      }).join('') || '<tr><td colspan="6" class="muted">Aucun revenu enregistré (0 MAD).</td></tr>';
    }
  }

  /* MENAGE */
  var cleanings = [];
  function renderCleanings() {
    var body = document.getElementById('cleanBody');
    if (!body) return;
    body.innerHTML = cleanings.map(function(c) {
      return '<tr><td>' + esc(c.property) + '</td><td>' + c.date + '</td><td>' + c.type + '</td><td>' + c.duration + '</td><td><span class="status-badge ' + c.status + '">' + c.status + '</span></td>' +
        '<td><div class="row-actions"><button class="btn-icon"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucun menage.</td></tr>';
  }

  /* MAINTENANCE */
  var maintenances = [];
  function renderMaintenances() {
    var body = document.getElementById('maintBody');
    if (!body) return;
    body.innerHTML = maintenances.map(function(m) {
      return '<tr><td>' + esc(m.property) + '</td><td>' + esc(m.issue) + '</td><td class="priority-' + m.priority + '">' + m.priority + '</td><td>' + m.date + '</td><td><span class="status-badge ' + m.status + '">' + m.status + '</span></td>' +
        '<td><div class="row-actions"><button class="btn-icon"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucune maintenance.</td></tr>';
  }

  /* ACCES */
  var accesses = [];
  function renderAccesses() {
    var body = document.getElementById('accessBody');
    if (!body) return;
    body.innerHTML = accesses.map(function(a) {
      return '<tr><td>' + esc(a.property) + '</td><td>' + a.type + '</td><td>' + a.code + '</td><td>' + a.date + '</td><td><span class="status-badge ' + a.status + '">' + a.status + '</span></td>' +
        '<td><div class="row-actions"><button class="btn-icon"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucun acces.</td></tr>';
  }

  /* CONFORMITÉ */
  function renderCompliance() {
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('compOk', '0'); set('compPending', '0'); set('compWarn', '0'); set('compDocs', String(documents.length));
    var body = document.getElementById('compBody');
    if (body) body.innerHTML = owners.length || documents.length
      ? '<tr><td colspan="6" class="muted">Aucune vérification de conformité enregistrée. Ajoutez les documents de chaque bien.</td></tr>'
      : '<tr><td colspan="6" class="muted">Aucune donnée de conformité. Vérification humaine nécessaire pour toute obligation légale.</td></tr>';
  }

  /* CANAUX */
  var channels = [
    { platform: 'WhatsApp Business', type: 'Messaging', id: '+212 522 261 486', connected: true, sync: 'Actif', color: '#25D366', lastSync: '—', error: '' },
    { platform: 'Airbnb', type: 'OTA', id: '', connected: false, sync: 'Non connecté', color: '#FF5A5F', lastSync: '—', error: 'Configuration requise (API/partenaire)' },
    { platform: 'Booking.com', type: 'OTA', id: '', connected: false, sync: 'Non connecté', color: '#003580', lastSync: '—', error: 'Configuration requise (API/partenaire)' },
    { platform: 'Expedia', type: 'OTA', id: '', connected: false, sync: 'Non connecté', color: '#1B4D8F', lastSync: '—', error: 'Configuration requise (API/partenaire)' },
    { platform: 'iCal', type: 'Calendar', id: '', connected: false, sync: 'Non connecté', color: '#E91E63', lastSync: '—', error: 'URL iCal à fournir' },
    { platform: 'PriceLabs', type: 'Pricing', id: '', connected: false, sync: 'Non connecté', color: '#7C3AED', lastSync: '—', error: 'Configuration requise (API)' },
    { platform: 'Stripe', type: 'Paiement', id: '', connected: false, sync: 'Non connecté', color: '#635BFF', lastSync: '—', error: 'Configuration requise (clés Stripe)' },
    { platform: 'Tuya Smart', type: 'IoT', id: '', connected: false, sync: 'Non connecté', color: '#009688', lastSync: '—', error: 'Connexion requise (appareils Tuya)' },
    { platform: 'Webhook', type: 'Webhook', id: '', connected: false, sync: 'Non connecté', color: '#8B5CF6', lastSync: '—', error: 'Endpoint à configurer' },
    { platform: 'REST API', type: 'API', id: '', connected: false, sync: 'Non connecté', color: '#FF6B35', lastSync: '—', error: 'Configuration requise' }
  ];
  var channelLogs = [];
  function logChannel(name, msg) {
    channelLogs.unshift({ t: new Date().toLocaleString('fr-FR'), name: name, msg: msg });
    if (channelLogs.length > 50) channelLogs.pop();
    logAudit('Canal', name, '', msg);
  }
  function renderChannels() {
    var body = document.getElementById('chanBody');
    if (!body) return;
    body.innerHTML = channels.map(function(c, i) {
      var connClass = c.connected ? 'chan-connected' : 'chan-disconnected';
      var connLabel = c.connected ? 'Connecté' : 'Non connecté';
      var icon = c.connected ? 'fa-circle-check' : 'fa-circle-xmark';
      var iconFa = c.type === 'Messaging' ? 'comment-dots' : c.type === 'OTA' ? 'plane' : c.type === 'Paiement' ? 'credit-card' : c.type === 'IoT' ? 'lightbulb' : c.type === 'API' ? 'code' : c.type === 'Webhook' ? 'link' : c.type === 'Pricing' ? 'tags' : 'calendar';
      return '<tr><td><i class="fas fa-' + iconFa + '" style="color:' + (c.color || 'var(--gold)') + ';margin-right:8px;"></i> ' + esc(c.platform) + '</td>' +
        '<td>' + esc(c.type) + '</td>' +
        '<td>' + (c.id ? '<code style="font-size:0.8rem;">' + esc(c.id) + '</code>' : '<span class="muted">—</span>') + '</td>' +
        '<td class="' + connClass + '"><i class="fas ' + icon + '"></i> ' + connLabel + '</td>' +
        '<td>' + esc(c.sync) + '</td>' +
        '<td class="muted" style="font-size:0.78rem;">' + esc(c.error || c.lastSync || '—') + '</td>' +
        '<td><div class="row-actions">' +
        (c.connected
          ? '<button class="btn-icon" data-chdis="' + i + '" title="Déconnecter"><i class="fas fa-link-slash"></i></button>'
          : '<button class="btn-icon" data-chcon="' + i + '" title="Connecter"><i class="fas fa-plug"></i></button>') +
        '<button class="btn-icon" data-chtest="' + i + '" title="Tester"><i class="fas fa-vial"></i></button>' +
        '<button class="btn-icon" data-chsync="' + i + '" title="Synchroniser"><i class="fas fa-rotate"></i></button>' +
        '</div></td></tr>';
    }).join('') || '<tr><td colspan="7" class="muted">Aucun canal.</td></tr>';
    var logs = document.getElementById('chanLogs');
    if (logs) {
      logs.innerHTML = channelLogs.length
        ? channelLogs.map(function(l) { return '<div class="notif-item"><i class="fas fa-terminal notif-icon" style="color:var(--gold);"></i><div class="notif-text"><strong>' + esc(l.name) + '</strong> — ' + esc(l.msg) + '</div><div class="notif-time">' + esc(l.t) + '</div></div>'; }).join('')
        : '<p class="muted">Aucun journal de synchronisation.</p>';
    }
  }

  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-chcon]'))) {
      var ic = channels[+t.getAttribute('data-chcon')];
      ic.connected = true; ic.sync = 'Connecté'; ic.error = ''; ic.lastSync = new Date().toLocaleString('fr-FR');
      logChannel(ic.platform, 'Connecté (configuration manuelle). Secrets non affichés.');
      renderChannels(); toast(ic.platform + ' marqué connecté.');
    } else if ((t = e.target.closest('[data-chdis]'))) {
      var id = channels[+t.getAttribute('data-chdis')];
      id.connected = false; id.sync = 'Non connecté'; id.lastSync = '—';
      logChannel(id.platform, 'Déconnecté.');
      renderChannels(); toast(id.platform + ' déconnecté.');
    } else if ((t = e.target.closest('[data-chtest]'))) {
      var it = channels[+t.getAttribute('data-chtest')];
      if (!it.connected) { toast(it.platform + ' : non connecté — ' + (it.error || 'configuration requise') + '.', true); logChannel(it.platform, 'Test échoué : non connecté.'); }
      else { toast('Test ' + it.platform + ' : OK.'); logChannel(it.platform, 'Test réussi.'); }
      renderChannels();
    } else if ((t = e.target.closest('[data-chsync]'))) {
      var is = channels[+t.getAttribute('data-chsync')];
      if (!is.connected) { toast(is.platform + ' : synchronisation impossible (non connecté).', true); logChannel(is.platform, 'Sync refusée : non connecté.'); }
      else { is.lastSync = new Date().toLocaleString('fr-FR'); is.sync = 'Synchronisé'; toast('Synchronisation ' + is.platform + ' effectuée.'); logChannel(is.platform, 'Synchronisation OK.'); }
      renderChannels();
    }
  });

  function testConnection(platform) {
    toast('Test connexion ' + platform + '...');
  }

  /* AI MANAGER */
  function renderAIManager() {
    var req = document.getElementById('aiRequests');
    var acc = document.getElementById('aiAccuracy');
    var tasks = document.getElementById('aiTasks');
    var status = document.getElementById('aiStatus');
    var aiKey = (window.DARMAROC_CONFIG && window.DARMAROC_CONFIG.ai && window.DARMAROC_CONFIG.ai.gemini && window.DARMAROC_CONFIG.ai.gemini.apiKey) || '';
    var alerts = [];
    var newArr = reservations.filter(function (r) { return r.status === 'pending'; }).length;
    var today = new Date().toISOString().slice(0, 10);
    var arrivals = reservations.filter(function (r) { return (r.dates || '').indexOf(today) === 0 || (r.arrival === today); }).length;
    var cleanTodo = cleanings.filter(function (c) { return c.status !== 'done' && c.status !== 'confirmed'; }).length;
    var maintTodo = maintenances.filter(function (m) { return m.status !== 'done' && m.status !== 'completed'; }).length;
    if (newArr) alerts.push(newArr + ' réservation(s) en attente');
    if (arrivals) alerts.push(arrivals + ' arrivée(s) aujourd’hui');
    if (cleanTodo) alerts.push(cleanTodo + ' tâche(s) ménage');
    if (maintTodo) alerts.push(maintTodo + ' intervention(s) maintenance');
    if (!alerts.length) alerts.push('Aucune alerte opérationnelle pour le moment.');
    if (req) req.textContent = '0';
    if (acc) acc.textContent = aiKey ? '—' : '—';
    if (tasks) tasks.textContent = String(cleanTodo + maintTodo);
    if (status) {
      status.innerHTML = aiKey
        ? '<div class="ai-indicator online"><i class="fas fa-circle-check"></i> IA configurée (Gemini) — analyse locale des données.</div>'
        : '<div class="ai-indicator offline"><i class="fas fa-circle-xmark"></i> IA non connectée — configuration requise (clé Gemini dans config/site-config.js).</div>';
      status.innerHTML += '<div class="ai-indicator pending" style="margin-top:8px;display:block;"><i class="fas fa-lightbulb"></i> ' + alerts.map(esc).join(' · ') + '</div>';
      status.innerHTML += '<p class="muted" style="margin-top:8px;">Niveaux : 🟢 Automatique (risque faible) · 🟠 Validation requise · 🔴 Humain obligatoire (juridique, litiges, remboursements).</p>';
    }
    var btn = document.getElementById('aiGenBtn');
    if (btn && !btn._bound) {
      btn._bound = true;
      btn.addEventListener('click', function () {
        var result = document.getElementById('aiGenResult');
        if (!result) return;
        if (!aiKey) {
          result.innerHTML = '<div class="ai-indicator offline"><i class="fas fa-circle-xmark"></i> Génération indisponible : configurez la clé Gemini dans config/site-config.js.</div>';
          return;
        }
        result.innerHTML = '<div class="ai-indicator pending"><i class="fas fa-spinner fa-spin"></i> Génération en cours...</div>';
        var type = document.getElementById('aiGenType').value;
        if (window.DarMarocAI && window.DarMarocAI.generate) {
          window.DarMarocAI.generate(type).then(function (text) {
            result.innerHTML = '<textarea rows="6" style="width:100%;box-sizing:border-box;background:var(--bg-soft);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:12px;">' + esc(text || '') + '</textarea>';
          }).catch(function () {
            result.innerHTML = '<div class="ai-indicator offline"><i class="fas fa-circle-xmark"></i> Erreur IA — vérifiez la clé et le quota.</div>';
          });
        } else {
          result.innerHTML = '<div class="ai-indicator offline"><i class="fas fa-circle-xmark"></i> Module DarMarocAI absent.</div>';
        }
      });
    }
  }

  /* DOCUMENTS */
  var documents = [];
  function renderDocuments() {
    var body = document.getElementById('docBody');
    if (!body) return;
    body.innerHTML = documents.map(function(d) {
      return '<tr><td><div class="doc-item"><i class="fas fa-file-pdf doc-icon"></i><div class="doc-info"><div class="doc-name">' + esc(d.name) + '</div><div class="doc-meta">' + d.type + ' · ' + d.size + ' · ' + d.date + '</div></div></div></td><td><button class="btn-icon"><i class="fas fa-download"></i></button></td></tr>';
    }).join('') || '<tr><td colspan="5" class="muted">Aucun document.</td></tr>';
  }

  /* NOTIFICATIONS */
  var notifications = [];
  function renderNotifications() {
    var list = document.getElementById('notifList');
    if (!list) return;
    list.innerHTML = notifications.map(function(n) {
      return '<div class="notif-item ' + (n.unread ? 'unread' : '') + '"><i class="fas ' + n.icon + ' notif-icon" style="color:var(--gold);"></i><div class="notif-text">' + esc(n.text) + '</div><div class="notif-time">' + n.time + '</div></div>';
    }).join('') || '<p class="muted">Aucune notification.</p>';
    var btn = document.getElementById('notifReadAll');
    if (btn) {
      btn.addEventListener('click', function () {
        notifications.forEach(function (n) { n.unread = false; });
        renderNotifications();
        toast('Tout les notifications lues.');
      });
    }
  }

  /* RAPPORTS */
  function renderReports() {
    var st = window.DarMarocStats ? window.DarMarocStats.summary() : null;
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('repVues', st ? (st.views || 0).toLocaleString('fr-FR') : '0');
    set('repVisiteurs', '0');
    set('repRev', '0 MAD');
    set('repTaux', '0%');
  }

  /* AUTOMATISATIONS (center) */
  var automations = [
    { trigger: 'Nouvelle réservation', action: 'Créer tâche ménage + notifier', active: true, last: '—' },
    { trigger: 'Départ voyageur', action: 'Programmer contrôle logement', active: true, last: '—' },
    { trigger: 'Arrivée voyageur', action: 'Préparer message d\u2019accueil', active: false, last: '—' },
    { trigger: 'Document proche expiration', action: 'Alerte gestionnaire', active: true, last: '—' },
    { trigger: 'Paiement reçu', action: 'Mettre à jour dossier', active: true, last: '—' },
    { trigger: 'Réservation annulée', action: 'Libérer calendrier', active: false, last: '—' },
    { trigger: 'Anomalie calendrier', action: 'Notification admin', active: true, last: '—' }
  ];
  function renderAutomations() {
    var body = document.getElementById('autoBody');
    if (!body) return;
    body.innerHTML = automations.map(function(a, i) {
      return '<tr><td>' + esc(a.trigger) + '</td><td>' + esc(a.action) + '</td><td><div class="toggle ' + (a.active ? 'on' : '') + '" data-idx="' + i + '"></div></td><td>' + a.last + '</td>' +
        '<td><div class="row-actions"><button class="btn-icon"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="5" class="muted">Aucune automatisation.</td></tr>';
    body.querySelectorAll('.toggle').forEach(function(t) {
      t.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        automations[idx].active = !automations[idx].active;
        this.classList.toggle('on');
        logAudit('Automatisation', automations[idx].trigger, automations[idx].active ? 'désactivée' : 'activée', automations[idx].active ? 'activée' : 'désactivée');
        toast('Automatisation ' + (automations[idx].active ? 'activée' : 'désactivée') + '.');
      });
    });
  }

  /* PROPRIÉTAIRES */
  var owners = [];
  function renderOwners() {
    var body = document.getElementById('ownerBody');
    if (!body) return;
    body.innerHTML = owners.map(function(o) {
      return '<tr><td>' + esc(o.name) + '</td><td>' + esc(o.email) + '</td><td>' + esc(o.phone) + '</td><td>' + o.props + '</td><td>' + o.commission + '</td>' +
        '<td><div class="row-actions"><button class="btn-icon"><i class="fas fa-pen"></i></button><button class="btn-icon danger"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucun proprietaire.</td></tr>';
  }


  /* Connecteur test */
  window.testConnection = function(platform) {
    toast('Test de connexion a ' + platform + ' en cours...');
  };

  /* Connectors data */
  var connectors = [];

  /* Webhook & API management */
  var webhooks = [];

  function renderWebhooks() {
    var body = document.getElementById('webhookBody');
    if (!body) return;
    body.innerHTML = webhooks.map(function(w) {
      return '<tr><td><code style="font-size:0.75rem;">' + esc(w.url) + '</code></td><td>' + esc(w.event) + '</td><td><span class="status-badge ' + (w.active ? 'confirmed' : 'pending') + '">' + (w.active ? 'Actif' : 'Inactif') + '</span></td>' +
        '<td><div class="toggle ' + (w.active ? 'on' : '') + '"></div></td><td><button class="btn-icon"><i class="fas fa-pen"></i></button></td></tr>';
    }).join('') || '<tr><td colspan="5" class="muted">Aucun webhook.</td></tr>';
  }

  /* ---------- Audit log ---------- */
  var auditLog = [];
  try { auditLog = JSON.parse(localStorage.getItem('darmaroc-audit-log') || '[]'); } catch (e) { auditLog = []; }
  function logAudit(object, action, oldV, newV) {
    auditLog.unshift({
      user: USERNAME || 'darmaroc',
      role: ROLE || 'admin',
      action: action || '',
      object: object || '',
      oldV: oldV || '',
      newV: newV || '',
      at: new Date().toISOString()
    });
    if (auditLog.length > 500) auditLog.pop();
    try { localStorage.setItem('darmaroc-audit-log', JSON.stringify(auditLog)); } catch (e) {}
  }
  function renderAudit() {
    var body = document.getElementById('auditBody');
    if (!body) return;
    body.innerHTML = auditLog.map(function (a) {
      return '<tr><td>' + esc(a.user) + '</td><td>' + esc(a.action) + '</td><td>' + esc(a.object) + '</td><td class="muted">' + esc(a.oldV) + '</td><td>' + esc(a.newV) + '</td><td class="muted" style="font-size:0.78rem;">' + esc(new Date(a.at).toLocaleString('fr-FR')) + '</td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucune activité enregistrée.</td></tr>';
  }

  /* ---------- Prestataires ---------- */
  var providers = [];
  function renderPrestataires() {
    var body = document.getElementById('provBody');
    if (!body) return;
    body.innerHTML = providers.map(function (p, i) {
      return '<tr><td>' + esc(p.name) + '</td><td>' + esc(p.trade) + '</td><td>' + esc(p.phone || '—') + '</td><td>' + esc(p.email || '—') + '</td><td>' + esc(p.tasks || 0) + '</td>' +
        '<td><div class="row-actions"><button class="btn-icon" data-prov-edit="' + i + '"><i class="fas fa-pen"></i></button><button class="btn-icon danger" data-prov-del="' + i + '"><i class="fas fa-trash"></i></button></div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">Aucun prestataire.</td></tr>';
  }

  /* ---------- Tarification ---------- */
  var pricing = [];
  function renderTarifs() {
    var body = document.getElementById('priceBody');
    if (!body) return;
    body.innerHTML = pricing.map(function (p, i) {
      return '<tr><td>' + esc(p.property) + '</td><td>' + esc(p.current) + '</td><td>' + esc(p.recommended || '—') + '</td><td>' + esc(p.min || '—') + '</td><td>' + esc(p.max || '—') + '</td><td>' + esc(p.season || '—') + '</td>' +
        '<td><div class="row-actions">' + (p.recommended ? '<button class="btn-icon" data-price-accept="' + i + '" title="Accepter"><i class="fas fa-check"></i></button><button class="btn-icon danger" data-price-reject="' + i + '" title="Refuser"><i class="fas fa-xmark"></i></button>' : '<span class="muted">—</span>') + '</div></td></tr>';
    }).join('') || '<tr><td colspan="7" class="muted">Aucune tarification configurée. PriceLabs non connecté.</td></tr>';
    var note = document.getElementById('priceAiNote');
    if (note) note.textContent = pricing.some(function (p) { return p.recommended; })
      ? 'Le tarif recommandé a changé parce que la demande prévue pour cette période est différente. Accepter ou refuser la recommandation.'
      : 'Aucune recommandation tarifaire pour le moment (PriceLabs non connecté).';
  }

  /* ---------- Rôles ---------- */
  var ROLES = [
    { key: 'admin', label: 'Admin DarMaroc', perms: ['all'] },
    { key: 'gestionnaire', label: 'Gestionnaire', perms: ['properties', 'calendar', 'reservations', 'cleaning', 'maintenance', 'access', 'reports'] },
    { key: 'proprietaire', label: 'Propriétaire', perms: ['own-properties', 'own-revenue', 'own-reports', 'own-documents'] },
    { key: 'prestataire', label: 'Prestataire', perms: ['assigned-cleaning', 'assigned-maintenance'] },
    { key: 'lecteur', label: 'Lecteur / Support', perms: ['view-only'] }
  ];
  function renderRoles() {
    var body = document.getElementById('roleBody');
    if (!body) return;
    body.innerHTML = ROLES.map(function (r) {
      return '<tr><td><strong>' + esc(r.label) + '</strong></td><td>' + esc(r.perms.join(', ')) + '</td><td>' + (r.key === 'admin' ? '<span class="muted">Verrouillé</span>' : '<button class="btn-icon" data-role-edit="' + esc(r.key) + '"><i class="fas fa-pen"></i></button>') + '</td></tr>';
    }).join('');
  }

  /* ---------- KPIs + AI zone (overview) ---------- */
  function renderOverviewKPIs() {
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    var activeProps = DB.properties.length;
    set('kpiActive', String(activeProps));
    set('kpiAvailable', String(activeProps));
    set('kpiReservations', String(reservations.length));
    var today = new Date().toISOString().slice(0, 10);
    set('kpiArrivals', String(reservations.filter(function (r) { return r.arrival === today || (r.dates || '').indexOf(today) === 0; }).length));
    set('kpiDepartures', String(reservations.filter(function (r) { return r.departure === today || (r.dates || '').indexOf(today) > -1 && (r.dates || '').indexOf(today) === (r.dates || '').length - 10; }).length));
    set('kpiOccupancy', activeProps ? '0%' : '0%');
    var rev = 0; reservations.forEach(function (r) { rev += Number(String(r.amount || '').replace(/[^0-9.]/g, '')) || 0; });
    set('kpiRevenue', rev.toLocaleString('fr-FR') + ' MAD');
    set('kpiPendingPay', String(reservations.filter(function (r) { return r.status === 'pending'; }).length));
    set('kpiCleaning', String(cleanings.filter(function (c) { return c.status !== 'done'; }).length));
    set('kpiMaint', String(maintenances.filter(function (m) { return m.status !== 'done'; }).length));
    set('kpiAlerts', String(notifications.filter(function (n) { return n.unread; }).length));
    set('kpiDocs', String(documents.length));
    var ai = document.getElementById('aiOverview');
    if (ai) {
      var lines = [];
      var newArr = reservations.filter(function (r) { return r.status === 'pending'; }).length;
      if (newArr) lines.push(newArr + ' nouvelle(s) réservation(s) en attente');
      var arr = reservations.filter(function (r) { return r.arrival === today; }).length;
      if (arr) lines.push(arr + ' arrivée(s) aujourd’hui');
      var cl = cleanings.filter(function (c) { return c.status !== 'done'; }).length;
      if (cl) lines.push(cl + ' tâche(s) ménage');
      if (documents.length) lines.push(documents.length + ' document(s) à vérifier');
      var un = notifications.filter(function (n) { return n.unread; }).length;
      if (un) lines.push(un + ' anomalie(s)/notification(s)');
      ai.innerHTML = lines.length
        ? lines.map(function (l) { return '<div class="ai-indicator pending" style="display:block;margin:4px 0;"><i class="fas fa-circle-info"></i> ' + esc(l) + ' — <button class="btn-icon" style="width:auto;padding:2px 8px;height:auto;" data-ai-action="1">Agir</button></div>'; }).join('')
        : '<div class="ai-indicator online"><i class="fas fa-circle-check"></i> Rien à signaler pour le moment.</div>';
    }
  }

  function renderAllExtended() {
    renderOverviewKPIs();
    renderCalendar();
    renderReservations();
    renderWebhooks();
    renderTravelers();
    renderRevenue();
    renderCleanings();
    renderMaintenances();
    renderAccesses();
    renderCompliance();
    renderChannels();
    renderAIManager();
    renderDocuments();
    renderNotifications();
    renderReports();
    renderAutomations();
    renderOwners();
    renderPrestataires();
    renderTarifs();
    renderAudit();
    renderRoles();
  }

  /* ---------- Navigation 19 sections ---------- */
  function switchView(view) {
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
    var target = document.getElementById('view-' + view);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-link').forEach(function (l) { l.classList.remove('active'); });
    var navLink = document.querySelector('.nav-link[data-view="' + view + '"]');
    if (navLink) navLink.classList.add('active');
    var titles = {
      overview: 'Tableau de bord', stats: 'Statistiques', properties: 'Mes biens', owners: 'Proprietaires',
      calendar: 'Calendrier', reservations: 'Reservations', travelers: 'Voyageurs', revenue: 'Revenus',
      cleaning: 'Menage', maintenance: 'Maintenance', access: 'Acces', compliance: 'Conformite',
      showcase: 'Demonstration', partners: 'Partenaires', channels: 'Canaux', 'ai-manager': 'AI Manager',
      automations: 'Automatisations', services: 'Services', categories: 'Categories', testimonials: 'Temoignages',
      faq: 'FAQ', contacts: 'Contacts', documents: 'Documents', notifications: 'Notifications',
      reports: 'Rapports', settings: 'Reglages', users: 'Utilisateurs',
      prestataires: 'Prestataires', pricing: 'Tarification', audit: 'Journal d\u2019activite', roles: 'Roles & permissions'
    };
    var titleEl = document.getElementById('viewTitle');
    if (titleEl) titleEl.textContent = titles[view] || 'Tableau de bord';
    renderAllExtended();
    renderWebhooks();
  }

    /* ---------- Init ---------- */
  if (typeof loadOps === 'function') loadOps();
  renderAllExtended();
})();
