/**
 * useOrgCohorts — Promos de l'organisation encadrée par l'utilisateur.
 *
 * Version légère de useCohort, pour les écrans qui ont juste besoin de la
 * liste des promos (atelier CV en série) sans charger toute la cohorte.
 * Renvoie une liste vide pour un élève : seuls les encadrants ont des promos.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { isDemoMode } from '@/lib/demoMode';
import { isDemoEncadrant, DEMO_COHORTS } from '@/lib/demoCohort';
import { supabase, supabaseReady } from '@/lib/supabase';

export function useOrgCohorts() {
  const { user } = useAuth();
  const [cohorts, setCohorts] = useState([]);

  useEffect(() => {
    if (isDemoMode()) { setCohorts(isDemoEncadrant() ? DEMO_COHORTS : []); return; }
    if (!supabaseReady || !supabase || !user) { setCohorts([]); return; }
    let alive = true;
    (async () => {
      const { data: me } = await supabase.from('org_members')
        .select('org_id').eq('user_id', user.id).in('role', ['manager', 'admin']).maybeSingle();
      if (!alive || !me?.org_id) { if (alive) setCohorts([]); return; }
      const { data } = await supabase.from('cohorts')
        .select('id, name').eq('org_id', me.org_id).order('name');
      if (alive) setCohorts(data || []);
    })().catch(() => { if (alive) setCohorts([]); });
    return () => { alive = false; };
  }, [user]);

  return cohorts;
}
