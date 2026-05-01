export type AppTheme = "mint" | "rpg" | "classic";

export const THEME_STORAGE_KEY = "nytl.theme";
const THEME_MIGRATION_KEY_V1 = "nytl.theme_migrated_v1";

const ALLOWED_THEMES = new Set<AppTheme>(["mint", "rpg", "classic"]);

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function sanitizeTheme(raw: string | null | undefined): AppTheme | null {
  if (!raw) return null;
  const normalized = String(raw).trim().toLowerCase();
  if (!normalized) return null;
  return ALLOWED_THEMES.has(normalized as AppTheme) ? (normalized as AppTheme) : null;
}

/**
 * Resolve theme from URL (?theme=) and localStorage.
 *
 * Notes:
 * - Defaults to "mint".
 * - One-time migration: if stored theme is legacy "classic" and URL has no explicit theme,
 *   migrate to "mint" so the site doesn't regress to the old look.
 */
export function resolveAppTheme(searchParams: URLSearchParams): AppTheme {
  const queryTheme = sanitizeTheme(searchParams.get("theme"));
  if (queryTheme) return queryTheme;

  const storedTheme = sanitizeTheme(safeGetItem(THEME_STORAGE_KEY));
  const candidate: AppTheme = storedTheme ?? "mint";

  if (candidate === "classic") {
    const migrated = safeGetItem(THEME_MIGRATION_KEY_V1) === "1";
    if (!migrated) {
      safeSetItem(THEME_STORAGE_KEY, "mint");
      safeSetItem(THEME_MIGRATION_KEY_V1, "1");
      return "mint";
    }
  }

  return candidate;
}

export function appendThemeToPath(path: string, theme: string | null | undefined): string {
  if (!theme) return path;

  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;

  const queryIndex = pathWithoutHash.indexOf("?");
  const pathname = queryIndex >= 0 ? pathWithoutHash.slice(0, queryIndex) : pathWithoutHash;
  const query = queryIndex >= 0 ? pathWithoutHash.slice(queryIndex + 1) : "";

  const params = new URLSearchParams(query);
  if (!params.has("theme")) params.set("theme", String(theme));
  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash}`;
}
