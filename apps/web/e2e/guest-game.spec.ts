import { test, expect } from "@playwright/test";

test("Guest match loads board and AI starts playing", async ({ page }) => {
  await page.goto("/match?mode=guest&opp=vs_nyano_ai&ai=easy&rk=v2&auto=1");
  await expect(page.locator("text=ゲスト クイック対戦")).toBeVisible({ timeout: 15_000 });

  // Board should expose at least one playable commit control in current UI variants.
  const commitButtons = page.locator(
    'button[aria-label="手を確定"], button[aria-label="Commit move from focus toolbar"]',
  );
  await expect
    .poll(async () => {
      const total = await commitButtons.count();
      for (let i = 0; i < total; i++) {
        if (await commitButtons.nth(i).isVisible().catch(() => false)) return true;
      }
      return false;
    }, { timeout: 10_000 })
    .toBe(true);

  // No critical errors
  await expect(page.locator("text=RPC Error")).not.toBeVisible();
  await expect(page.locator("text=Failed to fetch")).not.toBeVisible();
});
