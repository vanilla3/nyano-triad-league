import React from "react";
import { describe, expect, it } from "vitest";
import { NyanoReaction } from "../NyanoReaction";
import { NyanoReactionSlot } from "../NyanoReactionSlot";

const BASE_INPUT = {
  flipCount: 2,
  hasChain: false,
  comboEffect: "none" as const,
  warningTriggered: false,
  tilesA: 4,
  tilesB: 2,
  perspective: 0 as const,
  finished: false,
};

const IDLE_INPUT = {
  flipCount: 0,
  hasChain: false,
  comboEffect: "none" as const,
  warningTriggered: false,
  tilesA: 0,
  tilesB: 0,
  perspective: 0 as const,
  finished: false,
};

describe("NyanoReactionSlot", () => {
  it("always renders a slot container to keep layout stable", () => {
    const node = NyanoReactionSlot({
      input: null,
      turnIndex: 0,
      mint: true,
      stageFocus: true,
    });

    expect(node.type).toBe("div");
    expect(node.props["data-testid"]).toBe("nyano-reaction-slot");
    expect(node.props.className).toContain("mint-nyano-reaction-slot");
    expect(node.props.className).toContain("mint-nyano-reaction-slot--idle");
    expect(node.props.className).toContain("mint-nyano-reaction-slot--stage-focus");
    expect(node.props["aria-live"]).toBe("polite");
  });

  it("renders NyanoReaction when input exists", () => {
    const node = NyanoReactionSlot({
      input: BASE_INPUT,
      turnIndex: 9,
      mint: true,
      tone: "pixi",
      stageFocus: true,
    });

    const children = React.Children.toArray(node.props.children);
    expect(children).toHaveLength(2);
    const content = children[1] as React.ReactElement;
    expect(content.props.className).toBe("mint-nyano-reaction-slot__content");
    const reactionNode = React.Children.toArray(content.props.children)[0] as React.ReactElement;
    expect(reactionNode.type).toBe(NyanoReaction);
    expect(reactionNode.props.className).toBe("stage-focus-cutin");
    expect(node.props.className).toContain("mint-nyano-reaction-slot--active");
  });

  it("keeps slot idle when input exists but reaction kind is idle", () => {
    const node = NyanoReactionSlot({
      input: IDLE_INPUT,
      turnIndex: 1,
      mint: true,
    });

    expect(node.props.className).toContain("mint-nyano-reaction-slot--idle");
    const children = React.Children.toArray(node.props.children) as React.ReactElement[];
    expect((children[0].props as { className?: string }).className).toBe("mint-nyano-reaction-slot__placeholder");
  });
});
