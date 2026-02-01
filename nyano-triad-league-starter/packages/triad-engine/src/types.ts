export type PlayerIndex = 0 | 1;

export type Direction = "up" | "right" | "down" | "left";

export interface Edges {
  up: number;   // 0..9
  right: number;// 0..9
  down: number; // 0..9
  left: number; // 0..9
}

export interface CardData {
  tokenId: bigint;
  edges: Edges;
  jankenHand: 0 | 1 | 2; // 0=Rock,1=Paper,2=Scissors
  combatStatSum: number; // deterministic tie-break
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

export interface BoardCell {
  owner: PlayerIndex;
  card: CardData;
}

export type BoardState = Array<BoardCell | null>; // length 9

export interface MatchResult {
  winner: PlayerIndex | "draw";
  tiles: { A: number; B: number };
  tieBreak: "none" | "combatStatSum" | "firstPlayer";
  board: BoardState;
  matchId: `0x${string}`; // keccak256 of canonical transcript (off-chain)
}
