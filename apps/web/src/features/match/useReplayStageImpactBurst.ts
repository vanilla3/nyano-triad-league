import React from "react";
import type { CutInImpact, NyanoReactionInput } from "@/components/NyanoReaction";
import {
  resolveMatchNyanoReactionImpact,
  resolveStageImpactBurstDurationMs,
  shouldTriggerStageImpactBurst,
} from "@/features/match/matchStageReaction";

export function resolveReplayNyanoReactionImpact(input: {
  nyanoReactionInput: NyanoReactionInput | null;
}): CutInImpact {
  return resolveMatchNyanoReactionImpact({
    nyanoReactionInput: input.nyanoReactionInput,
  });
}

export function resolveReplayStageImpactBurstPlan(input: {
  isEngine: boolean;
  isEngineFocus: boolean;
  compare: boolean;
  nyanoReactionInput: NyanoReactionInput | null;
  nyanoReactionImpact: CutInImpact;
}): {
  active: boolean;
  burstMs: number | null;
} {
  if (!input.isEngine || input.compare) {
    return { active: false, burstMs: null };
  }
  const active = shouldTriggerStageImpactBurst({
    isEngineFocus: input.isEngineFocus,
    nyanoReactionInput: input.nyanoReactionInput,
    nyanoReactionImpact: input.nyanoReactionImpact,
  });
  if (!active) {
    return { active: false, burstMs: null };
  }
  return {
    active: true,
    burstMs: resolveStageImpactBurstDurationMs(input.nyanoReactionImpact),
  };
}

export function useReplayStageImpactBurst(input: {
  isEngine: boolean;
  isEngineFocus: boolean;
  compare: boolean;
  nyanoReactionInput: NyanoReactionInput | null;
  nyanoReactionImpact: CutInImpact;
  step: number;
}): boolean {
  const [replayStageImpactBurst, setReplayStageImpactBurst] = React.useState(false);

  React.useEffect(() => {
    const plan = resolveReplayStageImpactBurstPlan({
      isEngine: input.isEngine,
      isEngineFocus: input.isEngineFocus,
      compare: input.compare,
      nyanoReactionInput: input.nyanoReactionInput,
      nyanoReactionImpact: input.nyanoReactionImpact,
    });
    if (!plan.active || plan.burstMs === null) {
      setReplayStageImpactBurst(false);
      return;
    }
    setReplayStageImpactBurst(true);
    const timer = window.setTimeout(() => setReplayStageImpactBurst(false), plan.burstMs);
    return () => window.clearTimeout(timer);
  }, [
    input.isEngine,
    input.isEngineFocus,
    input.compare,
    input.nyanoReactionInput,
    input.nyanoReactionImpact,
    input.step,
  ]);

  return replayStageImpactBurst;
}
