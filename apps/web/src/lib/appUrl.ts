/**
 * Application URL utilities — BASE_URL-aware URL generation.
 *
 * When deployed under a subpath (e.g. GitHub Pages `/nyano-triad-league/`),
 * `import.meta.env.BASE_URL` provides the subpath. These helpers ensure
 * all generated URLs (share links, replay URLs) work correctly regardless
 * of deployment subpath.
 */

/**
 * Get the app's base path (from Vite's BASE_URL), e.g. "/" or "/nyano-triad-league/".
 * Always includes trailing slash.
 */
export function getAppBasePath(): string {
  const base =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.BASE_URL as string | undefined)
      : undefined;
  if (!base || base === "/") return "/";
  // Ensure trailing slash
  return base.endsWith("/") ? base : `${base}/`;
}

/**
 * Build a relative app URL, respecting BASE_URL subpath.
 * E.g. `appPath("replay")` → "/nyano-triad-league/replay" or "/replay"
 *
 * @param path — path relative to app root (no leading slash needed)
 */
export function appPath(path: string): string {
  const base = getAppBasePath();
  const cleanPath = path.replace(/^\//, "");
  return `${base}${cleanPath}`;
}

/**
 * Build an absolute app URL (with origin), respecting BASE_URL.
 * E.g. `appAbsoluteUrl("replay?z=abc")` → "https://example.com/nyano-triad-league/replay?z=abc"
 */
export function appAbsoluteUrl(path: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${appPath(path)}`;
}
