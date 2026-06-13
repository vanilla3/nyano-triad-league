import React from "react";

export function MatchShareActionsRow(input: {
  isRpg: boolean;
  simOk: boolean;
  canFinalize: boolean;
  onCopyTranscriptJson: () => void;
  onCopyShareUrl: () => void;
  onOpenReplay: () => void;
}): React.ReactElement {
  const { isRpg, simOk, canFinalize, onCopyTranscriptJson, onCopyShareUrl, onOpenReplay } = input;

  const baseButtonClassName = isRpg ? "rpg-result__btn" : "btn";
  const buttonClassName = isRpg
    ? baseButtonClassName
    : `${baseButtonClassName} mint-pressable mint-hit mint-share-action__btn`;

  return (
    <div className={["grid gap-2", !isRpg ? "mint-share-actions" : ""].filter(Boolean).join(" ")}>
      <div
        className={["flex flex-wrap items-center gap-2", !isRpg ? "mint-share-actions__row" : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          className={buttonClassName}
          onClick={onCopyTranscriptJson}
          disabled={!simOk}
          aria-label="対戦ログJSONをコピー"
          title="対戦ログJSONをコピー"
        >
          JSONコピー
        </button>
        <button
          className={buttonClassName}
          onClick={onCopyShareUrl}
          disabled={!canFinalize}
          aria-label="共有URLをコピー"
          title="共有URLをコピー"
        >
          共有URL
        </button>
        <button
          className={buttonClassName}
          onClick={onOpenReplay}
          disabled={!canFinalize}
          aria-label="リプレイを開く"
          title="リプレイを開く"
        >
          リプレイ
        </button>
      </div>

      {!isRpg && !canFinalize ? (
        <div className="mint-share-actions__hint" role="status" aria-live="polite">
          共有とリプレイは9ターン終了後に解放されます。
        </div>
      ) : null}

      {!isRpg && canFinalize ? (
        <div className="mint-share-actions__ready" role="note">
          まずリザルトをスクショ → 次に「共有URL」をタップすると気持ちいいです。
        </div>
      ) : null}
    </div>
  );
}
