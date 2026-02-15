import React from "react";
import { NavLink, Link, useLocation, useSearchParams } from "react-router-dom";
import { AnimatedOutlet } from "@/components/AnimatedOutlet";
import { AppErrorBoundary } from "@/components/EmptyState";
import { ToastProvider } from "./components/Toast";
import { resolveVfxQuality, applyVfxQualityToDocument } from "@/lib/visual/visualSettings";
import { MintAppChrome } from "@/components/mint/MintAppChrome";
import { MintGameShell } from "@/components/mint/MintGameShell";
import { appendThemeToPath, resolveAppTheme } from "@/lib/theme";
import "@/mint-theme/mint-theme.css";

const NavItem = (props: { to: string; label: string; emoji?: string }) => {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        ["nav-item", isActive ? "nav-item-active" : "nav-item-inactive"].join(" ")
      }
    >
      {props.emoji ? <span aria-hidden="true">{props.emoji}</span> : null}
      <span>{props.label}</span>
    </NavLink>
  );
};

const NavGroup = (props: { title: string; children: React.ReactNode }) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="hidden text-[10px] font-bold uppercase tracking-wider text-surface-400 mr-1 md:block">{props.title}</div>
      {props.children}
    </div>
  );
};

const APP_CHROME_TABS = [
  { to: "/", label: "Home", icon: "start", exact: true },
  { to: "/arena", label: "Arena", icon: "arena" },
  { to: "/decks", label: "Decks", icon: "decks" },
  { to: "/events", label: "Events", icon: "events" },
  { to: "/replay", label: "Replay", icon: "replay" },
  { to: "/stream", label: "Stream", icon: "stream" },
] as const;

export function AppLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const theme = resolveAppTheme(searchParams);
  const isMintTheme = theme === "mint";
  const focusParam = (searchParams.get("focus") ?? searchParams.get("layout") ?? "").toLowerCase();
  const focusEnabled = focusParam === "1" || focusParam === "focus";
  const isStageRoute = /\/(battle-stage|replay-stage)$/.test(location.pathname);
  const focusRoute = isStageRoute || (focusEnabled && /\/(match|replay)$/.test(location.pathname));
  const useMintShell = isMintTheme && !focusRoute;
  const mainClassName = isStageRoute
    ? "flex-1 stage-page"
    : useMintShell
      ? "flex-1 mint-app-main"
      : ["flex-1 container-page", focusRoute ? "container-page--focus" : ""].join(" ").trim();

  const mintTabs = React.useMemo(
    () =>
      APP_CHROME_TABS.map((tab) => ({
        ...tab,
        to: appendThemeToPath(tab.to, theme),
      })),
    [theme],
  );

  const mintFooterLinks = React.useMemo(
    () => [
      { to: appendThemeToPath("/playground", theme), label: "Playground" },
      { to: appendThemeToPath("/nyano", theme), label: "Card Data" },
      { to: appendThemeToPath("/rulesets", theme), label: "Rulesets" },
    ],
    [theme],
  );

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // VFX quality: auto-detect device capability and set data-vfx attribute
  React.useEffect(() => {
    const quality = resolveVfxQuality();
    applyVfxQualityToDocument(quality);
  }, []);

  return (
    <ToastProvider>
      {useMintShell ? (
        <MintGameShell>
          <div className="min-h-screen flex flex-col">
            <MintAppChrome tabs={mintTabs} />

            <main className={mainClassName}>
              <AppErrorBoundary fallbackTitle="ページの読み込みに失敗しました">
                <AnimatedOutlet />
              </AppErrorBoundary>
            </main>

            <footer className="mint-app-footer">
              <div className="mint-app-footer__inner">
                <span className="mint-app-footer__copy">Nyano Triad League</span>
                <div className="mint-app-footer__links">
                  {mintFooterLinks.map((item) => (
                    <Link key={item.label} to={item.to} className="mint-app-footer__link">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </footer>
          </div>
        </MintGameShell>
      ) : (
        <div className="min-h-screen flex flex-col">
          {!focusRoute && <header className="app-header sticky top-0 z-30">
            <div className="mx-auto max-w-7xl flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <Link to="/" className="flex items-center gap-2.5 no-underline group">
                <div className="app-header__logo-mark">
                  <img src="/favicon-32.png" alt="" width={20} height={20} className="block" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold font-display tracking-tight text-surface-900 group-hover:text-nyano-600 transition-colors">
                    Nyano Triad League
                  </span>
                  <span className="hidden sm:inline text-[10px] font-medium text-surface-400 bg-surface-100 rounded-full px-2 py-0.5">
                    beta
                  </span>
                </div>
              </Link>

              <nav className="flex flex-wrap items-center gap-3 md:gap-4">
                <NavGroup title="Play">
                  <NavItem to="/arena" label="Arena" emoji="⚔️" />
                  <NavItem to="/events" label="Events" emoji="🏆" />
                  <NavItem to="/decks" label="Decks" emoji="🃏" />
                </NavGroup>

                <div className="hidden md:block w-px h-5 bg-surface-200" />

                <NavGroup title="Watch">
                  <NavItem to="/replay" label="Replay" emoji="📼" />
                  <NavItem to="/stream" label="Stream" emoji="📺" />
                </NavGroup>

                <div className="hidden md:block w-px h-5 bg-surface-200" />

                <NavGroup title="">
                  <NavItem to="/match" label="Match" emoji="🎮" />
                  <NavItem to="/battle-stage" label="Stage" emoji="🎬" />
                </NavGroup>
              </nav>
            </div>
          </header>}

          <main className={mainClassName}>
            <AppErrorBoundary fallbackTitle="ページの読み込みに失敗しました">
              <AnimatedOutlet />
            </AppErrorBoundary>
          </main>

          {!focusRoute && <footer className="app-footer">
            <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <img src="/favicon-32.png" alt="" width={16} height={16} className="opacity-50" />
                <span className="text-xs font-medium text-surface-500">
                  Nyano Triad League
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-surface-400">
                <Link to="/playground" className="hover:text-surface-600 transition-colors no-underline">Playground</Link>
                <Link to="/nyano" className="hover:text-surface-600 transition-colors no-underline">Card Data</Link>
                <Link to="/rulesets" className="hover:text-surface-600 transition-colors no-underline">Rulesets</Link>
                <span className="text-surface-300">·</span>
                <span>deterministic · community-driven</span>
              </div>
            </div>
          </footer>}
        </div>
      )}
    </ToastProvider>
  );
}
