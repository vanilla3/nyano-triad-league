import React from "react";
import type { ComboEffectName, PlayerIndex } from "@nyano/triad-engine";
import { NyanoAvatar } from "./NyanoAvatar";
import { reactionToExpression, type ReactionKind } from "@/lib/expression_map";
import type { AiReasonCode } from "@/lib/ai/nyano_ai";
import { pickDialogue, pickReasonDialogue, detectLanguage, type DialogueLanguage } from "@/lib/nyano_dialogue";

/* ═══════════════════════════════════════════════════════════════════════════
   NyanoReaction.tsx

   ゲームイベントに応じた Nyano のリアクション表示。
   NyanoAvatar で表情画像を表示し、glow / badge / ひとこと吹き出しで装飾。

   RM03-010: Dialogue system integration (JP/EN)
   RM03-011: Emotion continuity (expression smoothing)
   RM04-030: AI reason → dialogue connection
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Reaction Visual Config ── */

interface ReactionConfig {
  emoji: string;
  glow: string;
  badge: string;
}

const REACTIONS: Record<ReactionKind, ReactionConfig> = {
  idle:               { emoji: "🐱", glow: "rgba(255,138,80,0.2)",  badge: "" },
  flip_single:        { emoji: "😼", glow: "rgba(245,166,35,0.4)",  badge: "⚔" },
  flip_multi:         { emoji: "😸", glow: "rgba(245,166,35,0.5)",  badge: "⚔⚔" },
  chain:              { emoji: "🙀", glow: "rgba(155,89,255,0.5)",  badge: "✦" },
  fever:              { emoji: "😻", glow: "rgba(255,69,0,0.6)",    badge: "🔥" },
  momentum:           { emoji: "😼", glow: "rgba(56,161,232,0.4)",  badge: "⚡" },
  domination:         { emoji: "😸", glow: "rgba(232,70,106,0.5)",  badge: "👑" },
  warning_triggered:  { emoji: "😿", glow: "rgba(239,68,68,0.4)",   badge: "⚠" },
  advantage:          { emoji: "😸", glow: "rgba(16,185,129,0.4)",  badge: "✨" },
  disadvantage:       { emoji: "😿", glow: "rgba(99,102,241,0.3)",  badge: "💧" },
  draw_state:         { emoji: "🐱", glow: "rgba(168,162,158,0.3)", badge: "⚖" },
  victory:            { emoji: "😻", glow: "rgba(16,185,129,0.6)",  badge: "🏆" },
  defeat:             { emoji: "😿", glow: "rgba(239,68,68,0.4)",   badge: "💔" },
  game_draw:          { emoji: "🐱", glow: "rgba(168,162,158,0.4)", badge: "🤝" },
};

/* ── Emotion Continuity (RM03-011) ── */

// Similar emotional state groups — don't flicker between these
const EMOTION_GROUPS: ReactionKind[][] = [
  ["advantage", "momentum", "domination"],
  ["disadvantage", "warning_triggered"],
  ["idle", "draw_state"],
];

// Game-ending states always override immediately
const PRIORITY_STATES: Set<ReactionKind> = new Set([
  "victory", "defeat", "game_draw", "fever", "chain",
]);

const MIN_HOLD_MS = 2000;

function shouldSmooth(current: ReactionKind, prev: ReactionKind): boolean {
  if (PRIORITY_STATES.has(current)) return false;
  if (current === prev) return false;
  for (const group of EMOTION_GROUPS) {
    if (group.includes(current) && group.includes(prev)) return true;
  }
  return false;
}

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

export function pickReactionKind(input: NyanoReactionInput): ReactionKind {
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

  // Neutral perspective: avoid "ピンチ" / "優勢" bias.
  // Use absolute diff for a simple "someone is leading" feel.
  if (input.perspective === null) {
    const abs = Math.abs(diff);
    if (abs >= 2) return "advantage";
    if (input.tilesA > 0 && input.tilesA === input.tilesB) return "draw_state";
    return "idle";
  }

  const perspectiveDiff = input.perspective === 1 ? -diff : diff;

  if (perspectiveDiff >= 2) return "advantage";
  if (perspectiveDiff <= -2) return "disadvantage";
  if (input.tilesA > 0 && input.tilesA === input.tilesB) return "draw_state";

  return "idle";
}

/* ── Component ── */

export interface NyanoReactionProps {
  input: NyanoReactionInput;
  /** Turn index used for pseudo-random line selection */
  turnIndex?: number;
  /** RPG mode styling */
  rpg?: boolean;
  /** Display language for dialogue */
  lang?: DialogueLanguage;
  /** AI reason code for reason-aware dialogue (RM04-030) */
  aiReasonCode?: AiReasonCode;
  className?: string;
}

export function NyanoReaction({
  input,
  turnIndex = 0,
  rpg = false,
  lang,
  aiReasonCode,
  className = "",
}: NyanoReactionProps) {
  const rawKind = pickReactionKind(input);
  const detectedLang = React.useMemo(() => lang ?? detectLanguage(), [lang]);

  // Emotion continuity: smooth rapid transitions between similar states
  const prevKindRef = React.useRef<ReactionKind>("idle");
  const lastChangeRef = React.useRef<number>(0);

  const kind = React.useMemo(() => {
    const now = Date.now();
    const elapsed = now - lastChangeRef.current;

    if (shouldSmooth(rawKind, prevKindRef.current) && elapsed < MIN_HOLD_MS) {
      return prevKindRef.current;
    }

    if (rawKind !== prevKindRef.current) {
      prevKindRef.current = rawKind;
      lastChangeRef.current = now;
    }
    return rawKind;
  }, [rawKind]);

  const cfg = REACTIONS[kind];

  // Pick dialogue: AI reason dialogue takes priority if available
  const line = React.useMemo(() => {
    if (aiReasonCode) {
      const reasonLine = pickReasonDialogue(aiReasonCode, turnIndex, detectedLang);
      if (reasonLine) return reasonLine;
    }
    return pickDialogue(kind, turnIndex, detectedLang);
  }, [kind, turnIndex, detectedLang, aiReasonCode]);

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
        <NyanoAvatar size={32} expression={reactionToExpression(kind)} alt={cfg.emoji} />
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
      <NyanoAvatar size={28} expression={reactionToExpression(kind)} alt={cfg.emoji} />
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

export function NyanoReactionBadge({ input, turnIndex: _turnIndex = 0 }: { input: NyanoReactionInput; turnIndex?: number }) {
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
      <NyanoAvatar size={16} expression={reactionToExpression(kind)} alt={cfg.emoji} /> {cfg.badge}
    </span>
  );
}
