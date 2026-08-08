# Checklist de vérification — Déploiement des phases IA (v1.6)

À utiliser APRÈS avoir téléversé les fichiers sur GitHub Pages (liste dans
`README.md`). Cocher chaque point et noter le résultat. En cas d'échec d'un
point, voir « En cas de problème » à la fin.

> Conseil : tester sur téléphone + ordinateur, navigateur normal + fenêtre
> privée (pour éviter le cache).

## 1. Base du site

- [ ] `https://dar-maroc.github.io` s'ouvre, design et animations identiques à avant
- [ ] Toutes les pages se chargent : Propriétés, Services, Déposer une annonce, À propos, Contact, FAQ, mentions légales
- [ ] Bilingue FR/AR : le bouton langue fonctionne sur chaque page
- [ ] Aucune erreur rouge dans la console (F12 → onglet Console)

## 2. Assistant IA (Phase 1)

- [ ] Ouvrir le chatbot (icône flottante) → le message d'accueil s'affiche
- [ ] Taper « villa à Marrakech » → il propose des biens réels (moteur local)
- [ ] Taper « appartement à louer à Casablanca » → résultats exacts
- [ ] Taper « merci » → réponse polie, aucune erreur
- [ ] Passer en arabe → le chatbot répond en arabe
- [ ] Si la clé Gemini est active (quota OK) : les réponses peuvent être
      enrichies par Gemini ; sinon le repli local répond quand même

## 3. Pipeline photos (Phase 2) — dans `admin/dashboard.html`

- [ ] Connexion admin (`darmaroc` / `Netuser03$`)
- [ ] Ouvrir un bien → « Modifier » → section photos
- [ ] Importer plusieurs photos → elles apparaissent en WebP HD avec le logo
      DarMaroc incrusté (coin bas-droit)
- [ ] Bouton « Visite virtuelle » → lecteur plein écran, navigation clavier/
      swipe, point dorés, Échap pour fermer
- [ ] Bouton « Vidéo de présentation » → un fichier `.webm` se télécharge
      (photo + titre + prix + logo)
- [ ] Enregistrer le bien → les photos apparaissent sur le site public

## 4. SEO automatique (Phase 3)

- [ ] Sur `properties.html`, ouvrir une annonce → l'onglet du navigateur affiche
      « Titre du bien | DarMaroc »
- [ ] Le code source (Ctrl+U) contient les balises `og:title`, `og:description`,
      `og:image` (1re photo) et un bloc `application/ld+json`
- [ ] Fermer l'annonce → le titre de l'onglet revient à « Propriétés - DarMaroc »
- [ ] Partager le lien sur WhatsApp → l'aperçu montre le bien (photo + titre)

## 5. Statistiques (Phase 4)

- [ ] Naviguer sur le site public, ouvrir des annonces, cliquer WhatsApp/Instagram
- [ ] Dashboard → « Statistiques » → les compteurs augmentent
- [ ] « Annonces les plus consultées » liste les biens visités
- [ ] (Optionnel multi-appareils) : exécuter la fin de `schema.sql` puis
      Actualiser — les stats s'agrègent

## 6. Publications réseaux (Phase 5)

- [ ] Dashboard → bien → « Modifier » → « Publications réseaux »
- [ ] Les textes FR/AR/EN s'affichent avec hashtags + lien WhatsApp pré-rempli
- [ ] Copier un texte → colle proprement sur Facebook/Instagram (test réel)

## 7. PWA & Performance (Phase 6)

- [ ] Sur Android/Chrome, le bouton d'installation doré apparaît → installer
- [ ] L'application s'ouvre en plein écran (standalone) avec l'icône DarMaroc
- [ ] Depuis un téléphone, « Partager » → « DarMaroc » redirige vers
      « Déposer une annonce »
- [ ] Mode avion → la page d'accueil s'ouvre quand même (offline via SW)
- [ ] Les images se chargent correctement sur mobile (décodage asynchrone)
- [ ] Les pages incluent le `preconnect` Supabase (voir le code source)

## En cas de problème

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| Chatbot ne répond pas | `utils/ai.js` absent du serveur | Téléverser `utils/ai.js` |
| Photos sans watermark | `utils/photo-pipeline.js` manquant | Téléverser le fichier + `config/site-config.js` |
| Statistiques à zéro | `utils/stats.js` non téléversé | Téléverser le fichier + `js/main.js` |
| Vidéo ne se télécharge pas | Navigateur sans MediaRecorder (safari iOS) | Utiliser Chrome/Edge |
| Ancienne version affichée | Cache Service Worker | Actualiser 2× ou vider le cache ; vérifier `sw.js` à jour (v1.6.0) |
| Erreur « stat_events » | Table Supabase absente | Exécuter la fin de `schema.sql` (sinon rien, stats locales) |

## Mise en ligne finale

- [ ] Tous les points ci-dessus cochés
- [ ] Dernier `robocopy` miroir + sauvegarde fait
- [ ] Miroir : `C:\Users\Merouan\Documents\user\dar-maroc-site`
- [ ] Sauvegarde : `C:\Users\Merouan\Documents\DarMaroc-Backups\`
