import CORE_TACTICS_V1 from "@root/test-vectors/core_tactics_v1.json";
import CORE_TACTICS_SHADOW_V2 from "@root/test-vectors/core_tactics_shadow_v2.json";

export type VectorCase = {
  name: string;
  transcript: {
    version: number;
    seasonId: number;
    rulesetId: `0x${string}`;
    playerA: `0x${string}`;
    playerB: `0x${string}`;
    deckA: number[];
    deckB: number[];
    firstPlayer: 0 | 1;
    deadline: number;
    salt: `0x${string}`;
    movesHex: string;
    warningMarksHex: string;
    earthBoostEdgesHex: string;
  };
  tokens: Record<
    string,
    {
      triad: { up: number; right: number; left: number; down: number };
      hand: 0 | 1 | 2;
      power: number;
      trait?: { classId: number; seasonId: number; rarity: number };
    }
  >;
  expected?: any;
};

export type VectorFile = {
  schema: string;
  version: number;
  notes: string[];
  cases: VectorCase[];
};

function normalizeNotes(v: any): string[] {
  const n = v?.notes;
  if (Array.isArray(n)) return n.map(String);
  if (typeof n === "string") return [n];
  return [];
}

function withNormalizedNotes(v: any): VectorFile {
  // Keep the original JSON shape but make `notes` always an array so UI can safely call `.join(...)`.
  return { ...(v as any), notes: normalizeNotes(v) } as VectorFile;
}

export const VECTORS = {
  core_tactics_v1: withNormalizedNotes(CORE_TACTICS_V1),
  core_tactics_shadow_v2: withNormalizedNotes(CORE_TACTICS_SHADOW_V2),
};

export type VectorKey = keyof typeof VECTORS;
