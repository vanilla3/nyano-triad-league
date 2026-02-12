/**
 * Application URL utilities (BASE_URL-aware URL generation).
 *
 * When deployed under a subpath (e.g. GitHub Pages `/nyano-triad-league/`),
 * `import.meta.env.BASE_URL` provides the subpath. These helpers ensure
 * generated URLs (share links, replay URLs) work correctly regardless
 * of deployment subpath.
 */

/**
 * Get the app base path from Vite's BASE_URL.
 * Always includes trailing slash.
 */
export function getAppBasePath(): string {
  const base =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.BASE_URL as string | undefined)
      : undefined;
  if (!base || base === "/") return "/";
  return base.endsWith("/") ? base : `${base}/`;
}

/**
 * Build a relative app URL, respecting BASE_URL subpath.
 * Example: `appPath("replay")` -> "/nyano-triad-league/replay" or "/replay"
 */
export function appPath(path: string): string {
  const base = getAppBasePath();
  const cleanPath = path.replace(/^\//, "");
  return `${base}${cleanPath}`;
}

function hasWindowOrigin(): boolean {
  return typeof window !== "undefined" && typeof window.location?.origin === "string";
}

/**
 * Build a URL object for app routes, respecting BASE_URL subpath.
 * Uses a fallback origin in non-browser environments so the same
 * URL composition logic can run in tests.
 */
function appUrlObject(path: string): URL {
  const routePath = appPath(path);
  return new URL(routePath, hasWindowOrigin() ? window.location.origin : "https://example.invalid");
}

/**
 * Build an absolute app URL (with origin), respecting BASE_URL.
 * In non-browser environments returns the relative app path.
 */
export function appAbsoluteUrl(path: string): string {
  const url = appUrlObject(path);
  if (!hasWindowOrigin()) return `${url.pathname}${url.search}${url.hash}`;
  return url.toString();
}

export type ReplayShareDataParam = {
  key: "z" | "t";
  value: string;
};

export type ReplayShareUrlOptions = {
  data: ReplayShareDataParam;
  mode?: string;
  step?: number;
  eventId?: string;
  absolute?: boolean;
};

/**
 * Build a replay share URL with stable query handling and BASE_URL support.
 */
export function buildReplayShareUrl(opts: ReplayShareUrlOptions): string {
  const url = appUrlObject("replay");
  url.searchParams.set(opts.data.key, opts.data.value);
  if (opts.eventId) url.searchParams.set("event", opts.eventId);
  if (opts.mode) url.searchParams.set("mode", opts.mode);
  if (typeof opts.step === "number") url.searchParams.set("step", String(opts.step));
  if (opts.absolute === false || !hasWindowOrigin()) return `${url.pathname}${url.search}${url.hash}`;
  return url.toString();
}
