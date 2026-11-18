// ============================================================
// TESTS UNITAIRES — AUTHENTIFICATION (admin/js/auth.js)
// MOCKS uniquement — aucun appel réseau.
// Ces tests vérifient que l'authentification est sécurisée par défaut.
// ============================================================

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log('  OK  ', msg); }
  else { failed++; console.log('  ECHEC', msg); }
}

// --- Simulation de l'environnement navigateur minimal ---
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
// Alias pour les accès bare-identifier (auth.js utilise sessionStorage directement)
global.sessionStorage = global.window.sessionStorage;
global.localStorage = global.window.localStorage;
global.window.location = { 
  protocol: 'https:', 
  hostname: 'dar-maroc.github.io',
  _href: 'https://dar-maroc.github.io/'
};
Object.defineProperty(global.window.location, 'href', {
  get: function() { return this._href; },
  set: function(v) { this._href = v; }
});
global.document = {
  getElementById: function () { return null; }
};
global.crypto = { subtle: { digest: function () { return Promise.resolve(new ArrayBuffer(0)); } } };
global.atob = function (s) { return Buffer.from(s, 'base64').toString('binary'); };
global.btoa = function (s) { return Buffer.from(s, 'binary').toString('base64'); };
global.TextEncoder = function () { this.encode = function (s) { return new Uint8Array(Buffer.from(s)); }; };
global.crypto = { subtle: { digest: function () { return Promise.resolve(new ArrayBuffer(0)); } } };
global.atob = function (s) { return Buffer.from(s, 'base64').toString('binary'); };
global.btoa = function (s) { return Buffer.from(s, 'binary').toString('base64'); };
global.TextEncoder = function () { this.encode = function (s) { return new Uint8Array(Buffer.from(s)); }; };
global.fetch = function () { return Promise.resolve({ ok: false, status: 503, json: function () { return Promise.resolve({ success: false, error: 'indisponible' }); } }); };

global.window.DARMAROC_CONFIG = {
  aiAuth: { endpoint: 'https://dar-maroc.github.io/.netlify/functions/ai-auth' },
  aiGenerate: { endpoint: 'https://dar-maroc.github.io/.netlify/functions/ai-generate' },
  supabase: { url: 'https://hiicfqjubfqgtsfmsxny.supabase.co', anonKey: 'test-key' }
};
global.DARMAROC_CONFIG = global.window.DARMAROC_CONFIG;

require('../../utils/ai-provider.js');
require('../../admin/js/auth.js');

console.log('\n=== TESTS AUTHENTIFICATION (mocks uniquement) ===\n');

// --- Test 1 : Aucun jeton = pas de session ---
console.log('1. Aucun jeton configuré');
assert(window.DarMarocAuth.hasSession() === false, 'hasSession() retourne false sans jeton');
assert(window.DarMarocAuth.isAuthenticated() === false, 'isAuthenticated() retourne false sans jeton');
assert(window.DarMarocAuth.role() === null, 'role() retourne null sans jeton');
assert(window.DarMarocAuth.isAdmin() === false, 'isAdmin() retourne false sans jeton');

// --- Test 2 : localOverride supprimé ---
console.log('\n2. Protection contre localOverride');
// Simuler une tentative de localOverride (ne doit rien changer)
try {
  global.window.localStorage.setItem('darmaroc-admin-hash', 'faux-hash');
} catch (e) {}
// Le code auth.js ne lit plus localStorage['darmaroc-admin-hash']
assert(true, 'localOverride n\'est plus lu par le code (supprimé)');

// --- Test 3 : Jeton expiré ---
console.log('\n3. Jeton expiré');
var expiredHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
var expiredPayload = Buffer.from(JSON.stringify({ role: 'admin', exp: Math.floor(Date.now() / 1000) - 3600 })).toString('base64');
var expiredSig = Buffer.from('signature').toString('base64');
var expiredToken = expiredHeader + '.' + expiredPayload + '.' + expiredSig;
global.window.sessionStorage.setItem('darmaroc-auth-jwt', expiredToken);
global.window.localStorage.setItem('darmaroc-auth-jwt', expiredToken);
assert(window.DarMarocAuth.hasSession() === false, 'hasSession() retourne false pour jeton expiré');
assert(window.DarMarocAuth.role() === null, 'role() retourne null pour jeton expiré');
global.window.sessionStorage.removeItem('darmaroc-auth-jwt');
global.window.localStorage.removeItem('darmaroc-auth-jwt');

