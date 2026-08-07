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
    DB.testimonials = (staticData.testimonials || []).map(function (t) { return { id: t.id || uid(), name: t.name, city: t.city || '', rating: t.rating || 5, fr: t.fr, ar: t.ar || '' }; });
    DB.faq = (staticData.faq || []).map(function (q) { return { id: q.id || uid(), fr: q.fr, ar: q.ar, aFR: q.aFR || '', aAR: q.aAR || '' }; });
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
    seedProperties();
    DB.settings = {
      siteName: (cfg.site && cfg.site.name) || 'DarMaroc',
      sloganFR: (cfg.site && cfg.site.sloganFR) || '',
      sloganAR: (cfg.site && cfg.site.sloganAR) || '',
      whatsapp: (cfg.whatsapp && cfg.whatsapp.number) || '',
      email: (cfg.site && cfg.site.email) || '',
      phoneFixed: (cfg.site && cfg.site.phoneFixed) || ''
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
    var cols = ['properties', 'services', 'categories', 'testimonials', 'faq', 'showcase'];
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
          phoneFixed: s.telephone_fixe || DB.settings.phoneFixed
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

  function renderAll() {
    renderProperties();
    renderShowcase();
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
    document.querySelectorAll('.nav-link').forEach(function (l) { l.classList.remove('active'); });
    link.classList.add('active');
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
    document.getElementById('view-' + link.dataset.view).classList.add('active');
    var titles = { overview: 'Aperçu', stats: 'Statistiques', properties: 'Biens', showcase: 'Démonstration', services: 'Services', categories: 'Catégories', testimonials: 'Témoignages', faq: 'FAQ', settings: 'Réglages', users: 'Utilisateurs' };
    document.getElementById('viewTitle').textContent = titles[link.dataset.view] || 'Aperçu';
    document.getElementById('sidebar').classList.remove('open');
  });

  document.getElementById('menuToggle').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('open');
  });

  var statsRefreshBtn = document.getElementById('statsRefresh');
  if (statsRefreshBtn) {
    statsRefreshBtn.addEventListener('click', function () {
      renderStats();
      toast('Statistiques actualisées.');
    });
  }

  document.querySelectorAll('[data-new]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.dataset.new === 'service') serviceForm(-1);
      else if (btn.dataset.new === 'category') categoryForm(-1);
      else if (btn.dataset.new === 'testimonial') testimonialForm(-1);
      else if (btn.dataset.new === 'faq') faqForm(-1);
      else if (btn.dataset.new === 'showcase') showcaseForm(-1);
      else if (btn.dataset.new === 'property') propertyForm(-1);
      else if (btn.dataset.new === 'user') userForm(-1);
    });
  });

  /* Correspondance type de bouton -> collection (propertys/faqs n'existent pas). */
  var COLMAP = { property: 'properties', service: 'services', category: 'categories', testimonial: 'testimonials', faq: 'faq', showcase: 'showcase' };
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
      else if (et === 'property') propertyForm(i);
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
      phoneFixed: getVal('setPhoneFixed')
    };
    saveLocal();
    if (window.DarMarocStore && window.DarMarocStore.hasBackend()) {
      window.DarMarocStore.pushSettings(DB.settings);
    }
    toast('Réglages enregistrés.');
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
})();
