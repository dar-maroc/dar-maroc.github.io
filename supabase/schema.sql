-- ============================================================
-- DAR MAROC - SCHEMA SUPABASE (PostgreSQL)
-- Phase 1 : persistance totale des annonces, photos et contenus.
--
-- Exécuter ce fichier dans : Supabase Dashboard > SQL Editor.
-- (Lire supabase/SETUP.md pour les étapes de mise en route.)
--
-- NOTE SECURITE Phase 1 : le dashboard actuel garde sa protection
-- par mot de passe côté application. Les tables de contenu sont
-- donc accessibles en écriture à la clé "anon" (comme l'était
-- localStorage). La Phase 2 remplace cette protection par
-- Supabase Auth (JWT) et les politiques deviennent
-- authenticated-only. Ne pas exposer la clé service_role.
-- ============================================================

-- ============================================================
-- EXTENSIONS & HELPERS
-- ============================================================
create extension if not exists pgcrypto;

-- Rôle courant de l'utilisateur connecté (utile pour les politiques).
create or replace function public.current_role()
returns text
language plpgsql stable security definer set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from public.utilisateurs where id = auth.uid();
  return coalesce(v_role, '');
end;
$$;

create or replace function public.is_admin()
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from public.utilisateurs where id = auth.uid();
  return coalesce(v_role in ('superadmin', 'admin'), false);
end;
$$;

-- Horodatage automatique de modification.
create or replace function public.set_mis_a_jour()
returns trigger language plpgsql as $$
begin
  new.mis_a_jour_le = now();
  return new;
end;
$$;

-- ============================================================
-- UTILISATEURS, AGENCES, AGENTS
-- ============================================================
create table public.utilisateurs (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('superadmin','admin','agent','editeur','client')),
  prenom text default '',
  nom text default '',
  email text,
  telephone text default '',
  ville text default '',
  avatar_url text default '',
  bio text default '',
  actif boolean not null default true,
  cree_le timestamptz not null default now(),
  mis_a_jour_le timestamptz not null default now()
);
create unique index if not exists utilisateurs_email_key on public.utilisateurs (email) where email is not null;

create table public.agences (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text default '',
  logo_url text default '',
  adresse text default '',
  ville_id uuid,
  telephone text default '',
  whatsapp text default '',
  email text default '',
  site_url text default '',
  actif boolean not null default true,
  cree_le timestamptz not null default now(),
  mis_a_jour_le timestamptz not null default now()
);

create table public.agents (
  id uuid primary key references public.utilisateurs (id) on delete cascade,
  agence_id uuid references public.agences (id) on delete set null,
  specialites text[] not null default '{}',
  cv_url text default '',
  commission numeric default 0,
  note_moyenne numeric default 0,
  cree_le timestamptz not null default now()
);

create trigger trg_utilisateurs_maj before update on public.utilisateurs
  for each row execute function public.set_mis_a_jour();
create trigger trg_agences_maj before update on public.agences
  for each row execute function public.set_mis_a_jour();

-- Premier compte créé = Super Admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.utilisateurs (id, email, prenom, nom)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'prenom', ''),
    coalesce(new.raw_user_meta_data ->> 'nom', '')
  );
  if not exists (select 1 from public.utilisateurs where role = 'superadmin') then
    update public.utilisateurs set role = 'superadmin' where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- GEOGRAPHIE : VILLES & QUARTIERS
-- ============================================================
create table public.villes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  slug text unique not null,
  pays text not null default 'Maroc',
  latitude numeric default 0,
  longitude numeric default 0,
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

create table public.quartiers (
  id uuid primary key default gen_random_uuid(),
  ville_id uuid not null references public.villes (id) on delete cascade,
  nom text not null,
  slug text not null,
  latitude numeric default 0,
  longitude numeric default 0,
  actif boolean not null default true,
  cree_le timestamptz not null default now(),
  unique (ville_id, slug)
);
create index quartiers_ville_idx on public.quartiers (ville_id);

