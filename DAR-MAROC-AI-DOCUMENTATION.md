# DAR MAROC AI — Documentation technique

## 1. Vue d'ensemble

DAR MAROC AI est une équipe marketing multi-agents IA (9 agents + orchestrateur) conçue pour développer la visibilité, l'audience et les prospects de DAR MAROC (site immobilier & services, https://dar-maroc.github.io/).

**Mode de fonctionnement :** préparation + validation humaine obligatoire. Aucun agent ne peut publier, envoyer des messages WhatsApp, contacter des prospects/partenaires, modifier le site, déployer du code ou engager une dépense sans approbation explicite via le Centre de Validation (`ai-dashboard.html`).

**Coût de démarrage :** 0 €. Aucun abonnement payant automatique, aucun achat de crédits, aucun paiement automatique.

---

## 2. Architecture

```
DAR MAROC AI
├── Orchestrateur central          utils/ai-orchestrator.js
├── Couche d'abstraction IA        utils/ai-provider.js
├── Initialisation système         utils/ai-init.js
├── Génération IA existante        utils/ai.js (bug generate() corrigé)
├── Centre de validation humaine   ai-dashboard.html
├── 9 Agents IA                    ai/agents/agent-1..9-*.js
└── Connecteurs réseaux sociaux    ai/connectors/social-connectors.js
```

### 2.1 Orchestrateur

