/**
 * Nyano Triad League — RPG Theme Tailwind Extensions
 * 
 * Merge these into your existing tailwind.config.ts `theme.extend`.
 * Example:
 *   import { rpgColors, rpgAnimations, rpgKeyframes } from './rpg-tailwind-extend';
 *   // then spread into theme.extend.colors, etc.
 */

export const rpgColors = {
  rpg: {
    // Frame & Board
    frame: {
      dark: "#3D2B1F",
      mid: "#5C3D2E",
      light: "#8B6914",
      gold: "#C9A84C",
      "gold-bright": "#E8D48B",
    },
    board: "#2A1F14",

    // Cell stone
    stone: {
      DEFAULT: "#C4B59B",
      dark: "#A99E85",
      light: "#D4C8AF",
      border: "#8B7B5E",
    },

    // Text
    text: {
      gold: "#E8D48B",
      light: "#F5F0E1",
      dim: "#8A7E6B",
    },

    // HP
    hp: {
      DEFAULT: "#E84646",
      bg: "#3D1A1A",
    },
  },
};

export const rpgFontFamily = {
  cinzel: [
    "Cinzel",
    "Playfair Display",
    "Times New Roman",
    "serif",
  ],
};

export const rpgAnimations = {
  "rpg-flicker": "rpg-flicker 1.5s ease-in-out infinite alternate",
  "rpg-pulse": "rpg-pulse 1.5s ease-in-out infinite",
  "rpg-cell-pop": "rpg-cell-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
  "rpg-cell-flip": "rpg-cell-flip 0.55s cubic-bezier(0.4, 0, 0.2, 1) forwards",
  "rpg-border-glow": "rpg-border-glow 4s ease-in-out infinite",
  "rpg-fade-in-up": "rpg-fade-in-up 0.3s ease-out",
  "rpg-fade-in": "rpg-fade-in 0.5s ease",
  "rpg-scale-in": "rpg-scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
  "rpg-slide-down": "rpg-slide-down 0.4s ease-out",
  "rpg-score-bump": "rpg-score-bump 0.3s ease-out",
};

export const rpgKeyframes = {
  "rpg-flicker": {
    "0%, 100%": { transform: "scaleY(1) scaleX(1)", opacity: "1" },
    "25%": { transform: "scaleY(1.08) scaleX(0.96)", opacity: "0.92" },
    "50%": { transform: "scaleY(0.94) scaleX(1.04)", opacity: "0.88" },
    "75%": { transform: "scaleY(1.06) scaleX(0.98)", opacity: "0.95" },
  },
  "rpg-pulse": {
    "0%, 100%": { opacity: "1" },
    "50%": { opacity: "0.65" },
  },
  "rpg-cell-pop": {
    "0%": { transform: "scale(0.6)", opacity: "0" },
    "60%": { transform: "scale(1.08)", opacity: "1" },
    "100%": { transform: "scale(1)" },
  },
  "rpg-cell-flip": {
    "0%": { transform: "rotateY(0deg) scale(1)" },
    "40%": { transform: "rotateY(90deg) scale(1.06)" },
    "70%": { transform: "rotateY(180deg) scale(1.03)" },
    "100%": { transform: "rotateY(360deg) scale(1)" },
  },
  "rpg-border-glow": {
    "0%, 100%": { boxShadow: "0 0 15px rgba(201,168,76,0.3), inset 0 0 15px rgba(201,168,76,0.1)" },
    "50%": { boxShadow: "0 0 25px rgba(201,168,76,0.5), inset 0 0 25px rgba(201,168,76,0.2)" },
  },
  "rpg-fade-in-up": {
    "0%": { opacity: "0", transform: "translateY(12px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
  "rpg-fade-in": {
    "0%": { opacity: "0" },
    "100%": { opacity: "1" },
  },
  "rpg-scale-in": {
    "0%": { transform: "scale(0.85)", opacity: "0" },
    "100%": { transform: "scale(1)", opacity: "1" },
  },
  "rpg-slide-down": {
    "0%": { transform: "translateY(-100%)", opacity: "0" },
    "100%": { transform: "translateY(0)", opacity: "1" },
  },
  "rpg-score-bump": {
    "0%, 100%": { transform: "scale(1)" },
    "50%": { transform: "scale(1.15)" },
  },
};
