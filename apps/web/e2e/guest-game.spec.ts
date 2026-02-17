import { test, expect } from "@playwright/test";

test("Guest match loads board and AI starts playing", async ({ page }) => {
  await page.goto("/match?mode=guest&opp=vs_nyano_ai&ai=easy&rk=v2&auto=1");
  await expect(page.locator("text=Guest Quick Play")).toBeVisible({ timeout: 15_000 });

  // Board should expose at least one playable commit control in current UI variants.
  const commitSelectors = [
    page.getByRole("button", { name: "Quick commit move", exact: true }),
    page.getByRole("button", { name: "Commit move", exact: true }),
    page.getByRole("button", { name: "Commit move from focus hand dock", exact: true }),
  ];
  await expect
    .poll(async () => {
      for (const selector of commitSelectors) {
        const visible = (await selector.count()) > 0 && await selector.isVisible().catch(() => false);
        if (visible) return true;
      }
      return false;
    }, { timeout: 10_000 })
    .toBe(true);

  // No critical errors
  await expect(page.locator("text=RPC Error")).not.toBeVisible();
  await expect(page.locator("text=Failed to fetch")).not.toBeVisible();
});
