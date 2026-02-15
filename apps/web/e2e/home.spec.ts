import { test, expect } from "@playwright/test";

test("Home page loads with mint menu and Tools/Settings", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/?theme=mint");
  await expect(page.locator("text=すぐ遊ぶ").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("3ステップで始めよう")).toBeVisible();

  const summary = page.locator("summary", { hasText: "Tools / Settings" });
  await expect(summary).toBeVisible();
  await summary.click();

  await expect(page.getByRole("button", { name: "Copy Snapshot" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset Metrics" })).toBeVisible();

  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});
