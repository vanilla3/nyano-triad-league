# 005 Stage UI/UX Foundation (Battle/Replay)

This ExecPlan is a living document. `Progress`, `Decision Log`, `Surprises & Discoveries`, and `Outcome` are updated while work is in progress.

## 1) Purpose / Big Picture

- Make `/battle-stage` and `/replay-stage` feel like dedicated game screens where board, hand, and key actions stay in one visual flow.
- Improve quality baseline for the long-term “major-studio” UI direction without touching game rules, URL compatibility, or protocol schemas.

## 2) Scope

### In-scope
- Stage-route layout hierarchy hardening (focus root, toolbar, arena shell, board area, hand/action zone).
- Viewport-aware board sizing for Pixi stage pages to reduce scroll-dependent play flow.
- Shared style tokens for stage shell/panel presentation.
- Minimal docs updates for traceability (`IMPLEMENTATION_LOG`, DEV TODO).

### Out-of-scope
- Engine/ruleset behavior changes.
- Share URL/query schema changes.
- Streamer bus / state_json schema changes.
- Contract changes.

## 3) Non-negotiable constraints (Invariants)

- Do not break deterministic replay/transcript behavior.
- Keep existing URL params and stage routing compatibility.
- Do not change `state_json v1`, viewer command shape, or `streamer_bus` payloads.
- Preserve Pixi/WebGL fallback behavior.
- Respect `prefers-reduced-motion` and `data-vfx` behavior.

## 4) Current State (What exists today)

- Target files:
  - `apps/web/src/pages/Match.tsx`
  - `apps/web/src/pages/Replay.tsx`
  - `apps/web/src/mint-theme/mint-theme.css`
  - `apps/web/src/styles.css`
- Existing stage pages already force `ui=engine&focus=1`, but board sizing is mostly static and can push action controls below the fold on some desktop viewport combinations.

## 5) Proposed Design

- Add a shared stage sizing utility (`stage_layout.ts`) that computes board `maxWidthPx`/`minHeightPx` from viewport dimensions and stage kind (`battle`/`replay`).
- Use stage-only CSS classes (`stage-focus-*`) to make hierarchy explicit:
  - top command bar
  - main arena shell
  - board shell
  - cut-in/comment area
  - hand/action dock zone
- Keep existing component composition and control wiring; only adjust layout and sizing orchestration.

## 6) Implementation Steps (Milestones)

### Milestone A: Stage layout baseline + viewport-aware board sizing
- Work:
  - Create `stage_layout.ts` + tests.
  - Apply sizing utility in `Match.tsx` and `Replay.tsx`.
  - Add stage route class hooks and CSS rules in `mint-theme.css`.
  - Add base stage tokens in `styles.css`.
- Acceptance:
  - Stage pages avoid unnecessary scroll-to-commit flow on common desktop sizes.
  - 390px width still works without horizontal overflow.
  - Existing controls and replay flow remain functional.

### Milestone B: Follow-up polish
- Work:
  - Tune stage action feedback and optional SFX layering.
  - Tighten timeline/detail panel behavior for replay stage.
- Acceptance:
  - Improved readability and action discoverability without increasing interaction cost.

## 7) Verification

### Commands

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

### Manual checks

- `/battle-stage?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=engine&focus=1`
- `/replay-stage?ui=engine&focus=1`
- Desktop and mobile widths (including ~390px).
- Confirm WebGL fallback can still render non-blocking UI.

## 8) Risks / Rollback

- Risks:
  - Over-constrained stage heights could make board too small on some viewports.
  - CSS class drift between focus and non-focus routes.
- Rollback:
  - Revert stage-only class additions and sizing utility calls; keep previous static sizing constants.

## 9) Progress

- [x] A-1 Create ExecPlan and define milestone boundaries
- [x] A-2 Implement stage sizing utility + tests
- [x] A-3 Apply stage classes/sizing in Match and Replay
- [x] A-4 Run web test/typecheck/build
- [x] A-5 Update implementation docs

## 10) Decision Log

- 2026-02-13: Start with stage-only layout hardening before any broader UI refactor to minimize risk and keep URL/protocol invariants untouched.
- 2026-02-13: Use a shared `computeStageBoardSizing` utility (instead of per-page constants) so battle/replay pages stay behaviorally aligned while allowing different vertical reserve budgets.

## 11) Surprises & Discoveries

- Existing stage flow already includes a focus hand dock and drag/drop hooks, so reducing scroll friction is mostly a sizing/layout orchestration task rather than a logic rewrite.

## 12) Outcome / Retrospective

- Stage pages now scale board size by viewport and stage kind, reducing scroll-dependent controls in common desktop/mobile cases.
- Layout classes are explicit (`stage-focus-*`), making the hierarchy easier to extend in follow-up milestones without touching engine/protocol layers.
