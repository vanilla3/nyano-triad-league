import React from "react";
import { Link } from "react-router-dom";
import { NyanoAvatar } from "@/components/NyanoAvatar";

export function MatchGuestModeIntro(input: {
  isVisible: boolean;
  tutorial: React.ReactNode;
}): React.ReactElement | null {
  const { isVisible, tutorial } = input;
  if (!isVisible) return null;

  return (
    <>
      <section className="rounded-2xl border border-nyano-200 bg-nyano-50 p-4">
        <div className="flex items-center gap-3">
          <NyanoAvatar size={48} expression="playful" />
          <div>
            <div className="font-semibold text-nyano-800">ゲストですぐ対戦</div>
            <div className="text-xs text-nyano-600">
              ゲスト用のランダムデッキですぐ始められます。自分のデッキで遊ぶ場合は、<Link className="font-medium underline" to="/decks">デッキ</Link>で作成してください。
            </div>
          </div>
        </div>
      </section>
      {tutorial}
    </>
  );
}
