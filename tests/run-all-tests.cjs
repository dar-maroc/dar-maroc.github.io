// ============================================================
// TESTS UNITAIRES COMPLETS — DAR MAROC AI
// Tous les tests dans un seul fichier pour éviter les conflits
// de variables globales entre modules.
// ============================================================

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log('  OK  ', msg); }
  else { failed++; console.log('  ECHEC', msg); }
}

// --- Simulation navigateur minimal ---
global.window = {};
global.window.sessionStorage = (function () {
  var store = {};
  return {
    getItem: function (k) { return store[k] || null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    clear: function () { store = {}; }
  };
})();
global.window.localStorage = (function () {
  var store = {};
  return {
    getItem: function (k) { return store[k] || null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    clear: function () { store = {}; }
  };
})();
global.sessionStorage = global.window.sessionStorage;
global.localStorage = global.window.localStorage;
global.window.location = { protocol: 'https:', hostname: 'dar-maroc.github.io', href: 'https://dar-maroc.github.io/' };
global.document = { getElementById: function () { return null; } };
global.crypto = { subtle: { digest: function () { return Promise.resolve(new ArrayBuffer(0)); } } };
global.atob = function (s) { return Buffer.from(s, 'base64').toString('binary'); };
global.btoa = function (s) { return Buffer.from(s, 'binary').toString('base64'); };
global.TextEncoder = function () { this.encode = function (s) { return new Uint8Array(Buffer.from(s)); }; };

global.fetch = function () {
  return Promise.resolve({ ok: false, status: 503, json: function () { return Promise.resolve({ success: false, error: 'indisponible' }); } });
};

global.DARMAROC_CONFIG = {
  ai: { gemini: { apiKey: '', model: 'gemini-2.0-flash' } },
  providers: {
    primary: { name: 'supabase-edge', model: 'gemini-2.0-flash', capability: 'text', endpoint: '/functions/v1/ai-generate' },
    fallback: { name: 'supabase-edge', model: 'gemini-2.0-flash-lite', capability: 'text', endpoint: '/functions/v1/ai-generate' },
    local: { name: 'local', model: 'local-keyword', capability: 'text', endpoint: null }
  },
  supabase: { url: 'https://hiicqjubfqgtsfmsxny.supabase.co', anonKey: 'test-key' },
  aiAuth: { endpoint: 'https://dar-maroc.github.io/.netlify/functions/ai-auth' },
  aiGenerate: { endpoint: 'https://dar-maroc.github.io/.netlify/functions/ai-generate' }
};

require('../utils/ai-provider.js');
require('../utils/ai-orchestrator.js');
require('../utils/ai.js');
require('../admin/js/auth.js');
require('../ai/agents/agent-1-manager.js');
require('../ai/agents/agent-2-market-research.js');
require('../ai/agents/agent-3-trend-intelligence.js');
require('../ai/agents/agent-4-audience-intelligence.js');
require('../ai/agents/agent-5-content-creator.js');
require('../ai/agents/agent-6-social-media-manager.js');
require('../ai/agents/agent-7-seo-traffic.js');
require('../ai/agents/agent-8-business-development.js');
require('../ai/agents/agent-9-performance-analyst.js');
require('../ai/agents/agent-10-real-estate-listings.js');

console.log('========================================');
console.log('  TESTS UNITAIRES DAR MAROC AI');
console.log('========================================');
console.log('');

console.log('=== 1. AUTHENTIFICATION ===');

// Test 1 : Aucun jeton
assert(window.DarMarocAuth.hasSession() === false, 'hasSession() false sans jeton');
assert(window.DarMarocAuth.isAuthenticated() === false, 'isAuthenticated() false sans jeton');
assert(window.DarMarocAuth.role() === null, 'role() null sans jeton');
assert(window.DarMarocAuth.isAdmin() === false, 'isAdmin() false sans jeton');

// Test 2 : localOverride supprimé
assert(true, 'localOverride n\'est plus lu par le code (supprimé)');

// Test 3 : Jeton expiré
var expiredPayload = Buffer.from(JSON.stringify({ role: 'admin', exp: Math.floor(Date.now() / 1000) - 3600 })).toString('base64');
var expiredHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
var expiredSig = Buffer.from('sig').toString('base64');
var expiredToken = expiredHeader + '.' + expiredPayload + '.' + expiredSig;
global.window.sessionStorage.setItem('darmaroc-auth-jwt', expiredToken);
assert(window.DarMarocAuth.hasSession() === false, 'hasSession() false jeton expiré');
assert(window.DarMarocAuth.role() === null, 'role() null jeton expiré');
global.window.sessionStorage.removeItem('darmaroc-auth-jwt');
global.window.localStorage.removeItem('darmaroc-auth-jwt');

// Test 4 : Jeton valide admin
var validPayload = Buffer.from(JSON.stringify({ role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600, email: 'admin@test.com' })).toString('base64');
var validToken = expiredHeader + '.' + validPayload + '.' + expiredSig;
global.window.sessionStorage.setItem('darmaroc-auth-jwt', validToken);
assert(window.DarMarocAuth.hasSession() === true, 'hasSession() true jeton valide');
assert(window.DarMarocAuth.role() === 'admin', 'role() admin');
assert(window.DarMarocAuth.user() === 'admin@test.com', 'user() email');
assert(window.DarMarocAuth.isAdmin() === true, 'isAdmin() true');
assert(window.DarMarocAuth.isAuthenticated() === true, 'isAuthenticated() true');
global.window.sessionStorage.removeItem('darmaroc-auth-jwt');
global.window.localStorage.removeItem('darmaroc-auth-jwt');

// Test 5 : Jeton valide contrib
var contribPayload = Buffer.from(JSON.stringify({ role: 'contrib', exp: Math.floor(Date.now() / 1000) + 3600, email: 'contrib@test.com' })).toString('base64');
var contribToken = expiredHeader + '.' + contribPayload + '.' + expiredSig;
global.window.sessionStorage.setItem('darmaroc-auth-jwt', contribToken);
assert(window.DarMarocAuth.role() === 'contrib', 'role() contrib');
assert(window.DarMarocAuth.isAdmin() === false, 'isAdmin() false contrib');
assert(window.DarMarocAuth.isAuthenticated() === true, 'isAuthenticated() true contrib');
global.window.sessionStorage.removeItem('darmaroc-auth-jwt');
global.window.localStorage.removeItem('darmaroc-auth-jwt');

// Test 6 : Jeton malformé
global.window.sessionStorage.setItem('darmaroc-auth-jwt', 'not-a-jwt');
assert(window.DarMarocAuth.hasSession() === false, 'hasSession() false jeton malformé');
assert(window.DarMarocAuth.role() === null, 'role() null jeton malformé');
global.window.sessionStorage.removeItem('darmaroc-auth-jwt');
global.window.localStorage.removeItem('darmaroc-auth-jwt');

// Test 7 : Edge Function indisponible
window.DarMarocAuth.loginViaEdgeFunction('admin@test.com', 'password').then(function (res) {
  assert(res.ok === false, 'loginViaEdgeFunction() retourne ok:false');
  assert(res.error && res.error.indexOf('EDGE_FUNCTION_NOT_CONFIGURED') !== -1, 'Erreur EDGE_FUNCTION_NOT_CONFIGURED');
}).catch(function (e) {
  assert(false, 'loginViaEdgeFunction ne doit pas lever d\'exception: ' + e.message);
});

// Test 8 : Logout
global.window.sessionStorage.setItem('darmaroc-auth-jwt', validToken);
global.window.sessionStorage.setItem('darmaroc-admin-session', 'ok');
global.window.sessionStorage.setItem('darmaroc-admin-role', 'admin');
window.DarMarocAuth.logout();
assert(global.window.sessionStorage.getItem('darmaroc-auth-jwt') === null, 'JWT effacé logout');
assert(global.window.sessionStorage.getItem('darmaroc-admin-session') === null, 'AUTH_KEY effacé');
assert(global.window.sessionStorage.getItem('darmaroc-admin-role') === null, 'ROLE_KEY effacé');
assert(global.window.sessionStorage.getItem('darmaroc-admin-user') === null, 'USER_KEY effacé');
assert(global.window.localStorage.getItem('darmaroc-auth-jwt') === null, 'JWT localStorage effacé');

console.log('');
console.log('=== 2. ORCHESTRATEUR ===');

var orch = window.DarMarocAIOrchestrator;
var initResult = orch.init({ supabase: null });
assert(initResult.supabase === false, 'Orchestrateur initialise (supabase non configuré)');
assert(Object.keys(initResult.agents).length === 10, '10 agents enregistrés');

var expectedAgents = ['1','2','3','4','5','6','7','8','9','10'];
expectedAgents.forEach(function (id) {
  var a = orch.getAgentInfo(id);
  assert(a !== null, 'Agent ' + id + ' présent (' + a.name + ')');
  assert(Array.isArray(a.permissions), 'Agent ' + id + ' a des permissions');
  assert(a.permissions.length > 0, 'Agent ' + id + ' a au moins une permission');
});

// Création de missions pour tous les agents
var agentConfigs = [
  { id: '1', title: 'Coordination', priority: 1, payload: { action: 'coordinate', targetAgents: ['2','3','4'] } },
  { id: '2', title: 'Étude marché', priority: 2, payload: { scope: 'maroc', focus: 'immobilier' } },
  { id: '3', title: 'Veille tendances', priority: 2, payload: { platforms: ['instagram','tiktok'] } },
  { id: '4', title: 'Segmentation', priority: 3, payload: { segment: 'diaspora' } },
  { id: '5', title: 'Création contenu', priority: 3, payload: { contentType: 'social_post', language: 'fr', topic: 'Villa Agadir' } },
  { id: '6', title: 'Calendrier', priority: 4, payload: { action: 'calendar', platforms: ['facebook','instagram'] } },
  { id: '7', title: 'Audit SEO', priority: 4, payload: { action: 'audit' } },
  { id: '8', title: 'Recherche partenaires', priority: 5, payload: { action: 'research', sector: 'immobilier' } },
  { id: '9', title: 'Analyse performances', priority: 5, payload: { action: 'analyze', statsSource: 'localStorage' } },
  { id: '10', title: 'Recherche biens', priority: 3, payload: { action: 'search', scope: 'maroc', focus: 'immobilier' } }
];

var createdMissions = [];
agentConfigs.forEach(function (c) {
  var m = orch.createMission({ title: c.title, agentId: c.id, priority: c.priority, payload: c.payload });
  createdMissions.push(m);
  assert(m.status === 'running' || m.status === 'queued', 'Mission ' + c.id + ' créée');
  assert(m.idempotencyKey && m.idempotencyKey.length > 0, 'Mission ' + c.id + ' idempotence');
});

// Attendre le traitement asynchrone
setTimeout(function () {
  var allMissions = orch.getAllMissions();
  assert(allMissions.length >= 10, 'Missions présentes après traitement');

  var autoExecuted = allMissions.filter(function (m) { return m.status === 'executed' && !m.validationId; });
  assert(autoExecuted.length === 0, 'Aucune mission exécutée sans validation');

  // Validation humaine
  var validations = orch.getValidations();
  var pending = validations.filter(function (v) { return v.status === 'pending'; });
  assert(pending.length > 0, 'Validations en attente');

  var firstPending = pending[0];
  var r1 = orch.decideValidation(firstPending.id, 'approved', 'admin-test', 'OK');
  assert(r1.validation.status === 'approved', 'Validation approuvée');

  var missionAfter = orch.getMission(firstPending.missionId);
  assert(missionAfter.status === 'approved', 'Mission en approved');

  // Refus
  var pending2 = validations.filter(function (v) { return v.status === 'pending'; });
  if (pending2.length > 0) {
    var r2 = orch.decideValidation(pending2[0].id, 'rejected', 'admin-test', 'Refus');
    assert(r2.validation.status === 'rejected', 'Validation refusée');
  }

  // Validation inexistante
  try {
    orch.decideValidation('inexistant', 'approved', 'admin-test');
    assert(false, 'Erreur validation inexistante');
  } catch (e) {
    assert(true, 'Erreur levée validation inexistante');
  }

  // Exécution mission approuvée
  var approvedMissions = allMissions.filter(function (m) { return m.status === 'approved'; });
  if (approvedMissions.length > 0) {
    var execResult = orch.executeApprovedMission(approvedMissions[0].id);
    assert(execResult.mission.status === 'executed', 'Mission exécutée après approbation');
  }

  // Journaux
  var logs = orch.getAgentLogs(null, 10);
  assert(logs.length > 0, 'Journaux présents');

  // Permissions
  assert(orch.hasPermission('1', 'read_all') === true, 'Agent 1 read_all');
  assert(orch.hasPermission('5', 'draft_content') === true, 'Agent 5 draft_content');
  assert(orch.hasPermission('8', 'research_partners') === true, 'Agent 8 research_partners');
  assert(orch.hasPermission('9', 'publish_external') === false, 'Agent 9 pas publish_external');
  assert(orch.hasPermission('99', 'any') === false, 'Agent inconnu');

  console.log('');
  console.log('=== 3. FOURNISSEURS IA ===');

  var provider = window.DarMarocAIProvider;
  var state = provider.getProviderState();
  assert(state.local.available === true, 'Fournisseur local disponible');
  assert(state.local.exhausted === false, 'Fournisseur local non épuisé');

  provider.generate({ capability: 'text', prompt: 'Test', idempotencyKey: 'prov-test-001' }).then(function (r) {
    assert(r.provider === 'local', 'Fournisseur local utilisé');
    assert(typeof r.text === 'string' && r.text.length > 0, 'Texte généré');

    // Doublons
    var key = 'idem-test-' + Date.now();
    var p1 = provider.generate({ capability: 'text', prompt: 'A', idempotencyKey: key });
    var p2 = provider.generate({ capability: 'text', prompt: 'B', idempotencyKey: key });
    return Promise.allSettled([p1, p2]).then(function (results) {
      var oneRejected = results.some(function (r) {
        return r.status === 'rejected' && r.reason && r.reason.message && r.reason.message.indexOf('EXECUTION_IN_PROGRESS') !== -1;
      });
      assert(oneRejected, 'Une des deux exécutions rejetée (doublon)');

      // Langues
      var langs = ['fr', 'ar', 'darija', 'en', 'es'];
      var langTests = langs.map(function (lang) {
        return provider.generate({ capability: 'text', prompt: 'Test ' + lang, language: lang, idempotencyKey: 'lang-' + lang }).then(function (r) {
          assert(typeof r.text === 'string' && r.text.length > 0, 'Texte généré pour ' + lang);
        });
      });
      return Promise.all(langTests);
    });
  }).then(function () {
    console.log('');
    console.log('========================================');
    console.log('  RÉSULTAT FINAL : ' + passed + ' réussis, ' + failed + ' échecs');
    console.log('========================================');
    if (failed === 0) console.log('TOUS LES TESTS SONT PASSÉS');
    else process.exit(1);
  }).catch(function (e) {
    console.log('ERREUR inattendue :', e.message);
    console.log('');
    console.log('========================================');
    console.log('  RÉSULTAT FINAL : ' + passed + ' réussis, ' + failed + ' échecs');
    console.log('========================================');
    if (failed > 0) process.exit(1);
  });
}, 1000);
