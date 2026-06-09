-- ============================================================
-- Migration — Progression joueur persistée (user_progress)
-- ============================================================
-- Stocke toute la progression gamifiée d'un utilisateur côté serveur
-- (XP, série, badges, notes des modules, complétions). Source de vérité
-- multi-appareil ; le client garde un cache localStorage (offline-first).
--
-- Modèle : une ligne par utilisateur. `data` (jsonb) contient l'intégralité
-- des clés de progression ; `xp` et `day_streak` sont dupliqués en colonnes
-- indexées pour les classements / le futur dashboard école.
-- ============================================================

create table if not exists user_progress (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  data        jsonb       not null default '{}'::jsonb,
  xp          int         not null default 0,
  day_streak  int         not null default 0,
  updated_at  timestamptz not null default now()
);

create index if not exists user_progress_xp_idx on user_progress(xp desc);

-- updated_at auto (réutilise la fonction update_updated_at déjà définie)
drop trigger if exists user_progress_updated_at on user_progress;
create trigger user_progress_updated_at
  before update on user_progress
  for each row execute function update_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table user_progress enable row level security;

-- L'utilisateur lit / écrit uniquement sa propre ligne
drop policy if exists "users_rw_own_progress" on user_progress;
create policy "users_rw_own_progress" on user_progress
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Owner / admin (et plus tard formateurs) peuvent lire toutes les lignes
-- → suivi de progression côté école / dashboard.
drop policy if exists "staff_read_all_progress" on user_progress;
create policy "staff_read_all_progress" on user_progress
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );
