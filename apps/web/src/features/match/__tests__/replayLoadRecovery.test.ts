import { describe, expect, it, vi } from "vitest";
import {
  runReplayClearShareParamsFlow,
  runReplayInitialAutoLoadFlow,
  runReplayRetryLoadFlow,
} from "@/features/match/replayLoadRecovery";
import { base64UrlEncodeUtf8 } from "@/lib/base64url";

describe("features/match/replayLoadRecovery", () => {
  it("retry flow sets decode error without invoking load", async () => {
    const setReplayError = vi.fn();
    const setText = vi.fn();
    const load = vi.fn();

    const result = await runReplayRetryLoadFlow({
      searchParams: new URLSearchParams("t=@@invalid@@"),
      mode: "v2",
      step: 3,
      load,
      setText,
      setReplayError,
    });

    expect(result).toBe("error");
    expect(setReplayError).toHaveBeenCalledOnce();
    expect(setText).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
  });

  it("retry flow loads decoded share payload with current mode and step", async () => {
    const setReplayError = vi.fn();
    const setText = vi.fn();
    const load = vi.fn().mockResolvedValue(undefined);
    const text = "{\"hello\":1}";

    const result = await runReplayRetryLoadFlow({
      searchParams: new URLSearchParams(`t=${base64UrlEncodeUtf8(text)}`),
      mode: "compare",
      step: 5,
      load,
      setText,
      setReplayError,
    });

    expect(result).toBe("shared");
    expect(setText).toHaveBeenCalledWith(text);
    expect(load).toHaveBeenCalledWith({ text, mode: "compare", step: 5 });
    expect(setReplayError).not.toHaveBeenCalled();
  });

  it("retry flow falls back to current textarea load when no share params exist", async () => {
    const setReplayError = vi.fn();
    const setText = vi.fn();
    const load = vi.fn().mockResolvedValue(undefined);

    const result = await runReplayRetryLoadFlow({
      searchParams: new URLSearchParams("ui=engine"),
      mode: "auto",
      step: 0,
      load,
      setText,
      setReplayError,
    });

    expect(result).toBe("current");
    expect(load).toHaveBeenCalledWith();
    expect(setText).not.toHaveBeenCalled();
    expect(setReplayError).not.toHaveBeenCalled();
  });

  it("initial auto-load does nothing for none payload", async () => {
    const setReplayError = vi.fn();
    const setText = vi.fn();
    const load = vi.fn();

    const result = await runReplayInitialAutoLoadFlow({
      initialSharePayload: { kind: "none" },
      initialMode: "auto",
      initialStep: 0,
      load,
      setText,
      setReplayError,
    });

    expect(result).toBe("none");
    expect(load).not.toHaveBeenCalled();
    expect(setText).not.toHaveBeenCalled();
    expect(setReplayError).not.toHaveBeenCalled();
  });

  it("initial auto-load surfaces decode error payload", async () => {
    const setReplayError = vi.fn();
    const setText = vi.fn();
    const load = vi.fn();

    const result = await runReplayInitialAutoLoadFlow({
      initialSharePayload: { kind: "error", param: "t", error: "bad share" },
      initialMode: "auto",
      initialStep: 0,
      load,
      setText,
      setReplayError,
    });

    expect(result).toBe("error");
    expect(setReplayError).toHaveBeenCalledWith("bad share");
    expect(load).not.toHaveBeenCalled();
    expect(setText).not.toHaveBeenCalled();
  });

  it("initial auto-load runs shared payload with initial mode and step", async () => {
    const setReplayError = vi.fn();
    const setText = vi.fn();
    const load = vi.fn().mockResolvedValue(undefined);

    const result = await runReplayInitialAutoLoadFlow({
      initialSharePayload: { kind: "ok", param: "z", text: "{\"seed\":1}" },
      initialMode: "v1",
      initialStep: 7,
      load,
      setText,
      setReplayError,
    });

    expect(result).toBe("loaded");
    expect(setText).toHaveBeenCalledWith("{\"seed\":1}");
    expect(load).toHaveBeenCalledWith({ text: "{\"seed\":1}", mode: "v1", step: 7 });
    expect(setReplayError).not.toHaveBeenCalled();
  });

  it("clear share params flow resets search params and replay error prompt", () => {
    const setSearchParams = vi.fn();
    const setReplayError = vi.fn();

    const didMutate = runReplayClearShareParamsFlow({
      searchParams: new URLSearchParams("t=abc&mode=v2&step=2"),
      setSearchParams,
      setReplayError,
      replayInputPromptError: "input prompt",
    });

    expect(didMutate).toBe(true);
    expect(setSearchParams).toHaveBeenCalledOnce();
    const [nextParams, opts] = setSearchParams.mock.calls[0] as [URLSearchParams, { replace?: boolean }];
    expect(nextParams.get("t")).toBeNull();
    expect(nextParams.get("z")).toBeNull();
    expect(opts).toEqual({ replace: true });
    expect(setReplayError).toHaveBeenCalledWith("input prompt");
  });

  it("clear share params flow still resets replay error when no share params exist", () => {
    const setSearchParams = vi.fn();
    const setReplayError = vi.fn();

    const didMutate = runReplayClearShareParamsFlow({
      searchParams: new URLSearchParams("ui=engine"),
      setSearchParams,
      setReplayError,
      replayInputPromptError: "input prompt",
    });

    expect(didMutate).toBe(false);
    expect(setSearchParams).not.toHaveBeenCalled();
    expect(setReplayError).toHaveBeenCalledWith("input prompt");
  });
});
