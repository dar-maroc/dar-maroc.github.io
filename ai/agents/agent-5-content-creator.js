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
   
   CONTRAINTE : Toutes les générations sont basées sur des entrées réelles fournies.
   Aucun contenu fictif n’est présenté comme réel.
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
      var topic = payload.topic || '';
      var inputData = payload.inputData || null; // Données réelles pour générer le contenu

      return this.createContent(contentType, language, topic, payload, inputData).then(function (result) {
        return {
          agent: Agent.name,
          agentId: Agent.id,
          type: 'content_creation',
          missionId: payload.missionId,
          content: result.text,
          data: result,
          requiresApproval: true,
          externalAction: false,
          confidence: result.confidence || 0,
          language: language,
          variants: result.variants || [],
          visualBrief: result.visualBrief || null,
          risks: result.risks || ['Qualité linguistique à contrôler avant validation (Darija/AR/FR/EN/ES)'],
          estimatedCost: 0
        };
      });
    },

    /* ---------- Création de contenu ---------- */
    createContent: function (contentType, language, topic, payload, inputData) {
      var variants = [];
      var text = '';

      // Générer une variante par langue demandée
      var langs = payload.languages || [language];
      langs.forEach(function (lang) {
        variants.push({
          language: lang,
          text: this.draftByLanguage(contentType, lang, topic, payload, inputData),
          platform: payload.platform || 'generic'
        });
      }, this);

      text = variants.length ? variants[0].text : this.draftByLanguage(contentType, language, topic, payload, inputData);

      var confidence = this.calculateConfidence(payload, inputData);

      return Promise.resolve({
        text: text,
        contentType: contentType,
        language: language,
        variants: variants,
        visualBrief: this.prepareVisualBrief(contentType, topic),
        confidence: confidence,
        needsLinguisticReview: true,
        risks: this.identifyRisks(payload, inputData)
      });
    },

    /* ---------- Brouillon par langue ---------- */
    draftByLanguage: function (contentType, language, topic, payload, inputData) {
      var templates = this.getTemplates(contentType, language, topic, payload, inputData);
      return templates[language] || templates.fr || 'Contenu non généré — données insuffisantes.';
    },

    /* ---------- Templates par langue ---------- */
    getTemplates: function (contentType, language, topic, payload, inputData) {
      var baseTopic = topic || (inputData && inputData.topic) || 'Bien DarMaroc';
      var contactInfo = (inputData && inputData.contactInfo) || 'Contactez-nous sur WhatsApp pour plus d’informations.';
      var hashtags = (inputData && inputData.hashtags) || '#ImmobilierAgadir #DarMaroc';

      var templates = {
        fr: '✨ ' + baseTopic + ' — ' + (payload.valueProp || 'Découvrez ce bien DarMaroc.') + ' ' + contactInfo + ' ' + hashtags,
        ar: '✨ ' + baseTopic + ' — اكتشف هذا العقار من دارماغرب. تواصل معنا عبر واتساب للمزيد من المعلومات. #العقار_في_أگادير #دارماغرب',
        darija: '✨ ' + baseTopic + ' — تلقاو المعرض دارماغرب في أگادير. اتصلو علينا في الواتساب لزياد المعلومات. #عقار_أگادير #دارماغرب',
        en: '✨ ' + baseTopic + ' — ' + (payload.valuePropEn || 'Discover this DarMaroc property.') + ' ' + contactInfo + ' ' + hashtags,
        es: '✨ ' + baseTopic + ' — ' + (payload.valuePropEs || 'Descubre esta propiedad de DarMaroc.') + ' ' + contactInfo + ' ' + hashtags
      };

      return templates;
    },

    /* ---------- Calculer le niveau de confiance ---------- */
    calculateConfidence: function (payload, inputData) {
      var score = 0;
      if (payload.topic) score += 30;
      if (inputData && inputData.topic) score += 20;
      if (inputData && inputData.valueProp) score += 20;
      if (inputData && inputData.contactInfo) score += 15;
      if (inputData && inputData.hashtags) score += 15;
      return Math.min(score, 100);
    },

    /* ---------- Identifier les risques ---------- */
    identifyRisks: function (payload, inputData) {
      var risks = [];

      if (!payload.topic && !inputData) {
        risks.push('Aucun sujet fourni — contenu générique');
      }
      if (!inputData || !inputData.valueProp) {
        risks.push('Aucune proposition de valeur — contenu peut être générique');
      }
      risks.push('Qualité linguistique à contrôler avant validation (Darija/AR/FR/EN/ES)');

      return risks;
    },

    /* ---------- Préparer un brief visuel ---------- */
    prepareVisualBrief: function (contentType, topic) {
      return {
        contentType: contentType,
        topic: topic || 'Non spécifié',
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
