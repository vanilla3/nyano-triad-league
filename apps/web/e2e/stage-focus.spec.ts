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
});
