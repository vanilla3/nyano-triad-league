# Work Order: 006 Classic Rules (Engine)

## Summary

Add an experimental “Classic Rules” pack inspired by FFXIV Triple Triad extra rules to `packages/triad-engine`.

The goal is to introduce new match rule modifiers **without breaking determinism, replayability, or existing protocol v1 behavior**.

This work order is **engine-only** (web integration comes in WO007). It should leave the monorepo in a green state.

## Primary references

- Spec draft: `docs/02_protocol/Nyano_Triad_League_CLASSIC_RULES_SPEC_v0_ja.md`
- ExecPlan: `codex/execplans/006_classic_rules.md`
- External rule descriptions: https://llenn-diary.com/tripletriad_rule/

## Goals

1. Introduce a versioned ruleset config that can encode Classic rule toggles.
2. Implement deterministic RNG for Classic rules.
3. Implement engine semantics for the following rules:
   - Order, Chaos, Swap
   - Reverse, Ace Killer
   - Plus, Same
   - Type Ascend, Type Descend (using `CardData.trait` as type)
4. Add unit tests (golden fixtures) per rule.

## Non-goals (explicitly out of scope)

- Contract changes / on-chain settlement.
- Transcript v1 format changes.
- Sudden Death and Draft (can be sketched, but not implemented here).
- Web UI changes (handled in WO007).

## Requirements

### Determinism

- Any randomness must be derived deterministically from transcript header values (see spec’s RNG section).
- Engine output must be stable across runs.

### Backward compatibility

- `RulesetConfigV1` behavior must remain identical.
- Existing tests and replays must continue to work.
- Any new fields added to exported JSON-ish shapes (e.g. flip traces) must be additive/optional.

### Rule semantics (must match the spec)

- Order/Chaos: validate transcript `cardIndex` against the rule’s deterministic selection.
- Swap: apply deck transformation before turn 0.
- Reverse/AceKiller: affect comparison outcome; keep janken tie-break for equals.
- Same/Plus: special capture phase; special-captured cards must seed chain flips.
- Type ascend/descend: placement-based counter per trait; affects both hands + board; clamp edges.

## Suggested implementation notes

- Prefer introducing `RulesetConfigV2` (`version: 2`) rather than mutating V1.
- Add `encodeRulesetConfigV2` + `computeRulesetIdV2`.
- Add a small helper module for deterministic RNG (domain-separated).
- Extend flip trace with an optional field like `winBy`/`cause` so reverse and special captures can be represented without lying about `aVal`/`dVal`.
  - Keep existing fields intact.

## Files likely to change / add

- `packages/triad-engine/src/types.ts`
- `packages/triad-engine/src/ruleset_codec.ts` (or new `ruleset_codec_v2.ts`)
- `packages/triad-engine/src/ruleset_id.ts`
- `packages/triad-engine/src/engine.ts`
- `packages/triad-engine/src/__tests__/...` (new tests)
- `packages/triad-engine/src/classic_rng.ts` (new)

## Verification

Run:

- `pnpm -C packages/triad-engine test`
- `pnpm -C packages/triad-engine lint`
- `pnpm -C packages/triad-engine typecheck`

Additionally ensure repo-level checks still pass:

- `pnpm test`
- `pnpm typecheck`

## Deliverables

- Engine implements Classic rules listed above.
- Comprehensive tests per rule.
- No behavior change for existing rulesets.
