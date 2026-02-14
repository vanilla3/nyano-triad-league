# 006 Classic Rules (FFXIV-style Rule Pack)

This ExecPlan is a living document. `Progress`, `Decision Log`, `Surprises & Discoveries`, and `Outcome` are updated while work is in progress.

## 1) Purpose / Big Picture

- Add a modular “Classic Rules” pack inspired by FFXIV Triple Triad extra rules (Order / Chaos / Swap / Reverse / Ace Killer / Type Ascend/Descend / Plus / Same …) to make matches less solved and more expressive.
- Keep Nyano Triad League’s core values intact: deterministic simulation, verifiable replay, and additive-only schema evolution.

## 2) Scope

### In-scope

- `packages/triad-engine`
  - Add a versioned ruleset config that can express Classic Rules toggles.
  - Deterministic RNG helper for Classic rules.
  - Implement engine semantics for: Order, Chaos, Swap, Reverse, Ace Killer, Type Ascend, Type Descend, Plus, Same.
  - Update flip tracing so reverse/special captures can be represented faithfully.
  - Add unit tests (golden fixtures) per rule.
- `apps/web`
  - Allow selecting Classic rulesets (at least in Playground/Match local).
  - Enforce legal-move constraints for Order/Chaos.
  - Optional UI: hide opponent cards for Three Open; show swap results.
  - Update strict allowlists for voting (if Classic rules are supported in stream mode).

### Out-of-scope (for this ExecPlan)

- Contract changes / on-chain settlement support.
- Breaking changes to transcript v1 format.
- Implementing Sudden Death as a single transcript (requires transcript v2 / session model).
- Draft / Random Hand deck-building protocolization (may be added later as event-mode features).

## 3) Non-negotiable constraints (Invariants)

- Determinism: No non-deterministic randomness in engine output.
- Backwards compatibility:
  - Existing `RulesetConfigV1` continues to work unchanged.
  - Existing replays continue to simulate identically.
  - `state_json v1` / `streamer_bus v1` evolve additively only.
- Avoid silent rule-id collisions: if Classic rules affect gameplay, they must be reflected in a distinct rulesetId algorithm/version.

## 4) Current State (What exists today)

- Engine capture assumes “attacker wins if aVal > dVal or tieBreak”; UI description helpers also assume this.
- Rulesets are currently `RulesetConfigV1` only (warning marks, combo bonus, traits, formations, etc.).
- Voting allowlist (`computeStrictAllowed`) assumes “any remaining card can be played in any empty cell”.

## 5) Proposed Design

### 5.1 Ruleset versioning

- Introduce `RulesetConfigV2` with `version: 2`.
  - Reuse all V1 fields (warning marks, combo, synergy/traits).
  - Add `classic` field (toggled rule flags + optional params).
- Add `computeRulesetIdV2` + `encodeRulesetConfigV2` with canonical ABI encoding.
- Keep `computeRulesetIdV1` unchanged.

### 5.2 Deterministic RNG

- Add `classic_rng.ts` implementing `seed0` and `randUint()` with domain separation tags.
- Use the same RNG for all Classic random choices:
  - Swap indices
  - Chaos per-turn card selection
  - Three Open revealed indices
  - Roulette selected rule (if implemented)

### 5.3 Engine semantics

- Order/Chaos: treat as **move validation** (transcript must match the deterministic selection), not as player choice.
- Swap: apply deck transformation at match start (before any turn), using deterministic indices.
- Reverse/AceKiller: modify comparison outcome; keep janken tie-break for equals.
- Plus/Same: implement a “special capture” phase after placement modifiers and before normal comparisons; seed chain flip queue with special-captured cards.
- Type Ascend/Descend: use `CardData.trait` as type, update a per-trait counter on placement only, apply as a modifier to all edges of cards with that trait.

### 5.4 Flip trace representation

- Extend flip trace with an additive field that explains *why* capture occurred (e.g., `winBy: "gt" | "lt" | "tieBreak" | "same" | "plus" | "aceKiller"`).
- Update UI helper `flipTraceDescribe.ts` to display captures correctly even when `aVal <= dVal`.

## 6) Implementation Steps (Milestones)

### Milestone A: Spec + types + RNG scaffolding

- Work:
  - Add/update docs: `docs/02_protocol/Nyano_Triad_League_CLASSIC_RULES_SPEC_v0_ja.md`.
  - Add `RulesetConfigV2` + codec + rulesetId.
  - Add deterministic RNG helper.
