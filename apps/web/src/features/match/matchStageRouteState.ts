import React from "react";
import { buildMatchStageUrl } from "@/features/match/matchUrlParams";

export function isBattleStagePathname(pathname: string): boolean {
  return /\/battle-stage$/.test(pathname);
}

export function resolveIsStageFocusRoute(input: {
  pathname: string;
  isEngineFocus: boolean;
}): boolean {
  return isBattleStagePathname(input.pathname) && input.isEngineFocus;
}

export function resolveMatchStageRouteState(input: {
  pathname: string;
  searchParams: URLSearchParams;
  isEngineFocus: boolean;
}): {
  stageMatchUrl: string;
  isBattleStageRoute: boolean;
  isStageFocusRoute: boolean;
} {
  const isBattleStageRoute = isBattleStagePathname(input.pathname);
  return {
    stageMatchUrl: buildMatchStageUrl(input.searchParams),
    isBattleStageRoute,
    isStageFocusRoute: isBattleStageRoute && input.isEngineFocus,
  };
}

export function useMatchStageRouteState(input: {
  pathname: string;
  searchParams: URLSearchParams;
  isEngineFocus: boolean;
}): {
  stageMatchUrl: string;
  isBattleStageRoute: boolean;
  isStageFocusRoute: boolean;
} {
  return React.useMemo(
    () =>
      resolveMatchStageRouteState({
        pathname: input.pathname,
        searchParams: input.searchParams,
        isEngineFocus: input.isEngineFocus,
      }),
    [input.pathname, input.searchParams, input.isEngineFocus],
  );
}
