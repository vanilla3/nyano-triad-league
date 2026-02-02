import { AbiCoder, keccak256 } from "ethers";
import { DEFAULT_RULESET_CONFIG_V1 } from "./engine.js";
import type {
  NyanoTraitDerivationConfigV1,
  RulesetConfigV1,
  TraitEffectsConfigV1,
  TraitType,
} from "./types.js";
import {
  aquaDiagonalMethodToCode,
  derivationSourceToCode,
  traitDerivationSchemeToCode,
  traitTypeToCode,
} from "./codes.js";

const U8_MIN = 0;
const U8_MAX = 255;
const I8_MIN = -128;
const I8_MAX = 127;

function assertIntRange(name: string, v: number, min: number, max: number): void {
  if (!Number.isInteger(v)) throw new Error(`${name} must be an integer: ${v}`);
  if (v < min || v > max) throw new Error(`${name} out of range [${min},${max}]: ${v}`);
}

function u8(name: string, v: number): number {
  assertIntRange(name, v, U8_MIN, U8_MAX);
  return v;
}

function i8(name: string, v: number): number {
  assertIntRange(name, v, I8_MIN, I8_MAX);
  return v;
}

function boolU8(v: boolean): number {
  return v ? 1 : 0;
}

function noneArr(n: number): TraitType[] {
  return Array.from({ length: n }, () => "none");
}

function neutralTraitDerivation(): NyanoTraitDerivationConfigV1 {
  // A neutral mapping that should not affect gameplay when disabled.
  return {
    enabled: false,
    scheme: "nyanoTrait_v1",
    seasonTrait: noneArr(4),
    classTrait: noneArr(5),
    raritySource: ["season", "season", "season", "season", "season"],
    fixedTrait: noneArr(5),
  };
}

function canonicalizeTraitDerivation(td?: NyanoTraitDerivationConfigV1): NyanoTraitDerivationConfigV1 {
  const x = td ?? neutralTraitDerivation();
  if (!x.enabled) {
    // If disabled, ignore all other parameters to avoid "different IDs for same behavior".
    return neutralTraitDerivation();
  }
  if (x.scheme !== "nyanoTrait_v1") throw new Error(`unsupported traitDerivation.scheme: ${x.scheme}`);
  if (x.seasonTrait.length !== 4) throw new Error(`traitDerivation.seasonTrait length must be 4`);
  if (x.classTrait.length !== 5) throw new Error(`traitDerivation.classTrait length must be 5`);
  if (x.raritySource.length !== 5) throw new Error(`traitDerivation.raritySource length must be 5`);
  if (x.fixedTrait.length !== 5) throw new Error(`traitDerivation.fixedTrait length must be 5`);
  return x;
}

function canonicalizeTraitEffects(te: TraitEffectsConfigV1): TraitEffectsConfigV1 {
  if (!te.enabled) {
    return {
      enabled: false,
      cosmic: { enabled: false, cornerTriadPlus: 0 },
      light: { enabled: false, adjacencyTriadPlus: 0, stack: false },
      shadow: { enabled: false },
      forest: { enabled: false, shieldHits: 0 },
      metal: { enabled: false },
      flame: { enabled: false },
      aqua: { enabled: false, diagonalStrengthMethod: "min" },
      thunder: { enabled: false, adjacentEnemyAllTriadDelta: 0 },
      wind: { enabled: false },
      earth: { enabled: false, boost: 0, oppositePenalty: 0, requireChoice: false },
    };
  }
  // When individual traits are disabled, canonicalize their params to remove irrelevant drift.
  return {
    enabled: true,
    cosmic: te.cosmic.enabled
      ? { enabled: true, cornerTriadPlus: te.cosmic.cornerTriadPlus }
      : { enabled: false, cornerTriadPlus: 0 },
    light: te.light.enabled
      ? { enabled: true, adjacencyTriadPlus: te.light.adjacencyTriadPlus, stack: te.light.stack }
      : { enabled: false, adjacencyTriadPlus: 0, stack: false },
    shadow: te.shadow.enabled ? { enabled: true } : { enabled: false },
    forest: te.forest.enabled ? { enabled: true, shieldHits: te.forest.shieldHits } : { enabled: false, shieldHits: 0 },
    metal: te.metal.enabled ? { enabled: true } : { enabled: false },
    flame: te.flame.enabled ? { enabled: true } : { enabled: false },
    aqua: te.aqua.enabled
      ? { enabled: true, diagonalStrengthMethod: te.aqua.diagonalStrengthMethod }
      : { enabled: false, diagonalStrengthMethod: "min" },
    thunder: te.thunder.enabled
      ? { enabled: true, adjacentEnemyAllTriadDelta: te.thunder.adjacentEnemyAllTriadDelta }
      : { enabled: false, adjacentEnemyAllTriadDelta: 0 },
    wind: te.wind.enabled ? { enabled: true } : { enabled: false },
    earth: te.earth.enabled
      ? { enabled: true, boost: te.earth.boost, oppositePenalty: te.earth.oppositePenalty, requireChoice: te.earth.requireChoice }
      : { enabled: false, boost: 0, oppositePenalty: 0, requireChoice: false },
  };
}

