/* ============================================================
   DAR MAROC AI — COUCHE D'ABSTRACTION DES FOURNISSEURS IA
   utils/ai-provider.js
   
   Rôle :
   - Abstraction indépendante des fournisseurs (Gemini, NVIDIA, OpenCode…)
   - Fournisseur principal + fournisseur de secours (fallback)
   - Basculement automatique en cas d'indisponibilité (429, timeout, panne)
   - Vérification des capacités du modèle de secours
   - Protection contre les exécutions en double (clé d'idempotence)
   - Suivi des quotas gratuits (suspension si épuisés)
   
   SÉCURITÉ :
   - Aucune clé API n'est stockée ni transmise depuis ce fichier côté client.
   - Les appels IA sont délégués aux Edge Functions Supabase (côté serveur),
     où les clés sont conservées comme secrets (Supabase Dashboard > Settings > Secrets).
   - Ce fichier ne contient que l'URL de l'Edge Function et la logique de basculement.
   
   MODE DE FONCTIONNEMENT :
   Démarrage à coût zéro. Aucun abonnement payant automatique. Aucun achat de crédits.
   Si les quotas gratuits sont épuisés et qu'aucun fournisseur gratuit compatible
   n'est disponible, la tâche est suspendue et une erreur explicite est retournée.
   ============================================================ */
