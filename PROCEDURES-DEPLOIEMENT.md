# DAR MAROC AI — Procédures de déploiement et de test

**IMPORTANT :** Aucune de ces procédures ne doit être exécutée sans autorisation explicite. Ce document sert de référence pour l'administrateur.

---

## 1. Sauvegarde avant déploiement

```bash
# 1. Se placer sur la branche de référence
git checkout main
git pull origin main

# 2. Créer une branche de sauvegarde
git branch backup-dar-maroc-ai-$(date +%Y%m%d)

# 3. Vérifier l'état du dépôt
git status --short --branch
```

---

## 2. Application des migrations Supabase

**À faire dans Supabase Dashboard → SQL Editor, sur le projet `hiicfqjubfqgtsfmsxny`**

### Étape 1 : Sauvegarde de la base existante
Exporter toutes les tables via l'interface Supabase ou `pg_dump`.

### Étape 2 : Appliquer la migration 002 (tables IA)
Exécuter le contenu de `supabase/migrations/002_ai_tables.sql`.

### Étape 3 : Appliquer la migration 003 (durcissement RLS)
Exécuter le contenu de `supabase/migrations/003_rls_hardening.sql`.

**Vérification après application :**
```bash
# Vérifier que les tables IA existent (lecture seule)
curl -sS -H "apikey: <ANON_KEY>" \
  "https://hiicfqjubfqgtsfmsxny.supabase.co/rest/v1/ai_missions?select=*&limit=0"
```

---

## 3. Déploiement de l'Edge Function `ai-generate`

**À faire dans Supabase Dashboard → Edge Functions**

1. Créer une nouvelle fonction nommée `ai-generate`
2. Y coller le contenu de `supabase/functions/ai-generate/index.ts`
3. Configurer les secrets dans Supabase Dashboard → Settings → Secrets :
   - `GEMINI_API_KEY` : clé API Google Gemini
   - `NVIDIA_API_KEY` : clé API NVIDIA NIM (optionnel, fournisseur de secours)
4. Déployer la fonction

**Test de l'Edge Function (après déploiement) :**
```bash
curl -X POST https://hiicfqjubfqgtsfmsxny.supabase.co/functions/v1/ai-generate \
  -H "Authorization: Bearer <JWT_UTILISATEUR>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test de génération", "capability": "text"}'
```

---

## 4. Configuration des clés API

**Jamais dans le JS public, jamais dans GitHub.**

Toutes les clés API doivent être stockées dans Supabase Secrets (Dashboard → Settings → Secrets) et accessibles uniquement côté serveur via l'Edge Function.

- `GEMINI_API_KEY` : obtenu sur https://aistudio.google.com/apikey
- `NVIDIA_API_KEY` : obtenu sur https://build.nvidia.com

**Règle financière :** Aucun abonnement payant automatique. Aucun achat de crédits. Si quotas gratuits épuisés → suspendre et avertir.

---

## 5. Configuration des réseaux sociaux

**Chaque plateforme nécessite : un compte développeur, une application, des tokens, et éventuellement une App Review.**

| Plateforme | Étape 1 | Étape 2 | Étape 3 |
|------------|---------|---------|---------|
| WhatsApp Business | Compte développeur Meta | App WhatsApp + WABA | Numéro de téléphone + token système |
| Facebook | Compte développeur Meta | App Meta + Page FB | Page access token |
| Instagram | Compte Instagram pro/créateur | Lien avec Page FB | Instagram access token |
| TikTok | Compte développeur TikTok | App approuvée | Client key + access token |
| YouTube | Projet Google Cloud | YouTube Data API v3 activée | Clé API / OAuth |
| Threads | Compte développeur Meta | App "Threads use case" | Threads access token |

Après configuration, mettre à jour `ai/connectors/social-connectors.js` pour passer `canPublish` à `true` sur les plateformes configurées.

---

## 6. Déploiement du site (GitHub Pages)

Le site existant est déployé via GitHub Actions (`.github/workflows/pages.yml`) sur push vers `main`.

**Pour déployer DAR MAROC AI :**
1. S'assurer que tous les fichiers sont sur la branche de travail
2. Fusionner vers `main` (après validation humaine)
3. Le workflow GitHub Pages déploie automatiquement
4. Vérifier https://dar-maroc.github.io/ et https://dar-maroc.github.io/ai-dashboard.html

---

## 7. Commandes de test

### Tests locaux (Node.js)
```bash
cd dar-maroc-audit
# Vérifier la syntaxe de tous les fichiers
for f in utils/ai.js utils/ai-provider.js utils/ai-orchestrator.js utils/ai-init.js ai/agents/agent-*.js ai/connectors/social-connectors.js; do node --check "$f" || echo "ERREUR: $f"; done
```

### Test du centre de validation (navigateur réel)
```bash
cd dar-maroc-audit
python3 -m http.server 8080
# Ouvrir http://localhost:8080/ai-dashboard.html dans un navigateur
```

### Vérification non-régression du site existant
```bash
# Vérifier que toutes les pages publiques répondent
for p in "" index.html properties.html services.html about.html faq.html contact.html deposer-annonce.html gestion-conciergerie.html blog/ admin/index.html admin/dashboard.html; do
  curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" -L "https://dar-maroc.github.io/$p"
done
```

---

## 8. Procédure de retour arrière

### Code
```bash
# Restaurer un fichier existant modifié
git checkout da33067 -- utils/ai.js README.md CHECKLIST-DEPLOIEMENT.md admin/js/auth.js supabase/schema.sql

# Supprimer les nouveaux fichiers
rm -rf ai/ supabase/migrations/ supabase/functions/ utils/ai-provider.js utils/ai-orchestrator.js utils/ai-init.js ai-dashboard.html
```

### Supabase
```sql
-- Supprimer les tables IA (nécessite autorisation explicite)
DROP TABLE IF EXISTS public.ai_decision_log;
DROP TABLE IF EXISTS public.ai_quotas;
DROP TABLE IF EXISTS public.ai_recommendations;
DROP TABLE IF EXISTS public.ai_validations;
DROP TABLE IF EXISTS public.ai_agent_logs;
DROP TABLE IF EXISTS public.ai_missions;
```

---

## 9. Checklist avant validation finale

- [ ] Sauvegarde du dépôt effectuée
- [ ] Sauvegarde de Supabase effectuée
- [ ] Migrations `002` et `003` appliquées sur Supabase
- [ ] Edge Function `ai-generate` déployée
- [ ] Clés API configurées dans Supabase Secrets
- [ ] Tests locaux passés (100%)
- [ ] `ai-dashboard.html` testé dans un navigateur réel
- [ ] Non-régression du site existant vérifiée
- [ ] Aucun mot de passe en clair dans les fichiers publics
- [ ] Aucune clé API exposée dans le JS client
- [ ] Procédure de retour arrière documentée
