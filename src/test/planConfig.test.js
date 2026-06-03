/**
 * planConfig.test.js
 * Tests unitaires pour src/lib/planConfig.js
 *
 * Couvre : PLANS, getCurrentTier, setPlan, resetPlan,
 *          canDo, canCreateCV, canCreateProfile, canUseTemplate,
 *          remainingCVs, nextPlanLabel
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  PLANS,
  getCurrentTier,
  getCurrentPlan,
  setPlan,
  resetPlan,
  canDo,
  canCreateCV,
  canCreateProfile,
  canUseTemplate,
  remainingCVs,
  nextPlanLabel,
} from '@/lib/planConfig';

// localStorage est vidé avant chaque test (cf. setup.js)

// ── Constantes ────────────────────────────────────────────────────────────────

describe('PLANS', () => {
  it('contient les 3 tiers', () => {
    expect(Object.keys(PLANS)).toEqual(['free', 'personal', 'business']);
  });

  it('free a maxCVs = 2', () => {
    expect(PLANS.free.maxCVs).toBe(2);
  });

  it('personal a maxCVs = Infinity', () => {
    expect(PLANS.personal.maxCVs).toBe(Infinity);
  });

  it('free n\'a pas de bulk', () => {
    expect(PLANS.free.bulkEnabled).toBe(false);
  });

  it('personal a bulk limité à 10 par session', () => {
    expect(PLANS.personal.maxBulkPerSession).toBe(10);
  });

  it('business a tout illimité', () => {
    expect(PLANS.business.maxCVs).toBe(Infinity);
    expect(PLANS.business.maxProfiles).toBe(Infinity);
    expect(PLANS.business.maxBulkPerSession).toBe(Infinity);
  });

  it('business a le CRM sync', () => {
    expect(PLANS.business.crmSync).toBe(true);
  });

  it('free a 2 templates', () => {
    expect(PLANS.free.templateIds).toHaveLength(2);
    expect(PLANS.free.templateIds).toContain('classic');
    expect(PLANS.free.templateIds).toContain('minimal');
  });
});

// ── getCurrentTier / setPlan / resetPlan ───────────────────────────────────────

describe('getCurrentTier', () => {
  it('retourne "free" par défaut', () => {
    expect(getCurrentTier()).toBe('free');
  });

  it('retourne le tier stocké', () => {
    setPlan('personal');
    expect(getCurrentTier()).toBe('personal');
  });

  it('retourne "free" si le JSON est corrompu', () => {
    localStorage.setItem('talia_plan', '{{invalid}}');
    expect(getCurrentTier()).toBe('free');
  });

  it('retourne "free" si le tier stocké est inconnu', () => {
    localStorage.setItem('talia_plan', JSON.stringify({ tier: 'ultra-premium' }));
    expect(getCurrentTier()).toBe('free');
  });
});

describe('setPlan', () => {
  it('stocke le tier et la source', () => {
    setPlan('business', 'stripe');
    const stored = JSON.parse(localStorage.getItem('talia_plan') || '{}');
    expect(stored.tier).toBe('business');
    expect(stored.source).toBe('stripe');
    expect(stored.activatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('ignore un tier inconnu', () => {
    setPlan('diamond');
    expect(getCurrentTier()).toBe('free');
  });
});

describe('resetPlan', () => {
  it('supprime le plan stocké', () => {
    setPlan('business');
    resetPlan();
    expect(getCurrentTier()).toBe('free');
  });
});

describe('getCurrentPlan', () => {
  it('retourne l\'objet plan correspondant', () => {
    setPlan('personal');
    const plan = getCurrentPlan();
    expect(plan.id).toBe('personal');
    expect(plan.label).toBe('Personnel');
  });
});

// ── canDo ─────────────────────────────────────────────────────────────────────

describe('canDo', () => {
  it('free: bulk interdit', () => {
    expect(canDo('bulk')).toBe(false);
  });

  it('personal: bulk autorisé', () => {
    setPlan('personal');
    expect(canDo('bulk')).toBe(true);
  });

  it('business: crmSync autorisé', () => {
    setPlan('business');
    expect(canDo('crmSync')).toBe(true);
  });

  it('personal: crmSync interdit', () => {
    setPlan('personal');
    expect(canDo('crmSync')).toBe(false);
  });

  it('retourne false pour une feature inconnue', () => {
    expect(canDo('teleportation')).toBe(false);
  });
});

// ── canCreateCV ───────────────────────────────────────────────────────────────

describe('canCreateCV', () => {
  it('free: autorisé si count < 2', () => {
    expect(canCreateCV(0)).toBe(true);
    expect(canCreateCV(1)).toBe(true);
  });

  it('free: bloqué si count >= 2', () => {
    expect(canCreateCV(2)).toBe(false);
    expect(canCreateCV(10)).toBe(false);
  });

  it('personal: toujours autorisé', () => {
    setPlan('personal');
    expect(canCreateCV(1000)).toBe(true);
  });

  it('business: toujours autorisé', () => {
    setPlan('business');
    expect(canCreateCV(9999)).toBe(true);
  });
});

// ── canCreateProfile ──────────────────────────────────────────────────────────

describe('canCreateProfile', () => {
  it('free: autorisé si count < 1', () => {
    expect(canCreateProfile(0)).toBe(true);
  });

  it('free: bloqué si count >= 1', () => {
    expect(canCreateProfile(1)).toBe(false);
  });

  it('personal: autorisé jusqu\'à 3', () => {
    setPlan('personal');
    expect(canCreateProfile(2)).toBe(true);
    expect(canCreateProfile(3)).toBe(false);
  });

  it('business: illimité', () => {
    setPlan('business');
    expect(canCreateProfile(999)).toBe(true);
  });
});

// ── canUseTemplate ────────────────────────────────────────────────────────────

describe('canUseTemplate', () => {
  it('free: classic et minimal accessibles', () => {
    expect(canUseTemplate('classic')).toBe(true);
    expect(canUseTemplate('minimal')).toBe(true);
  });

  it('free: compact et impact bloqués', () => {
    expect(canUseTemplate('compact')).toBe(false);
    expect(canUseTemplate('impact')).toBe(false);
  });

  it('personal: tous les templates accessibles', () => {
    setPlan('personal');
    expect(canUseTemplate('compact')).toBe(true);
    expect(canUseTemplate('impact')).toBe(true);
  });

  it('retourne false pour un template inexistant', () => {
    expect(canUseTemplate('holographic')).toBe(false);
  });
});

// ── remainingCVs ──────────────────────────────────────────────────────────────

describe('remainingCVs', () => {
  it('free: 2 - count', () => {
    expect(remainingCVs(0)).toBe(2);
    expect(remainingCVs(1)).toBe(1);
    expect(remainingCVs(2)).toBe(0);
    expect(remainingCVs(7)).toBe(0); // pas de négatif
  });

  it('personal: Infinity', () => {
    setPlan('personal');
    expect(remainingCVs(9999)).toBe(Infinity);
  });
});

// ── nextPlanLabel ─────────────────────────────────────────────────────────────

describe('nextPlanLabel', () => {
  it('free → Personnel', () => {
    expect(nextPlanLabel()).toBe('Personnel');
  });

  it('personal → Business', () => {
    setPlan('personal');
    expect(nextPlanLabel()).toBe('Business');
  });

  it('business → null (déjà au max)', () => {
    setPlan('business');
    expect(nextPlanLabel()).toBeNull();
  });
});
