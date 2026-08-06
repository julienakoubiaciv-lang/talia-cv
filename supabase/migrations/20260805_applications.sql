-- ============================================================
-- Migration — Suivi léger des candidatures
-- ============================================================
-- Le tableau de bord encadrant ne montrait que de l'engagement (XP, série) :
-- impossible de savoir si un accompagné avait réellement postulé, décroché un
-- entretien ou signé. C'est pourtant ce qu'un coach doit pouvoir démontrer
-- pour vendre sa prestation suivante.
--
-- Volontairement minimal : entreprise, poste, où en est la candidature, dates.
-- Rien du dossier d'admission d'un CFA — cette machinerie reste au CRM.
-- ============================================================

create table if not exists applications (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade,
  student_id  uuid not null references auth.users(id) on delete cascade,
  company     text not null,
  role_title  text,
  status      text not null default 'applied',
  applied_at  date,
  interview_at date,
  notes       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 'applied'    : candidature envoyée
-- 'interview'  : entretien décroché ou programmé
-- 'offer'      : proposition reçue
-- 'signed'     : contrat signé — c'est le placement
-- 'rejected'   : refus
-- 'abandoned'  : abandonnée en cours de route
alter table applications drop constraint if exists applications_status_check;
alter table applications add constraint applications_status_check
  check (status in ('applied', 'interview', 'offer', 'signed', 'rejected', 'abandoned'));

create index if not exists applications_student_idx on applications(student_id);
create index if not exists applications_org_idx on applications(org_id);
create index if not exists applications_status_idx on applications(status);

drop trigger if exists applications_updated_at on applications;
create trigger applications_updated_at
  before update on applications
  for each row execute function update_updated_at();

alter table applications enable row level security;

-- L'accompagné gère ses propres candidatures.
drop policy if exists "student_manage_own_applications" on applications;
create policy "student_manage_own_applications" on applications
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- Son conseiller (ou la direction de son organisation) aussi : en pratique
-- c'est souvent le coach qui saisit après un point d'étape.
drop policy if exists "manager_manage_applications" on applications;
create policy "manager_manage_applications" on applications
  for all using (
    exists (select 1 from org_members m
             where m.user_id = applications.student_id
               and m.status = 'active'
               and (m.manager_id = auth.uid() or is_org_admin(m.org_id)))
    or is_staff()
  )
  with check (
    exists (select 1 from org_members m
             where m.user_id = applications.student_id
               and m.status = 'active'
               and (m.manager_id = auth.uid() or is_org_admin(m.org_id)))
    or is_staff()
  );

-- ── Agrégat par accompagné, pour le tableau de bord ─────────────────────────
-- Évite de rapatrier toutes les candidatures pour afficher un compteur.
create or replace view student_application_stats as
select
  a.student_id,
  count(*)::int                                              as total,
  count(*) filter (where a.status = 'interview')::int        as interviews,
  count(*) filter (where a.status = 'offer')::int            as offers,
  count(*) filter (where a.status = 'signed')::int           as signed,
  max(a.interview_at) filter (where a.interview_at >= current_date) as next_interview
from applications a
group by a.student_id;

alter view student_application_stats set (security_invoker = on);
grant select on student_application_stats to authenticated;
