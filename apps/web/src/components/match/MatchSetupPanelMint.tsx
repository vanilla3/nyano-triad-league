import React from "react";
import { Link } from "react-router-dom";

import type { PlayerIndex } from "@nyano/triad-engine";
import type { AiDifficulty } from "@/lib/ai/nyano_ai";
import type { DeckV1 } from "@/lib/deck_store";
import type { FirstPlayerResolution, FirstPlayerResolutionMode } from "@/lib/first_player_resolve";
import type { RulesetKey } from "@/lib/ruleset_registry";
import {
  buildMatchSetupSummaryLine,
  describeRulesetKey,
  shouldOpenAdvancedSetup,
  type MatchSetupBoardUi,
  type MatchSetupOpponentMode,
} from "./MatchSetupPanelMint.helpers";

export type MatchSetupDataMode = "fast" | "verified";

function chipButtonClass(active: boolean): string {
  return [
    "rounded-md px-3 py-1.5 text-xs font-medium transition",
    active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
  ].join(" ");
}


type MatchSetupPanelMintProps = {
  defaultOpen?: boolean;
  decks: DeckV1[];
  deckAId: string;
  deckBId: string;
  deckA: DeckV1 | null;
  deckB: DeckV1 | null;
  eventDeckTokenIds: string[] | null;
  isEvent: boolean;
  opponentMode: MatchSetupOpponentMode;
  isVsNyanoAi: boolean;
  aiDifficulty: AiDifficulty;
  aiAutoPlay: boolean;
  streamMode: boolean;
  streamCtrlParam: string;
  ui: MatchSetupBoardUi;
  isEngine: boolean;
  stageMatchUrl: string;
  rulesetKey: RulesetKey;
  chainCapPerTurnParam: number | null;
  chainCapRawParam: string | null;
  maxChainCapPerTurn: number;
  classicSwapLabel: string | null;
  classicOpenLabel: string | null;
  rulesetId: `0x${string}`;
  firstPlayerMode: FirstPlayerResolutionMode;
  manualFirstPlayerParam: PlayerIndex;
  mutualChoiceAParam: PlayerIndex;
  mutualChoiceBParam: PlayerIndex;
  commitRevealSaltParam: string;
  seedResolutionParam: string;
  committedMutualPlayerAParam: string;
  committedMutualPlayerBParam: string;
  committedMutualNonceAParam: string;
  committedMutualNonceBParam: string;
  committedMutualCommitAParam: string;
  committedMutualCommitBParam: string;
  commitRevealAParam: string;
  commitRevealBParam: string;
  commitRevealCommitAParam: string;
  commitRevealCommitBParam: string;
  firstPlayerResolution: FirstPlayerResolution;
  firstPlayer: PlayerIndex;
  dataMode: MatchSetupDataMode;
  canLoad: boolean;
  loading: boolean;
  status: string | null;
  error: string | null;
  showRpcSettingsCta: boolean;
  overlayUrl: string;
  onSetParam: (key: string, value: string) => void;
  onSetFocusMode: (enabled: boolean) => void;
  onFirstPlayerModeChange: (nextMode: FirstPlayerResolutionMode) => void;
  onBoardUiChange: (nextUi: MatchSetupBoardUi) => void;
  onSetDataMode: (value: MatchSetupDataMode) => void;
  onLoadCards: () => void;
  onResetMatch: () => void;
  onNewSalt: () => void;
  onCopySetupLink: () => void;
  onRandomizeCommitReveal: () => void;
  onDeriveCommitRevealCommits: () => void;
  onRandomizeCommittedMutualChoice: () => void;
  onDeriveCommittedMutualChoiceCommits: () => void;
  onRandomizeSeedResolution: () => void;
};

