/* ============================================================
   DAR MAROC - STATISTIQUES (utils/stats.js)
   Collecte locale d'événements (vues d'annonces, clics WhatsApp,
   réseaux sociaux, email) sans aucune modification des pages.
   - Stockage : localStorage (fiable, privé, gratuit)
   - Synchronisation optionnelle vers Supabase si une table
     "stat_events" existe (créée via supabase/schema.sql Phase 4).
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'darmaroc-stats-v1';
  var MAX = 5000;
  var cfg = window.DARMAROC_CONFIG || {};

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function save(arr) {
    try {
      localStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX)));
    } catch (e) {}
  }

  function pushRemote(ev) {
    var SB = window.Supabase;
    if (!SB || !SB.client || !SB.isConfigured || !SB.isConfigured()) return;
    try {
      SB.client.from('stat_events').insert({
        action: ev.action,
        label: ev.label || '',
        page: ev.page || '',
        ville: ev.ville || '',
        prix: ev.prix || '',
        created_at: ev.ts
      }).then(function () {}).catch(function () {});
    } catch (e) {}
  }

  function track(action, label, extra) {
    try {
      var ev = {
        action: action,
        label: String(label == null ? '' : label).slice(0, 200),
        page: window.location ? window.location.pathname : '',
        ts: new Date().toISOString(),
        ville: (extra && extra.ville) || '',
        prix: (extra && extra.prix) || ''
      };
      var arr = load();
      arr.push(ev);
      save(arr);
      pushRemote(ev);
      return ev;
    } catch (e) { return null; }
  }

  function count(action, label) {
    var arr = load();
    if (label == null) return arr.filter(function (e) { return e.action === action; }).length;
    return arr.filter(function (e) { return e.action === action && e.label === label; }).length;
  }

  function top(action, n) {
    var counts = {};
    load().forEach(function (e) {
      if (e.action !== action || !e.label) return;
      counts[e.label] = (counts[e.label] || 0) + 1;
    });
    return Object.keys(counts)
      .map(function (k) { return { label: k, count: counts[k] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, n || 10);
  }

  function summary() {
    var arr = load();
    var actions = {};
    arr.forEach(function (e) { actions[e.action] = (actions[e.action] || 0) + 1; });
    var last7 = 0, last30 = 0;
    var now = Date.now();
    arr.forEach(function (e) {
      var t = new Date(e.ts).getTime();
      if (now - t <= 7 * 86400000) last7++;
      if (now - t <= 30 * 86400000) last30++;
    });
    var days = {};
    arr.slice(-90).forEach(function (e) {
      var d = String(e.ts || '').slice(0, 10);
      if (d) days[d] = (days[d] || 0) + 1;
    });
    return {
      total: arr.length,
      last7: last7,
      last30: last30,
      views: actions['property_view'] || 0,
      whatsapp: actions['whatsapp'] || 0,
      social: actions['social'] || 0,
      email: actions['email'] || 0,
      chat: actions['chat'] || 0,
      actions: actions,
      topProperties: top('property_view', 10),
      topSocial: top('social', 10),
      days: Object.keys(days).sort().slice(-30).map(function (d) { return { date: d, count: days[d] }; })
    };
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  /* ---------- Capture automatique des clics (délégation) ---------- */
  function captureClicks() {
    if (document.body) {
      document.body.addEventListener('click', function (e) {
        try {
          var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
          if (!a) return;
          var href = String(a.href || a.getAttribute('href') || '');
          if (href.indexOf('wa.me') !== -1 || href.indexOf('api.whatsapp.com') !== -1) {
            track('whatsapp', a.getAttribute('href') || href);
            return;
          }
          if (href.indexOf('mailto:') === 0) { track('email', href); return; }
          var s = cfg.social || {};
          var labels = { facebook: 'facebook', instagram: 'instagram', tiktok: 'tiktok', youtube: 'youtube' };
          for (var k in labels) {
            if (s[k] && href.indexOf(s[k]) !== -1) { track('social', labels[k]); return; }
          }
        } catch (e2) {}
      });
    }
  }

  function init() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', captureClicks);
    } else {
      captureClicks();
    }
  }

  init();

  window.DarMarocStats = {
    VERSION: 'v1.0',
    track: track,
    count: count,
    top: top,
    summary: summary,
    clear: clear,
    load: load
  };
})();
