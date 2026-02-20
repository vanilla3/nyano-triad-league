import { expect, test, type Page } from "@playwright/test";

async function prepareStableVisualMode(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    try {
      localStorage.setItem("nytl.tutorial.seen", "true");
      localStorage.setItem("nytl.vfx.quality", "off");
      localStorage.setItem("nytl.ui.density", "standard");
    } catch {
      // ignore storage failures in hardened browser contexts
    }
  });
}

async function pickFirstCard(page: Page): Promise<void> {
  const dockCard = page.locator('[data-hand-card="0"]').first();
  if ((await dockCard.count()) > 0 && await dockCard.isVisible().catch(() => false)) {
    await dockCard.click({ force: true });
    return;
  }

  const handOption = page.getByRole("option", { name: /^Card 1:/ }).first();
  if ((await handOption.count()) > 0 && await handOption.isVisible().catch(() => false)) {
    await handOption.click({ force: true });
  }
}

async function commitMove(page: Page): Promise<void> {
  const labels = [
    "Quick commit move",
    "Commit move from focus hand dock",
    "Commit move from focus toolbar",
    "Commit move",
  ] as const;

  for (const label of labels) {
    const button = page.getByRole("button", { name: label, exact: true }).first();
    if ((await button.count()) === 0) continue;
    const enabled = await button.isEnabled().catch(() => false);
    if (!enabled) continue;
    await button.click({ force: true });
    return;
  }

  throw new Error("No commit control found");
}

test.describe("Engine stage visual regression", () => {
  test("390px: board snapshots stay stable for initial and placed states", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareStableVisualMode(page);
    await page.goto("/match?theme=mint&mode=guest&opp=pvp&auto=0&rk=v2&ui=engine&focus=1&fpm=manual&fp=0");

    const board = page.getByRole("img", { name: "Game board (engine renderer)" }).first();
    await expect(board).toBeVisible({ timeout: 15_000 });

    const screenshotOptions = {
      animations: "disabled" as const,
      caret: "hide" as const,
      maxDiffPixelRatio: 0.02,
    };

    const beforePng = await board.screenshot();
    await expect(board).toHaveScreenshot("engine-board-initial.png", screenshotOptions);

    await pickFirstCard(page);
    await page.locator('[data-board-cell="0"]').first().click({ force: true });
    await commitMove(page);
    await page.waitForTimeout(150);

    const afterPng = await board.screenshot();
    expect(afterPng.equals(beforePng)).toBe(false);
    await expect(board).toHaveScreenshot("engine-board-after-place.png", screenshotOptions);
  });
});
