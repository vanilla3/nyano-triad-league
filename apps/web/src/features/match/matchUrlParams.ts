import type { MatchBoardUi } from "@/features/match/urlParams";

export function buildMatchStageUrl(searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams);
  next.set("ui", "engine");
  next.set("focus", "1");
  next.delete("layout");
  const query = next.toString();
  return query ? `/battle-stage?${query}` : "/battle-stage";
}

export function withMatchBoardUi(
  searchParams: URLSearchParams,
  nextUi: MatchBoardUi,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.set("ui", nextUi);
  if (nextUi !== "engine") {
    next.delete("focus");
    next.delete("layout");
  }
  return next;
}

export function withMatchFocusMode(
  searchParams: URLSearchParams,
  enabled: boolean,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  if (enabled) next.set("focus", "1");
  else next.delete("focus");
  next.delete("layout");
  return next;
}

export function withoutMatchEvent(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.delete("event");
  return next;
}
