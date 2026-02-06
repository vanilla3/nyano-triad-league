import type { Config } from "tailwindcss";

/**
 * Nyano Triad League - Tailwind Configuration
 * 
 * Design Philosophy:
 * - Warm, friendly, approachable (but not childish)
 * - Clean and readable (gaming context requires clarity)
 * - Playful accents without overwhelming
 * - Works well on stream overlays (OBS)
 */

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // ═══════════════════════════════════════════════════════════════
      // COLOR SYSTEM
      // ═══════════════════════════════════════════════════════════════
      colors: {
        // Brand Colors - Nyano's warm, friendly palette
        nyano: {
          50: "#FFF8F5",
          100: "#FFEDE5",
          200: "#FFD9C7",
          300: "#FFC2A3",
          400: "#FFA67A",
          500: "#FF8A50", // Primary brand color
          600: "#E67340",
          700: "#CC5C30",
          800: "#994520",
          900: "#662E10",
          950: "#331705",
        },
        
        // Player A - Cool sky blue (calming, trustworthy)
        player: {
          a: {
            50: "#F0F9FF",
            100: "#E0F2FE",
            200: "#BAE6FD",
            300: "#7DD3FC",
            400: "#38BDF8",
            500: "#0EA5E9", // Main
            600: "#0284C7",
            700: "#0369A1",
            800: "#075985",
            900: "#0C4A6E",
          },
          // Player B - Warm rose (energetic, passionate)
          b: {
            50: "#FFF1F2",
            100: "#FFE4E6",
            200: "#FECDD3",
            300: "#FDA4AF",
            400: "#FB7185",
            500: "#F43F5E", // Main
            600: "#E11D48",
            700: "#BE123C",
            800: "#9F1239",
            900: "#881337",
          },
        },
        
        // Semantic Colors
        surface: {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
          950: "#0C0A09",
        },
        
        // Accent colors for game events
        flip: "#F59E0B",      // Amber - card flip highlight
        chain: "#8B5CF6",     // Violet - chain combo
        victory: "#10B981",   // Emerald - win
        defeat: "#EF4444",    // Red - loss
        draw: "#6B7280",      // Gray - draw
      },
      
      // ═══════════════════════════════════════════════════════════════
      // TYPOGRAPHY
      // ═══════════════════════════════════════════════════════════════
      fontFamily: {
        // Display font - rounded, friendly, game-like
        display: [
          "Nunito",
          "Rounded Mplus 1c",
          "Hiragino Maru Gothic ProN",
          "sans-serif",
        ],
        // Body font - clean, readable
        body: [
          "Noto Sans JP",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "sans-serif",
        ],
        // Mono font - for technical info (tokenIds, hashes)
        mono: [
          "JetBrains Mono",
          "SF Mono",
          "Consolas",
          "monospace",
        ],
      },
      
      fontSize: {
        // Custom sizes for game UI
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],  // 10px
        "3xs": ["0.5625rem", { lineHeight: "0.75rem" }], // 9px
      },
      
      // ═══════════════════════════════════════════════════════════════
      // SPACING & SIZING
      // ═══════════════════════════════════════════════════════════════
      spacing: {
        "4.5": "1.125rem",  // 18px
        "13": "3.25rem",    // 52px
        "15": "3.75rem",    // 60px
        "18": "4.5rem",     // 72px
        "22": "5.5rem",     // 88px
      },
      
      // Card-specific sizes
      width: {
        "card-sm": "5rem",    // 80px - mini cards
        "card-md": "7rem",    // 112px - standard cards
        "card-lg": "9rem",    // 144px - large cards
        "card-xl": "12rem",   // 192px - hero cards
      },
      
      // ═══════════════════════════════════════════════════════════════
      // VISUAL EFFECTS
      // ═══════════════════════════════════════════════════════════════
      boxShadow: {
        // Soft, friendly shadows
        "soft-sm": "0 2px 8px -2px rgba(0, 0, 0, 0.08)",
        "soft": "0 4px 16px -4px rgba(0, 0, 0, 0.1)",
        "soft-lg": "0 8px 32px -8px rgba(0, 0, 0, 0.12)",
        "soft-xl": "0 16px 48px -12px rgba(0, 0, 0, 0.15)",
        
        // Card shadows
        "card": "0 2px 8px -2px rgba(0, 0, 0, 0.06), 0 4px 16px -4px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 4px 16px -4px rgba(0, 0, 0, 0.1), 0 8px 24px -8px rgba(0, 0, 0, 0.12)",
        "card-active": "0 1px 4px -1px rgba(0, 0, 0, 0.08)",
        
        // Player glow effects
        "glow-a": "0 0 20px -4px rgba(14, 165, 233, 0.4)",
        "glow-b": "0 0 20px -4px rgba(244, 63, 94, 0.4)",
        "glow-nyano": "0 0 24px -4px rgba(255, 138, 80, 0.5)",
        
        // Game event shadows
        "flip": "0 0 16px -2px rgba(245, 158, 11, 0.5)",
        "chain": "0 0 20px -2px rgba(139, 92, 246, 0.5)",
        "victory": "0 0 32px -4px rgba(16, 185, 129, 0.6)",
      },
      
      borderRadius: {
        "2.5xl": "1.25rem",   // 20px
        "3xl": "1.5rem",      // 24px
        "4xl": "2rem",        // 32px
      },
      
      // ═══════════════════════════════════════════════════════════════
      // ANIMATIONS
      // ═══════════════════════════════════════════════════════════════
      animation: {
        // Card animations
        "card-flip": "card-flip 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "card-place": "card-place 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "card-glow": "card-glow 1.5s ease-in-out infinite",
        
        // UI animations
        "fade-in": "fade-in 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.3s ease-out",
        "fade-in-scale": "fade-in-scale 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-bottom": "slide-in-bottom 0.3s ease-out",
        
        // Game event animations
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "bounce-subtle": "bounce-subtle 0.5s ease-out",
        "shake": "shake 0.4s ease-in-out",
        "confetti": "confetti 1s ease-out forwards",
        
        // Loading states
        "shimmer": "shimmer 2s linear infinite",
        "spin-slow": "spin 2s linear infinite",
      },
      
      keyframes: {
        "card-flip": {
          "0%": { transform: "rotateY(0deg) scale(1)" },
          "50%": { transform: "rotateY(90deg) scale(1.05)" },
          "100%": { transform: "rotateY(180deg) scale(1)" },
        },
        "card-place": {
          "0%": { transform: "scale(0.8) translateY(-10px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "card-glow": {
          "0%, 100%": { boxShadow: "0 0 8px -2px currentColor" },
          "50%": { boxShadow: "0 0 20px -2px currentColor" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-scale": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-bottom": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-4px)" },
          "40%, 80%": { transform: "translateX(4px)" },
        },
        "confetti": {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-100px) rotate(720deg)", opacity: "0" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      
      // ═══════════════════════════════════════════════════════════════
      // BACKDROP & FILTERS
      // ═══════════════════════════════════════════════════════════════
      backdropBlur: {
        xs: "2px",
      },
      
      // ═══════════════════════════════════════════════════════════════
      // Z-INDEX SCALE
      // ═══════════════════════════════════════════════════════════════
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
    },
  },
  plugins: [],
} satisfies Config;