export function MatchSetupPanelMint(props: MatchSetupPanelMintProps) {
  const {
    defaultOpen = true,
    decks,
    deckAId,
    deckBId,
    deckA,
    deckB,
    eventDeckTokenIds,
    isEvent,
    opponentMode,
    isVsNyanoAi,
    aiDifficulty,
    aiAutoPlay,
    streamMode,
    streamCtrlParam,
    ui,
    isEngine,
    stageMatchUrl,
    rulesetKey,
    chainCapPerTurnParam,
    chainCapRawParam,
    maxChainCapPerTurn,
    classicSwapLabel,
    classicOpenLabel,
    rulesetId,
    firstPlayerMode,
    manualFirstPlayerParam,
    mutualChoiceAParam,
    mutualChoiceBParam,
    commitRevealSaltParam,
    seedResolutionParam,
    committedMutualPlayerAParam,
    committedMutualPlayerBParam,
    committedMutualNonceAParam,
    committedMutualNonceBParam,
    committedMutualCommitAParam,
    committedMutualCommitBParam,
    commitRevealAParam,
    commitRevealBParam,
    commitRevealCommitAParam,
    commitRevealCommitBParam,
    firstPlayerResolution,
    firstPlayer,
    dataMode,
    canLoad,
    loading,
    status,
    error,
    showRpcSettingsCta,
    overlayUrl,
    onSetParam,
    onSetFocusMode,
    onFirstPlayerModeChange,
    onBoardUiChange,
    onSetDataMode,
    onLoadCards,
    onResetMatch,
    onNewSalt,
    onCopySetupLink,
    onRandomizeCommitReveal,
    onDeriveCommitRevealCommits,
    onRandomizeCommittedMutualChoice,
    onDeriveCommittedMutualChoiceCommits,
    onRandomizeSeedResolution,
  } = props;

  const [open, setOpen] = React.useState(defaultOpen);
  const initialAdvancedOpen = shouldOpenAdvancedSetup({ firstPlayerMode, streamMode, chainCapRawParam });
  const [advancedOpen, setAdvancedOpen] = React.useState(initialAdvancedOpen);

  React.useEffect(() => {
    if (initialAdvancedOpen) setAdvancedOpen(true);
  }, [initialAdvancedOpen]);

  const summaryLine = buildMatchSetupSummaryLine({
    deckAName: deckA?.name ?? null,
    deckBName: deckB?.name ?? null,
    isEvent,
    rulesetKey,
    opponentMode,
    firstPlayerMode,
    ui,
  });

  return (
    <section className="card" data-testid="match-setup-panel">
      <button
        type="button"
        className="card-hd flex w-full items-center justify-between text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div>
          <div className="text-base font-semibold">Match Setup</div>
          <div className="text-xs text-slate-500">Pick deck, ruleset, and opponent with progressive controls</div>
        </div>
        <span className="text-sm text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div className="card-bd grid gap-4 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900">Setup Summary</span>
              <span className="min-w-0 flex-1 truncate" data-testid="match-setup-summary-line">{summaryLine}</span>
              <button type="button" className="btn btn-sm" onClick={onCopySetupLink}>
                Copy Setup Link
              </button>
            </div>
          </div>

          <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Primary</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-medium text-slate-600">Deck A</div>
                <select className="input" value={deckAId} onChange={(e) => onSetParam("a", e.target.value)} aria-label="Deck A">
                  <option value="">Select...</option>
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {deckA ? (
                  <div className="text-xs text-slate-500">{deckA.tokenIds.join(", ")}</div>
                ) : (
                  <div className="text-xs text-slate-400">
                    Create a deck from <Link className="underline" to="/decks">Decks</Link>
                  </div>
                )}
              </div>

              <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-medium text-slate-600">Deck B</div>
                {eventDeckTokenIds ? (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                    Event deck (fixed): <span className="font-mono">{eventDeckTokenIds.join(", ")}</span>
                  </div>
                ) : (
                  <>
                    <select className="input" value={deckBId} onChange={(e) => onSetParam("b", e.target.value)} aria-label="Deck B">
                      <option value="">Select...</option>
                      {decks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {deckB ? (
                      <div className="text-xs text-slate-500">{deckB.tokenIds.join(", ")}</div>
                    ) : (
                      <div className="text-xs text-slate-400">Select Deck B</div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">Opponent</div>
                <div className="inline-flex w-full rounded-lg border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    className={chipButtonClass(opponentMode === "pvp")}
                    onClick={() => onSetParam("opp", "pvp")}
                    disabled={isEvent}
                    data-testid="match-setup-opponent-pvp"
                  >
                    Human vs Human
                  </button>
                  <button
                    type="button"
                    className={chipButtonClass(opponentMode === "vs_nyano_ai")}
                    onClick={() => onSetParam("opp", "vs_nyano_ai")}
                    disabled={isEvent}
                    data-testid="match-setup-opponent-ai"
                  >
                    Vs Nyano AI
                  </button>
                </div>
                {isVsNyanoAi ? (
                  <div className="grid gap-2">
                    <select
                      className="input"
                      value={aiDifficulty}
                      disabled={isEvent}
                      onChange={(e) => onSetParam("ai", e.target.value)}
                      aria-label="AI difficulty"
                      data-testid="match-setup-ai-difficulty"
                    >
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={aiAutoPlay} onChange={(e) => onSetParam("auto", e.target.checked ? "1" : "0")} aria-label="AI auto play" />
                      Auto-play Nyano turn
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">Ruleset</div>
                <select
                  className="input"
                  value={rulesetKey}
                  disabled={isEvent}
                  onChange={(e) => onSetParam("rk", e.target.value)}
                  aria-label="Ruleset"
                  data-testid="match-setup-ruleset"
                >
                  <option value="v1">v1 (core+tactics)</option>
                  <option value="v2">v2 (shadow ignores warning mark)</option>
                  <option value="full">full (tactics+traits+formations)</option>
                  <option value="classic_plus_same">classic (plus+same)</option>
                  <option value="classic_order">classic (order)</option>
                  <option value="classic_chaos">classic (chaos)</option>
                  <option value="classic_swap">classic (swap)</option>
                  <option value="classic_all_open">classic (all open)</option>
                  <option value="classic_three_open">classic (three open)</option>
                </select>
                <div className="text-xs text-slate-500">Current: {describeRulesetKey(rulesetKey)}</div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Secondary</div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">Board</div>
                <select
                  className="input"
                  value={ui}
                  onChange={(e) => onBoardUiChange(e.target.value as MatchSetupBoardUi)}
                  aria-label="Board renderer"
                  data-testid="match-setup-board-ui"
                >
                  <option value="mint">mint</option>
                  <option value="engine">engine (pixi)</option>
                  <option value="rpg">rpg</option>
                </select>
                {isEngine ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="btn btn-sm" onClick={() => onSetFocusMode(true)}>
                      Enter Pixi Focus
                    </button>
                    <Link className="btn btn-sm no-underline" to={stageMatchUrl}>
                      Open Stage Page
                    </Link>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">First Player</div>
                <select
                  className="input"
                  value={firstPlayerMode}
                  disabled={isEvent}
                  onChange={(e) => onFirstPlayerModeChange(e.target.value as FirstPlayerResolutionMode)}
                  aria-label="First player mode"
                  data-testid="match-setup-first-player-mode"
                >
                  <option value="manual">Manual</option>
                  <option value="mutual">Mutual choice</option>
                  <option value="committed_mutual_choice">Committed mutual choice</option>
                  <option value="seed">Seed</option>
                  <option value="commit_reveal">Commit-reveal</option>
                </select>
                {firstPlayerMode === "manual" ? (
                  <select
                    className="input"
                    value={String(manualFirstPlayerParam)}
                    disabled={isEvent}
                    onChange={(e) => onSetParam("fp", e.target.value)}
                    aria-label="Manual first player"
                  >
                    <option value="0">A first</option>
                    <option value="1">B first</option>
                  </select>
                ) : null}
                <div className={`text-xs ${!isEvent && !firstPlayerResolution.valid ? "text-rose-600" : "text-slate-500"}`}>
                  resolved: {firstPlayer === 0 ? "A first" : "B first"}
                  {!isEvent && !firstPlayerResolution.valid && firstPlayerResolution.error ? ` (${firstPlayerResolution.error})` : ""}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">Data Mode</div>
                <div className="inline-flex w-full rounded-lg border border-slate-200 bg-white p-1">
                  <button type="button" className={chipButtonClass(dataMode === "fast")} onClick={() => onSetDataMode("fast")} aria-label="Data mode fast">
                    Fast
                  </button>
                  <button type="button" className={chipButtonClass(dataMode === "verified")} onClick={() => onSetDataMode("verified")} aria-label="Data mode verified">
                    Verified
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">Stream mode</div>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={streamMode} onChange={(e) => onSetParam("stream", e.target.checked ? "1" : "0")} aria-label="Stream mode" />
                  Enable stream control route
                </label>
                {streamMode ? (
                  <select className="input" value={streamCtrlParam} onChange={(e) => onSetParam("ctrl", e.target.value)} aria-label="Chat controlled side">
                    <option value="A">Chat controls A</option>
                    <option value="B">Chat controls B</option>
                  </select>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <button
              type="button"
              className="flex items-center justify-between text-left"
              onClick={() => setAdvancedOpen((v) => !v)}
              aria-expanded={advancedOpen}
              data-testid="match-setup-advanced-toggle"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Advanced</span>
              <span className="text-xs text-slate-500">{advancedOpen ? "Hide" : "Show"} URL-level settings</span>
            </button>
            {advancedOpen ? (
              <div className="grid gap-3 border-t border-slate-100 pt-3" data-testid="match-setup-advanced-content">
                <div className="grid gap-2">
                  <select
                    className="input"
                    value={chainCapPerTurnParam === null ? "" : String(chainCapPerTurnParam)}
                    disabled={isEvent}
                    onChange={(e) => onSetParam("ccap", e.target.value)}
                    aria-label="Chain cap per turn"
                    data-testid="match-setup-chain-cap"
                  >
                    <option value="">Layer4 chain cap: off</option>
                    {Array.from({ length: maxChainCapPerTurn + 1 }, (_, n) => (
                      <option key={n} value={String(n)}>
                        chain cap = {n}
                      </option>
                    ))}
                  </select>
                  {chainCapRawParam !== null && chainCapPerTurnParam === null ? (
                    <div className="text-xs text-rose-600">Invalid ccap parameter (allowed: 0..{maxChainCapPerTurn})</div>
                  ) : (
                    <div className="text-xs text-slate-500">Layer4 experimental knob (engine-only, rulesetId unchanged)</div>
                  )}
                  {classicSwapLabel ? <div className="text-xs text-amber-700">{classicSwapLabel}</div> : null}
                  {classicOpenLabel ? <div className="text-xs text-emerald-700">{classicOpenLabel}</div> : null}
                  <div className="text-xs font-mono text-slate-500">rulesetId: {rulesetId}</div>
                </div>

                {firstPlayerMode === "mutual" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <select className="input" value={String(mutualChoiceAParam)} disabled={isEvent} onChange={(e) => onSetParam("fpa", e.target.value)} aria-label="Mutual choice A">
                      <option value="0">A chooses A first</option>
                      <option value="1">A chooses B first</option>
                    </select>
                    <select className="input" value={String(mutualChoiceBParam)} disabled={isEvent} onChange={(e) => onSetParam("fpb", e.target.value)} aria-label="Mutual choice B">
                      <option value="0">B chooses A first</option>
                      <option value="1">B chooses B first</option>
                    </select>
                  </div>
                ) : null}

                {firstPlayerMode === "commit_reveal" ? (
                  <div className="grid gap-2">
                    <input className="input font-mono text-xs" placeholder="matchSalt (bytes32 hex)" value={commitRevealSaltParam} disabled={isEvent} onChange={(e) => onSetParam("fps", e.target.value.trim())} aria-label="Commit reveal match salt" />
                    <input className="input font-mono text-xs" placeholder="revealA (bytes32 hex)" value={commitRevealAParam} disabled={isEvent} onChange={(e) => onSetParam("fra", e.target.value.trim())} aria-label="Commit reveal A" />
                    <input className="input font-mono text-xs" placeholder="revealB (bytes32 hex)" value={commitRevealBParam} disabled={isEvent} onChange={(e) => onSetParam("frb", e.target.value.trim())} aria-label="Commit reveal B" />
                    <input className="input font-mono text-xs" placeholder="commitA (bytes32 hex; set A/B together if used)" value={commitRevealCommitAParam} disabled={isEvent} onChange={(e) => onSetParam("fca", e.target.value.trim())} aria-label="Commit A (optional)" />
                    <input className="input font-mono text-xs" placeholder="commitB (bytes32 hex; set A/B together if used)" value={commitRevealCommitBParam} disabled={isEvent} onChange={(e) => onSetParam("fcb", e.target.value.trim())} aria-label="Commit B (optional)" />
                    <div className="text-[11px] text-slate-500">If you provide commits, set both Commit A and Commit B.</div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn btn-sm" disabled={isEvent} onClick={onRandomizeCommitReveal}>
                        Randomize Inputs
                      </button>
                      <button type="button" className="btn btn-sm" disabled={isEvent} onClick={onDeriveCommitRevealCommits}>
                        Derive Commits
                      </button>
                    </div>
                  </div>
                ) : null}

                {firstPlayerMode === "committed_mutual_choice" ? (
                  <div className="grid gap-2">
                    <input className="input font-mono text-xs" placeholder="matchSalt (bytes32 hex)" value={commitRevealSaltParam} disabled={isEvent} onChange={(e) => onSetParam("fps", e.target.value.trim())} aria-label="Committed mutual match salt" />
                    <div className="grid grid-cols-2 gap-2">
                      <select className="input" value={String(mutualChoiceAParam)} disabled={isEvent} onChange={(e) => onSetParam("fpa", e.target.value)} aria-label="Committed mutual choice A">
                        <option value="0">A chooses A first</option>
                        <option value="1">A chooses B first</option>
                      </select>
                      <select className="input" value={String(mutualChoiceBParam)} disabled={isEvent} onChange={(e) => onSetParam("fpb", e.target.value)} aria-label="Committed mutual choice B">
                        <option value="0">B chooses A first</option>
                        <option value="1">B chooses B first</option>
                      </select>
                    </div>
                    <input className="input font-mono text-xs" placeholder="playerA (0x address)" value={committedMutualPlayerAParam} disabled={isEvent} onChange={(e) => onSetParam("fpoa", e.target.value.trim())} aria-label="Committed mutual player A" />
                    <input className="input font-mono text-xs" placeholder="nonceA (bytes32 hex)" value={committedMutualNonceAParam} disabled={isEvent} onChange={(e) => onSetParam("fpna", e.target.value.trim())} aria-label="Committed mutual nonce A" />
                    <input className="input font-mono text-xs" placeholder="commitA (bytes32 hex)" value={committedMutualCommitAParam} disabled={isEvent} onChange={(e) => onSetParam("fcoa", e.target.value.trim())} aria-label="Committed mutual commit A" />
                    <input className="input font-mono text-xs" placeholder="playerB (0x address)" value={committedMutualPlayerBParam} disabled={isEvent} onChange={(e) => onSetParam("fpob", e.target.value.trim())} aria-label="Committed mutual player B" />
                    <input className="input font-mono text-xs" placeholder="nonceB (bytes32 hex)" value={committedMutualNonceBParam} disabled={isEvent} onChange={(e) => onSetParam("fpnb", e.target.value.trim())} aria-label="Committed mutual nonce B" />
                    <input className="input font-mono text-xs" placeholder="commitB (bytes32 hex)" value={committedMutualCommitBParam} disabled={isEvent} onChange={(e) => onSetParam("fcob", e.target.value.trim())} aria-label="Committed mutual commit B" />
                    <div className="text-[11px] text-slate-500">Choice A and Choice B must match to resolve first player.</div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn btn-sm" disabled={isEvent} onClick={onRandomizeCommittedMutualChoice}>
                        Randomize Inputs
                      </button>
                      <button type="button" className="btn btn-sm" disabled={isEvent} onClick={onDeriveCommittedMutualChoiceCommits}>
                        Derive Commits
                      </button>
                    </div>
                  </div>
                ) : null}

                {firstPlayerMode === "seed" ? (
                  <div className="grid gap-2">
                    <input className="input font-mono text-xs" placeholder="matchSalt (bytes32 hex)" value={commitRevealSaltParam} disabled={isEvent} onChange={(e) => onSetParam("fps", e.target.value.trim())} aria-label="Seed mode match salt" />
                    <input className="input font-mono text-xs" placeholder="seed (bytes32 hex)" value={seedResolutionParam} disabled={isEvent} onChange={(e) => onSetParam("fpsd", e.target.value.trim())} aria-label="Seed mode seed" />
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn btn-sm" disabled={isEvent} onClick={onRandomizeSeedResolution}>
                        Randomize Inputs
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" disabled={!canLoad || loading} onClick={onLoadCards}>
              {loading ? "Loading..." : dataMode === "fast" ? "Load Cards (Fast)" : "Load Cards (Verified)"}
            </button>
            <button className="btn" onClick={onResetMatch}>Reset Match</button>
            <button className="btn" onClick={onNewSalt}>New Salt</button>
            <a className="btn" href={overlayUrl} target="_blank" rel="noreferrer noopener">
              Open Overlay
            </a>
          </div>

          {status ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">{status}</div> : null}
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
              <div>{error}</div>
              {showRpcSettingsCta ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link className="btn btn-sm" to="/nyano">RPC Settings</Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
