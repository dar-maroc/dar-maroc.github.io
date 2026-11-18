-- ============================================================
-- DAR MAROC AI — MIGRATION ADDITIVE 002
-- Tables pour l'orchestrateur multi-agents IA.
--
-- RÈGLE : AJOUT UNIQUEMENT. Aucune table existante n'est modifiée,
-- supprimée ni réinitialisée. Les politiques RLS restent restrictives
-- (lecture/écriture authentifiée uniquement, pas d'accès anon ouvert).
--
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- Après supabase/schema.sql (et schema-ops.sql si présent).
-- ============================================================

-- ------------------------------------------------------------
-- 1. MISSIONS DE L'ORCHESTRATEUR
-- Une mission = une demande de travail pour un ou plusieurs agents.
-- ------------------------------------------------------------
create table if not exists public.ai_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  agent_id text not null,               -- identifiant de l'agent responsable (1..9)
  status text not null default 'queued'
    check (status in ('queued','running','awaiting_approval','approved','rejected','executed','failed','cancelled')),
  priority int not null default 5       -- 1 (critique) à 9 (basse)
    check (priority between 1 and 9),
  payload jsonb not null default '{}'::jsonb,   -- données d'entrée de la mission
  result jsonb,                         -- résultat produit par l'agent
  error text,                           -- message d'erreur si échec
  attempts int not null default 0       -- nombre de tentatives effectuées
    check (attempts >= 0),
  max_attempts int not null default 3   -- tentatives max avant bascule en failed
    check (max_attempts between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  idempotency_key text unique           -- prévention des doublons d'exécution
);
create index if not exists ai_missions_status_idx on public.ai_missions (status);
create index if not exists ai_missions_agent_idx on public.ai_missions (agent_id);
create index if not exists ai_missions_created_idx on public.ai_missions (created_at desc);
create index if not exists ai_missions_idempotency_idx on public.ai_missions (idempotency_key);

-- ------------------------------------------------------------
-- 2. JOURNAL D'ACTIVITÉ DES AGENTS (immuable, traçabilité)
-- ------------------------------------------------------------
create table if not exists public.ai_agent_logs (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.ai_missions (id) on delete set null,
  agent_id text not null,
  action text not null,                 -- ex: 'research', 'generate', 'validate', 'approve', 'reject'
  level text not null default 'info'
    check (level in ('debug','info','warn','error')),
  message text not null,
  context jsonb not null default '{}'::jsonb,   -- contexte partagé (filtré, sans secrets)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_agent_logs_mission_idx on public.ai_agent_logs (mission_id, created_at);
create index if not exists ai_agent_logs_agent_idx on public.ai_agent_logs (agent_id, created_at desc);

-- ------------------------------------------------------------
-- 3. CENTRE DE VALIDATION HUMAINE
-- Chaque recommandation d'agent doit être approuvée avant exécution externe.
-- ------------------------------------------------------------
create table if not exists public.ai_validations (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.ai_missions (id) on delete set null,
  agent_id text not null,
  action_proposed text not null,        -- description de l'action proposée
  content text,                         -- contenu complet préparé (post, email, message…)
  platform text,                        -- plateforme concernée (whatsapp, facebook, instagram…)
  scheduled_at timestamptz,             -- date/heure prévue d'exécution
  risks text default '',                -- risques éventuels
  estimated_cost numeric default 0      -- coût estimé (0 = gratuit)
    check (estimated_cost >= 0),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','executed','error')),
  decided_by text,                      -- identifiant de l'humain ayant décidé
  decided_at timestamptz,
  decision_note text,                   -- commentaire de la décision
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_validations_status_idx on public.ai_validations (status);
create index if not exists ai_validations_created_idx on public.ai_validations (created_at desc);

-- ------------------------------------------------------------
-- 4. RECOMMANDATIONS DES AGENTS (niche, tendance, audience, partenaire…)
-- ------------------------------------------------------------
create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.ai_missions (id) on delete set null,
  agent_id text not null,
  category text not null,               -- 'niche' | 'trend' | 'audience' | 'partner' | 'keyword' | 'content'
  title text not null,
  description text default '',
  confidence numeric not null default 0
    check (confidence between 0 and 100),   -- niveau de confiance (0-100)
  source_url text,                      -- source publique de l'information
  source_date date,                     -- date de l'information source
  data jsonb not null default '{}'::jsonb,  -- données détaillées de la recommandation
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_recommendations_category_idx on public.ai_recommendations (category, created_at desc);
create index if not exists ai_recommendations_confidence_idx on public.ai_recommendations (confidence desc);

-- ------------------------------------------------------------
-- 5. QUOTAS ET ÉTAT DES FOURNISSEURS IA
-- Suivi des quotas disponibles et du fournisseur actif / de secours.
-- ------------------------------------------------------------
create table if not exists public.ai_quotas (
  provider text primary key,            -- 'openai', 'gemini', 'nvidia', 'opencode'…
  model text not null,
  capability text not null default 'text'
    check (capability in ('text','vision','image','reasoning','multilingual')),
  is_primary boolean not null default false,
  is_fallback boolean not null default false,
  quota_free_total numeric,             -- quota gratuit total (ex: requêtes/jour)
  quota_free_used numeric not null default 0
    check (quota_free_used >= 0),
  quota_reset_at timestamptz,           -- date de réinitialisation du quota
  last_error text,                      -- dernière erreur rencontrée
  last_check_at timestamptz,            -- dernière vérification de disponibilité
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. HISTORIQUE DES DÉCISIONS ET TRAÇABILITÉ
-- ------------------------------------------------------------
create table if not exists public.ai_decision_log (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.ai_missions (id) on delete set null,
  agent_id text not null,
  decision text not null,               -- 'approve' | 'reject' | 'execute' | 'skip' | 'suspend'
  rationale text default '',            -- pourquoi cette décision
  actor text not null,                  -- 'human' | 'system' | 'agent'
  created_at timestamptz not null default now()
);
create index if not exists ai_decision_log_mission_idx on public.ai_decision_log (mission_id, created_at desc);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY — RESTRICTIVE (pas d'accès anon ouvert)
-- ------------------------------------------------------------
alter table public.ai_missions enable row level security;
alter table public.ai_agent_logs enable row level security;
alter table public.ai_validations enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.ai_quotas enable row level security;
alter table public.ai_decision_log enable row level security;

-- Lecture publique des quotas (état des fournisseurs visible sans auth)
create policy "ai_quotas_public_select" on public.ai_quotas for select using (true);

-- Toutes les autres tables : lecture/écriture réservée aux utilisateurs authentifiés
create policy "ai_missions_auth_all" on public.ai_missions for all using (auth.uid() is not null);
create policy "ai_agent_logs_auth_all" on public.ai_agent_logs for all using (auth.uid() is not null);
create policy "ai_validations_auth_all" on public.ai_validations for all using (auth.uid() is not null);
create policy "ai_recommendations_auth_all" on public.ai_recommendations for all using (auth.uid() is not null);
create policy "ai_decision_log_auth_all" on public.ai_decision_log for all using (auth.uid() is not null);

-- ------------------------------------------------------------
-- NOTE : aucune donnée existante n'est touchée. Ces tables sont vides
-- à la création et seront remplies par l'orchestrateur au runtime.
-- ============================================================
