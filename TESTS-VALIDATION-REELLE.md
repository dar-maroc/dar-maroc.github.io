# DAR MAROC AI — Procédures de validation réelle (ÉTAPE 4)

**STATUT : PRÉPARATION UNIQUEMENT. Aucun test n'a été exécuté dans un navigateur réel ni avec Supabase de production.**

---

## 1. Prérequis pour les tests

Avant d'exécuter ces tests, l'administrateur doit :
1. Appliquer les migrations `002_ai_tables.sql` et `003_rls_hardening.sql` sur le projet `hiicfqjubfqgtsfmsxny`
2. Déployer les Edge Functions `ai-generate` et `ai-auth`
3. Configurer les secrets `GEMINI_API_KEY` et `NVIDIA_API_KEY` dans Supabase Dashboard
4. Créer les comptes `auth.users` correspondant aux `admin_users` existants
5. Servir le site localement : `cd dar-maroc-audit && python3 -m http.server 8080`

---

## 2. Test 1 — `ai-dashboard.html` dans un navigateur

**URL :** `http://localhost:8080/ai-dashboard.html`

### 2.1 Vérifications statiques (sans Supabase)

| # | Vérification | Résultat attendu | Preuve |
|---|-------------|------------------|--------|
| 1.1 | Page charge sans erreur console | Aucune erreur JS | Console navigateur vide |
| 1.2 | 13 balises script chargées | Tous les modules IA présents | Onglet Réseau, 13 fichiers JS |
| 1.3 | État général affiché | 9 agents, 0 tâche, 0 validation | Capture d'écran |
| 1.4 | Avertissement approbation humaine visible | Texte "Mode approbation humaine obligatoire" | Capture d'écran |
| 1.5 | Fournisseurs IA affichés | 3 fournisseurs (primary, fallback, local) | Table fournisseurs |
| 1.6 | Local disponible | `local` = Disponible, utilisé = 0 | Table fournisseurs |

### 2.2 Vérifications avec Supabase configuré

| # | Vérification | Résultat attendu | Preuve |
|---|-------------|------------------|--------|
| 2.1 | Authentification via `ai-auth` | Retourne rôle + isAdmin | Réponse JSON Edge Function |
| 2.2 | Création de mission via orchestrateur | Mission en `awaiting_approval` | Table `ai_missions` |
| 2.3 | Approbation d'une validation | Statut passe à `approved` | Table `ai_validations` |
| 2.4 | Rejet d'une validation | Statut passe à `rejected` | Table `ai_validations` |
| 2.5 | Exécution d'une mission approuvée | Statut passe à `executed` | Table `ai_missions` |

---

## 3. Test 2 — Les neuf agents

Chaque agent doit être testé individuellement via l'orchestrateur :

| # | Agent | Action de test | Résultat attendu |
|---|-------|---------------|------------------|
| 3.1 | 1 Manager | `action: 'coordinate'` | Plan d'orchestration généré |
| 3.2 | 2 Market Research | `scope: 'maroc'` | Étude de marché préparée |
| 3.3 | 3 Trend Intelligence | `platforms: ['instagram']` | Veille tendances préparée |
| 3.4 | 4 Audience Intelligence | `segment: 'diaspora'` | Segments d'audience identifiés |
| 3.5 | 5 Content Creator | `language: 'fr'` | Contenu en français généré |
| 3.6 | 5 Content Creator | `language: 'ar'` | Contenu en arabe généré |
| 3.7 | 5 Content Creator | `language: 'darija'` | Contenu en darija généré |
| 3.8 | 5 Content Creator | `language: 'en'` | Contenu en anglais généré |
| 3.9 | 5 Content Creator | `language: 'es'` | Contenu en espagnol généré |
| 3.10 | 6 Social Media Manager | `action: 'calendar'` | Calendrier éditorial préparé |
| 3.11 | 7 SEO & Traffic | `action: 'audit'` | Audit SEO préparé |
| 3.12 | 8 Business Development | `action: 'research'` | Recherche partenaires préparée |
| 3.13 | 9 Performance Analyst | `action: 'analyze'` | Analyse préparée (chiffs null) |

**Preuve attendue :** Chaque mission passe en `awaiting_approval`, aucune n'est exécutée sans approbation.

---

## 4. Test 3 — Missions et système d'approbation

| # | Action | Résultat attendu | Preuve |
|---|--------|------------------|--------|
| 4.1 | Créer une mission | Statut `queued` ou `running`, puis `awaiting_approval` | Table `ai_missions` |
| 4.2 | Approuver une validation | Statut mission → `approved` | Table `ai_validations` |
| 4.3 | Refuser une validation | Statut mission → `rejected` | Table `ai_validations` |
| 4.4 | Tenter d'exécuter sans approbation | Erreur "Mission non approuvée" | Console/réponse Edge Function |
| 4.5 | Exécuter après approbation | Statut → `executed` | Table `ai_missions` |
| 4.6 | Vérifier les journaux | Entrées dans `ai_agent_logs` | Table `ai_agent_logs` |
| 4.7 | Vérifier l'idempotence | Même clé d'idempotence → même mission retournée | Table `ai_missions` |

---

## 5. Test 4 — Génération dans les cinq langues

