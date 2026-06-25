import { test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Seeds a pre-confirmed test user via the service-role admin API (bypassing the
 * email-confirmation UI), signs in through the real login form so the middleware
 * sets session cookies, and persists them as storageState for the authed specs.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY, E2E_EMAIL, E2E_PASSWORD. This project only
 * runs in the non-gating `e2e-authed` CI job, never on fork PRs.
 */
const AUTH_FILE = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const email = process.env.E2E_EMAIL!;
  const password = process.env.E2E_PASSWORD!;

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // Idempotent: create a confirmed user; ignore the error if it already exists.
  await admin.auth.admin
    .createUser({ email, password, email_confirm: true })
    .catch(() => {});

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // The middleware redirects to the home planner once the session is set.
  await page.waitForURL(/\/(\?.*)?$/);
  await page.context().storageState({ path: AUTH_FILE });
});
