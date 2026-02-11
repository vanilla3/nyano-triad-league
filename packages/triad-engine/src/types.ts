export type PlayerIndex = 0 | 1;

export type Direction = "up" | "right" | "down" | "left";


/**
 * Per-flip trace (v1): enough to explain "why this cell flipped" on stream overlays.
 * This is intentionally small & JSON-friendly.
 */
export interface FlipTraceV1 {
  /** attacker cell index (0..8) */
  from: number;
  /** defender cell index (0..8) that flipped */
  to: number;
  /** whether this flip was caused by a chain capture */
  isChain: boolean;
  /** attack kind */
  kind: "ortho" | "diag";
  /** for ortho attacks: the attacker direction used */
  dir?: Direction;
  /** for diagonal attacks: attacker vertical/horizontal components */
  vert?: Direction;
  horiz?: Direction;
  /** effective comparison values after all modifiers */
  aVal: number;
  dVal: number;
  /** true if aVal == dVal and janken tie-break decided the outcome */
  tieBreak: boolean;
}


export interface Edges {
  up: number;   // 0..10 (Nyano triad 1..10 をそのまま入れてOK)
  right: number;// 0..10
  down: number; // 0..10
  left: number; // 0..10
}

// -----------------------------
// Synergy layer (traits)
// -----------------------------

/**
 * Game-side trait type.
 *
 * Important:
 * - This is NOT assumed to match Nyano Peace's on-chain trait IDs directly.
 * - Rulesets can define how to derive this from on-chain attributes.
 */
export type TraitType =
  | "none"
  | "cosmic"
  | "light"
  | "shadow"
  | "forest"
  | "metal"
  | "flame"
  | "aqua"
  | "thunder"
  | "wind"
  | "earth";
export type TraitDerivationSource = "season" | "class" | "fixed";

/**
 * Nyano Peace on-chain Trait (BlueAtelierNFT.getTrait).
 *
 * NOTE: This is NOT the game-side TraitType yet.
 */
export interface NyanoOnchainTrait {
  /** 1..5 (Fabric/Metal/Acrylic/Paper/Secret) */
  classId: number;
  /** 1..4 (Spring/Summer/Autumn/Winter) */
  seasonId: number;
  /** 1..5 (Common..Legendary) */
  rarity: number;
}

/**
 * Trait derivation config: from Nyano's on-chain Trait -> game-side TraitType.
 *
 * Portability goal: easy to replicate in Solidity.
 */
export interface NyanoTraitDerivationConfigV1 {
  enabled: boolean;
  scheme: "nyanoTrait_v1";
  /** seasonTrait[seasonId-1] => TraitType (length 4) */
  seasonTrait: TraitType[];
  /** classTrait[classId-1] => TraitType (length 5) */
  classTrait: TraitType[];
  /** raritySource[rarity-1] => source (length 5) */
  raritySource: TraitDerivationSource[];
  /** fixedTrait[rarity-1] => TraitType (length 5) */
  fixedTrait: TraitType[];
}


export interface CardData {
  tokenId: bigint;
  edges: Edges;
  jankenHand: 0 | 1 | 2; // 0=Rock,1=Paper,2=Scissors
  combatStatSum: number; // deterministic tie-break
  /** Optional game-side trait (ruleset-derived). */
  trait?: TraitType;
  // Future:
  // classId?: number;
  // seasonId?: number;
  // rarity?: number;
}

export interface MatchHeader {
  version: number; // v1 = 1
  rulesetId: `0x${string}`;
  seasonId: number;
  playerA: `0x${string}`;
  playerB: `0x${string}`;
  deckA: bigint[]; // length 5
  deckB: bigint[]; // length 5
  firstPlayer: PlayerIndex; // 0=playerA,1=playerB
  deadline: number; // unix seconds
  salt: `0x${string}`; // bytes32 hex
}

export interface Turn {
  cell: number; // 0..8
  cardIndex: number; // 0..4
  warningMarkCell?: number; // 0..8, or 255/undefined = none
  earthBoostEdge?: number; // 0..3, or 255/undefined = none
  reserved?: number;
}

export interface TranscriptV1 {
  header: MatchHeader;
  turns: Turn[]; // length 9
}

// -----------------------------
// Runtime board representation
// -----------------------------

export interface CellState {
  /** Forest trait: number of remaining shield blocks (first flip(s) are negated). */
  forestShield: number;
}

export interface BoardCell {
  owner: PlayerIndex;
  card: CardData;
  state: CellState;
}

export type BoardState = Array<BoardCell | null>; // length 9


export type ComboEffectName = "none" | "momentum" | "domination" | "fever";

export interface TurnSummary {
  turnIndex: number;
  player: PlayerIndex;
  cell: number;
  cardIndex: number;
  tokenId: bigint;
  flipCount: number;   // このターンでひっくり返した枚数
  /** Per-flip traces (for overlays/debug). */
  flipTraces?: FlipTraceV1[];
  comboCount: number;  // 1（配置）+ flipCount（設計ドキュメント準拠）
  comboEffect: ComboEffectName;
  appliedBonus: {
    triadPlus: number;        // このターンに適用された全辺+X（0..2）
    ignoreWarningMark: boolean; // このターンのカードが警戒マークを無効化したか
  };
  warningTriggered: boolean;  // 相手の警戒マークを踏んだか
  warningPlaced: number | null; // このターンに設置した警戒マーク（なければnull）
  // Future: trait event summaries
}

