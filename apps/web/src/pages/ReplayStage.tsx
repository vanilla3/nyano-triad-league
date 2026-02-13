import React from "react";
import { useSearchParams } from "react-router-dom";
import { ReplayPage } from "./Replay";

function isFocusEnabled(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized === "1" || normalized === "focus";
}

export function ReplayStagePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;

    if ((next.get("ui") ?? "").toLowerCase() !== "engine") {
      next.set("ui", "engine");
      changed = true;
    }

    const focusParam = next.get("focus") ?? next.get("layout");
    if (!isFocusEnabled(focusParam)) {
      next.set("focus", "1");
      changed = true;
    }

    if (next.has("layout")) {
      next.delete("layout");
      changed = true;
    }

    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return <ReplayPage />;
}

