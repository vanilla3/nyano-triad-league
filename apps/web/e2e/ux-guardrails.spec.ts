import { expect, test, type Locator, type Page } from "@playwright/test";

async function readRect(locator: Locator): Promise<{
  x: number;
  y: number;
  docX: number;
  docY: number;
  width: number;
  height: number;
}> {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      docX: rect.x + window.scrollX,
      docY: rect.y + window.scrollY,
      width: rect.width,
      height: rect.height,
    };
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
      localStorage.setItem("nytl.ui.density", "standard");
      localStorage.setItem(
        "nytl.onboarding.progress_v1",
        JSON.stringify({
          version: 1,
          updatedAtIso: "2026-01-01T00:00:00.000Z",
          steps: {
            read_quick_guide: true,
            start_first_match: true,
            commit_first_move: true,
          },
        }),
      );
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
  if ((await quickCommitButton.count()) > 0 && await quickCommitButton.isEnabled().catch(() => false)) {
    const quickCommitClicked = await quickCommitButton
      .click({ force: true, timeout: 2_000 })
      .then(() => true)
      .catch(() => false);
    if (quickCommitClicked) return;
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

    const deckPreview = page.locator("details").filter({ hasText: "Deck Preview" }).first();
    if (await deckPreview.isVisible().catch(() => false)) {
      const open = await deckPreview.evaluate((el) => el.hasAttribute("open"));
      if (open) {
        await deckPreview.locator("summary").click();
        await expect.poll(
          () => deckPreview.evaluate((el) => el.hasAttribute("open")),
        ).toBe(false);
      }
    }

    const boardFrame = page.locator(".mint-board-frame").first();
    await expect(boardFrame).toBeVisible();
    const boardBefore = await readRect(boardFrame);

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

    const boardAfter = await readRect(boardFrame);
    expect(Math.abs(boardAfter.docY - boardBefore.docY)).toBeLessThanOrEqual(2);
    expect(Math.abs(boardAfter.height - boardBefore.height)).toBeLessThanOrEqual(2);

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

  test("Mint AI notice slot keeps board position stable when commentary appears", async ({ page }) => {
    await disableGuestTutorial(page);
    await page.goto("/match?mode=guest&opp=vs_nyano_ai&auto=0&rk=v2&ui=mint");
    await dismissGuestTutorialIfPresent(page);

    await expect(page.getByText("Guest Quick Play")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("option", { name: /^Card 1:/ }).first()).toBeVisible({ timeout: 15_000 });

    const deckPreview = page.locator("details").filter({ hasText: "Deck Preview" }).first();
    if (await deckPreview.isVisible().catch(() => false)) {
      const open = await deckPreview.evaluate((el) => el.hasAttribute("open"));
      if (open) {
        await deckPreview.locator("summary").click();
        await expect.poll(
          () => deckPreview.evaluate((el) => el.hasAttribute("open")),
        ).toBe(false);
      }
    }

    const boardFrame = page.locator(".mint-board-frame").first();
    const noticeSlot = page.locator(".mint-ai-notice-slot").first();
    await expect(boardFrame).toBeVisible();
    await expect(noticeSlot).toBeVisible();

    const boardBefore = await readRect(boardFrame);
    const slotBefore = await readRect(noticeSlot);
    expect(slotBefore.height).toBeGreaterThanOrEqual(30);

    await commitMove(page, 1, 0);
    await expect(noticeSlot.getByText(/Nyano turn|Nyano is thinking/i)).toBeVisible({ timeout: 10_000 });

    const boardAfter = await readRect(boardFrame);
    const slotAfter = await readRect(noticeSlot);

    expect(Math.abs(slotAfter.height - slotBefore.height)).toBeLessThanOrEqual(2);
    expect(Math.abs(boardAfter.docY - boardBefore.docY)).toBeLessThanOrEqual(2);
    expect(Math.abs(boardAfter.height - boardBefore.height)).toBeLessThanOrEqual(2);
  });

  test("Match details drawer closes via the close button and stays closed", async ({ page }) => {
    await disableGuestTutorial(page);
    await page.goto("/match?mode=guest&opp=pvp&auto=0&rk=v2&ui=mint");
    await dismissGuestTutorialIfPresent(page);

    await expect(page.getByText("Guest Quick Play")).toBeVisible({ timeout: 15_000 });
    const openDetailsButton = page.getByRole("button", { name: "Open match details" });
    await expect(openDetailsButton).toBeVisible();
    await openDetailsButton.click();

    const drawer = page.locator(".mint-drawer").first();
    await expect(drawer).toHaveClass(/mint-drawer--open/);

    const closeButton = page.getByRole("button", { name: "Close drawer" });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(drawer).not.toHaveClass(/mint-drawer--open/);
    await page.waitForTimeout(250);
    await expect(drawer).not.toHaveClass(/mint-drawer--open/);
    await expect(openDetailsButton).toBeVisible();
  });

  test("Mint status summary slot keeps stable height when battle text appears/disappears", async ({ page }) => {
    await disableGuestTutorial(page);
    await page.goto("/match?mode=guest&opp=pvp&auto=0&rk=v2&ui=mint");
    await dismissGuestTutorialIfPresent(page);

    await expect(page.getByText("Guest Quick Play")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("option", { name: /^Card 1:/ }).first()).toBeVisible({ timeout: 15_000 });

    const deckPreview = page.locator("details").filter({ hasText: "Deck Preview" }).first();
    if (await deckPreview.isVisible().catch(() => false)) {
      const open = await deckPreview.evaluate((el) => el.hasAttribute("open"));
      if (open) {
        await deckPreview.locator("summary").click();
        await expect.poll(
          () => deckPreview.evaluate((el) => el.hasAttribute("open")),
        ).toBe(false);
      }
    }

    const boardFrame = page.locator(".mint-board-frame").first();
    const summarySlot = page.locator(".mint-status-summary-slot").first();
    await expect(boardFrame).toBeVisible();
    await expect(summarySlot).toBeVisible();

    const boardBefore = await readRect(boardFrame);
    const slotBefore = await readRect(summarySlot);
    expect(slotBefore.height).toBeGreaterThanOrEqual(30);

    await commitMove(page, 1, 0);
    await commitMove(page, 1, 4);

    const boardAfter = await readRect(boardFrame);
    const slotAfter = await readRect(summarySlot);

    expect(Math.abs(slotAfter.height - slotBefore.height)).toBeLessThanOrEqual(2);
    expect(Math.abs(boardAfter.docY - boardBefore.docY)).toBeLessThanOrEqual(2);
  });

  test("Mint board cells remain keyboard-selectable via Enter", async ({ page }) => {
    await disableGuestTutorial(page);
    await page.goto("/match?mode=guest&opp=pvp&auto=0&rk=v2&ui=mint");
    await dismissGuestTutorialIfPresent(page);

    await expect(page.getByText("Guest Quick Play")).toBeVisible({ timeout: 15_000 });
    const firstHandCard = page.locator('[data-hand-card="0"]').first();
    const firstCell = page.locator('[data-board-cell="0"]').first();

    await expect(firstHandCard).toBeVisible();
    await expect(firstCell).toHaveAttribute("tabindex", "0");

    await firstHandCard.click({ force: true });
    await firstCell.focus();
    await page.keyboard.press("Enter");

    await expect(firstCell).toHaveClass(/mint-cell--selected/);
  });

  test("Reduced motion disables pressable transition feedback in Mint battle UI", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await disableGuestTutorial(page);
    await page.goto("/match?mode=guest&opp=pvp&auto=0&rk=v2&ui=mint");
    await dismissGuestTutorialIfPresent(page);

    await expect(page.getByText("Guest Quick Play")).toBeVisible({ timeout: 15_000 });
    const firstHandCard = page.locator('[data-hand-card="0"]').first();
    const firstCell = page.locator('[data-board-cell="0"]').first();

    const durations = await Promise.all([
      firstHandCard.evaluate((el) => getComputedStyle(el).transitionDuration),
      firstCell.evaluate((el) => getComputedStyle(el).transitionDuration),
    ]);

    expect(durations[0]).toMatch(/0s/);
    expect(durations[1]).toMatch(/0s/);
  });
});
