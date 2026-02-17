import { expect, test } from "@playwright/test";
import { gzipSync } from "node:zlib";

function encodeTranscriptZ(json: string): string {
  const compressed = gzipSync(Buffer.from(json, "utf-8"));
  return compressed.toString("base64url");
}

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

test.describe("Replay ruleset fallback guardrails", () => {
  test("auto mode restores classic rules from rk/cr and shows mismatch warning when rulesetId differs", async ({ page }) => {
    const zParam = encodeTranscriptZ(REPLAY_TRANSCRIPT_JSON);
    await page.goto(`/replay?z=${zParam}&rk=classic_custom&cr=2`);

    await expect(page.getByText("Replay from transcript")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/URL fallback[\(（]classic: reverse[\)）]/).first()).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/(URL classic settings do not match transcript rulesetId\. Replay is using URL fallback rules\.)|(URL の classic 設定が transcript rulesetId と一致しません。URL fallback ルールで再生しています。)/),
    ).toBeVisible({ timeout: 10_000 });
  });
});
