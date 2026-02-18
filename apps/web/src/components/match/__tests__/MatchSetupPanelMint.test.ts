import { describe, expect, it } from "vitest";

import {
  buildMatchSetupSummaryLine,
  describeFirstPlayerMode,
  describeRulesetKey,
  shouldOpenAdvancedSetup,
} from "../MatchSetupPanelMint.helpers";

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

    expect(line).toContain("Starter A");
    expect(line).toContain("デッキB: イベント固定");
    expect(line).toContain("v2（shadow+tactics）");
    expect(line).toContain("Nyano AI");
    expect(line).toContain("先攻: 手動");
    expect(line).toContain("盤面: mint");
  });

  it("opens advanced setup when stream mode is enabled or mode is non-manual", () => {
    expect(shouldOpenAdvancedSetup({ firstPlayerMode: "manual", streamMode: true, chainCapRawParam: null })).toBe(true);
    expect(shouldOpenAdvancedSetup({ firstPlayerMode: "commit_reveal", streamMode: false, chainCapRawParam: null })).toBe(true);
    expect(shouldOpenAdvancedSetup({ firstPlayerMode: "manual", streamMode: false, chainCapRawParam: "2" })).toBe(true);
    expect(shouldOpenAdvancedSetup({ firstPlayerMode: "manual", streamMode: false, chainCapRawParam: null })).toBe(false);
  });

  it("keeps stable labels for ruleset and first-player mode", () => {
    expect(describeRulesetKey("classic_three_open")).toBe("classic（three open）");
    expect(describeRulesetKey("classic_reverse")).toBe("classic（reverse）");
    expect(describeFirstPlayerMode("committed_mutual_choice")).toBe("相互コミット");
  });
});
