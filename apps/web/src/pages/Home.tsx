import React from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/Toast";
import { NyanoAvatar } from "@/components/NyanoAvatar";
import { resetTutorialSeen } from "@/components/MiniTutorial";
import { clearGameIndexCache } from "@/lib/nyano/gameIndex";
import {
  buildUxTelemetrySnapshot,
  clearCumulativeStats,
  evaluateUxTargets,
  formatUxTelemetrySnapshotMarkdown,
  markQuickPlayStart,
  readCumulativeStats,
  recordHomeLcpMs,
  type UxTargetStatus,
} from "@/lib/telemetry";
import { writeClipboardText } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errorMessage";
import type { ExpressionName } from "@/lib/expression_map";

/* ═══════════════════════════════════════════════════════════════════════════
   HOME PAGE — Polished Landing Page (M08)

   Main landing page for Nyano Triad League.
   Features:
   - Hero section with animated NyanoAvatar mascot
   - Gradient animated title
   - Quick action CTA buttons
   - Feature overview cards (Arena, Decks, Replay, Stream)
   - Tools section (Playground, Nyano, Events, Rulesets)
   - Info cards (current phase, next milestone)
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Hero mascot expression cycling ──────────────────────────────────────

const HERO_EXPRESSIONS: ExpressionName[] = ["playful", "calm", "laugh", "happy"];
const EXPRESSION_INTERVAL_MS = 5_000;

function useHeroExpression(): ExpressionName {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_EXPRESSIONS.length);
    }, EXPRESSION_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return HERO_EXPRESSIONS[index];
}

// ── Feature card data ───────────────────────────────────────────────────

const FEATURES = [
  {
    title: "Arena",
    titleJa: "アリーナ",
    description: "対戦モードでNyanoカードの力を試そう",
    icon: "⚔️",
    path: "/arena",
    color: "nyano" as const,
  },
  {
    title: "Decks",
    titleJa: "デッキ",
    description: "5枚のカードを選んでデッキを組む",
    icon: "🃏",
    path: "/decks",
    color: "sky" as const,
  },
  {
    title: "Replay",
    titleJa: "リプレイ",
    description: "過去の対戦を振り返り、共有する",
    icon: "📼",
    path: "/replay",
    color: "violet" as const,
  },
  {
    title: "Stream",
    titleJa: "配信",
    description: "視聴者参加型配信をセットアップ",
    icon: "📺",
    path: "/stream",
    color: "emerald" as const,
  },
];

// ── Tool card data ──────────────────────────────────────────────────────

const TOOLS = [
  { title: "Playground", description: "ルールのテストと検証", icon: "🧪", path: "/playground" },
  { title: "Nyano", description: "カードデータを確認", icon: "🐱", path: "/nyano" },
  { title: "Events", description: "リーグイベントを管理", icon: "🏆", path: "/events" },
  { title: "Rulesets", description: "ルールセット設定", icon: "📜", path: "/rulesets" },
];

// ── Color styles for feature cards ──────────────────────────────────────

type FeatureColor = "nyano" | "sky" | "violet" | "emerald";

const COLOR_STYLES: Record<
  FeatureColor,
  { bg: string; border: string; hover: string; accent: string }
> = {
  nyano: {
    bg: "bg-gradient-to-br from-nyano-50 to-nyano-100/50",
    border: "border-nyano-200",
    hover: "hover:border-nyano-400 hover:shadow-glow-nyano",
    accent: "text-nyano-600",
  },
  sky: {
    bg: "bg-gradient-to-br from-sky-50 to-sky-100/50",
    border: "border-sky-200",
    hover: "hover:border-sky-400 hover:shadow-glow-a",
    accent: "text-sky-600",
  },
  violet: {
    bg: "bg-gradient-to-br from-violet-50 to-violet-100/50",
    border: "border-violet-200",
    hover: "hover:border-violet-400",
    accent: "text-violet-600",
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
    border: "border-emerald-200",
    hover: "hover:border-emerald-400",
    accent: "text-emerald-600",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface FeatureCardProps {
  title: string;
  titleJa: string;
  description: string;
  icon: string;
  path: string;
  color: FeatureColor;
}

function FeatureCard({ title, titleJa, description, icon, path, color }: FeatureCardProps) {
  const style = COLOR_STYLES[color];

  return (
    <Link
      to={path}
      className={[
        "group relative block rounded-3xl border-2 p-6",
        "transition-all duration-300",
        "hover:-translate-y-1",
        style.bg,
        style.border,
        style.hover,
      ].join(" ")}
    >
      {/* Icon */}
      <div className="text-4xl mb-3">{icon}</div>

      {/* Title */}
      <div className="flex items-baseline gap-2 mb-2">
        <h3 className={["text-xl font-bold font-display", style.accent].join(" ")}>{title}</h3>
        <span className="text-sm text-surface-400">{titleJa}</span>
      </div>

      {/* Description */}
      <p className="text-sm text-surface-600">{description}</p>

      {/* Arrow indicator */}
      <div
        className={[
          "absolute top-6 right-6",
          "w-8 h-8 rounded-full",
          "flex items-center justify-center",
          "bg-white/80 text-surface-400",
          "transition-all duration-300",
          "group-hover:bg-white group-hover:text-surface-700",
          "group-hover:translate-x-1",
        ].join(" ")}
      >
        →
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOOL CARD COMPONENT (compact)
   ═══════════════════════════════════════════════════════════════════════════ */

