# commit-0018-fix1 — Implementation Log（差分）

## Why
- 追加した不変条件テスト `earth_boost_edges_invalid.test.js` が失敗（throw しない）。
- 原因：TS参照エンジンが `earthBoostEdge` を **レンジ検証（0..3/255）** しかしておらず、
  `ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1`（オンチェーン互換サブセット）であっても **非255を拒否していなかった**。
- 一方、Solidity の on-chain engine は `earthBoostEdges[turn] == 0xff` を require しており、
  TS↔Solidity の parity が崩れていた。

## What
- `RulesetConfigV1` にエンジン専用フラグ `onchainSettlementCompat?: boolean` を追加。
- `ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1` に `onchainSettlementCompat: true` を設定。
- `simulateMatchV1` で `validateTranscriptForRuleset` を実行し、オンチェーン互換モードでは以下を強制：
  - `firstPlayer = playerA`
  - `earthBoostEdge` は全turnで NONE(255) のみ（非255は throw）

## Verify
- `pnpm -C packages/triad-engine test`（earth_boost_edges_invalid が green）
- `cd contracts && forge test`
