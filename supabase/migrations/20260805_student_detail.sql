-- ============================================================
-- Migration — Fiche accompagné : progression réelle et CV
-- ============================================================
-- La fiche élève affichait un « bilan par pilier » FABRIQUÉ : les scores
-- étaient dérivés du score global par une fonction de hachage, donc jolis
-- mais faux. La vraie progression (modules d'entretien, métiers validés,
-- notes aux tests, badges) existe pourtant déjà dans user_progress.data —
-- elle n'était simplement jamais exposée à l'encadrant.
--
-- 1. cohort_progress transporte désormais le blob de progression.
-- 2. student_cv_stats donne le nombre de CV et la date du dernier, SANS
--    exposer leur contenu : un conseiller n'a pas à lire le CV pour savoir
--    si son accompagné en a produit un.
-- ============================================================

-- ── 1. Progression détaillée dans la vue encadrant ──────────────────────────
create or replace view cohort_progress as
select
  m.org_id, m.cohort_id, c.name as cohort_name, m.manager_id, m.user_id,
  m.outcome, m.outcome_updated_at,
  p.email,
  up.xp, up.day_streak, up.employability, up.updated_at,
  up.data as progress
from org_members m
join profiles p on p.id = m.user_id
left join cohorts c on c.id = m.cohort_id
left join user_progress up on up.user_id = m.user_id
where m.status = 'active' and m.role = 'member';
grant select on cohort_progress to authenticated;

-- La vue s'appuie sur user_progress, dont la RLS n'ouvrait la lecture qu'au
-- staff et aux encadrants (policy managers_read_member_progress, migration
-- 20260610) : le périmètre de lecture est donc inchangé.

-- ── 2. Compteur de CV, sans le contenu ──────────────────────────────────────
-- Vue en SECURITY DEFINER (défaut) : elle contourne la RLS de cv_history pour
-- compter, mais filtre elle-même sur l'appelant. C'est volontaire — ouvrir la
-- RLS de cv_history donnerait au conseiller l'accès aux lignes entières, donc
-- au contenu des CV, alors qu'il n'a besoin que de savoir s'il y en a.
create or replace view student_cv_stats as
select
  h.user_id::uuid   as student_id,
  count(*)::int     as cv_count,
  max(h.created_at) as last_cv_at
from cv_history h
join org_members m on m.user_id = h.user_id::uuid and m.status = 'active'
where h.user_id is not null
  and (
    h.user_id::uuid = auth.uid()      -- son propre compteur
    or m.manager_id = auth.uid()      -- son conseiller
    or is_org_admin(m.org_id)         -- la direction de son organisation
    or is_staff()
  )
group by h.user_id;

grant select on student_cv_stats to authenticated;
