import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests. Two tiers:
 *
 *  - "chromium-unauth" — logged-out flows (login renders, protected routes
 *    redirect). No Supabase data or auth required, so these are deterministic
 *    and run as a GATING CI job.
 *  - "setup" + "chromium-authed" — a seeded, pre-confirmed test user
 *    (auth.setup.ts) whose session is reused via storageState. Depends on a
 *    live Supabase project, so it runs as a NON-GATING CI job (push-only).
 *
 * Chromium is preinstalled in the managed environment (PLAYWRIGHT_BROWSERS_PATH);
 * never run `playwright install`. The webServer block boots the built app so CI
 * needs no separate "start app" step (run `npm run build` first).
 *
 * To run locally:
 *   1. npm run build && npm run start   (with .env.local configured)
 *   2. Unauth only:  npx playwright test --project=chromium-unauth
 *      Authed too:   SUPABASE_SERVICE_ROLE_KEY=... E2E_EMAIL=... E2E_PASSWORD=... \
 *                    npx playwright test --project=setup --project=chromium-authed
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
    // Seeds + signs in the test user, persisting cookies to e2e/.auth/user.json.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    // Logged-out, gating. Ignores the authed spec + the setup project.
    {
      name: "chromium-unauth",
      testIgnore: /smoke\.authed|auth\.setup/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Logged-in, non-gating. Reuses the seeded session.
    {
      name: "chromium-authed",
      testMatch: /smoke\.authed/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
