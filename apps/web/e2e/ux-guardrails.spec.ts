import { expect, test, type Locator, type Page } from "@playwright/test";

async function readRect(locator: Locator): Promise<{ width: number; height: number }> {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
}

async function startLayoutShiftProbe(page: Page): Promise<void> {
  await page.evaluate(() => {
    type ShiftState = { total: number; max: number; count: number; supported: boolean };
    const state: ShiftState = { total: 0, max: 0, count: 0, supported: false };
    (window as Window & { __nytlShiftState?: ShiftState }).__nytlShiftState = state;
    if (typeof PerformanceObserver !== "function") return;
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceEntry[]) {
          const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (shift.hadRecentInput) continue;
          const value = typeof shift.value === "number" ? shift.value : 0;
          state.total += value;
          state.max = Math.max(state.max, value);
          state.count += 1;
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
      (window as Window & { __nytlShiftObserver?: PerformanceObserver }).__nytlShiftObserver = observer;
      state.supported = true;
    } catch {
      state.supported = false;
    }
  });
}

async function readLayoutShiftProbe(page: Page): Promise<{ total: number; max: number; count: number; supported: boolean }> {
  return page.evaluate(() => {
    const win = window as Window & {
      __nytlShiftObserver?: PerformanceObserver;
      __nytlShiftState?: { total: number; max: number; count: number; supported: boolean };
    };
    try {
      win.__nytlShiftObserver?.disconnect();
    } catch {
      // ignore
    }
    return win.__nytlShiftState ?? { total: 0, max: 0, count: 0, supported: false };
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

async function commitMove(page: Page, cardSlot: number, cell: number): Promise<void> {
  await page.locator(`[data-board-cell="${cell}"]`).click({ force: true });
  const quickCommitButton = page.getByRole("button", { name: "Quick commit move", exact: true });
  if (await quickCommitButton.isEnabled().catch(() => false)) {
    await quickCommitButton.click({ force: true });
    return;
  }
  const currentHand = page.getByRole("listbox", { name: /Player [AB] hand/i }).first();
  await currentHand.getByRole("option", { name: new RegExp(`^Card ${cardSlot}:`) }).first().click();
  const commitButton = page.getByRole("button", { name: "Commit move", exact: true });
  await expect(commitButton).toBeEnabled();
  await commitButton.click();
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

  test("Nyano reaction slot keeps stable layout when comments appear", async ({ page }) => {
    await disableGuestTutorial(page);
    await page.goto("/match?mode=guest&opp=pvp&auto=0&rk=v2&ui=mint");
    await dismissGuestTutorialIfPresent(page);

    await expect(page.getByText("Guest Quick Play")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("option", { name: /^Card 1:/ }).first()).toBeVisible({ timeout: 15_000 });

    const firstHandCard = page.locator('[data-hand-card="0"]').first();
    await expect(firstHandCard).toHaveClass(/mint-pressable/);

    const firstCell = page.locator('[data-board-cell="0"]').first();
    await expect(firstCell).toHaveClass(/mint-pressable/);
    await expect(firstCell).toHaveAttribute("tabindex", "0");

    const slot = page.getByTestId("nyano-reaction-slot").first();
    await expect(slot).toBeVisible();
    const before = await readRect(slot);
    expect(before.height).toBeGreaterThanOrEqual(60);
    expect(before.width).toBeGreaterThan(0);

    await startLayoutShiftProbe(page);
    await commitMove(page, 1, 0);
    await commitMove(page, 1, 4);

    const reaction = slot.locator(".mint-nyano-reaction");
    await expect(reaction).toBeVisible({ timeout: 10_000 });
    const line = reaction.locator(".mint-nyano-reaction__line");
    await expect(line).toBeVisible();

    const after = await readRect(slot);
    expect(after.height).toBeGreaterThanOrEqual(60);
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(12);

    const clamp = await line.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        webkitLineClamp: style.getPropertyValue("-webkit-line-clamp").trim(),
        overflow: style.overflow,
      };
    });
    expect(clamp.webkitLineClamp).toBe("2");
    expect(clamp.overflow).toBe("hidden");

    const shift = await readLayoutShiftProbe(page);
    if (shift.supported) {
      // Guardrail: keep unexpected page jumps small while allowing normal board updates/animations.
      expect(shift.max).toBeLessThanOrEqual(0.1);
      expect(shift.total).toBeLessThanOrEqual(0.2);
    }
  });
});
