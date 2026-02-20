import { describe, expect, it } from "vitest";
import { resolveMatchStageLayoutClasses } from "@/features/match/matchStageLayoutClasses";

function resolveLayout(
  input: Partial<Parameters<typeof resolveMatchStageLayoutClasses>[0]> = {},
) {
  return resolveMatchStageLayoutClasses({
    isStageFocusRoute: false,
    showStageFocusHandDock: false,
    isEngineFocus: false,
    isRpg: false,
    useMintUi: true,
    showMintPlayerPanels: false,
    ...input,
  });
}

describe("features/match/matchStageLayoutClasses", () => {
  it("resolves root and toolbar classes for stage-focus route", () => {
    const layout = resolveLayout({
      isStageFocusRoute: true,
      showStageFocusHandDock: true,
      isEngineFocus: true,
    });
    expect(layout.rootClassName).toContain("stage-focus-root");
    expect(layout.rootClassName).toContain("stage-focus-root--with-hand-dock");
    expect(layout.focusToolbarClassName).toContain("stage-focus-toolbar");
    expect(layout.focusToolbarAriaLabel).toBe("Stage focus toolbar");
  });

  it("resolves non-focus root and toolbar labels", () => {
    const engineFocus = resolveLayout({ isEngineFocus: true });
    expect(engineFocus.rootClassName).toBe("grid gap-4");
    expect(engineFocus.focusToolbarAriaLabel).toBe("Engine focus toolbar");

    const standard = resolveLayout({ isEngineFocus: false });
    expect(standard.rootClassName).toBe("grid gap-6");
  });

  it("resolves arena and board layout classes across focus/mint branches", () => {
    const focus = resolveLayout({
      isStageFocusRoute: true,
      isEngineFocus: true,
      useMintUi: true,
      showMintPlayerPanels: true,
    });
    expect(focus.arenaSectionClassName).toContain("stage-focus-arena-shell");
    expect(focus.arenaInnerClassName).toContain("stage-focus-arena-inner");
    expect(focus.arenaGridClassName).toContain("stage-focus-columns");
    expect(focus.mainColumnClassName).toContain("stage-focus-main-column");
    expect(focus.boardShellClassName).toContain("stage-focus-board-shell");
    expect(focus.boardShellClassName).toContain("mint-battle-layout");
    expect(focus.boardCenterClassName).toContain("mint-battle-layout__board");
    expect(focus.boardCenterClassName).toContain("mint-match-board-center");
    expect(focus.nonMintSideColumnClassName).toContain("stage-focus-side-column");
  });

  it("resolves non-engine and non-mint fallbacks", () => {
    const rpg = resolveLayout({
      isEngineFocus: false,
      isRpg: true,
      useMintUi: false,
    });
    expect(rpg.arenaSectionClassName).toBe("rounded-2xl");
    expect(rpg.arenaInnerClassName).toBe("p-4");
    expect(rpg.arenaGridClassName).toBe("grid gap-6 lg:grid-cols-[1fr_300px]");
  });

  it("resolves announcer and renderer fallback banner class toggles", () => {
    const focus = resolveLayout({ isStageFocusRoute: true });
    expect(focus.announcerStackClassName).toContain("stage-focus-announcer-stack");
    expect(focus.announcerStackClassName).toContain("min-h-[1px]");
    expect(focus.engineFallbackBannerClassName).toContain("fixed left-3 right-3 top-20 z-40 shadow-lg");

    const normal = resolveLayout({ isStageFocusRoute: false });
    expect(normal.announcerStackClassName).toBe("mint-announcer-stack");
    expect(normal.engineFallbackBannerClassName).not.toContain("fixed left-3 right-3 top-20 z-40 shadow-lg");
  });
});
