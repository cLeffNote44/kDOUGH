import { test, expect } from "@playwright/test";

/**
 * Logged-out flows. No Supabase data or auth needed, so these are stable enough
 * to gate merges. A fresh, empty storage state guarantees we are signed out
 * regardless of any saved session.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test("login page renders the sign-in form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  // exact:true — Playwright getByLabel does substring matching, and the
  // "Show password" toggle's aria-label would otherwise also match "Password".
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});

test("an unauthenticated visit to a protected route redirects to /login", async ({
  page,
}) => {
  await page.goto("/recipes");
  await expect(page).toHaveURL(/\/login/);
});
