---
# commit-0020 TODO update（差分）

## Done（commit-0020）
- Synergy を段階導入するための v2 の土台を追加
  - `TriadEngineV2`（Shadow の警戒マーク無視のみ）
  - v2 共有テストベクタ + 生成テスト（TS / Solidity）
  - ドキュメント更新（共有ベクタの運用に v2 を追加）

## Next（commit-0021）
- League 側に v2 settlement を接続（`submitMatchV2` の追加、もしくは engineId で分岐）
- v2 ルールセットの登録/運用方針を固める（RulesetRegistry に “engine互換” を持たせるかどうか）
- 次の段階導入候補（優先順）
  - Light の eclipse（warning 無効の条件が deck 依存）
  - Forest の shield（1回だけ反転無効）
  - Cosmic の corner triadPlus（盤面位置依存）
