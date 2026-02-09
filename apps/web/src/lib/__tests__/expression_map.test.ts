import { describe, it, expect } from "vitest";
import { reactionToExpression, expressionImageUrl } from "../expression_map";

describe("reactionToExpression", () => {
  it('"idle" → "calm"', () => {
    expect(reactionToExpression("idle")).toBe("calm");
  });

  it('"victory" → "happy"', () => {
    expect(reactionToExpression("victory")).toBe("happy");
  });

  it('"defeat" → "sadTears"', () => {
    expect(reactionToExpression("defeat")).toBe("sadTears");
  });

  it('"fever" → "happy"', () => {
    expect(reactionToExpression("fever")).toBe("happy");
  });
});

describe("expressionImageUrl", () => {
  it("happy uses shared path (no variant)", () => {
    expect(expressionImageUrl("eyeWhite", "happy")).toBe("/nyano/expressions/happy.webp");
    expect(expressionImageUrl("eyeBlack", "happy")).toBe("/nyano/expressions/happy.webp");
    expect(expressionImageUrl("eyeS", "happy")).toBe("/nyano/expressions/happy.webp");
  });

  it("non-happy uses variant path", () => {
    expect(expressionImageUrl("eyeBlack", "calm")).toBe("/nyano/expressions/eyeBlack/calm.webp");
  });

  it("eyeS variant", () => {
    expect(expressionImageUrl("eyeS", "anger")).toBe("/nyano/expressions/eyeS/anger.webp");
  });
});
