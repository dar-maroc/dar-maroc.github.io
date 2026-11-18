/* ============================================================
   DAR MAROC AI — AGENT 9 : PERFORMANCE ANALYST AI
   ai/agents/agent-9-performance-analyst.js
   
   Responsabilités :
   - Analyser les résultats des campagnes
   - Comparer les publications
   - Mesurer les performances par plateforme
   - Identifier les contenus performants
   - Suivre les clics et les prospects
   - Détecter les campagnes inefficaces
   - Proposer des améliorations basées sur des données réelles
   
   CONTRAINTE : Aucun chiffre fictif ne doit être présenté comme une statistique réelle.
   Toutes les données retournées sont basées sur des entrées réelles fournies.
   ============================================================ */
(function () {
  'use strict';

  var Agent = {
    id: '9',
    name: 'PERFORMANCE ANALYST AI',
    role: 'performanceAnalyst',
    permissions: ['analyze_results', 'compare_content', 'track_clicks'],

    handle: function (mission) {
      var payload = mission.payload || {};
      payload.missionId = mission.id;
      var action = payload.action || 'analyze';

      switch (action) {
        case 'analyze':
          return this.analyzeCampaigns(payload);
        case 'compare':
          return this.compareContent(payload);
        case 'track':
          return this.trackClicks(payload);
        case 'ineffective':
          return this.detectIneffective(payload);
        default:
          return Promise.resolve({
            agent: Agent.name,
            agentId: Agent.id,
            type: 'performance',
            missionId: mission.id,
            content: 'Action non reconnue : ' + action,
            requiresApproval: false,
            externalAction: false
          });
      }
    },

    /* ---------- Analyse des campagnes ---------- */
    analyzeCampaigns: function (payload) {
      var statsSource = payload.statsSource || 'localStorage';
      var campaignData = payload.campaignData || null; // Données réelles

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'campaign_analysis',
        missionId: payload.missionId,
        content: 'Analyse de performance préparée. Source des données : ' + statsSource + '. ' + (campaignData ? campaignData.campaigns.length + ' campagne(s) analysée(s).' : 'Aucune donnée de campagne réelle n’a été collectée.'),
        data: {
          statsSource: statsSource,
          totalViews: campaignData && campaignData.totalViews !== undefined ? campaignData.totalViews : null,
          totalClicks: campaignData && campaignData.totalClicks !== undefined ? campaignData.totalClicks : null,
          totalLeads: campaignData && campaignData.totalLeads !== undefined ? campaignData.totalLeads : null,
          conversions: campaignData && campaignData.conversions !== undefined ? campaignData.conversions : null,
          byPlatform: campaignData && campaignData.byPlatform ? campaignData.byPlatform : {},
          topContent: campaignData && campaignData.topContent ? campaignData.topContent : [],
          bottomContent: campaignData && campaignData.bottomContent ? campaignData.bottomContent : [],
          note: campaignData ? 'Données réelles fournies.' : 'Les chiffres sont null tant qu’aucune donnée réelle n’est collectée (stats.js localStorage, Supabase stat_events, ou analytics externe).',
          warning: campaignData ? null : 'Aucune donnée inventée — afficher "non disponible" plutôt qu’un chiffre fictif.'
        },
        requiresApproval: false,
        externalAction: false,
        confidence: campaignData ? 85 : 0,
        estimatedCost: 0
      });
    },

    /* ---------- Comparaison de contenus ---------- */
    compareContent: function (payload, missionId) {
      var items = payload.items || [];

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'content_comparison',
        missionId: payload.missionId,
        content: 'Comparaison de ' + items.length + ' contenu(s) préparée.',
        data: {
          items: items,
          comparison: this.compareItems(items),
          bestPerforming: this.findBestPerforming(items),
          worstPerforming: this.findWorstPerforming(items),
          criteria: ['taux d’engagement', 'clics', 'partages', 'commentaires'],
          note: items.length > 0 ? 'Comparaison basée sur des données réelles fournies.' : 'La comparaison nécessite des données de performance réelles par contenu.'
        },
        requiresApproval: false,
        externalAction: false,
        confidence: items.length > 0 ? 80 : 0,
        estimatedCost: 0
      });
    },

    /* ---------- Comparer les items ---------- */
    compareItems: function (items) {
      return items.map(function (item) {
        return {
          id: item.id || 'non-identifié',
          name: item.name || 'Sans nom',
          metrics: item.metrics || {},
          score: item.score || 0
        };
      }).sort(function (a, b) {
        return (b.score || 0) - (a.score || 0);
      });
    },

    /* ---------- Trouver le meilleur ---------- */
    findBestPerforming: function (items) {
      if (!items || items.length === 0) return null;
      return items.reduce(function (best, current) {
        return (current.score || 0) > (best.score || 0) ? current : best;
      });
    },

    /* ---------- Trouver le pire ---------- */
    findWorstPerforming: function (items) {
      if (!items || items.length === 0) return null;
      return items.reduce(function (worst, current) {
        return (current.score || 0) < (worst.score || 0) ? current : worst;
      });
    },

    /* ---------- Suivi des clics ---------- */
    trackClicks: function (payload, missionId) {
      var link = payload.link || '';
      var utm = payload.utm || null;
      var clickData = payload.clickData || null; // Données réelles

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'click_tracking',
        missionId: payload.missionId,
        content: 'Suivi de clic préparé pour : ' + link,
        data: {
          link: link,
          utm: utm,
          clicks: clickData && clickData.clicks !== undefined ? clickData.clicks : null,
          conversions: clickData && clickData.conversions !== undefined ? clickData.conversions : null,
          note: clickData ? 'Données réelles fournies.' : 'À connecter avec les statistiques réelles (utils/stats.js + stat_events).'
        },
        requiresApproval: false,
        externalAction: false,
        confidence: clickData ? 90 : 0,
        estimatedCost: 0
      });
    },

    /* ---------- Détection des campagnes inefficaces ---------- */
    detectIneffective: function (payload) {
      var campaigns = payload.campaigns || [];

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'ineffective_detection',
        missionId: payload.missionId,
        content: 'Détection des campagnes inefficaces préparée.',
        data: {
          ineffectiveCampaigns: this.findIneffective(campaigns),
          effectiveCampaigns: this.findEffective(campaigns),
          recommendations: this.generateRecommendations(campaigns),
          note: campaigns.length === 0 ? 'Nécessite des données de performance réelles pour identifier les campagnes inefficaces.' : 'Analyse basée sur des données réelles.'
        },
        requiresApproval: false,
        externalAction: false,
        confidence: campaigns.length > 0 ? 80 : 0,
        estimatedCost: 0
      });
    },

    /* ---------- Trouver les campagnes inefficaces ---------- */
    findIneffective: function (campaigns) {
      return (campaigns || []).filter(function (c) {
        return (c.ctr || 0) < 0.01 || (c.conversionRate || 0) < 0.01;
      });
    },

    /* ---------- Trouver les campagnes efficaces ---------- */
    findEffective: function (campaigns) {
      return (campaigns || []).filter(function (c) {
        return (c.ctr || 0) >= 0.05 || (c.conversionRate || 0) >= 0.05;
      });
    },

    /* ---------- Générer des recommandations ---------- */
    generateRecommendations: function (campaigns) {
      var recs = [];

      if (campaigns.length === 0) {
        recs.push('Collecter des données de performance avant d’analyser les campagnes.');
        return recs;
      }

      var ineffective = this.findIneffective(campaigns);
      if (ineffective.length > 0) {
        recs.push('Réviser ou arrêter ' + ineffective.length + ' campagne(s) inefficace(s).');
      }

      var effective = this.findEffective(campaigns);
      if (effective.length > 0) {
        recs.push('Réallouer le budget vers ' + effective.length + ' campagne(s) performante(s).');
      }

      recs.push('Tester A/B sur les créations publicitaires.');
      recs.push('Obtenir une validation humaine avant toute modification de budget.');

      return recs;
    }
  };

  if (window.DarMarocAIOrchestrator) {
    window.DarMarocAIOrchestrator.handleAgentAnalyst = Agent.handle.bind(Agent);
  }

  window.DarMarocAIAgent9 = Agent;
})();
