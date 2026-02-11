/**
 * Debug utilities for Nyano Triad League.
 *
 * Enable debug mode by appending `?debug=1` to any page URL.
 * This enables diagnostic overlays (e.g. image resolution badges on card art).
 */

/**
 * Returns true if debug mode is active (`?debug=1` in the URL).
 * Only the exact value "1" activates debug mode.
 */
export function isDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("debug") === "1";
  } catch {
    return false;
  }
}
