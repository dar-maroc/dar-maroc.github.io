# DAR MAROC AI — Plan de sauvegarde et de retour arrière (Supabase)

**PROJET CIBLE :** `hiicfqjubfqgtsfmsxny`
**URL :** `https://hiicfqjubfqgtsfmsxny.supabase.co`

⚠️ **AUCUNE DE CES OPÉRATIONS N'A ÉTÉ EXÉCUTÉE SUR LA BASE DE PRODUCTION.** Ce document est une procédure de référence à exécuter manuellement par l'administrateur après validation.

---

## 1. Sauvegarde avant toute migration (obligatoire)

### 1.1 Sauvegarde du schéma et des données existantes

Depuis un terminal avec accès à la base (ou via Supabase Dashboard → SQL Editor → Export) :

```bash
# Export du schéma complet (structure seulement)
pg_dump --host=db.hiicfqjubfqgtsfmsxny.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-privileges \
  --file=backup-schema-$(date +%Y%m%d-%H%M%S).sql

# Export des données de toutes les tables (CSV)
# À faire via Supabase Dashboard → Table Editor → Export CSV pour chaque table :
# annonces, services, categories, temoignages, faq, partners, showcase,
# parametres, admin_users, stat_events, clients, demandes,
# utilisateurs, agences, agents, villes, quartiers, images, videos,
# favoris, conversations, messages, notifications, blog_categories,
# blog_articles, historiques_modifications
```

### 1.2 Sauvegarde des politiques RLS existantes

```sql
-- À exécuter dans Supabase Dashboard → SQL Editor (lecture seule)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Sauvegarder le résultat dans un fichier `backup-rls-$(date +%Y%m%d-%H%M%S).sql`.

### 1.3 Sauvegarde des buckets Storage

```bash
# Lister les buckets
curl -sS -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>" \
  "https://hiicfqjubfqgtsfmsxny.supabase.co/storage/v1/bucket"
```

---

## 2. Migrations additives prévues (002 et 003)

### 002 — Tables IA (ajout uniquement, aucune table existante touchée)

Tables créées : `ai_missions`, `ai_agent_logs`, `ai_validations`, `ai_recommendations`, `ai_quotas`, `ai_decision_log`.

**Compatibilité :** vérifiée — aucune de ces 6 tables n'existe dans `schema.sql` ni `schema-ops.sql` (confirmé par grep).

### 003 — Durcissement RLS (modification de politiques existantes)

Tables touchées : `admin_users`, `ops_state`, `audit_logs`, bucket `documents`.

**Politiques remplacées (plus restrictives) :**
- `admin_users_select` / `admin_users_write` → `is_ai_admin()` uniquement
- `ops_state_select` / `ops_state_write` → `auth.uid() is not null`
- `audit_logs_select` / `audit_logs_insert` → `auth.uid() is not null`
- Bucket `documents` → écriture réservée aux authentifiés

**Non touchées par 003 :** politiques `contenu_phase1_write` sur les tables de contenu (gardées pour préserver le fonctionnement Phase 1). Leur durcissement est planifié en Phase 2 avec Supabase Auth.

---

## 3. Plan de retour arrière

### 3.1 Retour arrière du code (fichiers du dépôt)

```bash
# Depuis la branche dar-maroc-ai-implementation
git checkout da33067 -- utils/ai.js README.md CHECKLIST-DEPLOIEMENT.md admin/js/auth.js supabase/schema.sql
rm -rf ai/ supabase/migrations/ supabase/functions/ utils/ai-provider.js utils/ai-orchestrator.js utils/ai-init.js ai-dashboard.html
```

### 3.2 Retour arrière de la base de données (Supabase)

⚠️ **Nécessite une autorisation explicite.** À exécuter uniquement si une migration a été appliquée et provoque un problème.

```sql
-- Supprimer les tables IA créées par la migration 002
DROP TABLE IF EXISTS public.ai_decision_log;
DROP TABLE IF EXISTS public.ai_quotas;
DROP TABLE IF EXISTS public.ai_recommendations;
DROP TABLE IF EXISTS public.ai_validations;
DROP TABLE IF EXISTS public.ai_agent_logs;
DROP TABLE IF EXISTS public.ai_missions;