-- ============================================================
-- CONTENU : CATEGORIES, SERVICES, FAQ, TEMOIGNAGES
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  nom_fr text not null,
  nom_ar text default '',
  slug text unique,
  icon text not null default 'fa-layer-group',
  ordre int not null default 0,
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  nom_fr text not null,
  nom_ar text default '',
  categorie text default '',
  icon text not null default 'fa-wrench',
  description_fr text default '',
  description_ar text default '',
  href text default 'services.html',
  img text default '',
  alt text default '',
  ordre int not null default 0,
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

-- Section "Démonstration" : slides du carrousel "Visitez Nos Biens en Vidéo"
create table public.showcase (
  id uuid primary key default gen_random_uuid(),
  badge text not null default 'sale',
  titre_fr text default '',
  titre_ar text default '',
  surface text default '',
  chambres text default '',
  sdb text default '',
  prix text default '',
  periode text default '',
  img text default '',
  alt text default '',
  ordre int not null default 0,
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

create table public.temoignages (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  ville text default '',
  note int not null default 5 check (note between 1 and 5),
  texte_fr text default '',
  texte_ar text default '',
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

create table public.faq (
  id uuid primary key default gen_random_uuid(),
  question_fr text not null,
  question_ar text default '',
  reponse_fr text default '',
  reponse_ar text default '',
  ordre int not null default 0,
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

-- ============================================================
-- ANNONCES
-- ============================================================
create table public.annonces (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references public.utilisateurs (id) on delete set null,
  agence_id uuid references public.agences (id) on delete set null,
  categorie_id uuid references public.categories (id) on delete set null,
  ville_id uuid references public.villes (id) on delete set null,
  quartier_id uuid references public.quartiers (id) on delete set null,

  type text not null default 'sale'
    check (type in ('sale','rent','renovation','decoration')),

  titre_fr text not null,
  titre_ar text default '',
  description_fr text default '',
  description_ar text default '',

  -- Affichage libre (ex: "2 500 000 DH") + valeur numérique pour la recherche.
  prix text default '',
  prix_numeric numeric,
  devise text not null default 'DH',
  periode text not null default '' check (periode in ('','jour','mois','nuit')),

  -- Localisation (ville dénormalisée pour compatibilité + ville_id relationnel).
  ville text default '',
  pays text default '',
  categorie text default '',
  quartier text default '',
  adresse text default '',
  latitude numeric,
  longitude numeric,

  -- Caractéristiques
  surface numeric,
  chambres int,
  sdb int,
  cuisine boolean not null default false,
  salon boolean not null default false,
  piscine boolean not null default false,
  garage boolean not null default false,
  jardin boolean not null default false,
  terrasse boolean not null default false,
  ascenseur boolean not null default false,
  vue text default '',
  parking boolean not null default false,
  wifi boolean not null default false,
  climatisation boolean not null default false,

  -- Médias & liens
  video_youtube text default '',
  visite_virtuelle text default '',
  plan_pdf text default '',
  lien_externe text default '',

  -- Compatibilité dashboard (champs existants de l'application)
  photos jsonb not null default '[]'::jsonb,
  photo_dates jsonb not null default '[]'::jsonb,
  delai text default '',
  style_decoration text default '',
  alt text default '',
  href_secours text default 'contact.html',

  -- Auteur de l'annonce (compte dashboard : darmaroc, user1…user5)
  owner text default '',

  -- SEO & statut
  slug text default '',
  statut text not null default 'publie'
    check (statut in ('brouillon','publie','archive','vendu','loue')),
  seo_title text default '',
  seo_description text default '',
  image_principale text default '',
  actif boolean not null default true,

  -- Suivi
  vues int not null default 0,
  favoris_count int not null default 0,
  date_depot timestamptz not null default now(),
  mis_a_jour_le timestamptz not null default now()
);

create index annonces_type_idx on public.annonces (type);
create index annonces_statut_idx on public.annonces (statut);
create index annonces_ville_idx on public.annonces (ville_id);
create index annonces_categorie_idx on public.annonces (categorie_id);
create index annonces_prix_idx on public.annonces (prix_numeric);
create index annonces_date_idx on public.annonces (date_depot desc);
create index annonces_actif_idx on public.annonces (actif, statut);
create index annonces_fts_idx on public.annonces
  using gin (to_tsvector('french', titre_fr || ' ' || coalesce(description_fr,'') || ' ' || coalesce(ville,'')));

create trigger trg_annonces_maj before update on public.annonces
  for each row execute function public.set_mis_a_jour();

-- Migration pour les bases déjà existantes (sans effet si la colonne existe déjà).
alter table public.annonces add column if not exists owner text default '';

-- Historique des modifications d'annonces.
create table public.historique_modifications (
  id uuid primary key default gen_random_uuid(),
  entite text not null,
  entite_id uuid not null,
  ancien jsonb,
  nouveau jsonb,
  utilisateur_id uuid,
  cree_le timestamptz not null default now()
);
create index historique_entite_idx on public.historique_modifications (entite, entite_id);
create index historique_date_idx on public.historique_modifications (cree_le desc);

create or replace function public.log_annonce_changes()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new is distinct from old then
    insert into public.historique_modifications (entite, entite_id, ancien, nouveau, utilisateur_id)
    values ('annonces', new.id, to_jsonb(old), to_jsonb(new), auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_annonces_hist after update on public.annonces
  for each row execute function public.log_annonce_changes();

-- ============================================================
-- IMAGES & VIDEOS (Supabase Storage + table de métadonnées)
-- ============================================================
create table public.images (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid not null references public.annonces (id) on delete cascade,
  url text not null,
  miniature text default '',
  alt text default '',
  ordre int not null default 0,
  principale boolean not null default false,
  cree_le timestamptz not null default now()
);
create index images_annonce_idx on public.images (annonce_id, ordre);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid not null references public.annonces (id) on delete cascade,
  url text not null,
  titre text default '',
  ordre int not null default 0,
  cree_le timestamptz not null default now()
);
create index videos_annonce_idx on public.videos (annonce_id, ordre);

-- ============================================================
-- CLIENT, FAVORIS, DEMANDES, MESSAGES, NOTIFICATIONS
-- ============================================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references public.utilisateurs (id) on delete set null,
  prenom text default '',
  nom text default '',
  email text default '',
  telephone text default '',
  ville text default '',
  source text default '',
  note text default '',
  cree_le timestamptz not null default now()
);
create index clients_email_idx on public.clients (email);

create table public.favoris (
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  annonce_id uuid not null references public.annonces (id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (utilisateur_id, annonce_id)
);
create index favoris_annonce_idx on public.favoris (annonce_id);

create table public.demandes (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid references public.annonces (id) on delete set null,
  utilisateur_id uuid references public.utilisateurs (id) on delete set null,
  nom text not null,
  email text default '',
  telephone text default '',
  message text default '',
  type text not null default 'contact' check (type in ('contact','devis','visite','info')),
  statut text not null default 'nouveau' check (statut in ('nouveau','en_cours','termine','annule')),
  cree_le timestamptz not null default now()
);
create index demandes_statut_idx on public.demandes (statut);
create index demandes_annonce_idx on public.demandes (annonce_id);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references public.utilisateurs (id) on delete cascade,
  participant_b uuid not null references public.utilisateurs (id) on delete cascade,
  derniere_activite timestamptz not null default now(),
  cree_le timestamptz not null default now(),
  unique (participant_a, participant_b)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  expediteur_id uuid references public.utilisateurs (id) on delete set null,
  destinataire_id uuid references public.utilisateurs (id) on delete set null,
  sujet text default '',
  corps text not null,
  lu boolean not null default false,
  cree_le timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, cree_le);
create index messages_destinataire_idx on public.messages (destinataire_id, lu);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid not null references public.utilisateurs (id) on delete cascade,
  type text default '',
  titre text not null,
  contenu text default '',
  lien text default '',
  lu boolean not null default false,
  cree_le timestamptz not null default now()
);
create index notifications_utilisateur_idx on public.notifications (utilisateur_id, lu);

-- ============================================================
-- BLOG
-- ============================================================
create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  nom_fr text not null,
  nom_ar text default '',
  slug text unique,
  cree_le timestamptz not null default now()
);

create table public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  categorie_id uuid references public.blog_categories (id) on delete set null,
  auteur_id uuid references public.utilisateurs (id) on delete set null,
  titre_fr text not null,
  titre_ar text default '',
  slug text unique,
  resume_fr text default '',
  resume_ar text default '',
  contenu_fr text default '',
  contenu_ar text default '',
  image_url text default '',
  statut text not null default 'brouillon' check (statut in ('brouillon','publie')),
  seo_title text default '',
  seo_description text default '',
  vues int not null default 0,
  date_publication timestamptz,
  cree_le timestamptz not null default now(),
  mis_a_jour_le timestamptz not null default now()
);
create index blog_articles_statut_idx on public.blog_articles (statut, date_publication desc);
create trigger trg_blog_articles_maj before update on public.blog_articles
  for each row execute function public.set_mis_a_jour();

