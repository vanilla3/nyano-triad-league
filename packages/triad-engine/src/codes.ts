import type { TraitDerivationSource, TraitType } from "./types.js";

/**
 * Stable numeric codes for deterministic ABI-encoding.
 *
 * IMPORTANT:
 * - Changing codes is a breaking change for rulesetId (and therefore transcripts).
 * - Keep in sync with docs/02_protocol/Nyano_Triad_League_RULESET_ID_SPEC_v1_ja.md
 */

export const TRAIT_TYPE_CODE = {
  none: 0,
  cosmic: 1,
  light: 2,
  shadow: 3,
  forest: 4,
  metal: 5,
  flame: 6,
  aqua: 7,
  thunder: 8,
  wind: 9,
  earth: 10,
} as const satisfies Record<TraitType, number>;

export function traitTypeToCode(t: TraitType): number {
  const v = (TRAIT_TYPE_CODE as Record<string, number>)[t];
  if (v === undefined) throw new Error(`unknown TraitType: ${t}`);
  return v;
}

export const DERIVATION_SOURCE_CODE = {
  season: 0,
  class: 1,
  fixed: 2,
} as const satisfies Record<TraitDerivationSource, number>;

export function derivationSourceToCode(s: TraitDerivationSource): number {
  const v = (DERIVATION_SOURCE_CODE as Record<string, number>)[s];
  if (v === undefined) throw new Error(`unknown TraitDerivationSource: ${s}`);
  return v;
}

export const TRAIT_DERIVATION_SCHEME_CODE = {
  nyanoTrait_v1: 1,
} as const;

export function traitDerivationSchemeToCode(scheme: string): number {
  const v = (TRAIT_DERIVATION_SCHEME_CODE as Record<string, number>)[scheme];
  if (v === undefined) throw new Error(`unknown trait derivation scheme: ${scheme}`);
  return v;
}

export const AQUA_DIAGONAL_METHOD_CODE = {
  min: 0,
  sum: 1,
} as const;

export function aquaDiagonalMethodToCode(m: "min" | "sum"): number {
  const v = (AQUA_DIAGONAL_METHOD_CODE as Record<string, number>)[m];
  if (v === undefined) throw new Error(`unknown aqua diagonal strength method: ${m}`);
  return v;
}
