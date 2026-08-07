/**
 * useCohort — Données du dashboard encadrant (vue conseiller / direction).
 *
 * Démo : cohorte simulée (demoCohort), avec switch de persona.
 *
 * Réel : lit la base OCTO, où le modèle est le suivant :
 *   • un encadrant est une ligne de `profiles` (role : admin, conseiller,
 *     responsable_pedago) ;
 *   • un élève est une ligne de `candidates` (assigned_to = son conseiller) ;
 *   • les promos sont `cohorts` + `cohort_members` ;
 *   • la progression gamifiée est `user_progress`.
 *
 * La RLS d'OCTO scope déjà la lecture : un conseiller ne reçoit que ses élèves,
 * la direction et le responsable pédago toute l'organisation. On ne refiltre
 * donc pas côté client — ce serait une sécurité de façade.
 */
import { useCallback, useEffect, useState } from 'react';
import { isDemoMode } from '@/lib/demoMode';
import { supabase, supabaseReady } from '@/lib/supabase';
import {
  getVisibleRoster, getViewer, reassignStudent, setPersona as setDemoPersona,
  getPersona, DEMO_CONSEILLERS, DEMO_ORG_NAME, DEMO_COHORTS,
} from '@/lib/demoCohort';
import { createInvite, nudgeStudent, setOutcome, createCohort } from '@/lib/cohortServer';
import { outcomeFromCandidate } from '@/lib/cohortOutcome';

/** Rôles de `profiles` qui voient toute l'organisation. */
const ROLES_DIRECTION = ['admin', 'super_admin', 'responsable_pedago'];

const fullName = (c) => [c.first_name, c.last_name].filter(Boolean).join(' ').trim();

/** « Aujourd'hui », « hier », « il y a N j » — à partir d'une date ISO. */
function lastActiveLabel(iso) {
  if (!iso) return 'jamais';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  return `il y a ${days} j`;
}

