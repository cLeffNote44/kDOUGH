import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke tests. These run against a LIVE app instance (with Supabase
 * configured), so they are intentionally separate from the unit suite (`npm test`)
 * and are not part of the default CI job.
 *
 * To run locally:
 *   1. Start the app:  npm run dev   (with .env.local configured)
 *   2. Provide test credentials and run:
 *      E2E_BASE_URL=http://localhost:3000 \
 *      E2E_EMAIL=you@example.com E2E_PASSWORD=... \
 *      npm run test:e2e
 *
 * Chromium is preinstalled in the managed environment (PLAYWRIGHT_BROWSERS_PATH).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
