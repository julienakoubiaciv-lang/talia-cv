/**
 * useMembership — le visiteur est-il RATTACHÉ à une organisation Altio ?
 *
 * C'est la question qui ouvre la porte du générateur, et elle ne passe
 * volontairement PAS par le rôle. Le rôle ne se lit pas de la même façon des
 * deux côtés : le CRM écrit dans `profiles.role` un vocabulaire métier
 * (`conseiller`, `responsable_pedago`, `relation_entreprise`, `admin`) quand
 * `useRole` d'ici en attend un autre (`owner | admin | user`). Une porte
 * construite là-dessus laisserait dehors un chargé d'admission.
 *
 * Le RATTACHEMENT, lui, a une réponse fiable aujourd'hui :
 *
 *   staff d'école ou coach → une ligne `user_profiles` avec un `org_id`
 *   étudiant rattaché      → une ligne `candidates` portant son `user_id`
 *
 * Les deux lectures se font avec la session de l'utilisateur, et les policies
 * existantes les autorisent déjà sans rien élargir :
 *
 *   user_profiles_select   : org_id = auth_org_id() OR user_id = auth.uid()
 *   candidates_self_select : user_id = auth.uid()
 *
 * Aucune clé de service, aucun contournement de RLS, aucune migration.
 *
 * Retourne { isMember, kind, loading, error, recheck }
 *   kind = 'staff' | 'student' | null
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase, supabaseReady } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth.jsx';

const IDLE = { isMember: false, kind: null, loading: false, error: null };

export function useMembership() {
  const { user } = useAuth();
  const [state, setState] = useState({ ...IDLE, loading: true });
  const [attempt, setAttempt] = useState(0);

  /** Relance la vérification (bouton « Réessayer » après une panne réseau). */
  const recheck = useCallback(() => setAttempt((a) => a + 1), []);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setState({ ...IDLE });
      return;
    }

    // Sans base, le rattachement est INVÉRIFIABLE. La porte reste fermée :
    // une barrière qui s'ouvre quand la vérification tombe n'en est pas une.
    if (!supabaseReady || !supabase) {
      setState({ ...IDLE, error: 'Base indisponible' });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      // `limit(1)` plutôt que `single()` : l'absence de ligne est une réponse
      // valide ici (c'est même le cas qu'on cherche), pas une erreur.
      const [staff, student] = await Promise.all([
        supabase.from('user_profiles').select('org_id').eq('user_id', user.id).limit(1),
        supabase.from('candidates').select('id').eq('user_id', user.id).limit(1),
      ]);
      if (cancelled) return;

      const failure = staff.error || student.error;
      if (failure) {
        setState({ ...IDLE, error: failure.message || 'Vérification impossible' });
        return;
      }

      const isStaff = Boolean(staff.data?.[0]?.org_id);
      const isStudent = (student.data?.length ?? 0) > 0;

      setState({
        isMember: isStaff || isStudent,
        kind: isStaff ? 'staff' : isStudent ? 'student' : null,
        loading: false,
        error: null,
      });
    })();

    return () => { cancelled = true; };
  }, [user, attempt]);

  return { ...state, recheck };
}
