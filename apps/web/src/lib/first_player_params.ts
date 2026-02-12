import type { FirstPlayerResolutionMode } from "./first_player_resolve";

const BYTES32_RE = /^0x[0-9a-fA-F]{64}$/;
const DEFAULT_PLAYER_A = "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa";
const DEFAULT_PLAYER_B = "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB";

function isBytes32Hex(v: string): boolean {
  return BYTES32_RE.test(v);
}

function normalizeChoiceParam(v: string | null): "0" | "1" {
  return v === "1" ? "1" : "0";
}

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

/**
 * Build default param patch for first-player mode initialization.
 *
 * This keeps first open of each mode usable by pre-filling required fields.
 */
export function buildFirstPlayerModeDefaultParamPatch(
  mode: FirstPlayerResolutionMode,
  current: URLSearchParams,
  randomBytes32Hex: () => `0x${string}`,
): Record<string, string | undefined> {
  const patch: Record<string, string | undefined> = {};
  const get = (k: string) => (current.get(k) ?? "").trim();

  if (mode === "manual") {
    patch.fp = normalizeChoiceParam(current.get("fp"));
    return patch;
  }

  if (mode === "mutual") {
    patch.fpa = normalizeChoiceParam(current.get("fpa"));
    patch.fpb = normalizeChoiceParam(current.get("fpb"));
    return patch;
  }

  if (mode === "seed") {
    patch.fps = isBytes32Hex(get("fps")) ? get("fps") : randomBytes32Hex();
    patch.fpsd = isBytes32Hex(get("fpsd")) ? get("fpsd") : randomBytes32Hex();
    return patch;
  }

  if (mode === "commit_reveal") {
    patch.fps = isBytes32Hex(get("fps")) ? get("fps") : randomBytes32Hex();
    patch.fra = isBytes32Hex(get("fra")) ? get("fra") : randomBytes32Hex();
    patch.frb = isBytes32Hex(get("frb")) ? get("frb") : randomBytes32Hex();
    patch.fca = undefined;
    patch.fcb = undefined;
    return patch;
  }

  if (mode === "committed_mutual_choice") {
    patch.fps = isBytes32Hex(get("fps")) ? get("fps") : randomBytes32Hex();
    patch.fpa = normalizeChoiceParam(current.get("fpa"));
    patch.fpb = normalizeChoiceParam(current.get("fpb"));
    patch.fpoa = get("fpoa") || DEFAULT_PLAYER_A;
    patch.fpob = get("fpob") || DEFAULT_PLAYER_B;
    patch.fpna = isBytes32Hex(get("fpna")) ? get("fpna") : randomBytes32Hex();
    patch.fpnb = isBytes32Hex(get("fpnb")) ? get("fpnb") : randomBytes32Hex();
    patch.fcoa = undefined;
    patch.fcob = undefined;
    return patch;
  }

  return patch;
}

/**
 * Build a canonical first-player param patch for a mode.
 *
 * Includes:
 * - mode key normalization (`fpm`)
 * - stale key cleanup
 * - mode-specific default-fill
 */
export function buildFirstPlayerModeCanonicalParamPatch(
  mode: FirstPlayerResolutionMode,
  current: URLSearchParams,
  randomBytes32Hex: () => `0x${string}`,
): Record<string, string | undefined> {
  return {
    fpm: mode,
    ...buildFirstPlayerModeParamPatch(mode),
    ...buildFirstPlayerModeDefaultParamPatch(mode, current, randomBytes32Hex),
  };
}

/**
 * Apply a query patch to search params and report whether something changed.
 */
export function applySearchParamPatch(
  current: URLSearchParams,
  patch: Record<string, string | undefined>,
): { next: URLSearchParams; changed: boolean } {
  const next = new URLSearchParams(current);
  let changed = false;

  for (const [key, value] of Object.entries(patch)) {
    const before = next.get(key);
    if (!value) {
      if (before !== null) {
        next.delete(key);
        changed = true;
      }
      continue;
    }
    if (before !== value) {
      next.set(key, value);
      changed = true;
    }
  }

  return { next, changed };
}
