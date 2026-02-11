import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { writeClipboardText } from "../clipboard";

/**
 * clipboard.ts tests.
 *
 * The Vitest environment is Node.js (no jsdom), so `document` is not
 * available. We test the navigator.clipboard path and the "nothing
 * available" error path. The execCommand fallback is implicitly tested
 * by the production browser environment.
 *
 * NOTE: `globalThis.navigator` may be `undefined` on Linux CI (Node.js).
 * We create a mock navigator object in beforeEach and tear it down in
 * afterEach to ensure cross-platform compatibility.
 */

describe("writeClipboardText", () => {
  // Snapshot the original navigator so we can restore it
  const hadNavigator = "navigator" in globalThis;
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    // Ensure globalThis.navigator exists as a plain object we can mutate
    if (!globalThis.navigator) {
      Object.defineProperty(globalThis, "navigator", {
        value: {} as Navigator,
        writable: true,
        configurable: true,
      });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original navigator state
    if (hadNavigator) {
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    } else {
      // navigator didn't exist originally — remove it
      try {
        Object.defineProperty(globalThis, "navigator", {
          value: undefined,
          writable: true,
          configurable: true,
        });
      } catch {
        // Ignore if can't be deleted
      }
    }
  });

  /** Helper: set navigator.clipboard to a given value */
  function setClipboard(value: unknown) {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value,
      writable: true,
      configurable: true,
    });
  }

  it("uses navigator.clipboard.writeText when available", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText: writeTextMock });

    const result = await writeClipboardText("hello");
    expect(writeTextMock).toHaveBeenCalledWith("hello");
    expect(result).toBe("hello");
  });

  it("throws when clipboard API fails and no document available", async () => {
    // Make clipboard API throw — since there's no `document` in Node,
    // the execCommand fallback is skipped and it should throw
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("denied")) });

    await expect(writeClipboardText("fail")).rejects.toThrow("Clipboard write failed");
  });

  it("throws when clipboard API is absent and no document available", async () => {
    setClipboard(undefined);

    await expect(writeClipboardText("no-clip")).rejects.toThrow("Clipboard write failed");
  });

  it("returns the exact text that was copied", async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });

    const text = "Nyano Triad で対戦したにゃ！🐱";
    const result = await writeClipboardText(text);
    expect(result).toBe(text);
  });

  it("handles empty string", async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });

    const result = await writeClipboardText("");
    expect(result).toBe("");
  });
});
