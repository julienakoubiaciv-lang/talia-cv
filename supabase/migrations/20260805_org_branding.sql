-- ============================================================
-- Migration — Marque de l'organisation
-- ============================================================
-- Un coach indépendant facture son accompagnement sous son propre nom : il ne
-- peut pas envoyer à ses clients des messages signés d'une autre marque.
-- Trois champs suffisent : un logo, une couleur, et l'identité d'expéditeur
-- des emails de relance.
-- ============================================================

alter table organizations add column if not exists logo_url    text;
alter table organizations add column if not exists brand_color text;
alter table organizations add column if not exists reply_to    text;

-- Couleur au format hexadécimal, pour ne pas injecter n'importe quoi dans le
-- style des emails.
alter table organizations drop constraint if exists organizations_brand_color_check;
alter table organizations add constraint organizations_brand_color_check
  check (brand_color is null or brand_color ~ '^#[0-9A-Fa-f]{6}$');

-- La direction gère sa marque via cette fonction, PAS via une policy UPDATE
-- sur organizations : la RLS agit par ligne, pas par colonne — une policy
-- ouverte laisserait un coach s'attribuer un autre tier, des sièges
-- supplémentaires ou lever une suspension. Ici, seules les trois colonnes de
-- marque sont modifiables.
create or replace function update_org_branding(
  p_org_id uuid, p_logo_url text, p_brand_color text, p_reply_to text
)
returns boolean
language plpgsql security definer as $$
begin
  if not (is_org_admin(p_org_id) or is_staff()) then
    return false;
  end if;
  if p_brand_color is not null and p_brand_color !~ '^#[0-9A-Fa-f]{6}$' then
    return false;
  end if;
  if p_reply_to is not null and p_reply_to <> '' and p_reply_to !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return false;
  end if;

  update organizations
     set logo_url    = nullif(btrim(coalesce(p_logo_url, '')), ''),
         brand_color = nullif(btrim(coalesce(p_brand_color, '')), ''),
         reply_to    = nullif(btrim(coalesce(p_reply_to, '')), '')
   where id = p_org_id;
  return true;
end;
$$;

grant execute on function update_org_branding(uuid, text, text, text) to authenticated;
