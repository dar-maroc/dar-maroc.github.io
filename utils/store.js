/* ============================================================
   DAR MAROC - COUCHE DE DONNÉES (utils/store.js)
   Accès unifié aux données : Supabase (PostgreSQL) quand configuré,
   sinon localStorage (mode dégradé). Les objets manipulés par le
   dashboard et le site public gardent la même forme qu'avant
   (fr, ar, cat, price, photos, ...) : la conversion vers les
   colonnes SQL est faite ici, au niveau du store.
   ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'darmaroc-admin-data-v1';
  var Supabase = window.Supabase || {};

  /* Table SQL de chaque collection du dashboard. */
  var TABLES = {
    properties: 'annonces',
    services: 'services',
    categories: 'categories',
    testimonials: 'temoignages',
    faq: 'faq',
    showcase: 'showcase'
  };

  function client() { return Supabase.client; }

  /* Les IDs générés par le dashboard (ex: "idxxxx...", "p1") ne sont pas des
     UUID. On en dérive un UUID v4 déterministe pour que l'upsert mette à jour
     la même ligne au lieu d'en créer une nouvelle à chaque sauvegarde. */
  function validUuid(id) {
    return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : '';
  }

  function localUuid(seed) {
    var s = 'darmaroc|' + String(seed) + '|v1';
    var hex = '';
    for (var round = 0; round < 4; round++) {
      var h = (2166136261 ^ round) >>> 0;
      for (var i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      hex += ('00000000' + h.toString(16)).slice(-8);
    }
    hex = hex.slice(0, 12) + '4' + hex.slice(13, 16) + '8' + hex.slice(17);
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20, 32);
  }

  function randomUuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function effectiveId(id) {
    if (!id) return randomUuid();
    var u = validUuid(id);
    return u || localUuid(id);
  }

  function hasBackend() {
    return !!(Supabase.isConfigured && Supabase.isConfigured() && client());
  }

  /* ---------- Conversion objet dashboard -> ligne SQL ---------- */
  function mapToTable(collection, item) {
    if (collection === 'properties') {
      var num = function (v) { return (v === '' || v == null) ? null : Number(v); };
      var web = function (u) { return /^https?:\/\//i.test(String(u || '')) ? String(u) : ''; };
      var ph = (item.photos || []).map(web).filter(Boolean);
      return {
        id: effectiveId(item.id),
        titre_fr: item.fr || '',
        titre_ar: item.ar || '',
        type: item.cat || 'sale',
        prix: item.price || '',
        prix_numeric: item.price ? Number(String(item.price).replace(/[^\d]/g, '')) || null : null,
        periode: item.period || '',
        ville: item.city || '',
        pays: item.pays || '',
        categorie: item.categorie || '',
        surface: num(item.area),
        chambres: num(item.beds),
        sdb: num(item.baths),
        delai: item.time || '',
        style_decoration: item.style || '',
        photos: ph,
        image_principale: ph[0] || web(item.img) || '',
        photo_dates: item.photoDates || [],
        lien_externe: item.link || '',
        video_youtube: item.video || '',
        href_secours: item.href || 'contact.html',
        owner: item.owner || '',
        date_depot: item.createdAt || undefined,
        statut: item.statut || 'publie',
        actif: item.actif !== false
      };
    }
    if (collection === 'services') {
      return {
        id: effectiveId(item.id),
        nom_fr: item.fr || '',
        nom_ar: item.ar || '',
        categorie: item.cat || '',
        icon: item.icon || 'fa-wrench',
        description_fr: item.desc || '',
        description_ar: item.descAr || '',
        href: item.href || 'services.html',
        img: item.img || '',
        alt: item.alt || '',
        ordre: typeof item.delay === 'number' ? item.delay : 0,
        cree_le: item.createdAt || undefined
      };
    }
    if (collection === 'categories') {
      return { id: effectiveId(item.id), nom_fr: item.fr || '', nom_ar: item.ar || '', icon: item.icon || 'fa-layer-group' };
    }
    if (collection === 'testimonials') {
      return { id: effectiveId(item.id), nom: item.name || '', ville: item.city || '', note: Number(item.rating) || 5, texte_fr: item.fr || '', texte_ar: item.ar || '' };
    }
    if (collection === 'faq') {
      return { id: effectiveId(item.id), question_fr: item.fr || '', question_ar: item.ar || '', reponse_fr: item.aFR || '', reponse_ar: item.aAR || '' };
    }
    if (collection === 'showcase') {
      return {
        id: effectiveId(item.id),
        badge: item.badge || 'sale',
        titre_fr: item.fr || '',
        titre_ar: item.ar || '',
        surface: item.surface || '',
        chambres: item.beds || '',
        sdb: item.baths || '',
        prix: item.price || '',
        periode: item.period || '',
        img: item.img || '',
        alt: item.alt || '',
        ordre: typeof item.delay === 'number' ? item.delay : 0,
        actif: item.actif !== false,
        cree_le: item.createdAt || undefined
      };
    }
    return item;
  }

  /* ---------- Conversion ligne SQL -> objet dashboard ---------- */
  function mapFromTable(collection, row) {
    if (!row) return row;
    if (collection === 'properties') {
      return {
        id: row.id,
        fr: row.titre_fr || '',
        ar: row.titre_ar || '',
        cat: row.type || 'sale',
        price: row.prix || '',
        period: row.periode || '',
        city: row.ville || '',
        pays: row.pays || '',
        categorie: row.categorie || '',
        area: row.surface == null ? '' : String(row.surface),
        beds: row.chambres == null ? '' : String(row.chambres),
        baths: row.sdb == null ? '' : String(row.sdb),
        time: row.delai || '',
        style: row.style_decoration || '',
        photos: row.photos || [],
        photoDates: row.photo_dates || [],
        img: (row.photos && row.photos[0]) || row.image_principale || '',
        link: row.lien_externe || '',
        video: row.video_youtube || '',
        alt: row.alt || '',
        href: row.href_secours || 'contact.html',
        owner: row.owner || '',
        createdAt: row.date_depot || '',
        statut: row.statut || 'publie'
      };
    }
    if (collection === 'services') {
      return {
        id: row.id,
        fr: row.nom_fr || '',
        ar: row.nom_ar || '',
        cat: row.categorie || '',
        icon: row.icon || 'fa-wrench',
        desc: row.description_fr || '',
        descAr: row.description_ar || '',
        href: row.href || 'services.html',
        img: row.img || '',
        alt: row.alt || '',
        delay: typeof row.ordre === 'number' ? row.ordre : 0,
        createdAt: row.cree_le || ''
      };
    }
    if (collection === 'categories') {
      return { id: row.id, fr: row.nom_fr || '', ar: row.nom_ar || '', icon: row.icon || 'fa-layer-group' };
    }
    if (collection === 'testimonials') {
      return { id: row.id, name: row.nom || '', city: row.ville || '', rating: row.note, fr: row.texte_fr || '', ar: row.texte_ar || '' };
    }
    if (collection === 'faq') {
      return { id: row.id, fr: row.question_fr || '', ar: row.question_ar || '', aFR: row.reponse_fr || '', aAR: row.reponse_ar || '' };
    }
    if (collection === 'showcase') {
      return {
        id: row.id,
        badge: row.badge || 'sale',
        fr: row.titre_fr || '',
        ar: row.titre_ar || '',
        surface: row.surface || '',
        beds: row.chambres || '',
        baths: row.sdb || '',
        price: row.prix || '',
        period: row.periode || '',
        img: row.img || '',
        alt: row.alt || '',
        delay: typeof row.ordre === 'number' ? row.ordre : 0,
        createdAt: row.cree_le || ''
      };
    }
    return row;
  }

  /* ---------- localStorage (cache + mode dégradé) ---------- */
  function readLocal() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw) || {};
    } catch (e) {}
    return {};
  }
  function writeLocal(db) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) {}
  }
  function localCollection(collection) {
    return readLocal()[collection] || [];
  }
  function cacheCollection(collection, items) {
    var db = readLocal();
    db[collection] = items;
    writeLocal(db);
  }

  /* ---------- Synchronisation des images (table relationnelle) ---------- */
  function syncImages(annonceId, photos) {
    var c = client();
    if (!c || !annonceId) return Promise.resolve();
    return c.from('images').delete().eq('annonce_id', annonceId).then(function () {
      var rows = (photos || []).map(function (url, i) {
        return { annonce_id: annonceId, url: url, ordre: i, principale: i === 0, alt: '' };
      });
      if (!rows.length) return Promise.resolve();
      return c.from('images').insert(rows);
    });
  }

  /* ---------- API publique ---------- */

  /* Colonne de tri date par collection (les autres tables n'ont pas de date). */
  var ORDER_COLS = { properties: 'date_depot', services: 'cree_le', showcase: 'ordre' };

  /* Lit une collection (Supabase si dispo, sinon localStorage). */
  function fetchCollection(collection) {
    if (!hasBackend()) {
      return Promise.resolve(localCollection(collection).slice());
    }
    var c = client();
    var q = c.from(TABLES[collection]).select('*');
    var orderCol = ORDER_COLS[collection];
    if (orderCol) q = q.order(orderCol, { ascending: false });
    return q
      .then(function (res) {
        if (res.error) return localCollection(collection).slice();
        var items = (res.data || []).map(function (r) { return mapFromTable(collection, r); });
        cacheCollection(collection, items);
        return items;
      });
  }

  /* Enregistre une collection entière (Supabase + cache localStorage).
     On passe par fetch direct avec "resolution=merge-duplicates" :
     sans ce header, PostgREST renvoie 409 dès qu'un ID existe déjà et
     l'ensemble du lot est rejeté (les nouvelles annonces aussi). */
  function pushCollection(collection, items) {
    cacheCollection(collection, items);
    if (!hasBackend()) return Promise.resolve(false);
    var url = Supabase.restUrl;
    if (!url) return Promise.resolve(false);
    var rows = items.map(function (it) { return mapToTable(collection, it); });
    var table = TABLES[collection];
    var headers = {
      apikey: Supabase.anonKey,
      Authorization: 'Bearer ' + Supabase.anonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal,resolution=merge-duplicates'
    };
    return fetch(url + '/' + table + '?on_conflict=id', { method: 'POST', headers: headers, body: JSON.stringify(rows) })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (txt) {
            try { console.warn('Supabase upsert ' + table + ':', txt); } catch (e) {}
            return false;
          });
        }
        if (collection === 'properties') {
          return Promise.all(rows.map(function (r) {
            if (!r.id) return Promise.resolve();
            return syncImages(r.id, r.photos);
          })).then(function () { return true; });
        }
        return true;
      })
      .catch(function (e) {
        try { console.warn('Supabase upsert ' + table + ':', e); } catch (e2) {}
        return false;
      });
  }

  /* Supprime un élément (Supabase + cache localStorage). */
  function deleteItem(collection, item) {
    var items = localCollection(collection);
    var filtered = items.filter(function (it) {
      if (item.id && it.id) return it.id !== item.id;
      return it !== item;
    });
    cacheCollection(collection, filtered);
    if (!hasBackend() || !item || !item.id) return Promise.resolve(false);
    var c = client();
    return c.from(TABLES[collection]).delete().eq('id', effectiveId(item.id)).then(function (res) {
      if (res.error) { try { console.warn('Supabase delete:', res.error); } catch (e) {} return false; }
      return true;
    });
  }

  /* ---------- Paramètres (key/value) ---------- */
  function pushSettings(settings) {
    if (!hasBackend()) return Promise.resolve(false);
    var url = Supabase.restUrl;
    if (!url) return Promise.resolve(false);
    var rows = [
      { cle: 'site_nom', valeur: settings.siteName || '' },
      { cle: 'slogan_fr', valeur: settings.sloganFR || '' },
      { cle: 'slogan_ar', valeur: settings.sloganAR || '' },
      { cle: 'whatsapp', valeur: settings.whatsapp || '' },
      { cle: 'email', valeur: settings.email || '' },
      { cle: 'telephone_fixe', valeur: settings.phoneFixed || '' }
    ];
    var headers = {
      apikey: Supabase.anonKey,
      Authorization: 'Bearer ' + Supabase.anonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal,resolution=merge-duplicates'
    };
    return fetch(url + '/parametres?on_conflict=cle', { method: 'POST', headers: headers, body: JSON.stringify(rows) })
      .then(function (res) { return res.ok; })
      .catch(function (e) { try { console.warn('Supabase parametres:', e); } catch (e2) {} return false; });
  }

  function fetchSettings() {
    if (!hasBackend()) return Promise.resolve(null);
    return client().from('parametres').select('cle, valeur').then(function (res) {
      if (res.error) return null;
      var out = {};
      (res.data || []).forEach(function (r) { out[r.cle] = r.valeur; });
      return out;
    });
  }

  window.DarMarocStore = {
    VERSION: 'v2.2',
    hasBackend: hasBackend,
    fetchCollection: fetchCollection,
    pushCollection: pushCollection,
    deleteItem: deleteItem,
    syncImages: syncImages,
    pushSettings: pushSettings,
    fetchSettings: fetchSettings,
    mapFromTable: mapFromTable,
    mapToTable: mapToTable
  };
})();
