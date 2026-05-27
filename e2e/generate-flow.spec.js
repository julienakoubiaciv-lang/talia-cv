/**
 * generate-flow.spec.js
 * Flow complet : Generate (mode démo) → redirige vers Editor
 *
 * Mode démo = pas de clé API → génération locale avec données fictives.
 * Ce test NE requiert PAS de clé Anthropic réelle.
 *
 * Prérequis pour déclencher la génération :
 *   1. Sélectionner une formation (select)
 *   2. Saisir du texte CV (≥ 20 caractères dans le textarea)
 *   3. Cliquer le bouton "Tester sans clé (données fictives)"
 */
import { test, expect } from '@playwright/test';

const MOCK_CV_TEXT = `
Jean Dupont — jean.dupont@email.com
Développeur Web Junior — 3 ans d'expérience
Compétences : JavaScript, React, Node.js, HTML, CSS
Expérience : Agence Digital Plus (2021-2024) — développement front-end
Formation : BTS SIO option SLAM
Langues : Français (natif), Anglais (B2)
`.trim();

test.describe('Generate → Editor (mode démo)', () => {
  test.beforeEach(async ({ page }) => {
    // S'assure qu'aucune clé API n'est stockée (mode démo)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('talia_api_key');
      localStorage.removeItem('talia_plan');
    });
  });

  test('le formulaire génère en mode démo et redirige vers /editor', async ({ page }) => {
    await page.goto('/generate');

    // 1. Sélectionner une formation via le <select>
    await page.selectOption('select', { value: 'bachelor-marketing' });
    await page.waitForTimeout(200);

    // 2. Saisir le texte du CV dans le textarea
    const cvTextarea = page.locator('textarea').filter({
      hasText: '',
    }).first();
    // Chercher le textarea par placeholder
    const cvArea = page.locator('textarea[placeholder*="CV"]').first();
    await cvArea.fill(MOCK_CV_TEXT);

    // 3. Le bouton de génération doit mentionner "Tester" (mode sans clé)
    const genBtn = page.locator('button').filter({ hasText: /tester|générer/i }).last();
    await expect(genBtn).toBeVisible({ timeout: 5000 });
    await genBtn.click();

    // 4. Attendre la redirection vers /editor (génération démo rapide ~2.1s)
    await page.waitForURL(/\/editor/, { timeout: 12000 });
    expect(page.url()).toContain('/editor');
  });

  test('le mode démo produit un HTML de CV non vide', async ({ page }) => {
    await page.goto('/generate');
    await page.evaluate(() => localStorage.removeItem('talia_api_key'));

    // Remplir les champs requis
    await page.selectOption('select', { value: 'bachelor-marketing' });
    await page.waitForTimeout(200);
    await page.locator('textarea[placeholder*="CV"]').first().fill(MOCK_CV_TEXT);

    const genBtn = page.locator('button').filter({ hasText: /tester|générer/i }).last();
    await genBtn.click();

    await page.waitForURL(/\/editor/, { timeout: 12000 });

    // L'éditeur doit charger une iframe avec du contenu HTML
    const iframe = page.frameLocator('iframe').first();
    await expect(iframe.locator('body')).not.toBeEmpty({ timeout: 10000 });
  });
});

test.describe('Generate — validations formulaire', () => {
  test('le select formation est présent et contient des options', async ({ page }) => {
    await page.goto('/generate');
    // Le formulaire contient un select "Formation"
    const formationSelect = page.locator('select').first();
    await expect(formationSelect).toBeVisible({ timeout: 5000 });
    // Il doit avoir plus d'une option (pas seulement "Choisir une formation")
    const optionCount = await formationSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(1);
  });

  test('le textarea CV est présent', async ({ page }) => {
    await page.goto('/generate');
    const cvArea = page.locator('textarea[placeholder*="CV"]').first();
    await expect(cvArea).toBeVisible({ timeout: 5000 });
  });

  test('le bouton génération est désactivé sans formation ni CV', async ({ page }) => {
    await page.goto('/generate');
    // Chercher le bouton de soumission (dernier button sur la page)
    const genBtn = page.locator('button').filter({ hasText: /tester|générer/i }).last();
    await expect(genBtn).toBeVisible({ timeout: 5000 });
    // Doit être désactivé (cursor: not-allowed ou disabled)
    const disabled = await genBtn.evaluate(el => el.disabled);
    expect(disabled).toBe(true);
  });
});
