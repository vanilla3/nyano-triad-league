import { test, expect } from "@playwright/test";

test("Home page loads with mint menu and hides dev tools by default", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/?theme=mint");
  await expect(page.locator("text=すぐ遊ぶ").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("最短2ステップで対戦開始")).toBeVisible();
  await expect(page.getByText("ルールを知る")).toBeVisible();
  await expect(page.getByText("ゲストで対戦")).toBeVisible();
  await expect(page.getByText("慣れたら最初の手を確定")).toBeVisible();
  await expect(page.getByText("完了")).toHaveCount(0);
  await expect(page.getByText("未完了")).toHaveCount(0);

  const summary = page.locator("summary", { hasText: "開発ツール" });
  await expect(summary).toHaveCount(0);

  await page.waitForTimeout(800);
  expect(errors).toEqual([]);
});

test("Home page shows dev tools when debug=1", async ({ page }) => {
  await page.goto("/?theme=mint&debug=1");

  const summary = page.locator("summary", { hasText: "開発ツール" });
  await expect(summary).toBeVisible();
  await summary.click();

  await expect(page.getByRole("button", { name: "Copy Snapshot" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset Metrics" })).toBeVisible();
});