/**
 * Compute rulesetId (v1) as Solidity-compatible keccak256 over fixed ABI encoding.
 *
 * Why fixed ABI?
 * - Avoid JSON canonicalization edge cases (key order, number forms, Unicode, etc.)
 * - Keep the path open to an on-chain ruleset registry that can compute the same ID.
 */
export function computeRulesetIdV1(ruleset: RulesetConfigV1): `0x${string}` {
  if (ruleset.version !== 1) throw new Error(`unsupported ruleset.version: ${ruleset.version}`);

  // Canonicalize by deep-merging with DEFAULT_RULESET_CONFIG_V1 (so omitted fields match defaults),
  // then removing irrelevant drift in disabled sections.
  const base = DEFAULT_RULESET_CONFIG_V1;

const merged: RulesetConfigV1 = {
  version: 1,
  tactics: {
    warningMark: { ...base.tactics.warningMark, ...ruleset.tactics.warningMark },
    comboBonus: { ...base.tactics.comboBonus, ...ruleset.tactics.comboBonus },
    secondPlayerBalance: { ...base.tactics.secondPlayerBalance, ...ruleset.tactics.secondPlayerBalance },
  },
  synergy: {
    traitDerivation: ruleset.synergy.traitDerivation ?? base.synergy.traitDerivation,
    traitEffects: {
      ...base.synergy.traitEffects,
      ...ruleset.synergy.traitEffects,
      cosmic: { ...base.synergy.traitEffects.cosmic, ...ruleset.synergy.traitEffects.cosmic },
      light: { ...base.synergy.traitEffects.light, ...ruleset.synergy.traitEffects.light },
      shadow: { ...base.synergy.traitEffects.shadow, ...ruleset.synergy.traitEffects.shadow },
      forest: { ...base.synergy.traitEffects.forest, ...ruleset.synergy.traitEffects.forest },
      metal: { ...base.synergy.traitEffects.metal, ...ruleset.synergy.traitEffects.metal },
      flame: { ...base.synergy.traitEffects.flame, ...ruleset.synergy.traitEffects.flame },
      aqua: { ...base.synergy.traitEffects.aqua, ...ruleset.synergy.traitEffects.aqua },
      thunder: { ...base.synergy.traitEffects.thunder, ...ruleset.synergy.traitEffects.thunder },
      wind: { ...base.synergy.traitEffects.wind, ...ruleset.synergy.traitEffects.wind },
      earth: { ...base.synergy.traitEffects.earth, ...ruleset.synergy.traitEffects.earth },
    },
    formationBonuses: {
      ...base.synergy.formationBonuses,
      ...ruleset.synergy.formationBonuses,
      fiveElementsHarmony: {
        ...base.synergy.formationBonuses.fiveElementsHarmony,
        ...ruleset.synergy.formationBonuses.fiveElementsHarmony,
      },
      eclipse: { ...base.synergy.formationBonuses.eclipse, ...ruleset.synergy.formationBonuses.eclipse },
    },
  },
};

  // --- TACTICS ---
  const wm = merged.tactics.warningMark;
  const warningEnabled = wm.enabled;
  const warning = warningEnabled
    ? {
        enabled: 1,
        maxUsesPerPlayer: u8("warningMark.maxUsesPerPlayer", wm.maxUsesPerPlayer),
        secondExtraUses: u8("warningMark.secondPlayerExtraUses", wm.secondPlayerExtraUses),
        penaltyAllTriad: i8("warningMark.penaltyAllTriad", wm.penaltyAllTriad),
        edgeMin: u8("warningMark.edgeMin", wm.edgeMin),
      }
    : { enabled: 0, maxUsesPerPlayer: 0, secondExtraUses: 0, penaltyAllTriad: 0, edgeMin: 0 };

  const cb = merged.tactics.comboBonus;
  const comboEnabled = cb.enabled;
  const combo = comboEnabled
    ? {
        enabled: 1,
        momentumAt: u8("comboBonus.momentumAt", cb.momentumAt),
        dominationAt: u8("comboBonus.dominationAt", cb.dominationAt),
        feverAt: u8("comboBonus.feverAt", cb.feverAt),
        momentumTriadPlus: u8("comboBonus.momentumTriadPlus", cb.momentumTriadPlus),
        dominationTriadPlus: u8("comboBonus.dominationTriadPlus", cb.dominationTriadPlus),
      }
    : { enabled: 0, momentumAt: 0, dominationAt: 0, feverAt: 0, momentumTriadPlus: 0, dominationTriadPlus: 0 };

  const spb = merged.tactics.secondPlayerBalance;
  const spbEnabled = spb.enabled;
  const secondBalance = spbEnabled
    ? { enabled: 1, firstMoveTriadPlus: u8("secondPlayerBalance.firstMoveTriadPlus", spb.firstMoveTriadPlus) }
    : { enabled: 0, firstMoveTriadPlus: 0 };

  // --- SYNERGY ---
  const td = canonicalizeTraitDerivation(merged.synergy.traitDerivation);
  const tdEnabled = td.enabled;

  const tdEnabledU8 = tdEnabled ? 1 : 0;
  const tdSchemeU8 = tdEnabled ? u8("traitDerivation.scheme", traitDerivationSchemeToCode(td.scheme)) : 0;

  const tdSeasonTrait = tdEnabled ? td.seasonTrait.map(traitTypeToCode) : [0, 0, 0, 0];
  const tdClassTrait = tdEnabled ? td.classTrait.map(traitTypeToCode) : [0, 0, 0, 0, 0];
  const tdRaritySource = tdEnabled ? td.raritySource.map(derivationSourceToCode) : [0, 0, 0, 0, 0];
  const tdFixedTrait = tdEnabled ? td.fixedTrait.map(traitTypeToCode) : [0, 0, 0, 0, 0];

  const te = canonicalizeTraitEffects(merged.synergy.traitEffects);

  const fbMerged = merged.synergy.formationBonuses;
  const fbEnabled = fbMerged.enabled;
  const fb = fbEnabled
    ? {
        enabled: 1,
        fiveElements: fbMerged.fiveElementsHarmony.enabled
          ? {
              enabled: 1,
              comboBonusScale: u8("fiveElementsHarmony.comboBonusScale", fbMerged.fiveElementsHarmony.comboBonusScale),
              requiredElements: (() => {
                const elems = fbMerged.fiveElementsHarmony.requiredElements;
                if (elems.length !== 5) throw new Error(`fiveElementsHarmony.requiredElements must have length 5`);
                const codes = elems.map(traitTypeToCode).sort((a, b) => a - b); // treat as a set
                return codes;
              })(),
            }
          : { enabled: 0, comboBonusScale: 0, requiredElements: [0, 0, 0, 0, 0] },
        eclipse: fbMerged.eclipse.enabled
          ? {
              enabled: 1,
              lightAlsoIgnoresWarningMark: boolU8(fbMerged.eclipse.lightAlsoIgnoresWarningMark),
              shadowCountsAsLightSource: boolU8(fbMerged.eclipse.shadowCountsAsLightSource),
            }
          : { enabled: 0, lightAlsoIgnoresWarningMark: 0, shadowCountsAsLightSource: 0 },
      }
    : {
        enabled: 0,
        fiveElements: { enabled: 0, comboBonusScale: 0, requiredElements: [0, 0, 0, 0, 0] },
        eclipse: { enabled: 0, lightAlsoIgnoresWarningMark: 0, shadowCountsAsLightSource: 0 },
      };

  // Validate common numeric ranges for trait effects when enabled.
  const teEnabledU8 = te.enabled ? 1 : 0;
  const cosmicCornerPlus = te.cosmic.enabled ? u8("traitEffects.cosmic.cornerTriadPlus", te.cosmic.cornerTriadPlus) : 0;
  const lightAdjPlus = te.light.enabled ? u8("traitEffects.light.adjacencyTriadPlus", te.light.adjacencyTriadPlus) : 0;
  const forestHits = te.forest.enabled ? u8("traitEffects.forest.shieldHits", te.forest.shieldHits) : 0;
  const aquaMethod = te.aqua.enabled ? u8("traitEffects.aqua.diagonalStrengthMethod", aquaDiagonalMethodToCode(te.aqua.diagonalStrengthMethod)) : 0;
  const thunderDelta = te.thunder.enabled ? i8("traitEffects.thunder.adjacentEnemyAllTriadDelta", te.thunder.adjacentEnemyAllTriadDelta) : 0;
  const earthBoost = te.earth.enabled ? u8("traitEffects.earth.boost", te.earth.boost) : 0;
  const earthPenalty = te.earth.enabled ? i8("traitEffects.earth.oppositePenalty", te.earth.oppositePenalty) : 0;

  const coder = AbiCoder.defaultAbiCoder();

  const encoded = coder.encode(
    [
      // version
      "uint8",

      // tactics.warningMark
      "uint8",
      "uint8",
      "uint8",
      "int8",
      "uint8",

      // tactics.comboBonus
      "uint8",
      "uint8",
      "uint8",
      "uint8",
      "uint8",
      "uint8",

      // tactics.secondPlayerBalance
      "uint8",
      "uint8",

      // synergy.traitDerivation (Nyano mapping)
      "uint8",
      "uint8",
      "uint8[4]",
      "uint8[5]",
      "uint8[5]",
      "uint8[5]",

      // synergy.traitEffects
      "uint8",

      // cosmic
      "uint8",
      "uint8",

      // light
      "uint8",
      "uint8",
      "uint8",

      // shadow
      "uint8",

      // forest
      "uint8",
      "uint8",

      // metal
      "uint8",

      // flame
      "uint8",

      // aqua
      "uint8",
      "uint8",

      // thunder
      "uint8",
      "int8",

      // wind
      "uint8",

      // earth
      "uint8",
      "uint8",
      "int8",
      "uint8",

      // formationBonuses
      "uint8",

      // five elements
      "uint8",
      "uint8",
      "uint8[5]",

      // eclipse
      "uint8",
      "uint8",
      "uint8",
    ],
    [
      // version
      1,

      // warning mark
      warning.enabled,
      warning.maxUsesPerPlayer,
      warning.secondExtraUses,
      warning.penaltyAllTriad,
      warning.edgeMin,

      // combo bonus
      combo.enabled,
      combo.momentumAt,
      combo.dominationAt,
      combo.feverAt,
      combo.momentumTriadPlus,
      combo.dominationTriadPlus,

      // second player balance
      secondBalance.enabled,
      secondBalance.firstMoveTriadPlus,

      // trait derivation
      tdEnabledU8,
      tdSchemeU8,
      tdSeasonTrait,
      tdClassTrait,
      tdRaritySource,
      tdFixedTrait,

      // trait effects enabled
      teEnabledU8,

      // cosmic
      boolU8(te.cosmic.enabled),
      cosmicCornerPlus,

      // light
      boolU8(te.light.enabled),
      lightAdjPlus,
      boolU8(te.light.enabled ? te.light.stack : false),

      // shadow
      boolU8(te.shadow.enabled),

      // forest
      boolU8(te.forest.enabled),
      forestHits,

      // metal
      boolU8(te.metal.enabled),

      // flame
      boolU8(te.flame.enabled),

      // aqua
      boolU8(te.aqua.enabled),
      aquaMethod,

      // thunder
      boolU8(te.thunder.enabled),
      thunderDelta,

      // wind
      boolU8(te.wind.enabled),

      // earth
      boolU8(te.earth.enabled),
      earthBoost,
      earthPenalty,
      boolU8(te.earth.enabled ? te.earth.requireChoice : false),

      // formation bonuses enabled
      fb.enabled,

      // five elements
      fb.fiveElements.enabled,
      fb.fiveElements.comboBonusScale,
      fb.fiveElements.requiredElements,

      // eclipse
      fb.eclipse.enabled,
      fb.eclipse.lightAlsoIgnoresWarningMark,
      fb.eclipse.shadowCountsAsLightSource,
    ]
  );

  return keccak256(encoded) as `0x${string}`;
}
