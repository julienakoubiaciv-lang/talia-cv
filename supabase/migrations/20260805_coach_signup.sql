-- ============================================================
-- Migration — Inscription autonome d'un coach indépendant
-- ============================================================
-- Jusqu'ici, créer une organisation passait par du SQL manuel : aucun coach
-- ne pouvait démarrer sans intervention de l'équipe Altio, ce qui interdit
-- toute vente en self-service.
--
-- create_coach_org() crée l'espace du coach et l'y inscrit comme direction,
-- en une transaction. Volontairement limité au type 'cowork' : une école
-- reste créée par le staff, avec son contrat et ses sièges négociés.
-- ============================================================

-- Traçabilité : qui a créé l'espace (support + garde-fou anti-abus ci-dessous).
alter table organizations add column if not exists created_by uuid references auth.users(id) on delete set null;
create index if not exists organizations_created_by_idx on organizations(created_by);

-- Sièges offerts à l'essai avant abonnement. Un coach indépendant démarre
-- avec quelques accompagnés ; le paiement (Stripe) relèvera ce plafond.
create or replace function create_coach_org(p_name text)
returns table(ok boolean, org_id uuid, reason text)
language plpgsql security definer as $$
declare
  v_uid   uuid := auth.uid();
  v_name  text := nullif(btrim(p_name), '');
  v_org   uuid;
  v_count int;
begin
  if v_uid is null then
    return query select false, null::uuid, 'not_authenticated'; return;
  end if;
  if v_name is null then
    return query select false, null::uuid, 'name_required'; return;
  end if;
  if length(v_name) > 80 then
    return query select false, null::uuid, 'name_too_long'; return;
  end if;

  -- Un coach ne gère qu'un seul espace : s'il en a déjà un, on le lui renvoie
  -- plutôt que d'en créer un doublon à chaque passage sur le formulaire.
  select m.org_id into v_org
  from org_members m
  join organizations o on o.id = m.org_id
  where m.user_id = v_uid and m.role = 'admin' and m.status = 'active'
    and o.type = 'cowork'
  limit 1;
  if v_org is not null then
    return query select true, v_org, 'already_exists'; return;
  end if;

  -- Garde-fou anti-abus : pas plus de 3 espaces créés par compte.
  select count(*) into v_count from organizations o
   where o.created_by = v_uid;
  if v_count >= 3 then
    return query select false, null::uuid, 'limit_reached'; return;
  end if;

  insert into organizations (name, type, tier, seats, status, created_by)
  values (v_name, 'cowork', 'cowork', 5, 'active', v_uid)
  returning id into v_org;

  -- Le créateur est la direction de son espace ; un 'admin' ne consomme pas
  -- de siège (voir redeem_org_invite), les 5 sièges restent pour ses accompagnés.
  insert into org_members (org_id, user_id, manager_id, role, status)
  values (v_org, v_uid, v_uid, 'admin', 'active');

  return query select true, v_org, 'created';
end;
$$;

grant execute on function create_coach_org(text) to authenticated;
