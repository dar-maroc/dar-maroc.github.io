# DAR MAROC AI — Spécification d'authentification serveur (ÉTAPE 2)

**STATUT : PRÉPARATION UNIQUEMENT. Aucune modification appliquée sur la base de production.**

---

## 1. Problème actuel

L'authentification admin est 100 % côté client (`admin/js/auth.js`) :
- Session dans `sessionStorage` (contournable via console navigateur)
- Hash SHA-256 non salé comparé côté navigateur
- Mot de passe par défaut documenté en clair dans les fichiers publics
- RLS `admin_users` ouverts (`using (true)`) → lecture des hash et création de compte via clé anon

---

## 2. Architecture cible (serveur réel)

```
Navigateur (client)
    │
    ├─► Edge Function `ai-auth` (Supabase)
    │       │  Vérifie le cookie JWT Supabase Auth
    │       │  Retourne rôle + permissions (côté serveur)
    │       │  Aucune logique d'auth côté client
    │
    └─► Edge Function `ai-generate` (Supabase)
            │  Vérifie le JWT, les quotas, l'idempotence
            │  Appelle le fournisseur IA (clés dans Supabase Secrets)
```

### 2.1 Composants à créer

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Edge Function `ai-auth` | `supabase/functions/ai-auth/index.ts` | Vérification JWT, retour rôle/permissions, logout |
| Middleware de protection | Dans chaque Edge Function | Vérification JWT + rôle requis |
| Stockage des rôles | Supabase `admin_users` (existant) + `auth.users` | Source de vérité côté serveur |
| Clés API | Supabase Secrets (Dashboard) | Jamais dans le JS public |

### 2.2 Flux d'authentification

1. L'utilisateur se connecte via Supabase Auth (email/mot de passe)
2. Supabase émet un JWT (access token)
3. Le client stocke le JWT (cookie ou localStorage sécurisé)
4. À chaque appel Edge Function, le client envoie `Authorization: Bearer <JWT>`
5. L'Edge Function vérifie le JWT via `supabase.auth.getUser()`
6. L'Edge Function vérifie le rôle dans `admin_users` (lié par `auth.uid()`)
7. L'Edge Function exécute ou rejette selon le rôle

### 2.3 Rôles et permissions (côté serveur)

| Rôle | Source | Permissions Edge Function |
|------|--------|---------------------------|
| `superadmin` | `auth.users` + `admin_users.role` | Toutes les Edge Functions |
| `admin` | `admin_users.role = 'admin'` | IA, validations, missions |
| `contrib` | `admin_users.role = 'contrib'` | Biens propres, lecture |
| `client` | `auth.users` (non admin) | Lecture publique uniquement |

---

## 3. Recommandations de durcissement RLS (à appliquer après migration 003)

### 3.1 Tables à durcir (en plus de 003)

Les politiques `contenu_phase1_write` (`using (true) with check (true)`) doivent être remplacées par des politiques `authenticated-only` une fois Supabase Auth en place :

```sql
-- Exemple pour annonces (à adapter pour chaque table)
DROP POLICY IF EXISTS "annonces_phase1_write" ON public.annonces;
CREATE POLICY "annonces_write_authenticated" ON public.annonces
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

### 3.2 Tables à garder en lecture publique

- `villes`, `quartiers`, `categories`, `services`, `showcase`, `partners`, `temoignages`, `faq`, `agences`
- `annonces` (lecture publique des annonces publiées)
- `images`, `videos` (lecture publique des médias)

### 3.3 Tables à restreindre totalement

- `admin_users` : lecture/écriture réservée aux admins authentifiés
- `ops_state` : lecture/écriture réservée aux authentifiés
- `audit_logs` : lecture réservée aux authentifiés, écriture réservée
- `parametres` : écriture réservée aux authentifiés

---

## 4. Suppression des mécanismes contournables côté client

### 4.1 Fichiers à modifier (préparation)

| Fichier | Action |
|---------|--------|
| `admin/js/auth.js` | Remplacer la logique SHA-256 locale par un appel à l'Edge Function `ai-auth` qui vérifie le JWT Supabase |
| `admin/js/dashboard.js` | Remplacer `IS_ADMIN` (déduit de `sessionStorage`) par une vérification via Edge Function ou un appel Supabase authentifié |
| `admin/index.html` | Page de login qui appelle Supabase Auth (`supabase.auth.signInWithPassword`) |

### 4.2 Ce qui ne doit PAS être fait sans autorisation

- Ne pas supprimer `auth.js` tant que Supabase Auth n'est pas configuré (risque de verrouillage)
- Ne pas modifier les hashs dans `admin_users` (les comptes existants doivent continuer à fonctionner)
- Ne pas appliquer les politiques RLS `authenticated-only` sur les tables de contenu sans authentification serveur fonctionnelle (risque de blocage du dashboard)

---

## 5. Plan de transition (4 phases)

### Phase A (prêt, non appliqué)
- Créer l'Edge Function `ai-auth`
- Configurer Supabase Auth sur le projet `hiicfqjubfqgtsfmsxny`
- Créer les comptes `auth.users` correspondants aux `admin_users` existants

### Phase B (prêt, non appliqué)
- Appliquer la migration `003_rls_hardening.sql` (durcit `admin_users`, `ops_state`, `audit_logs`, `documents`)
- Garder `contenu_phase1_write` pour la compatibilité Phase 1

### Phase C (à préparer)
- Remplacer l'auth côté client par Supabase Auth + Edge Function `ai-auth`
- Remplacer `contenu_phase1_write` par des politiques `authenticated-only`

### Phase D (à préparer)
- Supprimer les hashs et mots de passe des fichiers publics
- Retirer la clé anon de `config/site-config.js` (remplacée par des appels Edge Function authentifiés)

---

## 6. Risques et atténuation

| Risque | Niveau | Atténuation |
|--------|--------|-------------|
| Verrouillage admin | Élevé | Garder un compte `admin` avec mot de passe connu avant de modifier les RLS |
| Dashboard inaccessible | Moyen | Tester l'Edge Function `ai-auth` avant de modifier `auth.js` |
| Perte des hashs | Faible | Les hashs sont dans `admin_users` (base), pas seulement dans les fichiers |
| Clé anon toujours exposée | Moyen | Les RLS restrictives limitent ce que la clé anon peut faire, même si elle est connue |
