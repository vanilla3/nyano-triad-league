import { describe, it, expect } from "vitest";
import type {
  OverlayStateV1,
  StreamVoteStateV1,
  StreamCommandV1,
  BoardCellLite,
} from "../streamer_bus";

/* ═══════════════════════════════════════════════════════════════════
   streamer_bus_contract.test.ts — P3-330

   Lock the shape of cross-page bus types so that breaking changes
   are caught in CI before they corrupt production protocols.
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Helpers ─── */

function jsonRoundTrip<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/* ═══════════════════════════════════════════════════════════════════
   OverlayStateV1
   ═══════════════════════════════════════════════════════════════════ */

describe("OverlayStateV1 contract (P3-330)", () => {
  function makeOverlay(overrides: Partial<OverlayStateV1> = {}): OverlayStateV1 {
    return {
      version: 1,
      updatedAtMs: 1700000000000,
      mode: "live",
      ...overrides,
    } as OverlayStateV1;
  }

  it("required fields: version=1, updatedAtMs=number, mode", () => {
    const s = makeOverlay();
    expect(s.version).toBe(1);
    expect(typeof s.updatedAtMs).toBe("number");
    expect(["live", "replay"]).toContain(s.mode);
  });

  it("optional turn is number", () => {
    const s = makeOverlay({ turn: 5 });
    expect(s.turn).toBe(5);
  });

  it("optional board is array of BoardCellLite | null", () => {
    const cell: BoardCellLite = {
      owner: 0,
      card: {
        tokenId: "123",
        edges: { up: 5, right: 3, down: 4, left: 6 },
        jankenHand: 1,
      },
    };
    const board = Array.from({ length: 9 }, (_, i) => (i === 4 ? cell : null));
    const s = makeOverlay({ board });
    expect(s.board).toHaveLength(9);
    expect(s.board![4]).not.toBeNull();
    expect(s.board![4]!.owner).toBe(0);
    expect(s.board![0]).toBeNull();
  });

  it("lastMove shape has turnIndex, by, cell, cardIndex", () => {
    const s = makeOverlay({
      lastMove: { turnIndex: 3, by: 1, cell: 7, cardIndex: 2 },
    });
    expect(s.lastMove).toEqual({
      turnIndex: 3,
      by: 1,
      cell: 7,
      cardIndex: 2,
    });
  });

  it("lastMove with optional warningMarkCell", () => {
    const s = makeOverlay({
      lastMove: { turnIndex: 0, by: 0, cell: 4, cardIndex: 0, warningMarkCell: 5 },
    });
    expect(s.lastMove!.warningMarkCell).toBe(5);
  });

  it("lastTurnSummary shape has flipCount, comboCount, comboEffect", () => {
    const s = makeOverlay({
      lastTurnSummary: {
        flipCount: 3,
        comboCount: 2,
        comboEffect: "domination",
        triadPlus: 1,
        ignoreWarningMark: false,
        warningTriggered: true,
        warningPlaced: 6,
      },
    });
    expect(s.lastTurnSummary!.flipCount).toBe(3);
    expect(s.lastTurnSummary!.comboCount).toBe(2);
    expect(s.lastTurnSummary!.comboEffect).toBe("domination");
    expect(s.lastTurnSummary!.triadPlus).toBe(1);
    expect(typeof s.lastTurnSummary!.ignoreWarningMark).toBe("boolean");
    expect(typeof s.lastTurnSummary!.warningTriggered).toBe("boolean");
    expect(s.lastTurnSummary!.warningPlaced).toBe(6);
  });

  it("lastTurnSummary.flips trace shape", () => {
    const s = makeOverlay({
      lastTurnSummary: {
        flipCount: 1,
        comboCount: 0,
        comboEffect: "none",
        triadPlus: 0,
        ignoreWarningMark: false,
        warningTriggered: false,
        warningPlaced: null,
        flips: [
          {
            from: 4,
            to: 5,
            isChain: false,
            kind: "ortho",
            dir: "right",
            aVal: 7,
            dVal: 3,
            tieBreak: false,
          },
        ],
      },
    });
    const flip = s.lastTurnSummary!.flips![0];
    expect(flip.from).toBe(4);
    expect(flip.to).toBe(5);
    expect(flip.kind).toBe("ortho");
    expect(flip.dir).toBe("right");
    expect(typeof flip.aVal).toBe("number");
    expect(typeof flip.dVal).toBe("number");
    expect(typeof flip.tieBreak).toBe("boolean");
  });

  it("status shape: finished, winner, tilesA, tilesB, matchId", () => {
    const s = makeOverlay({
      status: {
        finished: true,
        winner: "A",
        tilesA: 6,
        tilesB: 3,
        matchId: "0xabc123",
      },
    });
    expect(s.status!.finished).toBe(true);
    expect(s.status!.winner).toBe("A");
    expect(s.status!.tilesA).toBe(6);
    expect(s.status!.tilesB).toBe(3);
    expect(typeof s.status!.matchId).toBe("string");
  });

  it("rpcStatus shape: ok, message, timestampMs", () => {
    const s = makeOverlay({
      rpcStatus: { ok: true, message: "connected", timestampMs: 1700000000000 },
    });
    expect(typeof s.rpcStatus!.ok).toBe("boolean");
    expect(typeof s.rpcStatus!.timestampMs).toBe("number");
  });

  it("advantage shape: scoreA, levelA, labelJa, badgeColor", () => {
    const s = makeOverlay({
      advantage: { scoreA: 7, levelA: "dominant", labelJa: "圧倒的", badgeColor: "#22c55e" },
    });
    expect(typeof s.advantage!.scoreA).toBe("number");
    expect(typeof s.advantage!.levelA).toBe("string");
    expect(typeof s.advantage!.labelJa).toBe("string");
    expect(typeof s.advantage!.badgeColor).toBe("string");
  });

  it("protocolV1 shape: header + turns", () => {
    const s = makeOverlay({
      protocolV1: {
        header: {
          version: 1,
          rulesetId: "0x1234",
          seasonId: 1,
          playerA: "0xaa",
          playerB: "0xbb",
          deckA: ["1", "2", "3", "4", "5"],
          deckB: ["6", "7", "8", "9", "10"],
          firstPlayer: 0,
          deadline: 9999999999,
          salt: "0x5678",
        },
        turns: [{ cell: 4, cardIndex: 0 }],
      },
    });
    expect(s.protocolV1!.header.version).toBe(1);
    expect(s.protocolV1!.header.deckA).toHaveLength(5);
    expect(s.protocolV1!.turns).toHaveLength(1);
    expect(s.protocolV1!.turns[0].cell).toBe(4);
  });

  it("JSON roundtrip preserves all fields", () => {
    const s = makeOverlay({
      turn: 3,
      firstPlayer: 0,
      playerA: "0xaa",
      playerB: "0xbb",
      deckA: ["1", "2", "3", "4", "5"],
      deckB: ["6", "7", "8", "9", "10"],
      lastMove: { turnIndex: 2, by: 0, cell: 4, cardIndex: 1 },
      status: { finished: false },
      aiNote: "risky",
    });
    const rt = jsonRoundTrip(s);
    expect(rt.version).toBe(1);
    expect(rt.turn).toBe(3);
    expect(rt.playerA).toBe("0xaa");
    expect(rt.lastMove!.cell).toBe(4);
    expect(rt.aiNote).toBe("risky");
  });
});