- File de tâches avec statuts : `queued → running → awaiting_approval → approved/rejected → executed/failed`
- Prévention des doublons (clé d'idempotence)
- Mécanisme de reprise (max 3 tentatives, priorité réduite à chaque échec)
- Journaux d'activité immuables
- Permissions par agent (moindre privilège)
- Centre de validation intégré

### 2.2 Neuf agents

| # | Agent | Rôle | Action externe |
|---|-------|------|----------------|
| 1 | DAR MAROC MANAGER AI | Coordination, rapports, priorisation | Non |
| 2 | MARKET RESEARCH AI | Étude de marché, niches, concurrence | Non |
| 3 | TREND INTELLIGENCE AI | Veille tendances, formats, sources | Non |
| 4 | AUDIENCE INTELLIGENCE AI | Segmentation audiences, langues | Non |
| 5 | CONTENT CREATOR AI | Contenu FR/AR/Darija/EN/ES, briefs visuels | Non |
| 6 | SOCIAL MEDIA MANAGER AI | Calendriers, adaptation plateforme, réponses | Non |
| 7 | SEO AND TRAFFIC AI | Audit SEO, mots-clés, UTM, SEO local | Non |
| 8 | BUSINESS DEVELOPMENT AI | Partenaires, propositions, messages | Non |
| 9 | PERFORMANCE ANALYST AI | Analyse performances, pas de chiffre fictif | Non |

Tous les agents préparent du contenu uniquement. Aucune action externe n'est exécutée sans approbation humaine.

### 2.3 Couche d'abstraction IA (`utils/ai-provider.js`)

- Fournisseur principal + fournisseur de secours
- Basculement automatique (429, timeout, panne)
- Moteur local de secours (gratuit, illimité, aucune clé externe)
- Idempotence (clé d'idempotence, prévention des exécutions en double)
- Rate limiting par utilisateur
- Suivi des quotas (suspension si épuisés)
- Aucune clé API stockée côté client (appels délégués aux Edge Functions Supabase)

---

## 3. Fichiers créés

| # | Fichier | Rôle |
|---|---------|------|
| 1 | `supabase/migrations/002_ai_tables.sql` | Tables IA (missions, validations, recommandations, quotas, journaux, décisions) |
| 2 | `supabase/migrations/003_rls_hardening.sql` | Durcissement RLS (admin_users, ops_state, audit_logs, documents) |
| 3 | `supabase/functions/ai-generate/index.ts` | Edge Function IA (serveur, clés protégées, auth JWT, rate limiting, idempotence) |
| 4 | `utils/ai-provider.js` | Abstraction fournisseurs IA + fallback local |
| 5 | `utils/ai-orchestrator.js` | Orchestrateur central + file de tâches + validation |
| 6 | `utils/ai-init.js` | Initialisation du système DAR MAROC AI |
| 7 | `ai-dashboard.html` | Centre de validation humaine |
| 8-16 | `ai/agents/agent-1-manager.js` … `agent-9-performance-analyst.js` | 9 agents IA |
| 17 | `ai/connectors/social-connectors.js` | Référentiel connecteurs sociaux officiels |

### Fichiers modifiés (sécurité + bug)

| # | Fichier | Modification |
|---|---------|--------------|
| 1 | `utils/ai.js` | Correction bug `generate()` (Promise toujours résolue) |
| 2 | `CHECKLIST-DEPLOIEMENT.md` | Mot de passe admin en clair supprimé |
| 3 | `README.md` | Mots de passe admin/contributeurs en clair supprimés |
| 4 | `admin/js/auth.js` | Commentaires révélant les mots de passe supprimés |
| 5 | `supabase/schema.sql` | Commentaire révélant les mots de passe supprimé |

---

## 4. Base de données Supabase (migrations additives)

Aucune table existante n'est modifiée ni supprimée. Deux migrations additives sont préparées :

### `002_ai_tables.sql` — Tables IA

- `ai_missions` : missions de l'orchestrateur
- `ai_agent_logs` : journaux d'activité des agents
- `ai_validations` : centre de validation humaine
- `ai_recommendations` : recommandations des agents (niche, tendance, audience, partenaire, mot-clé, contenu)
- `ai_quotas` : état des fournisseurs IA et quotas
- `ai_decision_log` : traçabilité des décisions

RLS restrictive : lecture/écriture réservée aux utilisateurs authentifiés (`auth.uid() is not null`). Seuls les quotas sont lisibles publiquement.

### `003_rls_hardening.sql` — Durcissement RLS

- `admin_users` : lecture/écriture réservée aux admins authentifiés (`is_ai_admin()`)
- `ops_state` : lecture/écriture authentifiée uniquement
- `audit_logs` : lecture authentifiée, écriture authentifiée
- Bucket `documents` : écriture authentifiée uniquement (lecture publique conservée)

---

## 5. Procédure de sauvegarde et retour arrière

### Avant toute opération à risque

1. **Sauvegarde du dépôt Git :**
   ```bash
   git checkout main
   git pull
   git branch backup-YYYYMMDD
   ```

2. **Sauvegarde Supabase :** Exporter via Supabase Dashboard → Table Editor → Export CSV pour chaque table, ou via `pg_dump` si accès direct.

3. **Sauvegarde des fichiers de configuration :** Copier `config/site-config.js` et `admin/js/auth.js` hors du dépôt.

### Retour arrière

1. **Code :** `git checkout da33067 -- <fichier>` pour restaurer un fichier existant.
2. **Nouveaux fichiers :** Supprimer les fichiers ajoutés (`ai/`, `utils/ai-provider.js`, etc.).
3. **Supabase :** Les migrations additives ne modifient pas les données existantes. Pour annuler, supprimer les tables IA créées (`DROP TABLE IF EXISTS public.ai_...`) — cette opération nécessite une autorisation explicite.

---

## 6. Procédures d'intégration

### 6.1 Fournisseurs IA

#### Gemini (principal, déjà configuré dans le dépôt)

1. Créer une clé API sur https://aistudio.google.com/apikey
2. La stocker dans Supabase Dashboard → Settings → Secrets → `GEMINI_API_KEY`
3. Déployer l'Edge Function `ai-generate` (Supabase Dashboard → Edge Functions)
4. **Ne jamais mettre la clé dans `config/site-config.js` ni dans le JS public**

#### NVIDIA NIM (secours)

1. Créer un compte sur https://build.nvidia.com
2. Obtenir une clé API pour `nemotron-3.5-super-vl-120b-a12b`
3. La stocker dans Supabase Secrets → `NVIDIA_API_KEY`
4. Conditions : NVIDIA API Trial ToS — "do not submit personal/confidential data"

#### Règles financières

- Démarrage à coût zéro
- Aucun abonnement payant automatique
- Aucun achat de crédits
- Si quotas gratuits épuisés → suspendre les tâches et avertir l'administrateur

### 6.2 Réseaux sociaux (connecteurs officiels)

Aucun connecteur n'est configuré. Les étapes suivantes doivent être réalisées manuellement par l'administrateur :

| Plateforme | API officielle | Prérequis | App Review | Statut |
|------------|---------------|-----------|------------|--------|
| WhatsApp Business | WhatsApp Cloud API | Compte développeur Meta, WABA, numéro de téléphone, token système | Non requis (sortant) | Non configuré |
| Facebook | Graph API | App Meta, Page FB, page access token | Requis | Non configuré |
| Instagram | Instagram Graph API | Compte pro/créateur, compte FB lié, token IG | Requis | Non configuré |
| TikTok | TikTok API for Business | App développeur TikTok, client key, access token | Requis | Non configuré |
| YouTube | Data API v3 | Projet GCP, clé API/OAuth, quota 10 000 unités/jour | Non requis | Non configuré |
| Threads | Threads API | App Meta "Threads use case", token utilisateur 60j | Requis | Non configuré |

**Règle :** Aucune publication sans approbation humaine via `ai-dashboard.html`.

### 6.3 Vérification Supabase en lecture seule

Le projet DAR MAROC est `hiicfqjubfqgtsfmsxny` (`https://hiicfqjubfqgtsfmsxny.supabase.co`).

```bash
# Vérifier les tables (lecture seule, avec clé anon publique)
curl -sS -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>" \
  "https://hiicfqjubfqgtsfmsxny.supabase.co/rest/v1/annonces?select=*&limit=0"
```

**Blocage actuel :** le connecteur MCP de cette session pointe vers un autre projet (`nxmsqqoflskfajqrqddw`). L'accès au bon projet nécessite une configuration séparée.

---

## 7. État de sécurité

### Problèmes P0 corrigés
- Mots de passe en clair supprimés de la documentation et des commentaires
- Migration RLS préparée (`003_rls_hardening.sql`) — non appliquée en production

### Problèmes P0 restants (nécessitent une action)
1. **RLS ouvertes sur les tables de contenu** (`using (true) with check (true)`) — durcissement planifié en Phase 2 avec Supabase Auth
2. **Clé anon Supabase exposée** dans `config/site-config.js` (publique par design, mais couplée à des RLS ouvertes)
3. **Authentification admin côté client uniquement** (SHA-256 non salé, contournable via `sessionStorage`)
4. **Clé Web3Forms en dur** dans `deposer-annonce.html` et `js/main.js`

---

## 8. Tests exécutés (local, Node.js)

| Test | Résultat |
|------|----------|
| 9 agents enregistrés | ✅ 54/54 |
| Initialisation système | ✅ |
| Création de missions (9 agents) | ✅ |
| Prévention des doublons (idempotence) | ✅ |
| Bug `generate()` corrigé | ✅ |
| File de tâches + statuts | ✅ |
| Centre de validation (approve/reject) | ✅ |
| Exécution mission approuvée | ✅ |
| Journaux d'activité | ✅ |
| Permissions par agent | ✅ |
| Fournisseurs IA + fallback local | ✅ |
| Langues FR/AR/Darija/EN/ES | ✅ |
| Agent 9 (zéro chiffre fictif) | ✅ |
| Erreurs, reprises, quotas | ✅ 8/8 |
| **Total** | **62/62 réussis** |

### Non testé (blocages)
- Test navigateur réel (proxy OpenCode bloque localhost:8080)
- Interactions Supabase réelles (mauvais projet MCP)
- Déploiement de l'Edge Function
- Intégrations réseaux sociaux réelles

---

## 9. État de chaque composant

| Composant | État | Testé localement | Vérifié en production |
|-----------|------|------------------|----------------------|
| Orchestrateur | Implémenté | ✅ | Non |
| 9 agents | Implémentés | ✅ | Non |
| Centre de validation | Implémenté (HTML) | ⚠️ Statique uniquement | Non |
| Fournisseurs IA (abstraction) | Implémenté | ✅ | Non |
| Edge Function `ai-generate` | Préparée (non déployée) | Non | Non |
| Migration `002_ai_tables` | Préparée (non appliquée) | Non | Non |
| Migration `003_rls_hardening` | Préparée (non appliquée) | Non | Non |
| Connecteurs sociaux | Documentés (non configurés) | Non | Non |
| Bug `generate()` | Corrigé | ✅ | Non |
| Sécurité P0 (mots de passe) | Corrigé | ✅ | Non |
| Sécurité P0 (RLS) | Préparée (non appliquée) | Non | Non |

---

## 10. Prochaines étapes (requièrent autorisation)

1. Appliquer les migrations `002` et `003` sur Supabase (après sauvegarde)
2. Déployer l'Edge Function `ai-generate`
3. Configurer les clés API dans Supabase Secrets
4. Configurer les comptes sociaux et App Review
5. Tester `ai-dashboard.html` dans un navigateur réel
6. Déployer sur GitHub Pages (après validation humaine)
