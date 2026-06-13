import React from "react";
import { describe, expect, it } from "vitest";
import { DuelStageMint } from "../DuelStageMint";

function hasChildWithClass(node: React.ReactElement, className: string): boolean {
  const children = React.Children.toArray(node.props.children);
  return children.some((child) => {
    if (!React.isValidElement(child)) return false;
    const props = child.props as { className?: string };
    return typeof props.className === "string" && props.className.split(/\s+/).includes(className);
  });
}

describe("DuelStageMint", () => {
  it("applies burst level class and renders burst particle layer", () => {
    const node = DuelStageMint({
      children: <div data-testid="child">child</div>,
      impact: "high",
      impactBurst: true,
      impactBurstLevel: "hard",
    });

    expect(node.type).toBe("div");
    expect(node.props.className).toContain("mint-stage");
    expect(node.props.className).toContain("mint-stage--impact-high");
    expect(node.props.className).toContain("mint-stage--impact-burst");
    expect(node.props.className).toContain("mint-stage--burst-hard");
    expect(hasChildWithClass(node, "mint-stage__burst-particles")).toBe(true);
  });
});
