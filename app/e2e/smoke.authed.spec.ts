import { test, expect } from "@playwright/test";

/**
 * Authenticated smoke flow, reusing the seeded session from auth.setup.ts.
 * Non-gating (push-only) because it depends on a live Supabase project.
 */
test.use({ storageState: "e2e/.auth/user.json" });

test("authenticated user lands on the weekly planner", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(\?week=.*)?$/);
  await expect(page.getByText(/This Week|Prev/i).first()).toBeVisible();
});

test("can open the grocery view and see the generate control", async ({ page }) => {
  await page.goto("/grocery");
  await expect(
    page.getByRole("button", { name: /generate|regenerate/i }).first()
  ).toBeVisible();
});
