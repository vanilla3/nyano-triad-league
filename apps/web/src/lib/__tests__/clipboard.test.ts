import { describe, it, expect, vi, afterEach } from "vitest";
import { writeClipboardText } from "../clipboard";

/**
 * clipboard.ts tests.
 *
 * The Vitest environment is Node.js (no jsdom), so `document` is not
 * available. We test the navigator.clipboard path and the "nothing
 * available" error path. The execCommand fallback is implicitly tested
 * by the production browser environment.
 */

describe("writeClipboardText", () => {
  // Save and restore navigator.clipboard across tests
  const originalClipboard = globalThis.navigator?.clipboard;

  afterEach(() => {
    vi.restoreAllMocks();
    if (typeof globalThis.navigator !== "undefined") {
      try {
        Object.defineProperty(globalThis.navigator, "clipboard", {
          value: originalClipboard,
          writable: true,
          configurable: true,
        });
      } catch {
        // Ignore — property may not be configurable in some envs
      }
    }
  });

  it("uses navigator.clipboard.writeText when available", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const result = await writeClipboardText("hello");
    expect(writeTextMock).toHaveBeenCalledWith("hello");
    expect(result).toBe("hello");
  });

  it("throws when clipboard API fails and no document available", async () => {
    // Make clipboard API throw — since there's no `document` in Node,
    // the execCommand fallback is skipped and it should throw
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      writable: true,
      configurable: true,
    });

    await expect(writeClipboardText("fail")).rejects.toThrow("Clipboard write failed");
  });

  it("throws when clipboard API is absent and no document available", async () => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    await expect(writeClipboardText("no-clip")).rejects.toThrow("Clipboard write failed");
  });

  it("returns the exact text that was copied", async () => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    const text = "Nyano Triad で対戦したにゃ！🐱";
    const result = await writeClipboardText(text);
    expect(result).toBe(text);
  });

  it("handles empty string", async () => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    const result = await writeClipboardText("");
    expect(result).toBe("");
  });
});
