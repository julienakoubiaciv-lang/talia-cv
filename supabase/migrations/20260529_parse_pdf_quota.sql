-- ============================================================
-- Migration — Quota pour l'action 'parse_pdf' (import CV PDF via IA)
-- ============================================================

-- ── 1. Colonne quota import PDF ────────────────────────────────
alter table quota_limits
  add column if not exists parse_pdf_per_month int not null default 0;

update quota_limits set parse_pdf_per_month = case tier
  when 'free'     then 5
  when 'personal' then 100
  when 'business' then 9999
  else parse_pdf_per_month
end;

-- ── 2. check_quota : prise en charge de 'parse_pdf' ────────────
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
    return query select true, 0, 999999, v_role;
    return;
  end if;

  select coalesce(s.tier, 'free') into v_tier
  from subscriptions s
  where s.user_id = p_user_id::text
    and s.status in ('active', 'trialing')
  order by s.updated_at desc
  limit 1;
  v_tier := coalesce(v_tier, 'free');

  v_col := case p_action
    when 'generate_cv'   then 'cv_per_month'
    when 'smart_match'   then 'smart_match_per_month'
    when 'coach'         then 'coach_per_month'
    when 'multilingual'  then 'multilingual_per_month'
    when 'photo_ai'      then 'photo_per_month'
    when 'parse_pdf'     then 'parse_pdf_per_month'
    else null
  end;

  if v_col is null then
    return query select false, 0, 0, v_tier;
    return;
  end if;

  execute format('select %I from quota_limits where tier = $1', v_col)
    into v_limit using v_tier;

  select count(*)::int into v_used
  from usage_events
  where user_id  = p_user_id
    and action   = p_action
    and created_at >= date_trunc('month', now());

  return query select (v_used < v_limit), v_used, v_limit, v_tier;
end;
$$;

-- ── 3. Re-application des réglages de sécurité (perdus au replace) ──
alter function public.check_quota(uuid, text) set search_path = public, pg_temp;
revoke execute on function public.check_quota(uuid, text) from public, anon, authenticated;
grant  execute on function public.check_quota(uuid, text) to service_role;
