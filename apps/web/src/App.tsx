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

export function AppLayout() {
  return (
    <div>
      <header className="border-b border-slate-200 bg-white">
        <div className="container-page flex items-center justify-between py-4">
          <div className="flex items-baseline gap-3">
            <div className="text-lg font-semibold tracking-tight">Nyano Triad League</div>
            <div className="text-xs text-slate-500">ETH-only · Protocol-first</div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <NavItem to="/" label="Home" />
            <NavItem to="/playground" label="Playground" />
            <NavItem to="/replay" label="Replay" />
            <NavItem to="/nyano" label="Nyano" />
            <NavItem to="/rulesets" label="Rulesets" />
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
