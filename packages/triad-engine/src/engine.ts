import { AbiCoder, keccak256 } from "ethers";
import { DEFAULT_NYANO_TRAIT_DERIVATION_CONFIG_V1 } from "./nyano.js";
import {
  applyClassicSwapToDecks,
  DEFAULT_CLASSIC_RULES_CONFIG_V1,
  resolveClassicConfig,
  resolveClassicForcedCardIndex,
  resolveClassicSwapIndices,
} from "./classic_rules.js";
import type {
  BoardState,
  CardData,
  CellState,
  ComboEffectName,
  Direction,
  Edges,
  MatchResult,
  MatchResultWithHistory,
  PlayerIndex,
  RulesetConfig,
  RulesetConfigV1,
  RulesetConfigV2,
  TranscriptV1,
  TurnSummary,
  TraitType,
  FormationId,
  FlipTraceV1,
} from "./types.js";

/**
 * Deterministic engine.
 *
 * Layers implemented in TS reference engine:
 * - Layer1 (CORE): triad compare + janken tie-break + chain flips
 * - Layer2 (TACTICS): warning marks, combo bonus, second player balance
 * - Layer3 (SYNERGY): trait effects (v1 subset)
 *
 * Notes:
 * - No RNG.
 * - No blockchain calls inside: callers provide card data (incl. trait if needed).
 */

const BOARD_SIZE = 3;
const NONE_U8 = 255;
const EDGE_MAX = 10;


type SimulateMatchOptions = { boardHistory?: BoardState[] };

function cloneBoardState(board: BoardState): BoardState {
  return board.map((cell) => {
    if (!cell) return null;
    return {
      owner: cell.owner,
      card: {
        ...cell.card,
        edges: { ...cell.card.edges },
      },
      state: { ...cell.state },
    };
  });
}

/**
 * Engine-side ruleset config (subset of the full Ruleset concept).
 * - Keep it deterministic.
 * - Keep it small enough to be ported to Solidity step-by-step.
 */
export const DEFAULT_RULESET_CONFIG_V1: RulesetConfigV1 = {
  version: 1,
  tactics: {
    warningMark: {
      enabled: true,
      maxUsesPerPlayer: 3,
      secondPlayerExtraUses: 0,
      penaltyAllTriad: -1,
      edgeMin: 0,
    },
    comboBonus: {
      enabled: true,
      momentumAt: 3,
      dominationAt: 4,
      feverAt: 5,
      momentumTriadPlus: 1,
      dominationTriadPlus: 2,
    },
    secondPlayerBalance: {
      enabled: false,
      firstMoveTriadPlus: 0,
    },
  },
  synergy: {
    traitDerivation: DEFAULT_NYANO_TRAIT_DERIVATION_CONFIG_V1,
    traitEffects: {
      enabled: true,

      cosmic: { enabled: true, cornerTriadPlus: 1 },
      light: { enabled: true, adjacencyTriadPlus: 1, stack: false },
      shadow: { enabled: true },
      forest: { enabled: true, shieldHits: 1 },
      metal: { enabled: true },
      flame: { enabled: true },
      aqua: { enabled: true, diagonalStrengthMethod: "min" },
      thunder: { enabled: true, adjacentEnemyAllTriadDelta: -1 },
      wind: { enabled: true },
      earth: { enabled: true, boost: 2, oppositePenalty: -1, requireChoice: true },
    },
    formationBonuses: {
      enabled: true,
      fiveElementsHarmony: {
        enabled: true,
        comboBonusScale: 2,
        requiredElements: ["flame", "aqua", "earth", "wind", "thunder"],
      },
      eclipse: {
        enabled: true,
        lightAlsoIgnoresWarningMark: true,
        shadowCountsAsLightSource: true,
      },
    },
  },
  meta: {},
};

 /**
  * On-chain settlement compatibility ruleset (Core + Tactics only).
  *
  * Matches `contracts/src/lib/TriadEngineV1.sol`:
  * - Synergy disabled (Trait effects, formation bonuses)
  * - Second player balance disabled (on-chain engine currently fixes first player = playerA)
  */
export const ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1: RulesetConfigV1 = {
  onchainSettlementCompat: true,
  ...DEFAULT_RULESET_CONFIG_V1,
  tactics: {
    ...DEFAULT_RULESET_CONFIG_V1.tactics,
    secondPlayerBalance: { enabled: false, firstMoveTriadPlus: 0 },
  },
  synergy: {
    ...DEFAULT_RULESET_CONFIG_V1.synergy,
    traitEffects: { ...DEFAULT_RULESET_CONFIG_V1.synergy.traitEffects, enabled: false },
    formationBonuses: { ...DEFAULT_RULESET_CONFIG_V1.synergy.formationBonuses, enabled: false },
  },
};


/**
 * On-chain settlement engine v2 (Core + Tactics + Shadow).
 *
 * Incremental, migration-friendly step:
 * - Keep Core+Tactics semantics identical to v1.
 * - Add ONLY one Synergy behavior: Shadow cards ignore warning mark penalty.
 * - Still assumes firstPlayer=playerA and earthBoostEdges are unsupported.
 */
