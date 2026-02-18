import React from "react";
import { Link } from "react-router-dom";

import type { ClassicRulesConfigV1, PlayerIndex } from "@nyano/triad-engine";
import type { AiDifficulty } from "@/lib/ai/nyano_ai";
import type { DeckV1 } from "@/lib/deck_store";
import type { FirstPlayerResolution, FirstPlayerResolutionMode } from "@/lib/first_player_resolve";
import type { RulesetKey } from "@/lib/ruleset_registry";
import { MintRulesetPicker } from "./MintRulesetPicker";
import {
  buildMatchSetupSummaryLine,
  describeRulesetKeyDisplay,
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
  classicCustomMaskParam: string;
  classicCustomConfig: ClassicRulesConfigV1;
  classicRuleTags: readonly string[];
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
  onRulesetKeyChange: (nextKey: RulesetKey) => void;
  onSetClassicMask: (nextMask: string) => void;
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
    classicCustomMaskParam,
    classicCustomConfig,
    classicRuleTags,
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
    onRulesetKeyChange,
    onSetClassicMask,
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
    classicRuleTags,
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
          <div className="text-base font-semibold">対戦設定 (Match Setup)</div>
          <div className="text-xs text-slate-500">デッキ・ルール・対戦相手を順番に決めます</div>
        </div>
        <span className="text-sm text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div className="card-bd grid gap-4 text-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900">設定サマリー</span>
              <span className="min-w-0 flex-1 truncate" data-testid="match-setup-summary-line">{summaryLine}</span>
              <button type="button" className="btn btn-sm" onClick={onCopySetupLink}>
                設定URLをコピー
              </button>
            </div>
          </div>

          <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">基本設定</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-medium text-slate-600">デッキA</div>
                <select className="input" value={deckAId} onChange={(e) => onSetParam("a", e.target.value)} aria-label="Deck A">
                  <option value="">選択してください</option>
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
                    <Link className="underline" to="/decks">Decks</Link> でデッキを作成してください
                  </div>
                )}
              </div>

              <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-medium text-slate-600">デッキB</div>
                {eventDeckTokenIds ? (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                    イベント固定デッキ: <span className="font-mono">{eventDeckTokenIds.join(", ")}</span>
                  </div>
                ) : (
                  <>
                    <select className="input" value={deckBId} onChange={(e) => onSetParam("b", e.target.value)} aria-label="Deck B">
                      <option value="">選択してください</option>
                      {decks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {deckB ? (
                      <div className="text-xs text-slate-500">{deckB.tokenIds.join(", ")}</div>
                    ) : (
                      <div className="text-xs text-slate-400">デッキBを選択してください</div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">対戦相手</div>
                <div className="inline-flex w-full rounded-lg border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    className={chipButtonClass(opponentMode === "pvp")}
                    onClick={() => onSetParam("opp", "pvp")}
                    disabled={isEvent}
                    data-testid="match-setup-opponent-pvp"
                  >
                    対人 (Human vs Human)
                  </button>
                  <button
                    type="button"
                    className={chipButtonClass(opponentMode === "vs_nyano_ai")}
                    onClick={() => onSetParam("opp", "vs_nyano_ai")}
                    disabled={isEvent}
                    data-testid="match-setup-opponent-ai"
                  >
                    Nyano AI
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
                      <option value="easy">かんたん (Easy)</option>
                      <option value="normal">ふつう (Normal)</option>
                      <option value="hard">むずかしい (Hard)</option>
                      <option value="expert">エキスパート (Expert)</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={aiAutoPlay} onChange={(e) => onSetParam("auto", e.target.checked ? "1" : "0")} aria-label="AI auto play" />
                      Nyanoの手番を自動進行
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">ルールセット</div>
                <MintRulesetPicker
                  rulesetKey={rulesetKey}
                  classicConfig={classicCustomConfig}
                  classicRuleTags={classicRuleTags}
                  disabled={isEvent}
                  onSelectRulesetKey={onRulesetKeyChange}
                  onSetClassicMask={onSetClassicMask}
                />
                <select
                  className="input"
                  value={rulesetKey}
                  disabled={isEvent}
                  onChange={(e) => onRulesetKeyChange(e.target.value as RulesetKey)}
                  aria-label="Ruleset"
                  data-testid="match-setup-ruleset"
                >
                  <option value="v1">v1 (core+tactics)</option>
                  <option value="v2">v2 (shadow ignores warning mark)</option>
                  <option value="full">full (tactics+traits+formations)</option>
                  <option value="classic_plus_same">classic (plus+same)</option>
                  <option value="classic_custom">classic (custom)</option>
                  <option value="classic_plus">classic (plus)</option>
                  <option value="classic_same">classic (same)</option>
                  <option value="classic_reverse">classic (reverse)</option>
                  <option value="classic_ace_killer">classic (ace killer)</option>
                  <option value="classic_type_ascend">classic (type ascend)</option>
                  <option value="classic_type_descend">classic (type descend)</option>
                  <option value="classic_order">classic (order)</option>
                  <option value="classic_chaos">classic (chaos)</option>
                  <option value="classic_swap">classic (swap)</option>
                  <option value="classic_all_open">classic (all open)</option>
                  <option value="classic_three_open">classic (three open)</option>
                </select>
                <div className="text-xs text-slate-500">現在: {describeRulesetKeyDisplay(rulesetKey)}</div>
                {rulesetKey === "classic_custom" ? (
                  <div className="text-xs font-mono text-slate-500">cr={classicCustomMaskParam}</div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">補助設定</div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">盤面UI</div>
                <select
                  className="input"
                  value={ui}
                  onChange={(e) => onBoardUiChange(e.target.value as MatchSetupBoardUi)}
                  aria-label="Board renderer"
                  data-testid="match-setup-board-ui"
                >
                  <option value="mint">mint (標準)</option>
                  <option value="engine">engine (Pixi)</option>
                  <option value="rpg">rpg (演出重視)</option>
                </select>
                {isEngine ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="btn btn-sm" onClick={() => onSetFocusMode(true)}>
                      Pixiフォーカスへ
                    </button>
                    <Link className="btn btn-sm no-underline" to={stageMatchUrl}>
                      ステージ画面を開く
                    </Link>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">先手決定</div>
                <select
                  className="input"
                  value={firstPlayerMode}
                  disabled={isEvent}
                  onChange={(e) => onFirstPlayerModeChange(e.target.value as FirstPlayerResolutionMode)}
                  aria-label="First player mode"
                  data-testid="match-setup-first-player-mode"
                >
                  <option value="manual">手動 (Manual)</option>
                  <option value="mutual">相互選択 (Mutual choice)</option>
                  <option value="committed_mutual_choice">コミット相互選択 (Committed mutual choice)</option>
                  <option value="seed">シード (Seed)</option>
                  <option value="commit_reveal">コミットリビール (Commit-reveal)</option>
                </select>
                {firstPlayerMode === "manual" ? (
                  <select
                    className="input"
                    value={String(manualFirstPlayerParam)}
                    disabled={isEvent}
                    onChange={(e) => onSetParam("fp", e.target.value)}
                    aria-label="Manual first player"
                  >
                    <option value="0">A先手</option>
                    <option value="1">B先手</option>
                  </select>
                ) : null}
                <div className={`text-xs ${!isEvent && !firstPlayerResolution.valid ? "text-rose-600" : "text-slate-500"}`}>
                  解決結果: {firstPlayer === 0 ? "A先手" : "B先手"}
                  {!isEvent && !firstPlayerResolution.valid && firstPlayerResolution.error ? ` (${firstPlayerResolution.error})` : ""}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">データ取得</div>
                <div className="inline-flex w-full rounded-lg border border-slate-200 bg-white p-1">
                  <button type="button" className={chipButtonClass(dataMode === "fast")} onClick={() => onSetDataMode("fast")} aria-label="Data mode fast">
                    高速 (Fast)
                  </button>
                  <button type="button" className={chipButtonClass(dataMode === "verified")} onClick={() => onSetDataMode("verified")} aria-label="Data mode verified">
                    検証付き (Verified)
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">配信モード</div>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={streamMode} onChange={(e) => onSetParam("stream", e.target.checked ? "1" : "0")} aria-label="Stream mode" />
                  配信コントロール経路を有効化
                </label>
                {streamMode ? (
                  <select className="input" value={streamCtrlParam} onChange={(e) => onSetParam("ctrl", e.target.value)} aria-label="Chat controlled side">
                    <option value="A">チャットがAを操作</option>
                    <option value="B">チャットがBを操作</option>
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
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">詳細設定</span>
              <span className="text-xs text-slate-500">{advancedOpen ? "非表示" : "表示"} URLパラメータ設定</span>
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
                    <option value="">連鎖上限: オフ (ccap)</option>
                    {Array.from({ length: maxChainCapPerTurn + 1 }, (_, n) => (
                      <option key={n} value={String(n)}>
                        連鎖上限 = {n}
                      </option>
                    ))}
                  </select>
                  {chainCapRawParam !== null && chainCapPerTurnParam === null ? (
                    <div className="text-xs text-rose-600">ccap パラメータが不正です (許容値: 0..{maxChainCapPerTurn})</div>
                  ) : (
                    <div className="text-xs text-slate-500">連鎖上限の試験設定（表示調整のみ。rulesetId は変わりません）</div>
                  )}
                  {classicSwapLabel ? <div className="text-xs text-amber-700">{classicSwapLabel}</div> : null}
                  {classicOpenLabel ? <div className="text-xs text-emerald-700">{classicOpenLabel}</div> : null}
                  <div className="text-xs font-mono text-slate-500">現在の rulesetId: {rulesetId}</div>
                </div>

                {firstPlayerMode === "mutual" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <select className="input" value={String(mutualChoiceAParam)} disabled={isEvent} onChange={(e) => onSetParam("fpa", e.target.value)} aria-label="Mutual choice A">
                      <option value="0">AがA先手を選択</option>
                      <option value="1">AがB先手を選択</option>
                    </select>
                    <select className="input" value={String(mutualChoiceBParam)} disabled={isEvent} onChange={(e) => onSetParam("fpb", e.target.value)} aria-label="Mutual choice B">
                      <option value="0">BがA先手を選択</option>
                      <option value="1">BがB先手を選択</option>
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
                    <div className="text-[11px] text-slate-500">Commit を使う場合は Commit A / Commit B の両方を設定してください。</div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn btn-sm" disabled={isEvent} onClick={onRandomizeCommitReveal}>
                        入力をランダム生成
                      </button>
                      <button type="button" className="btn btn-sm" disabled={isEvent} onClick={onDeriveCommitRevealCommits}>
                        Commit を導出
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
                    <div className="text-[11px] text-slate-500">先手を確定するには Choice A と Choice B が一致している必要があります。</div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn btn-sm" disabled={isEvent} onClick={onRandomizeCommittedMutualChoice}>
                        入力をランダム生成
                      </button>
                      <button type="button" className="btn btn-sm" disabled={isEvent} onClick={onDeriveCommittedMutualChoiceCommits}>
                        Commit を導出
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
                        入力をランダム生成
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" disabled={!canLoad || loading} onClick={onLoadCards}>
              {loading ? "読み込み中..." : dataMode === "fast" ? "カード読込 (Fast)" : "カード読込 (Verified)"}
            </button>
            <button className="btn" onClick={onResetMatch}>対戦をリセット</button>
            <button className="btn" onClick={onNewSalt}>Saltを再生成</button>
            <a className="btn" href={overlayUrl} target="_blank" rel="noreferrer noopener">
              Overlayを開く
            </a>
          </div>

          {status ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">{status}</div> : null}
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
              <div>{error}</div>
              {showRpcSettingsCta ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link className="btn btn-sm" to="/nyano">RPC設定</Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
