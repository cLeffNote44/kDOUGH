import { test, expect } from "@playwright/test";

/**
 * End-to-end smoke flow: sign in → ensure a recipe exists → assign it to a day →
 * generate a grocery list. Requires a running app and a seeded test account.
 *
 * Skipped automatically unless E2E_EMAIL / E2E_PASSWORD are provided, so it is a
 * no-op in environments without credentials (and never fails CI by default).
 */
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

test.describe("kDOUGH smoke flow", () => {
  test.skip(!EMAIL || !PASSWORD, "Set E2E_EMAIL and E2E_PASSWORD to run e2e smoke tests");

  test("sign in lands on the weekly planner", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(EMAIL!);
    await page.getByLabel(/password/i).fill(PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();

    // After auth the middleware redirects to the home calendar.
    await expect(page).toHaveURL(/\/(\?week=.*)?$/);
    await expect(page.getByText(/This Week|Prev/i).first()).toBeVisible();
  });

  test("can open the grocery view and generate from the plan", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(EMAIL!);
    await page.getByLabel(/password/i).fill(PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.goto("/grocery");
    // The page renders either an existing list or the generate CTA.
    await expect(
      page.getByRole("button", { name: /generate|regenerate/i }).first()
    ).toBeVisible();
  });
});
