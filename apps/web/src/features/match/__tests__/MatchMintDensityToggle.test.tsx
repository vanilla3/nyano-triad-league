import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MatchMintDensityToggle } from "@/features/match/MatchMintDensityToggle";

function collectButtons(node: React.ReactNode): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  const walk = (value: React.ReactNode): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!React.isValidElement(value)) return;
    if (value.type === "button") out.push(value);
    walk(value.props.children as React.ReactNode);
  };
  walk(node);
  return out;
}

describe("features/match/MatchMintDensityToggle", () => {
  it("renders three density options", () => {
    const tree = MatchMintDensityToggle({
      value: "standard",
      onChange: () => {},
    });
    const buttons = collectButtons(tree);
    expect(buttons).toHaveLength(3);
    expect(buttons[0]?.props.children).toBe("Minimal");
    expect(buttons[1]?.props.children).toBe("Standard");
    expect(buttons[2]?.props.children).toBe("Full");
  });

  it("highlights selected option style", () => {
    const tree = MatchMintDensityToggle({
      value: "full",
      onChange: () => {},
    });
    const buttons = collectButtons(tree);
    expect(buttons[2]?.props.style.background).toBe("var(--mint-accent)");
    expect(buttons[2]?.props.style.color).toBe("white");
    expect(buttons[0]?.props.style.background).toBe("transparent");
  });

  it("wires onChange callback", () => {
    const onChange = vi.fn();
    const tree = MatchMintDensityToggle({
      value: "minimal",
      onChange,
    });
    const buttons = collectButtons(tree);
    buttons[1]?.props.onClick();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("standard");
  });
});
