import { expect, test, type Page } from "@playwright/test";

async function readHorizontalOverflowPx(page: Page): Promise<number> {
  return page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(0, root.scrollWidth - root.clientWidth);
  });
}

async function prepareMintMatchDefaults(page: Page, vfx: "auto" | "off" | "low" | "medium" | "high"): Promise<void> {
  await page.addInitScript((vfxValue) => {
    try {
      localStorage.setItem("nytl.tutorial.seen", "true");
      localStorage.setItem("nytl.vfx.quality", vfxValue);
    } catch {
      // ignore storage failures in hardened browser contexts
    }
  }, vfx);
}

async function expectCommitControlVisible(page: Page): Promise<void> {
  const legacyCommit = page.getByRole("button", { name: "Commit move", exact: true });
  const dockCommit = page.getByRole("button", { name: "Commit move from focus hand dock", exact: true });
  const quickCommit = page.getByRole("button", { name: "Quick commit move", exact: true });

  await expect
    .poll(async () => {
      const legacyVisible = (await legacyCommit.count()) > 0 && await legacyCommit.isVisible().catch(() => false);
      const dockVisible = (await dockCommit.count()) > 0 && await dockCommit.isVisible().catch(() => false);
      const quickVisible = (await quickCommit.count()) > 0 && await quickCommit.isVisible().catch(() => false);
      return legacyVisible || dockVisible || quickVisible;
    })
    .toBe(true);
}

test.describe("Mint stage visual guardrails", () => {
  test("vfx=off hides heavy stage atmosphere while keeping board usable", async ({ page }) => {
    await prepareMintMatchDefaults(page, "off");
    await page.goto("/match?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint&auto=0");

    await expect(page.getByText(/Guest Quick Play|ゲスト対戦/)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".mint-stage").first()).toBeVisible({ timeout: 15_000 });

    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.vfx ?? ""))
      .toBe("off");

    await expect(page.locator(".mint-stage__atmo").first()).toBeHidden();
    await expectCommitControlVisible(page);
  });

  test("prefers-reduced-motion resolves visual quality to off", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await prepareMintMatchDefaults(page, "auto");
    await page.goto("/match?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint&auto=0");

    await expect(page.getByText(/Guest Quick Play|ゲスト対戦/)).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.vfx ?? ""))
      .toBe("off");

    await expect(page.locator(".mint-stage__atmo").first()).toBeHidden();
  });

  test("390px viewport keeps mint stage board and commit control reachable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareMintMatchDefaults(page, "low");
    await page.goto("/match?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint&auto=0");

    const stage = page.locator(".mint-stage").first();
    await expect(stage).toBeVisible({ timeout: 15_000 });
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toBeInViewport();
    await expectCommitControlVisible(page);

    const overflowPx = await readHorizontalOverflowPx(page);
    expect(overflowPx).toBeLessThanOrEqual(1);
  });
});
