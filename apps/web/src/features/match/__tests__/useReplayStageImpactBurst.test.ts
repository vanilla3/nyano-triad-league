import { describe, expect, it } from "vitest";
import {
  resolveReplayNyanoReactionImpact,
  resolveReplayStageImpactBurstPlan,
} from "@/features/match/useReplayStageImpactBurst";
import type { NyanoReactionInput } from "@/components/NyanoReaction";

const highImpactInput: NyanoReactionInput = {
  flipCount: 3,
  hasChain: true,
  comboEffect: "fever",
  warningTriggered: true,
  tilesA: 7,
  tilesB: 2,
  perspective: null,
  finished: false,
  winner: null,
};

describe("features/match/useReplayStageImpactBurst", () => {
  it("resolves low impact when reaction input is null", () => {
    expect(
      resolveReplayNyanoReactionImpact({
        nyanoReactionInput: null,
      }),
    ).toBe("low");
  });

  it("resolves non-low impact from reaction input", () => {
    expect(
      resolveReplayNyanoReactionImpact({
        nyanoReactionInput: highImpactInput,
      }),
    ).toBe("high");
  });

  it("disables burst when replay is not in engine mode or compare mode", () => {
    expect(
      resolveReplayStageImpactBurstPlan({
        isEngine: false,
        isEngineFocus: true,
        compare: false,
        nyanoReactionInput: highImpactInput,
        nyanoReactionImpact: "high",
      }),
    ).toEqual({ active: false, burstMs: null });
    expect(
      resolveReplayStageImpactBurstPlan({
        isEngine: true,
        isEngineFocus: true,
        compare: true,
        nyanoReactionInput: highImpactInput,
        nyanoReactionImpact: "high",
      }),
    ).toEqual({ active: false, burstMs: null });
  });

  it("resolves burst duration when burst is active", () => {
    expect(
      resolveReplayStageImpactBurstPlan({
        isEngine: true,
        isEngineFocus: true,
        compare: false,
        nyanoReactionInput: highImpactInput,
        nyanoReactionImpact: "high",
      }),
    ).toEqual({ active: true, burstMs: 960 });
    expect(
      resolveReplayStageImpactBurstPlan({
        isEngine: true,
        isEngineFocus: true,
        compare: false,
        nyanoReactionInput: highImpactInput,
        nyanoReactionImpact: "low",
      }),
    ).toEqual({ active: false, burstMs: null });
  });
});
