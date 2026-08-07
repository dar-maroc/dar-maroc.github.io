# DarMaroc — Site immobilier & services (version IA)

Site statique **100 % gratuit** (GitHub Pages) + **Supabase** (PostgreSQL) pour
les données. Augmenté par des modules IA et automatisations qui tournent
entièrement côté navigateur.

## Architecture

| Brique | Rôle |
| --- | --- |
| `config/site-config.js` | Configuration centrale (contacts, WhatsApp, réseaux sociaux, SEO, Supabase, IA Gemini, pipeline photos) |
| `data/data.js` | Données par défaut (annonces/services si base vide) |
| `utils/ai.js` | Assistant IA (chatbot) : Gemini puis moteur local de recherche de biens |
| `utils/photo-pipeline.js` | Pipeline photos : WebP, HD, watermark logo, visite virtuelle 360, vidéo de présentation |
| `utils/seo.js` | SEO auto par annonce : title, description, Open Graph, Twitter Cards, JSON-LD Schema.org |
| `utils/stats.js` | Statistiques : vues annonces, clics WhatsApp/réseaux/email, chatbot (localStorage + Supabase) |
| `utils/social.js` | Générateur de publications réseaux (FR/AR/EN + hashtags + lien WhatsApp) |
| `utils/store.js` | Couche données : localStorage + Supabase (annonces, services, catégories, témoignages, FAQ) |
| `utils/supabase.js` | Client Supabase |
| `js/main.js` | Interaction générale : préloader, chatbot, PWA, boutons, stats |
| `js/properties.js` | Galerie/lightbox des biens + SEO + stats par annonce |
| `js/services.js`, `js/testimonials.js` | Rendu services et témoignages |
| `admin/` | Dashboard multi-utilisateurs (super admin `darmaroc` + contributeurs) |
| `sw.js` | Service Worker (PWA, offline) |
| `manifest.json` | Manifeste PWA (installation, partage, screenshots) |
| `supabase/schema.sql` | Schéma PostgreSQL + table `stat_events` (stats multi-appareils) |

## Les 7 phases IA (déjà en place)

1. **Assistant IA** — chatbot qui répond sur les vraies annonces (ville, type,
   budget), en FR/AR/EN. Sans clé Gemini, il fonctionne avec son moteur local.
   Avec une clé (`config/site-config.js` → `ai.gemini`), les réponses sont
   enrichies par Google Gemini.
2. **Pipeline photos** — chaque photo importée dans le dashboard devient WebP
   HD avec watermark logo ; boutons « Visite virtuelle » et « Vidéo de
   présentation » dans le formulaire bien.
3. **SEO automatique** — à l'ouverture d'une annonce : titre, description, OG,
   Twitter Cards et JSON-LD (Residence/Product) mis à jour puis restaurés.
4. **Statistiques** — vue « Statistiques » dans le dashboard (vues, WhatsApp,
   réseaux, chatbot, email). Créer la table `stat_events` pour l'agrégation
   multi-appareils.
5. **Contenu réseaux semi-auto** — bouton « Publications réseaux » dans le
   formulaire bien : textes FR/AR/EN + hashtags + lien WhatsApp prêts à copier.
6. **Performance & PWA** — preconnect Supabase, images `decoding="async"`,
   manifeste enrichi (installation, partage), bouton d'installation PWA.
7. **Documentation** — ce fichier.

## Déploiement (GitHub Pages)

Téléverser le dossier `dar-maroc-site/` à la racine du dépôt GitHub Pages.
Après chaque mise en ligne, les visiteurs reçoivent automatiquement la
nouvelle version grâce au Service Worker (`sw.js` → cache `darmaroc-core-v12`).

Fichiers modifiés à téléverser pour la v1.6 :

- `utils/ai.js`, `utils/photo-pipeline.js`, `utils/seo.js`, `utils/stats.js`,
  `utils/social.js`
- `config/site-config.js`
- `js/main.js`, `js/properties.js`, `js/services.js`
- `admin/dashboard.html`, `admin/js/dashboard.js`
- `sw.js`, `manifest.json`
- Toutes les pages HTML racine (preconnect Supabase) : `index.html`,
  `properties.html`, `services.html`, `deposer-annonce.html`, `contact.html`,
  `about.html`, `faq.html`, `mentions-legales.html`,
  `politique-de-confidentialite.html`, `conditions-utilisation.html`,
  `thank-you.html`, plus `blog/*.html`
- Optionnel : exécuter la fin de `supabase/schema.sql` (table `stat_events`)

## Clé IA Gemini (optionnelle)

1. Obtenir une clé gratuite sur https://aistudio.google.com/apikey (format `AQ.`)
2. La coller dans `config/site-config.js` → `ai.gemini.apiKey`
3. Le site fonctionne déjà sans : le chatbot bascule automatiquement sur le
   moteur local. Après activation du quota (parfois quelques heures), les
   réponses passent en mode Gemini automatiquement.

## Comptes du dashboard

| Identifiant | Rôle | Mot de passe par défaut |
| --- | --- | --- |
| `darmaroc` | Super admin | `Netuser03$` |
| `user1` … `user5` | Contributeurs | `DarMaroc2026!` |

Contributeur = ajout de photos et annonces + gestion de ses propres annonces.
Admin = accès complet. Les comptes sont partagés entre tous les appareils
(table `admin_users`).

## Sauvegardes

Avant chaque évolution, une sauvegarde complète du site est créée dans
`C:\Users\Merouan\Documents\DarMaroc-Backups\`. Un miroir de déploiement est
tenu à jour dans `C:\Users\Merouan\Documents\user\dar-maroc-site`.

## Règles de développement

- **Ne jamais modifier** le design, la structure, les couleurs, les menus, les
  pages, les animations, les images, les annonces, le SEO et les URLs existants.
- Ajouter uniquement ; chaque module est autonome et retombe en mode « avant »
  si absent.
- Toute modification est précédée d'une sauvegarde automatique et suivie d'une
  synchronisation du miroir.
