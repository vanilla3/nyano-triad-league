import { test, expect } from "@playwright/test";

test("Home → Quick Play loads the match board", async ({ page }) => {
  // Navigate to Home
  await page.goto("/");

  // Verify we're on the home page (nav bar visible)
  await expect(page.locator("text=Nyano Triad League")).toBeVisible();

  // Click the Quick Play button
  const quickPlayLink = page.locator("a", { hasText: "Quick Play" }).first();
  await expect(quickPlayLink).toBeVisible();
  await quickPlayLink.click();

  // Should navigate to match page with guest mode params
  await expect(page).toHaveURL(/\/match.*mode=guest/);

  // Guest Quick Play banner should be visible
  await expect(page.locator("text=Guest Quick Play")).toBeVisible({ timeout: 10_000 });

  // No RPC error should be displayed
  await expect(page.locator("text=RPC Error")).not.toBeVisible();
  await expect(page.locator("text=Failed to fetch")).not.toBeVisible();
});
