# Work Order: 007 - Board/Stage Visual Polish (cards should feel grounded)

Reference: `docs/01_design/NYTL_MINT_UI_REFERENCE_PASTEL_GAMEFEEL_v0_ja.md`

## 1) Purpose

Improve the visual quality of the Mint board/stage so gameplay reads clearly and feels premium without noisy over-animation.

## 2) Deliverables

- [x] Upgraded Mint board/stage surface quality (`BoardViewMint`, `DuelStageMint`).
- [x] Improved visual readability for key moments (place/flip/selection).
- [x] Added quality-tier behavior via `data-vfx` (off/low/medium/high).
- [x] Preserved mobile usability at narrow widths.
- [x] Preserved reduced-motion behavior.

## 3) Requirements

### MUST

- Keep gameplay readability first.
- Keep transitions short and meaningful.
- Apply only for `ui=mint`.

### SHOULD

- Keep visual language consistent with glass/panel style.
- Keep board and cell materials aligned.

### COULD

- Add subtle high-tier-only material accents.

## 4) Non-goals

- Rule changes.
- Large renderer architecture changes.

## 5) Acceptance Criteria

1. `/match?ui=mint` shows upgraded board/stage quality.
2. Place/flip/selection states remain clear.
3. `vfx=off` and reduced-motion keep the board usable.
4. Build and tests remain green.

## 6) Main Files

- `apps/web/src/components/BoardViewMint.tsx`
- `apps/web/src/components/DuelStageMint.tsx`
- `apps/web/src/mint-theme/mint-theme.css`

## 7) Approach

- Improve board and cell layers with restrained contrast and depth.
- Keep interaction states readable under all VFX tiers.
- Avoid persistent distracting effects.

## 8) Task Status

- [x] Added board surface/frame style updates.
- [x] Added cell shadow/highlight balance.
- [x] Added VFX-tier branching.
- [x] Verified behavior with reduced-motion and mobile widths.

## 9) Verification

### Automated

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

### Manual

- `/match?ui=mint`
- Check `vfx=off|low|high`
- Check small viewport behavior

## 10) Risks / Rollback

- Risk: visual change reduces clarity.
- Mitigation: keep all changes scoped and reversible.
- Rollback: revert this work order's related style changes.

## 11) PR Notes

- What: polished board/stage materials and readability.
- Why: improve gamefeel while protecting clarity.
- How: targeted CSS + component-level visual tuning.
- Test: test/typecheck/build + manual tier checks.

## 12) Implementation Memo (2026-02-15)

- Added practical guardrails and visual checks for Mint stage behavior.
- Ensured reduced-motion and low-VFX behavior are preserved.