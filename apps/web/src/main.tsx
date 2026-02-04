import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "./App";
import { HomePage } from "./pages/Home";
import { ArenaPage } from "./pages/Arena";
import { DecksPage } from "./pages/Decks";
import { PlaygroundPage } from "./pages/Playground";
import { ReplayPage } from "./pages/Replay";
import { NyanoPage } from "./pages/Nyano";
import { RulesetsPage } from "./pages/Rulesets";

import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "arena", element: <ArenaPage /> },
      { path: "decks", element: <DecksPage /> },
      { path: "playground", element: <PlaygroundPage /> },
      { path: "replay", element: <ReplayPage /> },
      { path: "nyano", element: <NyanoPage /> },
      { path: "rulesets", element: <RulesetsPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
