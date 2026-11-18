# DAR MAROC AI — Checklist de déploiement et de vérification

**STATUT : PRÊT POUR EXÉCUTION MANUELLE PAR L'ADMINISTRATEUR**

Ce document liste toutes les opérations à effectuer pour mettre DAR MAROC AI en service. Aucune n'a été exécutée dans cet environnement (blocages : accès SQL Supabase, déploiement Edge Functions, test navigateur).

---

## PRÉREQUIS

- [ ] Accès au projet Supabase `hiicfqjubfqgtsfmsxny` (Dashboard + SQL Editor)
- [ ] Sauvegarde du dépôt et de la base effectuée (archive `dar-maroc-backup-20261118-141221.tar.gz`)
- [ ] Clés API disponibles (Gemini, NVIDIA optionnel) — **ne jamais les publier dans le chat ni dans GitHub**

---

## ÉTAPE 1 — SAUVEGARDE (obligatoire avant toute modification)

### 1.1 Sauvegarde du dépôt Git
```bash
cd /Users/hind/Documents/Default\ Project/dar-maroc-audit
git checkout dar-maroc-ai-implementation
git branch backup-pre-deployment-$(date +%Y%m%d)
```

### 1.2 Sauvegarde de la base Supabase
Dans Supabase Dashboard → SQL Editor, exécuter :
```sql
-- Export du schéma
-- Puis exporter les données de chaque table via Table Editor → Export CSV
```
Tables à sauvegarder : `annonces`, `services`, `categories`, `temoignages`, `faq`, `partners`, `parametres`, `admin_users`, `stat_events`, `clients`, `demandes`, et toutes les autres.

### 1.3 Sauvegarde des politiques RLS
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## ÉTAPE 2 — APPLICATION DES MIGRATIONS SUPABASE

Dans Supabase Dashboard → SQL Editor, exécuter dans l'ordre :

### 2.1 Migration 002 — Tables IA
Contenu du fichier `supabase/migrations/002_ai_tables.sql`

Vérification après exécution :
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'ai_%';
-- Doit retourner : ai_missions, ai_agent_logs, ai_validations, ai_recommendations, ai_quotas, ai_decision_log
```

### 2.2 Migration 003 — Durcissement RLS
Contenu du fichier `supabase/migrations/003_rls_hardening.sql`

Vérification après exécution :
```sql
-- Vérifier que admin_users a la colonne auth_id
SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'auth_id';

-- Vérifier que les politiques RLS ont été remplacées
SELECT policyname FROM pg_policies WHERE tablename = 'admin_users';
-- Doit contenir : admin_users_select_restricted, admin_users_write_restricted
-- Ne doit plus contenir : admin_users_select, admin_users_write (anciennes)
```

### 2.3 Vérification des fonctionnalités existantes
```sql
-- Vérifier que les tables existantes sont intactes
SELECT count(*) FROM annonces;  -- Doit retourner 19
SELECT count(*) FROM categories; -- Doit retourner 4
SELECT count(*) FROM partners;   -- Doit retourner 8
SELECT count(*) FROM admin_users; -- Doit retourner 6
```

**En cas d'erreur :** Exécuter le plan de retour arrière dans `supabase/migrations/000_BACKUP_AND_ROLLBACK_PLAN.md`.

---

## ÉTAPE 3 — DÉPLOIEMENT DES EDGE FUNCTIONS

Dans Supabase Dashboard → Edge Functions :

### 3.1 Déployer `ai-auth`
Fichier : `supabase/functions/ai-auth/index.ts`

### 3.2 Déployer `ai-generate`
Fichier : `supabase/functions/ai-generate/index.ts`

### 3.3 Configurer les secrets
Dans Supabase Dashboard → Settings → Secrets, ajouter :
- `GEMINI_API_KEY` : clé API Google Gemini (obtenu sur https://aistudio.google.com/apikey)
- `NVIDIA_API_KEY` : clé API NVIDIA NIM (optionnel, obtenu sur https://build.nvidia.com)

**Aucune de ces clés ne doit être publiée dans le chat, dans GitHub, ou dans le JavaScript public.**

### 3.4 Vérifier le déploiement
```bash
# Test de l'Edge Function ai-auth (avec un JWT valide)
curl -X POST https://hiicfqjubfqgtsfmsxny.supabase.co/functions/v1/ai-auth \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"action": "verify"}'

