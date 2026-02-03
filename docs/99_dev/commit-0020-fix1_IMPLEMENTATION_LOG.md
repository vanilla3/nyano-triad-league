# commit-0020-fix1 — Implementation Log（差分）

## Why
- `pnpm -C packages/triad-engine test` が TypeScript の構文エラーで失敗。
- 原因は `ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1` の object literal が `};` で閉じられておらず、
  続く `export const ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2` が「オブジェクトのプロパティ」として解釈されていたため。

## What
- `packages/triad-engine/src/engine.ts` を修正：
  - `ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1` の末尾に `};` を追加し、トップレベルの構文を復旧

## Verify
- `pnpm -C packages/triad-engine test`
