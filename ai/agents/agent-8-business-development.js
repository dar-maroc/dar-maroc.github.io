/* ============================================================
   DAR MAROC AI — AGENT 8 : BUSINESS DEVELOPMENT AI
   ai/agents/agent-8-business-development.js
   
   Responsabilités :
   - Rechercher des partenaires potentiels à partir de sources publiques
   - Identifier les entreprises pertinentes
   - Étudier les possibilités de collaboration
   - Préparer des propositions commerciales
   - Rédiger des messages de partenariat
   - Classer les opportunités selon leur pertinence
   
   CONTRAINTE : Aucun message ne doit être envoyé ni aucune entreprise contactée
   sans autorisation explicite de l’humain.
   Toutes les données retournées sont basées sur des entrées réelles fournies.
   ============================================================ */
(function () {
  'use strict';

  var Agent = {
    id: '8',
    name: 'BUSINESS DEVELOPMENT AI',
    role: 'developer',
    permissions: ['research_partners', 'prepare_proposal', 'classify_opportunity'],

    handle: function (mission) {
      var payload = mission.payload || {};
      payload.missionId = mission.id;
      var action = payload.action || 'research';

      switch (action) {
        case 'research':
          return this.researchPartners(payload);
        case 'proposal':
          return this.prepareProposal(payload);
        case 'message':
          return this.preparePartnershipMessage(payload);
        case 'classify':
          return this.classifyOpportunity(payload);
        default:
          return Promise.resolve({
            agent: Agent.name,
            agentId: Agent.id,
            type: 'business_development',
            missionId: mission.id,
            content: 'Action non reconnue : ' + action,
            requiresApproval: false,
            externalAction: false
          });
      }
    },

    /* ---------- Recherche de partenaires ---------- */
    researchPartners: function (payload) {
      var sector = payload.sector || 'immobilier';
      var region = payload.region || 'Maroc';
      var partnerData = payload.partnerData || null; // Données réelles fournies

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'partner_research',
        missionId: payload.missionId,
        content: 'Recherche de partenaires préparée pour le secteur ' + sector + ' (' + region + '). Aucun partenaire n’a été contacté.',
        data: {
          sector: sector,
          region: region,
          potentialPartners: partnerData && partnerData.partners ? partnerData.partners : [],
          partnerTypes: [
            'Agences immobilières locales',
            'Promoteurs et constructeurs',
            'Artisans (rénovation, décoration, nettoyage)',
            'Banques et assurances',
            'Plateformes de voyage et tourisme',
            'Associations de la diaspora'
          ],
          sources: partnerData && partnerData.sources || [],
          note: 'Toute recherche doit s’appuyer sur des sources publiques uniquement. Aucun contact direct.'
        },
        requiresApproval: true,
        externalAction: false,
        confidence: partnerData ? 70 : 40,
        estimatedCost: 0
      });
    },

    /* ---------- Préparation de proposition commerciale ---------- */
    prepareProposal: function (payload) {
      var partnerName = payload.partnerName || 'Partenaire potentiel';
      var collaborationType = payload.collaborationType || 'partenariat';
      var proposalData = payload.proposalData || null; // Données réelles

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'proposal_preparation',
        missionId: payload.missionId,
        content: 'Proposition commerciale préparée pour ' + partnerName + ' (à réviser par l’humain avant envoi).',
        data: {
          partnerName: partnerName,
          collaborationType: collaborationType,
          draftSubject: 'Proposition de partenariat — DarMaroc',
          draftBody: this.draftProposalBody(partnerName, collaborationType, proposalData),
          valueProposition: proposalData && proposalData.valueProposition ? proposalData.valueProposition : [],
          terms: proposalData && proposalData.terms ? proposalData.terms : [],
          nextSteps: ['Réviser le contenu', 'Valider avec l’humain', 'Obtenir l’autorisation d’envoi'],
          warning: 'Aucun envoi sans autorisation explicite.'
        },
        requiresApproval: true,
        externalAction: false,
        confidence: proposalData ? 75 : 50,
        estimatedCost: 0
      });
    },

    /* ---------- Corps de proposition ---------- */
    draftProposalBody: function (partnerName, type, data) {
      var valueProp = data && data.valueProposition ? data.valueProposition.join('\n- ') : 'Valeur à définir';
      return 'Bonjour ' + partnerName + ',\n\nJe me permets de vous contacter au sujet d’une éventuelle collaboration entre DarMaroc et votre entreprise.\n\nValeur proposée :\n- ' + valueProp + '\n\nSeriez-vous ouvert à un échange sur les possibilités de partenariat ?\n\nCordialement,\nL’équipe DarMaroc';
    },

    /* ---------- Préparation de message de partenariat ---------- */
    preparePartnershipMessage: function (payload) {
      var partnerName = payload.partnerName || 'Partenaire';
      var language = payload.language || 'fr';
      var messageData = payload.messageData || null;

      var messages = {
        fr: 'Bonjour,\n\nJe me permets de vous contacter au sujet d’une éventuelle collaboration entre DarMaroc et votre entreprise.\n\nSeriez-vous ouvert à un échange sur les possibilités de partenariat ?\n\nCordialement,\nL’équipe DarMaroc',
        ar: 'مرحباً،\n\nأتصل بكم بخصوص إمكانية التعاون بين دارماغرب وشركتكم.\n\nهل ستكونون منفتحين على مناقشة إمكانيات الشراكة؟\n\nمع تحياتي,\nفريق دارماغرب',
        en: 'Hello,\n\nI am contacting you regarding a potential collaboration between DarMaroc and your company.\n\nWould you be open to discussing partnership opportunities?\n\nBest regards,\nThe DarMaroc Team',
        es: 'Hola,\n\nMe pongo en contacto con usted respecto a una posible colaboración entre DarMaroc y su empresa.\n\n¿Estaría abierto a hablar sobre oportunidades de asociación?\n\nSaludos cordiales,\nEl equipo de DarMaroc'
      };

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'partnership_message',
        missionId: payload.missionId,
        content: 'Message de partenariat préparé pour ' + partnerName + ' (' + language + ').',
        data: {
          partnerName: partnerName,
          language: language,
          message: messages[language] || messages.fr,
          readyToSend: false,
          warning: 'Aucun envoi sans autorisation explicite de l’humain.'
        },
        requiresApproval: true,
        externalAction: false,
        confidence: 85,
        estimatedCost: 0
      });
    },

    /* ---------- Classification des opportunités ---------- */
    classifyOpportunity: function (payload) {
      var opportunity = payload.opportunity || {};

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'opportunity_classification',
        missionId: payload.missionId,
        content: 'Opportunité classée par pertinence.',
        data: {
          opportunity: opportunity,
          relevanceScore: opportunity.relevanceScore || 0,
          criteria: ['pertinence sectorielle', 'localisation', 'potentiel commercial', 'facilité de contact'],
          recommendation: opportunity.recommendation || 'À évaluer avec des données réelles avant toute approche.',
          status: opportunity.status || 'non_contacté'
        },
        requiresApproval: false,
        externalAction: false,
        confidence: opportunity.relevanceScore ? 70 : 40,
        estimatedCost: 0
      });
    }
  };

  if (window.DarMarocAIOrchestrator) {
    window.DarMarocAIOrchestrator.handleAgentDeveloper = Agent.handle.bind(Agent);
  }

  window.DarMarocAIAgent8 = Agent;
})();
