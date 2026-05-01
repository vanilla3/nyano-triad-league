import { expect, test, type Locator, type Page } from "@playwright/test";

async function readRect(locator: Locator): Promise<{ width: number; height: number }> {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
}

async function disableGuestTutorial(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("nytl.tutorial.seen", "true");
    } catch {
      // ignore storage failures in hardened browser contexts
    }
  });
}

async function dismissGuestTutorialIfPresent(page: Page): Promise<void> {
  const gotItButton = page.getByRole("button", { name: "Got it!" });
  if (await gotItButton.isVisible().catch(() => false)) {
    await gotItButton.click();
    return;
  }
  const skipButton = page.getByRole("button", { name: "Skip tutorial" });
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }
}

test.describe("UX regression guardrails", () => {
  test("Match Setup primary controls keep URL params in sync", async ({ page }) => {
    await disableGuestTutorial(page);
    await page.goto("/match?opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint&auto=1");
    await expect(page.getByTestId("match-setup-panel")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("match-setup-ruleset").selectOption("classic_order");
    await expect.poll(() => new URL(page.url()).searchParams.get("rk")).toBe("classic_order");

    await page.getByTestId("match-setup-opponent-pvp").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("opp")).toBe("pvp");

    await page.getByTestId("match-setup-opponent-ai").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("opp")).toBe("vs_nyano_ai");

    await page.getByTestId("match-setup-ai-difficulty").selectOption("expert");
    await expect.poll(() => new URL(page.url()).searchParams.get("ai")).toBe("expert");

    await page.getByTestId("match-setup-board-ui").selectOption("engine");
    await expect.poll(() => new URL(page.url()).searchParams.get("ui")).toBe("engine");
  });

  test("Nyano reaction slot reserves stable layout before comments appear", async ({ page }) => {
    await disableGuestTutorial(page);
    await page.goto("/match?mode=guest&opp=pvp&auto=0&rk=v2&ui=mint");
    await dismissGuestTutorialIfPresent(page);

    await expect(page.getByText("Guest Quick Play")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("option", { name: /^Card 1:/ }).first()).toBeVisible({ timeout: 15_000 });

    const slot = page.getByTestId("nyano-reaction-slot").first();
    await expect(slot).toBeVisible();
    const before = await readRect(slot);
    expect(before.height).toBeGreaterThanOrEqual(60);
    expect(before.width).toBeGreaterThan(0);

    await page.waitForTimeout(300);

    const after = await readRect(slot);
    expect(after.height).toBeGreaterThanOrEqual(60);
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(12);

    await expect(slot).toHaveClass(/mint-nyano-reaction-slot/);
  });
});
