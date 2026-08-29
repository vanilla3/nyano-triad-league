import { test, expect, type Page } from "@playwright/test";
import { gzipSync } from "node:zlib";

const REPLAY_TRANSCRIPT_JSON = JSON.stringify({
  header: {
    version: 1,
    rulesetId: "0x" + "11".repeat(32),
    seasonId: 0,
    playerA: "0x" + "aa".repeat(20),
    playerB: "0x" + "bb".repeat(20),
    deckA: ["1", "2", "3", "4", "5"],
    deckB: ["6", "7", "8", "9", "10"],
    firstPlayer: 0,
    deadline: 9999999999,
    salt: "0x" + "22".repeat(32),
  },
  turns: [
    { cell: 4, cardIndex: 0 },
    { cell: 0, cardIndex: 0 },
    { cell: 2, cardIndex: 1 },
    { cell: 6, cardIndex: 1 },
    { cell: 8, cardIndex: 2 },
    { cell: 1, cardIndex: 2 },
    { cell: 3, cardIndex: 3 },
    { cell: 5, cardIndex: 3 },
    { cell: 7, cardIndex: 4 },
  ],
});

function encodeTranscriptZ(json: string): string {
  const compressed = gzipSync(Buffer.from(json, "utf-8"));
  return compressed.toString("base64url");
}

async function assertNoHorizontalOverflow(page: Page, maxPx = 2): Promise<void> {
  const details = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth = doc.clientWidth;
    const docOverflow = Math.max(0, doc.scrollWidth - viewportWidth);
    const bodyOverflow = Math.max(0, body.scrollWidth - body.clientWidth);
    const overflow = Math.max(docOverflow, bodyOverflow);

    if (overflow <= 0) {
      return { overflow, viewportWidth, offenders: [] as Array<Record<string, unknown>> };
    }

    const offenders = Array.from(document.querySelectorAll<HTMLElement>("*"))
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const rightOverflow = Math.max(0, rect.right - viewportWidth);
        const widthOverflow = Math.max(0, rect.width - viewportWidth);
        const leftOverflow = Math.max(0, -rect.left);
        const overflowPx = Math.max(rightOverflow, widthOverflow, leftOverflow);
        if (overflowPx <= 1) return null;
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || "",
          className: (el.className || "").toString().slice(0, 160),
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          overflowPx: Math.round(overflowPx),
          scrollWidth: el.scrollWidth,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => b.overflowPx - a.overflowPx)
      .slice(0, 8);

    return { overflow, viewportWidth, offenders };
  });

  expect(
    details.overflow,
    `overflow=${details.overflow}px viewport=${details.viewportWidth}px offenders=${JSON.stringify(details.offenders)}`,
  ).toBeLessThanOrEqual(maxPx);
}

async function gridColumnCount(page: Page, selector: string): Promise<number> {
  return page.locator(selector).evaluate((element) => {
    const columns = window.getComputedStyle(element).gridTemplateColumns;
    return columns.split(/\s+/).filter(Boolean).length;
  });
}

async function assertCenteredOrphan(page: Page, selector: string): Promise<void> {
  const geometry = await page.locator(selector).evaluate((grid) => {
    const items = Array.from(grid.children);
    const first = items.at(0)?.getBoundingClientRect();
    const last = items.at(-1)?.getBoundingClientRect();
    const bounds = grid.getBoundingClientRect();

    if (!first || !last) throw new Error(`Expected grid items in ${grid.className}`);

    return {
      centerDelta: Math.abs(last.left + last.width / 2 - (bounds.left + bounds.width / 2)),
      widthDelta: Math.abs(last.width - first.width),
    };
  });

  expect(geometry.centerDelta).toBeLessThanOrEqual(1);
  expect(geometry.widthDelta).toBeLessThanOrEqual(1);
}