-- ============================================================
-- PARAMETRES, STATISTIQUES, EVENEMENTS
-- ============================================================
create table public.parametres (
  cle text primary key,
  valeur text not null,
  modifie_le timestamptz not null default now()
);

create table public.statistiques (
  id uuid primary key default gen_random_uuid(),
  jour date not null,
  metrique text not null,
  valeur numeric not null default 0,
  cree_le timestamptz not null default now(),
  unique (jour, metrique)
);

create table public.evenements (
  id bigint generated always as identity primary key,
  type text not null,
  payload jsonb default '{}'::jsonb,
  utilisateur_id uuid,
  cree_le timestamptz not null default now()
);
create index evenements_date_idx on public.evenements (cree_le desc);

-- ============================================================
-- STORAGE : BUCKET "annonces" (photos HD, publiques en lecture)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('annonces', 'annonces', true)
on conflict (id) do nothing;

create policy "Annonces - lecture publique"
  on storage.objects for select
  using (bucket_id = 'annonces');

-- Phase 1 : le dashboard uploadé avec la clé "anon" (protection applicative),
-- comme pour les tables de contenu. Phase 2 : auth() requis.
create policy "Annonces - depot phase1"
  on storage.objects for insert
  with check (bucket_id = 'annonces');

create policy "Annonces - maj phase1"
  on storage.objects for update
  using (bucket_id = 'annonces');

