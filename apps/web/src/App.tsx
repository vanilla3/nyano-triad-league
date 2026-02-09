import React from "react";
import { NavLink } from "react-router-dom";
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
    <div className="flex flex-wrap items-center gap-2">
      <div className="hidden text-xs font-medium text-slate-500 md:block">{props.title}</div>
      {props.children}
    </div>
  );
};

export function AppLayout() {
  return (
    <ToastProvider>
      <div>
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="container-page flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline gap-3">
            <div className="text-lg font-semibold tracking-tight">
              Nyano Triad League <span className="text-rose-500">🐾</span>
            </div>
            <div className="text-xs text-slate-500">ETH-only · replay-first</div>
          </div>

          <nav className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <NavGroup title="Play">
              <NavItem to="/arena" label="Arena" emoji="🏟️" />
              <NavItem to="/events" label="Events" emoji="🎀" />
              <NavItem to="/decks" label="Decks" emoji="🧩" />
              <NavItem to="/match" label="Match" emoji="⚔️" />
            </NavGroup>

            <NavGroup title="Watch">
              <NavItem to="/replay" label="Replay" emoji="🎞️" />
            </NavGroup>

            <NavGroup title="Tools">
              <NavItem to="/playground" label="Playground" emoji="🧪" />
              <NavItem to="/nyano" label="Nyano" emoji="🐾" />
              <NavItem to="/rulesets" label="Rulesets" emoji="📜" />
              <NavItem to="/stream" label="Stream" emoji="🎥" />
            </NavGroup>

            <NavGroup title="">
              <NavItem to="/" label="Home" emoji="🏠" />
            </NavGroup>
          </nav>
        </div>
      </header>

      <main className="container-page">
        <AppErrorBoundary fallbackTitle="ページの読み込みに失敗しました">
          <AnimatedOutlet />
        </AppErrorBoundary>
      </main>

      <footer className="border-t border-slate-200/70 bg-white/60 backdrop-blur">
        <div className="container-page text-xs text-slate-500">
          Built for replayability & community verification. No promises, just determinism.
        </div>
      </footer>
      </div>
    </ToastProvider>
  );
}
