/**
 * ReplayBundle v2 — embed card data in share URLs.
 *
 * v2 wraps the existing TranscriptV1 + a compact card data array so that
 * the Replay page can reconstruct a match without any RPC / GameIndex calls.
 *
 * - `buildReplayBundleV2`: create a v2 payload from transcript + cards
 * - `parseReplayPayload`: detect v1 vs v2 and parse accordingly
 * - `compactCardData` / `expandCardData`: compact bijective conversion
 */

import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import { parseTranscriptV1Json } from "./transcript_import";
import { stringifyWithBigInt } from "./json";

// ── Compact card representation ─────────────────────────────────────
// [tokenId, up, right, down, left, jankenHand, combatStatSum]
// This minimises URL length vs full CardData JSON.

export type CardDataCompact = [
  tokenId: string,
  up: number,
  right: number,
  down: number,
  left: number,
  jankenHand: 0 | 1 | 2,
  combatStatSum: number,
];

export type ReplayBundleV2 = {
  bundleVersion: 2;
  transcript: TranscriptV1;
  cards: CardDataCompact[];
};

// ── Parsed result discriminated union ───────────────────────────────

export type ParsedReplayV1 = { version: 1; transcript: TranscriptV1 };
export type ParsedReplayV2 = { version: 2; transcript: TranscriptV1; cards: Map<bigint, CardData> };
export type ParsedReplay = ParsedReplayV1 | ParsedReplayV2;

// ── Compact ↔ CardData ──────────────────────────────────────────────

export function compactCardData(card: CardData): CardDataCompact {
  return [
    card.tokenId.toString(),
    card.edges.up,
    card.edges.right,
    card.edges.down,
    card.edges.left,
    card.jankenHand,
    card.combatStatSum,
  ];
}

export function expandCardData(compact: CardDataCompact): CardData {
  const [tokenIdStr, up, right, down, left, jankenHand, combatStatSum] = compact;
  return {
    tokenId: BigInt(tokenIdStr),
    edges: { up, right, down, left },
    jankenHand,
    combatStatSum,
    trait: "none",
  };
}

// ── Build v2 bundle ─────────────────────────────────────────────────

export function buildReplayBundleV2(
  transcript: TranscriptV1,
  cards: Map<bigint, CardData>,
): ReplayBundleV2 {
  // Collect unique cards for both decks
  const seen = new Set<string>();
  const compactCards: CardDataCompact[] = [];

  const allTokenIds = [...transcript.header.deckA, ...transcript.header.deckB];
  for (const tid of allTokenIds) {
    const key = tid.toString();
    if (seen.has(key)) continue;
    seen.add(key);

    const card = cards.get(tid);
    if (card) {
      compactCards.push(compactCardData(card));
    }
  }

  return {
    bundleVersion: 2,
    transcript,
    cards: compactCards,
  };
}

/**
 * Serialize a v2 bundle to a JSON string.
 * Uses stringifyWithBigInt so bigint fields (deckA/deckB tokenIds) are
 * serialized as decimal strings instead of throwing.
 */
export function stringifyReplayBundle(bundle: ReplayBundleV2): string {
  return stringifyWithBigInt(bundle, 0);
}

// ── Parse (v1 or v2) ────────────────────────────────────────────────

type AnyObj = Record<string, unknown>;

function isReplayBundleV2Shape(obj: AnyObj): boolean {
  return obj.bundleVersion === 2 && Array.isArray(obj.cards) && obj.transcript != null;
}

function parseCardsArray(raw: unknown[]): Map<bigint, CardData> {
  const map = new Map<bigint, CardData>();
  for (const item of raw) {
    if (!Array.isArray(item) || item.length < 7) continue;
    const compact = item as CardDataCompact;
    const card = expandCardData(compact);
    map.set(card.tokenId, card);
  }
  return map;
}

/**
 * Parse a replay payload string. Detects v1 (bare TranscriptV1) or v2
 * (ReplayBundleV2 with embedded cards) and returns a discriminated union.
 *
 * - v2: `{ version: 2, transcript, cards }` — no network calls needed
 * - v1: `{ version: 1, transcript }` — caller must resolve cards separately
 */
export function parseReplayPayload(text: string): ParsedReplay {
  const obj = JSON.parse(text) as AnyObj;

  if (isReplayBundleV2Shape(obj)) {
    // v2: extract transcript from the nested object
    const transcriptObj = obj.transcript as AnyObj;
    // Re-serialize the transcript portion and parse with the existing robust parser
    // to ensure bigint coercion and field validation.
    const transcriptJson = stringifyWithBigInt(transcriptObj, 0);
    const transcript = parseTranscriptV1Json(transcriptJson);
    const cards = parseCardsArray(obj.cards as unknown[]);
    return { version: 2, transcript, cards };
  }

  // v1 fallback: bare TranscriptV1
  const transcript = parseTranscriptV1Json(text);
  return { version: 1, transcript };
}
