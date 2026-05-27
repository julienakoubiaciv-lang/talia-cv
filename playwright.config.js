// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright — tests E2E de TaliaCV
 *
 * Lance le serveur Vite dev automatiquement avant les tests.
 * Les tests sont dans e2e/*.spec.js
 *
 * Commandes :
 *   npx playwright test            — tous les tests (headless)
 *   npx playwright test --ui       — interface graphique
 *   npx playwright test --headed   — navigateur visible
 *   npx playwright show-report     — rapport HTML
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // localStorage vide au début de chaque test
    storageState: undefined,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Démarre Vite dev avant les tests, l'arrête après
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
