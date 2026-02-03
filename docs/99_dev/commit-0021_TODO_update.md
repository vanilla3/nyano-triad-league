# commit-0021 TODO update（差分）

## Done（commit-0021）
- RulesetRegistry に engineId を追加（rulesetId -> engine を固定）
- NyanoTriadLeague に submitMatchV2 を追加し、engineId ミスマッチ決済をブロック
- League 経由で v2（Shadow無視）ケースの決済テストを追加

## Next（commit-0022）
- v2 ruleset の “canonical ruleset bytes” と `configHash` の生成手順をドキュメント化
  - ルールの改変耐性（誰が見ても同じ rulesetId）を強化
- v2 を League / UI で扱うための最小 API 設計
  - submitMatch の統合入口（engineId による分岐）を用意するか検討
- Synergy 次段階（v3候補）を 1 要素だけ追加し、必ず shared vectors 化