create policy "Annonces - suppression phase1"
  on storage.objects for delete
  using (bucket_id = 'annonces');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.utilisateurs enable row level security;
alter table public.agences enable row level security;
alter table public.agents enable row level security;
alter table public.villes enable row level security;
alter table public.quartiers enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.showcase enable row level security;
alter table public.temoignages enable row level security;
alter table public.faq enable row level security;
alter table public.annonces enable row level security;
alter table public.images enable row level security;
alter table public.videos enable row level security;
alter table public.clients enable row level security;
alter table public.favoris enable row level security;
alter table public.demandes enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_articles enable row level security;
alter table public.parametres enable row level security;
alter table public.statistiques enable row level security;
alter table public.evenements enable row level security;
alter table public.historique_modifications enable row level security;

-- ----- CONTENU public : lecture publique, écriture Phase 1 (app-gated) -----
create policy "contenu_public_select" on public.villes for select using (actif = true);
create policy "contenu_public_select" on public.quartiers for select using (actif = true);
create policy "contenu_public_select" on public.categories for select using (actif = true);
create policy "contenu_public_select" on public.services for select using (actif = true);
create policy "contenu_public_select" on public.showcase for select using (actif = true);
create policy "contenu_public_select" on public.temoignages for select using (actif = true);
create policy "contenu_public_select" on public.faq for select using (actif = true);
create policy "contenu_public_select" on public.agences for select using (actif = true);
create policy "annonces_public_select" on public.annonces
  for select using (actif = true and statut = 'publie');
create policy "annonces_images_select" on public.images for select using (true);
create policy "annonces_videos_select" on public.videos for select using (true);
create policy "blog_public_select" on public.blog_categories for select using (true);
create policy "blog_public_select" on public.blog_articles
  for select using (statut = 'publie');
