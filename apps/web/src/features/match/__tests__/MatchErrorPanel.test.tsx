import { describe, expect, it } from "vitest";
import { MatchErrorPanel } from "@/features/match/MatchErrorPanel";

describe("features/match/MatchErrorPanel", () => {
  it("renders error shell with provided content", () => {
    const tree = MatchErrorPanel({
      children: "error text",
    });
    expect(tree.type).toBe("div");
    expect(tree.props.className).toBe("rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900");
    expect(tree.props.children).toBe("error text");
  });
});