interface ToolCardProps {
  title: string;
  description: string;
  icon: string;
  path: string;
}

function ToolCard({ title, description, icon, path }: ToolCardProps) {
  return (
    <Link
      to={path}
      className={[
        "group flex items-center gap-3 p-4 rounded-2xl",
        "bg-white border border-surface-200",
        "transition-all duration-200",
        "hover:border-surface-300 hover:shadow-soft-sm",
      ].join(" ")}
    >
      <div className="text-2xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-surface-800">{title}</div>
        <div className="text-xs text-surface-500 truncate">{description}</div>
      </div>
      <div className="text-surface-300 group-hover:text-surface-500 transition-colors">→</div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN HOME PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const DIFFICULTIES = [
  { key: "easy", ja: "はじめて", en: "Easy" },
  { key: "normal", ja: "ふつう", en: "Normal" },
  { key: "hard", ja: "つよい", en: "Hard" },
  { key: "expert", ja: "めっちゃつよい", en: "Expert" },
] as const;

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
  if (status === "pass") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "fail") return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-surface-100 text-surface-500 border-surface-200";
}

export function HomePage() {
  const heroExpression = useHeroExpression();
  const toast = useToast();
  const [difficulty, setDifficulty] = React.useState<string>("normal");
  const [uxStats, setUxStats] = React.useState(() => readCumulativeStats());
  const quickPlayUrl = `/match?mode=guest&opp=vs_nyano_ai&ai=${difficulty}&rk=v2&ui=mint`;
  const avgInvalidPerSession = uxStats.sessions > 0
    ? uxStats.total_invalid_actions / uxStats.sessions
    : null;
  const uxTargetChecks = React.useMemo(() => evaluateUxTargets(uxStats), [uxStats]);

  const refreshUxStats = React.useCallback(() => {
    setUxStats(readCumulativeStats());
  }, []);

  const copyUxSnapshot = React.useCallback(async () => {
    try {
      const snapshot = buildUxTelemetrySnapshot(uxStats);
      const markdown = formatUxTelemetrySnapshotMarkdown(snapshot);
      await writeClipboardText(markdown);
      toast.success("Snapshot copied", "Paste into docs/ux/PLAYTEST_LOG.md");
    } catch (e) {
      toast.error("Copy failed", errorMessage(e));
    }
  }, [toast, uxStats]);

  React.useEffect(() => {
    const onFocus = () => {
      refreshUxStats();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUxStats]);

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
      if (document.visibilityState === "hidden") {
        report();
      }
    };
    const onPageHide = () => {
      report();
    };

    document.addEventListener("visibilitychange", onVisibilityChange, true);
    window.addEventListener("pagehide", onPageHide, true);

    // Fallback: if user keeps Home open, still persist a value after initial render settles.
    const fallbackTimer = window.setTimeout(report, 6_000);

    return () => {
      window.clearTimeout(fallbackTimer);
      report();
      document.removeEventListener("visibilitychange", onVisibilityChange, true);
      window.removeEventListener("pagehide", onPageHide, true);
      observer.disconnect();
    };
  }, [refreshUxStats]);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* ─── Hero Section — Cinematic with background image ─────── */}
      <section className="home-hero relative overflow-hidden">
        {/* Background image layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-bg.webp')" }}
        />
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1b3a]/60 via-[#1a1b3a]/40 to-surface-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1b3a]/30 via-transparent to-[#1a1b3a]/30" />

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center">
            {/* Nyano mascot — floating animation */}
            <div className="flex justify-center mb-6">
              <div className="animate-float">
                <NyanoAvatar
                  expression={heroExpression}
                  size={120}
                  className="shadow-glow-nyano"
                />
              </div>
            </div>

            {/* Animated gradient title */}
            <h1 className="text-4xl md:text-6xl font-bold font-display mb-4 drop-shadow-lg">
              <span className="text-white" style={{ textShadow: "0 2px 16px rgba(255,138,80,0.4)" }}>
                Nyano Triad League
              </span>
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-8 max-w-xl mx-auto drop-shadow">
              NyanoNFTを使ったカードバトルゲーム。
              <br className="hidden sm:block" />
              デッキを組んで、対戦し、勝利を共有しよう。
            </p>

            {/* Difficulty selector (NIN-UX-020: friendly labels) */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDifficulty(d.key)}
                  className={[
                    "px-4 py-2.5 rounded-2xl text-sm font-bold font-display transition-all",
                    difficulty === d.key
                      ? "bg-nyano-500 text-white shadow-glow-nyano scale-105"
                      : "bg-white/15 text-white/90 backdrop-blur-sm border border-white/20 hover:bg-white/25",
                  ].join(" ")}
                >
                  {d.ja}
                  <span className="ml-1 text-xs opacity-70">({d.en})</span>
                </button>
              ))}
            </div>

            {/* CTA — big play button (NIN-UX-020: "10 seconds to start") */}
            <div className="flex flex-col items-center gap-3">
              <Link
                to={quickPlayUrl}
                onClick={() => markQuickPlayStart()}
                className={[
                  "home-hero__cta",
                  "inline-flex items-center gap-3",
                  "px-10 py-4 rounded-3xl",
                  "text-white text-xl font-bold font-display",
                  "shadow-xl hover:shadow-2xl hover:scale-105",
                  "transition-all duration-200",
                ].join(" ")}
              >
                🎮 すぐ遊ぶ
              </Link>
              <span className="text-xs text-white/50">ゲストモードですぐに対戦できます</span>
            </div>

            {/* Secondary actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <Link to="/arena" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-all no-underline">
                ⚔️ Arena
              </Link>
              <Link to="/decks" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-all no-underline">
                🃏 Build Deck
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How to Play (3-step guide) ────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold font-display text-surface-800 text-center mb-2">
          3ステップで始めよう
        </h2>
        <p className="text-sm text-surface-400 text-center mb-8">
          10秒でゲームスタート。ウォレット不要のゲストモードも対応。
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { step: "1", icon: "🃏", title: "デッキを組む", desc: "5枚のNyanoカードを選んでデッキを作成", link: "/decks", accent: "nyano" },
            { step: "2", icon: "⚔️", title: "対戦する", desc: "AIやフレンドと3x3ボードで対戦", link: "/arena", accent: "sky" },
            { step: "3", icon: "📼", title: "共有する", desc: "リプレイを共有して配信で盛り上がる", link: "/replay", accent: "violet" },
          ].map((s) => (
            <Link
              key={s.step}
              to={s.link}
              className={[
                "group relative flex flex-col items-center text-center p-7 rounded-3xl",
                "bg-white border-2 border-surface-200",
                "shadow-sm",
                "transition-all duration-300",
                "hover:border-nyano-300 hover:shadow-md hover:-translate-y-1",
              ].join(" ")}
            >
              <div
                className="absolute -top-3 left-5 text-white text-xs font-bold w-7 h-7 rounded-xl flex items-center justify-center shadow-md"
                style={{ background: "linear-gradient(135deg, #FF8A50, #E67340)" }}
              >
                {s.step}
              </div>
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{s.icon}</div>
              <div className="font-bold font-display text-surface-800 mb-1 text-base">{s.title}</div>
              <p className="text-xs text-surface-500 leading-relaxed">{s.desc}</p>
              <div className="mt-3 text-[11px] font-semibold text-nyano-500 opacity-0 group-hover:opacity-100 transition-opacity">
                始める →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Features (always visible) ─────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.path} {...feature} />
          ))}
        </div>
      </section>

      {/* ─── Tools (Progressive Disclosure — collapsed) ─────────── */}
      <section className="max-w-5xl mx-auto px-4 py-4">
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-surface-500 hover:text-surface-700 transition-colors">
            <span className="text-sm font-medium">ツール・設定</span>
            <span className="text-xs group-open:rotate-90 transition-transform">▶</span>
          </summary>
          <div className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.path} {...tool} />
              ))}
            </div>
          </div>
        </details>
      </section>

      {/* ─── Info Section — Premium glassmorphic cards ────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Phase */}
          <div className="relative rounded-3xl border border-surface-200 bg-white overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">📍</div>
                <h3 className="text-base font-bold font-display text-surface-800">現在のフェーズ</h3>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 animate-pulse flex-shrink-0" />
                <div>
                  <div className="font-semibold text-surface-800">検証・共有フェーズ</div>
                  <p className="text-sm text-surface-500 mt-1 leading-relaxed">
                    リプレイ共有、ルール検証、コミュニティフィードバックの収集を行っています。
                    配信連携機能も実験中です。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Milestone */}
          <div className="relative rounded-3xl border border-surface-200 bg-white overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-nyano-400 via-nyano-500 to-amber-400" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-nyano-100 flex items-center justify-center text-lg">🎯</div>
                <h3 className="text-base font-bold font-display text-surface-800">次のマイルストーン</h3>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-nyano-500 mt-2 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-surface-800">運営品質のゲーム体験</div>
                  <p className="text-sm text-surface-500 mt-1 leading-relaxed">
                    デッキ構築→対戦→結果共有→ランキング化の一連フローを、
                    ハイクオリティなUIで提供します。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Settings ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-4">
        <details className="text-sm text-surface-600">
          <summary className="cursor-pointer text-xs font-medium text-surface-500">Settings</summary>
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              className="btn text-xs"
              onClick={() => {
                resetTutorialSeen();
                toast.success("Tutorial reset", "The tutorial will appear on your next guest match.");
              }}
            >
              Reset Tutorial
            </button>
            <button
              className="btn text-xs"
              onClick={() => {
                clearGameIndexCache();
                toast.success("Cache cleared", "Game index cache has been cleared. Card data will be re-fetched on next load.");
              }}
            >
              Reset Game Cache
            </button>
          </div>
          <div className="mt-4 rounded-2xl border border-surface-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-surface-700">UX Telemetry (Local)</div>
                <div className="text-[11px] text-surface-500">
                  このブラウザ内のみ保存。配信前のプレイテスト計測に使えます。
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn text-xs" onClick={refreshUxStats}>
                  Refresh Metrics
                </button>
                <button className="btn text-xs" onClick={copyUxSnapshot}>
                  Copy Snapshot
                </button>
                <button
                  className="btn text-xs"
                  onClick={() => {
                    clearCumulativeStats();
                    refreshUxStats();
                    toast.success("Telemetry reset", "Local UX metrics have been cleared.");
                  }}
                >
                  Reset Metrics
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2">
                <div className="text-[11px] text-surface-500">Sessions</div>
                <div className="text-sm font-semibold text-surface-800">{uxStats.sessions}</div>
              </div>
              <div className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2">
                <div className="text-[11px] text-surface-500">Avg first interaction</div>
                <div className="text-sm font-semibold text-surface-800">
                  {formatSecondsFromMs(uxStats.avg_first_interaction_ms)}
                </div>
              </div>
              <div className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2">
                <div className="text-[11px] text-surface-500">Avg first place</div>
                <div className="text-sm font-semibold text-surface-800">
                  {formatSecondsFromMs(uxStats.avg_first_place_ms)}
                </div>
              </div>
              <div className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2">
                <div className="text-[11px] text-surface-500">Avg quick-play to first place</div>
                <div className="text-sm font-semibold text-surface-800">
                  {formatSecondsFromMs(uxStats.avg_quickplay_to_first_place_ms)}
                </div>
              </div>
              <div className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2">
                <div className="text-[11px] text-surface-500">Avg Home LCP</div>
                <div className="text-sm font-semibold text-surface-800">
                  {formatSecondsFromMs(uxStats.avg_home_lcp_ms)}
                </div>
              </div>
              <div className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2">
                <div className="text-[11px] text-surface-500">Invalid / session</div>
                <div className="text-sm font-semibold text-surface-800">
                  {avgInvalidPerSession === null ? "--" : avgInvalidPerSession.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-surface-200 bg-surface-50 p-3">
              <div className="text-xs font-semibold text-surface-700">UX Target Snapshot</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {uxTargetChecks.map((check) => (
                  <div key={check.id} className="rounded-xl border border-surface-200 bg-white px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-surface-700">
                        {check.id} · {check.label}
                      </div>
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                          targetStatusClass(check.status),
                        ].join(" ")}
                      >
                        {targetStatusLabel(check.status)}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-surface-500">target {check.target}</div>
                    <div className="text-xs font-semibold text-surface-800">current {check.valueText}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>
      </section>

      {/* ─── Footer hint ──────────────────────────────────────────── */}
      <footer className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-xs text-surface-400">
          Nyano Triad League is part of the Nyano ecosystem.
        </p>
      </footer>
    </div>
  );
}
