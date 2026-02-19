import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MatchCardLoadEmptyStatePanel } from "@/features/match/MatchCardLoadEmptyStatePanel";

describe("features/match/MatchCardLoadEmptyStatePanel", () => {
  it("renders loading skeleton layout", () => {
    const html = renderToStaticMarkup(
      <MatchCardLoadEmptyStatePanel state="loading" onLoadGuestCards={() => {}} />,
    );
    expect(html).toContain("max-w-[280px] mx-auto");
    expect(html).toContain("max-w-[400px] mx-auto");
  });

  it("renders guest load button and calls callback", () => {
    const onLoadGuestCards = vi.fn();
    const tree = MatchCardLoadEmptyStatePanel({
      state: "guest_prompt",
      onLoadGuestCards,
    });
    const button = tree.props.children as React.ReactElement;
    expect(button.type).toBe("button");
    expect(button.props.children).toBe("Load guest cards");
    button.props.onClick();
    expect(onLoadGuestCards).toHaveBeenCalledTimes(1);
  });

  it("renders setup prompt copy", () => {
    const html = renderToStaticMarkup(
      <MatchCardLoadEmptyStatePanel state="setup_prompt" onLoadGuestCards={() => {}} />,
    );
    expect(html).toContain("Select decks in Match Setup and press");
    expect(html).toContain("Load cards");
  });
});
