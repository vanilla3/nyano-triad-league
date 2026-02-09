import React from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/Toast";
import { NyanoAvatar } from "@/components/NyanoAvatar";
import { resetTutorialSeen } from "@/components/MiniTutorial";
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

const DIFFICULTIES = ["easy", "normal", "hard", "expert"] as const;

export function HomePage() {
  const heroExpression = useHeroExpression();
  const toast = useToast();
  const [difficulty, setDifficulty] = React.useState<string>("normal");
  const quickPlayUrl = `/match?mode=guest&opp=vs_nyano_ai&ai=${difficulty}&rk=v2`;

  return (
    <div className="min-h-screen bg-surface-50">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-nyano-100/30 via-transparent to-player-a-100/20 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-nyano-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-player-a-200/20 rounded-full blur-3xl pointer-events-none" />

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
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-3">
              <span className="text-gradient-animated">Nyano Triad League</span>
            </h1>
            <p className="text-lg text-surface-600 mb-8 max-w-xl mx-auto">
              NyanoNFTを使ったカードバトルゲーム。
              <br className="hidden sm:block" />
              デッキを組んで、対戦し、勝利を共有しよう。
            </p>

            {/* Difficulty selector */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-sm text-surface-500">Difficulty:</span>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={[
                    "px-3 py-1 rounded-full text-sm font-medium transition-all",
                    difficulty === d
                      ? "bg-nyano-500 text-white shadow-glow-nyano"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200",
                  ].join(" ")}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to={quickPlayUrl}
                className="btn btn-primary btn-lg"
              >
                🎮 Quick Play
              </Link>
              <Link to="/arena" className="btn btn-secondary btn-lg">
                ⚔️ Arena
              </Link>
              <Link to="/decks" className="btn btn-secondary btn-lg">
                🃏 Build Deck
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-stagger">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.path} {...feature} />
          ))}
        </div>
      </section>

      {/* ─── Tools Section ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold font-display text-surface-700">Tools</h2>
          <p className="text-sm text-surface-500">検証・設定用のツール</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-stagger">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.path} {...tool} />
          ))}
        </div>
      </section>

      {/* ─── Info Section ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Phase */}
          <div className="card">
            <div className="card-hd">
              <h3 className="text-base font-bold font-display text-surface-800">
                📍 現在のフェーズ
              </h3>
            </div>
            <div className="card-bd">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 animate-pulse" />
                <div>
                  <div className="font-semibold text-surface-800">検証・共有フェーズ</div>
                  <p className="text-sm text-surface-600 mt-1">
                    リプレイ共有、ルール検証、コミュニティフィードバックの収集を行っています。
                    配信連携機能も実験中です。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Milestone */}
          <div className="card">
            <div className="card-hd">
              <h3 className="text-base font-bold font-display text-surface-800">
                🎯 次のマイルストーン
              </h3>
            </div>
            <div className="card-bd">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-nyano-500 mt-2" />
                <div>
                  <div className="font-semibold text-surface-800">運営品質のゲーム体験</div>
                  <p className="text-sm text-surface-600 mt-1">
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
