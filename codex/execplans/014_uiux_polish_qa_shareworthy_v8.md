# ExecPlan 014: UI/UX Polish + QA Shareworthy v8

Request:
- `codex/REQUEST_014_UIUX_POLISH_QA_SHAREWORTHY_V8.md`

Status:
- Living document.
- Last updated: 2026-02-21.

---

## 1) Purpose

Raise Match/Replay UX quality to share-worthy level while preserving core invariants:

1. Deterministic replay compatibility.
2. URL/query compatibility for Match/Replay/share links.
3. Stable protocol shape (`state_json v1`, viewer command, streamer bus).
4. Safe fallback UX when Pixi/WebGL is unavailable.

---

## 2) Scope

### In Scope

- P0:
  - Match/Replay user-facing text hygiene (mojibake/control-char/PUA prevention).
  - Guardrail tooling and CI/local checks to prevent recurrence.
- P1:
  - Board/button visual tuning and polish.
  - Share actions and micro-delight consistency.
- P2:
  - Additional share-card and entry-point polish (non-blocking).

### Out of Scope

- Triad engine rule changes.
- Large backend/DB schema migration.

---

## 3) Work Orders in this plan

- WO-044: Match copy cleanup + text hygiene guardrail.
- WO-045: Asset/material tuning for board/buttons.
- WO-046: Shareworthy UI polish and share actions.

---

## 4) Progress

- [x] WO-044 complete
- [x] WO-045 complete
- [x] WO-046 complete

Follow-up continuity (post WO-046):
- [x] `pnpm lint:text` restored at root.
- [x] text hygiene checker improved for file-root input.
- [x] `pnpm lint:text` integrated into CI (`web` job) and `release:check`.
- [x] active TODO snapshot rewritten to clean readable form.
- [x] Match/Replay copy quality pass started and continued (label normalization, no E2E selector break).
- [x] Match/Replay copy quality pass round 5 complete (`matchId`/`rulesetId` casing normalization on remaining UI helper surfaces).

---

## 5) Decisions

- Keep E2E-sensitive labels stable where tests depend on them (`Share URL`, `Replay`, `Load replay`).
- Apply copy polish to non-selector-facing labels first (`Winner`, `Match ID`, `Ruleset ID`, deck/owner labels, Open-rule wording).
- Keep improvements incremental and reversible.

---

## 6) Verification Plan

Automated:
- `pnpm lint:text`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- Targeted tests (as needed):
  - `pnpm -C apps/web test -- MatchGuestPostGamePanel replayUiHelpers`

Manual:
- Match/Replay pages: user-facing copy readability.
- Stage focus routes: no fallback regression in key labels and controls.

---

## 7) Current Outcome

- WO-044/045/046 objectives are complete.
- Text hygiene guardrail is active, passing, and enforced in CI/release flow.
- Copy quality pass has visible consistency gains in Match/Replay panels and remaining low-visibility labels were normalized in round 5.

---

## 8) Next Actions

1. Commit and push the current copy/doc updates.
2. Continue with next approved roadmap/work-order request.
3. Keep `pnpm lint:text` and targeted Match/Replay copy checks green in CI/local flow.
