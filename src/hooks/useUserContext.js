/**
 * useUserContext — contexte utilisateur unifié depuis OCTO (base consolidée).
 *
 * Appelle UNE FOIS la RPC `get_user_context()` (SECURITY DEFINER, lit auth.uid()
 * en interne) et expose :
 *   { kind: 'guest' | 'student' | 'staff', loading,
 *     candidateId, orgId, role, canBulk, maxCv, cvCount, canGenerate }
 *
 * Défaut = 'guest' restrictif tant que la RPC n'a pas répondu (anti-flash de
 * fonctionnalités réservées). Un utilisateur connecté sans profil staff ni
 * fiche candidat liée reste 'guest' (orphelin).
 *
 * NB : c'est la première brique du rewire plans → modèle org OCTO (voir
 * useEntitlements). Les sections « espace étudiant » de Home s'affichent
 * quand kind === 'student'.
 */
import { useEffect, useState } from 'react';
import { supabase, supabaseReady } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth.jsx';

const GUEST = { kind: 'guest' };

export function useUserContext() {
  const { user } = useAuth();
  const [ctx, setCtx] = useState(GUEST);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!supabaseReady || !supabase || !user) {
      setCtx(GUEST);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    supabase
      .rpc('get_user_context')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || !data.kind) {
          console.warn('[useUserContext] get_user_context:', error?.message);
          setCtx(GUEST);
        } else {
          setCtx(data);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user]);

  return {
    loading,
    kind:        ctx.kind || 'guest',
    isStudent:   ctx.kind === 'student',
    isStaff:     ctx.kind === 'staff',
    firstName:   ctx.first_name ?? null,
    candidateId: ctx.candidate_id ?? null,
    orgId:       ctx.org_id ?? null,
    role:        ctx.role ?? null,
    canBulk:     ctx.can_bulk === true,
    maxCv:       ctx.max_cv ?? null,
    cvCount:     ctx.cv_count ?? 0,
    canGenerate: ctx.can_generate !== false,
    raw:         ctx,
  };
}
