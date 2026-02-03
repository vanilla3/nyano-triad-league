# commit-0023 — Implementation Log（差分）

## Why
- “運営がいなくなっても回る”には、コミュニティが **公式 rulesetId / engineId** を機械的に再現できる必要がある。
- 生成 JSON に毎回タイムスタンプが入ると差分が出やすく、共有・コミット運用が煩雑になる。
- よって、
  - レポ内に「公式 ruleset package のスナップショット」を同梱
  - triad-engine の計算結果と一致することをテストで固定
  - スクリプトは `--out` で安定出力（timestamp無し）
  の形にする。

## What
- `rulesets/official_onchain_rulesets.json` を追加（安定スナップショット）
- triad-engine テストを追加し、スナップショットと `computeRulesetIdV1` の一致を固定
- `scripts/print_official_onchain_rulesets.mjs` を更新：
  - `--out` 既定で timestamp を省略（安定出力）
  - `--with-timestamp / --no-timestamp / --stable` を追加
- 仕様書を更新：`Nyano_Triad_League_RULESET_PACKAGE_SPEC_v1_ja.md`

## Verify
- `pnpm -C packages/triad-engine test`
- `node scripts/print_official_onchain_rulesets.mjs --out rulesets/official_onchain_rulesets.json`