export const ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2: RulesetConfigV1 = {
  onchainSettlementCompat: true,
  ...DEFAULT_RULESET_CONFIG_V1,
  tactics: {
    ...DEFAULT_RULESET_CONFIG_V1.tactics,
    secondPlayerBalance: { enabled: false, firstMoveTriadPlus: 0 },
  },
  synergy: {
    ...DEFAULT_RULESET_CONFIG_V1.synergy,

    // v2 migration step: enable ONLY Shadow (ignore warning mark).
    // Other Synergy behaviors remain off to preserve on-chain subset parity.
    traitEffects: {
      ...DEFAULT_RULESET_CONFIG_V1.synergy.traitEffects,
      enabled: true,

      cosmic: { ...DEFAULT_RULESET_CONFIG_V1.synergy.traitEffects.cosmic, enabled: false },
      light: { ...DEFAULT_RULESET_CONFIG_V1.synergy.traitEffects.light, enabled: false },
      shadow: { ...DEFAULT_RULESET_CONFIG_V1.synergy.traitEffects.shadow, enabled: true },
      forest: { ...DEFAULT_RULESET_CONFIG_V1.synergy.traitEffects.forest, enabled: false },
      metal: { ...DEFAULT_RULESET_CONFIG_V1.synergy.traitEffects.metal, enabled: false },
      flame: { ...DEFAULT_RULESET_CONFIG_V1.synergy.traitEffects.flame, enabled: false },
      aqua: { ...DEFAULT_RULESET_CONFIG_V1.synergy.traitEffects.aqua, enabled: false },
      thunder: { ...DEFAULT_RULESET_CONFIG_V1.synergy.traitEffects.thunder, enabled: false },
      wind: { ...DEFAULT_RULESET_CONFIG_V1.synergy.traitEffects.wind, enabled: false },
      earth: { ...DEFAULT_RULESET_CONFIG_V1.synergy.traitEffects.earth, enabled: false },
    },

    formationBonuses: { ...DEFAULT_RULESET_CONFIG_V1.synergy.formationBonuses, enabled: false },
  },
};

export const DEFAULT_RULESET_CONFIG_V2: RulesetConfigV2 = {
  version: 2,
  tactics: DEFAULT_RULESET_CONFIG_V1.tactics,
  synergy: DEFAULT_RULESET_CONFIG_V1.synergy,
  classic: DEFAULT_CLASSIC_RULES_CONFIG_V1,
  meta: DEFAULT_RULESET_CONFIG_V1.meta,
};

export const CLASSIC_PLUS_SAME_RULESET_CONFIG_V2: RulesetConfigV2 = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_CLASSIC_RULES_CONFIG_V1,
    plus: true,
    same: true,
  },
};


interface WarningMark {
  cell: number; // 0..8
  owner: PlayerIndex;
  expiresAtTurn: number; // turn index at which the mark is removed (start of owner's turn)
}

interface PendingBonus {
  triadPlus: number; // all edges
  ignoreWarningMark: boolean; // next placed card ignores warning mark penalty
}

const DIRS: Array<{ dir: Direction; dx: number; dy: number; opp: Direction }> = [
  { dir: "up", dx: 0, dy: -1, opp: "down" },
  { dir: "right", dx: 1, dy: 0, opp: "left" },
  { dir: "down", dx: 0, dy: 1, opp: "up" },
  { dir: "left", dx: -1, dy: 0, opp: "right" },
];

const DIAGS: Array<{ dx: number; dy: number; vert: Direction; horiz: Direction; oppVert: Direction; oppHoriz: Direction }> = [
  // up-right
  { dx: 1, dy: -1, vert: "up", horiz: "right", oppVert: "down", oppHoriz: "left" },
  // down-right
  { dx: 1, dy: 1, vert: "down", horiz: "right", oppVert: "up", oppHoriz: "left" },
  // down-left
  { dx: -1, dy: 1, vert: "down", horiz: "left", oppVert: "up", oppHoriz: "right" },
  // up-left
  { dx: -1, dy: -1, vert: "up", horiz: "left", oppVert: "down", oppHoriz: "right" },
];

function idxToXY(idx: number): { x: number; y: number } {
  return { x: idx % BOARD_SIZE, y: Math.floor(idx / BOARD_SIZE) };
}
function xyToIdx(x: number, y: number): number {
  return y * BOARD_SIZE + x;
}
function neighborIndex(idx: number, dir: Direction): number | null {
  const { x, y } = idxToXY(idx);
  const d = DIRS.find((d) => d.dir === dir)!;
  const nx = x + d.dx;
  const ny = y + d.dy;
  if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return null;
  return xyToIdx(nx, ny);
}
function diagNeighborIndex(idx: number, dx: number, dy: number): number | null {
  const { x, y } = idxToXY(idx);
  const nx = x + dx;
  const ny = y + dy;
  if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return null;
  return xyToIdx(nx, ny);
}

export function jankenOutcome(attacker: 0 | 1 | 2, defender: 0 | 1 | 2): 1 | 0 | -1 {
  // 0 Rock beats 2 Scissors; 1 Paper beats 0 Rock; 2 Scissors beats 1 Paper
  if (attacker === defender) return 0;
  if (attacker === 0 && defender === 2) return 1;
  if (attacker === 1 && defender === 0) return 1;
  if (attacker === 2 && defender === 1) return 1;
  return -1;
}

