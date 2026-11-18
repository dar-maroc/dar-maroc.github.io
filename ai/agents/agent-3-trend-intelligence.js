/* ============================================================
   DAR MAROC AI — AGENT 3 : TREND INTELLIGENCE AI
   ai/agents/agent-3-trend-intelligence.js
   
   Responsabilités :
   - Surveiller les tendances du marché
   - Étudier les contenus publics des concurrents
   - Identifier les sujets populaires
   - Repérer les formats qui fonctionnent
   - Détecter les opportunités de contenu
   - Fournir les sources, les dates et le niveau de confiance des informations
   
   CONTRAINTE : Toutes les données retournées sont basées sur des entrées réelles fournies.
   Aucune donnée n'est inventée. Le niveau de confiance doit refléter la qualité des sources.
   ============================================================ */
(function () {
  'use strict';

  var Agent = {
    id: '3',
    name: 'TREND INTELLIGENCE AI',
    role: 'trendIntelligence',
    permissions: ['read_public', 'monitor_trends', 'cite_sources'],

    handle: function (mission) {
      var payload = mission.payload || {};
      payload.missionId = mission.id;
      var platforms = payload.platforms || ['facebook', 'instagram', 'tiktok', 'youtube'];
      var trendData = payload.trendData || null; // Données réelles fournies

      return this.monitorTrends(platforms, trendData).then(function (trends) {
        return {
          agent: Agent.name,
          agentId: Agent.id,
          type: 'trend_intelligence',
          missionId: payload.missionId,
          content: trends.summary,
          data: trends,
          requiresApproval: true,
          externalAction: false,
          confidence: trends.confidence || 0,
          sources: trends.sources || [],
          opportunities: trends.opportunities || [],
          risks: trends.risks || ['Aucune donnée de tendance fraîche collectée — sources à vérifier'],
          estimatedCost: 0
        };
      });
    },

    /* ---------- Surveiller les tendances ---------- */
    monitorTrends: function (platforms, trendData) {
      // Si aucune donnée réelle n'est fournis, retourner un cadre vide
      if (!trendData || !trendData.sources || trendData.sources.length === 0) {
        return Promise.resolve({
          platforms: platforms,
          summary: 'Aucune donnée de tendance n’a été fournie. L’agent 3 doit collecter des contenus publics des concurrents et identifier les sujets populaires avant de détecter des opportunités.',
          trends: [],
          popularTopics: [],
          workingFormats: [],
          contentOpportunities: [],
          confidence: 0,
          sources: [],
          collectedAt: new Date().toISOString(),
          nextSteps: [
            'Analyser les comptes publics concurrents (FB, IG, TikTok, YouTube)',
            'Identifier les formats vidéo (Reels, Shorts, TikTok) les plus performants',
            'Repérer les sujets saisonniers (été, ramadan, rentrée scolaire)',
            'Citer les sources et dates de chaque information collectée'
          ]
        });
      }

      // Traiter les données réelles fournies
      var trends = this.extractTrends(trendData.trends || []);
      var popularTopics = this.extractPopularTopics(trendData.popularTopics || []);
      var workingFormats = this.extractWorkingFormats(trendData.workingFormats || []);
      var contentOpportunities = this.extractContentOpportunities(trendData.contentOpportunities || []);

      var summary = this.generateSummary(platforms, trends, popularTopics, workingFormats, contentOpportunities);
      var confidence = this.calculateConfidence(trendData);

      return Promise.resolve({
        platforms: platforms,
        summary: summary,
        trends: trends,
        popularTopics: popularTopics,
        workingFormats: workingFormats,
        contentOpportunities: contentOpportunities,
        confidence: confidence,
        sources: trendData.sources || [],
        collectedAt: new Date().toISOString(),
        nextSteps: this.generateNextSteps(trends, popularTopics, workingFormats),
        risks: confidence < 50 ? ['Données de tendance insuffisantes — sources à vérifier'] : []
      });
    },

    /* ---------- Extraire les tendances ---------- */
    extractTrends: function (trends) {
      return (trends || []).map(function (t) {
        return {
          topic: t.topic || 'Non nommé',
          platform: t.platform || 'Non spécifié',
          period: t.period || 'Non spécifié',
          engagement: t.engagement || 'Non mesuré',
          source: t.source || 'Non sourcé',
          date: t.date || new Date().toISOString()
        };
      });
    },

    /* ---------- Extraire les sujets populaires ---------- */
    extractPopularTopics: function (topics) {
      return (topics || []).map(function (t) {
        return {
          topic: t.topic || 'Non nommé',
          frequency: t.frequency || 0,
          platform: t.platform || 'Non spécifié',
          sentiment: t.sentiment || 'Non évalué',
          source: t.source || 'Non sourcé'
        };
      });
    },

    /* ---------- Extraire les formats qui fonctionnent ---------- */
    extractWorkingFormats: function (formats) {
      return (formats || []).map(function (f) {
        return {
          format: f.format || 'Non spécifié',
          platform: f.platform || 'Non spécifié',
          performance: f.performance || 'Non mesuré',
          example: f.example || 'Non fourni',
          source: f.source || 'Non sourcé'
        };
      });
    },

    /* ---------- Extraire les opportunités de contenu ---------- */
    extractContentOpportunities: function (opportunities) {
      return (opportunities || []).map(function (o) {
        return {
          type: o.type || 'Non spécifié',
          description: o.description || '',
          targetAudience: o.targetAudience || 'Non définie',
          estimatedImpact: o.estimatedImpact || 'Non évalué',
          source: o.source || 'Non sourcé'
        };
      });
    },

    /* ---------- Générer un résumé ---------- */
    generateSummary: function (platforms, trends, topics, formats, opportunities) {
      var parts = ['Veille des tendances pour : ' + platforms.join(', ') + '.'];

      if (trends.length > 0) {
        parts.push(trends.length + ' tendance(s) détectée(s).');
      }
      if (topics.length > 0) {
        parts.push(topics.length + ' sujet(s) populaire(s) identifié(s).');
      }
      if (formats.length > 0) {
        parts.push(formats.length + ' format(s) de contenu performant(s) repéré(s).');
      }
      if (opportunities.length > 0) {
        parts.push(opportunities.length + ' opportunité(s) de contenu détectée(s).');
      }

      if (trends.length === 0 && topics.length === 0 && formats.length === 0 && opportunities.length === 0) {
        return 'Aucune donnée de tendance n’a été fournie. L’agent 3 doit collecter des contenus publics des concurrents et identifier les sujets populaires avant de détecter des opportunités.';
      }

      return parts.join(' ');
    },

    /* ---------- Calculer le niveau de confiance ---------- */
    calculateConfidence: function (trendData) {
      var score = 0;
      if (trendData.sources && trendData.sources.length > 0) score += 30;
      if (trendData.trends && trendData.trends.length > 0) score += 25;
      if (trendData.popularTopics && trendData.popularTopics.length > 0) score += 20;
      if (trendData.workingFormats && trendData.workingFormats.length > 0) score += 15;
      if (trendData.contentOpportunities && trendData.contentOpportunities.length > 0) score += 15;
      return Math.min(score, 100);
    },

    /* ---------- Générer les prochaines étapes ---------- */
    generateNextSteps: function (trends, topics, formats) {
      var steps = [];

      if (trends.length === 0) {
        steps.push('Collecter des données de tendance sur les plateformes sociales');
      } else {
        steps.push('Analyser en profondeur les tendances détectées');
      }

      if (topics.length === 0) {
        steps.push('Identifier les sujets populaires sur chaque plateforme');
      } else {
        steps.push('Créer du contenu autour des sujets populaires identifiés');
      }

      if (formats.length === 0) {
        steps.push('Repérer les formats vidéo et image qui fonctionnent');
      } else {
        steps.push('Adapter les formats performants à la stratégie de contenu');
      }

      steps.push('Obtenir une validation humaine avant publication');

      return steps;
    }
  };

  if (window.DarMarocAIOrchestrator) {
    window.DarMarocAIOrchestrator.handleAgentTrendIntelligence = Agent.handle.bind(Agent);
  }

  window.DarMarocAIAgent3 = Agent;
})();
