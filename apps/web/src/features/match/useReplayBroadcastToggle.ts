import React from "react";
import type { SetURLSearchParams } from "react-router-dom";

export function resolveReplayBroadcastToggleMutation(input: {
  searchParams: URLSearchParams;
  nextOn: boolean;
}): URLSearchParams | null {
  const currentOn = input.searchParams.get("broadcast") === "1";
  if (currentOn === input.nextOn) return null;

  const next = new URLSearchParams(input.searchParams);
  if (input.nextOn) next.set("broadcast", "1");
  else next.delete("broadcast");
  return next;
}

export function useReplayBroadcastToggle(input: {
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  setBroadcastOverlay: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { searchParams, setSearchParams, setBroadcastOverlay } = input;

  const setBroadcastOverlayWithUrl = React.useCallback((nextOn: boolean) => {
    setBroadcastOverlay(nextOn);
    const next = resolveReplayBroadcastToggleMutation({
      searchParams,
      nextOn,
    });
    if (!next) return;
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, setBroadcastOverlay]);

  return { setBroadcastOverlayWithUrl };
}
