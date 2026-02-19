import { describe, expect, it } from "vitest";
import type { StreamCommandV1 } from "@/lib/streamer_bus";
import { resolveStreamCommitTurnFromCommand } from "@/features/match/matchStreamCommands";

function makeCommand(overrides: Partial<StreamCommandV1> = {}): StreamCommandV1 {
  return {
    version: 1,
    id: "cmd_1",
    issuedAtMs: 1,
    type: "commit_move_v1",
    by: 0,
    forTurn: 0,
    move: { cell: 4, cardIndex: 2, warningMarkCell: null },
    ...overrides,
  };
}

describe("features/match/matchStreamCommands", () => {
  it("resolves commit payload when command is applicable", () => {
    const resolved = resolveStreamCommitTurnFromCommand({
      cmd: makeCommand(),
      turnCount: 0,
      streamControlledSide: 0,
      isVsNyanoAi: false,
      currentPlayer: 0,
      aiPlayer: 1,
      classicForcedCardIndex: null,
    });
    expect(resolved).toEqual({
      turn: { cell: 4, cardIndex: 2, warningMarkCell: undefined },
      resolvedCardIndex: 2,
    });
  });

  it("overrides card index when classic forced index is present", () => {
    const resolved = resolveStreamCommitTurnFromCommand({
      cmd: makeCommand({ move: { cell: 3, cardIndex: 1, warningMarkCell: 8 } }),
      turnCount: 0,
      streamControlledSide: 0,
      isVsNyanoAi: false,
      currentPlayer: 0,
      aiPlayer: 1,
      classicForcedCardIndex: 4,
    });
    expect(resolved).toEqual({
      turn: { cell: 3, cardIndex: 4, warningMarkCell: 8 },
      resolvedCardIndex: 4,
    });
  });

  it("ignores command when stream side does not match", () => {
    const resolved = resolveStreamCommitTurnFromCommand({
      cmd: makeCommand({ by: 1 }),
      turnCount: 0,
      streamControlledSide: 0,
      isVsNyanoAi: false,
      currentPlayer: 1,
      aiPlayer: 0,
      classicForcedCardIndex: null,
    });
    expect(resolved).toBeNull();
  });

  it("ignores command during AI turn in vs Nyano mode", () => {
    const resolved = resolveStreamCommitTurnFromCommand({
      cmd: makeCommand({ by: 1 }),
      turnCount: 0,
      streamControlledSide: 1,
      isVsNyanoAi: true,
      currentPlayer: 1,
      aiPlayer: 1,
      classicForcedCardIndex: null,
    });
    expect(resolved).toBeNull();
  });

  it("ignores command when forTurn does not match current turn count", () => {
    const resolved = resolveStreamCommitTurnFromCommand({
      cmd: makeCommand({ forTurn: 3 }),
      turnCount: 2,
      streamControlledSide: 0,
      isVsNyanoAi: false,
      currentPlayer: 0,
      aiPlayer: 1,
      classicForcedCardIndex: null,
    });
    expect(resolved).toBeNull();
  });

  it("ignores command when board is already full", () => {
    const resolved = resolveStreamCommitTurnFromCommand({
      cmd: makeCommand({ forTurn: 8 }),
      turnCount: 9,
      streamControlledSide: 0,
      isVsNyanoAi: false,
      currentPlayer: 0,
      aiPlayer: 1,
      classicForcedCardIndex: null,
    });
    expect(resolved).toBeNull();
  });
});

