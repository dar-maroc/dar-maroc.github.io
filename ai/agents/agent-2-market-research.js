/* ============================================================
   DAR MAROC AI — AGENT 2 : MARKET RESEARCH AI
   ai/agents/agent-2-market-research.js
   
   Responsabilités :
   - Étudier les marchés marocains et internationaux pertinents
   - Identifier les niches à potentiel
   - Analyser la concurrence
   - Évaluer la demande et les opportunités
   - Étudier les tendances saisonnières
   - Comparer les secteurs et leurs possibilités commerciales
   
   CONTRAINTE : Aucune conclusion commerciale garantie sans données réelles.
   Le choix de la niche ne doit pas présumer que le tourisme/l'immobilier
   est automatiquement la meilleure option.
   Toutes les données retournées sont basées sur des entrées réelles fournies.
   Aucune donnée n'est inventée.
   ============================================================ */
(function () {
  'use strict';

  var Agent = {
    id: '2',
    name: 'MARKET RESEARCH AI',
    role: 'researcher',
    permissions: ['read_public', 'research_niche', 'analyze_competition'],

    /* ---------- Point d'entrée appelé par l'orchestrateur ---------- */
    handle: function (mission) {
      var payload = mission.payload || {};
      payload.missionId = mission.id;
      var scope = payload.scope || 'maroc';
      var focus = payload.focus || 'immobilier';
      var marketData = payload.marketData || null; // Données réelles fournies

      return this.researchMarket(scope, focus, marketData).then(function (research) {
        return {
          agent: Agent.name,
          agentId: Agent.id,
          type: 'market_research',
          missionId: payload.missionId,
          content: research.summary,
          data: research,
          requiresApproval: true,
          externalAction: false,
          confidence: research.confidence || 0,
          sources: research.sources || [],
          niches: research.niches || [],
          competitors: research.competitors || [],
          risks: research.risks || ['Aucune donnée de marché fraîche collectée — validation humaine requise avant toute décision'],
          estimatedCost: 0
        };
      });
    },

    /* ---------- Étude de marché ---------- */
    researchMarket: function (scope, focus, marketData) {
      // Si aucune donnée réelle n'est fournis, retourner un cadre vide
      if (!marketData || !marketData.sources || marketData.sources.length === 0) {
        return Promise.resolve({
          scope: scope,
          focus: focus,
          summary: 'Aucune donnée de marché réelle fournie. L’agent 2 doit collecter des données réelles (volumes de recherche, concurrence, saisonnalité) avant de recommander une niche.',
          niches: [],
          competitors: [],
          seasonalTrends: [],
          confidence: 0,
          sources: [],
          nextSteps: [
            'Installer Google Search Console et Analytics pour obtenir des données réelles',
            'Collecter les insights des comptes sociaux (FB, IG, TikTok, YouTube)',
            'Auditer 5 concurrents locaux (prix, annonces, présence en ligne)',
            'Rechercher des mots-clés FR/AR/Darija avec volumes réels',
            'Réaliser 10 entretiens clients / diaspora'
          ]
        });
      }

      // Traiter les données réelles fournies
      var niches = this.identifyNiches(marketData);
      var competitors = this.analyzeCompetition(marketData.competitors || []);
      var seasonalTrends = this.analyzeSeasonalTrends(marketData.seasonalData || []);

      var summary = this.generateSummary(scope, focus, niches, competitors, seasonalTrends);
      var confidence = this.calculateConfidence(marketData);

      return Promise.resolve({
        scope: scope,
        focus: focus,
        summary: summary,
        niches: niches,
        competitors: competitors,
        seasonalTrends: seasonalTrends,
        confidence: confidence,
        sources: marketData.sources || [],
        nextSteps: this.generateNextSteps(niches, competitors),
        risks: confidence < 50 ? ['Données insuffisantes pour une décision fiable'] : [],
        estimatedCost: 0
      });
    },

    /* ---------- Identifier les niches à potentiel ---------- */
    identifyNiches: function (marketData) {
      var niches = [];
      var data = marketData.nicheData || [];

      data.forEach(function (item) {
        niches.push({
          id: item.id || 'niche-' + niches.length,
          name: item.name || 'Sans nom',
          status: item.status || 'non_étudiée',
          confidence: item.confidence || 0,
          evidence: item.evidence || [],
          note: item.note || ''
        });
      });

      return niches;
    },

    /* ---------- Analyser la concurrence ---------- */
    analyzeCompetition: function (competitors) {
      var results = [];

      (competitors || []).forEach(function (comp) {
        results.push({
          name: comp.name || 'Non nommé',
          sector: comp.sector || 'Non spécifié',
          strength: comp.strength || 'Non évaluée',
          weakness: comp.weakness || 'Non évaluée',
          marketShare: comp.marketShare || 'Non connue',
          source: comp.source || 'Non sourcé'
        });
      });

      return results;
    },

    /* ---------- Analyser les tendances saisonnières ---------- */
    analyzeSeasonalTrends: function (seasonalData) {
      var trends = [];

      (seasonalData || []).forEach(function (item) {
        trends.push({
          period: item.period || 'Non spécifié',
          trend: item.trend || 'Non déterminée',
          impact: item.impact || 'Non évalué',
          source: item.source || 'Non sourcé'
        });
      });

      return trends;
    },

    /* ---------- Générer un résumé ---------- */
    generateSummary: function (scope, focus, niches, competitors, trends) {
      var nicheCount = niches.length;
      var competitorCount = competitors.length;
      var trendCount = trends.length;

      if (nicheCount === 0 && competitorCount === 0 && trendCount === 0) {
        return 'Aucune donnée de marché n’a été fournie. L’agent 2 doit collecter des données réelles (volumes de recherche, concurrence, saisonnalité) avant de recommander une niche.';
      }

      var summary = 'Marché ' + scope + ' (secteur ' + focus + ') : ';
      summary += nicheCount + ' niche(s) identifiée(s), ';
      summary += competitorCount + ' concurrent(s) analysé(s), ';
      summary += trendCount + ' tendance(s) saisonnière(s) détectée(s). ';

      if (nicheCount > 0) {
        summary += 'Les niches détectées méritent une validation humaine avant toute décision.';
      }

      return summary;
    },

    /* ---------- Calculer le niveau de confiance ---------- */
    calculateConfidence: function (marketData) {
      var score = 0;
      if (marketData.sources && marketData.sources.length > 0) score += 30;
      if (marketData.nicheData && marketData.nicheData.length > 0) score += 30;
      if (marketData.competitors && marketData.competitors.length > 0) score += 20;
      if (marketData.seasonalData && marketData.seasonalData.length > 0) score += 20;
      return Math.min(score, 100);
    },

    /* ---------- Générer les prochaines étapes ---------- */
    generateNextSteps: function (niches, competitors) {
      var steps = [];

      if (niches.length === 0) {
        steps.push('Collecter des données de marché réelles avant de définir des niches');
      } else {
        steps.push('Valider les niches identifiées avec des données réelles');
      }

      if (competitors.length === 0) {
        steps.push('Collecter des données sur la concurrence');
      } else {
        steps.push('Analyser en profondeur les concurrents identifiés');
      }

      steps.push('Obtenir une validation humaine avant toute décision commerciale');

      return steps;
    }
  };

  // Enregistrement auprès de l'orchestrateur
  if (window.DarMarocAIOrchestrator) {
    window.DarMarocAIOrchestrator.handleAgentResearcher = Agent.handle.bind(Agent);
  }

  window.DarMarocAIAgent2 = Agent;
})();
