import type { MatchBoardUi } from "@/features/match/urlParams";

export type ReplayBoardUi = "classic" | "rpg" | "engine";

export function parseReplayBoardUi(v: string | null): ReplayBoardUi {
  if (v === "rpg") return "rpg";
  if (v === "engine") return "engine";
  return "classic";
}

export function toMatchBoardUi(v: ReplayBoardUi): MatchBoardUi {
  if (v === "classic") return "mint";
  return v;
}

export function buildReplayStageUrl(searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams);
  next.set("ui", "engine");
  next.set("focus", "1");
  next.delete("layout");
  const query = next.toString();
  return query ? `/replay-stage?${query}` : "/replay-stage";
}

export function withReplayBoardUi(
  searchParams: URLSearchParams,
  nextUi: ReplayBoardUi,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  if (nextUi === "classic") next.delete("ui");
  else next.set("ui", nextUi);
  if (nextUi !== "engine") {
    next.delete("focus");
    next.delete("layout");
  }
  return next;
}

export function withReplayFocusMode(
  searchParams: URLSearchParams,
  enabled: boolean,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  if (enabled) next.set("focus", "1");
  else next.delete("focus");
  next.delete("layout");
  return next;
}

export function withReplayStepMode(
  searchParams: URLSearchParams,
  mode: string,
  step: number,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.set("mode", mode);
  next.set("step", String(step));
  return next;
}

