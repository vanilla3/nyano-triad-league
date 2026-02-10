import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isValidBoardCellLite,
  isValidOverlayStateV1,
  isValidStreamVoteStateV1,
  isValidStreamCommandV1,
  readStoredOverlayState,
  readStoredStreamVoteState,
  readStoredStreamCommand,
} from "../streamer_bus";

/* ═══════════════════════════════════════════════════════════════════
   streamer_bus_validators.test.ts — Phase 3 API contract tests

   Comprehensive value-range & type tests for the runtime validators
   added to streamer_bus.ts. Follows the isValidEventV1 test pattern.
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Mock localStorage ─── */

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

/* ─── Fixture factories ─── */

function makeValidBoardCell() {
  return {
    owner: 0,
    card: {
      tokenId: "42",
      edges: { up: 5, right: 3, down: 7, left: 2 },
      jankenHand: 1,
    },
  };
}

function makeMinimalOverlay() {
  return {
    version: 1,
    updatedAtMs: Date.now(),
    mode: "live" as const,
  };
}

function makeFullOverlay() {
  return {
    version: 1,
    updatedAtMs: Date.now(),
    mode: "live" as const,
    eventId: "test-event",
    eventTitle: "Test Event",
    turn: 3,
    firstPlayer: 0 as const,
    playerA: "0x" + "aa".repeat(20),
    playerB: "0x" + "bb".repeat(20),
    deckA: ["1", "2", "3", "4", "5"],
    deckB: ["6", "7", "8", "9", "10"],
    board: Array.from({ length: 9 }, () => null),
    lastMove: { turnIndex: 2, by: 0 as const, cell: 4, cardIndex: 0 },
    lastTurnSummary: {
      flipCount: 2,
      comboCount: 0,
      comboEffect: "none" as const,
      triadPlus: 0,
      ignoreWarningMark: false,
      warningTriggered: false,
      warningPlaced: null,
    },
  };
}

function makeMinimalVote() {
  return {
    version: 1,
    updatedAtMs: Date.now(),
    status: "open" as const,
  };
}

function makeMinimalCommand() {
  return {
    version: 1,
    id: "cmd_abc123",
    issuedAtMs: Date.now(),
    type: "commit_move_v1" as const,
    by: 0 as const,
    forTurn: 3,
    move: { cell: 4, cardIndex: 2 },
  };
}

/* ═══════════════════════════════════════════════════════════════════
   isValidBoardCellLite
   ═══════════════════════════════════════════════════════════════════ */

