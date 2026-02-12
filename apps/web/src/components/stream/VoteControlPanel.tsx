/**
 * VoteControlPanel.tsx
 *
 * Extracted from Stream.tsx — Vote control, simulated chat input,
 * top votes display, viewer command guide, and vote audit stats.
 */
import React from "react";

import { cellIndexToCoord, toViewerMoveText, type ViewerMove } from "@/lib/triad_vote_utils";
import { parseChatMoveLoose } from "@/lib/triad_viewer_command";

export interface VoteAudit {
  attempts: number;
  accepted: number;
  duplicates: number;
  rateLimited: number;
  illegal: number;
  usernameRejected: number;
  changeExceeded: number;
  bannedUserRejected: number;
  blockedWordRejected: number;
  slowModeRejected: number;
}

export interface VoteCountEntry {
  move: ViewerMove;
  count: number;
}

export interface VoteControlPanelProps {
  controlledSide: 0 | 1;
  onChangeControlledSide: (v: 0 | 1) => void;

  voteSeconds: number;
  onChangeVoteSeconds: (v: number) => void;

  autoStartEachTurn: boolean;
  onChangeAutoStartEachTurn: (v: boolean) => void;

  settingsLocked: boolean;

  canVoteNow: boolean;
  voteOpen: boolean;
  timeLeft: number | null;

  onStartVote: () => void;
  onFinalizeVote: () => void;
  onResetVotes: () => void;

  // Simulated chat input
  userName: string;
  onChangeUserName: (v: string) => void;
  chatText: string;
  onChangeChatText: (v: string) => void;
  onAddVoteFromChat: () => void;

  // Top votes display
  counts: VoteCountEntry[];
  voteAudit: VoteAudit;

  // Clipboard copy callback
  onCopyViewerInstructions: () => void;

  // Anti-spam settings (P2-SPAM)
  antiSpamRateLimitMs: number;
  onChangeAntiSpamRateLimitMs: (v: number) => void;
  antiSpamMaxVoteChanges: number;
  onChangeAntiSpamMaxVoteChanges: (v: number) => void;

  // Moderation settings (Phase 4)
  moderationSlowModeSeconds: number;
  onChangeModerationSlowModeSeconds: (v: number) => void;
  moderationBannedUsersText: string;
  onChangeModerationBannedUsersText: (v: string) => void;
  moderationBlockedWordsText: string;
  onChangeModerationBlockedWordsText: (v: string) => void;
  moderationBannedUsersCount: number;
  moderationBlockedWordsCount: number;
}

function moveKey(m: ViewerMove): string {
  return toViewerMoveText(m);
}

