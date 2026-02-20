import React from "react";
import { readVfxQuality, type VfxPreference } from "@/lib/local_settings";
import { resolveVfxQuality, type VfxQuality } from "@/lib/visual/visualSettings";
import { runStageVfxPreferenceChange } from "@/features/match/stageVfxPreference";
import type { StageActionFeedbackTone } from "@/features/match/matchStageFeedback";

type StageVfxFeedback = (message: string, tone?: StageActionFeedbackTone) => void;

type StageVfxChangeHandlerDeps = {
  runStageVfxPreferenceChange: typeof runStageVfxPreferenceChange;
};

const DEFAULT_STAGE_VFX_CHANGE_HANDLER_DEPS: StageVfxChangeHandlerDeps = {
  runStageVfxPreferenceChange,
};

export function createStageVfxChangeHandler(
  input: {
    setVfxPreference: (next: VfxPreference) => void;
    setResolvedVfxQuality: (next: VfxQuality) => void;
    playVfxChangeSfx: () => void;
    pushStageActionFeedback: StageVfxFeedback;
  },
  depsPartial?: Partial<StageVfxChangeHandlerDeps>,
): (nextPreference: VfxPreference) => void {
  const deps: StageVfxChangeHandlerDeps = {
    ...DEFAULT_STAGE_VFX_CHANGE_HANDLER_DEPS,
    ...(depsPartial ?? {}),
  };
  return (nextPreference) => {
    deps.runStageVfxPreferenceChange({
      nextPreference,
      setVfxPreference: input.setVfxPreference,
      setResolvedVfxQuality: input.setResolvedVfxQuality,
      playVfxChangeSfx: input.playVfxChangeSfx,
      pushStageActionFeedback: input.pushStageActionFeedback,
    });
  };
}

export function useStageVfxPreference(input: {
  playVfxChangeSfx: () => void;
  pushStageActionFeedback: StageVfxFeedback;
}): {
  vfxPreference: VfxPreference;
  resolvedVfxQuality: VfxQuality;
  handleStageVfxChange: (nextPreference: VfxPreference) => void;
} {
  const [vfxPreference, setVfxPreference] = React.useState<VfxPreference>(() => readVfxQuality("auto"));
  const [resolvedVfxQuality, setResolvedVfxQuality] = React.useState<VfxQuality>(() => resolveVfxQuality());

  const handleStageVfxChange = React.useMemo(
    () =>
      createStageVfxChangeHandler({
        setVfxPreference,
        setResolvedVfxQuality,
        playVfxChangeSfx: input.playVfxChangeSfx,
        pushStageActionFeedback: input.pushStageActionFeedback,
      }),
    [input.playVfxChangeSfx, input.pushStageActionFeedback],
  );

  return {
    vfxPreference,
    resolvedVfxQuality,
    handleStageVfxChange,
  };
}
