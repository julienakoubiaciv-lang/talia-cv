-- ============================================================
-- Migration — Suivi de cohorte : promo affichée + statut de sortie
-- ============================================================
-- 1. org_members.outcome : statut de parcours de l'élève, visible et
--    modifiable par son conseiller / la direction de l'école.
-- 2. cohort_progress enrichie avec cohort_id, cohort_name et outcome,
--    pour que le dashboard encadrant puisse filtrer par promo et
--    afficher où en est chaque élève (formation / recherche / placé /
--    diplômé / en poste).
-- ============================================================

-- ── 1. Statut de sortie ──────────────────────────────────────────────────────
alter table org_members add column if not exists outcome text not null default 'in_training';
-- 'in_training'   : en formation, pas encore en recherche active
-- 'job_searching'  : en recherche active d'alternance/emploi
-- 'placed'         : alternance/contrat signé
-- 'graduated'      : diplômé
-- 'employed'       : en poste (après diplomation)
-- 'dropped_out'    : sorti du parcours

alter table org_members drop constraint if exists org_members_outcome_check;
alter table org_members add constraint org_members_outcome_check
  check (outcome in ('in_training', 'job_searching', 'placed', 'graduated', 'employed', 'dropped_out'));

alter table org_members add column if not exists outcome_updated_at timestamptz;

-- Le conseiller/la direction met à jour le statut de SES élèves.
drop policy if exists "manager_update_outcome" on org_members;
create policy "manager_update_outcome" on org_members
  for update using (manager_id = auth.uid() or is_org_admin(org_id) or is_staff())
  with check (manager_id = auth.uid() or is_org_admin(org_id) or is_staff());
-- (remplace/complète admin_update_members ci-dessus : un conseiller peut
--  désormais aussi modifier le statut de sortie de ses propres élèves,
--  pas seulement la direction.)

-- ── 2. La direction de l'école gère ses promos ──────────────────────────────
-- Jusqu'ici seul le staff Altio pouvait créer une promo : l'école était donc
-- dépendante d'une intervention manuelle pour organiser ses groupes.
drop policy if exists "org_admin_manage_cohorts" on cohorts;
create policy "org_admin_manage_cohorts" on cohorts
  for all using (is_org_admin(org_id) or is_org_manager(org_id))
  with check (is_org_admin(org_id) or is_org_manager(org_id));

-- ── 3. cohort_progress : promo + statut de sortie ───────────────────────────
create or replace view cohort_progress as
select
  m.org_id, m.cohort_id, c.name as cohort_name, m.manager_id, m.user_id,
  m.outcome, m.outcome_updated_at,
  p.email,
  up.xp, up.day_streak, up.employability, up.updated_at
from org_members m
join profiles p on p.id = m.user_id
left join cohorts c on c.id = m.cohort_id
left join user_progress up on up.user_id = m.user_id
where m.status = 'active' and m.role = 'member';
grant select on cohort_progress to authenticated;
