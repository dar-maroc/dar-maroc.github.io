/* ============================================================
   DAR MAROC - CONFIGURATION CENTRALISÉE (site-config.js)
   Toutes les données modifiables depuis le CMS sont ici / en base.
   ============================================================ */
window.DARMAROC_CONFIG = (function () {
  'use strict';

  return {
    version: '1.0.0',

    /* ---------- Identité & contact ---------- */
    site: {
      name: 'DarMaroc',
      fullName: 'DarMaroc Immobilier & Services',
      sloganFR: 'Tout pour votre maison, tout le savoir-faire marocain.',
      sloganAR: 'كل ما تحتاجه لمنزلك، بكل الخبرة المغربية.',
      phone: '+33 7 72 20 88 85',
      phoneFixed: '0525261486',
      email: 'Dar.maroc4@gmail.com',
      address: 'Agadir, Maroc',
      city: 'Agadir'
    },

    /* ---------- WhatsApp ---------- */
    whatsapp: {
      number: '33772208885',
      defaultMessage: 'Bonjour DarMaroc, je souhaite un devis.',
      url: 'https://wa.me/33772208885'
    },

    /* ---------- Réseaux sociaux ---------- */
    social: {
      facebook: 'https://www.facebook.com/share/17tPyNue4V/',
      instagram: 'https://www.instagram.com/dar___maroc',
      tiktok: 'https://www.tiktok.com/@dar_maroc',
      youtube: 'https://www.youtube.com/@Dar-Maroc'
    },

    /* ---------- SEO / Open Graph ---------- */
    seo: {
      ogImage: 'https://dar-maroc.github.io/images/banner-with-logo.png',
      ogSiteName: 'DarMaroc',
      ogLocale: 'fr_FR',
      twitterCard: 'summary_large_image'
    },

    /* ---------- Firebase (à compléter dans admin si CMS actif) ----------
       Placeholders : créez un projet sur https://console.firebase.google.com
       puis collez vos clés ici. Tant que vide, le site reste 100% statique. */
    firebase: {
      enabled: false,
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    },

    /* ---------- Supabase (base de données PostgreSQL) ----------
       Phase 1 : remplace le stockage localStorage par une vraie base.
       1) Créez un projet gratuit sur https://supabase.com
       2) Exécutez supabase/schema.sql dans le SQL Editor
       3) Collez ci-dessous l'URL du projet et la clé publique "anon"
          (Dashboard > Settings > API).
       Tant que vide, le site fonctionne comme avant (localStorage). */
    supabase: {
      url: 'https://hiicfqjubfqgtsfmsxny.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaWNmcWp1YmZxZ3RzZm1zeG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5Mzc4NjgsImV4cCI6MjEwMTUxMzg2OH0.HwuOdJe9hAtUS_ory7mWhb9m0He50s2jEY37NuCSISE',
      photosBucket: 'annonces'
    },

    /* ---------- Formulaires (Web3Forms) ---------- */
    web3forms: {
      accessKey: ''
    },

    /* ---------- Google AdSense ---------- */
    adsense: {
      client: 'ca-pub-3903949187741203'
    },

    /* ---------- Pipeline photos (utils/photo-pipeline.js) ----------
       Appliqué automatiquement à chaque photo importée dans le dashboard :
       conversion WebP, redimensionnement HD, compression et watermark logo. */
    photoPipeline: {
      watermark: {
        logoUrl: 'images/logo.png',   // chemin relatif depuis la racine
        position: 'br',               // br, bl, tr, tl
        size: 0.18,                   // taille du logo (% de la largeur photo)
        opacity: 0.85
      },
      maxWidth: 1600,                 // largeur max HD des photos publiées
      quality: 0.82                   // qualité de compression (0..1)
    },

    /* ---------- IA (Google Gemini, offre gratuite) ----------
       Clé récupérable gratuitement sur https://aistudio.google.com/apikey
       (nouveau format "AQ." = Auth key, officiel depuis 2026).
       Le site fonctionne même sans clé : le chatbot bascule alors sur
       son moteur local (recherche de biens, recommandations). */
    ai: {
      gemini: {
        apiKey: 'AQ.Ab8RN6L6q--dbogKIK4pW3gSPhBe8pRjhF8D00AkubfA5itYow',
        model: 'gemini-2.0-flash',
        maxRetries: 2
      }
    }
  };
})();