(function () {
  'use strict';

  var cfg = (window.DARMAROC_CONFIG && window.DARMAROC_CONFIG.ai) || {};

  /* Configuration fournisseurs (lue depuis site-config.js, sans clés secrètes) */
  var PROVIDERS = cfg.providers || {
    primary: {
      name: 'supabase-edge',   // appelle l'Edge Function Supabase
      model: 'gemini-2.0-flash',
      capability: 'text',
      endpoint: '/functions/v1/ai-generate'
    },
    fallback: {
      name: 'supabase-edge',
      model: 'gemini-2.0-flash-lite',
      capability: 'text',
      endpoint: '/functions/v1/ai-generate'
    },
    local: {
      name: 'local',
      model: 'local-keyword',
      capability: 'text',
      endpoint: null
    }
  };

  /* État des quotas (en mémoire, réinitialisé à chaque chargement de page) */
  var quotaState = {};
  Object.keys(PROVIDERS).forEach(function (key) {
    quotaState[key] = {
      used: 0,
      limit: null,        // null = inconnu / illimité en local
      resetAt: null,
      exhausted: false,
      lastError: null,
      lastCheck: null
    };
  });

  /* File des exécutions en cours (prévention des doublons par idempotency key) */
  var pendingExecutions = {};

  /* ---------- Vérification des capacités d'un fournisseur ---------- */
  function hasCapability(providerKey, capability) {
    var p = PROVIDERS[providerKey];
    if (!p) return false;
    return p.capability === capability || p.capability === 'text';
  }

  /* ---------- Sélection du fournisseur disponible ---------- */
  function selectProvider(capability, preferPrimary) {
    var order = preferPrimary ? ['primary', 'fallback', 'local'] : ['fallback', 'primary', 'local'];
    for (var i = 0; i < order.length; i++) {
      var key = order[i];
      var q = quotaState[key];
      if (!q) continue;
      if (q.exhausted) continue;
      if (!hasCapability(key, capability)) continue;
      return key;
    }
    return null;
  }

  /* ---------- Mise à jour de l'état de quota ---------- */
  function updateQuota(providerKey, used, limit, resetAt, exhausted, error) {
    var q = quotaState[providerKey];
    if (!q) return;
    if (used !== null) q.used = used;
    if (limit !== null) q.limit = limit;
    if (resetAt) q.resetAt = resetAt;
    q.exhausted = exhausted === true;
    q.lastError = error || null;
    q.lastCheck = new Date().toISOString();
  }

  /* ---------- Appel Edge Function Supabase (serveur, clés protégées) ---------- */
  function callEdgeFunction(providerKey, payload, idempotencyKey) {
    var p = PROVIDERS[providerKey];
    if (!p) {
      return Promise.reject(new Error('Fournisseur inconnu : ' + providerKey));
    }

    // L'URL complète de l'Edge Function vient de la config (ex: https://projet.supabase.co/functions/v1/ai-generate)
    var cfg = window.DARMAROC_CONFIG || {};
    var url = '';
    if (cfg.aiGenerate && cfg.aiGenerate.endpoint) {
      url = cfg.aiGenerate.endpoint;
    } else if (cfg.supabase && cfg.supabase.url) {
      url = cfg.supabase.url.replace(/\/$/, '') + '/functions/v1/ai-generate';
    }
    if (!url) {
      return Promise.reject(new Error('Aucun endpoint Edge Function configuré (aiGenerate.endpoint ou supabase.url)'));
    }

    var headers = {
      'Content-Type': 'application/json',
      'Prefer': 'respond-async'
    };
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    // Ajouter le JWT si disponible (authentification serveur)
    try {
      var jwt = sessionStorage.getItem('darmaroc-auth-jwt') || localStorage.getItem('darmaroc-auth-jwt');
      if (jwt) {
        headers['Authorization'] = 'Bearer ' + jwt;
      }
    } catch (e) {}

    var body = {
      provider: p.name,
      model: p.model,
      capability: payload.capability || 'text',
      prompt: payload.prompt || '',
      system: payload.system || '',
      temperature: payload.temperature !== undefined ? payload.temperature : 0.7,
      maxOutputTokens: payload.maxOutputTokens || 500,
      context: payload.context || null,
      idempotency_key: idempotencyKey || null
    };

    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      }).then(function (res) {
        if (res.status === 429) {
          updateQuota(providerKey, null, null, null, true, 'Quota épuisé (429)');
          throw new Error('QUOTA_EXHAUSTED');
        }
        if (!res.ok) {
          updateQuota(providerKey, null, null, null, false, 'HTTP ' + res.status);
          throw new Error('HTTP_' + res.status);
        }
        return res.json();
      }).then(function (data) {
        if (data.error) {
          throw new Error(data.error);
        }
        updateQuota(providerKey, data.used || null, data.limit || null, data.resetAt || null, data.exhausted === true, null);
        return {
          text: data.text || '',
          provider: providerKey,
          model: p.model,
          usage: data.usage || null
        };
      });
  }

  /* ---------- Moteur local de secours (aucun appel externe, gratuit, illimité) ---------- */
  function localFallback(payload) {
    var prompt = String(payload.prompt || '');
    var system = String(payload.system || '');
    var text = '';

    // Réponses déterministes basées sur des mots-clés (pas d'IA externe)
    var lower = prompt.toLowerCase();
    if (/merci|thank|شكرا|شكراً/.test(lower)) {
      text = 'Avec plaisir ! Nous restons à votre disposition 😊';
    } else if (/horaire|heure|open|ساعات|مواعيد/.test(lower)) {
      text = '🕐 Nos horaires : Lundi – Samedi, 9h à 19h.\n📍 Av. Annarjis, Agadir, Maroc.';
    } else if (/prix|budget|tarif|combien|cost|price|سعر|ثمن/.test(lower)) {
      text = '💰 Nous pouvons vous proposer des biens selon votre budget. Dites-nous votre ville préférée !';
    } else if (/contact|join|tel|appel|whatsapp|email|mail|تواصل|اتصال|هاتف/.test(lower)) {
      text = '📲 Pour nous joindre :\n• WhatsApp : +33 7 72 20 88 85\n• Mobile : +212 665 310 308 / +212 667 090 303\n• Bureau : 05 25 26 14 86\n• Email : Dar.maroc4@gmail.com';
    } else if (/description|rédige|écris|write|description bien/.test(lower)) {
      text = '[Mode local — aperçu réutilisable]\n\n🏡 DarMaroc — Bien à Agadir\n✨ Clé en main, vue mer, proche plage.\n📲 Devis WhatsApp : lien DarMaroc\n\n#ImmobilierAgadir #DarMaroc #GestionLocative';
    } else if (/email|voyageur|arrivée|check-in/.test(lower)) {
      text = 'Objet : Votre arrivée DarMaroc\n\nBonjour,\n\nNous vous accueillons à [logement]. Check-in à partir de 15 h. Votre code d\'accès vous sera envoyé la veille.\n\nContacts utiles : WhatsApp DarMaroc.\n\nCordialement,\nL\'équipe DarMaroc';
    } else {
      text = '[Mode local — générateur de secours]\n\nRéponse préparée localement pour : "' + (prompt.slice(0, 100) || '(vide)') + '".\nConfigurez un fournisseur IA via les Edge Functions Supabase pour une génération enrichie.';
    }

    updateQuota('local', (quotaState.local.used || 0) + 1, null, null, false, null);
    return Promise.resolve({
      text: text,
      provider: 'local',
      model: 'local-keyword',
      usage: null,
      isFallback: true
    });
  }

  /* ---------- API publique : générer du texte ---------- */
  function generate(payload) {
    payload = payload || {};
    var capability = payload.capability || 'text';
    var idempotencyKey = payload.idempotencyKey || null;

    // Prévention des doublons : si une exécution avec la même clé est en cours, la rejeter
    if (idempotencyKey && pendingExecutions[idempotencyKey]) {
      return Promise.reject(new Error('EXECUTION_IN_PROGRESS'));
    }
    if (idempotencyKey) {
      pendingExecutions[idempotencyKey] = true;
    }

    var providerKey = selectProvider(capability, true);
    if (!providerKey) {
      if (idempotencyKey) delete pendingExecutions[idempotencyKey];
      return Promise.reject(new Error('NO_PROVIDER_AVAILABLE'));
    }

    return callEdgeFunction(providerKey, payload, idempotencyKey)
      .catch(function (err) {
        var errMsg = err && err.message ? err.message : String(err);
        // Si l'Edge Function n'est pas configurée ou indisponible,
        // passer directement au moteur local de secours.
        var isEdgeUnavailable = (
          errMsg.indexOf('Edge Function') !== -1 ||
          errMsg.indexOf('endpoint') !== -1 ||
          errMsg.indexOf('Supabase') !== -1 && errMsg.indexOf('config') !== -1
        );
        if (isEdgeUnavailable) {
          updateQuota(providerKey, null, null, null, false, errMsg);
          return localFallback(payload);
        }
        // Basculement sur le fournisseur de secours
        var fallbackKey = selectProvider(capability, false);
        if (fallbackKey && fallbackKey !== providerKey) {
          updateQuota(providerKey, null, null, null, false, errMsg);
          return callEdgeFunction(fallbackKey, payload, idempotencyKey)
            .catch(function (fallbackErr) {
              // Le fournisseur de secours a aussi échoué → moteur local
              updateQuota(fallbackKey, null, null, null, false, fallbackErr.message);
              return localFallback(payload);
            });
        }
        // Dernier recours : moteur local
        return localFallback(payload);
      })
      .then(function (result) {
        if (idempotencyKey) delete pendingExecutions[idempotencyKey];
        return result;
      })
      .catch(function (err) {
        if (idempotencyKey) delete pendingExecutions[idempotencyKey];
        throw err;
      });
  }

  /* ---------- État des fournisseurs (pour le tableau de bord) ---------- */
  function getProviderState() {
    var state = {};
    Object.keys(quotaState).forEach(function (key) {
      state[key] = {
        used: quotaState[key].used,
        limit: quotaState[key].limit,
        resetAt: quotaState[key].resetAt,
        exhausted: quotaState[key].exhausted,
        lastError: quotaState[key].lastError,
        lastCheck: quotaState[key].lastCheck,
        available: !quotaState[key].exhausted && hasCapability(key, 'text')
      };
    });
    return state;
  }

  /* ---------- Synthetic quota refresh (appelé par l'orchestrateur) ---------- */
  function refreshQuotas() {
    // En l'absence d'Edge Function déployée, on garde l'état en mémoire.
    // Une fois déployée, cet endpoint pourrait être appelé pour synchroniser.
    return Promise.resolve(getProviderState());
  }

  window.DarMarocAIProvider = {
    VERSION: 'v1.0',
    generate: generate,
    selectProvider: selectProvider,
    getProviderState: getProviderState,
    refreshQuotas: refreshQuotas,
    updateQuota: updateQuota,
    hasCapability: hasCapability,
    localFallback: localFallback
  };
})();
