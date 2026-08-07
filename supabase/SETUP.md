# Installation Supabase (Phase 1)

Le site reste **statique** sur GitHub Pages. Supabase est utilisé côté client
pour rendre les annonces, services, témoignages et paramètres **persistants** :
ils ne disparaissent plus après actualisation (problème du localStorage).

Tant que les clés ne sont pas renseignées, le site fonctionne **exactement comme
avant** (100 % localStorage). Aucune page ne casse.

---

## Étapes

### 1. Créer le projet
1. Aller sur [supabase.com](https://supabase.com) → **New project**.
2. Nom du projet : `dar-maroc`.
3. Choisir une région proche (Frankfurt ou Paris) et un mot de passe base.
4. Créer le projet (1-2 minutes).

### 2. Exécuter le schéma
1. Dans le dashboard Supabase, ouvrir **SQL Editor** → **New query**.
2. Copier tout le contenu de `supabase/schema.sql`.
3. Cliquer **Run**. Vous devriez voir les tables :
   `annonces`, `services`, `categories`, `temoignages`, `faq`, `showcase`, `parametres`,
   `images`, `clients`, `demandes`, `admin_users`, etc.
   La fin du fichier crée aussi (optionnel) la table `stat_events` pour
   agréger les statistiques du site entre tous les appareils.

### 3. Récupérer URL + clé anon
1. **Project Settings** → **API** (ou **API Keys**).
2. Copier :
   - **Project URL** (ex. `https://abcdefgh.supabase.co`)
   - **anon / public key** (commence par `eyJ...`)

### 4. Renseigner la configuration
Dans `config/site-config.js`, compléter :

```js
supabase: {
  url: 'https://votre-projet.supabase.co',
  anonKey: 'votre-cle-anon',
  photosBucket: 'annonces'
}
```

> ⚠️ Ne jamais mettre la clé **service_role** (réservée au serveur).
> La clé **anon** est conçue pour être publique ; la sécurité repose sur
> les politiques RLS définies dans `schema.sql`.

### 5. Mettre en ligne
Téléverser le dossier `dar-maroc-site/` sur GitHub Pages (comme d'habitude).
Le service worker passe en cache `darmaroc-core-v12` : les visiteurs reçoivent
automatiquement la nouvelle version.

---

## Vérification

1. Ouvrir `admin/dashboard.html` → la barre d'état affiche
   **« Supabase PostgreSQL actif »**.
2. Ajouter une annonce avec des photos → l'annonce **survit à l'actualisation**
   et aux changements de navigateur.
3. Les photos sont uploadées dans le **Storage** (bucket `annonces`).
4. Sur le site public (`properties.html`), les annonces de la base remplacent
   le cache local au chargement.

---

## Sécurité (RLS)

- Lecture publique : tout le monde peut lire les annonces/services publiés
  (nécessaire pour un site public).
- Écriture : réservée aux administrateurs (`contenu_phase1_write`).
- Pour gérer les comptes admin plus tard : table `utilisateurs` avec
  `is_admin()`, le dashboard utilisera l'authentification Supabase (Phase 2).

---

## En cas de problème

| Symptôme | Cause probable |
| --- | --- |
| « Stockage local » affiché | Clés vides ou mal collées dans `site-config.js` |
| Erreur `relation "public.annonces" does not exist` | `schema.sql` pas exécuté |
| Erreur `permission denied` | RLS pas appliquée (relancer le SQL) |
| Photos absentes | Bucket `annonces` introuvable → le SQL le crée, sinon le créer dans **Storage** |
| CORS bloqué | Ajouter `https://dar-maroc.github.io` dans **Storage → Settings → Allowed origins** |

> Pour re-téléverser les données locales existantes dans Supabase :
> ouvrir le dashboard, puis **Synchroniser** (bouton ajouté dans la barre
> d'outils) — chaque collection sauvegardée est poussée vers la base.
