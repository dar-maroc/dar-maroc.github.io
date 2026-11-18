// ============================================================
// TESTS UNITAIRES — FOURNISSEURS IA (utils/ai-provider.js)
// MOCKS uniquement — aucun appel réseau.
// ============================================================

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log('  OK  ', msg); }
  else { failed++; console.log('  ECHEC', msg); }
}

global.window = global.window || {};
if (!global.window.DARMAROC_CONFIG) {
  global.window.DARMAROC_CONFIG = {
    ai: { gemini: { apiKey: '', model: 'gemini-2.0-flash' } },
    providers: {
      primary: { name: 'supabase-edge', model: 'gemini-2.0-flash', capability: 'text', endpoint: '/functions/v1/ai-generate' },
      fallback: { name: 'supabase-edge', model: 'gemini-2.0-flash-lite', capability: 'text', endpoint: '/functions/v1/ai-generate' },
      local: { name: 'local', model: 'local-keyword', capability: 'text', endpoint: null }
    },
    supabase: { url: 'https://hiicfqjubfqgtsfmsxny.supabase.co', anonKey: 'test-key' }
  };
}
global.DARMAROC_CONFIG = global.window.DARMAROC_CONFIG;

global.fetch = function () {
  return Promise.resolve({ ok: false, status: 503, json: function () { return Promise.resolve({ success: false, error: 'indisponible' }); } });
};

require('../../utils/ai-provider.js');

console.log('\n=== TESTS FOURNISSEURS IA (mocks uniquement) ===\n');

var provider = window.DarMarocAIProvider;

// --- Test 1 : État des fournisseurs ---
console.log('1. État des fournisseurs');
var state = provider.getProviderState();
assert(state.local.available === true, 'Fournisseur local disponible');
assert(state.local.exhausted === false, 'Fournisseur local non épuisé');

// --- Test 2 : Fallback local quand Edge Function indisponible ---
console.log('\n2. Fallback local');
provider.generate({ capability: 'text', prompt: 'Test', idempotencyKey: 'prov-test-001' })
  .then(function (r) {
    assert(r.provider === 'local', 'Fournisseur local utilisé');
    assert(r.isFallback === true, 'Marqué comme fallback');
    assert(typeof r.text === 'string' && r.text.length > 0, 'Texte généré');
  }).catch(function (e) {
    assert(false, 'generate ne doit pas rejeter: ' + e.message);
  }).then(function () {
    // --- Test 3 : Prévention des exécutions en double ---
    console.log('\n3. Prévention des doublons');
    var key = 'idem-test-' + Date.now();
    var p1 = provider.generate({ capability: 'text', prompt: 'A', idempotencyKey: key });
    var p2 = provider.generate({ capability: 'text', prompt: 'B', idempotencyKey: key });
    return Promise.allSettled([p1, p2]).then(function (results) {
      var oneRejected = results.some(function (r) {
        return r.status === 'rejected' && r.reason && r.reason.message && r.reason.message.includes('EXECUTION_IN_PROGRESS');
      });
      assert(oneRejected, 'Une des deux exécutions rejetée (doublon)');
    });
  }).then(function () {
    // --- Test 4 : Génération dans les 5 langues (via Agent 5) ---
    console.log('\n4. Génération multilingue');
    // On teste via le provider directement (fallback local)
    var langs = ['fr', 'ar', 'darija', 'en', 'es'];
    var langTests = langs.map(function (lang) {
      return provider.generate({
        capability: 'text',
        prompt: 'Générer un post pour ' + lang,
        language: lang,
        idempotencyKey: 'lang-test-' + lang
      }).then(function (r) {
        assert(typeof r.text === 'string' && r.text.length > 0, 'Texte généré pour ' + lang);
      });
    });
    return Promise.all(langTests);
  }).then(function () {
    // --- Résumé ---
    console.log('\n=== RESULTAT FOURNISSEURS ===');
    console.log('OK  ' + passed + ' réussis');
    console.log('ECHEC ' + failed + ' échecs');
    if (failed === 0) console.log('TOUS LES TESTS FOURNISSEURS SONT PASSES');
    else process.exit(1);
  }).catch(function (e) {
    assert(false, 'Erreur inattendue: ' + e.message);
    console.log('\n=== RESULTAT FOURNISSEURS ===');
    console.log('OK  ' + passed + ' réussis');
    console.log('ECHEC ' + failed + ' échecs');
    process.exit(1);
  });
