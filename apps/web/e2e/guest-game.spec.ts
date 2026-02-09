import { test, expect } from "@playwright/test";

test("Guest match loads board and AI starts playing", async ({ page }) => {
  await page.goto("/match?mode=guest&opp=vs_nyano_ai&ai=easy&rk=v2&auto=1");
  await expect(page.locator("text=Guest Quick Play")).toBeVisible({ timeout: 15_000 });

  // Board should be visible with cards
  await expect(page.locator("text=Commit Move")).toBeVisible({ timeout: 10_000 });

  // No critical errors
  await expect(page.locator("text=RPC Error")).not.toBeVisible();
  await expect(page.locator("text=Failed to fetch")).not.toBeVisible();
});
