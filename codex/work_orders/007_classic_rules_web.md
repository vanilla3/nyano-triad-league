# Work Order: 007 Classic Rules (Web/UI)

## Summary

Expose the new Classic Rules (added in WO006) in `apps/web` so players can actually use them.

This work order focuses on **Playground/local match usability** first, and keeps protocol/URL compatibility.

## Primary references

- Spec draft: `docs/02_protocol/Nyano_Triad_League_CLASSIC_RULES_SPEC_v0_ja.md`
- ExecPlan: `codex/execplans/006_classic_rules.md`

## Goals

1. Add at least one Classic ruleset preset to `apps/web` so the feature is discoverable.
2. Ensure gameplay UX is correct for rules that constrain card choice:
   - Order: only the next-in-order slot is selectable.
   - Chaos: slot selection is either disabled or auto-selected to the deterministic choice.
3. (Optional but recommended) Add UI behavior for information-only rules:
   - All Open / Three Open: hide opponent cards appropriately.
   - Swap: show the post-swap deck in UI (or at least indicate swap happened).
4. Keep existing match/replay pages working.

## Non-goals

- Stream voting / Warudo strict allowlist correctness for Classic rules (do only if low risk).
- Sudden Death / Draft / Roulette.

## Requirements

- Must not break existing routes, URL params, and replay share.
- `state_json v1` and `streamer_bus v1` must remain compatible (additive changes only).
- TypeScript build must stay green.

## Suggested approach

- Add a new ruleset key (or a “Custom Classic” builder) in `apps/web/src/lib/ruleset_registry.ts`.
  - Minimal acceptable: add a preset like `classic_plus_same`.
  - Preferred: add a simple checkbox panel in Playground to build a `RulesetConfigV2` at runtime.
- Ensure `Match.tsx` turn input enforces Order/Chaos cardIndex selection so transcripts remain valid.

## Files likely to change

- `apps/web/src/lib/ruleset_registry.ts`
- `apps/web/src/pages/Playground.tsx`
- `apps/web/src/pages/Match.tsx`
- `apps/web/src/pages/Replay.tsx`
- `apps/web/src/components/flipTraceDescribe.ts` (if flip traces now include new `winBy/cause`)
- (Optional) `apps/web/src/lib/triad_vote_utils.ts`

## Verification

Run:

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

Manual:

- Playground: start a match with Classic ruleset, confirm Order/Chaos behave as expected.
- Replay: load a replay generated with Classic ruleset; ensure it replays correctly.
