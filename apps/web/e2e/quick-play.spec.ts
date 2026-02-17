import { test, expect } from "@playwright/test";

test("Home → Quick Play loads the match board", async ({ page }) => {
  // Navigate to Home
  await page.goto("/");

  // Verify we're on the home page (hero title visible)
  await expect(page.locator("text=すぐ遊ぶ").first()).toBeVisible();

  // Click the Quick Play button
  const quickPlayLink = page.locator("a", { hasText: "すぐ遊ぶ" }).first();
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

test("Arena difficulty card starts guest match immediately", async ({ page }) => {
  await page.goto("/arena?theme=mint");

  const easyCard = page.getByRole("button", { name: /はじめて/i });
  await expect(easyCard).toBeVisible();
  await easyCard.click();

  await expect(page).toHaveURL(/\/match.*mode=guest.*opp=vs_nyano_ai.*ai=easy/);
  await expect(page.locator("text=Guest Quick Play")).toBeVisible({ timeout: 10_000 });
});
