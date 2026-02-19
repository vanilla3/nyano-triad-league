import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MatchEventPanel } from "@/features/match/MatchEventPanel";

function collectElements(node: React.ReactNode): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  const walk = (value: React.ReactNode): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!React.isValidElement(value)) return;
    out.push(value);
    walk(value.props.children as React.ReactNode);
  };
  walk(node);
  return out;
}

function flattenText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (!React.isValidElement(node)) return "";
  return flattenText(node.props.children as React.ReactNode);
}

describe("features/match/MatchEventPanel", () => {
  it("returns null when hidden", () => {
    const tree = MatchEventPanel({
      isVisible: false,
      title: "x",
      description: "y",
      status: "active",
      rulesetKey: "v2",
      aiDifficulty: "normal",
      nyanoDeckTokenIds: ["1", "2", "3", "4", "5"],
      onClearEvent: () => {},
    });
    expect(tree).toBeNull();
  });

  it("renders event details", () => {
    const tree = MatchEventPanel({
      isVisible: true,
      title: "Nyano Open Challenge",
      description: "desc",
      status: "active",
      rulesetKey: "v2",
      aiDifficulty: "normal",
      nyanoDeckTokenIds: ["1", "2", "3", "4", "5"],
      onClearEvent: () => {},
    });
    expect(tree).not.toBeNull();
    if (!tree) return;
    const text = flattenText(tree);
    expect(text).toContain("Event: Nyano Open Challenge");
    expect(text).toContain("active");
    expect(text).toContain("v2");
    expect(text).toContain("normal");
    expect(text).toContain("1, 2, 3, 4, 5");
  });

  it("wires clear button callback", () => {
    const onClearEvent = vi.fn();
    const tree = MatchEventPanel({
      isVisible: true,
      title: "t",
      description: "d",
      status: "active",
      rulesetKey: "v2",
      aiDifficulty: "normal",
      nyanoDeckTokenIds: ["1", "2", "3", "4", "5"],
      onClearEvent,
    });
    expect(tree).not.toBeNull();
    if (!tree) return;

    const button = collectElements(tree).find((element) => element.type === "button");
    expect(button).toBeDefined();
    button?.props.onClick();
    expect(onClearEvent).toHaveBeenCalledTimes(1);
  });
});
