import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRoster, getVisibleRoster, getViewer, reassignStudent, resetRoster,
  setPersona, DEMO_CONSEILLERS,
} from './demoCohort.js';

beforeEach(() => { resetRoster(); setPersona('direction'); });

describe('demoCohort — visibilité', () => {
  it('la direction voit tous les élèves', () => {
    setPersona('direction');
    expect(getViewer().role).toBe('admin');
    expect(getVisibleRoster().length).toBe(getRoster().length);
  });

  it('un conseiller ne voit que ses élèves', () => {
    setPersona('karim');
    const v = getViewer();
    expect(v.role).toBe('manager');
    const visible = getVisibleRoster();
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.every((s) => s.manager === 'karim')).toBe(true);
  });
});

describe('demoCohort — réattribution', () => {
  it('déplace un élève vers un autre conseiller', () => {
    const before = getRoster().find((s) => s.manager === 'karim');
    reassignStudent(before.id, 'nadia');
    const after = getRoster().find((s) => s.id === before.id);
    expect(after.manager).toBe('nadia');
  });

  it('après réattribution, l\'élève change de vue conseiller', () => {
    const s = getRoster().find((x) => x.manager === 'karim');
    reassignStudent(s.id, 'nadia');
    setPersona('karim');
    expect(getVisibleRoster().some((x) => x.id === s.id)).toBe(false);
    setPersona('nadia');
    expect(getVisibleRoster().some((x) => x.id === s.id)).toBe(true);
  });

  it('ignore un conseiller inconnu', () => {
    const s = getRoster()[0];
    reassignStudent(s.id, 'inconnu');
    expect(getRoster().find((x) => x.id === s.id).manager).toBe(s.manager);
  });

  it('expose les deux conseillers', () => {
    expect(DEMO_CONSEILLERS.map((c) => c.id)).toEqual(['karim', 'nadia']);
  });
});
