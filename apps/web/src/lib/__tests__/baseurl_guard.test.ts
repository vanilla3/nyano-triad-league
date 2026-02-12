import { describe, expect, it } from "vitest";

describe("BASE_URL guard", () => {
  it("does not use window.location.origin outside appUrl.ts", () => {
    const sources = import.meta.glob("../../**/*.{ts,tsx}", {
      eager: true,
      query: "?raw",
      import: "default",
    }) as Record<string, string>;
    const offenders: string[] = [];

    for (const [path, content] of Object.entries(sources)) {
      if (path.includes("__tests__") || path.endsWith(".test.ts") || path.endsWith(".test.tsx")) continue;
      if (path.endsWith("/appUrl.ts")) continue;
      if (content.includes("window.location.origin")) {
        offenders.push(path);
      }
    }

    expect(offenders).toEqual([]);
  });
});
