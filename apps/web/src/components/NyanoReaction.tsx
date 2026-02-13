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

export type CutInImpact = "low" | "mid" | "high";

// eslint-disable-next-line react-refresh/only-export-components -- shared utility is consumed by pages/components
export function resolveReactionCutInImpact(kind: ReactionKind, aiReasonCode?: AiReasonCode): CutInImpact {
  if (
    kind === "fever"
    || kind === "chain"
    || kind === "domination"
    || kind === "victory"
    || kind === "defeat"
    || kind === "game_draw"
  ) {
    return "high";
  }
  if (
    kind === "warning_triggered"
    || kind === "flip_multi"
    || kind === "momentum"
    || kind === "advantage"
    || kind === "disadvantage"
    || aiReasonCode === "MINIMAX_D3"
    || aiReasonCode === "SET_WARNING"
  ) {
    return "mid";
  }
  return "low";
}

function cutInDurationsForImpact(impact: CutInImpact): { burstMs: number; visibleMs: number } {
  if (impact === "high") return { burstMs: 860, visibleMs: 3600 };
  if (impact === "mid") return { burstMs: 700, visibleMs: 3300 };
  return { burstMs: 560, visibleMs: 3000 };
}

function burstLabelForKind(kind: ReactionKind): string {
  switch (kind) {
    case "victory":
      return "VICTORY BURST";
    case "defeat":
      return "LAST STAND";
    case "game_draw":
      return "FINAL CLASH";
    case "fever":
      return "FEVER BURST";
    case "chain":
      return "CHAIN DRIVE";
    case "domination":
      return "DOMINATION";
    default:
      return "NYANO BURST";
  }
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

// eslint-disable-next-line react-refresh/only-export-components -- utility fn export alongside component is intentional
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
  /** Mint mode styling (Nintendo-level soft UI) */
  mint?: boolean;
  /** Mint tone variant */
  tone?: "mint" | "pixi";
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
  mint = false,
  tone = "mint",
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
  const pixiTone = mint && tone === "pixi";
  const cutInImpact = React.useMemo(() => resolveReactionCutInImpact(kind, aiReasonCode), [kind, aiReasonCode]);
  const cutInTiming = React.useMemo(() => cutInDurationsForImpact(cutInImpact), [cutInImpact]);
  const burstLabel = React.useMemo(() => burstLabelForKind(kind), [kind]);

  // Pick dialogue: AI reason dialogue takes priority if available
  const line = React.useMemo(() => {
    if (aiReasonCode) {
      const reasonLine = pickReasonDialogue(aiReasonCode, turnIndex, detectedLang);
      if (reasonLine) return reasonLine;
    }
    return pickDialogue(kind, turnIndex, detectedLang);
  }, [kind, turnIndex, detectedLang, aiReasonCode]);

  const [visible, setVisible] = React.useState(false);
  const [cutInBurst, setCutInBurst] = React.useState(false);

  React.useEffect(() => {
    setVisible(true);
    setCutInBurst(true);
    const burstTimer = setTimeout(() => setCutInBurst(false), cutInTiming.burstMs);
    const visibleTimer = setTimeout(() => setVisible(false), cutInTiming.visibleMs);
    return () => {
      clearTimeout(burstTimer);
      clearTimeout(visibleTimer);
    };
  }, [turnIndex, kind, cutInTiming.burstMs, cutInTiming.visibleMs]);

  if (kind === "idle" && !input.finished) return null;

  if (rpg) {
    return (
      <div
        className={`rpg-nyano-reaction ${className}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 16px",
          borderRadius: 10,
          background: "rgba(0,0,0,0.5)",
          border: `1px solid ${cfg.glow}`,
          boxShadow: `0 0 12px ${cfg.glow}`,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.3s, transform 0.3s",
          fontFamily: "'Nunito', system-ui, sans-serif",
        }}
      >
        <NyanoAvatar size={40} expression={reactionToExpression(kind)} alt={cfg.emoji} />
        {cfg.badge && (
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 6,
            background: cfg.glow,
            color: "white",
          }}>
            {cfg.badge}
          </span>
        )}
        <span style={{
          fontSize: 16,
          color: "#F5F0E1",
          fontWeight: 700,
          lineHeight: 1.25,
        }}>
          {line}
        </span>
      </div>
    );
  }

  // Mint (Nintendo-soft) style — frosted white, rounded, accent glow
  if (mint) {
    const reactionStyle = {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 18px",
      borderRadius: 20,
      background: pixiTone
        ? "linear-gradient(145deg, rgba(8,21,40,0.88), rgba(5,13,28,0.84))"
        : "rgba(255,255,255,0.85)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      border: pixiTone
        ? "1px solid rgba(56, 189, 248, 0.35)"
        : "1px solid var(--mint-accent-muted, #A7F3D0)",
      boxShadow: pixiTone
        ? `0 10px 28px rgba(2, 6, 23, 0.45), 0 0 0 1px rgba(56, 189, 248, 0.12), 0 0 16px ${cfg.glow}`
        : `0 2px 12px ${cfg.glow}, 0 0 0 1px rgba(16,185,129,0.08)`,
      fontFamily: "'Nunito', system-ui, sans-serif",
      ["--nyano-reaction-glow" as const]: cfg.glow,
    } satisfies React.CSSProperties & Record<"--nyano-reaction-glow", string>;

    return (
      <div
        className={[
          "mint-nyano-reaction",
          "mint-nyano-reaction--cutin",
          `mint-nyano-reaction--impact-${cutInImpact}`,
          cutInImpact === "high" ? "mint-nyano-reaction--braveburst" : "",
          pixiTone ? "mint-nyano-reaction--pixi" : "",
          visible ? "mint-nyano-reaction--visible" : "mint-nyano-reaction--hidden",
          cutInBurst ? "mint-nyano-reaction--burst" : "",
          className,
        ].filter(Boolean).join(" ")}
        style={reactionStyle}
      >
        <span className="mint-nyano-reaction__cutin-flash" aria-hidden="true" />
        <span className="mint-nyano-reaction__scanline" aria-hidden="true" />
        {cutInImpact === "high" && (
          <div className="mint-nyano-reaction__burst-banner" aria-hidden="true">
            <span className="mint-nyano-reaction__burst-main">{burstLabel}</span>
            <span className="mint-nyano-reaction__burst-sub">{cfg.badge || "PIKA"}</span>
          </div>
        )}
        <div className="mint-nyano-reaction__inner">
          <NyanoAvatar size={44} expression={reactionToExpression(kind)} alt={cfg.emoji} />
          {cfg.badge && (
            <span
              className={`mint-nyano-reaction__badge mint-nyano-reaction__badge--${cutInImpact}`}
              style={{
                background: `linear-gradient(135deg, ${cfg.glow}, transparent)`,
                border: `1px solid ${cfg.glow}`,
                color: pixiTone ? "#E2E8F0" : "var(--mint-text-primary, #1F2937)",
              }}
            >
              {cfg.badge}
            </span>
          )}
          <span
            className={`mint-nyano-reaction__line mint-nyano-reaction__line--${cutInImpact}`}
            style={{ color: pixiTone ? "#F8FAFC" : "var(--mint-text-primary, #1F2937)" }}
          >
            {line}
          </span>
          {aiReasonCode && (
            <span
              className="mint-nyano-reaction__reason"
              style={{
                background: pixiTone ? "rgba(56, 189, 248, 0.16)" : "var(--mint-accent-muted, #A7F3D0)",
                color: pixiTone ? "#BAE6FD" : "var(--mint-text-accent, #059669)",
              }}
            >
              {aiReasonCode}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default (non-RPG, non-Mint) style
  return (
    <div
      className={[
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-base transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className,
      ].join(" ")}
      style={{
        background: `linear-gradient(135deg, ${cfg.glow}, transparent)`,
        border: `1px solid ${cfg.glow}`,
      }}
    >
      <NyanoAvatar size={34} expression={reactionToExpression(kind)} alt={cfg.emoji} />
      {cfg.badge && (
        <span
          className="rounded px-2 py-0.5 text-sm font-bold text-white"
          style={{ background: cfg.glow }}
        >
          {cfg.badge}
        </span>
      )}
      <span className="font-semibold leading-tight text-slate-800">{line}</span>
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