/* ═══════════════════════════════════════════════════════════════════
   StreamVoteStateV1
   ═══════════════════════════════════════════════════════════════════ */

describe("StreamVoteStateV1 contract (P3-330)", () => {
  function makeVote(overrides: Partial<StreamVoteStateV1> = {}): StreamVoteStateV1 {
    return {
      version: 1,
      updatedAtMs: 1700000000000,
      status: "open",
      ...overrides,
    };
  }

  it("required fields: version=1, updatedAtMs=number, status", () => {
    const v = makeVote();
    expect(v.version).toBe(1);
    expect(typeof v.updatedAtMs).toBe("number");
    expect(["open", "closed"]).toContain(v.status);
  });

  it("top array item: move { cell, cardIndex } + count", () => {
    const v = makeVote({
      top: [
        { move: { cell: 4, cardIndex: 2 }, count: 7 },
        { move: { cell: 0, cardIndex: 0, warningMarkCell: 3 }, count: 3 },
      ],
    });
    expect(v.top).toHaveLength(2);
    expect(v.top![0].move.cell).toBe(4);
    expect(v.top![0].move.cardIndex).toBe(2);
    expect(v.top![0].count).toBe(7);
    expect(v.top![1].move.warningMarkCell).toBe(3);
  });

  it("optional fields: turn, controlledSide, endsAtMs, totalVotes, note", () => {
    const v = makeVote({
      turn: 5,
      controlledSide: 1,
      endsAtMs: 1700000030000,
      totalVotes: 42,
      note: "fast round",
    });
    expect(v.turn).toBe(5);
    expect(v.controlledSide).toBe(1);
    expect(v.endsAtMs).toBe(1700000030000);
    expect(v.totalVotes).toBe(42);
    expect(v.note).toBe("fast round");
  });

  it("JSON roundtrip preserves all fields", () => {
    const v = makeVote({
      turn: 2,
      controlledSide: 0,
      totalVotes: 15,
      top: [{ move: { cell: 1, cardIndex: 3 }, count: 8 }],
    });
    const rt = jsonRoundTrip(v);
    expect(rt.version).toBe(1);
    expect(rt.turn).toBe(2);
    expect(rt.top![0].count).toBe(8);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   StreamCommandV1
   ═══════════════════════════════════════════════════════════════════ */

describe("StreamCommandV1 contract (P3-330)", () => {
  function makeCmd(overrides: Partial<StreamCommandV1> = {}): StreamCommandV1 {
    return {
      version: 1,
      id: "cmd_test123",
      issuedAtMs: 1700000000000,
      type: "commit_move_v1",
      by: 0,
      forTurn: 3,
      move: { cell: 4, cardIndex: 2 },
      ...overrides,
    };
  }

  it("required fields: version=1, id, issuedAtMs, type, by, forTurn, move", () => {
    const c = makeCmd();
    expect(c.version).toBe(1);
    expect(typeof c.id).toBe("string");
    expect(typeof c.issuedAtMs).toBe("number");
    expect(c.type).toBe("commit_move_v1");
    expect([0, 1]).toContain(c.by);
    expect(typeof c.forTurn).toBe("number");
    expect(typeof c.move.cell).toBe("number");
    expect(typeof c.move.cardIndex).toBe("number");
  });

  it("move.warningMarkCell is optional", () => {
    const c = makeCmd({ move: { cell: 0, cardIndex: 1, warningMarkCell: 5 } });
    expect(c.move.warningMarkCell).toBe(5);
  });

  it("move.warningMarkCell can be null", () => {
    const c = makeCmd({ move: { cell: 0, cardIndex: 1, warningMarkCell: null } });
    expect(c.move.warningMarkCell).toBeNull();
  });

  it("optional source field", () => {
    const c = makeCmd({ source: "twitch_chat" });
    expect(c.source).toBe("twitch_chat");
  });

  it("JSON roundtrip preserves all fields", () => {
    const c = makeCmd({
      id: "cmd_abc",
      by: 1,
      forTurn: 7,
      move: { cell: 8, cardIndex: 4, warningMarkCell: 2 },
      source: "overlay",
    });
    const rt = jsonRoundTrip(c);
    expect(rt.version).toBe(1);
    expect(rt.id).toBe("cmd_abc");
    expect(rt.by).toBe(1);
    expect(rt.forTurn).toBe(7);
    expect(rt.move.cell).toBe(8);
    expect(rt.move.cardIndex).toBe(4);
    expect(rt.move.warningMarkCell).toBe(2);
    expect(rt.source).toBe("overlay");
  });
});
