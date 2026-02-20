import React from "react";
import { Link } from "react-router-dom";

export function MatchGuestPostGamePanel(input: {
  isVisible: boolean;
  isStageFocusRoute: boolean;
  guestDeckSaved: boolean;
  canFinalize: boolean;
  onRematch: () => void;
  onLoadNewGuestDeck: () => void;
  onSaveGuestDeck: () => void;
  onCopyShareUrl: () => void;
  onCopyShareTemplate: () => void;
  onOpenReplay: () => void;
  qrCode: React.ReactNode;
}): React.ReactElement | null {
  const {
    isVisible,
    isStageFocusRoute,
    guestDeckSaved,
    canFinalize,
    onRematch,
    onLoadNewGuestDeck,
    onSaveGuestDeck,
    onCopyShareUrl,
    onCopyShareTemplate,
    onOpenReplay,
    qrCode,
  } = input;
  if (!isVisible) return null;

  return (
    <div className={["grid gap-2 rounded-lg border border-nyano-200 bg-nyano-50 p-3", isStageFocusRoute ? "stage-focus-side-panel" : ""].filter(Boolean).join(" ")}>
      <div className="text-sm font-medium text-nyano-800">Enjoyed this guest deck?</div>
      <div className="flex flex-wrap gap-2">
        <Link className="btn btn-primary no-underline text-xs" to="/decks">Save this deck</Link>
        <button className="btn btn-primary text-xs" onClick={onRematch}>
          Rematch with this deck
        </button>
        <button className="btn text-xs" onClick={onLoadNewGuestDeck}>
          Load new guest deck
        </button>
        <button
          className="btn text-xs"
          onClick={onSaveGuestDeck}
          disabled={guestDeckSaved}
        >
          {guestDeckSaved ? "Saved" : "Save deck"}
        </button>
      </div>
      <div className="grid gap-2 border-t border-nyano-200 pt-2">
        <div className="flex flex-wrap gap-2">
          <button className="btn text-xs" onClick={onCopyShareUrl} disabled={!canFinalize}>
            Copy share URL
          </button>
          <button className="btn text-xs" onClick={onCopyShareTemplate} disabled={!canFinalize}>
            Copy share template
          </button>
          <button className="btn text-xs" onClick={onOpenReplay} disabled={!canFinalize}>
            Open replay
          </button>
        </div>
        {canFinalize ? (
          <details className="text-xs">
            <summary className="cursor-pointer text-sky-600 hover:text-sky-700 font-medium">QR Code</summary>
            <div className="mt-2 flex justify-center">
              {qrCode}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}