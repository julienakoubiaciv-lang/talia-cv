-- ============================================================
-- Migration — Gestion des organisations depuis /admin
-- ============================================================
-- Jusqu'ici créer une école, ajuster ses sièges ou la suspendre passait par du
-- SQL manuel. Cette vue donne au staff Altio le comptage dont il a besoin
-- (sièges consommés, promos, encadrants) pour opérer les clients écoles.
-- ============================================================

create or replace view admin_org_stats as
select
  o.id, o.name, o.type, o.tier, o.seats, o.status, o.created_at,
  (select count(*) from org_members m
    where m.org_id = o.id and m.status = 'active' and m.role = 'member')::int as seats_used,
  (select count(*) from org_members m
    where m.org_id = o.id and m.status = 'active' and m.role in ('manager', 'admin'))::int as staff_count,
  (select count(*) from cohorts c where c.org_id = o.id)::int as cohort_count,
  (select count(*) from org_members m
    where m.org_id = o.id and m.status = 'active' and m.role = 'member'
      and m.outcome in ('placed', 'graduated', 'employed'))::int as placed_count
from organizations o;

-- La vue hérite de la RLS d'organizations (membres + staff) : un directeur
-- d'école n'y voit que sa propre organisation, le staff Altio voit tout.
alter view admin_org_stats set (security_invoker = on);
grant select on admin_org_stats to authenticated;
