import type { FirstPlayerResolutionMode } from "./first_player_resolve";

/**
 * Build query-param updates needed when first-player resolution mode changes.
 *
 * Keep mode-specific parameters and clear unrelated ones to avoid stale state
 * in shared URLs.
 */
export function buildFirstPlayerModeParamPatch(
  mode: FirstPlayerResolutionMode,
): Record<string, string | undefined> {
  switch (mode) {
    case "manual":
      return {
        fpa: undefined,
        fpb: undefined,
        fps: undefined,
        fra: undefined,
        frb: undefined,
        fca: undefined,
        fcb: undefined,
        fpsd: undefined,
        fpoa: undefined,
        fpob: undefined,
        fpna: undefined,
        fpnb: undefined,
        fcoa: undefined,
        fcob: undefined,
      };
    case "mutual":
      return {
        fps: undefined,
        fra: undefined,
        frb: undefined,
        fca: undefined,
        fcb: undefined,
        fpsd: undefined,
        fpoa: undefined,
        fpob: undefined,
        fpna: undefined,
        fpnb: undefined,
        fcoa: undefined,
        fcob: undefined,
      };
    case "seed":
      return {
        fra: undefined,
        frb: undefined,
        fca: undefined,
        fcb: undefined,
        fpoa: undefined,
        fpob: undefined,
        fpna: undefined,
        fpnb: undefined,
        fcoa: undefined,
        fcob: undefined,
      };
    case "commit_reveal":
      return {
        fpsd: undefined,
        fpoa: undefined,
        fpob: undefined,
        fpna: undefined,
        fpnb: undefined,
        fcoa: undefined,
        fcob: undefined,
      };
    case "committed_mutual_choice":
      return {
        fpsd: undefined,
        fra: undefined,
        frb: undefined,
        fca: undefined,
        fcb: undefined,
      };
    default:
      return {};
  }
}

