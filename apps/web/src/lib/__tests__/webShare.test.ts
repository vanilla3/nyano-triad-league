import { describe, expect, it, vi } from "vitest";
import { tryNativeShare } from "@/lib/webShare";

describe("lib/webShare", () => {
  it("returns unsupported when navigator share is missing", async () => {
    const result = await tryNativeShare({
      url: "https://example.invalid/replay",
      navigatorOverride: {},
    });
    expect(result).toBe("unsupported");
  });

  it("returns unsupported when canShare rejects payload", async () => {
    const share = vi.fn();
    const result = await tryNativeShare({
      url: "https://example.invalid/replay",
      navigatorOverride: {
        share,
        canShare: () => false,
      },
    });

    expect(result).toBe("unsupported");
    expect(share).not.toHaveBeenCalled();
  });

  it("returns shared when navigator share succeeds", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const result = await tryNativeShare({
      url: "https://example.invalid/replay",
      title: "Replay",
      text: "Try this match",
      navigatorOverride: {
        share,
      },
    });

    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledWith({
      url: "https://example.invalid/replay",
      title: "Replay",
      text: "Try this match",
    });
  });

  it("shares text-only payload when URL is omitted", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const result = await tryNativeShare({
      text: "Replay summary",
      navigatorOverride: {
        share,
      },
    });

    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledWith({
      text: "Replay summary",
    });
  });

  it("returns unsupported when URL and text are both missing", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const result = await tryNativeShare({
      title: "Replay",
      navigatorOverride: {
        share,
      },
    });

    expect(result).toBe("unsupported");
    expect(share).not.toHaveBeenCalled();
  });

  it("returns cancelled on AbortError", async () => {
    const share = vi.fn().mockRejectedValue({ name: "AbortError" });
    const result = await tryNativeShare({
      url: "https://example.invalid/replay",
      navigatorOverride: {
        share,
      },
    });

    expect(result).toBe("cancelled");
  });

  it("throws on non-abort errors", async () => {
    const err = new Error("share failed");
    const share = vi.fn().mockRejectedValue(err);

    await expect(
      tryNativeShare({
        url: "https://example.invalid/replay",
        navigatorOverride: {
          share,
        },
      }),
    ).rejects.toBe(err);
  });
});
