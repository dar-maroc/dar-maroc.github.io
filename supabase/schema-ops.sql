-- ============================================================
-- DAR MAROC — TABLES OPS (Phase A)
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- Après supabase/schema.sql (si pas déjà fait).
--
-- Persiste les données opérationnelles du dashboard
-- (réservations, tâches, canaux, audit…) hors localStorage.
-- Mode Phase 1 : RLS ouvert en écriture via clé anon
-- (protection applicative, comme le reste du schéma).
-- ============================================================

-- État complet des collections ops (un blob JSON par clé).
-- Remplacé à chaque persistOps() — last-write-wins, simple et fiable.
create table if not exists public.ops_state (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.ops_state enable row level security;
create policy "ops_state_select" on public.ops_state for select using (true);
create policy "ops_state_write" on public.ops_state for all using (true) with check (true);

-- Journal d'activité (audit log du dashboard, §25).
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  username text not null default '',
  role text not null default '',
  object text not null default '',
  action text not null default '',
  old_v text not null default '',
  new_v text not null default '',
  at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;
create policy "audit_logs_select" on public.audit_logs for select using (true);
create policy "audit_logs_insert" on public.audit_logs for insert with check (true);

create index if not exists audit_logs_at_idx on public.audit_logs (at desc);

-- Bucket documents (fichiers > limite localStorage).
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "Documents - lecture publique"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "Documents - depot phase1"
  on storage.objects for insert
  with check (bucket_id = 'documents');

create policy "Documents - maj phase1"
  on storage.objects for update
  using (bucket_id = 'documents');

create policy "Documents - suppression phase1"
  on storage.objects for delete
  using (bucket_id = 'documents');
