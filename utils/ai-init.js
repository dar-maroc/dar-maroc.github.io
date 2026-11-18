/* ============================================================
   DAR MAROC AI — INITIALISATION PRINCIPALE
   utils/ai-init.js
   
   Lie ensemble :
   - Couche IA existante (utils/ai.js — chatbot + génération corrigée)
   - Fournisseurs IA (utils/ai-provider.js — abstraction + fallback)
   - Orchestrateur (utils/ai-orchestrator.js — file de tâches, validation)
   - Neuf agents (ai/agents/agent-*.js)
   
   Mode : préparation + validation humaine obligatoire.
   Aucune action externe sans approbation.
   ============================================================ */
(function () {
  'use strict';

  var DARMAROC_AI = {
    version: 'v1.0.0',
    initialized: false,
    modules: {},
    config: null,

    /* ---------- Initialisation ---------- */
    init: function (options) {
      options = options || {};
      this.config = options.config || (window.DARMAROC_CONFIG || {});

      var modulesLoaded = [];

      // Vérifier la présence des modules
      var requiredModules = [
        { name: 'ai', check: function () { return !!window.DarMarocAI; } },
        { name: 'provider', check: function () { return !!window.DarMarocAIProvider; } },
        { name: 'orchestrator', check: function () { return !!window.DarMarocAIOrchestrator; } }
      ];

      requiredModules.forEach(function (mod) {
        if (mod.check()) {
          this.modules[mod.name] = true;
          modulesLoaded.push(mod.name);
        } else {
          console.warn('[DAR MAROC AI] Module manquant : ' + mod.name);
        }
      }, this);

      // Initialiser l'orchestrateur
      if (this.modules.orchestrator) {
        var orchResult = window.DarMarocAIOrchestrator.init({
          supabase: window.Supabase && window.Supabase.client ? window.Supabase : null
        });
        this.log('orchestrator', 'info', 'DAR MAROC AI initialisé. Modules : ' + modulesLoaded.join(', '));
        this.log('orchestrator', 'info', 'Agents disponibles : ' + Object.keys(orchResult.agents).length);
      }

      this.initialized = true;
      this.log('orchestrator', 'info', 'DAR MAROC AI prêt. Mode : préparation + validation humaine.');

      return {
        version: this.version,
        initialized: this.initialized,
        modules: modulesLoaded,
        agents: this.modules.orchestrator ? window.DarMarocAIOrchestrator.getAllAgents() : {}
      };
    },

    /* ---------- Créer une mission d'agent ---------- */
    createMission: function (missionData) {
      if (!this.initialized || !this.modules.orchestrator) {
        throw new Error('DAR MAROC AI non initialisé.');
      }
      return window.DarMarocAIOrchestrator.createMission(missionData);
    },

    /* ---------- Obtenir l'état du système ---------- */
    getStatus: function () {
      var status = {
        version: this.version,
        initialized: this.initialized,
        timestamp: new Date().toISOString(),
        modules: this.modules,
        agents: {},
        queue: [],
        validations: [],
        providers: null
      };

      if (this.modules.orchestrator) {
        var orch = window.DarMarocAIOrchestrator;
        Object.keys(orch.AGENTS || {}).forEach(function (aid) {
          status.agents[aid] = {
            id: aid,
            name: orch.AGENTS[aid].name,
            role: orch.AGENTS[aid].role,
            permissions: orch.AGENTS[aid].permissions
          };
        });
        status.queue = orch.getQueue();
        status.validations = orch.getValidations().filter(function (v) { return v.status === 'pending'; });
      }

      if (this.modules.provider) {
        status.providers = window.DarMarocAIProvider.getProviderState();
      }

      return status;
    },

    /* ---------- Log helper ---------- */
    log: function (agentId, level, message, missionId, context) {
      if (this.modules.orchestrator) {
        window.DarMarocAIOrchestrator.log(agentId, level, message, missionId, context);
      }
    }
  };

  window.DarMarocAI = window.DarMarocAI || {};
  window.DarMarocAI.system = DARMAROC_AI;

  // Auto-initialisation si tous les modules sont présents
  if (window.DarMarocAI && window.DarMarocAIProvider && window.DarMarocAIOrchestrator) {
    // Attendre que le DOM soit prêt (navigateur uniquement)
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          DARMAROC_AI.init();
        });
      } else {
        DARMAROC_AI.init();
      }
    } else {
      // Environnement Node.js (tests) : initialisation immédiate
      DARMAROC_AI.init();
    }
  }
})();
