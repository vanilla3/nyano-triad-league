export {
  STAGE_VFX_OPTIONS,
  formatStageVfxLabel,
  resolveStageVfxOptionLabel,
} from "@/features/match/stageVfxUi";

export function clampInt(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
