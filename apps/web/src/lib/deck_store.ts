export type DeckV1 = {
  id: string;
  name: string;
  /** tokenIds as decimal strings */
  tokenIds: string[];
  createdAt: string;
  updatedAt: string;
};

const KEY = "nyano_triad_decks_v1";

function nowIso(): string {
  return new Date().toISOString();
}

function safeParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function normalizeDeck(d: any): DeckV1 | null {
  if (!d || typeof d !== "object") return null;
  if (typeof d.id !== "string") return null;
  if (typeof d.name !== "string") return null;
  if (!Array.isArray(d.tokenIds)) return null;
  const tokenIds = d.tokenIds.map(String).filter((s: string) => s.length > 0);
  if (tokenIds.length !== 5) return null;

  return {
    id: d.id,
    name: d.name,
    tokenIds,
    createdAt: typeof d.createdAt === "string" ? d.createdAt : nowIso(),
    updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : nowIso(),
  };
}

function loadAll(): DeckV1[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  const v = safeParse<any>(raw);
  if (!Array.isArray(v)) return [];
  const decks: DeckV1[] = [];
  for (const item of v) {
    const d = normalizeDeck(item);
    if (d) decks.push(d);
  }
  // stable sort by updatedAt desc
  decks.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
  return decks;
}

function saveAll(decks: DeckV1[]) {
  localStorage.setItem(KEY, JSON.stringify(decks));
}

export function listDecks(): DeckV1[] {
  return loadAll();
}

export function getDeck(id: string): DeckV1 | null {
  return loadAll().find((d) => d.id === id) ?? null;
}

export function upsertDeck(input: { id?: string; name: string; tokenIds: bigint[] }): DeckV1 {
  const decks = loadAll();

  const tokenIds = input.tokenIds.map((t) => t.toString());
  const id = input.id ?? crypto.randomUUID();

  const now = nowIso();
  const existing = decks.find((d) => d.id === id);
  const next: DeckV1 = {
    id,
    name: input.name.trim() || "Untitled",
    tokenIds,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const filtered = decks.filter((d) => d.id !== id);
  saveAll([next, ...filtered]);
  return next;
}

export function deleteDeck(id: string) {
  const decks = loadAll();
  saveAll(decks.filter((d) => d.id !== id));
}

export function exportDecksJson(): string {
  return JSON.stringify(loadAll(), null, 2);
}

export function importDecksJson(text: string): { imported: number; skipped: number } {
  const v = safeParse<any>(text);
  if (!Array.isArray(v)) throw new Error("invalid json (expected array)");

  const existing = loadAll();
  const byId = new Map(existing.map((d) => [d.id, d]));

  let imported = 0;
  let skipped = 0;

  for (const item of v) {
    const d = normalizeDeck(item);
    if (!d) {
      skipped++;
      continue;
    }
    byId.set(d.id, d);
    imported++;
  }

  const merged = Array.from(byId.values());
  // sort newest first
  merged.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
  saveAll(merged);

  return { imported, skipped };
}