create policy "parametres_public_select" on public.parametres for select using (true);

-- Phase 1 : le dashboard garde sa protection applicative (mot de passe).
-- À durcir en Phase 2 avec Supabase Auth (authenticated-only).
create policy "contenu_phase1_write" on public.villes for all using (true) with check (true);
create policy "contenu_phase1_write" on public.quartiers for all using (true) with check (true);
create policy "contenu_phase1_write" on public.categories for all using (true) with check (true);
create policy "contenu_phase1_write" on public.services for all using (true) with check (true);
create policy "contenu_phase1_write" on public.showcase for all using (true) with check (true);
create policy "contenu_phase1_write" on public.temoignages for all using (true) with check (true);
create policy "contenu_phase1_write" on public.faq for all using (true) with check (true);
create policy "contenu_phase1_write" on public.agences for all using (true) with check (true);
create policy "annonces_phase1_write" on public.annonces for all using (true) with check (true);
create policy "annonces_images_write" on public.images for all using (true) with check (true);
create policy "annonces_videos_write" on public.videos for all using (true) with check (true);
create policy "blog_phase1_write" on public.blog_categories for all using (true) with check (true);
create policy "blog_phase1_write" on public.blog_articles for all using (true) with check (true);
create policy "parametres_phase1_write" on public.parametres for all using (true) with check (true);
create policy "statistiques_phase1_write" on public.statistiques for all using (true) with check (true);
create policy "evenements_phase1_write" on public.evenements for all using (true) with check (true);
create policy "historique_phase1_write" on public.historique_modifications for all using (true) with check (true);

-- ----- Données utilisateurs : accès au propriétaire uniquement -----
create policy "utilisateurs_select_own" on public.utilisateurs for select using (id = auth.uid() or is_admin());
create policy "utilisateurs_update_own" on public.utilisateurs for update using (id = auth.uid() or is_admin());
create policy "agents_select_own" on public.agents for select using (id = auth.uid() or is_admin());
create policy "favoris_own" on public.favoris for all using (utilisateur_id = auth.uid()) with check (utilisateur_id = auth.uid());
create policy "demandes_own" on public.demandes for select using (utilisateur_id = auth.uid() or is_admin());
create policy "demandes_insert" on public.demandes for insert with check (true);
create policy "clients_select_admin" on public.clients for select using (is_admin() or utilisateur_id = auth.uid());
create policy "conversations_own" on public.conversations for all
  using (participant_a = auth.uid() or participant_b = auth.uid())
  with check (participant_a = auth.uid() or participant_b = auth.uid());
create policy "messages_own" on public.messages for all
  using (expediteur_id = auth.uid() or destinataire_id = auth.uid())
  with check (expediteur_id = auth.uid() or destinataire_id = auth.uid());
create policy "notifications_own" on public.notifications for all
  using (utilisateur_id = auth.uid()) with check (utilisateur_id = auth.uid());

-- ============================================================
-- SEED : VILLES DU MAROC, CATEGORIES, PARAMETRES
-- ============================================================
insert into public.villes (nom, slug, latitude, longitude) values
  ('Agadir', 'agadir', 30.4278, -9.5981),
  ('Inezgane', 'inezgane', 30.3556, -9.5361),
  ('Ait Melloul', 'ait-melloul', 30.3342, -9.4970),
  ('Taroudant', 'taroudant', 30.4703, -8.8772),
  ('Tiznit', 'tiznit', 29.6974, -9.7316),
  ('Essaouira', 'essaouira', 31.5085, -9.7595),
  ('Casablanca', 'casablanca', 33.5731, -7.5898),
  ('Rabat', 'rabat', 34.0209, -6.8416),
  ('Marrakech', 'marrakech', 31.6295, -7.9811),
  ('Fès', 'fes', 34.0181, -5.0078),
  ('Tanger', 'tanger', 35.7595, -5.8340),
  ('Meknès', 'meknes', 33.8935, -5.5473),
  ('Oujda', 'oujda', 34.6814, -1.9086),
  ('El Jadida', 'el-jadida', 33.2316, -8.5007),
  ('Tétouan', 'tetouan', 35.5785, -5.3681),
  ('Nador', 'nador', 35.1681, -2.9335),
  ('Ouarzazate', 'ouarzazate', 30.9186, -6.8934),
  ('Guelmim', 'guelmim', 28.9870, -10.0574),
  ('Laâyoune', 'laayoune', 27.1253, -13.1625),
  ('Dakhla', 'dakhla', 23.6848, -15.9580)
