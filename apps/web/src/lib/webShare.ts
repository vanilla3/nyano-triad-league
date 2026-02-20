export type NativeShareResult = "shared" | "unsupported" | "cancelled";

type NativeShareNavigator = {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
};

type TryNativeShareInput = {
  url: string;
  title?: string;
  text?: string;
  navigatorOverride?: NativeShareNavigator | null;
};

function resolveNavigator(override?: NativeShareNavigator | null): NativeShareNavigator | null {
  if (override) return override;
  if (typeof navigator === "undefined") return null;
  return navigator as NativeShareNavigator;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeName = (error as { name?: unknown }).name;
  return typeof maybeName === "string" && maybeName === "AbortError";
}

export async function tryNativeShare(input: TryNativeShareInput): Promise<NativeShareResult> {
  const nav = resolveNavigator(input.navigatorOverride);
  if (!nav?.share) return "unsupported";

  const payload: ShareData = {
    url: input.url,
  };
  if (input.title) payload.title = input.title;
  if (input.text) payload.text = input.text;

  if (typeof nav.canShare === "function") {
    try {
      if (!nav.canShare(payload)) {
        return "unsupported";
      }
    } catch {
      return "unsupported";
    }
  }

  try {
    await nav.share(payload);
    return "shared";
  } catch (error: unknown) {
    if (isAbortError(error)) return "cancelled";
    throw error;
  }
}
