# CSS Catalog Responsive Layout Adoption

This ExecPlan is a living document. Update `Progress`, `Decision Log`, `Surprises & Discoveries`, and `Outcome` as work advances.

## 1) Purpose / Big Picture

- Home and Start keep a composed, symmetric layout across mobile, tablet, and desktop widths instead of jumping between unrelated viewport presets.
- CardBrowser responds to the width it actually receives in Nyano and Decks, making the same component readable in both placements.
- The change raises visual polish without touching game state, URL behavior, protocol data, or WebGL fallback paths.

## 2) Scope

### In-scope

- Named container queries for Home, Start, and CardBrowser.
- Symmetric 1/2/4 and 1/2/3 Grid compositions.
- Aligned CTA rows and balanced short headings.
- True-hover gating for CardBrowser decoration.
- Browser guardrails, screenshots, developer docs, and handoff evidence.

### Out-of-scope

- React behavior, copy, assets, game/replay logic, native dialog migration, Arena redesign, global resets, dependencies, or experimental CSS that lacks a safe fallback.

## 3) Non-negotiable constraints (Invariants)

- Deterministic transcript behavior remains untouched.
- Existing Match/Replay URL parameters and share links remain untouched.
- `state_json v1`, `streamer_bus`, and viewer commands remain untouched.
- Pixi/WebGL fallback behavior remains untouched.
- Existing `prefers-reduced-motion` and `data-vfx` handling remains effective.

## 4) Current State (What exists today)

- Files in scope:
  - `apps/web/src/mint-theme/mint-theme.css`
  - `apps/web/e2e/mint-app-screens-guardrails.spec.ts`
- Home currently uses viewport max-width rules at 1100px and 760px. A measured 761px to 760px change doubles menu height and adds roughly 616px to total page height.
- Start currently switches directly from three columns to one at the 1100px viewport rule.
- CardBrowser's filters and cards react to 640px/480px viewport rules even though the component is reused in differently sized page regions.

## 5) Proposed Design

- Visual thesis: preserve the premium mint-glass material while making geometry calm and intentional—symmetric action groups, consistent card widths, and aligned CTA baselines.
- Content plan: retain every existing label/action; change only the layout of Home navigation, Home onboarding, Start onboarding, and CardBrowser.
- Interaction thesis: keep press feedback and focus states, gate decorative lift/shine to true hover devices, and retain reduced-motion/VFX fallbacks.
- Home: `container: --mint-home / inline-size`, mobile-first one-column defaults, then 2-column and 4/3-column thresholds based on card width.
- Start: `container: --mint-start / inline-size`, 1/2/3 journey steps with the two-column orphan centered.
- CardBrowser: `container: --mint-card-browser / inline-size`, safe single-column filter fallback and an overflow-proof intrinsic card Grid.

## 6) Implementation Steps (Milestones)

### Milestone A: Responsive layout foundations

- Add the three named containers and replace only their matching viewport overrides.
- Add symmetric orphan handling at medium widths.
- Acceptance: computed columns match the spec at representative widths without horizontal overflow.

### Milestone B: Internal alignment and hover semantics

- Give Home/Start step cards a flexible title row and balanced short headings.
- Gate CardBrowser decorative hover lift/shine behind `any-hover: hover` while preserving focus/active/VFX behavior.
- Acceptance: actions align in equal-height rows and touch devices do not receive decorative sticky hover rules.

### Milestone C: Guardrails and evidence

- Extend the existing Mint screen Playwright guardrail.
- Capture before/after Home and Start screenshots.
- Update developer TODO/log and paste real outputs into the handoff.
- Acceptance: all spec verification commands pass and an independent reviewer approves.

## 7) Verification

### Commands

- `git diff --check`
- `pnpm lint:text`
- `pnpm lint:motion`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- e2e/mint-app-screens-guardrails.spec.ts e2e/home.spec.ts e2e/start.spec.ts`

### Manual checks

- Home at 390px, 760px, and 1200px.
- Start at 390px, 760px, and 1100px.
- Nyano and Decks CardBrowser at the same desktop viewport.
- Horizontal overflow, keyboard focus, reduced motion, and VFX-off behavior.

## 8) Risks / Rollback

- Risk: a container threshold can land too close to the usable width after safe-area gutters. Mitigation: assert computed columns, not viewport assumptions.
- Risk: centered orphan width can overflow if its calculation is wrong. Mitigation: percentage-safe widths and overflow assertions.
- Risk: CardBrowser filters could become too dense in Decks. Mitigation: query the component's own width and verify both placements.
- Rollback: revert the scoped CSS blocks and the one E2E guardrail; no data migration or dependency rollback is required.

## 9) Progress

- [x] Baseline audit and 760px/1100px measurements recorded.
- [x] Named container layouts implemented.
- [x] Card alignment and hover semantics implemented.
- [x] Automated and manual verification complete.
- [x] Handoff complete and independent review approved.

## 10) Decision Log

- 2026-08-30: selected named container queries over `auto-fit` for the four-item Home menu because 4/2/1 symmetry avoids a visually weak 3+1 row.
- 2026-08-30: rejected kiso.css, global resets, Anchor Positioning, sign-radius/full-bleed changes, and native dialog migration because their regression surface exceeds the layout value in this task.
- 2026-08-30: kept all production changes CSS-only so route/state/protocol behavior stays outside the change surface.
- 2026-08-30: set component thresholds at 544px for two columns, 832px for three Home onboarding columns, 1024px for three Start columns, and 1088px for four Home menu columns; each threshold is expressed as a rem-derived `calc()`.
- 2026-08-30: fresh-context adversarial review independently reran the full verification matrix and live geometry probes, then returned `approve` with an empty fix list.

## 11) Surprises & Discoveries

- A single-pixel Home viewport change at 760px causes a roughly 616px full-page height jump under the current media rules.
- CardBrowser is a better named-container candidate than the page shell because it is reused in both narrow and wide placements.
- The first manual threshold expression used pixel numerators without dividing by 16; computed-style inspection exposed the error immediately, and the expressions were corrected before the formal E2E run.
- After correction, Home at 760px measures 1,168px tall with 2 menu columns, 2 onboarding columns, 4 difficulty columns, and 0px horizontal overflow (baseline: 1,642px tall and 1 menu column).
- At a shared 1,200px viewport, CardBrowser measures 1,134px/3 filter columns/10 card columns in Nyano and 592px/1 filter column/5 card columns in Decks, with 0px horizontal overflow in both placements.

## 12) Outcome / Retrospective

- Implementation, verification, and independent review are complete. Text/motion lint, ESLint (0 errors), typecheck, all 225 Vitest files / 1,786 tests, production build, and the selected 13-test Playwright suite pass. Home at 760px is 474px shorter than baseline while retaining two menu columns; Start at 1100px restores a compact three-card row. The fresh reviewer independently reproduced the geometry and returned `approve` with no fixes.
