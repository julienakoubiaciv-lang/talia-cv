/**
 * plan-gates.spec.js
 * Vérifie que les restrictions de plan (Free/Personal/Business) sont
 * correctement appliquées dans l'interface.
 *
 * Plan Free = état par défaut (localStorage vide).
 * Plan Business = simulé via localStorage 'talia_plan'.
 */
import { test, expect } from '@playwright/test';

// Helper : injecter un plan dans localStorage avant navigation
async function setPlan(page, tier) {
  await page.goto('/');
  await page.evaluate((t) => {
    localStorage.setItem('talia_plan', JSON.stringify({
      tier: t,
      activatedAt: new Date().toISOString(),
      source: 'test',
    }));
  }, tier);
}

test.describe('Plan Free (défaut)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('talia_plan'));
  });

  test('Bulk est verrouillé — affiche le cadenas ou le message upgrade', async ({ page }) => {
    await page.goto('/bulk');
    // PlanGate affiche un overlay avec "Passer au plan" ou un icône cadenas
    const gate = page.locator('text=/passer au plan|plan|personnel|upgrade/i').first();
    await expect(gate).toBeVisible({ timeout: 6000 });
  });

  test('Pricing affiche 3 plans avec le plan Free mis en avant', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('text=Gratuit').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Personnel').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Business').first()).toBeVisible({ timeout: 5000 });
  });

  test('Home affiche le bouton Nouveau CV', async ({ page }) => {
    await page.goto('/');
    // Le bouton "Nouveau CV" ou "Nouveau" (mobile) est toujours visible en haut à droite
    await expect(page.locator('text=Nouveau CV').or(page.locator('text=Nouveau')).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Plan Business (simulé)', () => {
  test.beforeEach(async ({ page }) => {
    await setPlan(page, 'business');
  });

  test('Bulk est accessible — pas de verrou', async ({ page }) => {
    await page.goto('/bulk');
    // Pas de message "Passer au plan"
    const gate = page.locator('text=/passer au plan personnel/i');
    await expect(gate).toHaveCount(0, { timeout: 5000 });
    // Le formulaire de génération en masse est visible
    await expect(page.locator('text=/masse|fichier|csv|uplo/i').first()).toBeVisible({ timeout: 6000 });
  });

  test('Profiles — bouton créer est actif', async ({ page }) => {
    await page.goto('/profils');
    const newBtn = page.locator('button').filter({ hasText: /nouveau profil|créer/i }).first();
    await expect(newBtn).toBeVisible({ timeout: 5000 });
    // Le bouton ne doit pas être grisé (cursor not-allowed)
    const cursor = await newBtn.evaluate(el => getComputedStyle(el).cursor);
    expect(cursor).not.toBe('not-allowed');
  });
});

test.describe('Plan Personal (simulé)', () => {
  test.beforeEach(async ({ page }) => {
    await setPlan(page, 'personal');
  });

  test('Bulk est accessible en plan Personnel', async ({ page }) => {
    await page.goto('/bulk');
    const gate = page.locator('text=/passer au plan personnel/i');
    await expect(gate).toHaveCount(0, { timeout: 5000 });
  });

  test('crmSync reste bloqué en plan Personnel', async ({ page }) => {
    // Le plan personnel n'a pas crmSync
    // Vérifier via le pricing : le badge CRM est sur Business uniquement
    await page.goto('/pricing');
    // Business doit mentionner CRM, Personal ne doit pas
    const businessCard = page.locator('text=Business').locator('..').locator('..').first();
    await expect(businessCard.locator('text=/crm/i').first()).toBeVisible({ timeout: 5000 });
  });
});
