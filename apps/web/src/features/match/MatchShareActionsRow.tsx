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
          JSON繧偵さ繝斐・
        </button>
        <button className={buttonClassName} onClick={onCopyShareUrl} disabled={!canFinalize}>
          蜈ｱ譛蔚RL
        </button>
        <button className={buttonClassName} onClick={onOpenReplay} disabled={!canFinalize}>
          繝ｪ繝励Ξ繧､ (Replay)
        </button>
      </div>
    </div>
  );
}
