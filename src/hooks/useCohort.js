/**
 * useCohort — Données du dashboard encadrant (vue conseiller / direction).
 *
 * Démo : cohorte simulée (demoCohort), avec switch de persona.
 * Réel : lit la vue `cohort_progress` (RLS scoppe déjà : un conseiller ne voit
 * que ses élèves, la direction voit tout) et réattribue via org_members.
 */
import { useCallback, useEffect, useState } from 'react';
import { isDemoMode } from '@/lib/demoMode';
import { supabase, supabaseReady } from '@/lib/supabase';
import {
  getVisibleRoster, getViewer, reassignStudent, setPersona as setDemoPersona,
  getPersona, DEMO_CONSEILLERS, DEMO_ORG_NAME,
} from '@/lib/demoCohort';

export function useCohort() {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ loading: true, viewer: null, students: [], conseillers: [], orgName: '' });

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;

    // ── Démo ──────────────────────────────────────────────────────────────
    if (isDemoMode()) {
      const viewer = getViewer();
      setState({
        loading: false, viewer, orgName: DEMO_ORG_NAME,
        students: getVisibleRoster(),
        conseillers: DEMO_CONSEILLERS,
      });
      return () => { alive = false; };
    }

    // ── Réel ──────────────────────────────────────────────────────────────
    (async () => {
      if (!supabaseReady || !supabase) { if (alive) setState((s) => ({ ...s, loading: false })); return; }
      try {
        const { data: rows } = await supabase.from('cohort_progress').select('*');
        const { data: { user } } = await supabase.auth.getUser();
        const { data: me } = await supabase.from('org_members').select('role, org_id').eq('user_id', user?.id).maybeSingle();
        const { data: mgrs } = await supabase.from('org_members').select('user_id').eq('role', 'manager');
        if (!alive) return;
        const role = me?.role === 'admin' ? 'admin' : 'manager';
        setState({
          loading: false,
          viewer: { role, label: role === 'admin' ? 'Direction' : 'Conseiller' },
          orgName: '',
          students: (rows || []).map((r) => ({
            id: r.user_id, name: r.email || r.user_id, email: r.email || '',
            manager: r.manager_id, employability: null,
            xp: r.xp || 0, streak: r.day_streak || 0,
            lastActive: r.updated_at ? new Date(r.updated_at).toLocaleDateString('fr-FR') : '—',
          })),
          conseillers: (mgrs || []).map((m) => ({ id: m.user_id, name: m.user_id })),
        });
      } catch { if (alive) setState((s) => ({ ...s, loading: false })); }
    })();
    return () => { alive = false; };
  }, [tick]);

  const reassign = useCallback(async (studentId, managerId) => {
    if (isDemoMode()) { reassignStudent(studentId, managerId); refresh(); return; }
    if (supabaseReady && supabase) {
      await supabase.from('org_members').update({ manager_id: managerId }).eq('user_id', studentId);
      refresh();
    }
  }, [refresh]);

  const switchPersona = useCallback((p) => { setDemoPersona(p); refresh(); }, [refresh]);

  return { ...state, reassign, refresh, switchPersona, persona: isDemoMode() ? getPersona() : null, isDemo: isDemoMode() };
}
