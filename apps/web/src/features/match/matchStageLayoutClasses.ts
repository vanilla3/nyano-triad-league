export function resolveMatchStageLayoutClasses(input: {
  isStageFocusRoute: boolean;
  showStageFocusHandDock: boolean;
  isEngineFocus: boolean;
  isRpg: boolean;
  useMintUi: boolean;
  showMintPlayerPanels: boolean;
}): {
  rootClassName: string;
  focusToolbarClassName: string;
  focusToolbarAriaLabel: string;
  arenaSectionClassName: string;
  arenaInnerClassName: string;
  arenaGridClassName: string;
  mainColumnClassName: string;
  announcerStackClassName: string;
  engineFallbackBannerClassName: string;
  boardShellClassName: string;
  boardCenterClassName: string;
  nonMintSideColumnClassName: string;
} {
  const rootClassName = input.isStageFocusRoute
    ? [
      "stage-focus-root",
      input.showStageFocusHandDock ? "stage-focus-root--with-hand-dock" : "",
    ].filter(Boolean).join(" ")
    : input.isEngineFocus
      ? "grid gap-4"
      : "grid gap-6";

  const focusToolbarClassName = [
    "rounded-2xl border px-3 py-2",
    input.isStageFocusRoute ? "stage-focus-toolbar" : "",
  ].filter(Boolean).join(" ");
  const focusToolbarAriaLabel = input.isStageFocusRoute ? "Stage focus toolbar" : "Engine focus toolbar";

  const arenaSectionClassName = input.isEngineFocus
    ? ["rounded-2xl border", input.isStageFocusRoute ? "stage-focus-arena-shell" : ""].filter(Boolean).join(" ")
    : input.isRpg
      ? "rounded-2xl"
      : "card";
  const arenaInnerClassName = input.isRpg
    ? "p-4"
    : input.isEngineFocus
      ? ["p-2 md:p-3", input.isStageFocusRoute ? "stage-focus-arena-inner" : ""].filter(Boolean).join(" ")
      : "card-bd";
  const arenaGridClassName = input.useMintUi
    ? (input.isEngineFocus
      ? ["grid gap-4", input.isStageFocusRoute ? "stage-focus-columns" : ""].filter(Boolean).join(" ")
      : "grid gap-6")
    : "grid gap-6 lg:grid-cols-[1fr_300px]";
  const mainColumnClassName = [
    "grid gap-4",
    input.isStageFocusRoute ? "stage-focus-main-column" : "",
    input.showStageFocusHandDock ? "stage-focus-main-column--with-hand-dock" : "",
  ].filter(Boolean).join(" ");
  const announcerStackClassName = ["mint-announcer-stack", input.isStageFocusRoute ? "stage-focus-announcer-stack" : ""].filter(Boolean).join(" ");
  const engineFallbackBannerClassName = [
    "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900",
    input.isStageFocusRoute ? "fixed left-3 right-3 top-20 z-40 shadow-lg" : "",
  ].filter(Boolean).join(" ");
  const boardShellClassName = [
    input.isStageFocusRoute ? "stage-focus-board-shell" : "",
    input.useMintUi ? "mint-match-board-shell" : "",
    input.showMintPlayerPanels ? "mint-battle-layout" : "",
  ].filter(Boolean).join(" ");
  const boardCenterClassName = [
    input.showMintPlayerPanels ? "mint-battle-layout__board" : "",
    input.useMintUi ? "mint-match-board-center" : "",
  ].filter(Boolean).join(" ");
  const nonMintSideColumnClassName = ["grid gap-4 content-start", input.isStageFocusRoute ? "stage-focus-side-column" : ""].filter(Boolean).join(" ");

  return {
    rootClassName,
    focusToolbarClassName,
    focusToolbarAriaLabel,
    arenaSectionClassName,
    arenaInnerClassName,
    arenaGridClassName,
    mainColumnClassName,
    announcerStackClassName,
    engineFallbackBannerClassName,
    boardShellClassName,
    boardCenterClassName,
    nonMintSideColumnClassName,
  };
}
