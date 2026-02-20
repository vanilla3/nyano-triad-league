import React from "react";
import { QrCode } from "@/components/QrCode";
import { CopyField } from "@/components/CopyField";
import { useToast } from "@/components/Toast";
import { generateSampleCommands, generateNightbotTemplate } from "@/lib/stream_command_generator";
import { writeClipboardText } from "@/lib/clipboard";

/* ═══════════════════════════════════════════════════════════════════════════
   StreamSharePanel — QR codes + viewer instructions for /stream page (P2-310)

   Displays: URL cards with QR codes, viewer command guide preview.
   Purely presentational component.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface StreamSharePanelProps {
  matchUrl: string;
  hostMatchUrl: string;
  overlayUrl: string;
  overlayTransparentUrl: string;
  replayBroadcastUrl: string;
  controlledSide: 0 | 1;
  eventTitle?: string;
  emptyCells?: number[];
  remainingCards?: number[];
  turn?: number;
}

export const StreamSharePanel: React.FC<StreamSharePanelProps> = React.memo(
  function StreamSharePanel({
    matchUrl,
    hostMatchUrl,
    overlayUrl,
    overlayTransparentUrl,
    replayBroadcastUrl,
    controlledSide,
    emptyCells,
    remainingCards,
    turn,
  }) {
    const toast = useToast();

    const side = controlledSide === 0 ? "A" : "B";
    const sampleCommands = React.useMemo(
      () => emptyCells && remainingCards
        ? generateSampleCommands(controlledSide, emptyCells, remainingCards, 5)
        : [],
      [controlledSide, emptyCells, remainingCards],
    );
    const nightbotTemplate = React.useMemo(
      () => generateNightbotTemplate(controlledSide),
      [controlledSide],
    );
    const instructions = [
      `【Nyano Triad League 投票コマンド】`,
      ``,
      `フォーマット: #triad ${side}<スロット>-><セル>`,
      `例: #triad ${side}2->B2`,
      ``,
      `Warning Mark付き: #triad ${side}2->B2 wm=C1`,
      ``,
      `スロット: ${side}1~${side}5 (手持ちカード番号)`,
      `セル: A1 B1 C1 / A2 B2 C2 / A3 B3 C3`,
      ``,
      `投票は制限時間内に1人1票。最多票の手が採用されます！`,
    ].join("\n");

    const copyInstructions = () => {
      void writeClipboardText(instructions);
      toast.success("Copied", "Viewer instructions copied to clipboard");
    };

    return (
      <div className="space-y-4">
        {/* URL Grid with QR codes */}
        <div className="grid gap-3 md:grid-cols-2">
          {/* Viewer challenge link + QR */}
          <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 shadow-sm">
            <CopyField label="Challenge link (viewer)" value={matchUrl} href={matchUrl} />
            <div className="mt-2 flex justify-center">
              <QrCode value={matchUrl} size={96} />
            </div>
          </div>

          {/* OBS Overlay URL + QR */}
          <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 shadow-sm">
            <CopyField label="OBS Overlay" value={overlayUrl} href={overlayUrl} />
            <div className="mt-2 flex justify-center">
              <QrCode value={overlayUrl} size={96} />
            </div>
          </div>

          {/* Host match link — NO QR (private/sensitive) */}
          <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 shadow-sm">
            <CopyField label="Host match (stream)" value={hostMatchUrl} href={hostMatchUrl} />
            <div className="mt-1 text-[11px] text-amber-600">
              配信画面にQRを映さないでください（操作権限付きリンク）
            </div>
          </div>

          {/* Additional URLs */}
          <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 shadow-sm space-y-2">
            <CopyField label="Overlay (transparent)" value={overlayTransparentUrl} href={overlayTransparentUrl} />
            <CopyField label="Replay (broadcast)" value={replayBroadcastUrl} href={replayBroadcastUrl} />
          </div>
        </div>

        {/* Viewer Instructions Preview */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-emerald-800">
              Viewer Instructions (preview)
            </div>
            <button
              className="rounded-lg border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
              onClick={copyInstructions}
            >
              Copy
            </button>
          </div>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-emerald-700 font-mono bg-white/50 rounded-lg px-3 py-2 border border-emerald-100">
            {instructions}
          </pre>
        </div>

        {/* Quick Commands (context-aware) */}
        {sampleCommands.length > 0 && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-sky-800">
                Quick Commands {typeof turn === "number" ? `(turn ${turn + 1})` : ""}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sampleCommands.map((cmd) => (
                <button
                  key={cmd}
                  className="rounded-lg border border-sky-300 bg-white px-2.5 py-1 text-xs font-mono text-sky-700 hover:bg-sky-50 transition-colors"
                  onClick={() => {
                    void writeClipboardText(cmd);
                    toast.success("Copied", cmd);
                  }}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nightbot Template */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-700">Nightbot Template</div>
            <button
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              onClick={() => {
                void writeClipboardText(nightbotTemplate);
                toast.success("Copied", "Nightbot template copied");
              }}
            >
              Copy
            </button>
          </div>
          <div className="mt-1.5 text-xs text-slate-500 font-mono truncate">
            {nightbotTemplate}
          </div>
        </div>
      </div>
    );
  },
);
