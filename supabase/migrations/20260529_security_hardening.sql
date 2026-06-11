-- ============================================================
-- Migration — Durcissement sécurité (audit Supabase advisors)
-- ============================================================

-- ── Vue admin : respecter le RLS de l'appelant ─────────────────
-- Sans ceci, la vue SECURITY DEFINER + grant authenticated laissait
-- n'importe quel utilisateur connecté lire emails/coûts de tous.
alter view admin_user_stats set (security_invoker = on);

-- Policies owner read-all pour que la vue admin reste fonctionnelle
-- sous la sémantique security_invoker.
drop policy if exists "owners_read_all_subscriptions" on subscriptions;
create policy "owners_read_all_subscriptions" on subscriptions
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('owner','admin'))
  );

drop policy if exists "owners_read_all_cvs" on cv_history;
create policy "owners_read_all_cvs" on cv_history
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('owner','admin'))
  );

-- ── search_path figé sur les fonctions ─────────────────────────
alter function public.update_updated_at()     set search_path = public, pg_temp;
alter function public.handle_new_user()       set search_path = public, pg_temp;
alter function public.check_quota(uuid, text) set search_path = public, pg_temp;

-- ── Moindre privilège sur les fonctions SECURITY DEFINER ───────
-- check_quota n'est appelée que par l'edge function (service_role).
revoke execute on function public.check_quota(uuid, text) from public, anon, authenticated;
grant  execute on function public.check_quota(uuid, text) to service_role;

-- handle_new_user est une fonction trigger, jamais appelée via l'API REST.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
