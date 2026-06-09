-- ============================================================
-- Migration — Organisations (écoles/entreprises) + parrainage élèves
-- ============================================================
-- Modèle multi-tenant B2B2C :
--   • un individu paie son abo perso (subscriptions) ;
--   • une école/entreprise achète des SIÈGES à un tier et parraine ses élèves ;
--   • l'élève rejoint via un LIEN D'INVITATION → hérite du tier de l'org.
--
-- Principe clé : identité ≠ entitlement. Le tier EFFECTIF d'un user =
--   le meilleur de { abo perso, parrainage org }. L'élève garde son compte
--   et sa progression même si le parrainage s'arrête.
-- ============================================================

-- ── 1. Organisations ────────────────────────────────────────────────────────
create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null default 'school',   -- 'school' | 'company'
  tier        text not null default 'school',   -- forfait parrainé (planConfig)
  seats       int  not null default 0,          -- nb de sièges achetés
  status      text not null default 'active',   -- 'active' | 'suspended'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists organizations_updated_at on organizations;
create trigger organizations_updated_at
  before update on organizations
  for each row execute function update_updated_at();

-- ── 2. Cohortes (promo / groupe d'une org) — optionnel ──────────────────────
create table if not exists cohorts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists cohorts_org_idx on cohorts(org_id);

-- ── 3. Membres (élève ↔ org) ────────────────────────────────────────────────
create table if not exists org_members (
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  cohort_id   uuid references cohorts(id) on delete set null,
  role        text not null default 'member',   -- 'member' | 'manager'
  status      text not null default 'active',   -- 'active' | 'revoked'
  joined_at   timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists org_members_user_idx on org_members(user_id);
create index if not exists org_members_org_idx on org_members(org_id);

-- ── 4. Invitations (le lien d'accès) ────────────────────────────────────────
create table if not exists org_invites (
  token       text primary key,
  org_id      uuid not null references organizations(id) on delete cascade,
  cohort_id   uuid references cohorts(id) on delete set null,
  email       text,                             -- optionnel : restreint à cet email
  max_uses    int  not null default 1000,
  used_count  int  not null default 0,
  expires_at  timestamptz,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
create index if not exists org_invites_org_idx on org_invites(org_id);

-- ── 5. Résolution du tier ───────────────────────────────────────────────────
-- Rang d'un tier (doit refléter planConfig.TIER_RANK)
create or replace function tier_rank(p_tier text)
returns int language sql immutable as $$
  select case p_tier
    when 'business' then 3
    when 'school'   then 2
    when 'personal' then 1
    else 0 end;
$$;

-- Meilleur tier de parrainage actif pour un user (sièges respectés)
create or replace function org_tier_for_user(p_user_id uuid)
returns text language sql stable as $$
  select coalesce(
    (select o.tier
       from org_members m
       join organizations o on o.id = m.org_id
      where m.user_id = p_user_id
        and m.status = 'active'
        and o.status = 'active'
      order by tier_rank(o.tier) desc
      limit 1),
    'free');
$$;

-- Tier EFFECTIF = max(perso, parrainage). security definer pour lire subscriptions.
create or replace function effective_tier(p_user_id uuid)
returns text language plpgsql security definer as $$
declare
  v_personal text;
  v_org      text;
begin
  select coalesce(s.tier, 'free') into v_personal
  from subscriptions s
  where s.user_id = p_user_id::text and s.status in ('active', 'trialing')
  order by s.updated_at desc limit 1;
  v_personal := coalesce(v_personal, 'free');

  v_org := org_tier_for_user(p_user_id);

  return case when tier_rank(v_org) >= tier_rank(v_personal) then v_org else v_personal end;
end;
$$;

-- RPC pratique pour le client : mon tier effectif
create or replace function my_effective_tier()
returns text language sql security definer as $$
  select effective_tier(auth.uid());
$$;
grant execute on function my_effective_tier() to authenticated;

-- ── 6. Rejoindre une org via un lien d'invitation ───────────────────────────
create or replace function redeem_org_invite(p_token text)
returns table(ok boolean, org_id uuid, org_name text, reason text)
language plpgsql security definer as $$
declare
  v_inv   org_invites%rowtype;
  v_org   organizations%rowtype;
  v_uid   uuid := auth.uid();
  v_active int;
begin
  if v_uid is null then
    return query select false, null::uuid, null::text, 'not_authenticated'; return;
  end if;

  select * into v_inv from org_invites where token = p_token;
  if not found then
    return query select false, null::uuid, null::text, 'invalid'; return;
  end if;
  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    return query select false, null::uuid, null::text, 'expired'; return;
  end if;
  if v_inv.used_count >= v_inv.max_uses then
    return query select false, null::uuid, null::text, 'exhausted'; return;
  end if;
  -- email restreint (optionnel)
  if v_inv.email is not null and lower(v_inv.email) <> lower((select email from auth.users where id = v_uid)) then
    return query select false, null::uuid, null::text, 'email_mismatch'; return;
  end if;

  select * into v_org from organizations where id = v_inv.org_id;
  if v_org.status <> 'active' then
    return query select false, null::uuid, null::text, 'org_inactive'; return;
  end if;

  -- Sièges disponibles ? (on ne recompte pas un membre déjà présent)
  select count(*) into v_active from org_members
   where org_id = v_org.id and status = 'active'
     and user_id <> v_uid;
  if v_org.seats > 0 and v_active >= v_org.seats then
    return query select false, null::uuid, null::text, 'no_seats'; return;
  end if;

  insert into org_members (org_id, user_id, cohort_id, role, status)
  values (v_org.id, v_uid, v_inv.cohort_id, 'member', 'active')
  on conflict (org_id, user_id) do update set status = 'active', cohort_id = excluded.cohort_id;

  update org_invites set used_count = used_count + 1 where token = p_token;

  return query select true, v_org.id, v_org.name, 'joined';
end;
$$;
grant execute on function redeem_org_invite(text) to authenticated;

-- ── 7. RLS ──────────────────────────────────────────────────────────────────
alter table organizations enable row level security;
alter table org_members  enable row level security;
alter table org_invites  enable row level security;
alter table cohorts      enable row level security;

-- Helpers : l'utilisateur est-il membre / manager de l'org ?
create or replace function is_org_member(p_org uuid)
returns boolean language sql stable as $$
  select exists (select 1 from org_members m where m.org_id = p_org and m.user_id = auth.uid() and m.status = 'active');
$$;
create or replace function is_org_manager(p_org uuid)
returns boolean language sql stable as $$
  select exists (select 1 from org_members m where m.org_id = p_org and m.user_id = auth.uid() and m.role = 'manager' and m.status = 'active');
$$;
create or replace function is_staff()
returns boolean language sql stable as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'));
$$;

-- organizations : membres lisent leur org ; staff lisent/gèrent tout
drop policy if exists "members_read_org" on organizations;
create policy "members_read_org" on organizations
  for select using (is_org_member(id) or is_staff());
drop policy if exists "staff_manage_orgs" on organizations;
create policy "staff_manage_orgs" on organizations
  for all using (is_staff()) with check (is_staff());

-- org_members : user lit ses lignes ; manager lit son org ; staff lit tout
drop policy if exists "read_own_membership" on org_members;
create policy "read_own_membership" on org_members
  for select using (user_id = auth.uid() or is_org_manager(org_id) or is_staff());
-- (les insertions passent par redeem_org_invite, security definer)
drop policy if exists "staff_manage_members" on org_members;
create policy "staff_manage_members" on org_members
  for all using (is_staff()) with check (is_staff());

-- org_invites : managers de l'org + staff (lecture/gestion). Les élèves NE
-- lisent PAS les invites (la jonction passe par la RPC security definer).
drop policy if exists "managers_manage_invites" on org_invites;
create policy "managers_manage_invites" on org_invites
  for all using (is_org_manager(org_id) or is_staff())
  with check (is_org_manager(org_id) or is_staff());

-- cohorts : membres de l'org + staff
drop policy if exists "members_read_cohorts" on cohorts;
create policy "members_read_cohorts" on cohorts
  for select using (is_org_member(org_id) or is_staff());
drop policy if exists "staff_manage_cohorts" on cohorts;
create policy "staff_manage_cohorts" on cohorts
  for all using (is_staff()) with check (is_staff());

-- ── 8. Reporting école : progression d'une cohorte ──────────────────────────
-- Les managers voient la progression des membres de leur org (via user_progress).
drop policy if exists "managers_read_member_progress" on user_progress;
create policy "managers_read_member_progress" on user_progress
  for select using (
    exists (
      select 1 from org_members m
      where m.user_id = user_progress.user_id
        and is_org_manager(m.org_id)
    )
  );

create or replace view cohort_progress as
select
  m.org_id, m.cohort_id, m.user_id,
  p.email,
  up.xp, up.day_streak, up.updated_at
from org_members m
join profiles p on p.id = m.user_id
left join user_progress up on up.user_id = m.user_id
where m.status = 'active';
grant select on cohort_progress to authenticated;

-- ── 9. Limites de quota pour le tier 'school' ───────────────────────────────
insert into quota_limits (tier, cv_per_month, smart_match_per_month, coach_per_month, multilingual_per_month, photo_per_month)
values ('school', 9999, 200, 60, 0, 0)
on conflict (tier) do update set
  cv_per_month           = excluded.cv_per_month,
  smart_match_per_month  = excluded.smart_match_per_month,
  coach_per_month        = excluded.coach_per_month,
  multilingual_per_month = excluded.multilingual_per_month,
  photo_per_month        = excluded.photo_per_month;

-- ── 10. check_quota : résout le tier via effective_tier (perso OU parrainage) ─
create or replace function check_quota(p_user_id uuid, p_action text)
returns table(allowed boolean, used int, "limit" int, tier text)
language plpgsql security definer as $$
declare
  v_role  text;
  v_tier  text;
  v_limit int;
  v_used  int;
  v_col   text;
begin
  select role into v_role from profiles where id = p_user_id;
  if v_role in ('owner', 'admin') then
    return query select true, 0, 999999, v_role; return;
  end if;

  v_tier := effective_tier(p_user_id);   -- ← max(perso, parrainage org)

  v_col := case p_action
    when 'generate_cv'   then 'cv_per_month'
    when 'smart_match'   then 'smart_match_per_month'
    when 'coach'         then 'coach_per_month'
    when 'multilingual'  then 'multilingual_per_month'
    when 'photo_ai'      then 'photo_per_month'
    else null end;
  if v_col is null then
    return query select false, 0, 0, v_tier; return;
  end if;

  execute format('select %I from quota_limits where tier = $1', v_col)
    into v_limit using v_tier;

  select count(*)::int into v_used
  from usage_events
  where user_id = p_user_id and action = p_action
    and created_at >= date_trunc('month', now());

  return query select (v_used < coalesce(v_limit, 0)), v_used, coalesce(v_limit, 0), v_tier;
end;
$$;
