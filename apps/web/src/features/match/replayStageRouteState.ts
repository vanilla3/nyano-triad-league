import React from "react";
import { buildReplayStageUrl } from "@/features/match/replayUrlParams";

export function isReplayStagePathname(pathname: string): boolean {
  return /\/replay-stage$/.test(pathname);
}

export function resolveIsReplayStageFocusRoute(input: {
  pathname: string;
  isEngineFocus: boolean;
}): boolean {
  return isReplayStagePathname(input.pathname) && input.isEngineFocus;
}

export function resolveReplayStageRouteState(input: {
  pathname: string;
  searchParams: URLSearchParams;
  isEngineFocus: boolean;
}): {
  stageReplayUrl: string;
  isReplayStageRoute: boolean;
  isStageFocusRoute: boolean;
} {
  const isReplayStageRoute = isReplayStagePathname(input.pathname);
  return {
    stageReplayUrl: buildReplayStageUrl(input.searchParams),
    isReplayStageRoute,
    isStageFocusRoute: isReplayStageRoute && input.isEngineFocus,
  };
}

export function useReplayStageRouteState(input: {
  pathname: string;
  searchParams: URLSearchParams;
  isEngineFocus: boolean;
}): {
  stageReplayUrl: string;
  isReplayStageRoute: boolean;
  isStageFocusRoute: boolean;
} {
  return React.useMemo(
    () =>
      resolveReplayStageRouteState({
        pathname: input.pathname,
        searchParams: input.searchParams,
        isEngineFocus: input.isEngineFocus,
      }),
    [input.pathname, input.searchParams, input.isEngineFocus],
  );
}