export interface MatchResult {
  winner: PlayerIndex | "draw";
  tiles: { A: number; B: number };
  tieBreak: "none" | "combatStatSum" | "firstPlayer";
  board: BoardState;
  turns: TurnSummary[];
  matchId: `0x${string}`; // keccak256 of canonical transcript (off-chain)
  formations: { A: FormationId[]; B: FormationId[] };
}


// -----------------------------
// Ruleset config (engine-side subset)
// -----------------------------

export type MatchResultWithHistory = MatchResult & { boardHistory: BoardState[] };


export interface WarningMarkConfigV1 {
  enabled: boolean;
  /**
   * Max uses per player per match.
   * Default: 3.
   */
  maxUsesPerPlayer: number;
  /**
   * Optional bonus uses for the *second* player (後攻) for balance.
   * Default: 0.
   */
  secondPlayerExtraUses: number;
  /**
   * Penalty applied to all edges when stepping on an opponent warning mark.
   * Typically -1.
   */
  penaltyAllTriad: number;
  /**
   * Clamp lower bound after applying penalties/bonuses.
   * v1 decision: 0 (so 1 can become 0).
   */
  edgeMin: number;
}

export interface ComboBonusConfigV1 {
  enabled: boolean;
  // comboCount definition is fixed by protocol: comboCount = 1 + flipCount
  momentumAt: number; // default 3
  dominationAt: number; // default 4
  feverAt: number; // default 5
  momentumTriadPlus: number; // default +1
  dominationTriadPlus: number; // default +2
}

export interface SecondPlayerBalanceConfigV1 {
  enabled: boolean;
  /**
   * Bonus applied to the second player's first placed card (all edges +X).
   * Default: 0 (disabled unless ruleset turns it on).
   */
  firstMoveTriadPlus: number;
}

export interface TacticsConfigV1 {
  warningMark: WarningMarkConfigV1;
  comboBonus: ComboBonusConfigV1;
  secondPlayerBalance: SecondPlayerBalanceConfigV1;
}

// -----------------------------
// Synergy config (traits)
// -----------------------------

export interface TraitEffectsConfigV1 {
  enabled: boolean;

  cosmic: { enabled: boolean; cornerTriadPlus: number };
  light: { enabled: boolean; adjacencyTriadPlus: number; stack: boolean };
  shadow: { enabled: boolean };
  forest: { enabled: boolean; shieldHits: number };
  metal: { enabled: boolean };
  flame: { enabled: boolean };
  /**
   * Aqua extends attacks to diagonals.
   * v1 decision: diagonalStrengthMethod="min" (keep 0..10 scale).
   */
  aqua: { enabled: boolean; diagonalStrengthMethod: "min" | "sum" };
  thunder: { enabled: boolean; adjacentEnemyAllTriadDelta: number };
  wind: { enabled: boolean };
  earth: { enabled: boolean; boost: number; oppositePenalty: number; requireChoice: boolean };
}


export type FormationId = "five_elements_harmony" | "eclipse";

export interface FiveElementsHarmonyConfigV1 {
  enabled: boolean;
  /**
   * Scale factor applied to combo bonus triadPlus values (momentum/domination).
   * Example: base momentum +1 with scale=2 => +2.
   *
   * Season rules can amplify this (Design v2 Season 3: "五行調和ボーナス3倍").
   */
  comboBonusScale: number; // default 2
  /**
   * Required elements (TraitType) for the formation.
   * v1 default: flame/aqua/earth/wind/thunder.
   */
  requiredElements: Array<"flame" | "aqua" | "earth" | "wind" | "thunder">;
}

export interface EclipseConfigV1 {
  enabled: boolean;
  /**
   * If true, Light cards also ignore warning mark penalty when this formation is active.
   * Shadow already ignores by its own trait effect.
   */
  lightAlsoIgnoresWarningMark: boolean;
  /**
   * If true, Shadow cards count as "Light sources" for the Light adjacency aura
   * (i.e., adjacent ally cards get +1).
   */
  shadowCountsAsLightSource: boolean;
}

export interface FormationBonusesConfigV1 {
  enabled: boolean;
  fiveElementsHarmony: FiveElementsHarmonyConfigV1;
  eclipse: EclipseConfigV1;
}


export interface SynergyConfigV1 {
  /**
   * Optional: Nyano on-chain trait -> game TraitType mapping.
   * Non-Nyano integrations can omit this and pass CardData.trait directly.
   */
  traitDerivation?: NyanoTraitDerivationConfigV1;
  traitEffects: TraitEffectsConfigV1;
  formationBonuses: FormationBonusesConfigV1;
}

export interface MetaConfigV1 {
  /**
   * Optional cap for total successful flips in a single turn.
   * - Includes direct flip + chain flips from that placement.
   * - `undefined` means uncapped (default behavior).
   */
  chainCapPerTurn?: number;
}

export interface RulesetConfigV1 {
  version: 1;
  tactics: TacticsConfigV1;
  synergy: SynergyConfigV1;
  /**
   * Experimental Layer4 knobs for off-chain gameplay iteration.
   * Engine-only: not included in rulesetId canonicalization (v1).
   */
  meta?: MetaConfigV1;

  /**
   * Engine-only flag:
   * - When true, enforce transcript constraints that match the current on-chain settlement engine.
   * - Not included in rulesetId canonicalization.
   */
  onchainSettlementCompat?: boolean;

  // Future: meta layers
}

