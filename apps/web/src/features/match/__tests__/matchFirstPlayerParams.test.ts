import { describe, expect, it } from "vitest";
import {
  resolveEffectiveFirstPlayer,
  resolveMatchFirstPlayer,
  type ResolveMatchFirstPlayerInput,
} from "@/features/match/matchFirstPlayerParams";

function buildInput(partial?: Partial<ResolveMatchFirstPlayerInput>): ResolveMatchFirstPlayerInput {
  return {
    mode: "manual",
    manualFirstPlayerParam: 0,
    mutualChoiceAParam: 0,
    mutualChoiceBParam: 0,
    commitRevealSaltParam: "",
    seedResolutionParam: "",
    committedMutualPlayerAParam: "0x1111111111111111111111111111111111111111",
    committedMutualPlayerBParam: "0x2222222222222222222222222222222222222222",
    committedMutualNonceAParam: "",
    committedMutualNonceBParam: "",
    committedMutualCommitAParam: "",
    committedMutualCommitBParam: "",
    commitRevealAParam: "",
    commitRevealBParam: "",
    commitRevealCommitAParam: "",
    commitRevealCommitBParam: "",
    ...partial,
  };
}

describe("features/match/matchFirstPlayerParams", () => {
  it("resolves manual first player", () => {
    const resolved = resolveMatchFirstPlayer(
      buildInput({ mode: "manual", manualFirstPlayerParam: 1 }),
    );
    expect(resolved.valid).toBe(true);
    expect(resolved.firstPlayer).toBe(1);
  });

  it("resolves mutual first player when choices match", () => {
    const resolved = resolveMatchFirstPlayer(
      buildInput({
        mode: "mutual",
        manualFirstPlayerParam: 1,
        mutualChoiceAParam: 0,
        mutualChoiceBParam: 0,
      }),
    );
    expect(resolved.valid).toBe(true);
    expect(resolved.firstPlayer).toBe(0);
  });

  it("returns manual fallback when mutual choices mismatch", () => {
    const resolved = resolveMatchFirstPlayer(
      buildInput({
        mode: "mutual",
        manualFirstPlayerParam: 1,
        mutualChoiceAParam: 0,
        mutualChoiceBParam: 1,
      }),
    );
    expect(resolved.valid).toBe(false);
    expect(resolved.firstPlayer).toBe(1);
  });

  it("prioritizes event first player when event mode is enabled", () => {
    const resolved = resolveMatchFirstPlayer(buildInput({ mode: "manual", manualFirstPlayerParam: 0 }));
    expect(
      resolveEffectiveFirstPlayer({
        isEvent: true,
        eventFirstPlayer: 1,
        firstPlayerResolution: resolved,
      }),
    ).toBe(1);
    expect(
      resolveEffectiveFirstPlayer({
        isEvent: false,
        eventFirstPlayer: 1,
        firstPlayerResolution: resolved,
      }),
    ).toBe(0);
  });
});
