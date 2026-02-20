export {
  STAGE_VFX_OPTIONS,
  formatStageVfxLabel,
  resolveStageVfxOptionLabel,
} from "@/features/match/stageVfxUi";

export function clampInt(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function resolveReplayMintButtonClass(input: {
  baseClassName: string;
  isMintTheme: boolean;
  isShareAction?: boolean;
}): string {
  const { baseClassName, isMintTheme, isShareAction = false } = input;
  if (!isMintTheme) return baseClassName;
  const classes = [baseClassName, "mint-pressable", "mint-hit"];
  if (isShareAction) classes.push("mint-share-action__btn");
  return classes.join(" ");
}
