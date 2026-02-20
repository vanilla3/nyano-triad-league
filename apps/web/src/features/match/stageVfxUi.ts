import type { VfxPreference } from "@/lib/local_settings";
import type { VfxQuality } from "@/lib/visual/visualSettings";

export const STAGE_VFX_OPTIONS: ReadonlyArray<{ value: VfxPreference; label: string }> = [
  { value: "auto", label: "auto" },
  { value: "off", label: "off" },
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
];

export function formatStageVfxLabel(pref: VfxPreference, resolved: VfxQuality): string {
  if (pref === "auto") return `auto (${resolved})`;
  return pref;
}

export function resolveStageVfxOptionLabel(
  option: { value: VfxPreference; label: string },
  resolved: VfxQuality,
): string {
  if (option.value === "auto") return `auto (${resolved})`;
  return option.label;
}
