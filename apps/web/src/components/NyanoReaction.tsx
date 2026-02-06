import React from "react";
import type { ComboEffectName, PlayerIndex } from "@nyano/triad-engine";

/* ═══════════════════════════════════════════════════════════════════════════
   NyanoReaction.tsx

   ゲームイベントに応じた Nyano のリアクション表示。
   表情差分なしでも glow / badge / ひとこと吹き出しで成立させる。

   commit-0068: P1-2 対応
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Reaction Data ── */

type ReactionKind =
  | "idle"
  | "flip_single"
  | "flip_multi"
  | "chain"
  | "fever"
  | "momentum"
  | "domination"
  | "warning_triggered"
  | "advantage"
  | "disadvantage"
  | "draw_state"
  | "victory"
  | "defeat"
  | "game_draw";

interface ReactionConfig {
  emoji: string;
  glow: string;
  badge: string;
  lines: string[];
}

const REACTIONS: Record<ReactionKind, ReactionConfig> = {
  idle: {
    emoji: "🐱",
    glow: "rgba(255,138,80,0.2)",
    badge: "",
    lines: ["にゃ〜ん", "さぁ、勝負だにゃ！", "…考え中にゃ"],
  },
  flip_single: {
    emoji: "😼",
    glow: "rgba(245,166,35,0.4)",
    badge: "⚔",
    lines: ["1枚ゲットにゃ！", "奪ったにゃ！", "もらったにゃ♪"],
  },
  flip_multi: {
    emoji: "😸",
    glow: "rgba(245,166,35,0.5)",
    badge: "⚔⚔",
    lines: ["まとめて奪取にゃ！", "ごっそりにゃ！", "すごいにゃ！"],
  },
  chain: {
    emoji: "🙀",
    glow: "rgba(155,89,255,0.5)",
    badge: "✦",
    lines: ["連鎖にゃ！！", "チェーンきたにゃ！", "つながったにゃ！"],
  },
  fever: {
    emoji: "😻",
    glow: "rgba(255,69,0,0.6)",
    badge: "🔥",
    lines: ["フィーバーにゃー！！", "止まらないにゃ！", "全開にゃ！！"],
  },
  momentum: {
    emoji: "😼",
    glow: "rgba(56,161,232,0.4)",
    badge: "⚡",
    lines: ["勢いに乗ってきたにゃ！", "モメンタムにゃ！"],
  },
  domination: {
    emoji: "😸",
    glow: "rgba(232,70,106,0.5)",
    badge: "👑",
    lines: ["圧倒的にゃ！", "ドミネーションにゃ！"],
  },
  warning_triggered: {
    emoji: "😿",
    glow: "rgba(239,68,68,0.4)",
    badge: "⚠",
    lines: ["罠にかかったにゃ…", "警戒マーク踏んだにゃ…", "にゃっ！？"],
  },
  advantage: {
    emoji: "😸",
    glow: "rgba(16,185,129,0.4)",
    badge: "✨",
    lines: ["リードにゃ！", "いい調子にゃ♪", "優勢にゃ！"],
  },
  disadvantage: {
    emoji: "😿",
    glow: "rgba(99,102,241,0.3)",
    badge: "💧",
    lines: ["ピンチにゃ…", "巻き返すにゃ！", "まだまだにゃ…"],
  },
  draw_state: {
    emoji: "🐱",
    glow: "rgba(168,162,158,0.3)",
    badge: "⚖",
    lines: ["互角にゃ…", "いい勝負にゃ！", "どっちが勝つにゃ？"],
  },
  victory: {
    emoji: "😻",
    glow: "rgba(16,185,129,0.6)",
    badge: "🏆",
    lines: ["勝ったにゃー！！", "やったにゃ！", "にゃんと！勝利にゃ！"],
  },
  defeat: {
    emoji: "😿",
    glow: "rgba(239,68,68,0.4)",
    badge: "💔",
    lines: ["負けたにゃ…", "次は勝つにゃ！", "くやしいにゃ…"],
  },
  game_draw: {
    emoji: "🐱",
    glow: "rgba(168,162,158,0.4)",
    badge: "🤝",
    lines: ["引き分けにゃ！", "いい勝負だったにゃ！"],
  },
};

/* ── Determine Reaction Kind ── */

