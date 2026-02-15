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
  ONBOARDING_STEPS,
  completedOnboardingStepCount,
  isOnboardingCompleted,
  markOnboardingStepDone,
  readOnboardingProgress,
  resetOnboardingProgress,
} from "@/lib/onboarding";
import { writeClipboardText } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errorMessage";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintBigButton } from "@/components/mint/MintBigButton";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintTitleText, MintLabel } from "@/components/mint/MintTypography";
import { MintIcon } from "@/components/mint/icons/MintIcon";
import { appendThemeToPath, resolveAppTheme } from "@/lib/theme";

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
  const [searchParams] = useSearchParams();
  const theme = resolveAppTheme(searchParams);
  const [difficulty, setDifficulty] = React.useState<DifficultyKey>("normal");
  const [showQuickGuide, setShowQuickGuide] = React.useState(false);
  const [onboardingProgress, setOnboardingProgress] = React.useState(() => readOnboardingProgress());
  const [uxStats, setUxStats] = React.useState(() => readCumulativeStats());
  const [uxSnapshotHistory, setUxSnapshotHistory] = React.useState(() =>
    readUxTelemetrySnapshotHistory(5),
  );
  const onboardingCompleted = React.useMemo(
    () => completedOnboardingStepCount(onboardingProgress),
    [onboardingProgress],
  );
  const onboardingAllDone = React.useMemo(
    () => isOnboardingCompleted(onboardingProgress),
    [onboardingProgress],
  );
  const uxTargetChecks = React.useMemo(() => evaluateUxTargets(uxStats), [uxStats]);

  const themed = React.useCallback((to: string) => appendThemeToPath(to, theme), [theme]);
  const quickPlayUrl = themed(`/match?mode=guest&opp=vs_nyano_ai&ai=${difficulty}&rk=v2&ui=mint`);
  const quickCommitUrl = themed("/match?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint");

  const menuItems = React.useMemo<MenuItem[]>(
    () => [
      { to: themed("/arena"), title: "Arena", subtitle: "対戦モードへ", icon: "arena" },
      { to: themed("/decks"), title: "Decks", subtitle: "デッキ編集", icon: "decks" },
      { to: themed("/replay"), title: "Replay", subtitle: "対戦を振り返る", icon: "replay" },
      { to: themed("/stream"), title: "Stream", subtitle: "配信導線へ", icon: "stream" },
    ],
    [themed],
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
      toast.success("Snapshot copied", "Paste into docs/ux/PLAYTEST_LOG.md");
    } catch (e) {
      toast.error("Copy failed", `${errorMessage(e)} (snapshot saved locally)`);
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
        <p className="mint-home-subtitle">スマホゲームUIの導線で、すぐに対戦を始めよう</p>
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
            <MintLabel>Quick Play</MintLabel>
            <div className="mint-home-quickplay__difficulty">
              {DIFFICULTIES.map((item) => (
                <button
                  key={item.key}
                  className={[
                    "mint-pressable mint-home-difficulty",
                    difficulty === item.key ? "mint-home-difficulty--active" : "",
                  ].join(" ")}
                  onClick={() => setDifficulty(item.key)}
                >
                  <span>{item.labelJa}</span>
                  <span className="mint-home-difficulty__sub">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mint-home-quickplay__actions">
            <MintPressable to={quickPlayUrl} tone="primary" onClick={handleQuickPlayStart}>
              <MintIcon name="match" size={18} />
              <span>すぐ遊ぶ</span>
            </MintPressable>
            <MintPressable to={themed("/arena")} tone="soft">
              <MintIcon name="arena" size={18} />
              <span>Arenaへ</span>
            </MintPressable>
          </div>
        </GlassPanel>
      </section>

      <section className="mint-home-onboarding">
        <div className="mint-home-onboarding__heading">
          <MintTitleText as="h3" className="mint-home-onboarding__title">
            3ステップで始めよう
          </MintTitleText>
          <GlassPanel variant="pill" className="mint-home-onboarding__progress">
            {onboardingCompleted}/{ONBOARDING_STEPS.length} steps
          </GlassPanel>
        </div>

        <div className="mint-home-onboarding__grid">
          <GlassPanel variant="card" className="mint-home-step">
            <div className="mint-home-step__index">1</div>
            <MintTitleText as="h3" className="mint-home-step__title">ルールを知る</MintTitleText>
            <div className="mint-home-step__status">
              {onboardingProgress.steps.read_quick_guide ? "DONE" : "TODO"}
            </div>
            <MintPressable tone="soft" onClick={openQuickGuide}>
              ルールを開く
            </MintPressable>
          </GlassPanel>

          <GlassPanel variant="card" className="mint-home-step">
            <div className="mint-home-step__index">2</div>
            <MintTitleText as="h3" className="mint-home-step__title">ゲストで対戦</MintTitleText>
            <div className="mint-home-step__status">
              {onboardingProgress.steps.start_first_match ? "DONE" : "TODO"}
            </div>
            <MintPressable to={quickPlayUrl} tone="primary" onClick={handleQuickPlayStart}>
              今すぐ対戦
            </MintPressable>
          </GlassPanel>

          <GlassPanel variant="card" className="mint-home-step">
            <div className="mint-home-step__index">3</div>
            <MintTitleText as="h3" className="mint-home-step__title">最初の手を確定</MintTitleText>
            <div className="mint-home-step__status">
              {onboardingProgress.steps.commit_first_move ? "DONE" : "AUTO"}
            </div>
            <MintPressable to={quickCommitUrl} tone="soft">
              Matchを開く
            </MintPressable>
          </GlassPanel>
        </div>

        <div className="mint-home-onboarding__footer">
          <MintPressable to={themed("/start")} tone="soft">
            1分スタート画面へ
          </MintPressable>
          <MintPressable
            tone="ghost"
            onClick={() => {
              resetOnboardingProgress();
              refreshOnboarding();
              toast.success("Quickstart reset", "オンボーディング進捗を初期化しました。");
            }}
          >
            Reset quickstart
          </MintPressable>
          {onboardingAllDone ? (
            <span className="mint-home-onboarding__done">すべて完了。Decks / Arena へ進めます。</span>
          ) : null}
        </div>
      </section>

      <section className="mint-home-infobar">
        <GlassPanel variant="pill" className="mint-home-pill">
          <MintIcon name="events" size={14} />
          <span>現在のフェーズ: 検証・共有フェーズ</span>
        </GlassPanel>
        <GlassPanel variant="pill" className="mint-home-pill">
          <MintIcon name="sparkle" size={14} />
          <span>次のマイルストーン: 運営品質のゲーム体験</span>
        </GlassPanel>
      </section>

      <section className="mint-home-tools">
        <details className="mint-home-disclosure">
          <summary>Tools / Settings</summary>
          <div className="mint-home-tools__body">
            <div className="mint-home-tools__actions">
              <MintPressable tone="soft" size="sm" onClick={() => {
                resetTutorialSeen();
                toast.success("Tutorial reset", "The tutorial will appear on your next guest match.");
              }}>
                Reset Tutorial
              </MintPressable>
              <MintPressable tone="soft" size="sm" onClick={() => {
                clearGameIndexCache();
                toast.success("Cache cleared", "Game index cache has been cleared.");
              }}>
                Reset Game Cache
              </MintPressable>
              <MintPressable tone="soft" size="sm" onClick={refreshUxStats}>
                Refresh Metrics
              </MintPressable>
              <MintPressable tone="primary" size="sm" onClick={copyUxSnapshot}>
                Copy Snapshot
              </MintPressable>
              <MintPressable tone="ghost" size="sm" onClick={() => {
                clearCumulativeStats();
                refreshUxStats();
                toast.success("Telemetry reset", "Local UX metrics have been cleared.");
              }}>
                Reset Metrics
              </MintPressable>
              <MintPressable tone="ghost" size="sm" onClick={() => {
                clearUxTelemetrySnapshotHistory();
                setUxSnapshotHistory([]);
                toast.success("Snapshot history reset", "Local snapshot history has been cleared.");
              }}>
                Clear History
              </MintPressable>
            </div>

            <div className="mint-home-metrics-grid">
              <GlassPanel variant="card" className="mint-home-metric">
                <MintLabel>Sessions</MintLabel>
                <div>{uxStats.sessions}</div>
              </GlassPanel>
              <GlassPanel variant="card" className="mint-home-metric">
                <MintLabel>Avg first interaction</MintLabel>
                <div>{formatSecondsFromMs(uxStats.avg_first_interaction_ms)}</div>
              </GlassPanel>
              <GlassPanel variant="card" className="mint-home-metric">
                <MintLabel>Avg first place</MintLabel>
                <div>{formatSecondsFromMs(uxStats.avg_first_place_ms)}</div>
              </GlassPanel>
              <GlassPanel variant="card" className="mint-home-metric">
                <MintLabel>Avg Home LCP</MintLabel>
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
                  <div className="mint-home-target__value">target {check.target}</div>
                  <div className="mint-home-target__value">current {check.valueText}</div>
                </GlassPanel>
              ))}
            </div>

            {uxSnapshotHistory.length > 0 ? (
              <div className="mint-home-snapshots">
                {uxSnapshotHistory.map((snapshot, index) => (
                  <GlassPanel key={`${snapshot.generatedAtIso}-${index}`} variant="card" className="mint-home-snapshot">
                    <div>{snapshot.generatedAtIso}</div>
                    <div>{snapshot.context ? `${snapshot.context.route} / ${snapshot.context.viewport}` : "Context unavailable"}</div>
                  </GlassPanel>
                ))}
              </div>
            ) : (
              <div className="mint-home-snapshots__empty">No snapshot history yet.</div>
            )}
          </div>
        </details>
      </section>

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
