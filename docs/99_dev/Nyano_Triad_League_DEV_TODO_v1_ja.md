# Nyano Triad League DEV TODO (v1)

Last updated: 2026-02-21
Owner: Codex + Team

This document is the active, readable roadmap snapshot.
Detailed historical logs remain in `docs/99_dev/_archive/` and `docs/99_dev/IMPLEMENTATION_LOG.md`.

---

## Invariants (must not break)

1. Determinism: transcript -> same result.
2. URL compatibility: keep Match/Replay/share params backward compatible.
3. Protocol stability: `state_json v1` / viewer command / streamer bus shape.
4. WebGL fallback: gameplay must remain usable when Pixi/WebGL is unavailable.

---

## Recently Completed

- [x] WO-039: motion timing/token unification.
- [x] WO-040: alive background baseline.
- [x] WO-041: catharsis pack (particles/shake/depth) baseline.
- [x] WO-042: idle guidance for next action.
- [x] WO-043: sitewide hit-target/CLS/pressable consistency.
- [x] WO-044: Match text hygiene cleanup and guardrail introduction.
- [x] WO-045: board/buttons material upgrade integration.
- [x] WO-046: shareworthy micro-delight and share action polish.
- [x] WO-011: motion language v1 (tokens/utilities/showcase + primary UI application).
- [x] WO-011 follow-up: ruleset legacy key compatibility + type safety recovery.

---

## Stage Route Follow-ups

- [x] WO005-H: Pixi card-art texture failure guidance + manual retry path.
- [x] WO005-I: Pixi/WebGL init failure auto fallback to Mint board.
- [x] WO005-J: replay-stage WebGL fallback E2E regression guard.

---

## Current Focus (active)

- [x] Restore text hygiene command entrypoint (`pnpm lint:text`).
- [x] Re-enable text hygiene script for file-path roots.
- [x] Remove known replacement-character issue from WO007 header.
- [x] Rewrite this TODO file into a clean active snapshot.
- [x] Start Next Priority #2: Match/Replay copy quality pass (label wording consistency without E2E selector breakage).
- [x] Continue Next Priority #2: normalize Winner/Match ID/Open-rule wording across Match/Replay panels.
- [x] Continue Next Priority #2 (Round 3): align Replay labels (Ruleset ID / Match ID / Winner capitalization) with Match.
- [x] Continue Next Priority #2 (Round 4): align Replay ruleset-registry label wording to `Ruleset ID`.
- [x] Continue Next Priority #2 (Round 5): unify remaining `matchId`/`rulesetId` user-facing labels in Match/Replay helper surfaces.
- [x] Continue Next Priority #2 (Round 6): normalize Replay mismatch warning copy from `rulesetId` to `Ruleset ID`.
- [x] Continue Next Priority #2 (Round 7): align Replay `Classic Swap/Open` label capitalization with Match terminology.
- [x] Recover ExecPlan 014 readability for reliable roadmap operations.
- [x] Integrate `pnpm lint:text` into CI web job and `release:check`.

---

## Next Priority

1. Keep `pnpm lint:text` green in CI/local workflow.
2. Run targeted UI quality pass on Match/Replay user-visible copy and labels.
3. Continue roadmap tasks from latest approved request/work order queue.

---

## Verification Checklist

- [ ] `pnpm lint:text`
- [ ] `pnpm -C apps/web lint`
- [ ] `pnpm -C apps/web test --`
- [ ] `pnpm -C apps/web build`

---

## References

- Request 013: `codex/REQUEST_013_SITEWIDE_UI_UX_GAMEFEEL_MOTION_JUICE.md`
- Request 014: `codex/REQUEST_014_UIUX_POLISH_QA_SHAREWORTHY_V8.md`
- ExecPlan 014: `codex/execplans/014_uiux_polish_qa_shareworthy_v8.md`
- Work Orders: `codex/work_orders/`
- Implementation log: `docs/99_dev/IMPLEMENTATION_LOG.md`
