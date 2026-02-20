import type { VfxQuality } from "@/lib/visual/visualSettings";

/**
 * High-tier pseudo foil should be visible only when texture art is available.
 */
export function staticFoilEnabledForQuality(
  quality: VfxQuality,
  hasTexture: boolean,
): boolean {
  return quality === "high" && hasTexture;
}

/**
 * Event-only foil flash intensity.
 * Uses brightness pulse + animation progress so flash is tied to gameplay events.
 */
export function computeFoilFlashIntensity(
  brightness: number,
  animProgress: number,
): number {
  const rawIntensity = Math.max(0, Math.min(1, (brightness - 1) / 0.45));
  const sweepProgress = Math.max(0, Math.min(1, animProgress));
  const pulse = Math.sin(Math.PI * sweepProgress);
  return rawIntensity * pulse;
}
