const THEME_STORAGE_KEY = "nytl.theme";

function readStoredTheme(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function resolveAppTheme(searchParams: URLSearchParams): string {
  const queryTheme = searchParams.get("theme");
  const storedTheme = readStoredTheme();
  return (queryTheme ?? storedTheme ?? "mint").toLowerCase();
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
  if (!params.has("theme")) params.set("theme", theme);
  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash}`;
}
