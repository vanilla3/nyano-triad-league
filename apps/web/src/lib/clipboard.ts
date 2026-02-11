/**
 * Robust clipboard write with fallback.
 *
 * Priority:
 *  1. `navigator.clipboard.writeText()` (modern Clipboard API — requires secure context)
 *  2. `document.execCommand("copy")` (legacy fallback — works in non-HTTPS contexts)
 *  3. Throws an error with a helpful message
 *
 * @returns The text that was written to the clipboard
 */
export async function writeClipboardText(text: string): Promise<string> {
  // 1. Modern Clipboard API (preferred)
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return text;
    } catch {
      // Clipboard API may fail in non-secure contexts or when permission is denied.
      // Fall through to legacy approach.
    }
  }

  // 2. Legacy execCommand fallback
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Prevent scrolling to bottom
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const ok = document.execCommand("copy");
      if (ok) return text;
    } catch {
      // execCommand failed — fall through
    } finally {
      document.body.removeChild(textarea);
    }
  }

  // 3. Nothing worked
  throw new Error(
    "Clipboard write failed. Please use HTTPS or copy the text manually.",
  );
}