function validateTranscriptBasic(t: TranscriptV1): void {
  const { header, turns } = t;

  if (header.version !== 1) throw new Error(`unsupported transcript version: ${header.version}`);
  if (header.deckA.length !== 5 || header.deckB.length !== 5) throw new Error("deck must be length 5");
  if (turns.length !== 9) throw new Error("turns must be length 9");

  const cellSet = new Set<number>();
  for (const turn of turns) {
    if (!Number.isInteger(turn.cell) || turn.cell < 0 || turn.cell > 8) throw new Error("invalid cell");
    if (!Number.isInteger(turn.cardIndex) || turn.cardIndex < 0 || turn.cardIndex > 4) throw new Error("invalid cardIndex");

    // Optional actions are encoded as uint8 with 255 as "none".
    if (turn.warningMarkCell !== undefined) {
      if (!Number.isInteger(turn.warningMarkCell)) throw new Error("invalid warningMarkCell");
      if (!((turn.warningMarkCell >= 0 && turn.warningMarkCell <= 8) || turn.warningMarkCell === NONE_U8)) {
        throw new Error("invalid warningMarkCell range");
      }
    }
    if (turn.earthBoostEdge !== undefined) {
      if (!Number.isInteger(turn.earthBoostEdge)) throw new Error("invalid earthBoostEdge");
      if (!((turn.earthBoostEdge >= 0 && turn.earthBoostEdge <= 3) || turn.earthBoostEdge === NONE_U8)) {
        throw new Error("invalid earthBoostEdge range");
      }
    }
    if (turn.reserved !== undefined) {
      if (!Number.isInteger(turn.reserved) || turn.reserved < 0 || turn.reserved > NONE_U8) throw new Error("invalid reserved");
    }
    if (cellSet.has(turn.cell)) throw new Error("duplicate cell in turns");
    cellSet.add(turn.cell);
  }
}


function validateTranscriptForRuleset(t: TranscriptV1, ruleset: RulesetConfigV1): void {
  if (!ruleset.onchainSettlementCompat) return;

  // On-chain v1 settlement currently assumes:
  // - first player is always playerA
  // - earthBoostEdges are not supported (must be NONE=255 on every turn)
  if (t.header.firstPlayer !== 0) throw new Error("on-chain subset requires firstPlayer=playerA");

  for (let i = 0; i < t.turns.length; i++) {
    const e = t.turns[i].earthBoostEdge ?? NONE_U8;
    if (e !== NONE_U8) throw new Error("on-chain subset does not support earthBoostEdge");
  }
}

function hashTranscriptCanonical(t: TranscriptV1): `0x${string}` {
  // Solidity-compatible keccak256 over a fixed ABI encoding.
  // This avoids JSON canonicalization pitfalls and keeps official settlement verifiable.
  const coder = AbiCoder.defaultAbiCoder();

  const normU8 = (v: number | undefined): number => (v === undefined ? NONE_U8 : v);
  const cells = t.turns.map((x) => x.cell);
  const cardIndexes = t.turns.map((x) => x.cardIndex);
  const warningCells = t.turns.map((x) => normU8(x.warningMarkCell));
  const earthEdges = t.turns.map((x) => normU8(x.earthBoostEdge));
  const reserved = t.turns.map((x) => normU8(x.reserved));

  const encoded = coder.encode(
    [
      "uint16",
      "bytes32",
      "uint32",
      "address",
      "address",
      "uint256[5]",
      "uint256[5]",
      "uint8",
      "uint64",
      "bytes32",
      "uint8[9]",
      "uint8[9]",
      "uint8[9]",
      "uint8[9]",
      "uint8[9]",
    ],
    [
      t.header.version,
      t.header.rulesetId,
      t.header.seasonId,
      t.header.playerA,
      t.header.playerB,
      t.header.deckA,
      t.header.deckB,
      t.header.firstPlayer,
      t.header.deadline,
      t.header.salt,
      cells,
      cardIndexes,
      warningCells,
      earthEdges,
      reserved,
    ]
  );

  return keccak256(encoded) as `0x${string}`;
}

function getTurnPlayer(firstPlayer: PlayerIndex, turnIndex: number): PlayerIndex {
  return ((firstPlayer + (turnIndex % 2)) % 2) as PlayerIndex;
}

function isCornerCell(cell: number): boolean {
  return cell === 0 || cell === 2 || cell === 6 || cell === 8;
}

