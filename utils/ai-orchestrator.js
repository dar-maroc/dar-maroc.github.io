/* ============================================================
   DAR MAROC AI — ORCHESTRATEUR CENTRAL
   utils/ai-orchestrator.js
   
   Rôle :
   - Coordination des dix agents IA
   - File de tâches avec statuts (queued → running → awaiting_approval → approved/rejected → executed/failed)
   - Historique des missions et journaux d'activité
   - Partage contrôlé du contexte (moindre privilège par agent)
   - Gestion des erreurs, limites de tentatives, mécanismes de reprise
   - Prévention des doublons (idempotency key)
   - Permissions par agent
   - Traçabilité des recommandations et décisions
   
   MODE DE FONCTIONNEMENT :
   Préparation et validation humaine obligatoire. Aucun agent ne peut
   exécuter une action externe (publication, envoi, contact) sans approbation.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Configuration des dix agents ---------- */
  var AGENTS = {
    '1': { id: '1', name: 'DAR MAROC MANAGER AI', role: 'manager', permissions: ['read_all', 'coordinate', 'approve_request', 'report'] },
    '2': { id: '2', name: 'MARKET RESEARCH AI', role: 'researcher', permissions: ['read_public', 'research_niche', 'analyze_competition'] },
    '3': { id: '3', name: 'TREND INTELLIGENCE AI', role: 'trendIntelligence', permissions: ['read_public', 'monitor_trends', 'cite_sources'] },
    '4': { id: '4', name: 'AUDIENCE INTELLIGENCE AI', role: 'audienceIntelligence', permissions: ['read_public', 'segment_audience', 'recommend_language'] },
    '5': { id: '5', name: 'CONTENT CREATOR AI', role: 'creator', permissions: ['draft_content', 'generate_variants', 'visual_brief'] },
    '6': { id: '6', name: 'SOCIAL MEDIA MANAGER AI', role: 'publisher', permissions: ['prepare_calendar', 'adapt_platform', 'prepare_response'] },
    '7': { id: '7', name: 'SEO AND TRAFFIC AI', role: 'seo', permissions: ['analyze_seo', 'identify_keywords', 'prepare_utm'] },
    '8': { id: '8', name: 'BUSINESS DEVELOPMENT AI', role: 'developer', permissions: ['research_partners', 'prepare_proposal', 'classify_opportunity'] },
    '9': { id: '9', name: 'PERFORMANCE ANALYST AI', role: 'performanceAnalyst', permissions: ['analyze_results', 'compare_content', 'track_clicks'] },
    '10': { id: '10', name: 'REAL ESTATE LISTINGS AI', role: 'realEstateListings', permissions: ['read_public', 'search_properties', 'verify_listing', 'detect_duplicates', 'prepare_listing', 'classify_opportunity'] }
  };

  /* ---------- Statuts de mission ---------- */
  var STATUSES = {
    QUEUED: 'queued',
    RUNNING: 'running',
    AWAITING_APPROVAL: 'awaiting_approval',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    EXECUTED: 'executed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  };

  /* ---------- État en mémoire (complété par Supabase si configuré) ---------- */
  var missions = {};           // id -> mission
  var missionQueue = [];       // tableau des ids en attente, ordonnés par priorité
  var agentLogs = [];          // journaux d'activité
  var validations = {};        // id -> validation
  var isProcessing = false;    // verrou de traitement
  var supabaseEnabled = false;

  /* ---------- Initialisation ---------- */
  function init(options) {
    options = options || {};
    supabaseEnabled = !!(options.supabase && options.supabase.client && options.supabase.isConfigured && options.supabase.isConfigured());
    log('orchestrator', 'info', 'Orchestrateur initialisé. Supabase : ' + (supabaseEnabled ? 'activé' : 'désactivé (mode local)'));
    if (supabaseEnabled) {
      loadMissionsFromCloud();
    }
    return { agents: AGENTS, statuses: STATUSES, supabase: supabaseEnabled };
  }

  /* ---------- Journaux d'activité ---------- */
  function log(agentId, level, message, missionId, context) {
    var entry = {
      id: generateId(),
      mission_id: missionId || null,
      agent_id: agentId,
      action: message,
      level: level || 'info',
      context: context || {},
      created_at: new Date().toISOString()
    };
    agentLogs.unshift(entry);
    if (agentLogs.length > 1000) agentLogs.pop();

    if (supabaseEnabled) {
      pushLogToCloud(entry);
    }
    return entry;
  }

  /* ---------- Génération d'ID ---------- */
  function generateId() {
    return 'ai_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  /* ---------- Vérification des permissions d'un agent ---------- */
  function hasPermission(agentId, permission) {
    var agent = AGENTS[agentId];
    if (!agent) return false;
    return agent.permissions.indexOf(permission) !== -1 || agent.permissions.indexOf('*') !== -1;
  }

  /* ---------- Création d'une mission ---------- */
  function createMission(missionData) {
    missionData = missionData || {};
    var agentId = missionData.agentId || '1';
    if (!AGENTS[agentId]) {
      throw new Error('Agent inconnu : ' + agentId);
    }

    var idempotencyKey = missionData.idempotencyKey
      || (missionData.payload && missionData.payload.idempotencyKey)
      || generateId();

    // Prévention des doublons : même idempotency key = même mission
    for (var mid in missions) {
      if (missions[mid].idempotencyKey === idempotencyKey) {
        log('orchestrator', 'warn', 'Doublon détecté — mission existante retournée : ' + mid, mid);
        return missions[mid];
      }
    }

    var mission = {
      id: generateId(),
      title: missionData.title || 'Mission sans titre',
      description: missionData.description || '',
      agentId: agentId,
      status: STATUSES.QUEUED,
      priority: missionData.priority || 5,
      payload: missionData.payload || {},
      result: null,
      error: null,
      attempts: 0,
      maxAttempts: missionData.maxAttempts || 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      idempotencyKey: idempotencyKey,
      validationId: null
    };

    missions[mission.id] = mission;
    enqueueMission(mission.id);
    log('orchestrator', 'info', 'Mission créée : ' + mission.title + ' (agent ' + agentId + ')', mission.id);

    // Démarrage du traitement si pas déjà en cours
    if (!isProcessing) {
      processQueue();
    }

    return mission;
  }

  /* ---------- File de tâches ---------- */
  function enqueueMission(missionId) {
    if (missionQueue.indexOf(missionId) !== -1) return;
    var mission = missions[missionId];
    // Insertion ordonnée par priorité (1 = plus haute)
    var inserted = false;
    for (var i = 0; i < missionQueue.length; i++) {
      var other = missions[missionQueue[i]];
      if (other && mission.priority < other.priority) {
        missionQueue.splice(i, 0, missionId);
        inserted = true;
        break;
      }
    }
    if (!inserted) missionQueue.push(missionId);
  }

  function dequeueMission() {
    return missionQueue.shift();
  }

  /* ---------- Traitement de la file ---------- */
  function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    var nextId = dequeueMission();
    if (!nextId) {
      isProcessing = false;
      return;
    }

    var mission = missions[nextId];
    if (!mission) {
      isProcessing = false;
      processQueue();
      return;
    }

    // Si déjà en cours ou terminée, passer à la suivante
    if (mission.status !== STATUSES.QUEUED) {
      isProcessing = false;
      processQueue();
      return;
    }

    executeMission(mission).then(function () {
      isProcessing = false;
      processQueue();
    }).catch(function (err) {
      log('orchestrator', 'error', 'Erreur traitement mission ' + nextId + ' : ' + err.message, nextId);
      isProcessing = false;
      processQueue();
    });
  }

  /* ---------- Exécution d'une mission ---------- */
  function executeMission(mission) {
    mission.status = STATUSES.RUNNING;
    mission.startedAt = new Date().toISOString();
    mission.updatedAt = new Date().toISOString();
    mission.attempts++;

    log(mission.agentId, 'info', 'Début exécution : ' + mission.title, mission.id, { attempt: mission.attempts });

    var agent = AGENTS[mission.agentId];
    if (!agent) {
      return failMission(mission, 'Agent ' + mission.agentId + ' introuvable');
    }

    // Selon le type d'agent, déléguer au handler approprié
    return dispatchToAgent(agent, mission).then(function (result) {
      mission.result = result;
      mission.status = STATUSES.AWAITING_APPROVAL;  // Validation humaine obligatoire avant exécution externe
      mission.updatedAt = new Date().toISOString();
      mission.completedAt = new Date().toISOString();

      log(mission.agentId, 'info', 'Mission préparée, en attente de validation : ' + mission.title, mission.id, { result: result });

      // Créer l'entrée de validation
      createValidation(mission);

      if (supabaseEnabled) {
        pushMissionToCloud(mission);
      }

      return mission;
    }).catch(function (err) {
      return handleMissionError(mission, err);
    });
  }

  /* ---------- Dispatch vers l'agent approprié ---------- */
  function dispatchToAgent(agent, mission) {
    var handlerName = 'handleAgent' + agent.role.charAt(0).toUpperCase() + agent.role.slice(1);
    var handler = window.DarMarocAIOrchestrator && window.DarMarocAIOrchestrator[handlerName];
    if (handler) {
      return handler(mission);
    }
    // Handler par défaut : résultat générique
    return Promise.resolve({
      agent: agent.name,
      type: 'generic',
      content: 'Mission préparée par ' + agent.name + '. Aucun handler spécifique implémenté.',
      requiresApproval: true,
      externalAction: false
    });
  }

  /* ---------- Gestion d'erreur de mission ---------- */
  function handleMissionError(mission, err) {
    mission.error = err && err.message ? err.message : String(err);
    mission.updatedAt = new Date().toISOString();

    log(mission.agentId, 'error', 'Échec mission : ' + mission.error, mission.id, { attempt: mission.attempts });

    if (mission.attempts < mission.maxAttempts) {
      // Mécanisme de reprise : remettre en file avec priorité réduite
      mission.status = STATUSES.QUEUED;
      mission.priority = Math.min(9, mission.priority + 1);
      enqueueMission(mission.id);
      log(mission.agentId, 'warn', 'Reprise planifiée (tentative ' + (mission.attempts + 1) + '/' + mission.maxAttempts + ')', mission.id);
      if (!isProcessing) processQueue();
      return mission;
    }

    // Échec définitif
    mission.status = STATUSES.FAILED;
    mission.completedAt = new Date().toISOString();
    log(mission.agentId, 'error', 'Mission échouée définitivement après ' + mission.attempts + ' tentatives', mission.id);

    if (supabaseEnabled) pushMissionToCloud(mission);
    return mission;
  }

  function failMission(mission, message) {
    mission.status = STATUSES.FAILED;
    mission.error = message;
    mission.completedAt = new Date().toISOString();
    log(mission.agentId, 'error', message, mission.id);
    if (supabaseEnabled) pushMissionToCloud(mission);
    return Promise.reject(new Error(message));
  }

  /* ---------- Centre de validation ---------- */
  function createValidation(mission) {
    var validation = {
      id: generateId(),
      missionId: mission.id,
      agentId: mission.agentId,
      actionProposed: mission.title,
      content: mission.result ? mission.result.content || JSON.stringify(mission.result) : '',
      platform: mission.result && mission.result.platform ? mission.result.platform : null,
      scheduledAt: null,
      risks: mission.result && mission.result.risks ? mission.result.risks : '',
      estimatedCost: mission.result && mission.result.estimatedCost !== undefined ? mission.result.estimatedCost : 0,
      status: 'pending',
      decidedBy: null,
      decidedAt: null,
      decisionNote: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    validations[validation.id] = validation;
    mission.validationId = validation.id;
    log('orchestrator', 'info', 'Validation créée : ' + validation.id, mission.id);
    return validation;
  }

  /* ---------- Décision humaine sur une validation ---------- */
  function decideValidation(validationId, decision, decidedBy, note) {
    decision = String(decision).toLowerCase();
    if (['pending','approved','rejected','executed','error'].indexOf(decision) === -1) {
      throw new Error('Décision invalide : ' + decision);
    }

    var validation = validations[validationId];
    if (!validation) throw new Error('Validation introuvable : ' + validationId);
    if (validation.status !== 'pending') {
      throw new Error('Validation déjà traitée : ' + validation.status);
    }

    validation.status = decision;
    validation.decidedBy = decidedBy || 'system';
    validation.decidedAt = new Date().toISOString();
    validation.decisionNote = note || null;
    validation.updatedAt = new Date().toISOString();

    var mission = missions[validation.missionId];
    if (mission) {
      if (decision === 'approved') {
        mission.status = STATUSES.APPROVED;
        log(validation.agentId, 'info', 'Mission approuvée par ' + (decidedBy || 'humain'), mission.id);
      } else if (decision === 'rejected') {
        mission.status = STATUSES.REJECTED;
        log(validation.agentId, 'info', 'Mission refusée par ' + (decidedBy || 'humain'), mission.id);
      }
      mission.updatedAt = new Date().toISOString();
    }

    log('orchestrator', 'info', 'Décision enregistrée : ' + decision + ' pour validation ' + validationId, validation.missionId);

    if (supabaseEnabled) {
      pushValidationToCloud(validation);
      if (mission) pushMissionToCloud(mission);
    }

    return { validation: validation, mission: mission || null };
  }

  /* ---------- Exécution d'une mission approuvée ---------- */
  function executeApprovedMission(missionId) {
    var mission = missions[missionId];
    if (!mission) throw new Error('Mission introuvable : ' + missionId);
    if (mission.status !== STATUSES.APPROVED) {
      throw new Error('Mission non approuvée (statut : ' + mission.status + ')');
    }

    // L'exécution externe (publication, envoi, contact) reste sous contrôle humain.
    // Ici, on marque comme exécutée sans effet de bord externe automatique.
    mission.status = STATUSES.EXECUTED;
    mission.completedAt = new Date().toISOString();
    mission.updatedAt = new Date().toISOString();

    var validation = null;
    for (var vid in validations) {
      if (validations[vid].missionId === missionId) {
        validation = validations[vid];
        validation.status = 'executed';
        validation.updatedAt = new Date().toISOString();
        break;
      }
    }

    log(mission.agentId, 'info', 'Mission exécutée (préparation validée) : ' + mission.title, mission.id);

    if (supabaseEnabled) {
      pushMissionToCloud(mission);
      if (validation) pushValidationToCloud(validation);
    }

    return { mission: mission, validation: validation };
  }

  /* ---------- Requêtes publiques ---------- */
  function getMission(id) { return missions[id] || null; }
  function getAllMissions() {
    return Object.keys(missions).map(function (id) { return missions[id]; }).sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }
  function getQueue() {
    return missionQueue.map(function (id) { return missions[id]; }).filter(Boolean);
  }
  function getValidations() {
    return Object.keys(validations).map(function (id) { return validations[id]; }).sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }
  function getValidation(id) { return validations[id] || null; }
  function getAgentLogs(missionId, limit) {
    var logs = agentLogs;
    if (missionId) logs = logs.filter(function (l) { return l.mission_id === missionId; });
    logs.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    if (limit) logs = logs.slice(0, limit);
    return logs;
  }
  function getAgentInfo(agentId) { return AGENTS[agentId] || null; }
  function getAllAgents() { return AGENTS; }

  /* ---------- Synchronisation Supabase (placeholders, appelés si configuré) ---------- */
  function loadMissionsFromCloud() {
    // À implémenter : fetch depuis Supabase ai_missions
    log('orchestrator', 'debug', 'Chargement des missions depuis Supabase');
  }
  function pushMissionToCloud(mission) {
    // À implémenter : upsert vers Supabase ai_missions
  }
  function pushLogToCloud(entry) {
    // À implémenter : insert vers Supabase ai_agent_logs
  }
  function pushValidationToCloud(validation) {
    // À implémenter : upsert vers Supabase ai_validations
  }

  /* ---------- API publique ---------- */
  window.DarMarocAIOrchestrator = {
    VERSION: 'v1.0',
    init: init,
    AGENTS: AGENTS,
    STATUSES: STATUSES,
    createMission: createMission,
    getMission: getMission,
    getAllMissions: getAllMissions,
    getQueue: getQueue,
    getValidations: getValidations,
    getValidation: getValidation,
    decideValidation: decideValidation,
    executeApprovedMission: executeApprovedMission,
    getAgentLogs: getAgentLogs,
    getAgentInfo: getAgentInfo,
    getAllAgents: getAllAgents,
    hasPermission: hasPermission,
    log: log,
    processQueue: processQueue
  };
})();