export function useCohort() {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({
    loading: true, viewer: null, students: [], conseillers: [], cohorts: [],
    orgName: '', orgId: null,
  });

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;

    // ── Démo ──────────────────────────────────────────────────────────────
    if (isDemoMode()) {
      const viewer = getViewer();
      setState({
        loading: false, viewer, orgName: DEMO_ORG_NAME, orgId: 'demo-paris',
        // En démo, la fiche élève et le compte sont confondus : on aligne
        // userId sur id pour que les lectures par compte (CV) fonctionnent.
        students: getVisibleRoster().map((st) => ({ ...st, userId: st.id })),
        conseillers: DEMO_CONSEILLERS,
        cohorts: DEMO_COHORTS,
      });
      return () => { alive = false; };
    }

    // ── Réel (OCTO) ───────────────────────────────────────────────────────
    (async () => {
      if (!supabaseReady || !supabase) {
        if (alive) setState((s) => ({ ...s, loading: false }));
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (alive) setState((s) => ({ ...s, loading: false })); return; }

        // Qui regarde : un encadrant est une ligne de `profiles`.
        const { data: me } = await supabase
          .from('profiles').select('id, org_id, role, full_name')
          .eq('id', user.id).maybeSingle();
        if (!alive) return;
        if (!me) {
          // Un élève (candidates) n'a pas d'espace encadrant.
          setState((s) => ({ ...s, loading: false, viewer: null, students: [] }));
          return;
        }

        const isDirection = ROLES_DIRECTION.includes(me.role);

        const [candRes, orgRes, promosRes, staffRes] = await Promise.all([
          supabase.from('candidates')
            .select('id, user_id, first_name, last_name, email, assigned_to, pipeline_status, statut_admission, statut_entreprise, score_employability, last_activity_at, cv_saved_at')
            .order('last_activity_at', { ascending: false, nullsFirst: false }),
          supabase.from('organizations').select('name').eq('id', me.org_id).maybeSingle(),
          supabase.from('cohorts').select('id, name, start_date, end_date, status').eq('org_id', me.org_id).order('start_date', { ascending: false, nullsFirst: false }),
          supabase.from('profiles').select('id, full_name, role').eq('org_id', me.org_id),
        ]);
        if (!alive) return;

        const candidates = candRes.data || [];

        // Promo de chaque élève, et progression gamifiée : deux lectures
        // séparées plutôt qu'une jointure, la RLS s'appliquant table par table.
        const candIds = candidates.map((c) => c.id);
        const userIds = candidates.map((c) => c.user_id).filter(Boolean);

        const [membersRes, progressRes] = await Promise.all([
          candIds.length
            ? supabase.from('cohort_members').select('candidate_id, cohort_id, risk_level, attendance_rate, jury_decision').in('candidate_id', candIds)
            : Promise.resolve({ data: [] }),
          userIds.length
            ? supabase.from('user_progress').select('user_id, xp, day_streak, employability, data, updated_at').in('user_id', userIds)
            : Promise.resolve({ data: [] }),
        ]);
        if (!alive) return;

        const memberOf = new Map((membersRes.data || []).map((m) => [m.candidate_id, m]));
        const progressOf = new Map((progressRes.data || []).map((p) => [p.user_id, p]));

        setState({
          loading: false,
          viewer: {
            id: me.id,
            role: isDirection ? 'admin' : 'manager',
            label: isDirection ? 'Direction' : 'Conseiller',
          },
          orgName: orgRes.data?.name || '',
          orgId: me.org_id || null,
          students: candidates.map((c) => {
            const m = memberOf.get(c.id) || {};
            const p = c.user_id ? progressOf.get(c.user_id) : null;
            // L'employabilité calculée par le générateur fait foi :
            // candidates.score_employability n'est alimenté par rien aujourd'hui.
            const employability = typeof p?.employability === 'number'
              ? p.employability
              : (typeof c.score_employability === 'number' ? c.score_employability : null);
            return {
              id: c.id,
              userId: c.user_id || null,
              name: fullName(c) || c.email || c.id,
              email: c.email || '',
              manager: c.assigned_to || null,
              cohortId: m.cohort_id || null,
              riskLevel: m.risk_level || null,
              outcome: outcomeFromCandidate(c, m),
              employability,
              xp: p?.xp || 0,
              streak: p?.day_streak || 0,
              progress: p?.data || null,
              hasCv: !!c.cv_saved_at,
              lastActive: lastActiveLabel(c.last_activity_at),
            };
          }),
          conseillers: (staffRes.data || [])
            .filter((s) => s.role === 'conseiller' || ROLES_DIRECTION.includes(s.role))
            .map((s) => ({ id: s.id, name: s.full_name || s.id })),
          cohorts: promosRes.data || [],
        });
      } catch {
        if (alive) setState((s) => ({ ...s, loading: false }));
      }
    })();
    return () => { alive = false; };
  }, [tick]);

  const reassign = useCallback(async (studentId, managerId) => {
    if (isDemoMode()) { reassignStudent(studentId, managerId); refresh(); return; }
    if (supabaseReady && supabase) {
      await supabase.from('candidates').update({ assigned_to: managerId }).eq('id', studentId);
      refresh();
    }
  }, [refresh]);

  const switchPersona = useCallback((p) => { setDemoPersona(p); refresh(); }, [refresh]);

  const makeInvite = useCallback(async (managerId, managerName, cohortId = null) => {
    const res = await createInvite({ orgId: state.orgId, managerId, managerName, cohortId, orgName: state.orgName });
    return res?.token || null;
  }, [state.orgId, state.orgName]);

  const nudge = useCallback((student) => nudgeStudent({
    studentId: student?.id, userId: student?.userId, orgId: state.orgId,
  }), [state.orgId]);

  const updateOutcome = useCallback(async (studentId, outcome) => {
    const res = await setOutcome({ studentId, orgId: state.orgId, outcome });
    if (res?.ok) refresh();
    return res;
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
