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
  const buttonClassName = isRpg ? "rpg-result__btn" : "btn";
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button className={buttonClassName} onClick={onCopyTranscriptJson} disabled={!simOk}>
          Copy JSON
        </button>
        <button className={buttonClassName} onClick={onCopyShareUrl} disabled={!canFinalize}>
          Copy share URL
        </button>
        <button className={buttonClassName} onClick={onOpenReplay} disabled={!canFinalize}>
          Open replay
        </button>
      </div>
    </div>
  );
}