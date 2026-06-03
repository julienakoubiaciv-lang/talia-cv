-- ============================================================
-- Migration V0 — Sécurisation Anthropic + Rôles + Quotas
-- ============================================================
-- À exécuter dans l'éditeur SQL Supabase APRÈS supabase_migration.sql
--
-- Contenu :
--   1. Table profiles (avec rôle owner/admin/user)
--   2. Trigger auto-création profil au signup
--   3. Tables usage_events + quota_limits
--   4. Fonction check_quota() avec bypass owner/admin
--   5. Promotion automatique julienakoubiaciv@gmail.com en owner
-- ============================================================

-- ── 1. Table profiles ──────────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  role          text not null default 'user',  -- 'user' | 'admin' | 'owner'
  display_name  text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists profiles_role_idx on profiles(role);
create index if not exists profiles_email_idx on profiles(email);

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ── 2. Trigger auto-création profil + promotion owner ──────────────────────
-- Liste des emails owner (hardcodés ici pour simplicité)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  owner_emails text[] := ARRAY[
    'julienakoubiaciv@gmail.com'
    -- Ajouter ici d'autres emails owner si besoin
  ];
  user_role text;
begin
  if NEW.email = any(owner_emails) then
    user_role := 'owner';
  else
    user_role := 'user';
  end if;

  insert into profiles (id, email, role)
  values (NEW.id, NEW.email, user_role)
  on conflict (id) do update set
    email = excluded.email,
    role = case
      when profiles.role = 'owner' then 'owner'  -- garde owner si déjà owner
      else excluded.role
    end;
  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Migration des users déjà existants : créer leur profil + promouvoir owner
insert into profiles (id, email, role)
select
  u.id,
  u.email,
  case when u.email = 'julienakoubiaciv@gmail.com' then 'owner' else 'user' end
from auth.users u
on conflict (id) do update set
  role = case
    when profiles.role = 'owner' then 'owner'
    when excluded.role = 'owner' then 'owner'
    else profiles.role
  end,
  email = excluded.email;

-- ── 3. RLS profiles ────────────────────────────────────────────────────────
alter table profiles enable row level security;

drop policy if exists "users_read_own_profile" on profiles;
create policy "users_read_own_profile" on profiles
  for select using (auth.uid() = id);

drop policy if exists "owners_read_all_profiles" on profiles;
create policy "owners_read_all_profiles" on profiles
  for select using (
    exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.role = 'owner')
  );

drop policy if exists "users_update_own_display_name" on profiles;
create policy "users_update_own_display_name" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── 4. Table usage_events ──────────────────────────────────────────────────
create table if not exists usage_events (
  id              bigserial primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  action          text not null,        -- 'generate_cv' | 'smart_match' | 'coach' | 'multilingual' | 'photo_ai'
  model           text,
  input_tokens    int default 0,
  cached_tokens   int default 0,
  output_tokens   int default 0,
  cost_usd        numeric(10,6) default 0,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

create index if not exists usage_events_user_month_idx on usage_events(user_id, created_at desc);
create index if not exists usage_events_action_idx on usage_events(action);

alter table usage_events enable row level security;

drop policy if exists "users_read_own_usage" on usage_events;
create policy "users_read_own_usage" on usage_events
  for select using (auth.uid() = user_id);

drop policy if exists "owners_read_all_usage" on usage_events;
create policy "owners_read_all_usage" on usage_events
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin'))
  );

-- Pas de policy INSERT : seule l'Edge Function (service_role) peut insérer

-- ── 5. Table quota_limits ──────────────────────────────────────────────────
create table if not exists quota_limits (
  tier                    text primary key,
  cv_per_month            int not null,
  smart_match_per_month   int not null,
  coach_per_month         int not null,
  multilingual_per_month  int not null,
  photo_per_month         int not null
);

insert into quota_limits (tier, cv_per_month, smart_match_per_month, coach_per_month, multilingual_per_month, photo_per_month)
values
  ('free',     2,    0,   0,  0,  0),
  ('personal', 50,   30,  4,  0,  0),
  ('business', 9999, 999, 99, 99, 5)
on conflict (tier) do update set
  cv_per_month           = excluded.cv_per_month,
  smart_match_per_month  = excluded.smart_match_per_month,
  coach_per_month        = excluded.coach_per_month,
  multilingual_per_month = excluded.multilingual_per_month,
  photo_per_month        = excluded.photo_per_month;

alter table quota_limits enable row level security;
drop policy if exists "anyone_reads_quotas" on quota_limits;
create policy "anyone_reads_quotas" on quota_limits for select using (true);

-- ── 6. Fonction check_quota ────────────────────────────────────────────────
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
  -- 1. Owner/admin = bypass total
  select role into v_role from profiles where id = p_user_id;
  if v_role in ('owner', 'admin') then
    return query select true, 0, 999999, v_role;
    return;
  end if;

  -- 2. Récupérer le tier depuis subscriptions
  select coalesce(s.tier, 'free') into v_tier
  from subscriptions s
  where s.user_id = p_user_id::text
    and s.status in ('active', 'trialing')
  order by s.updated_at desc
  limit 1;
  v_tier := coalesce(v_tier, 'free');

  -- 3. Mapping action → colonne
  v_col := case p_action
    when 'generate_cv'   then 'cv_per_month'
    when 'smart_match'   then 'smart_match_per_month'
    when 'coach'         then 'coach_per_month'
    when 'multilingual'  then 'multilingual_per_month'
    when 'photo_ai'      then 'photo_per_month'
    else null
  end;

  if v_col is null then
    return query select false, 0, 0, v_tier;
    return;
  end if;

  -- 4. Lookup limite
  execute format('select %I from quota_limits where tier = $1', v_col)
    into v_limit using v_tier;

  -- 5. Compter usage du mois en cours
  select count(*)::int into v_used
  from usage_events
  where user_id = p_user_id
    and action = p_action
    and created_at >= date_trunc('month', now());

  return query select (v_used < v_limit), v_used, v_limit, v_tier;
end;
$$;

-- Permission d'exécution pour les users authentifiés
grant execute on function check_quota(uuid, text) to authenticated;

-- ── 7. Vue helper pour le dashboard admin ──────────────────────────────────
create or replace view admin_user_stats as
select
  p.id,
  p.email,
  p.role,
  p.created_at as signed_up_at,
  coalesce(s.tier, 'free') as tier,
  s.status as subscription_status,
  (select count(*) from cv_history where user_id = p.id::text) as cvs_created,
  (select count(*) from usage_events where user_id = p.id and created_at >= date_trunc('month', now())) as actions_this_month,
  (select coalesce(sum(cost_usd), 0) from usage_events where user_id = p.id) as total_cost_usd
from profiles p
left join subscriptions s on s.user_id = p.id::text;

-- La vue hérite des permissions de profiles (owners voient tout via RLS)
grant select on admin_user_stats to authenticated;

-- ============================================================
-- Vérification post-migration
-- ============================================================
-- Pour vérifier que ton compte est bien owner :
--   select id, email, role from profiles where email = 'julienakoubiaciv@gmail.com';
--
-- Si tu n'es pas encore inscrit, créer ton compte via l'app puis ré-exécuter :
--   update profiles set role = 'owner' where email = 'julienakoubiaciv@gmail.com';
-- ============================================================
