/* ============================================================
   DAR MAROC AI — AGENT 4 : AUDIENCE INTELLIGENCE AI
   ai/agents/agent-4-audience-intelligence.js
   
   Responsabilités :
   - Identifier les publics cibles
   - Segmenter les audiences
   - Étudier leurs besoins et leurs intentions
   - Identifier les langues adaptées à chaque segment
   - Étudier les audiences marocaines et la diaspora
   - Recommander les publics à cibler selon les données disponibles
   
   CONTRAINTE : Toutes les données retournées sont basées sur des entrées réelles fournies.
   Aucune donnée n'est inventée.
   ============================================================ */
(function () {
  'use strict';

  var Agent = {
    id: '4',
    name: 'AUDIENCE INTELLIGENCE AI',
    role: 'audienceIntelligence',
    permissions: ['read_public', 'segment_audience', 'recommend_language'],

    SUPPORTED_LANGUAGES: ['fr', 'ar', 'darija', 'en', 'es'],

    handle: function (mission) {
      var payload = mission.payload || {};
      payload.missionId = mission.id;
      var segment = payload.segment || 'general';
      var audienceData = payload.audienceData || null; // Données réelles fournies

      return this.identifyAudience(segment, audienceData).then(function (audience) {
        return {
          agent: Agent.name,
          agentId: Agent.id,
          type: 'audience_intelligence',
          missionId: payload.missionId,
          content: audience.summary,
          data: audience,
          requiresApproval: true,
          externalAction: false,
          confidence: audience.confidence || 0,
          sources: audience.sources || [],
          segments: audience.segments || [],
          recommendedLanguages: audience.recommendedLanguages || ['fr'],
          risks: audience.risks || ['Données d’audience non collectées — recommandations à valider sur des données réelles'],
          estimatedCost: 0
        };
      });
    },

    /* ---------- Identifier les publics cibles ---------- */
    identifyAudience: function (segment, audienceData) {
      // Si aucune donnée réelle n'est fournis, retourner un cadre vide
      if (!audienceData || !audienceData.segments || audienceData.segments.length === 0) {
        return Promise.resolve({
          segment: segment,
          summary: 'Aucune donnée d’audience n’a été fournie. L’agent 4 doit collecter des données démographiques et comportementales avant de segmenter.',
          segments: [],
          recommendedLanguages: ['fr', 'ar', 'darija', 'en', 'es'],
          confidence: 0,
          sources: [],
          nextSteps: [
            'Installer Google Analytics 4 et Search Console',
            'Collecter les insights démographiques des comptes sociaux',
            'Segmenter par ville (Agadir, Casablanca, Marrakech, Rabat, Tanger…)',
            'Différencier audience locale et diaspora',
            'Valider les langues par segment (Darija pour l’oral local, FR/AR pour l’écrit)'
          ]
        });
      }

      // Traiter les données réelles fournies
      var segments = this.segmentAudience(audienceData.segments || []);
      var recommendedLanguages = this.recommendLanguages(segments);
      var summary = this.generateSummary(segment, segments, recommendedLanguages);
      var confidence = this.calculateConfidence(audienceData);

      return Promise.resolve({
        segment: segment,
        summary: summary,
        segments: segments,
        recommendedLanguages: recommendedLanguages,
        confidence: confidence,
        sources: audienceData.sources || [],
        nextSteps: this.generateNextSteps(segments),
        risks: confidence < 50 ? ['Données d’audience insuffisantes — recommandations à valider sur des données réelles'] : [],
        estimatedCost: 0
      });
    },

    /* ---------- Segmenter les audiences ---------- */
    segmentAudience: function (segments) {
      return (segments || []).map(function (s) {
        return {
          id: s.id || 'seg-' + segments.indexOf(s),
          name: s.name || 'Segment sans nom',
          criteria: s.criteria || [],
          size: s.size || 'Non estimé',
          needs: s.needs || [],
          intentions: s.intentions || [],
          languages: s.languages || ['fr'],
          location: s.location || 'Non spécifiée',
          source: s.source || 'Non sourcé'
        };
      });
    },

    /* ---------- Recommander les langues ---------- */
    recommendLanguages: function (segments) {
      var allLanguages = new Set();

      (segments || []).forEach(function (s) {
        (s.languages || ['fr']).forEach(function (l) {
          allLanguages.add(l);
        });
      });

      if (allLanguages.size === 0) {
        return ['fr', 'ar', 'darija', 'en', 'es'];
      }

      return Array.from(allLanguages);
    },

    /* ---------- Générer un résumé ---------- */
    generateSummary: function (segment, segments, languages) {
      if (segments.length === 0) {
        return 'Aucune donnée d’audience n’a été fournie. L’agent 4 doit collecter des données démographiques et comportementales avant de segmenter.';
      }

      var summary = 'Segments d’audience identifiés pour le segment "' + segment + '" : ' + segments.length + ' segment(s). ';
      summary += 'Langues recommandées : ' + languages.join(', ') + '.';

      return summary;
    },

    /* ---------- Calculer le niveau de confiance ---------- */
    calculateConfidence: function (audienceData) {
      var score = 0;
      if (audienceData.sources && audienceData.sources.length > 0) score += 30;
      if (audienceData.segments && audienceData.segments.length > 0) score += 40;
      if (audienceData.demographics) score += 15;
      if (audienceData.behaviors) score += 15;
      return Math.min(score, 100);
    },

    /* ---------- Générer les prochaines étapes ---------- */
    generateNextSteps: function (segments) {
      var steps = [];

      if (segments.length === 0) {
        steps.push('Collecter des données d’audience réelles avant de segmenter');
      } else {
        steps.push('Valider les segments identifiés avec des données réelles');
      }

      steps.push('Installer Google Analytics 4 pour collecter des données démographiques');
      steps.push('Collecter les insights démographiques des comptes sociaux');
      steps.push('Différencier audience locale et diaspora');
      steps.push('Obtenir une validation humaine avant toute campagne ciblée');

      return steps;
    }
  };

  if (window.DarMarocAIOrchestrator) {
    window.DarMarocAIOrchestrator.handleAgentAudienceIntelligence = Agent.handle.bind(Agent);
  }

  window.DarMarocAIAgent4 = Agent;
})();
