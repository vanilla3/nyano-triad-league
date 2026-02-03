# Nyano Triad League — Ruleset Registry 仕様（v1 / Draft）

## 目的
- コミュニティが ruleset を提案し、**同じルール=同じ rulesetId** で参照できるようにする
- “運営が消えても”第三者が league / UI / indexer を作れるようにする
- **重要**：ruleset は「どのオンチェーン決済エンジンで検証されるか（engineId）」を宣言し、
  “別エンジンでの不正決済” を防ぐ

## v1（現状）
- `RulesetRegistry.sol`
  - `register(rulesetId, configHash, engineId, uri)`
  - balance-gated: proposer は Nyano を1体以上保有している必要がある（簡易スパム抑止）
  - `setActive(rulesetId, active)` は proposer のみ
  - `engineOf(rulesetId)` で engineId を取得できる
- 将来：ステーキング/投票に置き換える

## engineId の意味（暫定）
- `1`: `TriadEngineV1`（Core + Tactics）
- `2`: `TriadEngineV2`（Core + Tactics + Shadowが警戒マークを無視）
- `>=3`: 将来拡張（Synergy/Formation/Season などを段階導入）

## フィールド（RulesetInfo）
- proposer: 提案者
- createdAt: 登録時刻
- active: 有効/無効
- configHash: オフチェーン ruleset 定義（canonical bytes）のハッシュ（任意）
- engineId: オンチェーン決済エンジン識別子（必須）
- uri: 人間向け仕様書（IPFS/HTTPS）

## セキュリティ要点
- League 側は `submitMatchV1/V2` の入り口ごとに
  `rulesetRegistry.engineOf(rulesetId) == 期待engineId` を検証する（registry が設定されている場合）
- これにより「プレイヤーが署名した rulesetId を、第三者が違うエンジンで決済してしまう」事故を抑止できる
