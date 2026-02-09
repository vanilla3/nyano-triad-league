import { test, expect } from "@playwright/test";

test("Replay page shows form and keyboard legend", async ({ page }) => {
  await page.goto("/replay");
  await expect(page.getByText("Replay from transcript")).toBeVisible({ timeout: 10_000 });
  // Keyboard legend is always visible
  await expect(page.getByText("play/pause")).toBeVisible();
  // Textarea for transcript JSON input should be present
  await expect(page.locator("textarea")).toBeVisible();
});

test("Replay rejects invalid z= parameter gracefully", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/replay?z=invaliddata");
  // Should show error message, not crash
  await page.waitForTimeout(3000);
  await expect(page.locator("text=RPC Error")).not.toBeVisible();

  // Page should still be functional (no fatal JS error)
  expect(errors).toEqual([]);
});
