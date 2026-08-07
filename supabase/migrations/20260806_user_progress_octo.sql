-- ============================================================
-- user_progress — Progression gamifiée persistée (base OCTO)
-- ============================================================
-- ⚠️ Contexte important pour qui reprend ce dépôt.
--
-- Les migrations 20260609_user_progress, 20260610_organizations et
-- 20260611_encadrant décrivent un schéma (org_members, org_invites,
-- subscriptions, quota_limits) qui N'EXISTE PAS dans la base réellement
-- utilisée en production — le projet Supabase « OCTO », base unifiée du CRM
-- et du générateur. Elles n'y ont jamais été appliquées.
--
-- Dans OCTO :
--   • un encadrant est une ligne de `profiles` (role : admin, conseiller,
--     responsable_pedago) ;
--   • un élève est une ligne de `candidates`, reliée au compte via
--     candidates.user_id ;
--   • les promos sont `cohorts` + `cohort_members` ;
--   • les candidatures sont `candidatures`.
--
-- Cette migration-ci est la SEULE de cette série appliquée à OCTO. Elle ajoute
-- la table qui manquait vraiment : progressSync.js écrivait dans
-- `user_progress`, absente, donc chaque synchronisation échouait en silence et
-- la progression ne survivait que dans le localStorage du navigateur. Un élève
-- changeant d'appareil perdait XP, badges et avancement des exercices, et son
-- conseiller ne pouvait structurellement jamais les voir.
--
-- Appliquée le 6 août 2026 sur le projet OCTO (zxiroikfhrwsyzgqflzb).
-- ============================================================

create table if not exists public.user_progress (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  org_id        uuid references public.organizations(id) on delete set null,
  candidate_id  uuid references public.candidates(id) on delete set null,
  data          jsonb       not null default '{}'::jsonb,
  xp            int         not null default 0,
  day_streak    int         not null default 0,
  employability int         not null default 0,
  updated_at    timestamptz not null default now()
);

create index if not exists user_progress_org_idx       on public.user_progress(org_id);
create index if not exists user_progress_candidate_idx on public.user_progress(candidate_id);
create index if not exists user_progress_xp_idx        on public.user_progress(xp desc);

drop trigger if exists user_progress_set_updated_at on public.user_progress;
create trigger user_progress_set_updated_at
  before update on public.user_progress
  for each row execute function public.set_updated_at();

-- org_id et candidate_id sont résolus côté serveur depuis la fiche candidat :
-- le client n'a ni à les connaître ni à pouvoir les choisir.
--
-- Le rattachement d'un compte à sa fiche (candidates.user_id) peut arriver
-- APRÈS les premiers entraînements. Le déclencheur se rejoue donc tant que le
-- périmètre n'est pas résolu — sans quoi l'élève resterait invisible pour son
-- conseiller définitivement — et s'arrête dès qu'il l'est, pour ne pas peser
-- sur des synchronisations fréquentes.
create or replace function public.set_user_progress_scope()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.org_id is null or new.candidate_id is null then
    select c.org_id, c.id into new.org_id, new.candidate_id
      from public.candidates c
     where c.user_id = new.user_id
     limit 1;
  end if;
  return new;
end;
$$;

revoke execute on function public.set_user_progress_scope() from public, anon, authenticated;

drop trigger if exists user_progress_set_scope on public.user_progress;
create trigger user_progress_set_scope
  before insert or update on public.user_progress
  for each row execute function public.set_user_progress_scope();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.user_progress enable row level security;

-- L'élève lit et écrit sa propre progression.
drop policy if exists user_progress_self on public.user_progress;
create policy user_progress_self on public.user_progress
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- L'encadrant la consulte, dans le même périmètre que les fiches candidats
-- (cf. policy candidates_select) : direction et responsable pédago sur toute
-- l'organisation, conseiller sur ses seuls élèves. Lecture uniquement — la
-- progression appartient à l'élève.
drop policy if exists user_progress_staff_select on public.user_progress;
create policy user_progress_staff_select on public.user_progress
  for select
  using (
    org_id = (select public.auth_org_id())
    and (
      (select public.auth_role()) = any (array['admin'::user_role, 'responsable_pedago'::user_role])
      or (
        (select public.auth_role()) = 'conseiller'::user_role
        and exists (
          select 1 from public.candidates c
          where c.id = user_progress.candidate_id
            and c.assigned_to = (select auth.uid())
        )
      )
    )
  );