on conflict (slug) do nothing;

insert into public.categories (nom_fr, nom_ar, slug, icon, ordre) values
  ('Vente', 'بيع', 'sale', 'fa-house', 1),
  ('Location', 'كراء', 'rent', 'fa-key', 2),
  ('Rénovation', 'تجديد', 'renovation', 'fa-hammer', 3),
  ('Décoration', 'ديكور', 'decoration', 'fa-palette', 4)
on conflict (slug) do nothing;

insert into public.parametres (cle, valeur) values
  ('site_nom', 'DarMaroc'),
  ('slogan_fr', 'Tout pour votre maison, tout le savoir-faire marocain.'),
  ('slogan_ar', 'كل ما تحتاجه لمنزلك، بكل الخبرة المغربية.'),
  ('whatsapp', '33772208885'),
  ('email', 'Dar.maroc4@gmail.com'),
  ('telephone_fixe', '0525261486')
on conflict (cle) do nothing;

-- ============================================================
-- UTILISATEURS DU DASHBOARD (protection applicative Phase 1)
-- Comptes partagés entre tous les appareils (base PostgreSQL).
-- role 'admin' = administrateur DarMaroc (accès complet)
-- role 'contrib' = contributeur (ajout de photos et annonces uniquement)
-- ============================================================
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  role text not null default 'contrib' check (role in ('admin','contrib')),
  pass_hash text not null,
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

alter table public.admin_users enable row level security;
create policy "admin_users_select" on public.admin_users for select using (true);
create policy "admin_users_write" on public.admin_users for all using (true) with check (true);

-- Comptes par défaut : darmaroc (admin) + 5 contributeurs.
-- Hash SHA-256 : admin = "Netuser03$", contributeurs = "DarMaroc2026!".
insert into public.admin_users (username, role, pass_hash) values
  ('darmaroc', 'admin', '81be8c04b5efcf7ef00cb012d43fb833b010d0730499003ffa9ad2d8fb2dcaf8'),
  ('user1', 'contrib', '2e6c12a1c7b82705e65b4c885ed2994d2632ed43196c08dce769dada01e3243e'),
  ('user2', 'contrib', '2e6c12a1c7b82705e65b4c885ed2994d2632ed43196c08dce769dada01e3243e'),
  ('user3', 'contrib', '2e6c12a1c7b82705e65b4c885ed2994d2632ed43196c08dce769dada01e3243e'),
  ('user4', 'contrib', '2e6c12a1c7b82705e65b4c885ed2994d2632ed43196c08dce769dada01e3243e'),
  ('user5', 'contrib', '2e6c12a1c7b82705e65b4c885ed2994d2632ed43196c08dce769dada01e3243e')
on conflict (username) do nothing;

-- ============================================================
-- PHASE 4 : STATISTIQUES DU SITE (optionnel)
-- Table d'evenements pour agreger les stats entre appareils.
-- Le site fonctionne sans : stats conservees en localStorage.
-- Creer cette table pour voir les stats dans le dashboard.
-- ============================================================
create table if not exists public.stat_events (
  id bigint generated always as identity primary key,
  action text not null,
  label text not null default '',
  page text not null default '',
  ville text not null default '',
  prix text not null default '',
  created_at timestamptz not null default now()
);

alter table public.stat_events enable row level security;
create policy "stat_events_select" on public.stat_events for select using (true);
create policy "stat_events_insert" on public.stat_events for insert with check (true);

create index if not exists stat_events_created_idx on public.stat_events (created_at desc);
create index if not exists stat_events_action_idx on public.stat_events (action);
