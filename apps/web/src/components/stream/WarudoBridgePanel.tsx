/**
 * WarudoBridgePanel.tsx
 *
 * Extracted from Stream.tsx — Nyano Warudo Bridge section.
 * Controls connection to nyano-warudo server, auto-send toggles,
 * manual send/download buttons, and last payload display.
 */
import React from "react";

import { CopyField } from "@/components/CopyField";

export interface WarudoBridgePanelProps {
  warudoBaseUrl: string;
  onChangeBaseUrl: (url: string) => void;

  autoSendStateOnVoteStart: boolean;
  onChangeAutoSendStateOnVoteStart: (v: boolean) => void;

  autoSendPromptOnVoteStart: boolean;
  onChangeAutoSendPromptOnVoteStart: (v: boolean) => void;

  autoResendStateDuringVoteOpen: boolean;
  onChangeAutoResendStateDuringVoteOpen: (v: boolean) => void;

  autoSendStateOnVoteEnd: boolean;
  onChangeAutoSendStateOnVoteEnd: (v: boolean) => void;

  settingsLocked: boolean;

  onSendAiPrompt: () => void;
  onSendStateJson: () => void;
  onDownloadStateJson: () => void;
  onDownloadTranscript: () => void;
  onDownloadAiPrompt: () => void;

  lastBridgePayload: string;
  lastBridgeResult: string;
}

export const WarudoBridgePanel: React.FC<WarudoBridgePanelProps> = React.memo(function WarudoBridgePanel({
  warudoBaseUrl,
  onChangeBaseUrl,
  autoSendStateOnVoteStart,
  onChangeAutoSendStateOnVoteStart,
  autoSendPromptOnVoteStart,
  onChangeAutoSendPromptOnVoteStart,
  autoResendStateDuringVoteOpen,
  onChangeAutoResendStateDuringVoteOpen,
  autoSendStateOnVoteEnd,
  onChangeAutoSendStateOnVoteEnd,
  settingsLocked,
  onSendAiPrompt,
  onSendStateJson,
  onDownloadStateJson,
  onDownloadTranscript,
  onDownloadAiPrompt,
  lastBridgePayload,
  lastBridgeResult,
}) {
  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold text-slate-700">Nyano Warudo Bridge</div>
          <div className="text-[11px] text-slate-500 font-mono">POST /v1/snapshots</div>
        </div>
        <div className="mt-2 space-y-2">
          <label className="text-[11px] text-slate-600">nyano-warudo Base URL</label>
          <input
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
            value={warudoBaseUrl}
            onChange={(e) => onChangeBaseUrl(e.target.value)}
            placeholder="http://localhost:8787"
            disabled={settingsLocked}
            aria-label="Nyano Warudo base URL"
          />
          <div className="text-[11px] text-slate-500">
            ※ CORSで失敗する場合は nyano-warudo 側で localhost を許可してください。
          </div>

          <div className="mt-2 grid gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={autoSendStateOnVoteStart}
                onChange={(e) => onChangeAutoSendStateOnVoteStart(e.target.checked)}
                disabled={settingsLocked}
                aria-label="Auto-send state_json on vote start"
              />
              vote start → state_json (strictAllowed lock)
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={autoSendPromptOnVoteStart}
                onChange={(e) => onChangeAutoSendPromptOnVoteStart(e.target.checked)}
                disabled={settingsLocked}
                aria-label="Auto-send ai_prompt on vote start"
              />
              vote start → ai_prompt (optional)
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={autoResendStateDuringVoteOpen}
                onChange={(e) => onChangeAutoResendStateDuringVoteOpen(e.target.checked)}
                disabled={settingsLocked}
                aria-label="Auto-refresh state_json during vote"
              />
              vote open → refresh state_json on state updates
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={autoSendStateOnVoteEnd}
                onChange={(e) => onChangeAutoSendStateOnVoteEnd(e.target.checked)}
                disabled={settingsLocked}
                aria-label="Auto-send state_json on vote end"
              />
              vote end → state_json
            </label>
          </div>

          <div className="mt-1 text-[11px] text-slate-500">
            ※ state_json は投票開始の瞬間に送ると、strictAllowed（合法手 allowlist）が投票中にズレにくくなります。
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button className="btn btn-sm btn-primary" onClick={onSendAiPrompt} aria-label="Send AI prompt to Warudo">
              Send ai_prompt
            </button>
            <button className="btn btn-sm" onClick={onSendStateJson} aria-label="Send state JSON to Warudo">
              Send state_json
            </button>
          </div>

          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
            <div className="text-[11px] font-semibold text-slate-700">Samples (share to nyano-warudo)</div>
            <div className="mt-1 text-[11px] text-slate-500">
              &quot;実戦の1ゲーム分サンプル&quot; を渡す用途。payload は右の欄にも残ります。
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button className="btn btn-sm" onClick={onDownloadStateJson}>
                Download state_json
              </button>
              <button className="btn btn-sm" onClick={onDownloadTranscript}>
                Download transcript
              </button>
              <button className="btn btn-sm" onClick={onDownloadAiPrompt}>
                Download ai_prompt
              </button>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-500">
            viewer cmd format: <span className="font-mono">#triad A2-&gt;B2 wm=C1</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
        <div className="text-[11px] font-semibold text-slate-700">Last payload / result</div>
        <div className="mt-2 space-y-2">
          <CopyField label="payload (content)" value={lastBridgePayload || "—"} />
          <CopyField label="result" value={lastBridgeResult || "—"} />
        </div>
      </div>
    </div>
  );
});
