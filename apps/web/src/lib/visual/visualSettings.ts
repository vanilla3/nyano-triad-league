/**
 * VisualQuality System — adaptive VFX quality based on device capability.
 *
 * Sets `data-vfx` attribute on `<html>` to control animation tiers via CSS.
 *
 * Tiers:
 *   "off"    — no animations (prefers-reduced-motion or user choice)
 *   "low"    — minimal animations (weak device / low memory)
 *   "medium" — standard animations (default)
 *   "high"   — full animations + sparkle (strong device)
 */

import { readVfxQuality } from "../local_settings";

export type VfxQuality = "off" | "low" | "medium" | "high";

/**
 * Auto-detect VFX quality from device signals.
 *
 * Decision matrix:
 *  1. `prefers-reduced-motion: reduce` → "off"
 *  2. `deviceMemory < 4` OR `hardwareConcurrency < 4` → "low"
 *  3. `deviceMemory >= 8` AND `hardwareConcurrency >= 8` → "high"
 *  4. Otherwise → "medium"
 */
export function detectVfxQuality(): VfxQuality {
  // 1. Reduced motion preference → off
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return "off";
  }

  // Navigator hints (not available in all browsers)
  const nav: Record<string, unknown> = typeof navigator !== "undefined" ? navigator : {};
  const mem = typeof nav.deviceMemory === "number" ? nav.deviceMemory : null;
  const cores = typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null;

  // 2. Weak device
  if ((mem !== null && mem < 4) || (cores !== null && cores < 4)) {
    return "low";
  }

  // 3. Strong device
  if ((mem !== null && mem >= 8) && (cores !== null && cores >= 8)) {
    return "high";
  }

  // 4. Default
  return "medium";
}

/**
 * Resolve VFX quality: user preference → "auto" triggers device detection.
 */
export function resolveVfxQuality(): VfxQuality {
  const pref = readVfxQuality();
  if (pref === "auto") return detectVfxQuality();
  return pref;
}

/**
 * Apply VFX quality to the document root as `data-vfx` attribute.
 * CSS selectors like `[data-vfx="off"]` gate animation properties.
 */
export function applyVfxQualityToDocument(quality: VfxQuality): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.vfx = quality;
}
