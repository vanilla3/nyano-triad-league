/* eslint-disable react-refresh/only-export-components */
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AppLayout } from "./App";
import { getAppBasePath } from "./lib/appUrl";
import { installGlobalErrorTracking } from "./lib/error_tracking";

import "./styles.css";

installGlobalErrorTracking();

// ── Eager imports — critical path (home + match) ────────────────────
import { HomePage } from "./pages/Home";
import { MatchPage } from "./pages/Match";
import { BattleStagePage } from "./pages/BattleStage";

// ── Lazy imports — loaded on demand per route ───────────────────────
const ArenaPage = React.lazy(() => import("./pages/Arena").then((m) => ({ default: m.ArenaPage })));
const EventsPage = React.lazy(() => import("./pages/Events").then((m) => ({ default: m.EventsPage })));
const DecksPage = React.lazy(() => import("./pages/Decks").then((m) => ({ default: m.DecksPage })));
const StartPage = React.lazy(() => import("./pages/Start").then((m) => ({ default: m.StartPage })));
const PlaygroundPage = React.lazy(() => import("./pages/Playground").then((m) => ({ default: m.PlaygroundPage })));
const ReplayPage = React.lazy(() => import("./pages/Replay").then((m) => ({ default: m.ReplayPage })));
const ReplayStagePage = React.lazy(() => import("./pages/ReplayStage").then((m) => ({ default: m.ReplayStagePage })));
const NyanoPage = React.lazy(() => import("./pages/Nyano").then((m) => ({ default: m.NyanoPage })));
const RulesetsPage = React.lazy(() => import("./pages/Rulesets").then((m) => ({ default: m.RulesetsPage })));
const StreamPage = React.lazy(() => import("./pages/Stream").then((m) => ({ default: m.StreamPage })));
const OverlayPage = React.lazy(() => import("./pages/Overlay").then((m) => ({ default: m.OverlayPage })));

// ── Route-level loading fallback ────────────────────────────────────
function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="animate-pulse text-sm text-slate-400">Loading…</div>
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

// Support deployment under a subpath (e.g. GitHub Pages `/nyano-triad-league/`).
// Vite's BASE_URL is used both for asset loading and router basename.
const basename = getAppBasePath().replace(/\/$/, "") || "/";

const router = createBrowserRouter([
  {
    path: "/overlay",
    element: <Lazy><OverlayPage /></Lazy>,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "arena", element: <Lazy><ArenaPage /></Lazy> },
      { path: "events", element: <Lazy><EventsPage /></Lazy> },
      { path: "decks", element: <Lazy><DecksPage /></Lazy> },
      { path: "start", element: <Lazy><StartPage /></Lazy> },
      { path: "match", element: <MatchPage /> },
      { path: "battle-stage", element: <BattleStagePage /> },
      { path: "playground", element: <Lazy><PlaygroundPage /></Lazy> },
      { path: "replay", element: <Lazy><ReplayPage /></Lazy> },
      { path: "replay-stage", element: <Lazy><ReplayStagePage /></Lazy> },
      { path: "nyano", element: <Lazy><NyanoPage /></Lazy> },
      { path: "rulesets", element: <Lazy><RulesetsPage /></Lazy> },
      { path: "stream", element: <Lazy><StreamPage /></Lazy> },
    ],
  },
], { basename });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5 },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
