import type { PlayerIndex } from "@nyano/triad-engine";
import type { AiDifficulty } from "@/lib/ai/nyano_ai";
import { parseChainCapPerTurnParam } from "@/lib/ruleset_meta";
import { parseRulesetKeyOrDefault, type RulesetKey } from "@/lib/ruleset_registry";
import {
  parseFirstPlayerResolutionMode,
  type FirstPlayerResolutionMode,
} from "@/lib/first_player_resolve";

export type OpponentMode = "pvp" | "vs_nyano_ai";
export type MatchBoardUi = "mint" | "engine" | "rpg";
export type MatchDataMode = "fast" | "verified";

const DEFAULT_COMMITTED_MUTUAL_PLAYER_A = "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa";
const DEFAULT_COMMITTED_MUTUAL_PLAYER_B = "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB";

export function parseOpponentMode(v: string | null): OpponentMode {
  if (!v) return "pvp";
  if (v === "vs_nyano_ai" || v === "ai" || v === "nyano") return "vs_nyano_ai";
  return "pvp";
}

export function parseAiDifficulty(v: string | null): AiDifficulty {
  if (v === "easy") return "easy";
  if (v === "hard") return "hard";
  if (v === "expert") return "expert";
  return "normal";
}

export function parseFirstPlayer(v: string | null): PlayerIndex {
  return v === "1" ? 1 : 0;
}

export function parseSeason(v: string | null): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function parseBool01(v: string | null, defaultValue: boolean): boolean {
  if (v === "1") return true;
  if (v === "0") return false;
  return defaultValue;
}

export function parseFocusMode(v: string | null): boolean {
  if (!v) return false;
  const normalized = v.toLowerCase();
  return normalized === "1" || normalized === "focus";
}

export function parseMatchBoardUi(v: string | null): MatchBoardUi {
  if (v === "engine") return "engine";
  if (v === "rpg") return "rpg";
  return "mint";
}

export type MatchSearchParamsValues = {
  ui: MatchBoardUi;
  focusParam: string | null;
  isFocusMode: boolean;
  isGuestMode: boolean;
  dataModeParam: MatchDataMode;
  eventId: string;
  deckAId: string;
  deckBId: string;
  opponentModeParam: OpponentMode;
  aiDifficultyParam: AiDifficulty;
  aiAutoPlay: boolean;
  streamMode: boolean;
  streamCtrlParam: string;
  streamControlledSide: PlayerIndex;
  rulesetKeyParam: RulesetKey;
  classicMaskParam: string | null;
  chainCapRawParam: string | null;
  chainCapPerTurnParam: number | null;
  seasonIdParam: number;
  firstPlayerModeParam: FirstPlayerResolutionMode;
  manualFirstPlayerParam: PlayerIndex;
  mutualChoiceAParam: PlayerIndex;
  mutualChoiceBParam: PlayerIndex;
  commitRevealSaltParam: string;
  seedResolutionParam: string;
  committedMutualPlayerAParam: string;
  committedMutualPlayerBParam: string;
  committedMutualNonceAParam: string;
  committedMutualNonceBParam: string;
  committedMutualCommitAParam: string;
  committedMutualCommitBParam: string;
  commitRevealAParam: string;
  commitRevealBParam: string;
  commitRevealCommitAParam: string;
  commitRevealCommitBParam: string;
};

export function parseMatchSearchParams(
  searchParams: URLSearchParams,
): MatchSearchParamsValues {
  const ui = parseMatchBoardUi((searchParams.get("ui") || "").toLowerCase());
  const focusParam = searchParams.get("focus") ?? searchParams.get("layout");
  const streamCtrlParam = (searchParams.get("ctrl") ?? "A").toUpperCase();
  const chainCapRawParam = searchParams.get("ccap");

  return {
    ui,
    focusParam,
    isFocusMode: parseFocusMode(focusParam),
    isGuestMode: searchParams.get("mode") === "guest",
    dataModeParam: (searchParams.get("dm") ?? "fast") as MatchDataMode,
    eventId: searchParams.get("event") ?? "",
    deckAId: searchParams.get("a") ?? "",
    deckBId: searchParams.get("b") ?? "",
    opponentModeParam: parseOpponentMode(searchParams.get("opp")),
    aiDifficultyParam: parseAiDifficulty(searchParams.get("ai")),
    aiAutoPlay: parseBool01(searchParams.get("auto"), true),
    streamMode: parseBool01(searchParams.get("stream"), false),
    streamCtrlParam,
    streamControlledSide: (streamCtrlParam === "B" ? 1 : 0) as PlayerIndex,
    rulesetKeyParam: parseRulesetKeyOrDefault(searchParams.get("rk"), "v2"),
    classicMaskParam: searchParams.get("cr"),
    chainCapRawParam,
    chainCapPerTurnParam: parseChainCapPerTurnParam(chainCapRawParam),
    seasonIdParam: parseSeason(searchParams.get("season")),
    firstPlayerModeParam: parseFirstPlayerResolutionMode(searchParams.get("fpm")),
    manualFirstPlayerParam: parseFirstPlayer(searchParams.get("fp")),
    mutualChoiceAParam: parseFirstPlayer(searchParams.get("fpa")),
    mutualChoiceBParam: parseFirstPlayer(searchParams.get("fpb")),
    commitRevealSaltParam: searchParams.get("fps") ?? "",
    seedResolutionParam: searchParams.get("fpsd") ?? "",
    committedMutualPlayerAParam:
      searchParams.get("fpoa") ?? DEFAULT_COMMITTED_MUTUAL_PLAYER_A,
    committedMutualPlayerBParam:
      searchParams.get("fpob") ?? DEFAULT_COMMITTED_MUTUAL_PLAYER_B,
    committedMutualNonceAParam: searchParams.get("fpna") ?? "",
    committedMutualNonceBParam: searchParams.get("fpnb") ?? "",
    committedMutualCommitAParam: searchParams.get("fcoa") ?? "",
    committedMutualCommitBParam: searchParams.get("fcob") ?? "",
    commitRevealAParam: searchParams.get("fra") ?? "",
    commitRevealBParam: searchParams.get("frb") ?? "",
    commitRevealCommitAParam: searchParams.get("fca") ?? "",
    commitRevealCommitBParam: searchParams.get("fcb") ?? "",
  };
}

export function withMatchParamCompatibility(
  searchParams: URLSearchParams,
  key: string,
  value: string,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  if (!value) next.delete(key);
  else next.set(key, value);

  if (key === "rk") {
    if (value === "classic_custom") {
      if (!next.get("cr")) next.set("cr", "0");
    } else {
      next.delete("cr");
    }
  }

  return next;
}

type ResolveClassicMaskPatchInput = {
  isEvent: boolean;
  rulesetKeyParam: RulesetKey;
  classicMaskParam: string | null;
  classicCustomMaskParam: string;
};

export function resolveClassicMaskParamPatch(
  input: ResolveClassicMaskPatchInput,
): Record<string, string | undefined> | null {
  if (input.isEvent) return null;
  if (input.rulesetKeyParam === "classic_custom") {
    if (input.classicMaskParam === input.classicCustomMaskParam) return null;
    return { cr: input.classicCustomMaskParam };
  }
  if (input.classicMaskParam === null) return null;
  return { cr: undefined };
}
