import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MatchGuestPostGamePanel } from "@/features/match/MatchGuestPostGamePanel";

function collectElementsByType(node: React.ReactNode, elementType: string): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  const walk = (value: React.ReactNode): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!React.isValidElement(value)) return;
    if (value.type === elementType) out.push(value);
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

describe("features/match/MatchGuestPostGamePanel", () => {
  it("returns null when hidden", () => {
    const tree = MatchGuestPostGamePanel({
      isVisible: false,
      isRpg: false,
      isStageFocusRoute: false,
      guestDeckSaved: false,
      canFinalize: false,
      onRematch: () => {},
      onLoadNewGuestDeck: () => {},
      onSaveGuestDeck: () => {},
      onCopyShareUrl: () => {},
      onCopyShareTemplate: () => {},
      onOpenReplay: () => {},
      qrCode: null,
    });
    expect(tree).toBeNull();
  });

  it("renders CTA copy and save label states", () => {
    const tree = MatchGuestPostGamePanel({
      isVisible: true,
      isRpg: false,
      isStageFocusRoute: true,
      guestDeckSaved: true,
      canFinalize: false,
      onRematch: () => {},
      onLoadNewGuestDeck: () => {},
      onSaveGuestDeck: () => {},
      onCopyShareUrl: () => {},
      onCopyShareTemplate: () => {},
      onOpenReplay: () => {},
      qrCode: <div>qr</div>,
    });
    expect(tree).not.toBeNull();
    if (!tree) return;
    expect(tree.props.className).toContain("stage-focus-side-panel");
    const rootChildren = React.Children.toArray(tree.props.children) as React.ReactElement[];
    expect(rootChildren[0]?.props.children).toBe("Enjoyed this guest deck?");

    const actionRow = rootChildren[1];
    const actionButtons = React.Children.toArray(actionRow.props.children)
      .filter((child): child is React.ReactElement => React.isValidElement(child) && child.type === "button");
    expect(actionButtons[2]?.props.children).toBe("Saved");
    expect(collectElementsByClass(tree, "mint-share-actions__hint")).toHaveLength(1);
    expect(collectElementsByClass(tree, "mint-share-actions__status")).toHaveLength(1);

    expect(collectElementsByType(tree, "details")).toHaveLength(0);
  });

  it("wires guest action callbacks and shows QR details when finalizable", () => {
    const onRematch = vi.fn();
    const onLoadNewGuestDeck = vi.fn();
    const onSaveGuestDeck = vi.fn();
    const onCopyShareUrl = vi.fn();
    const onCopyShareTemplate = vi.fn();
    const onOpenReplay = vi.fn();

    const tree = MatchGuestPostGamePanel({
      isVisible: true,
      isRpg: false,
      isStageFocusRoute: false,
      guestDeckSaved: false,
      canFinalize: true,
      onRematch,
      onLoadNewGuestDeck,
      onSaveGuestDeck,
      onCopyShareUrl,
      onCopyShareTemplate,
      onOpenReplay,
      qrCode: <div data-testid="qr">QR</div>,
    });

    expect(tree).not.toBeNull();
    if (!tree) return;

    const rootChildren = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const actionRow = rootChildren[1];
    const actionButtons = React.Children.toArray(actionRow.props.children)
      .filter((child): child is React.ReactElement => React.isValidElement(child) && child.type === "button");
    actionButtons[0]?.props.onClick();
    actionButtons[1]?.props.onClick();
    actionButtons[2]?.props.onClick();

    const shareSection = rootChildren[2];
    const shareSectionChildren = React.Children.toArray(shareSection.props.children) as React.ReactElement[];
    const shareRow = shareSectionChildren[0];
    const shareButtons = React.Children.toArray(shareRow.props.children)
      .filter((child): child is React.ReactElement => React.isValidElement(child) && child.type === "button");
    expect(String(shareRow.props.className)).toContain("mint-share-actions__row--ready");
    shareButtons[0]?.props.onClick();
    shareButtons[1]?.props.onClick();
    shareButtons[2]?.props.onClick();

    expect(onRematch).toHaveBeenCalledTimes(1);
    expect(onLoadNewGuestDeck).toHaveBeenCalledTimes(1);
    expect(onSaveGuestDeck).toHaveBeenCalledTimes(1);
    expect(onCopyShareUrl).toHaveBeenCalledTimes(1);
    expect(onCopyShareTemplate).toHaveBeenCalledTimes(1);
    expect(onOpenReplay).toHaveBeenCalledTimes(1);

    const details = collectElementsByType(tree, "details");
    expect(details).toHaveLength(1);
    const summary = collectElementsByType(details[0], "summary")[0];
    expect(summary.props.children).toContain("QR Code");
    expect(collectElementsByClass(tree, "mint-share-actions__hint")).toHaveLength(0);
    expect(collectElementsByClass(tree, "mint-share-actions__ready")).toHaveLength(1);
    expect(collectElementsByClass(tree, "mint-share-actions__status")).toHaveLength(1);
  });
});
