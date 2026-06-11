import { describe, it, expect, beforeEach } from 'vitest';
import { DEMO_INVITES, redeemDemoInvite, demoMembership, demoOrgTier, leaveDemoOrg, createDemoInvite } from './demoOrg.js';

describe('demoOrg', () => {
  beforeEach(() => leaveDemoOrg());

  it('expose deux écoles de démo', () => {
    expect(Object.keys(DEMO_INVITES)).toContain('TALIA-PARIS-2026');
    expect(Object.keys(DEMO_INVITES)).toContain('CFA-LYON-DIGITAL');
  });

  it('rejoint une école via un token valide → tier school', () => {
    const res = redeemDemoInvite('TALIA-PARIS-2026');
    expect(res.ok).toBe(true);
    expect(res.org_name).toBe('École Talia Paris');
    expect(demoOrgTier()).toBe('school');
    expect(demoMembership().cohort).toBe('Promo 2026');
  });

  it('token inconnu → échec, pas d\'appartenance', () => {
    const res = redeemDemoInvite('NIMPORTEQUOI');
    expect(res.ok).toBe(false);
    expect(demoMembership()).toBeNull();
  });

  it('leaveDemoOrg réinitialise', () => {
    redeemDemoInvite('CFA-LYON-DIGITAL');
    expect(demoOrgTier()).toBe('school');
    leaveDemoOrg();
    expect(demoMembership()).toBeNull();
  });

  it('un lien généré par un conseiller fait rejoindre son groupe', () => {
    const token = createDemoInvite({ managerId: 'karim', managerName: 'Karim B.' });
    const res = redeemDemoInvite(token);
    expect(res.ok).toBe(true);
    expect(demoMembership().manager).toBe('karim');
    expect(demoOrgTier()).toBe('school');
  });
});
