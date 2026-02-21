import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MatchShareActionsRow } from "@/features/match/MatchShareActionsRow";

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

function collectElementsByClass(node: React.ReactNode, className: string): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  const walk = (value: React.ReactNode): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!React.isValidElement(value)) return;
    if (typeof value.props.className === "string" && value.props.className.split(/\s+/).includes(className)) {
      out.push(value);
    }
    walk(value.props.children as React.ReactNode);
  };
  walk(node);
  return out;
}

describe("features/match/MatchShareActionsRow", () => {
  it("uses default button class when not rpg", () => {
    const tree = MatchShareActionsRow({
      isRpg: false,
      simOk: false,
      canFinalize: false,
      onCopyTranscriptJson: () => {},
      onCopyShareUrl: () => {},
      onOpenReplay: () => {},
    });
    const buttons = collectButtons(tree);
    expect(buttons).toHaveLength(3);
    expect(buttons[0]?.props.className).toContain("btn");
    expect(buttons[0]?.props.disabled).toBe(true);
    expect(buttons[1]?.props.disabled).toBe(true);
    expect(buttons[2]?.props.disabled).toBe(true);
  });

  it("uses rpg button class and enables when finalizeable", () => {
    const tree = MatchShareActionsRow({
      isRpg: true,
      simOk: true,
      canFinalize: true,
      onCopyTranscriptJson: () => {},
      onCopyShareUrl: () => {},
      onOpenReplay: () => {},
    });
    const buttons = collectButtons(tree);
    expect(buttons[0]?.props.className).toBe("rpg-result__btn");
    expect(buttons[0]?.props.disabled).toBe(false);
    expect(buttons[1]?.props.disabled).toBe(false);
    expect(buttons[2]?.props.disabled).toBe(false);
  });

  it("wires callbacks", () => {
    const onCopyTranscriptJson = vi.fn();
    const onCopyShareUrl = vi.fn();
    const onOpenReplay = vi.fn();
    const tree = MatchShareActionsRow({
      isRpg: false,
      simOk: true,
      canFinalize: true,
      onCopyTranscriptJson,
      onCopyShareUrl,
      onOpenReplay,
    });
    const buttons = collectButtons(tree);
    buttons[0]?.props.onClick();
    buttons[1]?.props.onClick();
    buttons[2]?.props.onClick();
    expect(onCopyTranscriptJson).toHaveBeenCalledTimes(1);
    expect(onCopyShareUrl).toHaveBeenCalledTimes(1);
    expect(onOpenReplay).toHaveBeenCalledTimes(1);
  });

  it("shows share-ready state only after finalize unlock", () => {
    const lockedTree = MatchShareActionsRow({
      isRpg: false,
      simOk: true,
      canFinalize: false,
      onCopyTranscriptJson: () => {},
      onCopyShareUrl: () => {},
      onOpenReplay: () => {},
    });
    expect(collectElementsByClass(lockedTree, "mint-share-actions__hint")).toHaveLength(1);
    expect(collectElementsByClass(lockedTree, "mint-share-actions__ready")).toHaveLength(0);
    expect(collectElementsByClass(lockedTree, "mint-share-actions__row--ready")).toHaveLength(0);

    const readyTree = MatchShareActionsRow({
      isRpg: false,
      simOk: true,
      canFinalize: true,
      onCopyTranscriptJson: () => {},
      onCopyShareUrl: () => {},
      onOpenReplay: () => {},
    });
    expect(collectElementsByClass(readyTree, "mint-share-actions__hint")).toHaveLength(0);
    expect(collectElementsByClass(readyTree, "mint-share-actions__ready")).toHaveLength(1);
    expect(collectElementsByClass(readyTree, "mint-share-actions__row--ready")).toHaveLength(1);
  });
});
