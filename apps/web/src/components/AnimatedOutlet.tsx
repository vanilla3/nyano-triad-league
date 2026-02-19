import React from "react";
import { useLocation, Outlet } from "react-router-dom";

/**
 * AnimatedOutlet — wraps React Router's <Outlet /> with a fade-in
 * transition that triggers on every route change.
 *
 * Uses `key={pathname}` to force React to remount the outlet content,
 * which replays the `mint-motion-enter` CSS animation.
 */
export function AnimatedOutlet() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="mint-motion-enter">
      <Outlet />
    </div>
  );
}
