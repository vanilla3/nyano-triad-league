import type { CardData, TranscriptV1, TraitType } from "@nyano/triad-engine";
import { decodeTurnsFromHex, deriveTraitTypeFromNyanoTraitV1 } from "@nyano/triad-engine";
import type { VectorCase } from "./vectors";

export function buildTranscriptFromVector(c: VectorCase): TranscriptV1 {
  const turns = decodeTurnsFromHex({
    movesHex: c.transcript.movesHex,
    warningMarksHex: c.transcript.warningMarksHex,
    earthBoostEdgesHex: c.transcript.earthBoostEdgesHex,
  });

  return {
    header: {
      version: c.transcript.version,
      seasonId: c.transcript.seasonId,
      rulesetId: c.transcript.rulesetId,
      playerA: c.transcript.playerA,
      playerB: c.transcript.playerB,
      deckA: c.transcript.deckA.map((x) => BigInt(x)),
      deckB: c.transcript.deckB.map((x) => BigInt(x)),
      firstPlayer: c.transcript.firstPlayer,
      deadline: c.transcript.deadline,
      salt: c.transcript.salt,
    },
    turns,
  };
}

function safeDeriveTrait(trait?: { classId: number; seasonId: number; rarity: number }): TraitType {
  if (!trait) return "none";
  try {
    return deriveTraitTypeFromNyanoTraitV1(trait);
  } catch {
    return "none";
  }
}

export function buildCardsMapFromVector(c: VectorCase): Map<bigint, CardData> {
  const m = new Map<bigint, CardData>();
  for (const [k, v] of Object.entries(c.tokens)) {
    const tokenId = BigInt(k);
    m.set(tokenId, {
      tokenId,
      edges: v.triad,
      jankenHand: v.hand,
      combatStatSum: v.power,
      trait: safeDeriveTrait(v.trait),
    });
  }
  return m;
}
