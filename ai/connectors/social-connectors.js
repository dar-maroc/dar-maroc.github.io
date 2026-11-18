/* ============================================================
   DAR MAROC AI — CONNECTEURS RÉSEAUX SOCIAUX OFFICIELS
   ai/connectors/social-connectors.js
   
   Rôle :
   - Déclarer les connecteurs officiels vers chaque plateforme
   - Documenter les autorisations manquantes
   - Préparer le contenu (jamais publier sans approbation humaine)
   
   CONTRAINTE ABSOLUE :
   Aucun de ces connecteurs n'effectue de publication, d'envoi de
   message ou de contact externe sans approbation explicite via le
   Centre de Validation (ai-dashboard.html).
   
   STATUT : Aucun connecteur n'est configuré. Les clés, tokens et
   App Review doivent être obtenus manuellement par l'administrateur.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Référentiel des plateformes ---------- */
  var PLATFORMS = {
    whatsapp: {
      name: 'WhatsApp Business',
      api: 'WhatsApp Cloud API (Meta)',
      endpoint: 'https://graph.facebook.com/v23.0/{phone_number_id}/messages',
      auth: 'System User access token + WhatsApp Business Account',
      permissions: [
        'whatsapp_business_messaging',
        'whatsapp_business_management',
        'business_management'
      ],
      prerequisites: [
        'Compte développeur Meta enregistré',
        'Application Meta avec usage "WhatsApp"',
        'Numéro de téléphone WhatsApp Business connecté',
        'Jetons d’accès système (system user token)',
        'Webhook configuré pour recevoir les messages entrants'
      ],
      appReview: 'Non requis pour l’envoi de messages sortants (fenêtre 24 h / templates)',
      rateLimit: 'Selon quota Meta (à vérifier dans le dashboard développeur)',
      status: 'non_configure',
      canPublish: false,
      missing: [
        'Clé API / token système non configurée',
        'Numéro de téléphone WhatsApp Business non lié',
        'App Meta non créée'
      ]
    },
    facebook: {
      name: 'Facebook',
      api: 'Facebook Graph API',
      endpoint: 'https://graph.facebook.com/v23.0/me/feed',
      auth: 'Page access token',
      permissions: [
        'pages_manage_posts',
        'pages_read_engagement',
        'pages_show_list'
      ],
      prerequisites: [
        'Compte développeur Meta',
        'Application Meta',
        'Page Facebook DarMaroc',
        'Jetons d’accès page (page access token)',
        'App Review pour les pages_read_engagement si nécessaire'
      ],
      appReview: 'Requis pour certaines permissions',
      rateLimit: 'Selon quota Graph API (à vérifier)',
      status: 'non_configure',
      canPublish: false,
      missing: [
        'Page access token non configurée',
        'App Review en attente',
        'Page Facebook non liée'
      ]
    },
    instagram: {
      name: 'Instagram',
      api: 'Instagram Graph API (Meta)',
      endpoint: 'https://graph.facebook.com/v23.0/{ig-user-id}/media',
      auth: 'Instagram access token (via Facebook Page)',
      permissions: [
        'instagram_publish',
        'instagram_manage_comments',
        'pages_show_list'
      ],
      prerequisites: [
        'Compte Instagram professionnel ou créateur',
        'Compte Facebook lié à l’Instagram',
        'Application Meta',
        'Jetons d’accès Instagram',
        'App Review'
      ],
      appReview: 'Requis',
      rateLimit: 'Selon quota Graph API',
      status: 'non_configure',
      canPublish: false,
      missing: [
        'Instagram access token non configurée',
        'Compte Instagram non lié à une Page Facebook',
        'App Review non obtenue'
      ]
    },
    tiktok: {
      name: 'TikTok',
      api: 'TikTok API for Business',
      endpoint: 'https://open-api.tiktok.com/share/video/upload/',
      auth: 'Client key + access token',
      permissions: [
        'video.upload',
        'user.info.basic'
      ],
      prerequisites: [
        'Compte développeur TikTok',
        'Application TikTok approuvée',
        'Clé client (client key)',
        'Jetons d’accès utilisateur',
        'Approbation de l’application par TikTok'
      ],
      appReview: 'Requis',
      rateLimit: 'Selon quota TikTok (à vérifier)',
      status: 'non_configure',
      canPublish: false,
      missing: [
        'Clé client TikTok non configurée',
        'Application non approuvée par TikTok',
        'Jetons d’accès non obtenus'
      ]
    },
    youtube: {
      name: 'YouTube',
      api: 'YouTube Data API v3 (Google)',
      endpoint: 'https://www.googleapis.com/upload/youtube/v3/videos',
      auth: 'OAuth 2.0 + clé API Google Cloud',
      permissions: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
      ],
      prerequisites: [
        'Compte Google',
        'Projet Google Cloud Console',
        'YouTube Data API v3 activée',
        'Identifiants OAuth 2.0',
        'Quota API (10 000 unités/jour par défaut)'
      ],
      appReview: 'Non requis pour l’upload (quota par défaut)',
      rateLimit: '10 000 unités/jour (quota par défaut)',
      status: 'non_configure',
      canPublish: false,
      missing: [
        'Clé API / OAuth non configurée',
        'Projet Google Cloud non créé',
        'Quota non vérifié'
      ]
    },
    threads: {
      name: 'Threads',
      api: 'Threads API (Meta)',
      endpoint: 'https://graph.threads.net/v1.0/{user_id}/threads',
      auth: 'Threads user access token',
      permissions: [
        'threads_basic',
        'threads_content_publish',
        'threads_manage_replies'
      ],
      prerequisites: [
        'Compte développeur Meta',
        'Application Meta avec usage "Threads"',
        'Compte Threads',
        'Jetons d’accès Threads (courte durée 1 h, longue durée 60 j)',
        'App Review pour threads_content_publish'
      ],
      appReview: 'Requis',
      rateLimit: 'Selon quota Meta',
      status: 'non_configure',
      canPublish: false,
      missing: [
        'Threads access token non configurée',
        'App Meta Threads non créée',
        'App Review non obtenue'
      ]
    }
  };

  /* ---------- Vérifier si une plateforme est configurée ---------- */
  function isPlatformConfigured(platformKey) {
    var p = PLATFORMS[platformKey];
    return p ? p.canPublish === true : false;
  }

  /* ---------- Liste des plateformes non configurées ---------- */
  function getUnconfiguredPlatforms() {
    return Object.keys(PLATFORMS).filter(function (k) {
      return PLATFORMS[k].canPublish !== true;
    });
  }

  /* ---------- Préparer une publication (sans envoi) ---------- */
  function preparePost(platformKey, content) {
    var p = PLATFORMS[platformKey];
    if (!p) {
      throw new Error('Plateforme inconnue : ' + platformKey);
    }

    return {
      platform: platformKey,
      platformName: p.name,
      status: 'prepared_only',
      canPublish: false,
      content: content || '',
      requiresHumanApproval: true,
      missingPermissions: p.missing,
      prerequisites: p.prerequisites,
      appReview: p.appReview,
      endpoint: p.endpoint,
      note: 'Préparation uniquement. Aucune publication n’est effectuée sans approbation humaine explicite et configuration réelle des clés API.'
    };
  }

  /* ---------- État global des connecteurs ---------- */
  function getConnectorsState() {
    var state = {};
    Object.keys(PLATFORMS).forEach(function (k) {
      var p = PLATFORMS[k];
      state[k] = {
        name: p.name,
        status: p.status,
        canPublish: p.canPublish,
        missing: p.missing,
        appReview: p.appReview,
        prerequisitesCount: p.prerequisites.length
      };
    });
    return state;
  }

  /* ---------- Export ---------- */
  window.DarMarocSocialConnectors = {
    VERSION: 'v1.0',
    PLATFORMS: PLATFORMS,
    isPlatformConfigured: isPlatformConfigured,
    getUnconfiguredPlatforms: getUnconfiguredPlatforms,
    preparePost: preparePost,
    getConnectorsState: getConnectorsState
  };
})();