export interface NyanoReactionInput {
  /** Last turn's flip count */
  flipCount: number;
  /** Whether any flip was a chain */
  hasChain: boolean;
  /** Combo effect of last turn */
  comboEffect: ComboEffectName;
  /** Whether warning mark was triggered */
  warningTriggered: boolean;
  /** Current tile scores */
  tilesA: number;
  tilesB: number;
  /** Which player perspective Nyano is representing (0=A, null=neutral) */
  perspective: PlayerIndex | null;
  /** Is the game finished */
  finished: boolean;
  /** Winner if finished */
  winner?: PlayerIndex | "draw" | null;
}

function pickReactionKind(input: NyanoReactionInput): ReactionKind {
  // Game end states take priority
  if (input.finished && input.winner != null) {
    if (input.winner === "draw") return "game_draw";
    if (input.perspective !== null) {
      return input.winner === input.perspective ? "victory" : "defeat";
    }
    return "victory"; // neutral = celebrate winner
  }

  // Combo effects
  if (input.comboEffect === "fever") return "fever";
  if (input.comboEffect === "domination") return "domination";
  if (input.comboEffect === "momentum") return "momentum";

  // Warning triggered
  if (input.warningTriggered) return "warning_triggered";

  // Chain flips
  if (input.hasChain) return "chain";

  // Multi-flip
  if (input.flipCount >= 2) return "flip_multi";
  if (input.flipCount === 1) return "flip_single";

  // Score-based reactions
  const diff = input.tilesA - input.tilesB;
  const perspectiveDiff = input.perspective === 1 ? -diff : diff;

  if (perspectiveDiff >= 2) return "advantage";
  if (perspectiveDiff <= -2) return "disadvantage";
  if (input.tilesA > 0 && input.tilesA === input.tilesB) return "draw_state";

  return "idle";
}

function pickLine(lines: string[], seed: number): string {
  return lines[seed % lines.length];
}

/* ── Component ── */

export interface NyanoReactionProps {
  input: NyanoReactionInput;
  /** Turn index used for pseudo-random line selection */
  turnIndex?: number;
  /** RPG mode styling */
  rpg?: boolean;
  className?: string;
}

export function NyanoReaction({ input, turnIndex = 0, rpg = false, className = "" }: NyanoReactionProps) {
  const kind = pickReactionKind(input);
  const cfg = REACTIONS[kind];
  const line = pickLine(cfg.lines, turnIndex);

  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(t);
  }, [turnIndex, kind]);

  if (kind === "idle" && !input.finished) return null;

  if (rpg) {
    return (
      <div
        className={`rpg-nyano-reaction ${className}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          borderRadius: 8,
          background: "rgba(0,0,0,0.5)",
          border: `1px solid ${cfg.glow}`,
          boxShadow: `0 0 12px ${cfg.glow}`,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.3s, transform 0.3s",
          fontFamily: "'Nunito', system-ui, sans-serif",
        }}
      >
        <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
        {cfg.badge && (
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: 4,
            background: cfg.glow,
            color: "white",
          }}>
            {cfg.badge}
          </span>
        )}
        <span style={{
          fontSize: 12,
          color: "#F5F0E1",
          fontWeight: 600,
        }}>
          {line}
        </span>
      </div>
    );
  }

  // Default (non-RPG) style
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className,
      ].join(" ")}
      style={{
        background: `linear-gradient(135deg, ${cfg.glow}, transparent)`,
        border: `1px solid ${cfg.glow}`,
      }}
    >
      <span className="text-lg">{cfg.emoji}</span>
      {cfg.badge && (
        <span
          className="rounded px-1.5 py-0.5 text-xs font-bold text-white"
          style={{ background: cfg.glow }}
        >
          {cfg.badge}
        </span>
      )}
      <span className="font-semibold text-slate-800">{line}</span>
    </div>
  );
}

/* ── Badge-only variant (compact, for overlay / inline) ── */

export function NyanoReactionBadge({ input, turnIndex = 0 }: { input: NyanoReactionInput; turnIndex?: number }) {
  const kind = pickReactionKind(input);
  const cfg = REACTIONS[kind];

  if (kind === "idle") return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        background: cfg.glow,
        color: "white",
        boxShadow: `0 0 6px ${cfg.glow}`,
      }}
    >
      {cfg.emoji} {cfg.badge}
    </span>
  );
}
