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
  const primaryActionButtonClassName = isRpg
    ? "btn btn-primary text-xs"
    : "btn btn-primary text-xs mint-pressable mint-hit";
  const shareButtonClassName = isRpg ? actionButtonClassName : `${actionButtonClassName} mint-share-action__btn`;

  return (
    <div
      className={
        [
          "grid gap-2 rounded-lg border border-nyano-200 bg-nyano-50 p-3",
          isStageFocusRoute ? "stage-focus-side-panel" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      <div className="text-sm font-medium text-nyano-800">このゲストデッキ、気に入りましたか？</div>
      <div className="flex flex-wrap gap-2">
        <Link className={`${primaryActionButtonClassName} no-underline`} to="/decks">
          このデッキを保存
        </Link>
        <button className={primaryActionButtonClassName} onClick={onRematch}>
          このデッキで再戦
        </button>
        <button className={actionButtonClassName} onClick={onLoadNewGuestDeck}>
          別のゲストデッキにする
        </button>
        <button className={actionButtonClassName} onClick={onSaveGuestDeck} disabled={guestDeckSaved}>
          {guestDeckSaved ? "保存済み" : "保存"}
        </button>
      </div>

      <div
        className={
          ["grid gap-2 border-t border-nyano-200 pt-2", !isRpg ? "mint-share-actions" : ""]
            .filter(Boolean)
            .join(" ")
        }
      >
        <div className={["flex flex-wrap gap-2", !isRpg ? "mint-share-actions__row" : ""].filter(Boolean).join(" ")}>
          <button
            className={shareButtonClassName}
            onClick={onCopyShareUrl}
            disabled={!canFinalize}
            aria-label="共有URLをコピー"
            title="共有URLをコピー"
          >
            共有URL
          </button>
          <button
            className={shareButtonClassName}
            onClick={onCopyShareTemplate}
            disabled={!canFinalize}
            aria-label="共有テンプレをコピー"
            title="共有テンプレをコピー"
          >
            テンプレ
          </button>
          <button
            className={shareButtonClassName}
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
            まずリザルトをスクショ → 次に共有すると気持ちいいです。
          </div>
        ) : null}

        {canFinalize ? (
          <details className="text-xs">
            <summary className="cursor-pointer text-sky-600 hover:text-sky-700 font-medium">QRコード</summary>
            <div className="mt-2 flex justify-center">{qrCode}</div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
