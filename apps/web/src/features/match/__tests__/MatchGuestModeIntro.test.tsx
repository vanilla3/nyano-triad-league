import React from "react";
import { describe, expect, it } from "vitest";
import { MatchGuestModeIntro } from "@/features/match/MatchGuestModeIntro";

function flattenText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (!React.isValidElement(node)) return "";
  return flattenText(node.props.children as React.ReactNode);
}

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

describe("features/match/MatchGuestModeIntro", () => {
  it("returns null when hidden", () => {
    const tree = MatchGuestModeIntro({
      isVisible: false,
      tutorial: null,
    });
    expect(tree).toBeNull();
  });

  it("renders banner copy and decks link text when visible", () => {
    const tree = MatchGuestModeIntro({
      isVisible: true,
      tutorial: null,
    });
    expect(tree).not.toBeNull();
    if (!tree) return;

    const text = flattenText(tree);
    expect(text).toContain("Guest Quick Play");
    expect(text).toContain("Decks");
    const sections = collectElements(tree).filter((element) => element.type === "section");
    expect(sections).toHaveLength(1);
  });

  it("renders tutorial node after banner", () => {
    const tree = MatchGuestModeIntro({
      isVisible: true,
      tutorial: <div data-testid="tutorial">tutorial</div>,
    });
    expect(tree).not.toBeNull();
    if (!tree) return;

    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    expect(children[1]?.props["data-testid"]).toBe("tutorial");
  });
});
