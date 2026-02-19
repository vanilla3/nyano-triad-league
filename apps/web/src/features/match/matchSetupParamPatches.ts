import type { FirstPlayerResolutionMode } from "@/lib/first_player_resolve";
import { randomBytes32Hex } from "@/lib/first_player_resolve";
import { buildFirstPlayerModeCanonicalParamPatch } from "@/lib/first_player_params";
import type { RulesetKey } from "@/lib/ruleset_registry";

export function buildRulesetKeyChangeParamPatch(
  nextKey: RulesetKey,
  classicCustomMaskParam: string,
): { rk: RulesetKey; cr?: string } {
  if (nextKey === "classic_custom") {
    return { rk: nextKey, cr: classicCustomMaskParam };
  }
  return { rk: nextKey, cr: undefined };
}

export function buildClassicMaskChangeParamPatch(nextMask: string): { rk: "classic_custom"; cr: string } {
  return { rk: "classic_custom", cr: nextMask };
}

export function buildFirstPlayerModeChangeParamPatch(
  mode: FirstPlayerResolutionMode,
  current: URLSearchParams,
  deps?: { random?: () => `0x${string}` },
): Record<string, string | undefined> {
  const random = deps?.random ?? randomBytes32Hex;
  return buildFirstPlayerModeCanonicalParamPatch(mode, current, random);
}

