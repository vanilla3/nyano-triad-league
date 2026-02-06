# Nyano Triad League — RPG Fantasy Theme Integration Guide

## Overview

This package transforms the Nyano Triad League from a clean/minimal card game UI
into a **fantasy RPG card battle** experience with:

- 🕯 Animated candles with flickering flames
- 🏰 Ornate wooden board frame with golden borders
- 🪨 Stone-textured 3×3 grid cells
- ⚔️ Player HUDs with HP bars & score tiles
- 🎴 Cards with edge value orbs, trait glow, and janken icons
- 📜 Turn banner ribbon & battle log sidebar
- 🏆 Result overlay with victory/defeat/draw states
- ✨ Ambient floating particles

---

## Files Included

```
rpg-theme/
├── rpg-theme.css              # All RPG styles, animations, keyframes
├── rpg-tailwind-extend.ts     # Tailwind config extensions (colors, animations)
├── BoardViewRPG.tsx           # Main board + HUD + result overlay + turn log
└── INTEGRATION_GUIDE.md       # This file
```

---

## Step 1: Install Cinzel Font

Add to `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap" rel="stylesheet">
```

> Falls back to `Playfair Display → Times New Roman → serif` if unavailable.

---

## Step 2: Import CSS

In your main CSS entry point (after `index.css`):

```css
/* src/index.css or global entry */
@import '../global_css/index.css';
@import './rpg-theme.css';          /* ← Add this line */
```

Or in your main TypeScript entry:

```ts
import '../global_css/index.css';
import './rpg-theme/rpg-theme.css';  // ← Add this
```

---

## Step 3: Extend Tailwind Config (optional)

If you want RPG tokens available as Tailwind classes:

```ts
// tailwind.config.ts
import { rpgColors, rpgFontFamily, rpgAnimations, rpgKeyframes } from './rpg-theme/rpg-tailwind-extend';

export default {
  // ... existing config
  theme: {
    extend: {
      // ... existing extends
      colors: {
        // ... existing colors
        ...rpgColors,
      },
      fontFamily: {
        // ... existing fonts
        ...rpgFontFamily,
      },
      animation: {
        // ... existing animations
        ...rpgAnimations,
      },
      keyframes: {
        // ... existing keyframes
        ...rpgKeyframes,
      },
    },
  },
} satisfies Config;
```

---

## Step 4: Drop in the Components

### Copy `BoardViewRPG.tsx` to `apps_web_components/`

```bash
cp rpg-theme/BoardViewRPG.tsx apps_web_components/BoardViewRPG.tsx
```

### Exported Components

| Component | Replaces | Purpose |
|---|---|---|
| `BoardViewRPG` | `BoardView` | Main game board with RPG frame, HUDs, candles |
| `HandDisplayRPG` | `HandDisplay` | Player hand cards in fantasy style |
| `GameResultOverlayRPG` | `GameResultOverlay` | Victory/defeat/draw announcement |
| `TurnLogRPG` | *(new)* | Battle log sidebar |
| `BoardViewRPGMini` | `BoardViewMini` | Compact board for OBS overlays |
| `BoardReplayViewerRPG` | `BoardReplayViewer` | Replay with step slider |

---

## Step 5: Update Match.tsx

### Before (existing):
```tsx
import { BoardView } from '@/components/BoardView';
import { HandDisplay } from '@/components/CardNyano';
import { GameResultOverlay } from '@/components/GameResultOverlay';
```

### After (RPG):
```tsx
import {
  BoardViewRPG,
  HandDisplayRPG,
  GameResultOverlayRPG,
  TurnLogRPG,
} from '@/components/BoardViewRPG';
```

### Usage Example:

```tsx
function MatchPage() {
  // ... existing state hooks ...

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh' }}>
      {/* Board (replaces <BoardView>) */}
      <BoardViewRPG
        board={boardState}
        selectedCell={selectedCell}
        placedCell={lastPlacedCell}
        flippedCells={lastFlippedCells}
        warningMarks={warningMarks}
        selectableCells={selectableCells}
        onCellSelect={handleCellSelect}
        currentPlayer={currentPlayer}
        playerNameA={playerA.name}
        playerNameB={playerB.name}
        showCoordinates={true}
        showCandles={true}
        showParticles={true}
      />

      {/* Player hands */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <HandDisplayRPG
          cards={handA}
          owner={0}
          usedIndices={usedA}
          selectedIndex={selectedCardIndex}
          onSelect={handleCardSelect}
        />
        <HandDisplayRPG
          cards={handB}
          owner={1}
          usedIndices={usedB}
          selectedIndex={null}
          disabled
        />
      </div>

      {/* Turn log sidebar */}
      <TurnLogRPG entries={turnLogEntries} />

      {/* Result overlay */}
      <GameResultOverlayRPG
        result={gameResult}
        perspective={myPlayerIndex}
        show={showResult}
        onReplay={handleReplay}
        onShare={handleShare}
        onDismiss={() => setShowResult(false)}
      />
    </div>
  );
}
```

