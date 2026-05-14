-- ════════════════════════════════════════════════════════════════════
-- TALIA CRM — Schéma Supabase complet
-- À exécuter dans : Supabase → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════════════

-- [PHASE 0] Extension UUID
create extension if not exists "uuid-ossp";

-- ════════ UTILISATEURS (conseillers/admins) ════════
create table if not exists utilisateurs (
  id            uuid primary key default uuid_generate_v4(),
  auth_id       uuid unique,                          -- lié à auth.users
  email         text unique not null,
  nom           text,
  prenom        text,
  role          text not null default 'conseiller'    -- 'admin' | 'conseiller' | 'readonly'
                  check (role in ('admin','conseiller','readonly')),
  campus        text,                                  -- Montpellier | Marseille | Bordeaux | Toulouse | Lille | Lyon
  actif         boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ════════ CANDIDATS ════════
create table if not exists candidats (
  id                  uuid primary key default uuid_generate_v4(),
  conseiller_id       uuid references utilisateurs(id) on delete set null,
  prenom              text,
  nom                 text,
  email               text,
  telephone           text,
  ville               text,
  campus              text,
  formation           text,
  statut              text default 'Soumis'            -- Pipeline kanban
                        check (statut in ('Soumis','En cours','Accepté','Transmis','Refusé','Nouveau','CV envoyé','Entretien','Validé','Signé','En contrat','Diplômé')),
  score_ia            integer,                          -- 0-100
  score_raison        text,                             -- explication IA
  photo               text,                             -- URL ou data:
  linkedin_url        text,
  cv_url              text,                             -- CV Talia généré
  -- [PHASE 0 — RGPD]
  consentement_date   timestamptz,                      -- date de recueil du consentement RGPD
  consentement_ip     text,                             -- IP lors du consentement
  derniere_activite   timestamptz default now(),        -- pour purge 24 mois
  demande_suppression boolean default false,            -- flag "Supprimer mes données"
  suppression_date    timestamptz,                      -- date effective de suppression
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ════════ ENTREPRISES ════════
create table if not exists entreprises (
  id              uuid primary key default uuid_generate_v4(),
  nom             text not null,
  secteur         text,
  ville           text,
  siret           text unique,
  interlocuteur   text,
  telephone       text,
  email           text,
  site_web        text,
  -- Score fiabilité calculé depuis historique
  score_fiabilite integer default 100 check (score_fiabilite between 0 and 100),
  badge_couleur   text default 'green' check (badge_couleur in ('green','amber','red')),
  -- Compteurs pour le score
  nb_rdv_annules  integer default 0,
  nb_no_shows     integer default 0,
  nb_ruptures     integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ════════ ENTRETIENS ════════
create table if not exists entretiens (
  id              uuid primary key default uuid_generate_v4(),
  candidat_id     uuid references candidats(id) on delete cascade,
  entreprise_id   uuid references entreprises(id) on delete set null,
  conseiller_id   uuid references utilisateurs(id) on delete set null,
  datetime        timestamptz not null,
  lieu            text,
  contact         text,
  telephone       text,
  statut          text default 'planifié'
                    check (statut in ('planifié','confirmé','annulé','no_show','passé')),
  notes           text,
  resultat        text,                                 -- retour post-entretien
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ════════ COMMENTAIRES / NOTES DE SUIVI ════════
create table if not exists commentaires (
  id              uuid primary key default uuid_generate_v4(),
  candidat_id     uuid references candidats(id) on delete cascade,
  auteur_id       uuid references utilisateurs(id) on delete set null,
  auteur_nom      text,
  texte           text not null,
  epingle         boolean default false,
  created_at      timestamptz default now()
);

-- ════════ PERFORMANCES (import CSV) ════════
create table if not exists performances (
  id                      uuid primary key default uuid_generate_v4(),
  candidat_id             uuid references candidats(id) on delete cascade,
  etudiant_id             text,                         -- ID externe CSV
  nom                     text,
  prenom                  text,
  cv_envoyes              integer default 0,
  entretiens              integer default 0,
  validations_entreprise  integer default 0,
  contrats_signes         integer default 0,
  rdv_annules             integer default 0,
  no_shows                integer default 0,
  ruptures                integer default 0,
  date_premier_cv         date,
  date_signature_contrat  date,
  date_debut_contrat      date,
  date_rupture_contrat    date,
  -- Calculé
  delai_signature         integer,                      -- jours
  duree_rupture           integer,                      -- jours
  tx_entretien            numeric(5,4),
  tx_validation           numeric(5,4),
  tx_signature            numeric(5,4),
  tx_rupture              numeric(5,4),
  import_date             timestamptz default now(),
  import_batch            text                          -- identifiant du lot d'import
);

-- ════════ LOGS ACCÈS (RGPD) ════════
create table if not exists logs_acces (
  id              uuid primary key default uuid_generate_v4(),
  utilisateur_id  uuid references utilisateurs(id) on delete set null,
  utilisateur_email text,
  candidat_id     uuid references candidats(id) on delete cascade,
  action          text not null,                        -- 'view' | 'edit' | 'delete' | 'export'
  details         jsonb,
  ip_address      text,
  user_agent      text,
  created_at      timestamptz default now()
);

-- ════════ INDEXES ════════
create index if not exists idx_candidats_conseiller    on candidats(conseiller_id);
create index if not exists idx_candidats_campus        on candidats(campus);
create index if not exists idx_candidats_statut        on candidats(statut);
create index if not exists idx_candidats_activite      on candidats(derniere_activite);
create index if not exists idx_entretiens_candidat     on entretiens(candidat_id);
create index if not exists idx_entretiens_datetime     on entretiens(datetime);
create index if not exists idx_commentaires_candidat   on commentaires(candidat_id);
create index if not exists idx_performances_batch      on performances(import_batch);
create index if not exists idx_logs_candidat           on logs_acces(candidat_id);
create index if not exists idx_logs_utilisateur        on logs_acces(utilisateur_id);
create index if not exists idx_logs_date               on logs_acces(created_at);

-- ════════ ROW LEVEL SECURITY (RLS) ════════

alter table utilisateurs  enable row level security;
alter table candidats      enable row level security;
alter table entreprises    enable row level security;
alter table entretiens     enable row level security;
alter table commentaires   enable row level security;
alter table performances   enable row level security;
alter table logs_acces     enable row level security;

-- Fonction helper : role de l'utilisateur connecté
create or replace function get_user_role()
returns text as $$
  select role from utilisateurs where auth_id = auth.uid() limit 1;
$$ language sql security definer;

-- Fonction helper : conseiller_id de l'utilisateur connecté
create or replace function get_conseiller_id()
returns uuid as $$
  select id from utilisateurs where auth_id = auth.uid() limit 1;
$$ language sql security definer;

-- ── RLS utilisateurs ──
create policy "utilisateurs_select" on utilisateurs
  for select using (auth_id = auth.uid() or get_user_role() = 'admin');

create policy "utilisateurs_insert" on utilisateurs
  for insert with check (get_user_role() = 'admin');

create policy "utilisateurs_update" on utilisateurs
  for update using (auth_id = auth.uid() or get_user_role() = 'admin');

-- ── RLS candidats ──
-- Admin voit tout, Conseiller voit les siens, Readonly voit tous en lecture
create policy "candidats_select" on candidats
  for select using (
    get_user_role() in ('admin','readonly')
    or conseiller_id = get_conseiller_id()
  );

create policy "candidats_insert" on candidats
  for insert with check (
    get_user_role() in ('admin','conseiller')
  );

create policy "candidats_update" on candidats
  for update using (
    get_user_role() = 'admin'
    or (get_user_role() = 'conseiller' and conseiller_id = get_conseiller_id())
  );

create policy "candidats_delete" on candidats
  for delete using (get_user_role() = 'admin');

-- ── RLS entretiens ──
create policy "entretiens_select" on entretiens
  for select using (
    get_user_role() in ('admin','readonly')
    or conseiller_id = get_conseiller_id()
  );

create policy "entretiens_write" on entretiens
  for all using (
    get_user_role() = 'admin'
    or (get_user_role() = 'conseiller' and conseiller_id = get_conseiller_id())
  );

-- ── RLS commentaires ──
create policy "commentaires_select" on commentaires
  for select using (
    get_user_role() in ('admin','readonly')
    or auteur_id = get_conseiller_id()
    or exists (select 1 from candidats c where c.id = candidat_id and c.conseiller_id = get_conseiller_id())
  );

create policy "commentaires_write" on commentaires
  for all using (get_user_role() in ('admin','conseiller'));

-- ── RLS entreprises (accessible à tous les authentifiés) ──
create policy "entreprises_select" on entreprises
  for select using (get_user_role() is not null);

create policy "entreprises_write" on entreprises
  for all using (get_user_role() in ('admin','conseiller'));

-- ── RLS performances ──
create policy "performances_select" on performances
  for select using (get_user_role() is not null);

create policy "performances_write" on performances
  for all using (get_user_role() in ('admin','conseiller'));

-- ── RLS logs (admin only) ──
create policy "logs_select" on logs_acces
  for select using (get_user_role() = 'admin');

create policy "logs_insert" on logs_acces
  for insert with check (true);  -- autorisé pour tous les utilisateurs authentifiés

-- ════════ TRIGGERS updated_at ════════
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_candidats_updated_at    before update on candidats    for each row execute function update_updated_at();
create trigger trg_entreprises_updated_at  before update on entreprises  for each row execute function update_updated_at();
create trigger trg_entretiens_updated_at   before update on entretiens   for each row execute function update_updated_at();

-- ════════ PURGE RGPD — candidats inactifs 24 mois ════════
-- À activer via Supabase Edge Function (pg_cron)
-- Décommentez après avoir installé pg_cron dans Extensions

-- select cron.schedule(
--   'purge-rgpd-24mois',
--   '0 2 1 * *',    -- 1er du mois à 2h
--   $$
--     update candidats set
--       email = null, telephone = null, photo = null, linkedin_url = null,
--       cv_url = null, demande_suppression = true, suppression_date = now()
--     where derniere_activite < now() - interval '24 months'
--       and suppression_date is null;
--   $$
-- );
