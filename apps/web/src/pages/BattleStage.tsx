import React from "react";
import { useSearchParams } from "react-router-dom";
import { normalizeStageFocusParams } from "../lib/stage_focus_params";
import { MatchPage } from "./Match";

export function BattleStagePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    const { next, changed } = normalizeStageFocusParams(searchParams);

    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return <MatchPage />;
}
