import { test, expect } from "@playwright/test";

test("Home page loads with hero, Quick Play, and Settings", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/");
  await expect(page.locator("text=すぐ遊ぶ").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Settings")).toBeVisible();

  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});
