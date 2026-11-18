/* ============================================================
   DAR MAROC AI — AGENT 7 : SEO AND TRAFFIC AI
   ai/agents/agent-7-seo-traffic.js
   
   Responsabilités :
   - Étudier le référencement naturel
   - Identifier les mots-clés
   - Améliorer le SEO local
   - Préparer des recommandations de contenu
   - Analyser les visites et les clics
   - Préparer un suivi UTM
   - Mesurer les conversions lorsque les données sont disponibles
   - Préserver toutes les URL existantes
   ============================================================ */
(function () {
  'use strict';

  var Agent = {
    id: '7',
    name: 'SEO AND TRAFFIC AI',
    role: 'seo',
    permissions: ['analyze_seo', 'identify_keywords', 'prepare_utm'],

    /* URL existantes du site — à préserver impérativement */
    EXISTING_URLS: [
      '/', '/index.html', '/properties.html', '/services.html', '/about.html',
      '/faq.html', '/contact.html', '/deposer-annonce.html', '/gestion-conciergerie.html',
      '/thank-you.html', '/404.html', '/mentions-legales.html', '/politique-de-confidentialite.html',
      '/conditions-utilisation.html', '/blog/', '/blog/index.html',
      '/blog/acheter-un-bien-immobilier-au-maroc.html',
      '/blog/renover-sa-maison-au-maroc.html',
      '/blog/choisir-un-artisan-de-confiance.html',
      '/admin/', '/admin/index.html', '/admin/dashboard.html',
      '/sitemap.xml', '/robots.txt', '/manifest.json', '/sw.js'
    ],

    handle: function (mission) {
      var payload = mission.payload || {};
      payload.missionId = mission.id;
      var action = payload.action || 'audit';

      switch (action) {
        case 'audit':
          return this.auditSEO(payload);
        case 'keywords':
          return this.identifyKeywords(payload);
        case 'utm':
          return this.prepareUTM(payload);
        case 'local':
          return this.localSEO(payload);
        default:
          return Promise.resolve({
            agent: Agent.name,
            agentId: Agent.id,
            type: 'seo',
            missionId: payload.missionId,
            content: 'Action SEO non reconnue : ' + action,
            requiresApproval: false,
            externalAction: false
          });
      }
    },

    /* ---------- Audit SEO ---------- */
    auditSEO: function (payload) {
      var issues = [];
      var recommendations = [];

      // Vérifier que les URLs existantes sont préservées
      issues.push({
        type: 'info',
        message: this.EXISTING_URLS.length + ' URLs existantes répertoriées — toutes doivent être préservées lors de toute modification.'
      });

      recommendations.push({
        id: 'seo-1',
        title: 'Installer Google Search Console et Analytics',
        description: 'Aucun outil de mesure n’est actuellement installé (pas de GA4, pas de GSC). Nécessaire pour obtenir des données réelles de trafic et de clics.',
        priority: 'high',
        cost: 0
      });

      recommendations.push({
        id: 'seo-2',
        title: 'Corriger les balises hreflang dupliquées',
        description: 'Les pages actuelles déclarent hreflang="fr" et hreflang="ar" sur la même URL. Aucune page arabe séparée n’existe.',
        priority: 'medium',
        cost: 0
      });

      recommendations.push({
        id: 'seo-3',
        title: 'Ajouter l’anglais aux métadonnées',
        description: 'Le bouton EN existe mais aucun attribut data-en ni hreflang="en" n’est présent.',
        priority: 'medium',
        cost: 0
      });

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'seo_audit',
        missionId: payload.missionId,
        content: 'Audit SEO préparé : ' + recommendations.length + ' recommandation(s), ' + this.EXISTING_URLS.length + ' URL(s) existante(s) à préserver.',
        data: {
          issues: issues,
          recommendations: recommendations,
          existingUrls: this.EXISTING_URLS,
          currentState: {
            analytics: false,
            searchConsole: false,
            sitemap: true,
            robotsTxt: true,
            structuredData: true
          }
        },
        requiresApproval: false,
        externalAction: false,
        confidence: 90,
        estimatedCost: 0
      });
    },

    /* ---------- Identification de mots-clés ---------- */
    identifyKeywords: function (payload) {
      var market = payload.market || 'maroc';
      var sector = payload.sector || 'immobilier';

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'keyword_research',
        missionId: payload.missionId,
        content: 'Recherche de mots-clés préparée pour le marché ' + market + ' (secteur ' + sector + '). Aucun volume de recherche réel n’a été collecté.',
        data: {
          keywords: [],
          langKeywords: {
            fr: [],
            ar: [],
            darija: [],
            en: [],
            es: []
          },
          localKeywords: [],
          seasonalKeywords: [],
          note: 'À collecter via Google Search Console, Google Keyword Planner ou données réelles.'
        },
        requiresApproval: false,
        externalAction: false,
        confidence: 0,
        estimatedCost: 0
      });
    },

    /* ---------- Préparation de suivi UTM ---------- */
    prepareUTM: function (payload) {
      var url = payload.url || 'https://dar-maroc.github.io/properties.html';
      var source = payload.source || 'social';
      var medium = payload.medium || 'post';
      var campaign = payload.campaign || 'darmaroc-ai';

      var separator = url.indexOf('?') !== -1 ? '&' : '?';
      var utmUrl = url + separator +
        'utm_source=' + encodeURIComponent(source) +
        '&utm_medium=' + encodeURIComponent(medium) +
        '&utm_campaign=' + encodeURIComponent(campaign);

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'utm_tracking',
        missionId: payload.missionId,
        content: 'Lien UTM préparé pour suivi des clics.',
        data: {
          originalUrl: url,
          utmUrl: utmUrl,
          parameters: {
            utm_source: source,
            utm_medium: medium,
            utm_campaign: campaign
          },
          note: 'À utiliser sur tous les liens partagés pour mesurer le trafic par source.'
        },
        requiresApproval: false,
        externalAction: false,
        confidence: 100,
        estimatedCost: 0
      });
    },

    /* ---------- SEO local ---------- */
    localSEO: function (payload) {
      var city = payload.city || 'Agadir';

      return Promise.resolve({
        agent: Agent.name,
        agentId: Agent.id,
        type: 'local_seo',
        missionId: payload.missionId,
        content: 'Recommandations SEO local pour ' + city + '.',
        data: {
          city: city,
          recommendations: [
            'Optimiser la page d’accueil pour les requêtes locales (' + city + ' immobilier)',
            'Créer des pages dédiées par ville avec contenu unique',
            'Ajouter le schéma JSON-LD LocalBusiness',
            'Vérifier la fiche Google Business Profile',
            'Cibler les mots-clés en Darija et arabe local'
          ],
          existingUrlsPreserved: this.EXISTING_URLS
        },
        requiresApproval: false,
        externalAction: false,
        confidence: 80,
        estimatedCost: 0
      });
    }
  };

  if (window.DarMarocAIOrchestrator) {
    window.DarMarocAIOrchestrator.handleAgentSeo = Agent.handle.bind(Agent);
  }

  window.DarMarocAIAgent7 = Agent;
})();
