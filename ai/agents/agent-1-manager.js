/* ============================================================
   DAR MAROC AI — AGENT 1 : DAR MAROC MANAGER AI
   ai/agents/agent-1-manager.js
   
   Responsabilités :
   - Coordonner toute l'équipe
   - Distribuer les missions
   - Organiser les échanges entre agents
   - Vérifier la cohérence des résultats
   - Détecter les contradictions
   - Prioriser les actions
   - Présenter les rapports
   - Demander l'approbation avant toute action externe
   ============================================================ */
(function () {
  'use strict';

  var Agent = {
    id: '1',
    name: 'DAR MAROC MANAGER AI',
    role: 'manager',
    permissions: ['read_all', 'coordinate', 'approve_request', 'report'],

    handle: function (mission) {
      var payload = mission.payload || {};
      var action = payload.action || 'coordinate';

      switch (action) {
        case 'coordinate':
          return this.coordinateTeam(mission);
        case 'report':
          return this.generateReport(mission);
        case 'prioritize':
          return this.prioritizeActions(mission);
        default:
          return Promise.resolve({
            agent: Agent.name,
            agentId: Agent.id,
            type: 'manager',
            missionId: mission.id,
            content: 'Action manager non reconnue : ' + action,
            requiresApproval: false,
            externalAction: false
          });
      }
    },

    /* ---------- Coordination de l'équipe ---------- */
    coordinateTeam: function (mission) {
      var payload = mission.payload || {};
      var targetAgents = payload.targetAgents || ['2', '3', '4']; // par défaut : recherche, tendances, audiences

      var orchestrationPlan = {
        missionId: mission.id,
        coordinator: Agent.name,
        targetAgents: targetAgents,
        steps: [],
        requiresHumanApproval: true
      };

      targetAgents.forEach(function (agentId, index) {
        orchestrationPlan.steps.push({
          step: index + 1,
          agentId: agentId,
          agentName: window.DarMarocAIOrchestrator && window.DarMarocAIOrchestrator.AGENTS
            ? (window.DarMarocAIOrchestrator.AGENTS[agentId] || {}).name || agentId
            : agentId,
          status: 'pending',
          dependsOn: index > 0 ? targetAgents[index - 1] : null
        });
      });

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'manager_coordination',
        missionId: mission.id,
        content: 'Plan d’orchestration préparé pour ' + targetAgents.length + ' agent(s). Chaque mission d’agent sera créée et soumise à validation humaine avant exécution externe.',
        data: orchestrationPlan,
        requiresApproval: true,
        externalAction: false,
        confidence: 100,
        risks: [],
        estimatedCost: 0
      });
    },

    /* ---------- Génération de rapport ---------- */
    generateReport: function (mission) {
      var orchestrator = window.DarMarocAIOrchestrator;
      var missions = orchestrator ? orchestrator.getAllMissions() : [];
      var validations = orchestrator ? orchestrator.getValidations() : [];

      var report = {
        generatedAt: new Date().toISOString(),
        totalMissions: missions.length,
        byStatus: {},
        pendingValidations: validations.filter(function (v) { return v.status === 'pending'; }).length,
        approved: validations.filter(function (v) { return v.status === 'approved'; }).length,
        rejected: validations.filter(function (v) { return v.status === 'rejected'; }).length,
        executed: validations.filter(function (v) { return v.status === 'executed'; }).length,
        agents: []
      };

      missions.forEach(function (m) {
        report.byStatus[m.status] = (report.byStatus[m.status] || 0) + 1;
      });

      Object.keys(window.DarMarocAIOrchestrator.AGENTS || {}).forEach(function (aid) {
        var agentMissions = missions.filter(function (m) { return m.agentId === aid; });
        report.agents.push({
          id: aid,
          name: window.DarMarocAIOrchestrator.AGENTS[aid].name,
          missions: agentMissions.length,
          statuses: agentMissions.reduce(function (acc, m) {
            acc[m.status] = (acc[m.status] || 0) + 1;
            return acc;
          }, {})
        });
      });

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'manager_report',
        missionId: mission.id,
        content: 'Rapport d’activité généré : ' + report.totalMissions + ' mission(s), ' + report.pendingValidations + ' validation(s) en attente.',
        data: report,
        requiresApproval: false,
        externalAction: false,
        confidence: 100,
        estimatedCost: 0
      });
    },

    /* ---------- Priorisation des actions ---------- */
    prioritizeActions: function (mission) {
      var orchestrator = window.DarMarocAIOrchestrator;
      var queue = orchestrator ? orchestrator.getQueue() : [];

      var prioritized = queue.map(function (m) {
        return {
          missionId: m.id,
          title: m.title,
          agentId: m.agentId,
          status: m.status,
          priority: m.priority,
          createdAt: m.createdAt,
          attempts: m.attempts
        };
      }).sort(function (a, b) { return a.priority - b.priority; });

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'manager_prioritization',
        missionId: mission.id,
        content: 'File de traitement : ' + prioritized.length + ' mission(s) ordonnée(s) par priorité.',
        data: { queue: prioritized },
        requiresApproval: false,
        externalAction: false,
        confidence: 100,
        estimatedCost: 0
      });
    }
  };

  if (window.DarMarocAIOrchestrator) {
    window.DarMarocAIOrchestrator.handleAgentManager = Agent.handle.bind(Agent);
  }

  window.DarMarocAIAgent1 = Agent;
})();