---

## Backwards Compatibility

All RPG components maintain the same prop interfaces as originals:

| Prop | BoardView | BoardViewRPG | Notes |
|---|---|---|---|
| `board` | ✅ | ✅ | Same `BoardState` type |
| `selectedCell` | ✅ | ✅ | — |
| `focusCell` | ✅ | ✅ | Legacy support maintained |
| `placedCell` | ✅ | ✅ | — |
| `flippedCells` | ✅ | ✅ | — |
| `warningMarks` | ✅ | ✅ | — |
| `onCellSelect` | ✅ | ✅ | — |
| `onClickCell` | ✅ | ✅ | Legacy support maintained |
| `selectableCells` | ✅ | ✅ | `Set<number>` or `number[]` |
| `currentPlayer` | ✅ | ✅ | — |
| `disabled` | ✅ | ✅ | — |
| `showCoordinates` | ✅ | ✅ | — |
| `size` | ✅ | — | Removed (RPG uses responsive sizing) |
| `playerNameA` | — | ✅ | New: player display names |
| `playerNameB` | — | ✅ | New: player display names |
| `showParticles` | — | ✅ | New: toggle ambient effects |
| `showCandles` | — | ✅ | New: toggle decorative candles |

You can swap `BoardView` → `BoardViewRPG` with zero other changes.

---

## CSS Class Reference

### Board Frame
- `.rpg-board-frame` — Outer wooden frame with gold border
- `.rpg-board-inner` — Dark inner board area
- `.rpg-grid` — 3×3 grid container

### Cells
- `.rpg-cell` — Stone tile base
- `.rpg-cell--empty` — Empty clickable cell
- `.rpg-cell--selectable` — Dashed border, pulsing indicator
- `.rpg-cell--placed` — Pop animation + amber glow
- `.rpg-cell--flipped` — Flip animation + purple glow
- `.rpg-cell--flip-delay-{1,2,3}` — Staggered chain flip delays
- `.rpg-cell--owner-a/b` — Player color border + glow

### Cards
- `.rpg-card` — Card on board (3×3 grid)
- `.rpg-card__edge` + `--high/--mid-a/--mid-b/--low` — Edge value orbs
- `.rpg-card__center` — Janken emoji center
- `.rpg-hand-card` + `--a/--b/--selected/--used` — Hand card styles

### HUD
- `.rpg-hud` + `--a/--b/--active` — Player HUD container
- `.rpg-hud__hp-bar/fill/label` — HP-style score bar
- `.rpg-hud__score-tile` — Individual score indicators

### Decorative
- `.rpg-candle` — Animated candle
- `.rpg-particles` / `.rpg-particle` — Floating ambient particles
- `.rpg-vs` — VS emblem circle
- `.rpg-turn-banner` + `--a/--b` — Turn announcement ribbon
- `.rpg-shimmer-gold` — Gold text shimmer effect

### Trait Colors
- `.rpg-trait-{flame|aqua|shadow|light|cosmic|wind|thunder|earth|metal|forest|none}`
- Sets `--trait-color` and `--trait-bg` custom properties

---

## Customization

### Dark Mode
The RPG theme is inherently dark. No dark mode toggle needed.

### Disable Decorations
```tsx
<BoardViewRPG
  showCandles={false}
  showParticles={false}
  // ... other props
/>
```

### OBS Overlay Mode
Use `BoardViewRPGMini` for a compact, transparent-friendly board:
```tsx
<BoardViewRPGMini board={board} placedCell={lastMove} flippedCells={flips} />
```

### Custom Player Colors
Override CSS custom properties:
```css
.my-custom-theme {
  --rpg-pa: #00FF88;
  --rpg-pb: #FF00AA;
}
```

---

## Performance Notes

- **SVG filters** (stone texture, wood grain) are defined once in CSS—no runtime cost
- **Animations** use CSS-only keyframes (`transform`, `opacity`)—GPU composited
- **Particles** use `will-change: transform` implicitly via animation
- **Flip stagger delays** use CSS classes, not JS timeouts
- All components are stateless/memoizable

---

## Migration Checklist

- [ ] Add Cinzel font link to `index.html`
- [ ] Copy `rpg-theme.css` to project, import after `index.css`
- [ ] Copy `BoardViewRPG.tsx` to `apps_web_components/`
- [ ] (Optional) Merge `rpg-tailwind-extend.ts` into `tailwind.config.ts`
- [ ] Replace `BoardView` imports with `BoardViewRPG` in `Match.tsx`
- [ ] Replace `HandDisplay` with `HandDisplayRPG`
- [ ] Replace `GameResultOverlay` with `GameResultOverlayRPG`
- [ ] Add `TurnLogRPG` sidebar
- [ ] Set page background to dark (`#0A0A0A` or similar)
- [ ] Test on mobile viewports (board is responsive)
- [ ] Test OBS overlay with `BoardViewRPGMini`