- Acceptance:
  - `pnpm -C packages/triad-engine test` passes.
  - `computeRulesetIdV1` outputs unchanged for existing rulesets.

### Milestone B: Order / Chaos / Swap

- Work:
  - Implement order/chaos card selection validation.
  - Implement swap deck transformation.
  - Add tests:
    - invalid transcript when cardIndex violates order/chaos
    - swap indices are deterministic from seed
- Acceptance:
  - Golden tests for deterministic card selection.

### Milestone C: Reverse / Ace Killer + trace refactor

- Work:
  - Implement compare function with reverse and ace killer override.
  - Extend flip trace and update UI description logic.
  - Add tests:
    - reverse capture uses `<`
    - ace killer 1 vs 10 behavior
- Acceptance:
  - Existing non-classic rulesets unchanged; UI still renders flip traces.

### Milestone D: Plus / Same

- Work:
  - Implement special capture evaluation after placement modifiers.
  - Ensure special-captured cards seed chain flip queue.
  - Add tests:
    - plus triggers on 2 matching sums
    - same triggers on 2 matching equals
    - combo (chain) can occur from special captures
- Acceptance:
  - Deterministic outcomes match expected fixtures.

### Milestone E: Type Ascend / Descend

- Work:
  - Maintain per-trait counters.
  - Apply modifier to all cards with that trait (hand + board).
  - Clamp edges.
  - Add tests:
    - ascend grows values (clamped)
    - descend reduces values but not below min
- Acceptance:
  - No performance regression beyond acceptable bounds.

### Milestone F: Web integration

- Work:
  - Add Classic rulesets to `apps/web/src/lib/ruleset_registry.ts`.
  - Restrict selectable card slots for Order.
  - For Chaos, optionally hide slot choice and show “random” card selection.
  - If stream voting supports Classic rules: update `computeStrictAllowed` to shrink legal moves.
- Acceptance:
  - `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build:web` pass.

## 7) Verification

### Commands

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build:web`

### Manual checks

- Engine:
  - Run unit tests and inspect a few golden fixtures.
- Web:
  - Playground match with Classic ruleset enabled.
  - Confirm Order restricts slot choice.
  - Confirm Reverse captures are displayed correctly.

## 8) Risks / Rollback

- Risks:
  - Trace/UI assumptions break when capture is no longer strictly `aVal > dVal`.
  - RulesetId collisions if V2 encoding is wrong.
  - Voting allowlist may diverge from engine legality when Order/Chaos active.
- Rollback:
  - Gate Classic rulesets behind a feature flag (or keep them out of default registry).
  - Keep V2 config and implementation isolated; remove registry exposure if needed.

## 9) Progress

- [x] A-1 Confirm spec semantics and edge-case interactions
- [x] A-2 Add RulesetConfigV2 + rulesetIdV2
- [x] A-3 Add classic_rng helper
- [x] B-1 Implement Order/Chaos validation
- [x] B-2 Implement Swap
- [x] C-1 Implement Reverse/AceKiller compare
- [x] C-2 Extend flip trace + update UI descriptions
- [x] D-1 Implement Plus/Same special captures
- [x] E-1 Implement Type Ascend/Descend
- [x] F-1 Web integration (allowlist follow-up tracked separately)

## 10) Decision Log

- 2026-02-14: Kept transcript format at v1 and implemented Classic randomness from `header.salt/playerA/playerB/rulesetId` only.
- 2026-02-14: Introduced `RulesetConfigV2` + `computeRulesetIdV2` while preserving existing `computeRulesetIdV1` behavior.
- 2026-02-14: Implemented Order/Chaos as strict move validation (engine), and mirrored legal-slot enforcement in Match UI.
- 2026-02-14: Added additive `FlipTraceV1.winBy` instead of replacing existing fields to keep streamer/state_json compatibility.

## 11) Surprises & Discoveries

- `node --test test/*.test.js` fails in this sandbox with `spawn EPERM`; single-file `node <test-file>` runs successfully for engine validation.
- `apps/web` build works when run directly (`pnpm.cmd -C apps/web build`) but `pnpm.cmd build:web` can fail with sandbox-dependent `spawn EPERM`.

## 12) Outcome / Retrospective

- Engine milestones A-E were implemented with dedicated Classic tests.
- Web integration milestone F is implemented (ruleset preset + Order/Chaos card-index enforcement + flip trace rendering updates).
- Remaining operational risk is environment-specific command spawning (`EPERM`) during full-suite automation in this sandbox.
