import React from "react";

export function MatchShareActionsRow(input: {
  isRpg: boolean;
  simOk: boolean;
  canFinalize: boolean;
  onCopyTranscriptJson: () => void;
  onCopyShareUrl: () => void;
  onOpenReplay: () => void;
}): React.ReactElement {
  const {
    isRpg,
    simOk,
    canFinalize,
    onCopyTranscriptJson,
    onCopyShareUrl,
    onOpenReplay,
  } = input;
  const baseButtonClassName = isRpg ? "rpg-result__btn" : "btn";
  const buttonClassName = isRpg ? baseButtonClassName : `${baseButtonClassName} mint-pressable mint-hit mint-share-action__btn`;
  const shareStatusClassName = !isRpg
    ? [
      "mint-share-actions__status",
      canFinalize ? "mint-share-actions__ready" : "mint-share-actions__hint",
    ].join(" ")
    : "";
  const shareStatusMessage = canFinalize
    ? "Best shot: capture the result panel now, then tap Share URL."
    : "Share and replay unlock after turn 9.";
  const shareRowClassName = [
    "flex flex-wrap items-center gap-2",
    !isRpg ? "mint-share-actions__row" : "",
    !isRpg && canFinalize ? "mint-share-actions__row--ready" : "",
  ].filter(Boolean).join(" ");
  return (
    <div className={["grid gap-2", !isRpg ? "mint-share-actions" : ""].filter(Boolean).join(" ")}>
      <div className={shareRowClassName}>
        <button
          className={buttonClassName}
          onClick={onCopyTranscriptJson}
          disabled={!simOk}
          aria-label="Copy transcript JSON"
          title="Copy transcript JSON"
        >
          Copy JSON
        </button>
        <button
          className={buttonClassName}
          onClick={onCopyShareUrl}
          disabled={!canFinalize}
          aria-label="Share URL"
          title="Share URL"
        >
          Share URL
        </button>
        <button
          className={buttonClassName}
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
    </div>
  );
}
