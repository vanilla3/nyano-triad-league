# 006 UI/UX Shareworthy v9 (Sitewide + Battle feel)

This ExecPlan ties together the next UI/UX phase so work can be split into safe Work Orders.

## 1) Purpose / Big Picture

Make Nyano Triad League feel like a *game* even before you start a match:
- Interaction feels responsive and delightful (“tame & tsume”)
- Idle screens feel alive (but not noisy)
- Key battle moments deliver catharsis (only when it matters)
- The UI becomes “shareworthy” (people want to post screenshots / links)

## 2) Scope

### In-scope
- Sitewide motion token system (duration/easing) + consistent usage
- Cut-in / dialogue overlay stability (no layout shift)
- Lightweight ambient background (grid scroll + noise overlay)
- High-impact moments: optional screen shake / bursts gated by vfx + reduced-motion
- Small share affordances (native share / copy link)

### Out-of-scope
- Engine / rules changes
- Breaking URL params or protocol schemas
- Heavy video backgrounds
- New copyrighted assets

## 3) Non-negotiable constraints (Invariants)

- Deterministic replay/transcript must remain intact.
- URL / query compatibility must remain intact.
- Respect `prefers-reduced-motion` and `documentElement.dataset.vfx`.
- Pixi/WebGL fallback must remain playable.

## 4) Work Order mapping

- WO006: Audit + motion tokens (foundation)
- WO007: Cut-in stability + catharsis pack
- WO008: Alive background + shareworthy micro-features

## 5) Verification

- `pnpm lint:text`
- `pnpm lint`
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

Manual:
- `/match`
- `/battle-stage?...&ui=engine&focus=1`
- `/replay-stage?ui=engine&focus=1`

## 6) Rollback strategy

Each WO should be revertable by:
- Removing a small set of new CSS vars/classes
- Removing overlay wrapper components
- Keeping existing page routing + state logic untouched
