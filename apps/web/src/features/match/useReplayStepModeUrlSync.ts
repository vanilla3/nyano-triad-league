import React from "react";
import type { SetURLSearchParams } from "react-router-dom";
import { hasReplaySharePayload } from "@/lib/replay_share_params";
import { withReplayStepMode } from "@/features/match/replayUrlParams";

export function resolveReplayStepModeSyncMutation(input: {
  searchParams: URLSearchParams;
  mode: string;
  step: number;
}): URLSearchParams | null {
  if (!hasReplaySharePayload(input.searchParams)) return null;

  const curMode = input.searchParams.get("mode") ?? "auto";
  const curStep = input.searchParams.get("step") ?? "0";
  const nextMode = input.mode;
  const nextStep = String(input.step);

  if (curMode === nextMode && curStep === nextStep) return null;
  return withReplayStepMode(input.searchParams, nextMode, input.step);
}

export function useReplayStepModeUrlSync(input: {
  searchParams: URLSearchParams;
  mode: string;
  step: number;
  setSearchParams: SetURLSearchParams;
}) {
  const { searchParams, mode, step, setSearchParams } = input;

  React.useEffect(() => {
    const next = resolveReplayStepModeSyncMutation({
      searchParams,
      mode,
      step,
    });
    if (!next) return;
    setSearchParams(next, { replace: true });
  }, [mode, step, searchParams, setSearchParams]);
}