# Test de l'Edge Function ai-generate (avec un JWT valide)
curl -X POST https://hiicfqjubfqgtsfmsxny.supabase.co/functions/v1/ai-generate \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test de génération", "capability": "text"}'
```

---

## ÉTAPE 4 — CONFIGURATION DU SITE

### 4.1 Mettre à jour config/site-config.js
Remplir les valeurs suivantes (sans les publier dans GitHub) :

```js
aiAuth: {
  endpoint: 'https://hiicfqjubfqgtsfmsxny.supabase.co/functions/v1/ai-auth'
},
aiGenerate: {
  endpoint: 'https://hiicfqjubfqgtsfmsxny.supabase.co/functions/v1/ai-generate'
}
```

### 4.2 Lier les comptes auth.users à admin_users
Dans Supabase Dashboard → SQL Editor, pour chaque compte admin existant :
```sql
-- Exemple pour le compte darmaroc
UPDATE public.admin_users SET auth_id = '<auth.users.id>' WHERE username = 'darmaroc';
```
L'ID auth.users se trouve dans Supabase Dashboard → Authentication → Users.

---

## ÉTAPE 5 — DÉPLOIEMENT GITHUB PAGES

**Ne déployer que après validation des tests ci-dessus.**

```bash
git add .
git commit -m "feat: DAR MAROC AI — équipe marketing multi-agents IA"
git push origin dar-maroc-ai-implementation
```

Puis merger vers `main` pour déclencher le déploiement GitHub Pages.

---

## ÉTAPE 6 — TESTS DE VÉRIFICATION (après déploiement)

### 6.1 Site existant (non-régression)
Toutes les 16 routes doivent retourner HTTP 200 :
- `/`, `/index.html`, `/properties.html`, `/services.html`, `/about.html`, `/faq.html`, `/contact.html`, `/deposer-annonce.html`, `/gestion-conciergerie.html`, `/thank-you.html`, `/404.html`, `/mentions-legales.html`, `/politique-de-confidentialite.html`, `/conditions-utilisation.html`, `/admin/index.html`, `/admin/dashboard.html`

### 6.2 Centre de validation
Ouvrir `https://dar-maroc.github.io/ai-dashboard.html` dans un navigateur :
- [ ] Page charge sans erreur console
- [ ] 9 agents affichés
- [ ] Création de mission possible
- [ ] Approbation/refus de validation fonctionne
- [ ] Fournisseurs IA affichés
- [ ] Journaux d'activité présents

### 6.3 Espace administrateur
- [ ] Connexion fonctionne avec les identifiants existants
- [ ] Le JWT est stocké et utilisé pour les appels Edge Function
- [ ] Les rôles sont correctement récupérés depuis admin_users

### 6.4 Génération IA
- [ ] `ai-generate` répond avec un texte (fournisseur local ou externe)
- [ ] Le fallback local fonctionne si aucun fournisseur externe configuré
- [ ] Aucune clé API exposée dans les réponses

---

## BLOCAGES IDENTIFIÉS (à résoudre avant déploiement)

| Blocage | Cause | Solution |
|---------|-------|----------|
| Accès SQL Supabase | Connecteur MCP vers mauvais projet (`nxmsqqoflskfajqrqddw`) | Utiliser Supabase Dashboard directement sur `hiicfqjubfqgtsfmsxny` |
| Déploiement Edge Functions | Aucun outil de déploiement disponible dans cet environnement | Déployer via Supabase Dashboard → Edge Functions |
| Test navigateur | Proxy OpenCode bloque `localhost` (502) | Tester depuis un navigateur local externe |
| Clés API | Aucune configurée | Ajouter dans Supabase Dashboard → Settings → Secrets |

---

## ROLLBACK

En cas de problème après déploiement :

```bash
# Restaurer le dépôt
git checkout backup-pre-deployment-YYYYMMDD -- .

# Restaurer les politiques RLS (voir 000_BACKUP_AND_ROLLBACK_PLAN.md)
-- Exécuter les commandes DROP/CREATE POLICY dans le fichier de plan de retour arrière

# Supprimer les tables IA (si nécessaire)
DROP TABLE IF EXISTS public.ai_decision_log;
DROP TABLE IF EXISTS public.ai_quotas;
DROP TABLE IF EXISTS public.ai_recommendations;
DROP TABLE IF EXISTS public.ai_validations;
DROP TABLE IF EXISTS public.ai_agent_logs;
DROP TABLE IF EXISTS public.ai_missions;
```

---

## FICHIERS PRÊTS À COMMITTER

Une fois les tests validés :

**Modifiés (5) :**
- `utils/ai.js` — Correction bug `generate()`
- `README.md` — Mots de passe supprimés
- `CHECKLIST-DEPLOIEMENT.md` — Mot de passe supprimé
- `admin/js/auth.js` — Authentification serveur + fallback
- `supabase/schema.sql` — Commentaire mot de passe supprimé

**Nouveaux (23) :**
- `supabase/migrations/002_ai_tables.sql`
- `supabase/migrations/003_rls_hardening.sql`
- `supabase/migrations/000_BACKUP_AND_ROLLBACK_PLAN.md`
- `supabase/migrations/004_AUTH_SERVER_SPEC.md`
- `supabase/functions/ai-auth/index.ts`
- `supabase/functions/ai-generate/index.ts`
- `utils/ai-provider.js`
- `utils/ai-orchestrator.js`
- `utils/ai-init.js`
- `ai-dashboard.html`
- `ai/agents/agent-*.js` (9 fichiers)
- `ai/connectors/social-connectors.js`
- `DAR-MAROC-AI-DOCUMENTATION.md`
- `PROCEDURES-DEPLOIEMENT.md`
- `TESTS-VALIDATION-REELLE.md`
- `DEPLOYMENT-CHECKLIST.md` (ce fichier)

**NE PAS COMMITTER avant validation des tests de non-régression.**
