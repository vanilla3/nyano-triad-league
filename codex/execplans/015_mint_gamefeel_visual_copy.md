# Mint home visual gamefeel and player copy

This ExecPlan is a living document. `Progress` / `Decision Log` / `Surprises & Discoveries` / `Outcome` will be updated as the work proceeds.

## 1) Purpose / Big Picture

- Players should land on the Mint home screen and immediately feel they are in a soft, cute game lobby, not a generic admin dashboard.
- The first screen should present the next playable action, a 3x3 board fantasy, and approachable player-facing wording.

## 2) Scope

### In-scope

- Improve the Mint home hero, quick-play panel, onboarding copy, and small global Mint shell labels.
- Add a lightweight CSS board preview and battle-card composition using existing assets and CSS.
- Update development docs for the visual/copy pass.

### Out-of-scope

- Gameplay rules, engine logic, transcript codecs, share links, or route schema changes.
- Match/Replay protocol surfaces.
- Full sitewide redesign beyond copy labels that support the home lobby.

## 3) Non-negotiable constraints (Invariants)

- Determinism: transcript -> same result.
- URL compatibility: keep Match/Replay/share params backward compatible.
- Protocol stability: do not change `state_json v1` / viewer command / streamer bus shape.
- WebGL fallback remains untouched.
- Respect reduced-motion / `data-vfx` behavior by keeping new motion minimal and decorative.

## 4) Current State (What exists today)

- Touch targets:
  - `apps/web/src/pages/Home.tsx`
  - `apps/web/src/mint-theme/mint-theme.css`
  - `apps/web/src/App.tsx`
  - `docs/99_dev/IMPLEMENTATION_LOG.md`
  - `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
- Current issue:
  - The home screen is mostly a title, four menu tiles, and a functional quick-play panel.
  - Copy such as "Arenaへ", "デッキ編集", and "クイック対戦" reads like navigation/admin language rather than player action.

## 5) Proposed Design

- Visual thesis: a pastel Mint game lobby with a compact battle card, 3x3 board preview, soft player chips, and warm accent callouts.
- Content thesis: replace tool-like labels with player verbs such as "バトル開始", "カードを組む", "名勝負を見る".
- Interaction thesis: keep existing routes and button components, but make the primary action visible both in the hero and quick-play panel.

## 6) Implementation Steps (Milestones)

### Milestone A: Home lobby composition

- Add hero copy, action buttons, mini stats, and a decorative board preview.
- Update menu and quick-play copy to player-facing Japanese.
- Acceptance criteria: first viewport shows a playable action and board/game motif.

### Milestone B: Mint visual polish

- Add CSS for the hero lobby, battle card, board cells, and quick-play surface.
- Tune responsive layout for desktop and mobile without horizontal overflow.
- Acceptance criteria: desktop and 390px mobile layouts remain readable.

### Milestone C: Docs and verification

- Update implementation log and TODO.
- Run targeted web typecheck/build and a local browser layout check.

## 7) Verification

### Commands

- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

### Manual checks

- Open `/` with Mint theme active.
- Check desktop and 390px mobile widths.
- Confirm primary play routes still point to `/match?...&ui=mint`.

## 8) Risks / Rollback

- Risk: new visual classes could overflow on narrow mobile screens.
- Rollback: revert the home/CSS copy pass; no engine or protocol files are touched.

## 9) Progress

- [x] A-1 Inspect current Home and Mint shell.
- [x] A-2 Implement lobby visual/copy pass.
- [x] B-1 Verify responsive layout.
- [x] C-1 Update docs and run checks.

## 10) Decision Log

- 2026-05-01: Keep the change focused on Home/Mint shell because the user requested visual improvement from the current Mint UI, and this avoids gameplay/protocol risk.

## 11) Surprises & Discoveries

- The Mint theme is now globally wired, but the home screen still presents mostly navigation categories rather than a game-lobby moment.
- `rg` was unavailable in this local shell, so PowerShell `Select-String` was used for copy/class searches.

## 12) Outcome / Retrospective

- The Mint home now opens as a soft game lobby with a visible battle CTA, 3x3 board preview, player-friendly menu copy, and mobile constraints that avoid horizontal overflow.
- Verified 1280px desktop and 390px mobile with Playwright against local preview.
