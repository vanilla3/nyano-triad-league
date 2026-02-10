/**
 * cardConstants.ts
 *
 * Shared card display constants extracted from CardNyano.tsx
 * to satisfy react-refresh/only-export-components rule.
 */
import type { TraitType } from "@nyano/triad-engine";

export const JANKEN_ICONS: Record<0 | 1 | 2, { emoji: string; label: string; color: string }> = {
  0: { emoji: "✊", label: "Rock", color: "text-amber-600" },
  1: { emoji: "✋", label: "Paper", color: "text-emerald-600" },
  2: { emoji: "✌️", label: "Scissors", color: "text-violet-600" },
};

export const TRAIT_STYLES: Record<TraitType, { bg: string; text: string; border: string; icon: string }> = {
  none: { bg: "bg-surface-100", text: "text-surface-500", border: "border-surface-200", icon: "—" },
  cosmic: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", icon: "✦" },
  light: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: "☀" },
  shadow: { bg: "bg-slate-800", text: "text-slate-100", border: "border-slate-600", icon: "☾" },
  forest: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: "🌿" },
  metal: { bg: "bg-zinc-200", text: "text-zinc-700", border: "border-zinc-300", icon: "⚙" },
  flame: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: "🔥" },
  aqua: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200", icon: "💧" },
  thunder: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", icon: "⚡" },
  wind: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", icon: "🍃" },
  earth: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", icon: "🪨" },
};

export const OWNER_STYLES = {
  0: {
    border: "border-player-a-400",
    bg: "bg-player-a-50",
    glow: "shadow-glow-a",
    accent: "text-player-a-600",
    label: "A",
  },
  1: {
    border: "border-player-b-400",
    bg: "bg-player-b-50",
    glow: "shadow-glow-b",
    accent: "text-player-b-600",
    label: "B",
  },
};
