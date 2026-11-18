-- ============================================================
-- DAR MAROC AI — MIGRATION ADDITIVE 003
-- Durcissement des politiques RLS (Phase 1 → Phase 1.5)
--
-- RÈGLE : AJOUT UNIQUEMENT. Aucune table existante n'est supprimée.
-- Les politiques existantes sont remplacées par des versions plus
-- restrictives pour les tables sensibles (admin_users).
-- Les tables de contenu publique gardent leur lecture publique.
--
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- Après supabase/schema.sql et supabase/schema-ops.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Ajout de la colonne auth_id sur admin_users
--    Permet de lier un utilisateur Supabase Auth (auth.users.id)
--    à son compte admin_users pour l'authentification serveur.
-- ------------------------------------------------------------
alter table public.admin_users
  add column if not exists auth_id uuid unique;

create index if not exists admin_users_auth_id_idx on public.admin_users (auth_id);

-- ------------------------------------------------------------
-- 2. Fonction helper : vérifier si l'utilisateur connecté est admin
--    (basé sur auth.uid() lié à admin_users.auth_id)
-- ------------------------------------------------------------
create or replace function public.is_ai_admin()
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from public.admin_users
  where auth_id = auth.uid()
    and actif = true;
  return coalesce(v_role = 'admin', false);
exception when others then
  return false;
end;
$$;

-- ------------------------------------------------------------
-- 2b. Fonction helper : rôle de l'utilisateur connecté
-- ------------------------------------------------------------
create or replace function public.ai_user_role()
returns text
language plpgsql stable security definer set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from public.admin_users
  where auth_id = auth.uid()
    and actif = true;
  return coalesce(v_role, 'client');
exception when others then
  return 'client';
end;
$$;

-- ------------------------------------------------------------
-- 3. Durcir admin_users : lecture du pass_hash réservée aux admins
--    (actuellement : select/write `using (true)` = ouvert à tous)
-- ------------------------------------------------------------
drop policy if exists "admin_users_select" on public.admin_users;
drop policy if exists "admin_users_write" on public.admin_users;

-- Lecture : seul l'admin authentifié peut lire (y compris son propre hash)
create policy "admin_users_select_restricted" on public.admin_users
  for select using (
    auth.uid() is not null
    and public.is_ai_admin()
  );

-- Écriture : réservée aux admins authentifiés
create policy "admin_users_write_restricted" on public.admin_users
  for all using (public.is_ai_admin())
  with check (public.is_ai_admin());

-- ------------------------------------------------------------
-- 4. Durcir ops_state et audit_logs : lecture/écriture authentifiée uniquement
-- ------------------------------------------------------------
drop policy if exists "ops_state_select" on public.ops_state;
drop policy if exists "ops_state_write" on public.ops_state;

create policy "ops_state_select_auth" on public.ops_state
  for select using (auth.uid() is not null);

create policy "ops_state_write_auth" on public.ops_state
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "audit_logs_select" on public.audit_logs;
drop policy if exists "audit_logs_insert" on public.audit_logs;

create policy "audit_logs_select_auth" on public.audit_logs
  for select using (auth.uid() is not null);

create policy "audit_logs_insert_auth" on public.audit_logs
  for insert with check (auth.uid() is not null);

-- ------------------------------------------------------------
-- 5. Bucket documents : écriture réservée aux authentifiés
--    (lecture publique conservée pour les documents partagés)
-- ------------------------------------------------------------
drop policy if exists "Documents - depot phase1" on storage.objects;
drop policy if exists "Documents - maj phase1" on storage.objects;
drop policy if exists "Documents - suppression phase1" on storage.objects;

create policy "Documents - depot auth" on storage.objects
  for insert
  with check (bucket_id = 'documents' and auth.uid() is not null);

create policy "Documents - maj auth" on storage.objects
  for update
  using (bucket_id = 'documents' and auth.uid() is not null)
  with check (bucket_id = 'documents' and auth.uid() is not null);

create policy "Documents - suppression auth" on storage.objects
  for delete
  using (bucket_id = 'documents' and auth.uid() is not null);

-- ------------------------------------------------------------
-- NOTE : les politiques "contenu_phase1_write" et "annonces_phase1_write"
-- restent inchangées pour préserver le fonctionnement Phase 1
-- (protection applicative par mot de passe côté dashboard).
-- Leur durcissement (authenticated-only) est planifié en Phase 2
-- avec Supabase Auth.
-- ============================================================
