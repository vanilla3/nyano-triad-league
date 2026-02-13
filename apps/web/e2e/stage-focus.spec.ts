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

  test("/battle-stage falls back to mint board when WebGL is unavailable", async ({ page }) => {
    await page.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (contextId: string, options?: unknown) {
        if (typeof contextId === "string" && contextId.toLowerCase().includes("webgl")) {
          return null;
        }
        return originalGetContext.call(this, contextId, options);
      };
    });

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
    const fallbackBanner = page.getByText(/Pixi renderer is unavailable\./).first();
    if (await fallbackBanner.isVisible().catch(() => false)) {
      // WebGL/dynamic-chunk fallback path: keep visibility guarantee.
      await expect(commitButton).toBeVisible();
    } else {
      await expect(commitButton).toBeInViewport();
    }

    const overflowPx = await readHorizontalOverflowPx(page);
    expect(overflowPx).toBeLessThanOrEqual(1);
  });

  test("/replay-stage keeps recovery controls when replay load fails", async ({ page }) => {
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
    await expect(page.getByText(/フォールバック用のゲストカードで続行します。/).first()).toBeVisible({ timeout: 10_000 });
  });
});
