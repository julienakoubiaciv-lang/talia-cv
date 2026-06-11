-- ============================================================
-- Migration — Espace conseiller : bilan réel + relances
-- ============================================================
-- 1. Snapshot d'employabilité dans user_progress (lisible par l'encadrant).
-- 2. Table student_nudges : trace des relances d'un conseiller vers un élève
--    (un job / Edge Function enverra l'email/notif).
-- 3. Vue cohort_progress enrichie (employability).
-- ============================================================

-- ── 1. Score d'employabilité poussé par le client ───────────────────────────
alter table user_progress add column if not exists employability int not null default 0;

-- ── 2. Relances (conseiller → élève) ────────────────────────────────────────
create table if not exists student_nudges (
  id          bigserial primary key,
  org_id      uuid references organizations(id) on delete cascade,
  student_id  uuid not null references auth.users(id) on delete cascade,
  manager_id  uuid references auth.users(id) on delete set null,
  channel     text not null default 'email',   -- 'email' | 'push'
  message     text,
  status      text not null default 'queued',  -- 'queued' | 'sent' | 'failed'
  created_at  timestamptz not null default now()
);
create index if not exists student_nudges_student_idx on student_nudges(student_id);
create index if not exists student_nudges_org_idx on student_nudges(org_id);

alter table student_nudges enable row level security;

-- L'encadrant relance un de SES élèves (manager_id = lui) ou la direction de l'org.
drop policy if exists "manager_insert_nudge" on student_nudges;
create policy "manager_insert_nudge" on student_nudges
  for insert with check (
    manager_id = auth.uid()
    and (
      exists (select 1 from org_members m where m.user_id = student_nudges.student_id and m.org_id = student_nudges.org_id
                and (m.manager_id = auth.uid() or is_org_admin(m.org_id)))
      or is_staff()
    )
  );

drop policy if exists "manager_read_nudge" on student_nudges;
create policy "manager_read_nudge" on student_nudges
  for select using (manager_id = auth.uid() or is_staff()
    or exists (select 1 from org_members m where m.user_id = student_nudges.student_id and is_org_admin(m.org_id)));

-- ── 3. Vue cohort_progress + employability ──────────────────────────────────
create or replace view cohort_progress as
select
  m.org_id, m.cohort_id, m.manager_id, m.user_id,
  p.email,
  up.xp, up.day_streak, up.employability, up.updated_at
from org_members m
join profiles p on p.id = m.user_id
left join user_progress up on up.user_id = m.user_id
where m.status = 'active' and m.role = 'member';
grant select on cohort_progress to authenticated;
