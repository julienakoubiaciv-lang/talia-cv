-- ============================================================
-- Migration Supabase — TaliaCV
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- ── 1. Table historique des CVs ─────────────────────────────
create table if not exists cv_history (
  id          text primary key,          -- timestamp ms en string
  device_id   text not null,             -- UUID appareil (sans auth)
  name        text,
  date        text,                      -- format JJ/MM/AAAA HH:MM
  html        text,
  data        jsonb,
  formation   text,
  bulk_id     text,
  bulk_label  text,
  favorite    boolean default false,
  photo_url    text,                      -- URL Supabase Storage (nullable)
  logo_url     text,                      -- URL Supabase Storage (nullable)
  profile_id   text,                      -- ID du profil personnalité utilisé (nullable)
  profile_name text,                      -- Nom du profil (dénormalisé pour affichage rapide)
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Index pour accélérer les requêtes par device
create index if not exists cv_history_device_idx on cv_history(device_id);

-- Mise à jour automatique de updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cv_history_updated_at on cv_history;
create trigger cv_history_updated_at
  before update on cv_history
  for each row execute function update_updated_at();

-- ── 2. RLS (Row Level Security) ─────────────────────────────
-- Chaque device ne voit et ne modifie que ses propres CVs.
alter table cv_history enable row level security;

drop policy if exists "device owns its cvs" on cv_history;
create policy "device owns its cvs" on cv_history
  using (device_id = current_setting('request.headers', true)::jsonb->>'x-device-id')
  with check (device_id = current_setting('request.headers', true)::jsonb->>'x-device-id');

-- ── 3. Bucket Storage pour photos et logos ──────────────────
-- À créer manuellement dans Storage → New Bucket si pas déjà fait :
--   Nom : cv-media
--   Public : NON (accès via URLs signées)

-- Politiques Storage — fichiers appartenant au device_id dans le chemin
insert into storage.buckets (id, name, public)
values ('cv-media', 'cv-media', false)
on conflict (id) do nothing;

drop policy if exists "device upload media" on storage.objects;
create policy "device upload media" on storage.objects
  for insert with check (
    bucket_id = 'cv-media'
    and (storage.foldername(name))[1] = (current_setting('request.headers', true)::jsonb->>'x-device-id')
  );

drop policy if exists "device read media" on storage.objects;
create policy "device read media" on storage.objects
  for select using (
    bucket_id = 'cv-media'
    and (storage.foldername(name))[1] = (current_setting('request.headers', true)::jsonb->>'x-device-id')
  );

drop policy if exists "device delete media" on storage.objects;
create policy "device delete media" on storage.objects
  for delete using (
    bucket_id = 'cv-media'
    and (storage.foldername(name))[1] = (current_setting('request.headers', true)::jsonb->>'x-device-id')
  );
