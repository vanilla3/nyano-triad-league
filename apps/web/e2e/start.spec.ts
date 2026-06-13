import { test, expect } from "@playwright/test";

test("Start page loads in mint theme and shows onboarding steps", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/start?theme=mint");
  await expect(page.getByText("はじめての1分スタート")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("ルール設定へ")).toBeVisible();
  await expect(page.getByText("今すぐ対戦")).toBeVisible();
  await expect(page.getByText("Homeへ戻る")).toBeVisible();

  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
});
