import { isValidRulesetKey, type RulesetKey } from "./ruleset_registry";

export type NyanoAiEventV1 = {
  id: string;
  title: string;
  description: string;

  kind: "nyano_ai_challenge";

  /** ISO8601 string. If omitted, treated as always-active. */
  startAt?: string;
  /** ISO8601 string. If omitted, treated as no end. */
  endAt?: string;

  rulesetKey: RulesetKey;
  seasonId: number;
  firstPlayer: 0 | 1;

  aiDifficulty: "easy" | "normal";

  /** Nyano deck tokenIds (decimal strings), length=5 */
  nyanoDeckTokenIds: string[];

  tags?: string[];

  /** Optional: vote time in seconds (overrides default). */
  voteTimeSeconds?: number;
  /** Optional: max attempts per player for this event. */
  maxAttempts?: number;
  /** Optional: deck restriction rules (e.g. "mint_only"). */
  deckRestriction?: string;
};

export type EventV1 = NyanoAiEventV1;

export type EventStatus = "upcoming" | "active" | "ended" | "always";

/**
 * Runtime validator for EventV1 shape.
 * Rejects events with unknown rulesetKey, invalid firstPlayer, wrong deck length, etc.
 */
export function isValidEventV1(e: unknown): e is EventV1 {
  if (typeof e !== "object" || e === null) return false;
  const r = e as Record<string, unknown>;

  if (typeof r.id !== "string" || r.id.length === 0) return false;
  if (typeof r.title !== "string") return false;
  if (typeof r.description !== "string") return false;

  if (r.kind !== "nyano_ai_challenge") return false;
  if (!isValidRulesetKey(r.rulesetKey)) return false;
  if (typeof r.seasonId !== "number" || !Number.isInteger(r.seasonId)) return false;
  if (r.firstPlayer !== 0 && r.firstPlayer !== 1) return false;
  if (r.aiDifficulty !== "easy" && r.aiDifficulty !== "normal") return false;

  if (!Array.isArray(r.nyanoDeckTokenIds)) return false;
  if (r.nyanoDeckTokenIds.length !== 5) return false;
  if (!r.nyanoDeckTokenIds.every((t: unknown) => typeof t === "string")) return false;

  if (r.startAt !== undefined && typeof r.startAt !== "string") return false;
  if (r.endAt !== undefined && typeof r.endAt !== "string") return false;

  if (r.tags !== undefined) {
    if (!Array.isArray(r.tags)) return false;
    if (!r.tags.every((t: unknown) => typeof t === "string")) return false;
  }

  if (r.voteTimeSeconds !== undefined) {
    if (typeof r.voteTimeSeconds !== "number" || !Number.isInteger(r.voteTimeSeconds) || r.voteTimeSeconds <= 0) return false;
  }

  if (r.maxAttempts !== undefined) {
    if (typeof r.maxAttempts !== "number" || !Number.isInteger(r.maxAttempts) || r.maxAttempts <= 0) return false;
  }

  if (r.deckRestriction !== undefined) {
    if (typeof r.deckRestriction !== "string" || r.deckRestriction.length === 0) return false;
  }

  return true;
}

export const EVENTS: EventV1[] = [
  {
    id: "nyano-open-challenge",
    title: "Nyanoオープンチャレンジ",
    description:
      "いつでも挑戦できる常設イベントです。Nyano AIがB側を操作します。まずはオフチェーン対戦とリプレイ共有で腕試ししましょう。",
    kind: "nyano_ai_challenge",
    // always-active
    rulesetKey: "v2",
    seasonId: 1,
    firstPlayer: 0,
    aiDifficulty: "normal",
    // NOTE: sample default. Replace with the official event deck once decided.
    nyanoDeckTokenIds: ["1", "2", "3", "4", "5"],
    tags: ["always", "ai", "shareable"],
  },
];

export function getEventById(id: string): EventV1 | null {
  return EVENTS.find((e) => e.id === id) ?? null;
}

/**
 * Fetch event configuration from /game/events.json.
 * Falls back to the hardcoded EVENTS array on fetch failure, bad JSON, or non-array response.
 */
export async function fetchEventConfig(): Promise<EventV1[]> {
  try {
    const res = await fetch("/game/events.json");
    if (!res.ok) return [...EVENTS];
    const json: unknown = await res.json();
    if (!Array.isArray(json)) return [...EVENTS];
    const valid = json.filter(isValidEventV1);
    return valid.length > 0 ? valid : [...EVENTS];
  } catch {
    return [...EVENTS];
  }
}

function parseIsoMs(s: string | undefined): number | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

export function getEventStatus(e: EventV1, nowMs: number = Date.now()): EventStatus {
  const start = parseIsoMs(e.startAt);
  const end = parseIsoMs(e.endAt);

  if (!start && !end) return "always";
  if (start && nowMs < start) return "upcoming";
  if (end && nowMs > end) return "ended";
  return "active";
}

export function formatEventPeriod(e: EventV1): string {
  if (!e.startAt && !e.endAt) return "いつでも挑戦可";
  if (e.startAt && !e.endAt) return `${e.startAt} から`;
  if (!e.startAt && e.endAt) return `${e.endAt} まで`;
  return `${e.startAt} から ${e.endAt} まで`;
}
