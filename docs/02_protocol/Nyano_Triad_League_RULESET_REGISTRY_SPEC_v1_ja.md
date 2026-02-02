# Nyano Triad League — Ruleset Registry 仕様（v1 / Draft）

## 目的
- コミュニティが ruleset を提案し、**同じルール=同じ rulesetId** で参照できるようにする
- “運営が消えても”第三者が league / UI / indexer を作れるようにする

## v1（本コミット）
- `RulesetRegistry.sol`
  - `register(rulesetId, configHash, uri)`
  - balance-gated: proposer は Nyano を1体以上保有している必要がある（簡易スパム抑止）
  - `setActive(rulesetId, active)` は proposer のみ
  - 将来：ステーキング/投票に置き換える

## フィールド
- proposer / createdAt / active
- configHash：canonical bytes の hash（任意）
- uri：仕様書（IPFS等）への参照（任意）
