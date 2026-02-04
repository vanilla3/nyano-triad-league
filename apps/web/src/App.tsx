import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const NavItem = (props: { to: string; label: string }) => {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        [
          "rounded-lg px-3 py-2 text-sm font-medium no-underline",
          isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
        ].join(" ")
      }
    >
      {props.label}
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
    <div>
      <header className="border-b border-slate-200 bg-white">
        <div className="container-page flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline gap-3">
            <div className="text-lg font-semibold tracking-tight">Nyano Triad League</div>
            <div className="text-xs text-slate-500">ETH-only · Protocol-first</div>
          </div>

          <nav className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <NavGroup title="Play">
              <NavItem to="/arena" label="Arena" />
              <NavItem to="/decks" label="Decks" />
              <NavItem to="/match" label="Match" />
            </NavGroup>

            <NavGroup title="Watch">
              <NavItem to="/replay" label="Replay" />
            </NavGroup>

            <NavGroup title="Tools">
              <NavItem to="/playground" label="Playground" />
              <NavItem to="/nyano" label="Nyano" />
              <NavItem to="/rulesets" label="Rulesets" />
            </NavGroup>

            <NavGroup title="">
              <NavItem to="/" label="Home" />
            </NavGroup>
          </nav>
        </div>
      </header>

      <main className="container-page">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container-page text-xs text-slate-500">
          Built for replayability & community verification. No promises, just determinism.
        </div>
      </footer>
    </div>
  );
}
