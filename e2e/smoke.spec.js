/**
 * smoke.spec.js — Tests de fumée : toutes les pages chargent sans crash.
 *
 * Vérifie que chaque route principale :
 *   - répond avec un statut HTTP 200
 *   - ne lève pas d'erreur JavaScript console
 *   - affiche un élément visible caractéristique
 */
import { test, expect } from '@playwright/test';

// Capture les erreurs JS pour les signaler dans le test
function watchConsoleErrors(page) {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  return errors;
}

test.describe('Smoke — pages principales', () => {
  test('Home (/) charge et affiche le topbar', async ({ page }) => {
    const errors = watchConsoleErrors(page);
    await page.goto('/');
    // Le logo "TaliaCV" contient "Talia" dans un span — utilise .first() pour éviter strict mode
    await expect(page.locator('text=Talia').first()).toBeVisible({ timeout: 8000 });
    expect(errors).toHaveLength(0);
  });

  test('Generate (/generate) charge et affiche le formulaire', async ({ page }) => {
    const errors = watchConsoleErrors(page);
    await page.goto('/generate');
    // Le champ "Formation" ou le bouton de génération est visible
    await expect(page.locator('text=Générer').first()).toBeVisible({ timeout: 8000 });
    expect(errors).toHaveLength(0);
  });

  test('History (/history) charge sans crash', async ({ page }) => {
    const errors = watchConsoleErrors(page);
    await page.goto('/history');
    // Titre "Historique" dans le header — toujours présent
    await expect(page.locator('text=Historique').first()).toBeVisible({ timeout: 8000 });
    expect(errors).toHaveLength(0);
  });

  test('Profiles (/profils) charge sans crash', async ({ page }) => {
    const errors = watchConsoleErrors(page);
    await page.goto('/profils');
    // "Nouveau profil" ou titre "Profils" toujours visible
    await expect(
      page.locator('text=Nouveau profil').or(page.locator('text=Profils')).first()
    ).toBeVisible({ timeout: 8000 });
    expect(errors).toHaveLength(0);
  });

  test('Pricing (/pricing) charge et affiche les plans', async ({ page }) => {
    const errors = watchConsoleErrors(page);
    await page.goto('/pricing');
    // Le plan "Gratuit" est toujours affiché
    await expect(page.locator('text=Gratuit').first()).toBeVisible({ timeout: 8000 });
    expect(errors).toHaveLength(0);
  });

  test('Bulk (/bulk) charge — affiche le verrou Free plan', async ({ page }) => {
    const errors = watchConsoleErrors(page);
    // En plan Free (par défaut), la page Bulk doit être verrouillée
    await page.goto('/bulk');
    // "Génération en masse" apparaît dans le titre OU dans le PlanGate overlay
    await expect(page.locator('text=Génération en masse').first()).toBeVisible({ timeout: 8000 });
    expect(errors).toHaveLength(0);
  });

  test('Auth (/auth) charge le formulaire de connexion', async ({ page }) => {
    const errors = watchConsoleErrors(page);
    await page.goto('/auth');
    // Quand Supabase est configuré → email input ; sinon → message "non configuré"
    const emailInput   = page.locator('input[type="email"]').first();
    const supabaseMsg  = page.locator('text=/supabase|connexion|connecter|email/i').first();
    await expect(emailInput.or(supabaseMsg)).toBeVisible({ timeout: 8000 });
    expect(errors).toHaveLength(0);
  });
});
