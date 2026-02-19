import React from "react";
import { QrCode } from "@/components/QrCode";
import { resolveMatchShareQrUrl, type MatchShareQrInput } from "@/features/match/matchShareQr";

export function MatchShareQrCode(props: MatchShareQrInput) {
  const { transcript, cards, eventId, ui, rulesetKey, classicMask } = props;

  const url = React.useMemo(
    () =>
      resolveMatchShareQrUrl({
        transcript,
        cards,
        eventId,
        ui,
        rulesetKey,
        classicMask,
      }),
    [transcript, cards, eventId, ui, rulesetKey, classicMask],
  );

  if (!url) return <div className="text-xs text-slate-400">生成中...</div>;
  return <QrCode value={url} size={160} />;
}
