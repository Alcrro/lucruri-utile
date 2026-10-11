import { defineConfig, devices } from '@playwright/test';

// Port separat de `pnpm dev` (3000): E2E rulează pe build-ul de producție, nu pe dev server.
const PORT = 3100;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'ro-RO',
    trace: 'on-first-retry',
  },
  // Mobil e prioritar (PRD §8: LCP pe mobil). Ambele proiecte folosesc Chromium.
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm start',
    env: { PORT: String(PORT), HOSTNAME: 'localhost' },
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !isCI,
    timeout: 60_000,
  },
});
