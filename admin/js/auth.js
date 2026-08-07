/* ============================================================
   DAR MAROC ADMIN - AUTHENTIFICATION (auth.js)
   Mode local (hash SHA-256) par défaut.
   Bascule automatique vers Firebase Auth quand configuré.
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.DARMAROC_CONFIG || { firebase: { enabled: false } };

  var AUTH_KEY = 'darmaroc-admin-session';
  var ROLE_KEY = 'darmaroc-admin-role';
  var USER_KEY = 'darmaroc-admin-user';

  var ADMIN_USER = 'darmaroc';
  /* Mot de passe par défaut. IMPORTANT : à changer après première connexion.
     Hash SHA-256 de "Netuser03$" */
  var ADMIN_HASH = '81be8c04b5efcf7ef00cb012d43fb833b010d0730499003ffa9ad2d8fb2dcaf8';

  /* Mot de passe commun des contributeurs "user1" à "user5" : DarMaroc2026! */
  var CONTRIB_HASH = '2e6c12a1c7b82705e65b4c885ed2994d2632ed43196c08dce769dada01e3243e';

  /* Comptes du dashboard.
     role 'admin'  = administrateur DarMaroc (accès complet).
     role 'contrib' = contributeur : accès limité (ajout de photos et annonces). */
  var USERS = [
    { user: 'darmaroc', role: 'admin', hash: ADMIN_HASH },
    { user: 'user1', role: 'contrib', hash: CONTRIB_HASH },
    { user: 'user2', role: 'contrib', hash: CONTRIB_HASH },
    { user: 'user3', role: 'contrib', hash: CONTRIB_HASH },
    { user: 'user4', role: 'contrib', hash: CONTRIB_HASH },
    { user: 'user5', role: 'contrib', hash: CONTRIB_HASH }
  ];

  function findUser(list, username) {
    var u = String(username || '').trim().toLowerCase();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].user).toLowerCase() === u) return list[i];
    }
    return null;
  }

  /* Utilisateurs partagés stockés dans la table Supabase admin_users.
     Retourne null si Supabase n'est pas configuré ou indisponible. */
  function loadRemoteUsers() {
    var SB = window.Supabase;
    if (!SB || !SB.client || !SB.isConfigured || !SB.isConfigured()) return Promise.resolve(null);
    return SB.client.from('admin_users').select('username, role, pass_hash, actif').order('username')
      .then(function (res) {
        if (res.error) return null;
        return (res.data || []).filter(function (r) { return r.actif !== false; }).map(function (r) {
          return { user: r.username, role: r.role || 'contrib', hash: r.pass_hash || '' };
        });
      })
      .catch(function () { return null; });
  }

  function defaultUsers() {
    return USERS.map(function (u) { return { user: u.user, role: u.role }; });
  }

  function sha256(str) {
    if (window.crypto && crypto.subtle) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('00' + b.toString(16)).slice(-2);
        }).join('');
      });
    }
    return Promise.resolve(''); 
  }

  function loadFirebase() {
    return new Promise(function (resolve) {
      if (window.firebase) return resolve(true);
      if (!cfg.firebase.enabled || !cfg.firebase.apiKey) return resolve(false);
      var s = document.createElement('script');
      s.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
      s.onload = function () {
        var a = document.createElement('script');
        a.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js';
        a.onload = function () { resolve(true); };
        a.onerror = function () { resolve(false); };
        document.head.appendChild(a);
      };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
  }

  window.DarMarocAuth = {
    hasSession: function () {
      try { return sessionStorage.getItem(AUTH_KEY) === 'ok'; } catch (e) { return false; }
    },

    role: function () {
      try { return sessionStorage.getItem(ROLE_KEY) || 'admin'; } catch (e) { return 'admin'; }
    },

    user: function () {
      try { return sessionStorage.getItem(USER_KEY) || 'darmaroc'; } catch (e) { return 'darmaroc'; }
    },

    isAdmin: function () {
      return this.role() !== 'contrib';
    },

    login: function (email, password) {
      var self = this;
      return loadFirebase().then(function (fbReady) {
        if (fbReady && window.firebase && firebase.auth) {
          return firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
            sessionStorage.setItem(AUTH_KEY, 'ok');
            sessionStorage.setItem(ROLE_KEY, 'superadmin');
            sessionStorage.setItem(USER_KEY, user.email || 'darmaroc');
            return { ok: true, role: 'superadmin', email: user.email };
          }).catch(function (err) {
            return { ok: false, error: err.message };
          });
        }
        /* Mode local */
        return loadRemoteUsers().then(function (remote) {
          var users = remote || USERS;
          var user = findUser(users, email);
          if (!user) {
            return { ok: false, error: 'Identifiant ou mot de passe incorrect.' };
          }
          return sha256(password).then(function (hash) {
            var expected = user.hash;
            var localOverride = '';
            if (user.user === 'darmaroc') {
              try { localOverride = localStorage.getItem('darmaroc-admin-hash') || ''; } catch (e) {}
            }
            var okHash = hash && (hash === expected || (localOverride && hash === localOverride));
            if (!okHash) {
              return { ok: false, error: 'Identifiant ou mot de passe incorrect.' };
            }
            sessionStorage.setItem(AUTH_KEY, 'ok');
            sessionStorage.setItem(ROLE_KEY, user.role);
            sessionStorage.setItem(USER_KEY, user.user);
            return { ok: true, role: user.role, email: user.user };
          });
        });
      });
    },

    logout: function () {
      try {
        sessionStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(ROLE_KEY);
        sessionStorage.removeItem(USER_KEY);
      } catch (e) {}
      if (window.firebase && firebase.auth) { firebase.auth().signOut(); }
      window.location.href = 'index.html';
    },

    guard: function () {
      if (!this.hasSession()) { window.location.href = 'index.html'; return false; }
      return true;
    },

    defaultUsers: defaultUsers
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
