import { describe, it, expect, vi, beforeEach } from "vitest";
import { listDecks, getDeck, upsertDeck, deleteDeck, exportDecksJson, importDecksJson } from "../deck_store";

/* ------------------------------------------------------------------ */
/* localStorage mock — deck_store.ts accesses bare `localStorage`      */
/* ------------------------------------------------------------------ */

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createMockStorage());
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function seedDeck(id: string, name: string, updatedAt: string) {
  const raw = localStorage.getItem("nyano_triad_decks_v1");
  const arr = raw ? JSON.parse(raw) : [];
  arr.push({
    id,
    name,
    tokenIds: ["1", "2", "3", "4", "5"],
    createdAt: updatedAt,
    updatedAt,
  });
  localStorage.setItem("nyano_triad_decks_v1", JSON.stringify(arr));
}

/* ------------------------------------------------------------------ */
/* listDecks                                                           */
/* ------------------------------------------------------------------ */

describe("listDecks", () => {
  it("returns empty array when storage empty", () => {
    expect(listDecks()).toEqual([]);
  });

  it("returns decks sorted by updatedAt desc", () => {
    seedDeck("a", "Deck A", "2025-01-01T00:00:00Z");
    seedDeck("b", "Deck B", "2025-06-01T00:00:00Z");
    seedDeck("c", "Deck C", "2025-03-01T00:00:00Z");

    const list = listDecks();
    expect(list.map((d) => d.id)).toEqual(["b", "c", "a"]);
  });

  it("filters out invalid entries (missing id)", () => {
    localStorage.setItem(
      "nyano_triad_decks_v1",
      JSON.stringify([
        { name: "Bad", tokenIds: ["1", "2", "3", "4", "5"] }, // no id
        { id: "good", name: "Good", tokenIds: ["1", "2", "3", "4", "5"] },
      ]),
    );
    const list = listDecks();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("good");
  });

  it("returns empty on invalid JSON", () => {
    localStorage.setItem("nyano_triad_decks_v1", "not-json");
    expect(listDecks()).toEqual([]);
  });

  it("returns empty on non-array JSON", () => {
    localStorage.setItem("nyano_triad_decks_v1", '{"hello":"world"}');
    expect(listDecks()).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* getDeck                                                             */
/* ------------------------------------------------------------------ */

describe("getDeck", () => {
  it("returns deck by id", () => {
    seedDeck("x", "Deck X", "2025-01-01T00:00:00Z");
    const d = getDeck("x");
    expect(d).not.toBeNull();
    expect(d!.name).toBe("Deck X");
  });

  it("returns null for nonexistent id", () => {
    expect(getDeck("missing")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* upsertDeck                                                          */
/* ------------------------------------------------------------------ */

describe("upsertDeck", () => {
  it("inserts new deck (auto-generated id)", () => {
    const d = upsertDeck({ name: "New", tokenIds: [1n, 2n, 3n, 4n, 5n] });
    expect(d.id).toBeTruthy();
    expect(d.name).toBe("New");
    expect(d.tokenIds).toEqual(["1", "2", "3", "4", "5"]);
    expect(listDecks()).toHaveLength(1);
  });

  it("updates existing deck, preserves createdAt", () => {
    const d1 = upsertDeck({ name: "V1", tokenIds: [1n, 2n, 3n, 4n, 5n] });
    const created = d1.createdAt;

    const d2 = upsertDeck({ id: d1.id, name: "V2", tokenIds: [10n, 20n, 30n, 40n, 50n] });
    expect(d2.id).toBe(d1.id);
    expect(d2.name).toBe("V2");
    expect(d2.createdAt).toBe(created);
    expect(d2.tokenIds).toEqual(["10", "20", "30", "40", "50"]);
    expect(listDecks()).toHaveLength(1);
  });

  it('uses "Untitled" for empty name', () => {
    const d = upsertDeck({ name: "", tokenIds: [1n, 2n, 3n, 4n, 5n] });
    expect(d.name).toBe("Untitled");
  });

  it("converts bigint tokenIds to strings", () => {
    const d = upsertDeck({ name: "T", tokenIds: [999n, 888n, 777n, 666n, 555n] });
    expect(d.tokenIds).toEqual(["999", "888", "777", "666", "555"]);
  });

  it("places upserted deck first in list", () => {
    upsertDeck({ id: "a", name: "A", tokenIds: [1n, 2n, 3n, 4n, 5n] });
    upsertDeck({ id: "b", name: "B", tokenIds: [1n, 2n, 3n, 4n, 5n] });
    // update A → should go first
    upsertDeck({ id: "a", name: "A updated", tokenIds: [1n, 2n, 3n, 4n, 5n] });

    const list = listDecks();
    expect(list[0].id).toBe("a");
    expect(list[0].name).toBe("A updated");
  });
});

/* ------------------------------------------------------------------ */
/* deleteDeck                                                          */
/* ------------------------------------------------------------------ */

describe("deleteDeck", () => {
  it("removes deck by id", () => {
    upsertDeck({ id: "del-me", name: "D", tokenIds: [1n, 2n, 3n, 4n, 5n] });
    expect(listDecks()).toHaveLength(1);
    deleteDeck("del-me");
    expect(listDecks()).toHaveLength(0);
  });

  it("no-op for nonexistent id", () => {
    upsertDeck({ id: "keep", name: "K", tokenIds: [1n, 2n, 3n, 4n, 5n] });
    deleteDeck("nonexistent");
    expect(listDecks()).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* exportDecksJson / importDecksJson                                   */
/* ------------------------------------------------------------------ */

describe("exportDecksJson / importDecksJson", () => {
  it("roundtrip: export → clear → import", () => {
    upsertDeck({ id: "r1", name: "R1", tokenIds: [1n, 2n, 3n, 4n, 5n] });
    upsertDeck({ id: "r2", name: "R2", tokenIds: [6n, 7n, 8n, 9n, 10n] });
    const json = exportDecksJson();

    localStorage.clear();
    expect(listDecks()).toHaveLength(0);

    const result = importDecksJson(json);
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
    expect(listDecks()).toHaveLength(2);
  });

  it("import merges by id (upsert)", () => {
    upsertDeck({ id: "merge", name: "Old", tokenIds: [1n, 2n, 3n, 4n, 5n] });

    const imported = JSON.stringify([
      { id: "merge", name: "New", tokenIds: ["1", "2", "3", "4", "5"], createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z" },
    ]);
    const result = importDecksJson(imported);

    expect(result.imported).toBe(1);
    const d = getDeck("merge");
    expect(d!.name).toBe("New");
  });

  it("import returns skip count for invalid entries", () => {
    const data = JSON.stringify([
      { id: "good", name: "Good", tokenIds: ["1", "2", "3", "4", "5"] },
      { name: "Bad" }, // missing id
      { id: "bad2", name: "Bad2", tokenIds: ["1"] }, // wrong length
    ]);
    const result = importDecksJson(data);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(2);
  });

  it("import throws on non-array JSON", () => {
    expect(() => importDecksJson('{"foo":"bar"}')).toThrow("invalid json (expected array)");
  });
});
