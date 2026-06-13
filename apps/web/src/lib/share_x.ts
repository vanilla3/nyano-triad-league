// Share-to-X (Twitter) intent helpers.
//
// We intentionally use the web intent URL instead of any SDK so that
// sharing works with zero third-party scripts and no tracking.

/** Build an X (Twitter) post intent URL with prefilled text + link. */
export function buildXShareIntentUrl(text: string, url: string): string {
  const params = new URLSearchParams();
  if (text) params.set("text", text);
  if (url) params.set("url", url);
  return `https://x.com/intent/post?${params.toString()}`;
}

/**
 * Open the X post intent in a new tab.
 * Returns false when the popup was blocked (caller may fall back to clipboard).
 */
export function openXShareIntent(text: string, url: string): boolean {
  const intentUrl = buildXShareIntentUrl(text, url);
  try {
    const win = window.open(intentUrl, "_blank", "noopener,noreferrer");
    return win !== null;
  } catch {
    return false;
  }
}

/** Default share copy for a finished match replay. */
export function buildMatchXShareText(): string {
  return "Nyano Triad League で対戦したよ 🐾 リプレイはこちら #NyanoTriadLeague";
}
