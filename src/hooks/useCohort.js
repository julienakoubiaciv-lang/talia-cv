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
  getPersona, DEMO_CONSEILLERS, DEMO_ORG_NAME, DEMO_COHORTS,
} from '@/lib/demoCohort';
import { createInvite, nudgeStudent, setOutcome, createCohort } from '@/lib/cohortServer';
import { DEFAULT_OUTCOME } from '@/lib/cohortOutcome';

export function useCohort() {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ loading: true, viewer: null, students: [], conseillers: [], cohorts: [], orgName: '', orgId: null });

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;

    // ── Démo ──────────────────────────────────────────────────────────────
    if (isDemoMode()) {
      const viewer = getViewer();
      setState({
        loading: false, viewer, orgName: DEMO_ORG_NAME, orgId: 'demo-paris',
        students: getVisibleRoster(),
        conseillers: DEMO_CONSEILLERS,
        cohorts: DEMO_COHORTS,
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
        const { data: org } = me?.org_id
          ? await supabase.from('organizations').select('name').eq('id', me.org_id).maybeSingle()
          : { data: null };
        const { data: promos } = me?.org_id
          ? await supabase.from('cohorts').select('id, name').eq('org_id', me.org_id).order('name')
          : { data: [] };
        if (!alive) return;
        const role = me?.role === 'admin' ? 'admin' : 'manager';
        setState({
          loading: false,
          viewer: { role, label: role === 'admin' ? 'Direction' : 'Conseiller' },
          orgName: org?.name || '', orgId: me?.org_id || null,
          students: (rows || []).map((r) => ({
            id: r.user_id, name: r.email || r.user_id, email: r.email || '',
            manager: r.manager_id,
            cohortId: r.cohort_id || null,
            outcome: r.outcome || DEFAULT_OUTCOME,
            employability: typeof r.employability === 'number' ? r.employability : null,
            xp: r.xp || 0, streak: r.day_streak || 0,
            lastActive: r.updated_at ? new Date(r.updated_at).toLocaleDateString('fr-FR') : '—',
          })),
          conseillers: (mgrs || []).map((m) => ({ id: m.user_id, name: m.user_id })),
          cohorts: promos || [],
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

  const makeInvite = useCallback(async (managerId, managerName, cohortId = null) => {
    const res = await createInvite({ orgId: state.orgId, managerId, managerName, cohortId, orgName: state.orgName });
    return res?.token || null;
  }, [state.orgId, state.orgName]);

  const nudge = useCallback((student) => nudgeStudent({ studentId: student?.id, orgId: state.orgId }), [state.orgId]);

  const updateOutcome = useCallback(async (studentId, outcome) => {
    await setOutcome({ studentId, orgId: state.orgId, outcome });
    refresh();
  }, [state.orgId, refresh]);

  const addCohort = useCallback(async (name) => {
    const c = await createCohort({ orgId: state.orgId, name });
    if (c) refresh();
    return c;
  }, [state.orgId, refresh]);

  return {
    ...state, reassign, refresh, switchPersona, makeInvite, nudge, updateOutcome, addCohort,
    persona: isDemoMode() ? getPersona() : null, isDemo: isDemoMode(),
  };
}
