import React from "react";
import type { NavigateFunction, SetURLSearchParams } from "react-router-dom";
import { type ReplayBoardUi, withReplayBoardUi, withReplayFocusMode } from "@/features/match/replayUrlParams";

type UseReplaySearchMutatorsInput = {
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  navigate: NavigateFunction;
  isReplayStageRoute: boolean;
};

type ReplayFocusModeMutation =
  | { kind: "navigate"; to: string }
  | { kind: "search"; next: URLSearchParams }
  | { kind: "noop" };

export function resolveReplayBoardUiMutation(input: {
  searchParams: URLSearchParams;
  nextUi: ReplayBoardUi;
}): URLSearchParams | null {
  const next = withReplayBoardUi(input.searchParams, input.nextUi);
  if (next.toString() === input.searchParams.toString()) return null;
  return next;
}

export function resolveReplayFocusModeMutation(input: {
  searchParams: URLSearchParams;
  enabled: boolean;
  isReplayStageRoute: boolean;
}): ReplayFocusModeMutation {
  const next = withReplayFocusMode(input.searchParams, input.enabled);
  if (!input.enabled && input.isReplayStageRoute) {
    const query = next.toString();
    return { kind: "navigate", to: query ? `/replay?${query}` : "/replay" };
  }
  if (next.toString() === input.searchParams.toString()) {
    return { kind: "noop" };
  }
  return { kind: "search", next };
}

export function useReplaySearchMutators(input: UseReplaySearchMutatorsInput) {
  const { searchParams, setSearchParams, navigate, isReplayStageRoute } = input;

  const setReplayBoardUi = React.useCallback((nextUi: ReplayBoardUi) => {
    const next = resolveReplayBoardUiMutation({
      searchParams,
      nextUi,
    });
    if (!next) return;
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const setFocusMode = React.useCallback((enabled: boolean) => {
    const mutation = resolveReplayFocusModeMutation({
      searchParams,
      enabled,
      isReplayStageRoute,
    });
    if (mutation.kind === "navigate") {
      navigate(mutation.to, { replace: true });
      return;
    }
    if (mutation.kind === "search") {
      setSearchParams(mutation.next, { replace: true });
    }
  }, [searchParams, setSearchParams, isReplayStageRoute, navigate]);

  return {
    setReplayBoardUi,
    setFocusMode,
  };
}
