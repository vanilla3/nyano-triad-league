import React from "react";
import { NavLink, Link, useSearchParams } from "react-router-dom";
import { AnimatedOutlet } from "@/components/AnimatedOutlet";
import { AppErrorBoundary } from "@/components/EmptyState";
import { ToastProvider } from "./components/Toast";

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

export function AppLayout() {
  const [searchParams] = useSearchParams();
  const theme = searchParams.get("theme") ?? localStorage.getItem("nytl.theme") ?? "mint";

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
      <header className="app-header sticky top-0 z-30">
        <div className="mx-auto max-w-7xl flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
          {/* Brand lockup */}
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

          {/* Navigation */}
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
            </NavGroup>
          </nav>
        </div>
      </header>

      <main className="flex-1 container-page">
        <AppErrorBoundary fallbackTitle="ページの読み込みに失敗しました">
          <AnimatedOutlet />
        </AppErrorBoundary>
      </main>

      <footer className="app-footer">
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
      </footer>
      </div>
    </ToastProvider>
  );
}
