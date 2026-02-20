import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetTutorialSeen } from "@/components/MiniTutorial";
import { useToast } from "@/components/Toast";
import { clearGameIndexCache } from "@/lib/nyano/gameIndex";
import {
  buildUxTelemetrySnapshot,
  clearCumulativeStats,
  clearUxTelemetrySnapshotHistory,
  evaluateUxTargets,
  formatUxTelemetrySnapshotMarkdown,
  markQuickPlayStart,
  readCumulativeStats,
  readUxTelemetrySnapshotHistory,
  recordHomeLcpMs,
  saveUxTelemetrySnapshot,
  type UxTargetStatus,
} from "@/lib/telemetry";
import {
  isOnboardingCompleted,
  markOnboardingStepDone,
  readOnboardingProgress,
} from "@/lib/onboarding";
import { writeClipboardText } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errorMessage";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintBigButton } from "@/components/mint/MintBigButton";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintTitleText, MintLabel } from "@/components/mint/MintTypography";
import { MintIcon } from "@/components/mint/icons/MintIcon";
import { appendThemeToPath, resolveAppTheme } from "@/lib/theme";
import { isDebugMode } from "@/lib/debug";
import { useIdle } from "@/hooks/useIdle";
import {
  CLASSIC_QUICK_PRESETS,
  buildQuickGuestMatchPath,
  normalizeClassicQuickPresetId,
  type ClassicQuickPresetId,
} from "@/lib/classic_quick_presets";

const DIFFICULTIES = [
  { key: "easy", label: "Easy", labelJa: "はじめて" },
  { key: "normal", label: "Normal", labelJa: "ふつう" },
  { key: "hard", label: "Hard", labelJa: "つよい" },
  { key: "expert", label: "Expert", labelJa: "めっちゃつよい" },
] as const;

type DifficultyKey = (typeof DIFFICULTIES)[number]["key"];

type MenuItem = {
  to: string;
  title: string;
  subtitle: string;
  icon: "arena" | "decks" | "replay" | "stream";
};

function formatSecondsFromMs(ms: number | null): string {
  if (ms === null) return "--";
  return `${(ms / 1000).toFixed(1)}s`;
}

function targetStatusLabel(status: UxTargetStatus): string {
  if (status === "pass") return "PASS";
  if (status === "fail") return "FAIL";
  return "N/A";
}

function targetStatusClass(status: UxTargetStatus): string {
  if (status === "pass") return "mint-home-status mint-home-status--pass";
  if (status === "fail") return "mint-home-status mint-home-status--fail";
  return "mint-home-status";
}