export function simulateMatchV1(
  t: TranscriptV1,
  cardsByTokenId: Map<bigint, CardData>,
  ruleset: RulesetConfig = DEFAULT_RULESET_CONFIG_V1,
  options?: SimulateMatchOptions
): MatchResult {
  validateTranscriptBasic(t);

  const classic = resolveClassicConfig(ruleset);
  const rules: RulesetConfigV1 = ruleset.version === 1
    ? ruleset
    : {
        version: 1,
        tactics: ruleset.tactics,
        synergy: ruleset.synergy,
        meta: ruleset.meta,
        onchainSettlementCompat: ruleset.onchainSettlementCompat,
      };
  validateTranscriptForRuleset(t, rules);

  const board: BoardState = Array.from({ length: 9 }, () => null);
  if (options?.boardHistory) options.boardHistory.push(cloneBoardState(board));

  const swap = resolveClassicSwapIndices({ ruleset, header: t.header });
  const effectiveDecks = applyClassicSwapToDecks(t.header.deckA, t.header.deckB, swap);
  const deckA = effectiveDecks.deckA;
  const deckB = effectiveDecks.deckB;

  // Layer 2 (TACTICS): Warning marks (警戒マーク)
  const warningMarks: WarningMark[] = [];
  const warningUsed: [number, number] = [0, 0];

  // Max uses can differ by player (e.g., give the second player +1 use for balance).
  const firstPlayer = t.header.firstPlayer;
  const secondPlayer: PlayerIndex = firstPlayer === 0 ? 1 : 0;
  const warningBaseMax = rules.tactics.warningMark.maxUsesPerPlayer;
  const warningExtraSecond = rules.tactics.warningMark.secondPlayerExtraUses;
  const warningMax: [number, number] = [warningBaseMax, warningBaseMax];
  if (Number.isInteger(warningExtraSecond) && warningExtraSecond > 0) {
    warningMax[secondPlayer] = warningBaseMax + warningExtraSecond;
  }

  // Layer 2 (TACTICS): Combo bonus (コンボボーナス)
  const pendingBonus: [PendingBonus, PendingBonus] = [
    { triadPlus: 0, ignoreWarningMark: false },
    { triadPlus: 0, ignoreWarningMark: false },
  ];

  // Optional balance: give the second player a bonus on their first move.
  if (rules.tactics.secondPlayerBalance.enabled) {
    const bonus = rules.tactics.secondPlayerBalance.firstMoveTriadPlus;
    if (Number.isInteger(bonus) && bonus !== 0) {
      pendingBonus[secondPlayer] = { triadPlus: bonus, ignoreWarningMark: false };
    }
  }

  const turnSummaries: TurnSummary[] = [];

  const usedA = new Set<number>();
  const usedB = new Set<number>();

  const edgeMin = rules.tactics.warningMark.edgeMin;
  const clampEdge = (v: number): number => Math.max(edgeMin, Math.min(EDGE_MAX, v));

  const getTrait = (card: CardData): TraitType => card.trait ?? "none";

  // -----------------------------
  // Layer3: Formation bonuses (deck composition)
  // -----------------------------
  const fb = rules.synergy.formationBonuses;
  const formationsByPlayer: [FormationId[], FormationId[]] = [[], []];
  const fiveElementsScale: [number, number] = [1, 1];
  const eclipseLightIgnoresWarning: [boolean, boolean] = [false, false];
  const eclipseShadowAsLight: [boolean, boolean] = [false, false];

  const deckTraits: [TraitType[], TraitType[]] = [[], []];
  for (const p of [0, 1] as PlayerIndex[]) {
    const deck = p === 0 ? deckA : deckB;
    for (const tokenId of deck) {
      const c = cardsByTokenId.get(tokenId);
      if (!c) throw new Error(`missing CardData for tokenId=${tokenId}`);
      deckTraits[p].push(getTrait(c));
    }
  }

  const hasAllTraits = (traits: TraitType[], required: TraitType[]): boolean => required.every((x) => traits.includes(x));

  if (fb.enabled) {
    // 五行調和 (Five Elements Harmony)
    if (fb.fiveElementsHarmony.enabled) {
      const req = fb.fiveElementsHarmony.requiredElements as unknown as TraitType[];
      const scale = fb.fiveElementsHarmony.comboBonusScale;
      if (!Number.isInteger(scale) || scale < 1) throw new Error("invalid fiveElementsHarmony.comboBonusScale");
      for (const p of [0, 1] as PlayerIndex[]) {
        if (hasAllTraits(deckTraits[p], req)) {
          formationsByPlayer[p].push("five_elements_harmony");
          fiveElementsScale[p] = scale;
        }
      }
    }

    // 日食 (Eclipse): Light + Shadow
    if (fb.eclipse.enabled) {
      for (const p of [0, 1] as PlayerIndex[]) {
        const hasLight = deckTraits[p].includes("light");
        const hasShadow = deckTraits[p].includes("shadow");
        if (hasLight && hasShadow) {
          formationsByPlayer[p].push("eclipse");
          eclipseLightIgnoresWarning[p] = fb.eclipse.lightAlsoIgnoresWarningMark;
          eclipseShadowAsLight[p] = fb.eclipse.shadowCountsAsLightSource;
        }
      }
    }
  }


  const te = rules.synergy.traitEffects;
  const traitEffectsEnabled = te.enabled;
  const chainCapPerTurn = rules.meta?.chainCapPerTurn;
  if (chainCapPerTurn !== undefined) {
    if (!Number.isInteger(chainCapPerTurn) || chainCapPerTurn < 0) {
      throw new Error("meta.chainCapPerTurn must be a non-negative integer");
    }
  }
  const typePlacementCount = new Map<TraitType, number>();

  const getClassicTypeDelta = (card: CardData): number => {
    const trait = getTrait(card);
    if (trait === "none") return 0;
    const k = typePlacementCount.get(trait) ?? 0;
    let delta = 0;
    if (classic.typeAscend) delta += k;
    if (classic.typeDescend) delta -= k;
    return delta;
  };

  const traitActive = (trait: TraitType): boolean => {
    if (!traitEffectsEnabled) return false;
    switch (trait) {
      case "cosmic":
        return te.cosmic.enabled;
      case "light":
        return te.light.enabled;
      case "shadow":
        return te.shadow.enabled;
      case "forest":
        return te.forest.enabled;
      case "metal":
        return te.metal.enabled;
      case "flame":
        return te.flame.enabled;
      case "aqua":
        return te.aqua.enabled;
      case "thunder":
        return te.thunder.enabled;
      case "wind":
        return te.wind.enabled;
      case "earth":
        return te.earth.enabled;
      case "none":
      default:
        return false;
    }
  };

  const cardHasTrait = (card: CardData, trait: TraitType): boolean => getTrait(card) === trait && traitActive(trait);

  const applyEdgeDelta = (card: CardData, delta: number): CardData => {
    if (delta === 0) return card;
    const edges: Edges = {
      up: clampEdge(card.edges.up + delta),
      right: clampEdge(card.edges.right + delta),
      down: clampEdge(card.edges.down + delta),
      left: clampEdge(card.edges.left + delta),
    };
    return { ...card, edges };
  };

  const initCellState = (card: CardData): CellState => {
    const shield = cardHasTrait(card, "forest") ? te.forest.shieldHits : 0;
    return { forestShield: shield };
  };

  const takeWarningMarkAtCell = (cell: number, currentPlayer: PlayerIndex): WarningMark | null => {
    const idx = warningMarks.findIndex((m) => m.cell === cell && m.owner !== currentPlayer);
    if (idx === -1) return null;
    const [m] = warningMarks.splice(idx, 1);
    return m;
  };

  const countAdjacentAllyLights = (idx: number, owner: PlayerIndex): number => {
    if (!traitEffectsEnabled || !te.light.enabled) return 0;
    let count = 0;
    for (const { dir } of DIRS) {
      const n = neighborIndex(idx, dir);
      if (n === null) continue;
      const c = board[n];
      if (!c) continue;
      if (c.owner !== owner) continue;
      if (cardHasTrait(c.card, "light")) count += 1;
      else if (eclipseShadowAsLight[owner] && cardHasTrait(c.card, "shadow")) count += 1;
    }
    return count;
  };

  const effectiveEdge = (idx: number, dir: Direction): number => {
    const cell = board[idx];
    if (!cell) return 0;
    let v = cell.card.edges[dir];

    // Light aura: adjacent ally cards get +1 to all edges.
    // v1 decision: no stacking by default, but configurable.
    if (traitEffectsEnabled && te.light.enabled && !cardHasTrait(cell.card, "light")) {
      const c = countAdjacentAllyLights(idx, cell.owner);
      if (c > 0) {
        const stacks = te.light.stack ? c : 1;
        v = v + stacks * te.light.adjacencyTriadPlus;
      }
    }

    // Classic Type Ascend/Descend: placement-count modifier by trait.
    v = v + getClassicTypeDelta(cell.card);

    return clampEdge(v);
  };

  const diagonalStrength = (idx: number, vert: Direction, horiz: Direction): number => {
    const a = effectiveEdge(idx, vert);
    const b = effectiveEdge(idx, horiz);
    if (!traitEffectsEnabled || !te.aqua.enabled) {
      // If aqua is disabled, diagonal attacks should never happen.
      return 0;
    }
    if (te.aqua.diagonalStrengthMethod === "sum") return a + b;
    return Math.min(a, b);
  };

  const attackerWinsTie = (attacker: CardData, defender: CardData): boolean => {
    // Flame: always win the janken tie-break (unless both Flame).
    if (traitEffectsEnabled && te.flame.enabled) {
      const aFlame = cardHasTrait(attacker, "flame");
      const dFlame = cardHasTrait(defender, "flame");
      if (aFlame && !dFlame) return true;
      if (dFlame && !aFlame) return false;
    }
    return jankenOutcome(attacker.jankenHand, defender.jankenHand) === 1;
  };

  type FlipWinBy = NonNullable<FlipTraceV1["winBy"]>;
  type AttackMode =
    | { kind: "ortho"; dir: Direction; opp: Direction }
    | { kind: "diag"; vert: Direction; horiz: Direction; oppVert: Direction; oppHoriz: Direction };

  const tryFlipDefender = (
    attackerIdx: number,
    defenderIdx: number,
    attackIsChain: boolean,
    mode: AttackMode,
    values: { aVal: number; dVal: number; tieBreak: boolean; winBy: FlipWinBy },
    flipTraces?: FlipTraceV1[]
  ): boolean => {
    const attacker = board[attackerIdx];
    const defender = board[defenderIdx];
    if (!attacker || !defender) return false;
    if (attacker.owner === defender.owner) return false;

    // Metal: cannot be flipped by chain attacks.
    if (attackIsChain && traitEffectsEnabled && te.metal.enabled && cardHasTrait(defender.card, "metal")) {
      return false;
    }

    // Forest: first flip attempt(s) are negated.
    if (defender.state.forestShield > 0) {
      defender.state.forestShield -= 1;
      return false;
    }

    board[defenderIdx] = { owner: attacker.owner, card: defender.card, state: defender.state };

    if (!flipTraces) return true;
    if (mode.kind === "ortho") {
      flipTraces.push({
        from: attackerIdx,
        to: defenderIdx,
        isChain: attackIsChain,
        kind: "ortho",
        dir: mode.dir,
        aVal: values.aVal,
        dVal: values.dVal,
        tieBreak: values.tieBreak,
        winBy: values.winBy,
      });
    } else {
      flipTraces.push({
        from: attackerIdx,
        to: defenderIdx,
        isChain: attackIsChain,
        kind: "diag",
        vert: mode.vert,
        horiz: mode.horiz,
        aVal: values.aVal,
        dVal: values.dVal,
        tieBreak: values.tieBreak,
        winBy: values.winBy,
      });
    }
    return true;
  };

  const compareAndMaybeFlip = (
    attackerIdx: number,
    defenderIdx: number,
    attackIsChain: boolean,
    mode: AttackMode,
    flipTraces?: FlipTraceV1[]
  ): boolean => {
    const attacker = board[attackerIdx];
    const defender = board[defenderIdx];
    if (!attacker || !defender) return false;
    if (attacker.owner === defender.owner) return false;

    let aVal = 0;
    let dVal = 0;

    if (mode.kind === "ortho") {
      aVal = effectiveEdge(attackerIdx, mode.dir);
      dVal = effectiveEdge(defenderIdx, mode.opp);
    } else {
      aVal = diagonalStrength(attackerIdx, mode.vert, mode.horiz);
      dVal = diagonalStrength(defenderIdx, mode.oppVert, mode.oppHoriz);
    }

    let attackerWins = false;
    let tieBreak = false;
    let winBy: FlipWinBy | null = null;

    if (classic.aceKiller && ((aVal === 1 && dVal === 10) || (aVal === 10 && dVal === 1))) {
      attackerWins = aVal === 1;
      if (attackerWins) winBy = "aceKiller";
    } else if (aVal === dVal) {
      tieBreak = true;
      attackerWins = attackerWinsTie(attacker.card, defender.card);
      if (attackerWins) winBy = "tieBreak";
    } else if (classic.reverse) {
      attackerWins = aVal < dVal;
      if (attackerWins) winBy = "lt";
    } else {
      attackerWins = aVal > dVal;
      if (attackerWins) winBy = "gt";
    }

    if (!attackerWins) return false;
    if (!winBy) return false;
    return tryFlipDefender(
      attackerIdx,
      defenderIdx,
      attackIsChain,
      mode,
      { aVal, dVal, tieBreak, winBy },
      flipTraces
    );
  };

  const applyThunderDebuff = (placedIdx: number): void => {
    const placed = board[placedIdx];
    if (!placed) return;
    if (!cardHasTrait(placed.card, "thunder")) return;

    const delta = te.thunder.adjacentEnemyAllTriadDelta;

    for (const { dir } of DIRS) {
      const n = neighborIndex(placedIdx, dir);
      if (n === null) continue;
      const c = board[n];
      if (!c) continue;
      if (c.owner === placed.owner) continue;

      const debuffed = applyEdgeDelta(c.card, delta);
      board[n] = { owner: c.owner, card: debuffed, state: c.state };
    }
  };

  type ClassicSpecialCapture = {
    defenderIdx: number;
    dir: Direction;
    opp: Direction;
    aVal: number;
    dVal: number;
    winBy: "same" | "plus";
  };

  const evaluateClassicSpecialCaptures = (placedIdx: number, owner: PlayerIndex): ClassicSpecialCapture[] => {
    if (!classic.same && !classic.plus) return [];

    const edgeCompares: Array<{ defenderIdx: number; dir: Direction; opp: Direction; aVal: number; dVal: number; sum: number }> = [];
    for (const { dir, opp } of DIRS) {
      const n = neighborIndex(placedIdx, dir);
      if (n === null) continue;
      const defender = board[n];
      if (!defender || defender.owner === owner) continue;
      const aVal = effectiveEdge(placedIdx, dir);
      const dVal = effectiveEdge(n, opp);
      edgeCompares.push({ defenderIdx: n, dir, opp, aVal, dVal, sum: aVal + dVal });
    }
    if (edgeCompares.length < 2) return [];

    const selected = new Map<number, ClassicSpecialCapture>();
    const upsert = (cmp: { defenderIdx: number; dir: Direction; opp: Direction; aVal: number; dVal: number }, winBy: "same" | "plus") => {
      const prev = selected.get(cmp.defenderIdx);
      if (prev && prev.winBy === "plus") return;
      selected.set(cmp.defenderIdx, { ...cmp, winBy });
    };

    if (classic.same) {
      const matched = edgeCompares.filter((c) => c.aVal === c.dVal);
      if (matched.length >= 2) {
        for (const m of matched) upsert(m, "same");
      }
    }

    if (classic.plus) {
      const grouped = new Map<number, Array<{ defenderIdx: number; dir: Direction; opp: Direction; aVal: number; dVal: number }>>();
      for (const c of edgeCompares) {
        const list = grouped.get(c.sum) ?? [];
        list.push(c);
        grouped.set(c.sum, list);
      }
      for (const list of grouped.values()) {
        if (list.length < 2) continue;
        for (const m of list) upsert(m, "plus");
      }
    }

    return [...selected.values()];
  };

  const applyChainFlips = (
    startIdx: number,
    flipTraces: FlipTraceV1[],
    seedChainIdxs: readonly number[] = [],
    initialFlipCount = 0
  ): number => {
    // Returns number of flips that happened during this placement (for combo bonus).
    let flipCount = initialFlipCount;
    const canFlipMore = (): boolean => chainCapPerTurn === undefined || flipCount < chainCapPerTurn;

    const queue: Array<{ idx: number; isChain: boolean }> = [{ idx: startIdx, isChain: false }];
    const inQueue = new Set<number>([startIdx]);
    for (const idx of seedChainIdxs) {
      if (idx === startIdx || inQueue.has(idx)) continue;
      queue.push({ idx, isChain: true });
      inQueue.add(idx);
    }

    while (queue.length) {
      if (!canFlipMore()) break;
      const { idx: attackerIdx, isChain } = queue.shift()!;
      inQueue.delete(attackerIdx);

      const attacker = board[attackerIdx];
      if (!attacker) continue;

      // Orthogonal attacks
      for (const { dir, opp } of DIRS) {
        if (!canFlipMore()) break;
        const n = neighborIndex(attackerIdx, dir);
        if (n === null) continue;
        const flipped = compareAndMaybeFlip(attackerIdx, n, isChain, { kind: "ortho", dir, opp }, flipTraces);
        if (flipped) flipCount += 1;
        if (flipped && !inQueue.has(n)) {
          queue.push({ idx: n, isChain: true });
          inQueue.add(n);
        }
      }

      // Aqua: diagonal attacks
      if (traitEffectsEnabled && te.aqua.enabled && cardHasTrait(attacker.card, "aqua")) {
        for (const d of DIAGS) {
          if (!canFlipMore()) break;
          const n = diagNeighborIndex(attackerIdx, d.dx, d.dy);
          if (n === null) continue;
          const flipped = compareAndMaybeFlip(attackerIdx, n, isChain, {
            kind: "diag",
            vert: d.vert,
            horiz: d.horiz,
            oppVert: d.oppVert,
            oppHoriz: d.oppHoriz,
          }, flipTraces);
          if (flipped) flipCount += 1;
          if (flipped && !inQueue.has(n)) {
            queue.push({ idx: n, isChain: true });
            inQueue.add(n);
          }
        }
      }
    }

    return flipCount;
  };

  const edgeIndexToDir = (edge: number): Direction => {
    if (edge === 0) return "up";
    if (edge === 1) return "right";
    if (edge === 2) return "down";
    return "left";
  };
  const oppositeDir = (dir: Direction): Direction => {
    if (dir === "up") return "down";
    if (dir === "down") return "up";
    if (dir === "left") return "right";
    return "left";
  };

  const applyEarthRedistribution = (card: CardData, boostEdge: number): CardData => {
    const boostDir = edgeIndexToDir(boostEdge);
    const oppDir = oppositeDir(boostDir);

    const edges: Edges = {
      up: card.edges.up,
      right: card.edges.right,
      down: card.edges.down,
      left: card.edges.left,
    };

    edges[boostDir] = clampEdge(edges[boostDir] + te.earth.boost);
    edges[oppDir] = clampEdge(edges[oppDir] + te.earth.oppositePenalty);

    return { ...card, edges };
  };

  for (let i = 0; i < 9; i++) {
    const turn = t.turns[i];
    const p = getTurnPlayer(t.header.firstPlayer, i);

    // Expire marks owned by the current player at the start of their turn.
    for (let k = warningMarks.length - 1; k >= 0; k--) {
      const m = warningMarks[k];
      if (m.owner === p && m.expiresAtTurn === i) warningMarks.splice(k, 1);
    }

    const cardIndex = turn.cardIndex;
    const used = p === 0 ? usedA : usedB;
    const forcedCardIndex = resolveClassicForcedCardIndex({
      ruleset,
      header: t.header,
      turnIndex: i,
      player: p,
      usedCardIndices: used,
    });
    if (forcedCardIndex !== null && cardIndex !== forcedCardIndex) {
      throw new Error(`classic cardIndex constraint violated at turn ${i}: expected ${forcedCardIndex}, got ${cardIndex}`);
    }
    if (used.has(cardIndex)) throw new Error(`cardIndex reused by player ${p}: ${cardIndex}`);
    used.add(cardIndex);

    const tokenId = p === 0 ? deckA[cardIndex] : deckB[cardIndex];
    const baseCard = cardsByTokenId.get(tokenId);
    if (!baseCard) throw new Error(`missing CardData for tokenId=${tokenId}`);

    if (board[turn.cell]) throw new Error("cell already occupied (should be prevented by validation)");

    // Consume any pending bonus from previous combo (applies to this placed card only).
    const applied = pendingBonus[p];
    pendingBonus[p] = { triadPlus: 0, ignoreWarningMark: false };

    // Warning mark trigger: placing on an opponent-marked cell normally debuffs this placed card.
    // If the applied bonus includes ignoreWarningMark (Nyano Fever), the mark is consumed but has no penalty.
    let warningTriggered = false;
    if (rules.tactics.warningMark.enabled) {
      const triggered = takeWarningMarkAtCell(turn.cell, p);
      warningTriggered = triggered !== null;
    }

    const shadowIgnoresWarning = cardHasTrait(baseCard, "shadow") || (eclipseLightIgnoresWarning[p] && cardHasTrait(baseCard, "light"));

    const warningPenalty =
      warningTriggered && !applied.ignoreWarningMark && !shadowIgnoresWarning ? rules.tactics.warningMark.penaltyAllTriad : 0;

    // Apply Layer2 deltas first (combo bonus, warning penalty).
    const delta = applied.triadPlus + warningPenalty;
    let placedCard: CardData = delta !== 0 ? applyEdgeDelta(baseCard, delta) : baseCard;

    // Layer3: Earth redistribution (requires a choice, by default).
    if (cardHasTrait(placedCard, "earth")) {
      const e = turn.earthBoostEdge;
      if (e === undefined || e === NONE_U8) {
        if (te.earth.requireChoice) throw new Error("earthBoostEdge required for Earth trait");
      } else {
        placedCard = applyEarthRedistribution(placedCard, e);
      }
    }

    // Layer3: Cosmic corner boost.
    if (cardHasTrait(placedCard, "cosmic") && isCornerCell(turn.cell)) {
      placedCard = applyEdgeDelta(placedCard, te.cosmic.cornerTriadPlus);
    }

    // Place card (with runtime state).
    board[turn.cell] = { owner: p, card: placedCard, state: initCellState(placedCard) };

    if (classic.typeAscend || classic.typeDescend) {
      const placedTrait = getTrait(placedCard);
      if (placedTrait !== "none") {
        typePlacementCount.set(placedTrait, (typePlacementCount.get(placedTrait) ?? 0) + 1);
      }
    }

    // Layer3: Thunder debuff happens immediately on placement (before captures/chain).
    applyThunderDebuff(turn.cell);

    // Chain flips (core rule)
    const flipTracesThisTurn: FlipTraceV1[] = [];
    let flipCount = 0;
    const specialSeedChain: number[] = [];
    const specialCaptures = evaluateClassicSpecialCaptures(turn.cell, p);
    for (const sc of specialCaptures) {
      if (chainCapPerTurn !== undefined && flipCount >= chainCapPerTurn) break;
      const flipped = tryFlipDefender(
        turn.cell,
        sc.defenderIdx,
        false,
        { kind: "ortho", dir: sc.dir, opp: sc.opp },
        { aVal: sc.aVal, dVal: sc.dVal, tieBreak: false, winBy: sc.winBy },
        flipTracesThisTurn
      );
      if (flipped) {
        flipCount += 1;
        specialSeedChain.push(sc.defenderIdx);
      }
    }
    flipCount = applyChainFlips(turn.cell, flipTracesThisTurn, specialSeedChain, flipCount);

    // Determine combo bonus (Design v2 default), if enabled by ruleset.
    const comboCount = 1 + flipCount;
    let comboEffect: ComboEffectName = "none";
    if (rules.tactics.comboBonus.enabled) {
      const cb = rules.tactics.comboBonus;
      if (comboCount >= cb.feverAt) {
        comboEffect = "fever";
        pendingBonus[p] = { triadPlus: 0, ignoreWarningMark: true };
      } else if (comboCount === cb.dominationAt) {
        comboEffect = "domination";
        pendingBonus[p] = { triadPlus: cb.dominationTriadPlus * fiveElementsScale[p], ignoreWarningMark: false };
      } else if (comboCount === cb.momentumAt) {
        comboEffect = "momentum";
        pendingBonus[p] = { triadPlus: cb.momentumTriadPlus * fiveElementsScale[p], ignoreWarningMark: false };
      }
    }

    // Optional action: place a warning mark after placement.
    const wm = turn.warningMarkCell;
    let warningPlaced: number | null = null;

    // If warning marks are disabled by ruleset, ignore the transcript field (protocol rule: unused fields are ignored).
    if (rules.tactics.warningMark.enabled && wm !== undefined && wm !== NONE_U8) {
      if (warningUsed[p] >= warningMax[p]) throw new Error(`warning mark limit exceeded by player ${p}`);
      if (!Number.isInteger(wm) || wm < 0 || wm > 8) throw new Error("invalid warning mark cell");
      if (board[wm]) throw new Error("warning mark must be placed on an empty cell");
      if (wm === turn.cell) throw new Error("warning mark cell must differ from placed cell");
      // Don't allow multiple marks on the same cell.
      if (warningMarks.some((m) => m.cell === wm)) throw new Error("warning mark already exists on cell");

      warningUsed[p] += 1;
      warningMarks.push({ cell: wm, owner: p, expiresAtTurn: i + 2 });
      warningPlaced = wm;
    }

    // Record turn summary for UI/debugging (protocol-friendly).
    turnSummaries.push({
      turnIndex: i,
      player: p,
      cell: turn.cell,
      cardIndex: turn.cardIndex,
      tokenId,
      flipCount,
      flipTraces: flipTracesThisTurn.length > 0 ? flipTracesThisTurn : undefined,
      comboCount,
      comboEffect,
      appliedBonus: { triadPlus: applied.triadPlus, ignoreWarningMark: applied.ignoreWarningMark },
      warningTriggered,
      warningPlaced,
    });

    if (options?.boardHistory) options.boardHistory.push(cloneBoardState(board));
  }

  // Count tiles
  let tilesA = 0;
  let tilesB = 0;
  for (const cell of board) {
    if (!cell) continue;
    if (cell.owner === 0) tilesA++;
    else tilesB++;
  }

  let winner: PlayerIndex | "draw" = tilesA > tilesB ? 0 : tilesB > tilesA ? 1 : "draw";
  let tieBreak: MatchResult["tieBreak"] = "none";

  if (winner === "draw") {
    // combatStatSum tie-break (sum controlled tiles)
    const sum = [0, 0] as [number, number];
    for (const cell of board) {
      if (!cell) continue;
      sum[cell.owner] += cell.card.combatStatSum;
    }
    if (sum[0] > sum[1]) {
      winner = 0;
      tieBreak = "combatStatSum";
    } else if (sum[1] > sum[0]) {
      winner = 1;
      tieBreak = "combatStatSum";
    } else {
      winner = t.header.firstPlayer;
      tieBreak = "firstPlayer";
    }
  }

  const matchId = hashTranscriptCanonical(t);

  return {
    winner,
    tiles: { A: tilesA, B: tilesB },
    tieBreak,
    board,
    turns: turnSummaries,
    matchId,
    formations: { A: formationsByPlayer[0], B: formationsByPlayer[1] },
  };
}

export function simulateMatchV1WithHistory(
  t: TranscriptV1,
  cardsByTokenId: Map<bigint, CardData>,
  ruleset: RulesetConfig = DEFAULT_RULESET_CONFIG_V1
): MatchResultWithHistory {
  const boardHistory: BoardState[] = [];
  const result = simulateMatchV1(t, cardsByTokenId, ruleset, { boardHistory });
  return { ...result, boardHistory };
}
