import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AppLayout } from "./App";
import { HomePage } from "./pages/Home";
import { ArenaPage } from "./pages/Arena";
import { EventsPage } from "./pages/Events";
import { DecksPage } from "./pages/Decks";
import { MatchPage } from "./pages/Match";
import { PlaygroundPage } from "./pages/Playground";
import { ReplayPage } from "./pages/Replay";
import { NyanoPage } from "./pages/Nyano";
import { RulesetsPage } from "./pages/Rulesets";
import { StreamPage } from "./pages/Stream";
import { OverlayPage } from "./pages/Overlay";
import { getAppBasePath } from "./lib/appUrl";

import "./styles.css";

// Support deployment under a subpath (e.g. GitHub Pages `/nyano-triad-league/`).
// Vite's BASE_URL is used both for asset loading and router basename.
const basename = getAppBasePath().replace(/\/$/, "") || "/";

const router = createBrowserRouter([
  {
    path: "/overlay",
    element: <OverlayPage />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "arena", element: <ArenaPage /> },
      { path: "events", element: <EventsPage /> },
      { path: "decks", element: <DecksPage /> },
      { path: "match", element: <MatchPage /> },
      { path: "playground", element: <PlaygroundPage /> },
      { path: "replay", element: <ReplayPage /> },
      { path: "nyano", element: <NyanoPage /> },
      { path: "rulesets", element: <RulesetsPage /> },
      { path: "stream", element: <StreamPage /> },
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