-- Restaurer les politiques RLS d'origine sur admin_users (annule 003)
DROP POLICY IF EXISTS "admin_users_select_restricted" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_write_restricted" ON public.admin_users;
CREATE POLICY "admin_users_select" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "admin_users_write" ON public.admin_users FOR ALL USING (true) WITH CHECK (true);

-- Restaurer les politiques RLS d'origine sur ops_state (annule 003)
DROP POLICY IF EXISTS "ops_state_select_auth" ON public.ops_state;
DROP POLICY IF EXISTS "ops_state_write_auth" ON public.ops_state;
CREATE POLICY "ops_state_select" ON public.ops_state FOR SELECT USING (true);
CREATE POLICY "ops_state_write" ON public.ops_state FOR ALL USING (true) WITH CHECK (true);

-- Restaurer les politiques RLS d'origine sur audit_logs (annule 003)
DROP POLICY IF EXISTS "audit_logs_select_auth" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_auth" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Restaurer les politiques du bucket documents (annule 003)
DROP POLICY IF EXISTS "Documents - depot auth" ON storage.objects;
DROP POLICY IF EXISTS "Documents - maj auth" ON storage.objects;
DROP POLICY IF EXISTS "Documents - suppression auth" ON storage.objects;
CREATE POLICY "Documents - depot phase1" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Documents - maj phase1" ON storage.objects FOR UPDATE USING (bucket_id = 'documents') WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Documents - suppression phase1" ON storage.objects FOR DELETE USING (bucket_id = 'documents');
```

### 3.3 Points de vigilance pour le retour arrière

- La suppression des tables IA est irréversible pour les données qu'elles contiennent (missions, validations, journaux). Sauvegarder avant si nécessaire.
- La restauration des politiques RLS ouvertes réexpose les données — à n'utiliser qu'en cas de blocage critique, puis à re-durcir rapidement.
- Aucun des scripts de retour arrière ne touche aux tables de contenu existantes (`annonces`, `services`, `categories`, etc.).

---

## 4. Risques de verrouillage des comptes et fonctionnalités

| Risque | Niveau | Description | Atténuation |
|--------|--------|-------------|-------------|
| Perte d'accès admin | Élevé | Si `is_ai_admin()` ne correspond à aucun utilisateur après migration, plus personne ne peut modifier `admin_users` | S'assurer qu'au moins un compte `admin` existe dans `admin_users` avant d'appliquer 003 |
| Écriture bloquée sur contenu | Moyen | Si l'authentification serveur n'est pas configurée, le dashboard ne peut plus écrire (RLS `auth.uid() is not null`) | Maintenir `contenu_phase1_write` pendant la transition Phase 1 → Phase 2 |
| Lecture publique bloquée | Faible | Les politiques `using (true)` de lecture sont conservées pour les contenus publics | Aucune action nécessaire |
| Clé anon exposée | Moyen | La clé anon reste dans `config/site-config.js` (nécessaire au site) | Durcir les RLS pour limiter ce que la clé anon peut faire |

---

## 5. Checklist avant application sur Supabase

- [ ] Sauvegarde du schéma (`--schema-only`) effectuée
- [ ] Sauvegarde des données (export CSV par table) effectuée
- [ ] Sauvegarde des politiques RLS effectuée
- [ ] Au moins un compte `admin` vérifié dans `admin_users`
- [ ] Migration 002 testée sur une copie de la base (si possible)
- [ ] Migration 003 testée sur une copie de la base (si possible)
- [ ] Plan de retour arrière relu et compris
- [ ] Autorisation explicite de l'administrateur obtenue

**Aucune de ces opérations n'a été exécutée sur la base de production `hiicfqjubfqgtsfmsxny` à ce stade.**
