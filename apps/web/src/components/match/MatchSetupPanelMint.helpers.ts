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
  const deckA = input.deckAName ?? "Deck A: unset";
  const deckB = input.isEvent ? "Deck B: event fixed" : input.deckBName ?? "Deck B: unset";
  const opponent = input.opponentMode === "vs_nyano_ai" ? "Nyano AI" : "Human vs Human";
  const rulesetSummary = input.rulesetKey === "classic_custom"
    ? input.classicRuleTags && input.classicRuleTags.length > 0
      ? `classic custom (${input.classicRuleTags.join("+")})`
      : "classic custom (none)"
    : describeRulesetKey(input.rulesetKey);
  return [
    deckA,
    deckB,
    rulesetSummary,
    opponent,
    `first=${describeFirstPlayerMode(input.firstPlayerMode)}`,
    `board=${describeBoardUi(input.ui)}`,
  ].join(" / ");
}

export function shouldOpenAdvancedSetup(input: {
  firstPlayerMode: FirstPlayerResolutionMode;
  streamMode: boolean;
  chainCapRawParam: string | null;
}): boolean {
  return input.firstPlayerMode !== "manual" || input.streamMode || input.chainCapRawParam !== null;
}