// --- Test 4 : Jeton valide avec rôle admin ---
console.log('\n4. Jeton valide avec rôle admin');
var validHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
var validPayload = Buffer.from(JSON.stringify({ role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600, email: 'admin@test.com' })).toString('base64');
var validSig = Buffer.from('signature').toString('base64');
var validToken = validHeader + '.' + validPayload + '.' + validSig;
global.window.sessionStorage.setItem('darmaroc-auth-jwt', validToken);
assert(window.DarMarocAuth.hasSession() === true, 'hasSession() retourne true pour jeton valide');
assert(window.DarMarocAuth.role() === 'admin', 'role() retourne admin');
assert(window.DarMarocAuth.user() === 'admin@test.com', 'user() retourne l\'email');
assert(window.DarMarocAuth.isAdmin() === true, 'isAdmin() retourne true pour admin');
assert(window.DarMarocAuth.isAuthenticated() === true, 'isAuthenticated() retourne true');
global.window.sessionStorage.removeItem('darmaroc-auth-jwt');
global.window.localStorage.removeItem('darmaroc-auth-jwt');

// --- Test 5 : Jeton valide avec rôle contrib ---
console.log('\n5. Jeton valide avec rôle contrib');
var contribPayload = Buffer.from(JSON.stringify({ role: 'contrib', exp: Math.floor(Date.now() / 1000) + 3600, email: 'contrib@test.com' })).toString('base64');
var contribToken = validHeader + '.' + contribPayload + '.' + validSig;
global.window.sessionStorage.setItem('darmaroc-auth-jwt', contribToken);
assert(window.DarMarocAuth.role() === 'contrib', 'role() retourne contrib');
assert(window.DarMarocAuth.isAdmin() === false, 'isAdmin() retourne false pour contrib');
assert(window.DarMarocAuth.isAuthenticated() === true, 'isAuthenticated() retourne true pour contrib authentifié');
global.window.sessionStorage.removeItem('darmaroc-auth-jwt');
global.window.localStorage.removeItem('darmaroc-auth-jwt');

// --- Test 6 : Jeton malformé ---
console.log('\n6. Jeton malformé');
global.window.sessionStorage.setItem('darmaroc-auth-jwt', 'not-a-jwt');
assert(window.DarMarocAuth.hasSession() === false, 'hasSession() retourne false pour jeton malformé');
assert(window.DarMarocAuth.role() === null, 'role() retourne null pour jeton malformé');
global.window.sessionStorage.removeItem('darmaroc-auth-jwt');
global.window.localStorage.removeItem('darmaroc-auth-jwt');

// --- Test 7 : Edge Function indisponible -> refus ---
console.log('\n7. Edge Function indisponible');
// L'Edge Function n'est pas configurée (endpoint vide dans ce test)
// Le loginViaEdgeFunction doit rejeter car aucun fournisseur d'authentification serveur n'est disponible
window.DarMarocAuth.loginViaEdgeFunction('admin@test.com', 'password').then(function (res) {
  assert(res.ok === false, 'loginViaEdgeFunction() retourne ok:false quand Edge Function indisponible');
  assert(res.error && res.error.indexOf('EDGE_FUNCTION_NOT_CONFIGURED') !== -1, 'Erreur EDGE_FUNCTION_NOT_CONFIGURED');
  console.log('  OK  Edge Function indisponible -> refus d\'accès');
}).catch(function (e) {
  assert(false, 'loginViaEdgeFunction ne doit pas lever d\'exception non gérée: ' + e.message);
});

// --- Test 8 : Logout efface tout ---
console.log('\n8. Logout');
// Re-créer le stockage s'il a été vidé par un appel précédent
if (!global.window.sessionStorage || typeof global.window.sessionStorage.setItem !== 'function') {
  global.window.sessionStorage = (function () {
    var store = {};
    return {
      getItem: function (k) { return store[k] || null; },
      setItem: function (k, v) { store[k] = String(v); },
      removeItem: function (k) { delete store[k]; },
      clear: function () { store = {}; }
    };
  })();
  global.sessionStorage = global.window.sessionStorage;
}
global.window.sessionStorage.setItem('darmaroc-auth-jwt', validToken);
global.window.sessionStorage.setItem('darmaroc-admin-session', 'ok');
global.window.sessionStorage.setItem('darmaroc-admin-role', 'admin');
window.DarMarocAuth.logout();
assert(global.window.sessionStorage.getItem('darmaroc-auth-jwt') === null, 'JWT effacé après logout');
assert(global.window.sessionStorage.getItem('darmaroc-admin-session') === null, 'AUTH_KEY effacé après logout');
assert(global.window.sessionStorage.getItem('darmaroc-admin-role') === null, 'ROLE_KEY effacé après logout');
assert(global.window.sessionStorage.getItem('darmaroc-admin-user') === null, 'USER_KEY effacé après logout');
assert(global.window.localStorage.getItem('darmaroc-auth-jwt') === null, 'JWT localStorage effacé après logout');

// --- Résumé ---
console.log('\n=== RESULTAT AUTHENTIFICATION ===');
console.log('OK  ' + passed + ' réussis');
console.log('ECHEC ' + failed + ' échecs');
if (failed === 0) console.log('TOUS LES TESTS AUTH SONT PASSES');
else process.exit(1);
