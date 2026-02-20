import { writeVfxQuality, type VfxPreference } from "@/lib/local_settings";
import {
  applyVfxQualityToDocument,
  resolveVfxQuality,
  type VfxQuality,
} from "@/lib/visual/visualSettings";
import { formatStageVfxLabel } from "@/features/match/stageVfxUi";
import type { StageActionFeedbackTone } from "@/features/match/matchStageFeedback";

type StageVfxPreferenceDeps = {
  writeVfxQuality: typeof writeVfxQuality;
  resolveVfxQuality: typeof resolveVfxQuality;
  applyVfxQualityToDocument: typeof applyVfxQualityToDocument;
};

const DEFAULT_STAGE_VFX_PREFERENCE_DEPS: StageVfxPreferenceDeps = {
  writeVfxQuality,
  resolveVfxQuality,
  applyVfxQualityToDocument,
};

export function runStageVfxPreferenceChange(
  input: {
    nextPreference: VfxPreference;
    setVfxPreference: (next: VfxPreference) => void;
    setResolvedVfxQuality: (next: VfxQuality) => void;
    playVfxChangeSfx: () => void;
    pushStageActionFeedback: (message: string, tone?: StageActionFeedbackTone) => void;
  },
  depsPartial?: Partial<StageVfxPreferenceDeps>,
): void {
  const deps: StageVfxPreferenceDeps = {
    ...DEFAULT_STAGE_VFX_PREFERENCE_DEPS,
    ...(depsPartial ?? {}),
  };
  input.setVfxPreference(input.nextPreference);
  deps.writeVfxQuality(input.nextPreference);

  const resolved = deps.resolveVfxQuality();
  input.setResolvedVfxQuality(resolved);
  deps.applyVfxQualityToDocument(resolved);

  input.playVfxChangeSfx();
  input.pushStageActionFeedback(
    `VFX ${formatStageVfxLabel(input.nextPreference, resolved)}`,
    "info",
  );
}
