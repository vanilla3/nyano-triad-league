import type { FirstPlayerResolutionMode } from "@/lib/first_player_resolve";
import type { RulesetKey } from "@/lib/ruleset_registry";

export type MatchSetupOpponentMode = "pvp" | "vs_nyano_ai";
export type MatchSetupBoardUi = "mint" | "engine" | "rpg";

export function describeRulesetKey(rulesetKey: RulesetKey): string {
  switch (rulesetKey) {
    case "v1":
      return "v1 core+tactics";
    case "v2":
      return "v2 shadow+tactics";
    case "full":
      return "full traits+formations";
    case "classic_plus_same":
      return "classic plus+same";
    case "classic_custom":
      return "classic custom";
    case "classic_plus":
      return "classic plus";
    case "classic_same":
      return "classic same";
    case "classic_reverse":
      return "classic reverse";
    case "classic_ace_killer":
      return "classic ace killer";
    case "classic_type_ascend":
      return "classic type ascend";
    case "classic_type_descend":
      return "classic type descend";
    case "classic_order":
      return "classic order";
    case "classic_chaos":
      return "classic chaos";
    case "classic_swap":
      return "classic swap";
    case "classic_all_open":
      return "classic all open";
    case "classic_three_open":
      return "classic three open";
    default:
      return rulesetKey;
  }
}

export function describeRulesetKeyDisplay(rulesetKey: RulesetKey): string {
  switch (rulesetKey) {
    case "v1":
      return "v1 コア+戦術";
    case "v2":
      return "v2 シャドウ+戦術";
    case "full":
      return "full 拡張ルール";
    case "classic_plus_same":
      return "クラシック Plus+Same";
    case "classic_custom":
      return "クラシック カスタム";
    case "classic_plus":
      return "クラシック Plus";
    case "classic_same":
      return "クラシック Same";
    case "classic_reverse":
      return "クラシック Reverse";
    case "classic_ace_killer":
      return "クラシック Ace Killer";
    case "classic_type_ascend":
      return "クラシック Type Ascend";
    case "classic_type_descend":
      return "クラシック Type Descend";
    case "classic_order":
      return "クラシック Order";
    case "classic_chaos":
      return "クラシック Chaos";
    case "classic_swap":
      return "クラシック Swap";
    case "classic_all_open":
      return "クラシック All Open";
    case "classic_three_open":
      return "クラシック Three Open";
    default:
      return describeRulesetKey(rulesetKey);
  }
}


function describeBoardUi(ui: MatchSetupBoardUi): string {
  if (ui === "engine") return "engine";
  if (ui === "rpg") return "rpg";
  return "mint";
}

export function describeFirstPlayerMode(mode: FirstPlayerResolutionMode): string {
  switch (mode) {
    case "manual":
      return "manual";
    case "mutual":
      return "mutual";
    case "committed_mutual_choice":
      return "committed mutual";
    case "seed":
      return "seed";
    case "commit_reveal":
      return "commit reveal";
    default:
      return mode;
  }
}

export function buildMatchSetupSummaryLine(input: {
  deckAName: string | null;
  deckBName: string | null;
  isEvent: boolean;
  rulesetKey: RulesetKey;
  classicRuleTags?: readonly string[];
  opponentMode: MatchSetupOpponentMode;
  firstPlayerMode: FirstPlayerResolutionMode;
  ui: MatchSetupBoardUi;
}): string {
  const deckA = input.deckAName ? `デッキA: ${input.deckAName}` : "デッキA: 未設定";
  const deckB = input.isEvent
    ? "デッキB: イベント固定"
    : input.deckBName
      ? `デッキB: ${input.deckBName}`
      : "デッキB: 未設定";
  const opponent = input.opponentMode === "vs_nyano_ai"
    ? "対戦相手: Nyano AI"
    : "対戦相手: 対人";
  const rulesetSummary = input.rulesetKey === "classic_custom"
    ? input.classicRuleTags && input.classicRuleTags.length > 0
      ? `クラシック カスタム (${input.classicRuleTags.join("+")})`
      : "クラシック カスタム (未選択)"
    : describeRulesetKeyDisplay(input.rulesetKey);
  return [
    deckA,
    deckB,
    `ルール: ${rulesetSummary}`,
    opponent,
    `先手: ${describeFirstPlayerMode(input.firstPlayerMode)}`,
    `盤面: ${describeBoardUi(input.ui)}`,
  ].join(" / ");
}

export function shouldOpenAdvancedSetup(input: {
  firstPlayerMode: FirstPlayerResolutionMode;
  streamMode: boolean;
  chainCapRawParam: string | null;
}): boolean {
  return input.firstPlayerMode !== "manual" || input.streamMode || input.chainCapRawParam !== null;
}
