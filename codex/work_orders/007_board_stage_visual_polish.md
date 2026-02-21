# Work Order 007: Board / Stage Visual Polish

## Goal
- Improve the visual quality of the Mint board and stage so the board does not look weaker than cards.
- Focus on material feel, depth, and clarity without harming readability or performance.

## Deliverables
- [x] Mint board/stage visuals were polished (BoardViewMint + DuelStageMint + mint-theme).
- [x] Important states (selectable, blocked, selected, place, flip, chain) remain readable.
- [x] VFX quality tiers are respected (`off|low|medium|high`).
- [x] Mobile width (around 390px) remains usable.
- [x] Reduced-motion behavior is preserved.

## Requirements
### Must
- Keep card number/icon readability on all board cells.
- Differentiate selectable vs non-selectable using shape/contrast/depth, not color only.
- Avoid introducing heavy assets unless necessary and license-safe.
- Avoid expensive visual effects that can degrade frame rate.

### Should
- Make board feel like one object (frame/rim/highlight consistency).
- Avoid flat background-only look; use subtle gradient/pattern depth.
- Keep place/flip feedback short and clear.

### Could
- Add subtle glint/pulse only on `vfx=high`.

## Non-goals
- Engine rule/logic changes.
- Large Pixi renderer refactor.
- Card art redesign.

## Implementation Focus
- `apps/web/src/components/BoardViewMint.tsx`
- `apps/web/src/components/DuelStageMint.tsx`
- `apps/web/src/mint-theme/mint-theme.css`

## Acceptance Criteria
1. `/match?ui=mint` board has stronger material/depth and clear interaction affordance.
2. `vfx=off` and reduced-motion stay lightweight and stable.
3. Build/typecheck/tests remain green.

## Verification
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- Manual checks on mobile width and VFX quality modes.

## 2026-02-15 Follow-up
- [x] Added `apps/web/e2e/mint-stage-visual-guardrails.spec.ts`.
- [x] Included in `pnpm -C apps/web e2e:ux`.
- [x] Verified guardrails pass.
