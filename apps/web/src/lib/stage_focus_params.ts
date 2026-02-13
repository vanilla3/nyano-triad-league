export interface StageFocusParamNormalizeResult {
  next: URLSearchParams;
  changed: boolean;
}

function isFocusEnabled(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized === "1" || normalized === "focus";
}

/**
 * Canonicalize stage-route query params.
 *
 * - force `ui=engine`
 * - force `focus=1`
 * - drop legacy `layout` param
 */
export function normalizeStageFocusParams(current: URLSearchParams): StageFocusParamNormalizeResult {
  const next = new URLSearchParams(current);
  let changed = false;

  if ((next.get("ui") ?? "").toLowerCase() !== "engine") {
    next.set("ui", "engine");
    changed = true;
  }

  const focusParam = next.get("focus") ?? next.get("layout");
  if (!isFocusEnabled(focusParam) || next.get("focus") !== "1") {
    next.set("focus", "1");
    changed = true;
  }

  if (next.has("layout")) {
    next.delete("layout");
    changed = true;
  }

  return { next, changed };
}