**Via l'Agent 5 (Content Creator) ou `DarMarocAI.generate()` :**

| # | Langue | Résultat attendu | Preuve |
|---|--------|------------------|--------|
| 5.1 | Français (fr) | Texte en français | Réponse Edge Function |
| 5.2 | Arabe (ar) | Texte en arabe (script arabe) | Réponse Edge Function |
| 5.3 | Darija | Texte en darija marocain | Réponse Edge Function |
| 5.4 | Anglais (en) | Texte en anglais | Réponse Edge Function |
| 5.5 | Espagnol (es) | Texte en espagnol | Réponse Edge Function |

**Preuve attendue :** Chaque variante contient le texte dans la langue demandée, pas de mélange de langues.

---

## 6. Test 5 — Quotas et fallback

| # | Scénario | Résultat attendu | Preuve |
|---|----------|------------------|--------|
| 6.1 | Pas de clé API configurée | Fallback local utilisé | Réponse `provider: 'local'` |
| 6.2 | Clé API configurée, quota épuisé (429) | Bascule sur fournisseur de secours | Réponse `provider: 'nvidia'` ou `'local'` |
| 6.3 | Tous les fournisseurs échouent | Fallback local utilisé | Réponse `provider: 'local'` |
| 6.4 | Rate limiting (100 req/heure) | Erreur 429 après 100 requêtes | Réponse HTTP 429 |

---

## 7. Test 6 — Permissions Supabase

**À exécuter uniquement après application de la migration 003 :**

| # | Vérification | Résultat attendu | Preuve |
|---|-------------|------------------|--------|
| 7.1 | Lecture `admin_users` par clé anon | Refusée (403) | Réponse HTTP 403 |
| 7.2 | Écriture `admin_users` par clé anon | Refusée (403) | Réponse HTTP 403 |
| 7.3 | Lecture `ai_missions` par utilisateur authentifié | Autorisée | Réponse HTTP 200 |
| 7.4 | Écriture `ai_missions` par utilisateur authentifié | Autorisée | Réponse HTTP 200 |
| 7.5 | Lecture `annonces` par clé anon (publique) | Autorisée (annonces publiées) | Réponse HTTP 200 |
| 7.6 | Écriture `annonces` par clé anon | Refusée (403) après durcissement | Réponse HTTP 403 |

---

## 8. Test 7 — Non-régression du site existant

**16 routes à vérifier sur `https://dar-maroc.github.io/` :**

| # | Route | Résultat attendu |
|---|-------|------------------|
| 8.1 | `/` | HTTP 200 |
| 8.2 | `/index.html` | HTTP 200 |
| 8.3 | `/properties.html` | HTTP 200 |
| 8.4 | `/services.html` | HTTP 200 |
| 8.5 | `/about.html` | HTTP 200 |
| 8.6 | `/faq.html` | HTTP 200 |
| 8.7 | `/contact.html` | HTTP 200 |
| 8.8 | `/deposer-annonce.html` | HTTP 200 |
| 8.9 | `/gestion-conciergerie.html` | HTTP 200 |
| 8.10 | `/thank-you.html` | HTTP 200 |
| 8.11 | `/404.html` | HTTP 200 |
| 8.12 | `/mentions-legales.html` | HTTP 200 |
| 8.13 | `/politique-de-confidentialite.html` | HTTP 200 |
| 8.14 | `/conditions-utilisation.html` | HTTP 200 |
| 8.15 | `/admin/index.html` | HTTP 200 |
| 8.16 | `/admin/dashboard.html` | HTTP 200 |

**Tests supplémentaires :**
- Espace admin accessible avec les identifiants existants
- Formulaire de contact fonctionne (Web3Forms)
- Formulaire de dépôt d'annonce fonctionne
- Chatbot fonctionne (moteur local)
- Aucune erreur JS dans la console

---

## 9. Preuves à collecter

Pour chaque test réussi, l'administrateur doit collecter :
1. **Capture d'écran** de l'interface
2. **Réponse JSON** de l'API (pour les tests Edge Function)
3. **Console navigateur** (aucune erreur)
4. **Requête réseau** (onglet Réseau, statut HTTP)
5. **Requête SQL** (pour les tests Supabase, lecture seule)

---

## 10. Blocages identifiés pour l'ÉTAPE 4

| Blocage | Cause | Solution |
|---------|-------|----------|
| Test navigateur `localhost:8080` | Proxy OpenCode bloque (502) | Tester depuis un navigateur local externe |
| Edge Function non déployée | Pas d'autorisation de déploiement | Déployer via Supabase Dashboard |
| Supabase projet réel inaccessible | Connecteur MCP vers mauvais projet | Utiliser l'API REST publique avec clé anon |
| Comptes sociaux non configurés | Aucun token/App Review | Configurer manuellement (hors scope DAR MAROC AI) |

---

## 11. Critères d'acceptation

Le projet DAR MAROC AI est considéré comme **validé** lorsque :
- [ ] Tous les tests 1-7 sont passés
- [ ] 92/92 tests unitaires locaux passés
- [ ] Aucune régression sur les 16 routes du site existant
- [ ] Aucune publication sociale effectuée sans approbation
- [ ] Aucun secret exposé côté client
- [ ] Aucune dépense effectuée
