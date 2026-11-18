/* ============================================================
   DAR MAROC AI — AGENT 5 : CONTENT CREATOR AI
   ai/agents/agent-5-content-creator.js
   
   Responsabilités :
   - Créer des publications
   - Rédiger des descriptions et des annonces
   - Préparer des scripts vidéo
   - Préparer des idées de Reels, Shorts et TikTok
   - Préparer des Stories et carrousels
   - Proposer des briefs visuels et des images
   - Adapter les contenus à chaque réseau social
   - Générer des variantes linguistiques
   
   Langues obligatoires : Darija marocaine, Arabe, Français, Anglais, Espagnol.
   La qualité linguistique doit être contrôlée avant validation.
   ============================================================ */
(function () {
  'use strict';

  var Agent = {
    id: '5',
    name: 'CONTENT CREATOR AI',
    role: 'creator',
    permissions: ['draft_content', 'generate_variants', 'visual_brief'],

    LANGUAGES: ['fr', 'ar', 'darija', 'en', 'es'],

    handle: function (mission) {
      var payload = mission.payload || {};
      payload.missionId = mission.id;
      var contentType = payload.contentType || 'social_post';
      var language = payload.language || 'fr';
      var topic = payload.topic || 'immobilier Agadir';

      return this.createContent(contentType, language, topic, payload).then(function (result) {
        return {
          agent: Agent.name,
          agentId: Agent.id,
          type: 'content_creation',
          missionId: payload.missionId,
          content: result.text,
          data: result,
          requiresApproval: true,
          externalAction: false,
          confidence: result.confidence || 80,
          language: language,
          variants: result.variants || [],
          visualBrief: result.visualBrief || null,
          risks: ['Qualité linguistique à contrôler avant validation (Darija/AR/FR/EN/ES)'],
          estimatedCost: 0
        };
      });
    },

    /* ---------- Création de contenu ---------- */
    createContent: function (contentType, language, topic, payload) {
      var variants = [];
      var text = '';

      // Générer une variante par langue demandée
      var langs = payload.languages || [language];
      langs.forEach(function (lang) {
        variants.push({
          language: lang,
          text: this.draftByLanguage(contentType, lang, topic, payload),
          platform: payload.platform || 'generic'
        });
      }, this);

      text = variants.length ? variants[0].text : this.draftByLanguage(contentType, language, topic, payload);

      return Promise.resolve({
        text: text,
        contentType: contentType,
        language: language,
        variants: variants,
        visualBrief: this.prepareVisualBrief(contentType, topic),
        confidence: 80,
        needsLinguisticReview: true
      });
    },

    /* ---------- Brouillon par langue ---------- */
    draftByLanguage: function (contentType, language, topic, payload) {
      var templates = {
        fr: '✨ ' + topic + ' — Découvrez ce bien DarMaroc à Agadir. Contactez-nous sur WhatsApp pour plus d’informations. #ImmobilierAgadir #DarMaroc',
        ar: '✨ ' + topic + ' — اكتشف هذا العقار من دارماغرب في أگادير. تواصل معنا عبر واتساب للمزيد من المعلومات. #العقار_في_أگادير #دارماغرب',
        darija: '✨ ' + topic + ' — تلقاو المعرض دارماغرب في أگادير. اتصلو علينا في الواتساب لزياد المعلومات. #عقار_أگادير #دارماغرب',
        en: '✨ ' + topic + ' — Discover this DarMaroc property in Agadir. Contact us on WhatsApp for more information. #AgadirRealEstate #DarMaroc',
        es: '✨ ' + topic + ' — Descubre esta propiedad de DarMaroc en Agadir. Contáctanos por WhatsApp para más información. #InmobiliariaAgadir #DarMaroc'
      };
      return templates[language] || templates.fr;
    },

    /* ---------- Brief visuel ---------- */
    prepareVisualBrief: function (contentType, topic) {
      return {
        contentType: contentType,
        topic: topic,
        suggestedFormat: contentType === 'video' ? '16:9 ou 9:16' : '1:1 ou 4:5',
        suggestedElements: ['photo du bien', 'logo DarMaroc', 'prix', 'ville', 'contact WhatsApp'],
        watermark: 'images/logo.png',
        note: 'Aucune image générée automatiquement — brief à exécuter par un designer ou via un outil de génération d’images approuvé.'
      };
    }
  };

  if (window.DarMarocAIOrchestrator) {
    window.DarMarocAIOrchestrator.handleAgentCreator = Agent.handle.bind(Agent);
  }

  window.DarMarocAIAgent5 = Agent;
})();
