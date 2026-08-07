/* ============================================================
   DAR MAROC - CLIENT SUPABASE (utils/supabase.js)
   Initialise le client depuis config/site-config.js.
   Tant que les clés sont vides, le site reste 100% statique
   (fonctionnement localStorage conservé partout).
   ============================================================ */
(function () {
  'use strict';

  var cfg = (window.DARMAROC_CONFIG && window.DARMAROC_CONFIG.supabase) || {};
  var SDK = window.supabase;

  function isConfigured() {
    return !!(SDK && cfg.url && cfg.anonKey &&
      String(cfg.url).indexOf('votre-projet') === -1 &&
      String(cfg.url).indexOf('supabase.co') !== -1);
  }

  var client = null;
  if (isConfigured()) {
    try {
      client = SDK.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    } catch (e) {
      client = null;
      try { console.warn('Supabase init failed:', e); } catch (e2) {}
    }
  }

  window.Supabase = window.Supabase || {};
  window.Supabase.client = client;
  window.Supabase.isConfigured = isConfigured;
  window.Supabase.bucket = cfg.photosBucket || 'annonces';
  window.Supabase.restUrl = cfg.url + '/rest/v1';
  window.Supabase.anonKey = cfg.anonKey;

  /* Utilitaire : chemin de stockage unique pour une annonce. */
  window.Supabase.storagePath = function (annonceId, fileName) {
    var ext = (fileName.match(/\.[a-z0-9]{2,5}$/i) || ['.jpg'])[0].toLowerCase();
    var stamp = Date.now().toString(36);
    var safe = fileName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 30) || 'photo';
    var base = annonceId || 'annonce-' + stamp;
    return base + '/' + stamp + '-' + safe + ext;
  };
})();
