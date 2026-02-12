export type EventAttemptV1 = {
  /** Unique id for local storage (we use matchId by default). */
  id: string;
  /** ISO8601 */
  createdAt: string;

  eventId: string;

  /** Canonical replay URL (usually compressed) */
  replayUrl: string;

  /** matchId computed from transcript */
  matchId: string;

  /** 0 = A, 1 = B */
  winner: 0 | 1;

  tilesA: number;
  tilesB: number;

  /** Human-readable label for the ruleset used in replay */
  rulesetLabel: string;

  /** Token IDs as decimal strings */
  deckA: string[];
  deckB: string[];
};

type StoreV1 = Record<string, EventAttemptV1[]>;

const STORAGE_KEY = "nyano_triad_event_attempts_v1";

function safeParseStore(raw: string | null): StoreV1 {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object") return {};
    return v as StoreV1;
  } catch {
    return {};
  }
}

function loadStore(): StoreV1 {
  return safeParseStore(window.localStorage.getItem(STORAGE_KEY));
}

function saveStore(store: StoreV1): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function normalize(list: EventAttemptV1[]): EventAttemptV1[] {
  // Sort by createdAt desc, keep at most 50 (avoid unbounded growth)
  const out = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return out.slice(0, 50);
}

export function listEventAttempts(eventId: string): EventAttemptV1[] {
  if (!eventId) return [];
  const store = loadStore();
  return normalize(store[eventId] ?? []);
}

export function listAllEventAttempts(): EventAttemptV1[] {
  const store = loadStore();
  const merged: EventAttemptV1[] = [];
  for (const list of Object.values(store)) {
    if (!Array.isArray(list)) continue;
    for (const attempt of list) merged.push(attempt);
  }
  return normalize(merged);
}

export function hasEventAttempt(eventId: string, matchId: string): boolean {
  if (!eventId || !matchId) return false;
  const store = loadStore();
  return (store[eventId] ?? []).some((a) => a.matchId === matchId);
}

export function upsertEventAttempt(attempt: EventAttemptV1): void {
  if (!attempt.eventId) return;
  const store = loadStore();
  const list = store[attempt.eventId] ?? [];

  const idx = list.findIndex((a) => a.matchId === attempt.matchId);
  if (idx >= 0) list[idx] = attempt;
  else list.push(attempt);

  store[attempt.eventId] = normalize(list);
  saveStore(store);
}

export function deleteEventAttempt(eventId: string, id: string): void {
  if (!eventId || !id) return;
  const store = loadStore();
  const list = store[eventId] ?? [];
  store[eventId] = list.filter((a) => a.id !== id);
  saveStore(store);
}

export function clearEventAttempts(eventId: string): void {
  if (!eventId) return;
  const store = loadStore();
  delete store[eventId];
  saveStore(store);
}

export function clearAllEventAttempts(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
