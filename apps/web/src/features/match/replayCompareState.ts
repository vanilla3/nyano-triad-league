import type { BoardCell } from "@nyano/triad-engine";

export function resolveReplayCompareMode(input: {
  simOk: boolean;
  mode: string;
  resolvedRuleset: unknown | null;
  rulesetId: string | null;
  shouldAutoCompareByRulesetId: (rulesetId: string) => boolean;
}): boolean {
  if (!input.simOk) return false;
  if (input.mode === "compare") return true;
  if (input.mode !== "auto") return false;
  if (input.resolvedRuleset !== null) return false;
  if (!input.rulesetId) return false;
  return input.shouldAutoCompareByRulesetId(input.rulesetId);
}

export function resolveReplayCompareDiverged(input: {
  simOk: boolean;
  v1Board: ReadonlyArray<BoardCell | null> | null;
  v2Board: ReadonlyArray<BoardCell | null> | null;
  boardEquals: (
    a: ReadonlyArray<BoardCell | null>,
    b: ReadonlyArray<BoardCell | null>,
  ) => boolean;
}): boolean {
  if (!input.simOk || !input.v1Board || !input.v2Board) return false;
  return !input.boardEquals(input.v1Board, input.v2Board);
}
