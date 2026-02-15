import { expect, test } from "@playwright/test";
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

async function mockGpuUnavailable(page: import("@playwright/test").Page): Promise<void> {
  await page.addInitScript(() => {
    const shouldDisableContext = (contextId: unknown): boolean =>
      typeof contextId === "string"
      && ["webgl", "webgl2", "webgpu"].some((key) => contextId.toLowerCase().includes(key));

    const patchGetContext = (prototype: { getContext?: (contextId: unknown, options?: unknown) => unknown } | undefined) => {
      if (!prototype || typeof prototype.getContext !== "function") return;
      const original = prototype.getContext;
      prototype.getContext = function (contextId: unknown, options?: unknown) {
        if (shouldDisableContext(contextId)) return null;
        return original.call(this, contextId, options);
      };
    };

    patchGetContext(HTMLCanvasElement.prototype);
    if (typeof OffscreenCanvas !== "undefined") {
      patchGetContext(OffscreenCanvas.prototype);
    }

    try {
      Object.defineProperty(navigator, "gpu", {
        configurable: true,
        value: undefined,
      });
    } catch {
      // ignore readonly navigator fields
    }
  });
}

async function readHorizontalOverflowPx(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(0, root.scrollWidth - root.clientWidth);
  });
}

test.describe("stage routes", () => {
  let pageErrors: string[];

  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });
  });

  test.afterEach(() => {
    expect(pageErrors, "No JS errors on stage routes").toEqual([]);
  });

  test("/battle-stage canonicalizes params and renders focus hand dock", async ({ page }) => {
    await page.goto("/battle-stage?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint&layout=focus&fpm=manual&fp=0");

    await expect.poll(() => new URL(page.url()).searchParams.get("ui")).toBe("engine");
    await expect.poll(() => new URL(page.url()).searchParams.get("focus")).toBe("1");
    await expect.poll(() => new URL(page.url()).searchParams.has("layout")).toBe(false);

    await expect(page.getByText("Hand Dock")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Commit move from focus hand dock")).toBeVisible({ timeout: 10_000 });
  });

  test("/battle-stage keeps dock commit action visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/battle-stage?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=engine&focus=1&fpm=manual&fp=0");

    const dockCommitVisible = page.locator('button[aria-label="Commit move from focus hand dock"]:visible').first();
    await expect(dockCommitVisible).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Focus dock warning mark cell")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Battle focus toolbar hint")).toHaveCount(0);

    const retryPixiButton = page.getByLabel("Retry Pixi renderer");
    if (!(await retryPixiButton.isVisible().catch(() => false))) {
      const board = page.getByLabel("Game board (engine renderer)");
      await expect(board).toBeVisible({ timeout: 10_000 });
      await expect(board).toBeInViewport();
    }

    const overflowPx = await readHorizontalOverflowPx(page);
    expect(overflowPx).toBeLessThanOrEqual(1);
  });

  test("/battle-stage keeps commentary/status stack above board and hand dock", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/battle-stage?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=engine&focus=1&fpm=manual&fp=0");

    const announcer = page.locator(".stage-focus-announcer-stack").first();
    const boardShell = page.locator(".stage-focus-board-shell").first();
    const handDock = page.locator(".mint-focus-hand-dock--stage").first();

    await expect(announcer).toBeVisible({ timeout: 10_000 });
    await expect(boardShell).toBeVisible({ timeout: 10_000 });
    await expect(handDock).toBeVisible({ timeout: 10_000 });

    const verticalOrder = await page.evaluate(() => {
      const announcerEl = document.querySelector<HTMLElement>(".stage-focus-announcer-stack");
      const boardShellEl = document.querySelector<HTMLElement>(".stage-focus-board-shell");
      const handDockEl = document.querySelector<HTMLElement>(".mint-focus-hand-dock--stage");
      if (!announcerEl || !boardShellEl || !handDockEl) return null;
      const announcerRect = announcerEl.getBoundingClientRect();
      const boardRect = boardShellEl.getBoundingClientRect();
      const dockRect = handDockEl.getBoundingClientRect();
      return {
        announcerAboveBoard: announcerRect.bottom <= boardRect.top + 2,
        announcerAboveDock: announcerRect.bottom <= dockRect.top + 2,
        boardAboveDock: boardRect.bottom <= dockRect.top + 2,
        boardBottom: boardRect.bottom,
        dockTop: dockRect.top,
        overlapPx: boardRect.bottom - dockRect.top,
      };
    });

    expect(verticalOrder).not.toBeNull();
    expect(verticalOrder?.announcerAboveBoard).toBe(true);
    expect(verticalOrder?.announcerAboveDock).toBe(true);
    expect(verticalOrder?.boardAboveDock, JSON.stringify(verticalOrder)).toBe(true);
  });

  test("/battle-stage keeps focus toolbar visible after scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 680 });
    await page.goto("/battle-stage?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=engine&focus=1&fpm=manual&fp=0");

    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });

    const toolbar = page.getByRole("region", { name: "Stage focus toolbar" });
    await expect(toolbar).toBeVisible({ timeout: 10_000 });
    await expect(toolbar).toBeInViewport();
  });

  test("/battle-stage supports stage keyboard shortcuts", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/battle-stage?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=engine&focus=1&fpm=manual&fp=0");
    const actionFeedback = page.getByLabel("Battle focus action feedback");

    await expect(page.getByRole("button", { name: "Show HUD" })).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("h");
    await expect(page.getByRole("button", { name: "Hide HUD" })).toBeVisible({ timeout: 10_000 });
    await expect(actionFeedback).toContainText("HUD shown");

    await expect(page.getByRole("button", { name: "Hide Controls" })).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("c");
    await expect(page.getByRole("button", { name: "Show Controls" })).toBeVisible({ timeout: 10_000 });
    await expect(actionFeedback).toContainText("Controls hidden");

    await page.keyboard.press("Escape");
    await expect.poll(() => new URL(page.url()).pathname).toBe("/match");
    await expect.poll(() => new URL(page.url()).searchParams.get("focus")).toBeNull();
  });

  test("/battle-stage falls back to mint board when WebGL is unavailable", async ({ page }) => {
    await mockGpuUnavailable(page);

    await page.goto("/battle-stage?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=engine&focus=1&fpm=manual&fp=0");

    await expect(page.getByText(/Pixi renderer is unavailable\./).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("Retry Pixi renderer")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Commit move from focus hand dock")).toBeVisible({ timeout: 10_000 });
  });

  test("/replay-stage canonicalizes params and shows focus guard without transcript", async ({ page }) => {
    await page.goto("/replay-stage?ui=mint&layout=focus");

    await expect.poll(() => new URL(page.url()).searchParams.get("ui")).toBe("engine");
    await expect.poll(() => new URL(page.url()).searchParams.get("focus")).toBe("1");
    await expect.poll(() => new URL(page.url()).searchParams.has("layout")).toBe(false);

    await expect(page.getByText("Pixi focus needs a loaded replay")).toBeVisible({ timeout: 10_000 });
  });

  test("/replay-stage keeps top transport actions visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const zParam = encodeTranscriptZ(REPLAY_TRANSCRIPT_JSON);
    await page.goto(`/replay-stage?ui=engine&focus=1&mode=v2&z=${zParam}`);

    const loadReplayButton = page.getByRole("button", { name: "Load replay" });
    if (await loadReplayButton.count()) {
      await loadReplayButton.first().click();
    }

    const toolbarPlayButton = page.getByLabel("Play replay from focus toolbar");
    await expect(toolbarPlayButton).toBeVisible({ timeout: 10_000 });
    await expect(toolbarPlayButton).toBeInViewport();
    await expect(page.getByLabel("Replay focus toolbar hint")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Next highlight from focus toolbar")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Replay highlight status in focus toolbar")).toBeVisible({ timeout: 10_000 });

    const overflowPx = await readHorizontalOverflowPx(page);
    expect(overflowPx).toBeLessThanOrEqual(1);
  });

  test("/replay-stage keeps focus toolbar visible after scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 680 });
    const zParam = encodeTranscriptZ(REPLAY_TRANSCRIPT_JSON);
    await page.goto(`/replay-stage?ui=engine&focus=1&mode=v2&z=${zParam}`);

    const loadReplayButton = page.getByRole("button", { name: "Load replay" });
    if (await loadReplayButton.count()) {
      await loadReplayButton.first().click();
    }

    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });

    const toolbar = page.getByRole("region", { name: "Replay focus toolbar" });
    await expect(toolbar).toBeVisible({ timeout: 10_000 });
    await expect(toolbar).toBeInViewport();
  });

  test("/replay-stage supports stage keyboard shortcuts", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const zParam = encodeTranscriptZ(REPLAY_TRANSCRIPT_JSON);
    await page.goto(`/replay-stage?ui=engine&focus=1&mode=v2&z=${zParam}`);

    const loadReplayButton = page.getByRole("button", { name: "Load replay" });
    if (await loadReplayButton.count()) {
      await loadReplayButton.first().click();
    }
    const actionFeedback = page.getByLabel("Replay focus action feedback");

    await expect(page.getByRole("button", { name: "Hide controls" })).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("c");
    await expect(page.getByRole("button", { name: "Show controls" })).toBeVisible({ timeout: 10_000 });
    await expect(actionFeedback).toContainText("Controls hidden");

    await page.keyboard.press("s");
    await expect(page.getByText("Replay from transcript")).toBeVisible({ timeout: 10_000 });
    await expect(actionFeedback).toContainText("Setup shown");

    await page.keyboard.press("Escape");
    await expect.poll(() => new URL(page.url()).pathname).toBe("/replay");
    await expect.poll(() => new URL(page.url()).searchParams.get("focus")).toBeNull();
  });

  test("/replay-stage falls back to mint board when WebGL is unavailable", async ({ page }) => {
    await mockGpuUnavailable(page);

    const zParam = encodeTranscriptZ(REPLAY_TRANSCRIPT_JSON);
    await page.goto(`/replay-stage?ui=engine&focus=1&mode=v2&z=${zParam}`);

    const loadReplayButton = page.getByRole("button", { name: "Load replay" });
    if (await loadReplayButton.count()) {
      await loadReplayButton.first().click();
    }

    await expect(page.getByText(/Pixi renderer is unavailable\./).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("Retry Pixi renderer in replay")).toBeVisible({ timeout: 10_000 });
  });

  test("/replay-stage hides transport controls by default on mobile and allows toggle", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const zParam = encodeTranscriptZ(REPLAY_TRANSCRIPT_JSON);
    await page.goto(`/replay-stage?ui=engine&focus=1&z=${zParam}`);

    await expect(page.getByText("Replay controls are hidden for board focus.")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Show controls" }).click();
    await expect(page.getByLabel("Replay speed")).toBeVisible({ timeout: 10_000 });
  });

  test("/battle-stage keeps commit control in viewport on 375px width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/battle-stage?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=engine&focus=1&fpm=manual&fp=0");

    const commitButton = page.getByLabel("Commit move from focus hand dock");
    await expect(commitButton).toBeVisible({ timeout: 10_000 });
    const retryPixiButton = page.getByLabel("Retry Pixi renderer");
    await expect
      .poll(async () => {
        if (await retryPixiButton.isVisible().catch(() => false)) {
          // WebGL/dynamic-chunk fallback path: keep visibility guarantee.
          return true;
        }
        return commitButton.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const visibleHeight = Math.max(
            0,
            Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0),
          );
          return visibleHeight > 0;
        });
      })
      .toBe(true);

    const overflowPx = await readHorizontalOverflowPx(page);
    expect(overflowPx).toBeLessThanOrEqual(1);
  });

  test("/replay-stage keeps recovery controls when replay load fails", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("nyano.gameIndex.v1");
        localStorage.removeItem("nytl.rpc.user");
        localStorage.removeItem("nytl.rpc.lastOk");
      } catch {
        // ignore
      }
    });
    await page.route("**/game/index.v1.json", (route) => route.abort());
    await page.route("**/*publicnode*", (route) => route.abort());
    await page.route("**/*ankr*", (route) => route.abort());
    await page.route("**/*llamarpc*", (route) => route.abort());
    await page.route("**/*cloudflare*", (route) => route.abort());

    const zParam = encodeTranscriptZ(REPLAY_TRANSCRIPT_JSON);
    await page.goto(`/replay-stage?ui=engine&focus=1&z=${zParam}`);

    const loadReplayButton = page.getByRole("button", { name: "Load replay" });
    await expect(loadReplayButton).toBeVisible({ timeout: 10_000 });
    await loadReplayButton.click();

    await expect(page.getByText("Error:").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Retry load" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Clear share params" })).toBeVisible({ timeout: 10_000 });
  });

  test("/battle-stage guest mode falls back when game index load fails", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("nyano.gameIndex.v1");
      } catch {
        // ignore
      }
    });
    await page.route("**/game/index.v1.json", (route) => route.abort());

    await page.goto("/battle-stage?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=engine&focus=1&fpm=manual&fp=0");

    await expect(page.getByLabel("Commit move from focus hand dock")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Focus hand card 1")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("region", { name: "Stage focus toolbar" })).toBeVisible({ timeout: 10_000 });
  });
});
