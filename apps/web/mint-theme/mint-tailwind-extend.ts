/**
 * Nyano Triad League — Mint Theme Tailwind Extensions
 *
 * Merge these into your existing tailwind.config.ts `theme.extend`.
 * Example:
 *   import { mintColors, mintAnimations, mintKeyframes } from './mint-theme/mint-tailwind-extend';
 *   // then spread into theme.extend.colors, theme.extend.animation, theme.extend.keyframes
 */

export const mintColors = {
  mint: {
    // Surface
    bg: "#F0FAF5",
    surface: "#FFFFFF",
    "surface-dim": "#E6F5EE",

    // Accent
    accent: {
      DEFAULT: "#10B981",
      light: "#34D399",
      dark: "#059669",
      muted: "#A7F3D0",
    },

    // Cell states
    cell: {
      active: "#A7F3D0",
      "active-glow": "rgba(52, 211, 153, 0.35)",
      flat: "#E5E7EB",
      "flat-dark": "#D1D5DB",
      selected: "rgba(16, 185, 129, 0.5)",
    },

    // Text
    text: {
      primary: "#1F2937",
      secondary: "#4B5563",
      hint: "#9CA3AF",
      accent: "#059669",
    },

    // Feedback
    error: "#F87171",
    "error-bg": "rgba(248, 113, 113, 0.1)",
    warning: "#FBBF24",
    "warning-bg": "rgba(251, 191, 36, 0.15)",

    // Prompt bar
    prompt: {
      bg: "rgba(240, 250, 245, 0.95)",
      border: "rgba(167, 243, 208, 0.6)",
    },
  },
};

export const mintAnimations = {
  "mint-breathe": "mint-breathe 2.5s ease-in-out infinite",
  "mint-glow-pulse": "mint-glow-pulse 2s ease-in-out infinite",
  "mint-pop-in": "mint-pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
  "mint-error-shake": "mint-error-shake 0.4s ease-in-out",
  "mint-slide-up": "mint-slide-up 0.3s ease-out",
  "mint-fade-in": "mint-fade-in 0.25s ease-out",
  "mint-cell-place": "mint-cell-place 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
  "mint-cell-flip": "mint-cell-flip 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
  "mint-card-lift": "mint-card-lift 0.2s ease-out forwards",
  "mint-score-bump": "mint-score-bump 0.35s ease-out",
};

export const mintKeyframes = {
  "mint-breathe": {
    "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(52, 211, 153, 0)" },
    "50%": { transform: "scale(1.02)", boxShadow: "0 0 12px 2px rgba(52, 211, 153, 0.25)" },
  },
  "mint-glow-pulse": {
    "0%, 100%": { boxShadow: "0 0 8px rgba(16, 185, 129, 0.3)" },
    "50%": { boxShadow: "0 0 20px rgba(16, 185, 129, 0.5)" },
  },
  "mint-pop-in": {
    "0%": { transform: "scale(0.7)", opacity: "0" },
    "70%": { transform: "scale(1.05)", opacity: "1" },
    "100%": { transform: "scale(1)" },
  },
  "mint-error-shake": {
    "0%, 100%": { transform: "translateX(0)" },
    "20%, 60%": { transform: "translateX(-3px)" },
    "40%, 80%": { transform: "translateX(3px)" },
  },
  "mint-slide-up": {
    "0%": { opacity: "0", transform: "translateY(8px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
  "mint-fade-in": {
    "0%": { opacity: "0" },
    "100%": { opacity: "1" },
  },
  "mint-cell-place": {
    "0%": { transform: "scale(0.8)", opacity: "0" },
    "60%": { transform: "scale(1.06)", opacity: "1" },
    "100%": { transform: "scale(1)" },
  },
  "mint-cell-flip": {
    "0%": { transform: "rotateY(0deg) scale(1)" },
    "40%": { transform: "rotateY(90deg) scale(1.04)" },
    "70%": { transform: "rotateY(180deg) scale(1.02)" },
    "100%": { transform: "rotateY(360deg) scale(1)" },
  },
  "mint-card-lift": {
    "0%": { transform: "translateY(0)" },
    "100%": { transform: "translateY(-6px)" },
  },
  "mint-score-bump": {
    "0%, 100%": { transform: "scale(1)" },
    "50%": { transform: "scale(1.12)" },
  },
};
