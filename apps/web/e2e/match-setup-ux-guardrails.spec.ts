import { expect, test } from "@playwright/test";

test.describe("Match Setup UX guardrails", () => {
  test("setup summary reflects key selections and URL-backed state", async ({ page }) => {
    await page.goto("/match?opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint&fpm=manual&fp=0");
    await expect(page.getByTestId("match-setup-panel")).toBeVisible({ timeout: 15_000 });

    const summary = page.getByTestId("match-setup-summary-line");
    await expect(summary).toContainText("v2（shadow+tactics）");
    await expect(summary).toContainText("Nyano AI");
    await expect(summary).toContainText("先攻: 手動");
    await expect(summary).toContainText("盤面: mint");

    await page.getByTestId("match-setup-opponent-pvp").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("opp")).toBe("pvp");
    await expect(summary).toContainText("対戦相手: 2人対戦");

    await page.getByTestId("match-setup-ruleset").selectOption("classic_order");
    await expect.poll(() => new URL(page.url()).searchParams.get("rk")).toBe("classic_order");
    await expect(summary).toContainText("classic（order）");

    await page.getByTestId("match-setup-board-ui").selectOption("engine");
    await expect.poll(() => new URL(page.url()).searchParams.get("ui")).toBe("engine");
    await expect(summary).toContainText("盤面: engine");

    await page.getByTestId("match-setup-first-player-mode").selectOption("mutual");
    await expect.poll(() => new URL(page.url()).searchParams.get("fpm")).toBe("mutual");
    await expect(summary).toContainText("先攻: 相互選択");
  });

  test("advanced setup auto-opens for non-manual first-player mode and keeps ccap in URL", async ({ page }) => {
    await page.goto("/match?opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint&fpm=manual&fp=0");
    await expect(page.getByTestId("match-setup-panel")).toBeVisible({ timeout: 15_000 });

    const advancedContent = page.getByTestId("match-setup-advanced-content");
    await expect(advancedContent).toHaveCount(0);

    await page.getByTestId("match-setup-first-player-mode").selectOption("mutual");
    await expect.poll(() => new URL(page.url()).searchParams.get("fpm")).toBe("mutual");
    await expect(advancedContent).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Mutual choice A")).toBeVisible();

    await page.getByTestId("match-setup-chain-cap").selectOption("2");
    await expect.poll(() => new URL(page.url()).searchParams.get("ccap")).toBe("2");

    const advancedToggle = page.getByTestId("match-setup-advanced-toggle");
    await advancedToggle.click();
    await expect(advancedContent).toHaveCount(0);
    await advancedToggle.click();
    await expect(advancedContent).toBeVisible({ timeout: 10_000 });
  });

  test("classic custom builder keeps rk=classic_custom and updates cr mask", async ({ page }) => {
    await page.goto("/match?opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint");
    await expect(page.getByTestId("match-setup-panel")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("mint-ruleset-picker")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("mint-ruleset-family-classic").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("rk")).toBe("classic_plus_same");

    await page.getByTestId("mint-ruleset-classic-custom-mode").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("rk")).toBe("classic_custom");

    const readCr = () => new URL(page.url()).searchParams.get("cr");
    const crBefore = readCr();

    await page.getByTestId("mint-ruleset-custom-toggle-reverse").click();
    await expect.poll(readCr).not.toBe(crBefore);
    const crAfterReverse = readCr();
    expect(crAfterReverse).toBeTruthy();

    await page.getByTestId("mint-ruleset-custom-card-order").click();
    await expect.poll(readCr).not.toBe(crAfterReverse);
    const crAfterOrder = readCr();
    expect(crAfterOrder).toBeTruthy();

    await page.getByTestId("mint-ruleset-custom-card-chaos").click();
    await expect.poll(readCr).not.toBe(crAfterOrder);

    const summary = page.getByTestId("match-setup-summary-line");
    await expect(summary).toContainText("classic（custom");
  });
});
