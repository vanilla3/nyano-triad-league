import { describe, expect, it } from "vitest";

import {
  buildMatchSetupSummaryLine,
  describeFirstPlayerMode,
  describeRulesetKey,
  shouldOpenAdvancedSetup,
} from "../MatchSetupPanelMint.summary";

describe("MatchSetupPanelMint helpers", () => {
  it("builds setup summary line with event deck wording", () => {
    const line = buildMatchSetupSummaryLine({
      deckAName: "Starter A",
      deckBName: "Starter B",
      isEvent: true,
      rulesetKey: "v2",
      opponentMode: "vs_nyano_ai",
      firstPlayerMode: "manual",
      ui: "mint",
    });

    expect(line).toContain("デッキA: Starter A");
    expect(line).toContain("デッキB: イベント固定");
    expect(line).toContain("v2 shadow+tactics");
    expect(line).toContain("対戦相手: Nyano AI");
    expect(line).toContain("先攻: manual");
    expect(line).toContain("盤面: mint");
  });

  it("opens advanced setup when stream mode is enabled or mode is non-manual", () => {
    expect(shouldOpenAdvancedSetup({ firstPlayerMode: "manual", streamMode: true, chainCapRawParam: null })).toBe(true);
    expect(shouldOpenAdvancedSetup({ firstPlayerMode: "commit_reveal", streamMode: false, chainCapRawParam: null })).toBe(true);
    expect(shouldOpenAdvancedSetup({ firstPlayerMode: "manual", streamMode: false, chainCapRawParam: "2" })).toBe(true);
    expect(shouldOpenAdvancedSetup({ firstPlayerMode: "manual", streamMode: false, chainCapRawParam: null })).toBe(false);
  });

  it("keeps stable labels for ruleset and first-player mode", () => {
    expect(describeRulesetKey("classic_three_open")).toBe("classic three open");
    expect(describeFirstPlayerMode("committed_mutual_choice")).toBe("committed mutual");
  });
});
