import React from "react";
import type { SetURLSearchParams } from "react-router-dom";
import { withReplayFocusMode } from "@/features/match/replayUrlParams";

export function resolveReplayEngineFocusGuardMutation(input: {
  searchParams: URLSearchParams;
  isEngine: boolean;
  isFocusMode: boolean;
}): URLSearchParams | null {
  if (input.isEngine || !input.isFocusMode) return null;
  const next = withReplayFocusMode(input.searchParams, false);
  if (next.toString() === input.searchParams.toString()) return null;
  return next;
}

export function useReplayEngineFocusGuard(input: {
  searchParams: URLSearchParams;
  isEngine: boolean;
  isFocusMode: boolean;
  setSearchParams: SetURLSearchParams;
}) {
  const { searchParams, isEngine, isFocusMode, setSearchParams } = input;

  React.useEffect(() => {
    const next = resolveReplayEngineFocusGuardMutation({
      searchParams,
      isEngine,
      isFocusMode,
    });
    if (!next) return;
    setSearchParams(next, { replace: true });
  }, [isEngine, isFocusMode, searchParams, setSearchParams]);
}
