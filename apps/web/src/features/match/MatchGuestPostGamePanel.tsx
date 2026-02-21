import React from "react";
import { Link } from "react-router-dom";

export function MatchGuestPostGamePanel(input: {
  isVisible: boolean;
  isRpg: boolean;
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
    isRpg,
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
  const actionButtonClassName = isRpg ? "btn text-xs" : "btn text-xs mint-pressable mint-hit";
  const primaryActionButtonClassName = isRpg ? "btn btn-primary text-xs" : "btn btn-primary text-xs mint-pressable mint-hit";
  const shareButtonClassName = isRpg ? actionButtonClassName : `${actionButtonClassName} mint-share-action__btn`;
  const shareStatusClassName = !isRpg
    ? [
      "mint-share-actions__status",
      canFinalize ? "mint-share-actions__ready" : "mint-share-actions__hint",
    ].join(" ")
    : "";
  const shareStatusMessage = canFinalize
    ? "Best shot: capture the victory panel now, then share."
    : "Share and replay unlock after turn 9.";
  const shareRowClassName = [
    "flex flex-wrap gap-2",
    !isRpg ? "mint-share-actions__row" : "",
    !isRpg && canFinalize ? "mint-share-actions__row--ready" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={["grid gap-2 rounded-lg border border-nyano-200 bg-nyano-50 p-3", isStageFocusRoute ? "stage-focus-side-panel" : ""].filter(Boolean).join(" ")}>
      <div className="text-sm font-medium text-nyano-800">Enjoyed this guest deck?</div>
      <div className="flex flex-wrap gap-2">
        <Link className={`${primaryActionButtonClassName} no-underline`} to="/decks">Save this deck</Link>
        <button className={primaryActionButtonClassName} onClick={onRematch}>
          Rematch with this deck
        </button>
        <button className={actionButtonClassName} onClick={onLoadNewGuestDeck}>
          Load new guest deck
        </button>
        <button
          className={actionButtonClassName}
          onClick={onSaveGuestDeck}
          disabled={guestDeckSaved}
        >
          {guestDeckSaved ? "Saved" : "Save deck"}
        </button>
      </div>
      <div className={["grid gap-2 border-t border-nyano-200 pt-2", !isRpg ? "mint-share-actions" : ""].filter(Boolean).join(" ")}>
        <div className={shareRowClassName}>
          <button
            className={shareButtonClassName}
            onClick={onCopyShareUrl}
            disabled={!canFinalize}
            aria-label="Share URL"
            title="Share URL"
          >
            Share URL
          </button>
          <button
            className={shareButtonClassName}
            onClick={onCopyShareTemplate}
            disabled={!canFinalize}
            aria-label="Share template"
            title="Share template"
          >
            Share template
          </button>
          <button
            className={shareButtonClassName}
            onClick={onOpenReplay}
            disabled={!canFinalize}
            aria-label="Open replay"
            title="Open replay"
          >
            Open replay
          </button>
        </div>
        {!isRpg ? (
          <div className={shareStatusClassName} role="status" aria-live="polite">
            {shareStatusMessage}
          </div>
        ) : null}
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
