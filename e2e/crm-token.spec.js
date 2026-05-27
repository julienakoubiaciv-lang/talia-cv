/**
 * crm-token.spec.js
 * Vérifie le flux token CRM via paramètres URL.
 *
 * Quand l'URL contient ?crm_token=TOKEN&org_id=ID&org_name=NOM :
 *   1. Les données sont stockées dans localStorage ('talia_crm_link')
 *   2. L'URL est nettoyée (les query params disparaissent)
 *   3. La page reste fonctionnelle après le nettoyage
 *
 * Le hook useCRMToken.linkFromURL() est appelé dans useEffect de Home.jsx.
 */
import { test, expect } from '@playwright/test';

const CRM_LS_KEY  = 'talia_crm_link';          // clé réelle dans crmToken.js
const CRM_TOKEN   = 'tok_test_abc123';
const CRM_ORG_ID  = 'org_42';
const CRM_ORG     = 'Acme Corp';

test.describe('CRM Token — injection via URL', () => {
  test.beforeEach(async ({ page }) => {
    // Partir d'un état propre
    await page.goto('/');
    await page.evaluate((k) => localStorage.removeItem(k), CRM_LS_KEY);
  });

  test('le token est stocké dans localStorage après navigation sur Home', async ({ page }) => {
    const url = `/?crm_token=${CRM_TOKEN}&org_id=${CRM_ORG_ID}&org_name=${encodeURIComponent(CRM_ORG)}`;
    await page.goto(url);

    // Attendre que React monte et que useEffect appelle linkFromURL()
    await page.waitForTimeout(1500);

    const stored = await page.evaluate((k) => localStorage.getItem(k), CRM_LS_KEY);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored);
    expect(parsed.token).toBe(CRM_TOKEN);
    expect(parsed.orgId).toBe(CRM_ORG_ID);
    expect(parsed.orgName).toBe(CRM_ORG);
  });

  test("l'URL est nettoyée après consommation du token", async ({ page }) => {
    const url = `/?crm_token=${CRM_TOKEN}&org_id=${CRM_ORG_ID}&org_name=${encodeURIComponent(CRM_ORG)}`;
    await page.goto(url);
    await page.waitForTimeout(1500);

    // L'URL ne doit plus contenir les paramètres CRM
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('crm_token');
    expect(currentUrl).not.toContain('org_id');
    expect(currentUrl).not.toContain('org_name');
  });

  test('la page reste fonctionnelle après consommation du token', async ({ page }) => {
    const url = `/?crm_token=${CRM_TOKEN}&org_id=${CRM_ORG_ID}&org_name=${encodeURIComponent(CRM_ORG)}`;
    await page.goto(url);
    await page.waitForTimeout(1500);

    // L'application doit toujours afficher son contenu principal
    await expect(page.locator('text=Talia').first()).toBeVisible({ timeout: 5000 });
  });

  test('un token vide ne casse pas la page', async ({ page }) => {
    // Paramètre crm_token vide → consumeCRMTokenFromURL retourne null (guard: !token)
    await page.goto('/?crm_token=&org_id=&org_name=');
    await page.waitForTimeout(500);

    // Pas de crash — Talia s'affiche toujours
    await expect(page.locator('text=Talia').first()).toBeVisible({ timeout: 5000 });

    // Rien stocké si token vide (guard dans consumeCRMTokenFromURL)
    const stored = await page.evaluate((k) => localStorage.getItem(k), CRM_LS_KEY);
    expect(stored).toBeNull();
  });
});

test.describe('CRM Token — données stockées correctement', () => {
  test('getCRMLink retourne le token après injection URL', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((k) => localStorage.removeItem(k), CRM_LS_KEY);

    const url = `/?crm_token=${CRM_TOKEN}&org_id=${CRM_ORG_ID}&org_name=${encodeURIComponent(CRM_ORG)}`;
    await page.goto(url);
    await page.waitForTimeout(1500);

    // Vérifier que toutes les propriétés sont correctement stockées
    const stored = await page.evaluate((k) => {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : null;
    }, CRM_LS_KEY);

    expect(stored).not.toBeNull();
    expect(stored).toMatchObject({
      token:   CRM_TOKEN,
      orgId:   CRM_ORG_ID,
      orgName: CRM_ORG,
    });
    // linkedAt doit être une date ISO valide (champ réel de setCRMLink)
    expect(new Date(stored.linkedAt).getTime()).not.toBeNaN();
  });
});
