import { test, expect, type Page } from "@playwright/test";

async function assertNoHorizontalOverflow(page: Page, maxPx = 2): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const docOverflow = Math.max(0, doc.scrollWidth - doc.clientWidth);
    const bodyOverflow = Math.max(0, body.scrollWidth - body.clientWidth);
    return Math.max(docOverflow, bodyOverflow);
  });
  expect(overflow).toBeLessThanOrEqual(maxPx);
}

test.describe("Mint app screen guardrails", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("Mint app chrome preserves theme query across tab navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/?theme=mint");

    const appChrome = page.locator(".mint-app-chrome").first();
    await expect(appChrome).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "Arena" }).first().click();
    await expect(page).toHaveURL(/\/arena\?theme=mint/);
    await expect(appChrome).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "Decks" }).first().click();
    await expect(page).toHaveURL(/\/decks\?theme=mint/);
    await expect(appChrome).toBeVisible({ timeout: 10_000 });
  });

  test("390px: Home/Arena/Decks keep core layout reachable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/?theme=mint");
    await expect(page.locator(".mint-home-menu-grid")).toBeVisible({ timeout: 10_000 });
    await assertNoHorizontalOverflow(page);

    await page.goto("/arena?theme=mint");
    await expect(page.locator(".mint-arena-layout")).toBeVisible({ timeout: 10_000 });
    await assertNoHorizontalOverflow(page);

    await page.goto("/decks?theme=mint");
    await expect(page.locator(".mint-decks-layout")).toBeVisible({ timeout: 10_000 });
    await assertNoHorizontalOverflow(page);
  });

  test("390px: Match mint screen remains interactive", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/match?theme=mint&mode=guest&opp=pvp&auto=0&rk=v2&ui=mint");

    const board = page.locator(".mint-board-frame").first();
    await expect(board).toBeVisible({ timeout: 15_000 });

    const firstCell = page.locator("[data-board-cell='0']").first();
    const firstCard = page.locator("[data-hand-card='0']").first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });
    await expect(firstCell).toBeVisible({ timeout: 10_000 });
    await assertNoHorizontalOverflow(page);
  });

  test("1024px: screens render key structures", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.goto("/?theme=mint");
    await expect(page.locator(".mint-home-onboarding")).toBeVisible({ timeout: 10_000 });

    await page.goto("/arena?theme=mint");
    await expect(page.locator(".mint-arena-difficulty")).toBeVisible({ timeout: 10_000 });

    await page.goto("/decks?theme=mint");
    await expect(page.locator(".mint-decks-summary")).toBeVisible({ timeout: 10_000 });
  });

  test("focus routes keep app chrome hidden for layout compatibility", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.goto("/match?theme=mint&mode=guest&opp=pvp&auto=0&rk=v2&ui=engine&focus=1");
    await expect(page.locator(".mint-app-chrome")).toHaveCount(0);
    await expect(page.locator(".mint-app-footer")).toHaveCount(0);
    await expect(page.locator(".app-header")).toHaveCount(0);
    await expect(page.locator(".app-footer")).toHaveCount(0);

    await page.goto("/battle-stage?theme=mint&mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=engine&focus=1&fpm=manual&fp=0");
    await expect(page.locator(".mint-app-chrome")).toHaveCount(0);
    await expect(page.locator(".mint-app-footer")).toHaveCount(0);
    await expect(page.locator(".app-header")).toHaveCount(0);
    await expect(page.locator(".app-footer")).toHaveCount(0);
    await expect(page.getByLabel("Commit move from focus hand dock")).toBeVisible({ timeout: 15_000 });
  });
});
