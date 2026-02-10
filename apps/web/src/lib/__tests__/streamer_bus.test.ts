import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  publishOverlayState,
  readStoredOverlayState,
  publishStreamVoteState,
  readStoredStreamVoteState,
  publishStreamCommand,
  readStoredStreamCommand,
  makeStreamCommandId,
  type OverlayStateV1,
  type StreamVoteStateV1,
  type StreamCommandV1,
} from "../streamer_bus";

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
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

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];
  name: string;
  onmessage: ((e: MessageEvent) => void) | null = null;
  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }
  postMessage(data: unknown) {
    for (const ch of MockBroadcastChannel.instances) {
      if (ch !== this && ch.name === this.name && ch.onmessage) {
        ch.onmessage(new MessageEvent("message", { data }));
      }
    }
  }
  close() { /* no-op */ }
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createMockStorage());
  vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
  vi.stubGlobal("crypto", { getRandomValues: (arr: Uint8Array) => { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256); return arr; } });
  MockBroadcastChannel.instances = [];
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeOverlayState(overrides: Partial<OverlayStateV1> = {}): OverlayStateV1 {
  return {
    version: 1,
    updatedAtMs: Date.now(),
    mode: "live",
    turn: 0,
    board: Array.from({ length: 9 }, () => null),
    ...overrides,
  } as OverlayStateV1;
}

function makeVoteState(overrides: Partial<StreamVoteStateV1> = {}): StreamVoteStateV1 {
  return {
    version: 1,
    updatedAtMs: Date.now(),
    status: "open",
    turn: 1,
    ...overrides,
  } as StreamVoteStateV1;
}

function makeCommand(overrides: Partial<StreamCommandV1> = {}): StreamCommandV1 {
  return {
    version: 1,
    id: "cmd_test",
    issuedAtMs: Date.now(),
    type: "commit_move_v1",
    by: 0,
    forTurn: 0,
    move: { cell: 4, cardIndex: 2 },
    ...overrides,
  } as StreamCommandV1;
}

/* ------------------------------------------------------------------ */
/* OverlayState                                                        */
/* ------------------------------------------------------------------ */

describe("OverlayState", () => {
  it("publishOverlayState stores to localStorage", () => {
    const state = makeOverlayState();
    publishOverlayState(state);
    const raw = localStorage.getItem("nyano_triad_league.overlay_state_v1");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(1);
    expect(parsed.mode).toBe("live");
  });

  it("readStoredOverlayState reads from localStorage", () => {
    const state = makeOverlayState({ turn: 5 });
    publishOverlayState(state);
    const result = readStoredOverlayState();
    expect(result).not.toBeNull();
    expect(result!.turn).toBe(5);
  });

  it("readStoredOverlayState returns null when empty", () => {
    expect(readStoredOverlayState()).toBeNull();
  });

  it("publish + read roundtrip preserves all fields", () => {
    const state = makeOverlayState({
      mode: "replay",
      turn: 7,
      playerA: "alice",
      playerB: "bob",
    });
    publishOverlayState(state);
    const result = readStoredOverlayState();
    expect(result).not.toBeNull();
    expect(result!.mode).toBe("replay");
    expect(result!.turn).toBe(7);
    expect(result!.playerA).toBe("alice");
    expect(result!.playerB).toBe("bob");
  });
});

/* ------------------------------------------------------------------ */
/* StreamVoteState                                                     */
/* ------------------------------------------------------------------ */

describe("StreamVoteState", () => {
  it("publishStreamVoteState stores to localStorage", () => {
    const state = makeVoteState();
    publishStreamVoteState(state);
    const raw = localStorage.getItem("nyano_triad_league.stream_vote_state_v1");
    expect(raw).not.toBeNull();
  });

  it("readStoredStreamVoteState returns null when empty", () => {
    expect(readStoredStreamVoteState()).toBeNull();
  });

  it("publish + read roundtrip", () => {
    const state = makeVoteState({ turn: 3, status: "closed" });
    publishStreamVoteState(state);
    const result = readStoredStreamVoteState();
    expect(result).not.toBeNull();
    expect(result!.turn).toBe(3);
    expect(result!.status).toBe("closed");
  });
});

/* ------------------------------------------------------------------ */
/* StreamCommand                                                       */
/* ------------------------------------------------------------------ */

describe("StreamCommand", () => {
  it("publishStreamCommand + readStoredStreamCommand roundtrip", () => {
    const cmd = makeCommand({ id: "cmd_abc", forTurn: 3 });
    publishStreamCommand(cmd);
    const result = readStoredStreamCommand();
    expect(result).not.toBeNull();
    expect(result!.id).toBe("cmd_abc");
    expect(result!.forTurn).toBe(3);
  });

  it("makeStreamCommandId produces unique prefixed IDs", () => {
    const id1 = makeStreamCommandId();
    const id2 = makeStreamCommandId();
    expect(id1).toMatch(/^cmd_/);
    expect(id2).toMatch(/^cmd_/);
    expect(id1).not.toBe(id2);
  });

  it("makeStreamCommandId uses custom prefix", () => {
    const id = makeStreamCommandId("vote");
    expect(id).toMatch(/^vote_/);
  });
});
