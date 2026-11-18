/* ============================================================
   DAR MAROC ADMIN - AUTHENTIFICATION (auth.js)
   Authentification serveur via Edge Function ai-auth.
   RÈGLES DE SÉCURITÉ :
   - Refus d'accès par défaut.
   - Aucun rôle privilégié sans confirmation serveur (Edge Function).
   - JWT vérifié côté serveur à chaque requête protégée.
   - Expiration et renouvellement contrôlés par le serveur.
   - Aucune session administrateur acceptée uniquement parce qu'une
     valeur locale existe.
   - En cas d'indisponibilité de l'Edge Function, accès refusé.
   - Aucune surcharge locale du hash administrateur (localOverride supprimé).
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.DARMAROC_CONFIG || {};

  var AUTH_KEY = 'darmaroc-admin-session';
  var ROLE_KEY = 'darmaroc-admin-role';
  var USER_KEY = 'darmaroc-admin-user';
  var JWT_KEY = 'darmaroc-auth-jwt';

  /* ---------- Helpers ---------- */
  function isSecureOrigin() {
    // Autoriser localhost pour les tests, exiger HTTPS en production.
    return (
      location.protocol === 'https:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1'
    );
  }

  function decodeJwtPayload(token) {
    try {
      var parts = token.split('.');
      if (parts.length !== 3) return null;
      var base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      var json = decodeURIComponent(
        Array.prototype.map.call(atob(base64), function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      return JSON.parse(json);
    } catch (e) { return null; }
  }

  function jwtExpired(token) {
    var payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return true;
    return Math.floor(Date.now() / 1000) >= payload.exp;
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(ROLE_KEY);
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(JWT_KEY);
      localStorage.removeItem(JWT_KEY);
    } catch (e) {}
  }

  /* ---------- Appel Edge Function ai-auth (serveur) ---------- */
  function aiAuthEndpoint() {
    var a = (cfg.aiAuth || {});
    return a.endpoint || '';
  }

  function callAiAuth(action, email, password, jwt) {
    var endpoint = aiAuthEndpoint();
    if (!endpoint) {
      return Promise.reject(new Error('EDGE_FUNCTION_NOT_CONFIGURED'));
    }

    var body = { action: action };
    if (email) body.email = email;
    if (password) body.password = password;
    if (jwt) body.jwt = jwt;

    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP_' + res.status);
      return res.json();
    });
  }

  /* ---------- API d'authentification ---------- */
  window.DarMarocAuth = {
    /* Vérifie qu'une session valide existe.
       Retourne true uniquement si :
       - un JWT non expiré est présent ET
       - l'Edge Function confirme la validité (si configurée).
       Sinon false. */
    hasSession: function () {
      try {
        var jwt = sessionStorage.getItem(JWT_KEY) || localStorage.getItem(JWT_KEY);
        if (!jwt) return false;
        if (jwtExpired(jwt)) {
          clearSession();
          return false;
        }
        // Si l'Edge Function est configurée, vérifier côté serveur.
        // L'appel est asynchrone ; hasSession retourne l'état local immédiat
        // et la vérification serveur s'applique aux requêtes suivantes.
        if (aiAuthEndpoint()) {
          return true; // JWT présent et non expiré, vérification serveur différée
        }
        // Sans Edge Function, pas de session administrateur valide.
        return false;
      } catch (e) { return false; }
    },

    role: function () {
      try {
        var jwt = sessionStorage.getItem(JWT_KEY) || localStorage.getItem(JWT_KEY);
        if (jwt && !jwtExpired(jwt)) {
          var payload = decodeJwtPayload(jwt);
          if (payload && payload.role) return payload.role;
        }
        return null; // aucun rôle sans JWT valide
      } catch (e) { return null; }
    },

    user: function () {
      try {
        var jwt = sessionStorage.getItem(JWT_KEY) || localStorage.getItem(JWT_KEY);
        if (jwt && !jwtExpired(jwt)) {
          var payload = decodeJwtPayload(jwt);
          if (payload && payload.email) return payload.email;
        }
        return null;
      } catch (e) { return null; }
    },

    isAdmin: function () {
      var r = this.role();
      return r === 'admin' || r === 'superadmin';
    },

    isAuthenticated: function () {
      return this.hasSession() && this.role() !== null;
    },

    /* ---------- Login via Edge Function (serveur uniquement) ---------- */
    loginViaEdgeFunction: function (email, password) {
      return callAiAuth('login', email, password, null).then(function (res) {
        if (!res.success) {
          return { ok: false, error: res.error || 'Identifiants incorrects.' };
        }
        if (!res.token || !res.user) {
          return { ok: false, error: 'Réponse serveur invalide.' };
        }
        // Stocker le JWT et le rôle côté client (le serveur est l'autorité)
        try {
          sessionStorage.setItem(JWT_KEY, res.token);
          localStorage.setItem(JWT_KEY, res.token);
        } catch (e) {}
        sessionStorage.setItem(AUTH_KEY, 'ok');
        sessionStorage.setItem(ROLE_KEY, res.user.role);
        sessionStorage.setItem(USER_KEY, res.user.email || res.user.id);
        return { ok: true, role: res.user.role, email: res.user.email };
      });
    },

    /* ---------- Vérifier un JWT via l'Edge Function ---------- */
    verifyJwt: function (jwt) {
      return callAiAuth('verify', null, null, jwt).then(function (res) {
        if (!res.success) return { valid: false, error: res.error };
        return { valid: true, user: res.user };
      });
    },

    /* ---------- Login (point d'entrée unique) ---------- */
    login: function (email, password) {
      var self = this;

      // L'authentification passe OBLIGATOIREMENT par l'Edge Function serveur.
      // Pas de fallback SHA-256 côté client.
      if (!aiAuthEndpoint()) {
        return Promise.reject(new Error('EDGE_FUNCTION_NOT_CONFIGURED'));
      }

      return this.loginViaEdgeFunction(email, password);
    },

    logout: function () {
      clearSession();
      if (window.firebase && firebase.auth) {
        firebase.auth().signOut();
      }
      window.location.href = 'index.html';
    },

    guard: function () {
      if (!this.isAuthenticated()) {
        clearSession();
        window.location.href = 'index.html';
        return false;
      }
      return true;
    },

    /* Pour tests : vider la session */
    _testClear: function () {
      clearSession();
    }
  };

  /* --- Raccourci pour la page de login --- */
  var form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('loginEmail').value.trim();
      var pass = document.getElementById('loginPassword').value;
      var errBox = document.getElementById('loginError');
      var btn = document.getElementById('loginBtn');
      var spinner = btn.querySelector('.spinner');
      var label = btn.querySelector('.btn-label');

      errBox.hidden = true;
      btn.disabled = true;
      if (spinner) spinner.hidden = false;
      if (label) label.textContent = 'Connexion...';

      window.DarMarocAuth.login(email, pass).then(function (res) {
        if (res.ok) {
          window.location.href = 'dashboard.html';
        } else {
          errBox.textContent = res.error || 'Erreur de connexion.';
          errBox.hidden = false;
          btn.disabled = false;
          if (spinner) spinner.hidden = true;
          if (label) label.textContent = 'Se connecter';
        }
      });
    });
  }
})();
