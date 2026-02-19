import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MatchMintDrawerShell } from "@/features/match/MatchMintDrawerShell";
import { MatchDrawerMint, DrawerToggleButton } from "@/components/MatchDrawerMint";

describe("features/match/MatchMintDrawerShell", () => {
  it("renders toggle and drawer when closed", () => {
    const tree = MatchMintDrawerShell({
      open: false,
      onOpen: () => {},
      onClose: () => {},
      children: <div>panels</div>,
    });
    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    expect(children[0]?.type).toBe(DrawerToggleButton);
    expect(children[1]?.type).toBe(MatchDrawerMint);
  });

  it("hides toggle when already open", () => {
    const tree = MatchMintDrawerShell({
      open: true,
      onOpen: () => {},
      onClose: () => {},
      children: <div>panels</div>,
    });
    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    expect(children).toHaveLength(1);
    expect(children[0]?.type).toBe(MatchDrawerMint);
  });

  it("forwards callbacks and children", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const panel = <div>panel-child</div>;
    const tree = MatchMintDrawerShell({
      open: false,
      onOpen,
      onClose,
      children: panel,
    });
    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const toggle = children[0];
    const drawer = children[1];
    expect(toggle?.props.onClick).toBe(onOpen);
    expect(drawer?.props.onClose).toBe(onClose);
    expect(drawer?.props.children).toEqual(panel);
  });
});
