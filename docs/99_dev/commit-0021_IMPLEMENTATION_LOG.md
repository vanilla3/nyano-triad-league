# commit-0021 — Implementation Log（差分）

## Why
- TriadEngineV2（Shadowのみ）を導入したが、League（決済入口）が v1 のみだと v2 をオンチェーンで確定できない。
- さらに、rulesetId に対して「どのエンジンで決済するか」を on-chain に固定しないと、
  第三者が “別エンジンで決済して有利な結果を確定する” 攻撃が成立する。

## What
- RulesetRegistry:
  - ruleset 登録時に `engineId` を必須化し、`engineOf(rulesetId)` を提供
- NyanoTriadLeague:
  - `submitMatchV2` を追加（TriadEngineV2で決済）
  - registry が設定されている場合、submitMatchV1/V2 それぞれで `engineId` の一致を強制
- Tests:
  - v2（Shadowが警戒マーク無視）ケースを League 経由で決済し、winner=B を確認
  - v2 ruleset を submitMatchV1 で決済しようとすると revert することを確認（攻撃封じ）
- Docs:
  - RulesetRegistry / On-chain settlement の仕様を現状に合わせて更新

## Verify
- `pnpm -C packages/triad-engine test`
- `cd contracts && forge test`