export function HomePage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = resolveAppTheme(searchParams);
  const [difficulty, setDifficulty] = React.useState<DifficultyKey>("normal");
  const quickPresetParam = normalizeClassicQuickPresetId(searchParams.get("qp"));
  const quickRulesPreset: "standard" | ClassicQuickPresetId = quickPresetParam ?? "standard";
  const [showQuickGuide, setShowQuickGuide] = React.useState(false);
  const [onboardingProgress, setOnboardingProgress] = React.useState(() => readOnboardingProgress());
  const [uxStats, setUxStats] = React.useState(() => readCumulativeStats());
  const [uxSnapshotHistory, setUxSnapshotHistory] = React.useState(() =>
    readUxTelemetrySnapshotHistory(5),
  );
  const onboardingAllDone = React.useMemo(
    () => isOnboardingCompleted(onboardingProgress),
    [onboardingProgress],
  );
  const showDevTools = React.useMemo(() => isDebugMode(), []);
  const uxTargetChecks = React.useMemo(() => evaluateUxTargets(uxStats), [uxStats]);

  const themed = React.useCallback((to: string) => appendThemeToPath(to, theme), [theme]);
  const quickPlayPath = React.useMemo(() => {
    return buildQuickGuestMatchPath({
      preset: quickRulesPreset,
      ai: difficulty,
      ui: "mint",
    });
  }, [difficulty, quickRulesPreset]);
  const quickPlayUrl = themed(quickPlayPath);
  const quickCommitUrl = themed(
    buildQuickGuestMatchPath({ preset: "standard", ai: "normal", ui: "mint" }),
  );
  const selectedQuickPresetSummary = React.useMemo(() => {
    if (quickRulesPreset === "standard") {
      return "標準ルール。まずはここから。";
    }
    return CLASSIC_QUICK_PRESETS.find((preset) => preset.id === quickRulesPreset)?.summary ?? "";
  }, [quickRulesPreset]);
  const arenaQuickPath = React.useMemo(
    () => (quickRulesPreset === "standard" ? "/arena" : `/arena?qp=${quickRulesPreset}`),
    [quickRulesPreset],
  );
  const arenaQuickUrl = themed(arenaQuickPath);
  const isQuickPlayIdle = useIdle({
    timeoutMs: 4200,
    disabled: showQuickGuide,
  });

  const handleQuickPresetSelect = React.useCallback(
    (preset: "standard" | ClassicQuickPresetId) => {
      const next = new URLSearchParams(searchParams);
      if (preset === "standard") next.delete("qp");
      else next.set("qp", preset);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const menuItems = React.useMemo<MenuItem[]>(
    () => [
      { to: arenaQuickUrl, title: "Arena", subtitle: "対戦モードへ", icon: "arena" },
      { to: themed("/decks"), title: "Decks", subtitle: "デッキ編集", icon: "decks" },
      { to: themed("/replay"), title: "Replay", subtitle: "対戦を振り返る", icon: "replay" },
      { to: themed("/stream"), title: "Stream", subtitle: "配信ツールへ", icon: "stream" },
    ],
    [arenaQuickUrl, themed],
  );

  const refreshOnboarding = React.useCallback(() => {
    setOnboardingProgress(readOnboardingProgress());
  }, []);

  const refreshUxStats = React.useCallback(() => {
    setUxStats(readCumulativeStats());
    setUxSnapshotHistory(readUxTelemetrySnapshotHistory(5));
  }, []);

  const openQuickGuide = React.useCallback(() => {
    markOnboardingStepDone("read_quick_guide");
    refreshOnboarding();
    setShowQuickGuide(true);
  }, [refreshOnboarding]);

  const handleQuickPlayStart = React.useCallback(() => {
    markQuickPlayStart();
    markOnboardingStepDone("start_first_match");
    refreshOnboarding();
  }, [refreshOnboarding]);

  const copyUxSnapshot = React.useCallback(async () => {
    const snapshot = buildUxTelemetrySnapshot(uxStats, Date.now(), {
      route: `${window.location.pathname}${window.location.search}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language ?? "unknown",
      userAgent: navigator.userAgent ?? "unknown",
    });
    saveUxTelemetrySnapshot(snapshot);
    setUxSnapshotHistory(readUxTelemetrySnapshotHistory(5));

    try {
      await writeClipboardText(formatUxTelemetrySnapshotMarkdown(snapshot));
      toast.success("スナップショットをコピーしました", "docs/ux/PLAYTEST_LOG.md に貼り付けてください。");
    } catch (e) {
      toast.error("コピーに失敗しました", `${errorMessage(e)}（ローカル保存は完了）`);
    }
  }, [toast, uxStats]);

  React.useEffect(() => {
    const onFocus = () => {
      refreshUxStats();
      refreshOnboarding();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshOnboarding, refreshUxStats]);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;

    let reported = false;
    let latestLcp: number | null = null;

    const report = () => {
      if (reported || latestLcp === null) return;
      reported = true;
      recordHomeLcpMs(latestLcp);
      refreshUxStats();
    };

    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const last = entries[entries.length - 1];
      if (!last) return;
      latestLcp = last.startTime;
    });

    try {
      observer.observe({ type: "largest-contentful-paint", buffered: true } as PerformanceObserverInit);
    } catch {
      observer.disconnect();
      return;
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") report();
    };
    const onPageHide = () => {
      report();
    };

    document.addEventListener("visibilitychange", onVisibilityChange, true);
    window.addEventListener("pagehide", onPageHide, true);
    const fallbackTimer = window.setTimeout(report, 6000);

    return () => {
      window.clearTimeout(fallbackTimer);
      report();
      document.removeEventListener("visibilitychange", onVisibilityChange, true);
      window.removeEventListener("pagehide", onPageHide, true);
      observer.disconnect();
    };
  }, [refreshUxStats]);

  return (
    <div className="mint-home-screen">
      <section className="mint-home-hero">
        <MintTitleText as="h2" className="mint-home-title">
          Nyano Triad League
        </MintTitleText>
        <p className="mint-home-subtitle">デッキを選んで、すぐに対戦を始めよう</p>
      </section>

      <section className="mint-home-menu-grid" aria-label="Main menu">
        {menuItems.map((item) => (
          <MintBigButton
            key={item.title}
            to={item.to}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
          />
        ))}
      </section>

      <section className="mint-home-quickplay">
        <GlassPanel variant="panel" className="mint-home-quickplay__panel">
          <div className="mint-home-quickplay__head">
            <MintLabel>クイック対戦 (Quick Play)</MintLabel>
            <div className="mint-home-quickplay__difficulty">
              {DIFFICULTIES.map((item) => (
                <button
                  key={item.key}
                  className={[
                    "mint-pressable mint-hit mint-home-difficulty",
                    difficulty === item.key ? "mint-home-difficulty--active" : "",
                  ].join(" ")}
                  onClick={() => setDifficulty(item.key)}
                >
                  <span>{item.labelJa}</span>
                  <span className="mint-home-difficulty__sub">{item.label}</span>
                </button>
              ))}
            </div>
            <div className="mint-home-quickplay__rules">
              <span className="mint-home-quickplay__rules-label">ルールプリセット</span>
              <div className="mint-home-quickplay__rules-grid" role="group" aria-label="Quick play rules preset">
                <button
                  type="button"
                  className={[
                    "mint-pressable mint-hit mint-home-rules-chip",
                    quickRulesPreset === "standard" ? "mint-home-rules-chip--active" : "",
                  ].join(" ")}
                  aria-pressed={quickRulesPreset === "standard"}
                  onClick={() => handleQuickPresetSelect("standard")}
                >
                  Standard
                </button>
                {CLASSIC_QUICK_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={[
                      "mint-pressable mint-hit mint-home-rules-chip",
                      quickRulesPreset === preset.id ? "mint-home-rules-chip--active" : "",
                    ].join(" ")}
                    aria-pressed={quickRulesPreset === preset.id}
                    onClick={() => handleQuickPresetSelect(preset.id)}
                    title={preset.summary}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="mint-home-quickplay__rules-summary">{selectedQuickPresetSummary}</p>
            </div>
          </div>
          <div className="mint-home-quickplay__actions">
            <MintPressable
              to={quickPlayUrl}
              tone="primary"
              className={isQuickPlayIdle ? "mint-idle-guide mint-idle-guide--primary" : ""}
              onClick={handleQuickPlayStart}
            >
              <MintIcon name="match" size={18} />
              <span>すぐ遊ぶ</span>
            </MintPressable>
            <MintPressable to={arenaQuickUrl} tone="soft">
              <MintIcon name="arena" size={18} />
              <span>Arenaへ</span>
            </MintPressable>
          </div>
        </GlassPanel>
      </section>

      <section className="mint-home-onboarding">
        <div className="mint-home-onboarding__heading">
          <MintTitleText as="h3" className="mint-home-onboarding__title">
            最短2ステップで対戦開始
          </MintTitleText>
        </div>
        <p className="mint-home-onboarding__note">
          ゲスト対戦は 2 までで開始できます。3 は慣れてきたら進める任意ステップです。
        </p>

        <div className="mint-home-onboarding__grid">
          <GlassPanel variant="card" className="mint-home-step">
            <div className="mint-home-step__index">1</div>
            <MintTitleText as="h3" className="mint-home-step__title">ルールを知る</MintTitleText>
            <MintPressable tone="soft" onClick={openQuickGuide}>
              ルールを開く
            </MintPressable>
          </GlassPanel>

          <GlassPanel variant="card" className="mint-home-step">
            <div className="mint-home-step__index">2</div>
            <MintTitleText as="h3" className="mint-home-step__title">ゲストで対戦</MintTitleText>
            <MintPressable to={quickPlayUrl} tone="primary" onClick={handleQuickPlayStart}>
              今すぐ対戦
            </MintPressable>
          </GlassPanel>

          <GlassPanel variant="card" className="mint-home-step">
            <div className="mint-home-step__index">3</div>
            <MintTitleText as="h3" className="mint-home-step__title">慣れたら最初の手を確定</MintTitleText>
            <MintPressable to={quickCommitUrl} tone="soft">
              Matchを開く
            </MintPressable>
          </GlassPanel>
        </div>

        <div className="mint-home-onboarding__footer">
          <MintPressable to={themed("/start")} tone="soft">
            1分スタート画面へ
          </MintPressable>
          {onboardingAllDone ? (
            <span className="mint-home-onboarding__done">遊ぶ準備が整いました。好きなモードを選んで始めましょう。</span>
          ) : null}
        </div>
      </section>

      <section className="mint-home-infobar">
        <GlassPanel variant="pill" className="mint-home-pill">
          <MintIcon name="events" size={14} />
          <span>まずはゲスト対戦でルールを覚えよう</span>
        </GlassPanel>
        <GlassPanel variant="pill" className="mint-home-pill">
          <MintIcon name="sparkle" size={14} />
          <span>Decks と Arena で自分の戦い方を見つけよう</span>
        </GlassPanel>
      </section>

      {showDevTools ? (
        <section className="mint-home-tools">
          <details className="mint-home-disclosure">
            <summary>開発ツール</summary>
            <div className="mint-home-tools__body">
              <div className="mint-home-tools__actions">
              <MintPressable tone="soft" size="sm" onClick={() => {
                resetTutorialSeen();
                toast.success("チュートリアルをリセットしました", "次のゲスト対戦で再表示されます。");
              }}>
                チュートリアルをリセット (Reset Tutorial)
              </MintPressable>
              <MintPressable tone="soft" size="sm" onClick={() => {
                clearGameIndexCache();
                toast.success("キャッシュを削除しました", "ゲームインデックスのキャッシュを初期化しました。");
              }}>
                ゲームキャッシュを初期化 (Reset Game Cache)
              </MintPressable>
              <MintPressable tone="soft" size="sm" onClick={refreshUxStats}>
                指標を更新 (Refresh Metrics)
              </MintPressable>
              <MintPressable tone="primary" size="sm" onClick={copyUxSnapshot}>
                スナップショットをコピー (Copy Snapshot)
              </MintPressable>
              <MintPressable tone="ghost" size="sm" onClick={() => {
                clearCumulativeStats();
                refreshUxStats();
                toast.success("指標をリセットしました", "ローカルUX指標を初期化しました。");
              }}>
                指標をリセット (Reset Metrics)
              </MintPressable>
              <MintPressable tone="ghost" size="sm" onClick={() => {
                clearUxTelemetrySnapshotHistory();
                setUxSnapshotHistory([]);
                toast.success("履歴を削除しました", "ローカルのスナップショット履歴を初期化しました。");
              }}>
                履歴を削除 (Clear History)
              </MintPressable>
              </div>

              <div className="mint-home-metrics-grid">
                <GlassPanel variant="card" className="mint-home-metric">
                  <MintLabel>セッション (Sessions)</MintLabel>
                  <div>{uxStats.sessions}</div>
                </GlassPanel>
                <GlassPanel variant="card" className="mint-home-metric">
                  <MintLabel>初回操作まで平均 (Avg first interaction)</MintLabel>
                  <div>{formatSecondsFromMs(uxStats.avg_first_interaction_ms)}</div>
                </GlassPanel>
                <GlassPanel variant="card" className="mint-home-metric">
                  <MintLabel>初回配置まで平均 (Avg first place)</MintLabel>
                  <div>{formatSecondsFromMs(uxStats.avg_first_place_ms)}</div>
                </GlassPanel>
                <GlassPanel variant="card" className="mint-home-metric">
                  <MintLabel>ホームLCP平均 (Avg Home LCP)</MintLabel>
                  <div>{formatSecondsFromMs(uxStats.avg_home_lcp_ms)}</div>
                </GlassPanel>
              </div>

              <div className="mint-home-targets">
                {uxTargetChecks.map((check) => (
                  <GlassPanel key={check.id} variant="card" className="mint-home-target">
                    <div className="mint-home-target__top">
                      <span>{check.id}</span>
                      <span className={targetStatusClass(check.status)}>{targetStatusLabel(check.status)}</span>
                    </div>
                    <div className="mint-home-target__value">目標 target: {check.target}</div>
                    <div className="mint-home-target__value">現在 current: {check.valueText}</div>
                  </GlassPanel>
                ))}
              </div>

              {uxSnapshotHistory.length > 0 ? (
                <div className="mint-home-snapshots">
                  {uxSnapshotHistory.map((snapshot, index) => (
                    <GlassPanel key={`${snapshot.generatedAtIso}-${index}`} variant="card" className="mint-home-snapshot">
                      <div>{snapshot.generatedAtIso}</div>
                      <div>{snapshot.context ? `${snapshot.context.route} / ${snapshot.context.viewport}` : "コンテキストなし (Context unavailable)"}</div>
                    </GlassPanel>
                  ))}
                </div>
              ) : (
                <div className="mint-home-snapshots__empty">スナップショット履歴はまだありません。(No snapshot history yet.)</div>
              )}
            </div>
          </details>
        </section>
      ) : null}

      {showQuickGuide ? (
        <div className="mint-home-modal">
          <GlassPanel variant="card" className="mint-home-modal__panel">
            <MintTitleText as="h3" className="mint-home-modal__title">1分ルールガイド</MintTitleText>
            <div className="mint-home-modal__body">
              <p>1. 空いているマスを選ぶ</p>
              <p>2. 手札からカードを選んで置く</p>
              <p>3. 隣接する辺の数値が高いと相手カードを反転できる</p>
              <p>4. 9手終了時にタイル枚数が多い側が勝ち</p>
            </div>
            <div className="mint-home-modal__actions">
              <MintPressable tone="soft" onClick={() => setShowQuickGuide(false)}>
                閉じる
              </MintPressable>
              <Link className="mint-home-modal__link" to={themed("/rulesets")}>
                Rulesetsを見る
              </Link>
            </div>
          </GlassPanel>
        </div>
      ) : null}
    </div>
  );
}