export const VoteControlPanel: React.FC<VoteControlPanelProps> = React.memo(function VoteControlPanel({
  controlledSide,
  onChangeControlledSide,
  voteSeconds,
  onChangeVoteSeconds,
  autoStartEachTurn,
  onChangeAutoStartEachTurn,
  settingsLocked,
  canVoteNow,
  voteOpen,
  timeLeft,
  onStartVote,
  onFinalizeVote,
  onResetVotes,
  userName,
  onChangeUserName,
  chatText,
  onChangeChatText,
  onAddVoteFromChat,
  counts,
  voteAudit,
  onCopyViewerInstructions,
  antiSpamRateLimitMs,
  onChangeAntiSpamRateLimitMs,
  antiSpamMaxVoteChanges,
  onChangeAntiSpamMaxVoteChanges,
  moderationSlowModeSeconds,
  onChangeModerationSlowModeSeconds,
  moderationBannedUsersText,
  onChangeModerationBannedUsersText,
  moderationBlockedWordsText,
  onChangeModerationBlockedWordsText,
  moderationBannedUsersCount,
  moderationBlockedWordsCount,
}) {
  const sideLabel = controlledSide === 0 ? "A" : "B";

  return (
    <>
      {/* ── Vote control + Live status ── */}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
          <div className="text-[11px] font-semibold text-slate-700">Vote control</div>

          <div className="mt-2 grid gap-2">
            <label className="text-[11px] text-slate-600">Controlled side</label>

            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
              value={String(controlledSide)}
              onChange={(e) => onChangeControlledSide((Number(e.target.value) === 1 ? 1 : 0) as 0 | 1)}
              disabled={settingsLocked}
              aria-label="Controlled side"
            >
              <option value="0">A</option>
              <option value="1">B</option>
            </select>

            <label className="text-[11px] text-slate-600">Vote seconds</label>
            <input
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
              type="number"
              min={5}
              max={60}
              value={voteSeconds}
              onChange={(e) => onChangeVoteSeconds(Number(e.target.value))}
              disabled={settingsLocked}
              aria-label="Vote seconds"
            />

            <label className="text-[11px] text-slate-600">Auto start each turn</label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={autoStartEachTurn} onChange={(e) => onChangeAutoStartEachTurn(e.target.checked)} disabled={settingsLocked} aria-label="Auto start each turn" />
              enable
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button className="btn btn-sm btn-primary" onClick={onStartVote} disabled={!canVoteNow} aria-label="Start vote">
              Start vote
            </button>
            <button className="btn btn-sm" onClick={onFinalizeVote} disabled={!voteOpen} aria-label="End vote and send">
              End & send
            </button>
            <button className="btn btn-sm" onClick={onResetVotes} aria-label="Clear votes">
              Clear votes
            </button>
            {voteOpen ? (
              <span className="badge badge-emerald" role="status" aria-live="polite">OPEN · {timeLeft ?? "?"}s</span>
            ) : (
              <span className="badge" role="status">CLOSED</span>
            )}
          </div>

          <div className="mt-2 text-[11px] text-slate-500">
            ※ <span className="font-mono">/match</span> は <span className="font-mono">stream=1</span>（Host link）で開いてください。
          </div>

          {/* Anti-spam settings (P2-SPAM) */}
          <details className="mt-3">
            <summary className="cursor-pointer text-[11px] font-semibold text-slate-600">Anti-Spam</summary>
            <div className="mt-2 grid gap-2">
              <label className="text-[11px] text-slate-600">
                Rate limit (ms): <span className="font-mono">{antiSpamRateLimitMs}</span>
              </label>
              <input
                type="range"
                min={500}
                max={10000}
                step={500}
                value={antiSpamRateLimitMs}
                onChange={(ev) => onChangeAntiSpamRateLimitMs(Number(ev.target.value))}
                disabled={settingsLocked}
                aria-label="Anti-spam rate limit ms"
              />
              <label className="text-[11px] text-slate-600">Max vote changes per round (0=unlimited)</label>
              <input
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                type="number"
                min={0}
                max={10}
                value={antiSpamMaxVoteChanges}
                onChange={(ev) => onChangeAntiSpamMaxVoteChanges(Number(ev.target.value))}
                disabled={settingsLocked}
                aria-label="Max vote changes per round"
              />
            </div>
          </details>

          <details className="mt-3">
            <summary className="cursor-pointer text-[11px] font-semibold text-slate-600">Moderation</summary>
            <div className="mt-2 grid gap-2">
              <label className="text-[11px] text-slate-600">Slow mode (seconds per user, 0=off)</label>
              <input
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                type="number"
                min={0}
                max={120}
                value={moderationSlowModeSeconds}
                onChange={(ev) => onChangeModerationSlowModeSeconds(Number(ev.target.value))}
                disabled={settingsLocked}
                aria-label="Slow mode seconds"
              />
              <label className="text-[11px] text-slate-600">
                Banned users ({moderationBannedUsersCount})
              </label>
              <textarea
                className="min-h-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
                value={moderationBannedUsersText}
                onChange={(ev) => onChangeModerationBannedUsersText(ev.target.value)}
                disabled={settingsLocked}
                placeholder="bad_user&#10;spam_account"
                aria-label="Banned users list"
              />
              <label className="text-[11px] text-slate-600">
                NG words ({moderationBlockedWordsCount})
              </label>
              <textarea
                className="min-h-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
                value={moderationBlockedWordsText}
                onChange={(ev) => onChangeModerationBlockedWordsText(ev.target.value)}
                disabled={settingsLocked}
                placeholder="spoiler&#10;abuse"
                aria-label="Blocked words list"
              />
              <div className="text-[10px] text-slate-500">
                List format: comma or newline delimited. Matching is case-insensitive.
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* ── Viewer command help callout ── */}
      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-emerald-800">Viewer Command Guide</div>
          <button
            className="btn btn-sm"
            onClick={onCopyViewerInstructions}
          >
            Copy Viewer Instructions
          </button>
        </div>
        <div className="mt-2 grid gap-1.5 text-xs text-emerald-700">
          <div>
            <span className="font-mono font-semibold">#triad {sideLabel}2-&gt;B2</span>{" "}
            — Card slot 2 to cell B2
          </div>
          <div>
            <span className="font-mono font-semibold">#triad {sideLabel}3-&gt;C1 wm=A1</span>{" "}
            — Card slot 3 to cell C1, warning mark on A1
          </div>
        </div>
        <div className="mt-2 text-[11px] text-emerald-600">
          <span className="font-semibold">Common mistakes:</span>{" "}
          Wrong side letter (use {sideLabel}) · Slot out of range (1-5) · Cell already occupied · Missing <span className="font-mono">#triad</span> prefix
        </div>
      </div>

      {/* ── Simulated chat input + Top votes ── */}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
          <div className="text-[11px] font-semibold text-slate-700">Simulated chat input</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <input
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
              value={userName}
              onChange={(e) => onChangeUserName(e.target.value)}
              placeholder="viewer"
              aria-label="Viewer username"
            />
            <input
              className="col-span-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
              value={chatText}
              onChange={(e) => onChangeChatText(e.target.value)}
              placeholder="#triad A2->B2 wm=C3"
              aria-label="Chat vote command"
            />
          </div>
          {/* Real-time validation feedback */}
          {chatText.trim().length > 0 && (() => {
            const parsed = parseChatMoveLoose(chatText, controlledSide);
            if (parsed) {
              const moveText = toViewerMoveText({ cell: parsed.cell, cardIndex: parsed.cardIndex, warningMarkCell: parsed.warningMarkCell });
              return (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">&#x2713;</span>
                  <span>Valid: <span className="font-mono font-semibold">{moveText}</span> (cell {cellIndexToCoord(parsed.cell)}, slot {parsed.cardIndex + 1}{typeof parsed.warningMarkCell === "number" ? `, wm=${cellIndexToCoord(parsed.warningMarkCell)}` : ""})</span>
                </div>
              );
            }
            return (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-500">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">&#x2717;</span>
                <span>Invalid command. Use format: <span className="font-mono">#triad {sideLabel}2-&gt;B2</span></span>
              </div>
            );
          })()}

          <div className="mt-2 flex items-center gap-2">
            <button className="btn btn-sm btn-primary" onClick={onAddVoteFromChat} disabled={!voteOpen} aria-label="Add vote from chat">
              Add vote
            </button>
            <div className="text-[11px] text-slate-500">example: <span className="font-mono">{"#triad A2->B2"}</span> / <span className="font-mono">{"#triad A3->C1 wm=A1"}</span></div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
          <div className="text-[11px] font-semibold text-slate-700">Top votes</div>
          {counts.length === 0 ? (
            <div className="mt-2 text-xs text-slate-500">No votes yet.</div>
          ) : (
            <div className="mt-2 space-y-1">
              {counts.slice(0, 5).map((x, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono">{moveKey(x.move)}</span>
                  <span className="badge badge-sky">{x.count}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 text-[11px] text-slate-500">
            tie-break: cell→cardIndex→wm（小さい方が勝ち）
          </div>
          {voteAudit.attempts > 0 && (
            <div className="mt-1 text-[10px] text-slate-400" role="status" aria-live="polite">
              {voteAudit.attempts} attempts · {voteAudit.accepted} accepted · {voteAudit.duplicates} dup · {voteAudit.rateLimited} rate-lim · {voteAudit.illegal} illegal{voteAudit.usernameRejected > 0 ? ` · ${voteAudit.usernameRejected} bad-name` : ""}{voteAudit.changeExceeded > 0 ? ` · ${voteAudit.changeExceeded} chg-limit` : ""}{voteAudit.bannedUserRejected > 0 ? ` · ${voteAudit.bannedUserRejected} banned` : ""}{voteAudit.blockedWordRejected > 0 ? ` · ${voteAudit.blockedWordRejected} ng-word` : ""}{voteAudit.slowModeRejected > 0 ? ` · ${voteAudit.slowModeRejected} slow` : ""}
            </div>
          )}
        </div>
      </div>
    </>
  );
});
