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
            <div className="font-semibold text-nyano-800">繧ｲ繧ｹ繝亥ｯｾ謌ｦ (Guest Quick Play)</div>
            <div className="text-xs text-nyano-600">
              繧ｲ繧ｹ繝医Δ繝ｼ繝峨〒繝ｩ繝ｳ繝繝繝・ャ繧ｭ繧剃ｽｿ逕ｨ荳ｭ縺ｧ縺吶り・蛻・・繝・ャ繧ｭ縺ｧ驕翫・蝣ｴ蜷医・ <Link className="font-medium underline" to="/decks">Decks</Link> 縺ｧ菴懈・縺励※縺上□縺輔＞縲・
            </div>
          </div>
        </div>
      </section>
      {tutorial}
    </>
  );
}
