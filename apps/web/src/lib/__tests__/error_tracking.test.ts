import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildRuntimeErrorEventV1,
  clearRuntimeErrorEvents,
  parseErrorTrackingSinks,
  readRuntimeErrorEvents,
  trackRuntimeErrorEvent,
} from "../error_tracking";

const store = new Map<string, string>();
const mockStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
};

describe("error_tracking", () => {
  beforeEach(() => {
    store.clear();
  });

  it("parses sink mode strings", () => {
    expect(parseErrorTrackingSinks(undefined)).toEqual(["local"]);
    expect(parseErrorTrackingSinks("off")).toEqual([]);
    expect(parseErrorTrackingSinks("console")).toEqual(["console"]);
    expect(parseErrorTrackingSinks("local+console")).toEqual(["local", "console"]);
    expect(parseErrorTrackingSinks("sentry")).toEqual(["remote"]);
    expect(parseErrorTrackingSinks("unknown")).toEqual(["local"]);
  });

  it("builds a normalized runtime event", () => {
    const ev = buildRuntimeErrorEventV1(
      {
        kind: "error",
        message: "boom",
        route: "/match?event=foo",
        userAgent: "vitest",
        atMs: 1_700_000_000_000,
      },
      { release: "test-release" },
    );

    expect(ev.version).toBe(1);
    expect(ev.kind).toBe("error");
    expect(ev.message).toBe("boom");
    expect(ev.route).toBe("/match?event=foo");
    expect(ev.userAgent).toBe("vitest");
    expect(ev.release).toBe("test-release");
    expect(ev.atIso).toBe("2023-11-14T22:13:20.000Z");
  });

  it("stores events locally and clips to maxEvents", () => {
    for (let i = 0; i < 5; i += 1) {
      trackRuntimeErrorEvent(
        {
          kind: "error",
          message: `boom-${i}`,
          route: "/",
          userAgent: "vitest",
          atMs: 1_700_000_000_000 + i,
        },
        {
          storage: mockStorage,
          config: { sinks: ["local"], maxEvents: 3 },
        },
      );
    }

    const events = readRuntimeErrorEvents(50, mockStorage);
    expect(events).toHaveLength(3);
    expect(events.map((x) => x.message)).toEqual(["boom-2", "boom-3", "boom-4"]);
  });

  it("supports console sink", () => {
    const logger = { error: vi.fn() };
    trackRuntimeErrorEvent(
      {
        kind: "unhandledrejection",
        message: "promise failed",
        route: "/stream",
        userAgent: "vitest",
      },
      {
        storage: mockStorage,
        logger,
        config: { sinks: ["console"], maxEvents: 10 },
      },
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    const firstArg = logger.error.mock.calls[0]?.[0];
    expect(typeof firstArg).toBe("string");
    expect(String(firstArg)).toContain("[nytl-error]");
  });

  it("clears stored events", () => {
    trackRuntimeErrorEvent(
      {
        kind: "error",
        message: "boom",
        route: "/",
        userAgent: "vitest",
      },
      {
        storage: mockStorage,
        config: { sinks: ["local"], maxEvents: 10 },
      },
    );
    expect(readRuntimeErrorEvents(10, mockStorage)).toHaveLength(1);

    clearRuntimeErrorEvents(mockStorage);
    expect(readRuntimeErrorEvents(10, mockStorage)).toHaveLength(0);
  });
});