async function assertActionBaselines(page: Page, cardSelector: string): Promise<void> {
  const bottoms = await page.locator(cardSelector).evaluateAll((cards) =>
    cards.map((card) => {
      const action = card.querySelector<HTMLElement>(":scope > a, :scope > button");
      if (!action) throw new Error(`Expected a direct action in ${card.className}`);
      return action.getBoundingClientRect().bottom;
    }),
  );

  expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThanOrEqual(1);
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

    await page.getByRole("link", { name: "アリーナ" }).first().click();
    await expect(page).toHaveURL(/\/arena\?theme=mint/);
    await expect(appChrome).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "デッキ" }).first().click();
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
    await expect(page.locator(".mint-page-guide")).toBeVisible({ timeout: 10_000 });
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

  test("Home uses calm 1/2/4-column component breakpoints", async ({ page }) => {
    const cases = [
      { width: 390, menuColumns: 1, onboardingColumns: 1 },
      { width: 760, menuColumns: 2, onboardingColumns: 2 },
      { width: 1200, menuColumns: 4, onboardingColumns: 3 },
    ];

    for (const viewport of cases) {
      await page.setViewportSize({ width: viewport.width, height: 900 });
      await page.goto("/?theme=mint");
      await expect(page.locator(".mint-home-menu-grid")).toBeVisible({ timeout: 10_000 });

      expect(await gridColumnCount(page, ".mint-home-menu-grid")).toBe(viewport.menuColumns);
      expect(await gridColumnCount(page, ".mint-home-onboarding__grid")).toBe(viewport.onboardingColumns);
      await assertNoHorizontalOverflow(page);

      if (viewport.width === 760) {
        await assertCenteredOrphan(page, ".mint-home-onboarding__grid");
      }

      if (viewport.width === 1200) {
        await assertActionBaselines(page, ".mint-home-step");
      }
    }
  });

  test("Start uses centered 1/2/3-column journey steps", async ({ page }) => {
    const cases = [
      { width: 390, columns: 1 },
      { width: 760, columns: 2 },
      { width: 1100, columns: 3 },
    ];

    for (const viewport of cases) {
      await page.setViewportSize({ width: viewport.width, height: 900 });
      await page.goto("/start?theme=mint");
      await expect(page.locator(".mint-start-grid")).toBeVisible({ timeout: 10_000 });

      expect(await gridColumnCount(page, ".mint-start-grid")).toBe(viewport.columns);
      await assertNoHorizontalOverflow(page);

      if (viewport.width === 760) {
        await assertCenteredOrphan(page, ".mint-start-grid");
      }

      if (viewport.width === 1100) {
        await assertActionBaselines(page, ".mint-start-card");
      }
    }
  });

  test("CardBrowser responds to its own width in Nyano and Decks", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });

    await page.goto("/nyano?theme=mint");
    await expect(page.locator(".mint-card-browser")).toBeVisible({ timeout: 15_000 });
    const nyanoWidth = await page.locator(".mint-card-browser").evaluate((element) => element.getBoundingClientRect().width);
    expect(nyanoWidth).toBeGreaterThanOrEqual(640);
    expect(await gridColumnCount(page, ".mint-card-browser__filters")).toBe(3);
    await assertNoHorizontalOverflow(page);

    await page.goto("/decks?theme=mint");
    await expect(page.locator(".mint-card-browser")).toBeVisible({ timeout: 15_000 });
    const decksWidth = await page.locator(".mint-card-browser").evaluate((element) => element.getBoundingClientRect().width);
    expect(decksWidth).toBeLessThan(640);
    expect(await gridColumnCount(page, ".mint-card-browser__filters")).toBe(1);
    await assertNoHorizontalOverflow(page);
  });

  test("Decks filter preset keeps URL sync via df param", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/decks?theme=mint&df=paper");

    await expect(page.locator(".mint-decks-browser-filter")).toContainText("パー重視");
    await expect(page.getByTestId("decks-filter-paper")).toHaveClass(/mint-decks-filter--active/);

    await page.getByTestId("decks-filter-power").click();
    await expect(page).toHaveURL(/[\?&]df=power/);
    await expect(page.locator(".mint-decks-browser-filter")).toContainText("高エッジ");

    await page.getByTestId("decks-filter-all").click();
    await expect(page).not.toHaveURL(/[\?&]df=/);
    await expect(page.locator(".mint-decks-browser-filter")).toContainText("すべて");

    await page.goto("/decks?theme=mint&df=attacker");
    await expect(page).toHaveURL(/[\?&]df=rock/);
    await expect(page.locator(".mint-decks-browser-filter")).toContainText("グー重視");
  });

  test("390px: Events/Replay/Stream pages keep mint layout reachable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/events?theme=mint");
    await expect(page.locator(".events-page")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".mint-page-guide")).toBeVisible({ timeout: 10_000 });
    await assertNoHorizontalOverflow(page);

    const zParam = encodeTranscriptZ(REPLAY_TRANSCRIPT_JSON);
    await page.goto(`/replay?theme=mint&mode=v2&z=${zParam}`);
    await expect(page.locator(".replay-page")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".mint-board-view--replay")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".mint-page-guide")).toBeVisible({ timeout: 10_000 });
    await assertNoHorizontalOverflow(page);

    await page.goto("/stream?theme=mint");
    await expect(page.locator(".stream-page")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".mint-page-guide")).toBeVisible({ timeout: 10_000 });
    await assertNoHorizontalOverflow(page);
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
    await expect(page.locator('.mint-focus-hand-dock button[aria-label="手を確定"]')).toBeVisible({ timeout: 15_000 });
  });
});
