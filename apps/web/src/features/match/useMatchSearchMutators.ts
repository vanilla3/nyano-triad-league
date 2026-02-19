import React from "react";
import type { NavigateFunction, SetURLSearchParams } from "react-router-dom";
import { applySearchParamPatch } from "@/lib/first_player_params";
import { withMatchParamCompatibility } from "@/features/match/urlParams";
import { withMatchFocusMode } from "@/features/match/matchUrlParams";

type UseMatchSearchMutatorsInput = {
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  navigate: NavigateFunction;
  isBattleStageRoute: boolean;
};

export function useMatchSearchMutators(input: UseMatchSearchMutatorsInput) {
  const { searchParams, setSearchParams, navigate, isBattleStageRoute } = input;

  const setParam = React.useCallback((key: string, value: string) => {
    const next = withMatchParamCompatibility(searchParams, key, value);
    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const setParams = React.useCallback((updates: Record<string, string | undefined>) => {
    const { next, changed } = applySearchParamPatch(searchParams, updates);
    if (!changed) return;
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const setFocusMode = React.useCallback((enabled: boolean) => {
    const next = withMatchFocusMode(searchParams, enabled);
    if (!enabled && isBattleStageRoute) {
      const query = next.toString();
      navigate(query ? `/match?${query}` : "/match", { replace: true });
      return;
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, isBattleStageRoute, navigate]);

  return {
    setParam,
    setParams,
    setFocusMode,
  };
}
