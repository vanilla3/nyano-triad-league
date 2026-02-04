export type NyanoAiEventV1 = {
  id: string;
  title: string;
  description: string;

  kind: "nyano_ai_challenge";

  /** ISO8601 string. If omitted, treated as always-active. */
  startAt?: string;
  /** ISO8601 string. If omitted, treated as no end. */
  endAt?: string;

  rulesetKey: "v1" | "v2";
  seasonId: number;
  firstPlayer: 0 | 1;

  aiDifficulty: "easy" | "normal";

  /** Nyano deck tokenIds (decimal strings), length=5 */
  nyanoDeckTokenIds: string[];

  tags?: string[];
};

export type EventV1 = NyanoAiEventV1;

export type EventStatus = "upcoming" | "active" | "ended" | "always";

export const EVENTS: EventV1[] = [
  {
    id: "nyano-open-challenge",
    title: "Nyano Open Challenge",
    description:
      "いつでも挑戦できる常設イベント。Nyano（AI）がB側を操作します。まずは off-chain（Replay共有）で盛り上げる前提。",
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
  if (!e.startAt && !e.endAt) return "Always";
  if (e.startAt && !e.endAt) return `From ${e.startAt}`;
  if (!e.startAt && e.endAt) return `Until ${e.endAt}`;
  return `${e.startAt} → ${e.endAt}`;
}
