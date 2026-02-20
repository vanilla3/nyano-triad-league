import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";

import { MintPressable } from "../MintPressable";

describe("MintPressable", () => {
  it("exports component", async () => {
    const mod = await import("../MintPressable");
    expect(mod.MintPressable).toBeDefined();
    expect(typeof mod.MintPressable).toBe("function");
  });

  it("renders button variant with default mint utility classes", () => {
    const html = renderToStaticMarkup(
      React.createElement(MintPressable, { className: "qa-pressable", children: "Play" }),
    );

    expect(html).toContain("mint-pressable");
    expect(html).toContain("mint-ui-pressable");
    expect(html).toContain("mint-hit");
    expect(html).toContain("mint-ui-pressable--default");
    expect(html).toContain("mint-ui-pressable--md");
    expect(html).toContain("qa-pressable");
    expect(html).toContain(">Play<");
  });

  it("renders link variant with tone/size/full-width classes", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        StaticRouter,
        { location: "/" },
        React.createElement(
          MintPressable,
          { to: "/match", tone: "primary", size: "lg", fullWidth: true, children: "Start" },
        ),
      ),
    );

    expect(html).toContain("href=\"/match\"");
    expect(html).toContain("mint-ui-pressable--primary");
    expect(html).toContain("mint-ui-pressable--lg");
    expect(html).toContain("mint-ui-pressable--full");
  });

  it("renders disabled link variant as aria-disabled span", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        StaticRouter,
        { location: "/" },
        React.createElement(MintPressable, { to: "/replay", disabled: true, children: "Disabled" }),
      ),
    );

    expect(html).toContain("<span");
    expect(html).toContain("aria-disabled=\"true\"");
    expect(html).toContain("mint-ui-pressable--disabled");
    expect(html).not.toContain("href=\"/replay\"");
  });
});