describe("isValidBoardCellLite", () => {
  it("accepts valid cell with string tokenId", () => {
    expect(isValidBoardCellLite(makeValidBoardCell())).toBe(true);
  });

  it("accepts valid cell with numeric tokenId", () => {
    const c = { ...makeValidBoardCell(), card: { ...makeValidBoardCell().card, tokenId: 42 } };
    expect(isValidBoardCellLite(c)).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidBoardCellLite(null)).toBe(false);
  });

  it("rejects non-object", () => {
    expect(isValidBoardCellLite("string")).toBe(false);
    expect(isValidBoardCellLite(42)).toBe(false);
  });

  it("rejects missing owner", () => {
    const { owner: _, ...rest } = makeValidBoardCell();
    expect(isValidBoardCellLite(rest)).toBe(false);
  });

  it("rejects owner=2", () => {
    expect(isValidBoardCellLite({ ...makeValidBoardCell(), owner: 2 })).toBe(false);
  });

  it("rejects missing card", () => {
    expect(isValidBoardCellLite({ owner: 0 })).toBe(false);
  });

  it("rejects card without edges", () => {
    expect(isValidBoardCellLite({
      owner: 0,
      card: { tokenId: "1", jankenHand: 0 },
    })).toBe(false);
  });

  it("rejects jankenHand=3", () => {
    const c = makeValidBoardCell();
    c.card.jankenHand = 3 as any;
    expect(isValidBoardCellLite(c)).toBe(false);
  });

  it("rejects null tokenId", () => {
    const c = makeValidBoardCell();
    (c.card as any).tokenId = null;
    expect(isValidBoardCellLite(c)).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   isValidOverlayStateV1
   ═══════════════════════════════════════════════════════════════════ */

describe("isValidOverlayStateV1", () => {
  it("accepts minimal valid state", () => {
    expect(isValidOverlayStateV1(makeMinimalOverlay())).toBe(true);
  });

  it("accepts full state with all optional fields", () => {
    expect(isValidOverlayStateV1(makeFullOverlay())).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidOverlayStateV1(null)).toBe(false);
  });

  it("rejects string", () => {
    expect(isValidOverlayStateV1("hello")).toBe(false);
  });

  it("rejects number", () => {
    expect(isValidOverlayStateV1(42)).toBe(false);
  });

  it("rejects version=2", () => {
    expect(isValidOverlayStateV1({ ...makeMinimalOverlay(), version: 2 })).toBe(false);
  });

  it("rejects missing updatedAtMs", () => {
    const { updatedAtMs: _, ...rest } = makeMinimalOverlay();
    expect(isValidOverlayStateV1({ ...rest, version: 1 })).toBe(false);
  });

  it("rejects non-finite updatedAtMs", () => {
    expect(isValidOverlayStateV1({ ...makeMinimalOverlay(), updatedAtMs: Infinity })).toBe(false);
  });

  it('rejects mode="unknown"', () => {
    expect(isValidOverlayStateV1({ ...makeMinimalOverlay(), mode: "unknown" })).toBe(false);
  });

  it("rejects turn=-1 (below range)", () => {
    expect(isValidOverlayStateV1({ ...makeMinimalOverlay(), turn: -1 })).toBe(false);
  });

  it("rejects turn=10 (above range)", () => {
    expect(isValidOverlayStateV1({ ...makeMinimalOverlay(), turn: 10 })).toBe(false);
  });

  it("accepts turn=0 (lower boundary)", () => {
    expect(isValidOverlayStateV1({ ...makeMinimalOverlay(), turn: 0 })).toBe(true);
  });

  it("accepts turn=9 (upper boundary)", () => {
    expect(isValidOverlayStateV1({ ...makeMinimalOverlay(), turn: 9 })).toBe(true);
  });

  it("rejects non-integer turn", () => {
    expect(isValidOverlayStateV1({ ...makeMinimalOverlay(), turn: 3.5 })).toBe(false);
  });

  it("rejects firstPlayer=2", () => {
    expect(isValidOverlayStateV1({ ...makeMinimalOverlay(), firstPlayer: 2 })).toBe(false);
  });

  it("rejects board of length 8", () => {
    expect(isValidOverlayStateV1({
      ...makeMinimalOverlay(),
      board: Array.from({ length: 8 }, () => null),
    })).toBe(false);
  });

  it("accepts board of length 9 with mix of cells and nulls", () => {
    const board = Array.from({ length: 9 }, () => null) as any[];
    board[4] = makeValidBoardCell();
    expect(isValidOverlayStateV1({ ...makeMinimalOverlay(), board })).toBe(true);
  });

  it("rejects board with invalid cell entry", () => {
    const board = Array.from({ length: 9 }, () => null) as any[];
    board[0] = { owner: 5 }; // invalid cell
    expect(isValidOverlayStateV1({ ...makeMinimalOverlay(), board })).toBe(false);
  });

  it("rejects lastMove with cell=9 (out of range)", () => {
    expect(isValidOverlayStateV1({
      ...makeMinimalOverlay(),
      lastMove: { turnIndex: 0, by: 0, cell: 9, cardIndex: 0 },
    })).toBe(false);
  });

  it("rejects lastMove with cardIndex=5 (out of range)", () => {
    expect(isValidOverlayStateV1({
      ...makeMinimalOverlay(),
      lastMove: { turnIndex: 0, by: 0, cell: 0, cardIndex: 5 },
    })).toBe(false);
  });

  it("accepts lastMove with cardIndex=4 (upper boundary)", () => {
    expect(isValidOverlayStateV1({
      ...makeMinimalOverlay(),
      lastMove: { turnIndex: 0, by: 0, cell: 0, cardIndex: 4 },
    })).toBe(true);
  });

  it("rejects lastTurnSummary with invalid comboEffect", () => {
    expect(isValidOverlayStateV1({
      ...makeMinimalOverlay(),
      lastTurnSummary: { flipCount: 0, comboCount: 0, comboEffect: "invalid" },
    })).toBe(false);
  });

  it("accepts all four comboEffect values", () => {
    for (const effect of ["none", "momentum", "domination", "fever"]) {
      expect(isValidOverlayStateV1({
        ...makeMinimalOverlay(),
        lastTurnSummary: { flipCount: 0, comboCount: 0, comboEffect: effect },
      })).toBe(true);
    }
  });

  it("rejects deckA of wrong length", () => {
    expect(isValidOverlayStateV1({
      ...makeMinimalOverlay(),
      deckA: ["1", "2", "3"],
    })).toBe(false);
  });

  it("rejects deckB with non-string entries", () => {
    expect(isValidOverlayStateV1({
      ...makeMinimalOverlay(),
      deckB: [1, 2, 3, 4, 5] as any,
    })).toBe(false);
  });

  it("JSON roundtrip of valid state still passes", () => {
    const full = makeFullOverlay();
    const roundtripped = JSON.parse(JSON.stringify(full));
    expect(isValidOverlayStateV1(roundtripped)).toBe(true);
  });

  it("rejects playerA as non-string", () => {
    expect(isValidOverlayStateV1({ ...makeMinimalOverlay(), playerA: 123 })).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   isValidStreamVoteStateV1
   ═══════════════════════════════════════════════════════════════════ */

describe("isValidStreamVoteStateV1", () => {
  it("accepts minimal valid state", () => {
    expect(isValidStreamVoteStateV1(makeMinimalVote())).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidStreamVoteStateV1(null)).toBe(false);
  });

  it("rejects version=0", () => {
    expect(isValidStreamVoteStateV1({ ...makeMinimalVote(), version: 0 })).toBe(false);
  });

  it('rejects status="pending"', () => {
    expect(isValidStreamVoteStateV1({ ...makeMinimalVote(), status: "pending" })).toBe(false);
  });

  it("rejects turn=9 (max is 8 for vote)", () => {
    expect(isValidStreamVoteStateV1({ ...makeMinimalVote(), turn: 9 })).toBe(false);
  });

  it("accepts turn=0 (lower boundary)", () => {
    expect(isValidStreamVoteStateV1({ ...makeMinimalVote(), turn: 0 })).toBe(true);
  });

  it("accepts turn=8 (upper boundary)", () => {
    expect(isValidStreamVoteStateV1({ ...makeMinimalVote(), turn: 8 })).toBe(true);
  });

  it("rejects controlledSide=2", () => {
    expect(isValidStreamVoteStateV1({ ...makeMinimalVote(), controlledSide: 2 })).toBe(false);
  });

  it("rejects top with cell=9", () => {
    expect(isValidStreamVoteStateV1({
      ...makeMinimalVote(),
      top: [{ move: { cell: 9, cardIndex: 0 }, count: 5 }],
    })).toBe(false);
  });

  it("rejects top with cardIndex=5", () => {
    expect(isValidStreamVoteStateV1({
      ...makeMinimalVote(),
      top: [{ move: { cell: 0, cardIndex: 5 }, count: 5 }],
    })).toBe(false);
  });

  it("accepts top with warningMarkCell=null", () => {
    expect(isValidStreamVoteStateV1({
      ...makeMinimalVote(),
      top: [{ move: { cell: 0, cardIndex: 0, warningMarkCell: null }, count: 1 }],
    })).toBe(true);
  });

  it("accepts empty top array", () => {
    expect(isValidStreamVoteStateV1({ ...makeMinimalVote(), top: [] })).toBe(true);
  });

  it("rejects top with warningMarkCell=9 (out of range)", () => {
    expect(isValidStreamVoteStateV1({
      ...makeMinimalVote(),
      top: [{ move: { cell: 0, cardIndex: 0, warningMarkCell: 9 }, count: 1 }],
    })).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   isValidStreamCommandV1
   ═══════════════════════════════════════════════════════════════════ */

describe("isValidStreamCommandV1", () => {
  it("accepts valid command", () => {
    expect(isValidStreamCommandV1(makeMinimalCommand())).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidStreamCommandV1(null)).toBe(false);
  });

  it("rejects empty id", () => {
    expect(isValidStreamCommandV1({ ...makeMinimalCommand(), id: "" })).toBe(false);
  });

  it('rejects type="unknown"', () => {
    expect(isValidStreamCommandV1({ ...makeMinimalCommand(), type: "unknown" })).toBe(false);
  });

  it("rejects by=2", () => {
    expect(isValidStreamCommandV1({ ...makeMinimalCommand(), by: 2 })).toBe(false);
  });

  it("rejects forTurn=9 (max is 8)", () => {
    expect(isValidStreamCommandV1({ ...makeMinimalCommand(), forTurn: 9 })).toBe(false);
  });

  it("rejects move.cell=-1", () => {
    expect(isValidStreamCommandV1({
      ...makeMinimalCommand(),
      move: { cell: -1, cardIndex: 0 },
    })).toBe(false);
  });

  it("rejects move.cardIndex=5", () => {
    expect(isValidStreamCommandV1({
      ...makeMinimalCommand(),
      move: { cell: 0, cardIndex: 5 },
    })).toBe(false);
  });

  it("accepts warningMarkCell=null", () => {
    expect(isValidStreamCommandV1({
      ...makeMinimalCommand(),
      move: { cell: 4, cardIndex: 2, warningMarkCell: null },
    })).toBe(true);
  });

  it("accepts warningMarkCell=8 (upper boundary)", () => {
    expect(isValidStreamCommandV1({
      ...makeMinimalCommand(),
      move: { cell: 4, cardIndex: 2, warningMarkCell: 8 },
    })).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   Wired validation (subscribe/read)
   ═══════════════════════════════════════════════════════════════════ */

describe("Wired validation (read from localStorage)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMockStorage());
  });

  it("readStoredOverlayState returns null for invalid stored shape", () => {
    localStorage.setItem("nyano_triad_league.overlay_state_v1", JSON.stringify({ version: 2 }));
    expect(readStoredOverlayState()).toBeNull();
  });

  it("readStoredOverlayState returns valid state", () => {
    localStorage.setItem("nyano_triad_league.overlay_state_v1", JSON.stringify(makeMinimalOverlay()));
    const result = readStoredOverlayState();
    expect(result).not.toBeNull();
    expect(result!.version).toBe(1);
  });

  it("readStoredStreamVoteState returns null for invalid stored shape", () => {
    localStorage.setItem("nyano_triad_league.stream_vote_state_v1", JSON.stringify({ version: 1, status: "bad" }));
    expect(readStoredStreamVoteState()).toBeNull();
  });

  it("readStoredStreamVoteState returns valid state", () => {
    localStorage.setItem("nyano_triad_league.stream_vote_state_v1", JSON.stringify(makeMinimalVote()));
    const result = readStoredStreamVoteState();
    expect(result).not.toBeNull();
    expect(result!.status).toBe("open");
  });

  it("readStoredStreamCommand returns null for invalid stored shape", () => {
    localStorage.setItem("nyano_triad_league.stream_cmd_v1", JSON.stringify({ version: 1, type: "bad" }));
    expect(readStoredStreamCommand()).toBeNull();
  });

  it("readStoredStreamCommand returns valid command", () => {
    localStorage.setItem("nyano_triad_league.stream_cmd_v1", JSON.stringify(makeMinimalCommand()));
    const result = readStoredStreamCommand();
    expect(result).not.toBeNull();
    expect(result!.type).toBe("commit_move_v1");
  });
});
