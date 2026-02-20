import React from "react";
import { describe, expect, it } from "vitest";
import { DuelStageMint } from "../DuelStageMint";

describe("DuelStageMint", () => {
  it("exports DuelStageMint component", async () => {
    const mod = await import("../DuelStageMint");
    expect(mod.DuelStageMint).toBeDefined();
    expect(typeof mod.DuelStageMint).toBe("function");
  });

  it("applies impact/burst classes and renders stage layers", () => {
    const tree = DuelStageMint({
      impact: "high",
      impactBurst: true,
      className: "extra-stage",
      children: "board",
    });

    expect(tree.type).toBe("div");
    expect(tree.props.className).toContain("mint-stage");
    expect(tree.props.className).toContain("mint-stage--impact-high");
    expect(tree.props.className).toContain("mint-stage--impact-burst");
    expect(tree.props.className).toContain("extra-stage");

    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const classNames = children
      .map((child) => (child.props as { className?: string }).className)
      .filter((v): v is string => typeof v === "string");

    expect(classNames.some((c) => c.includes("mint-stage__holo"))).toBe(true);
    expect(classNames.some((c) => c.includes("mint-stage__glow--top"))).toBe(true);
    expect(classNames.some((c) => c.includes("mint-stage__glow--bottom"))).toBe(true);
    expect(classNames.some((c) => c.includes("mint-stage__board"))).toBe(true);
  });
});
