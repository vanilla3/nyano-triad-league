import React from "react";
import { useSearchParams } from "react-router-dom";
import { normalizeStageFocusParams } from "../lib/stage_focus_params";
import { ReplayPage } from "./Replay";

export function ReplayStagePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    const { next, changed } = normalizeStageFocusParams(searchParams);

    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return <ReplayPage />;
}
