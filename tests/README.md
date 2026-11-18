# Tests DAR MAROC AI

## Comment exécuter les tests

Tous les tests unitaires s'exécutent avec Node.js :

```bash
cd /Users/hind/Documents/Default Project/dar-maroc-audit
node tests/run-tests.cjs
```

## Structure

- `tests/unit/` — Tests unitaires (mocks uniquement, pas d'appel réseau)
  - `auth.test.cjs` — Authentification (valide, invalide, JWT expiré, rôle manquant, rôle non autorisé, Edge Function indisponible, refus du fallback admin, protection contre localOverride)
  - `orchestrator.test.cjs` — Orchestrateur (création de mission, idempotence, validation humaine, permissions des neuf agents)
  - `provider.test.cjs` — Fournisseurs IA (quotas, erreurs, fallback local)

- `tests/integration/` — Tests d'intégration (nécessitent un serveur et des clés API)
  - `ai-auth.test.cjs` — Edge Function ai-auth (JWT, vérification serveur)
  - `ai-generate.test.cjs` — Edge Function ai-generate (génération, quotas, rate limiting)

- `tests/run-tests.cjs` — Lance tous les tests unitaires

## Convention de nommage

Les tests distinguent :
- **Mocks** : simulations en mémoire, pas d'appel réseau
- **Vrais appels réseau** : appels vers l'Edge Function ou Supabase (marqués comme tels)

## Résultat attendu

Tous les tests unitaires doivent passer (0 échec). Tout échec bloque la mise en production.