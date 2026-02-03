# commit-0010 Implementation Log（差分）

## Why
- “運営が消えても”公式戦が成立するには、提出時点で **勝敗がオンチェーンで再計算できる**必要がある。
- まずは最小の **Core+Tactics** をオンチェーンへ移植し、TS参照実装と一致させる土台を作る。

## What
- `TriadEngineV1.sol` を追加：Triad比較/じゃんけん/連鎖、警戒マーク、コンボボーナス
- `NyanoTriadLeague.sol` を更新：submitMatchV1 が settle まで行い、結果を保存しイベントを emit
- `IRulesetRegistry` を追加し、active ruleset のみ受付できるように（任意）
- Foundry テスト：Mock Nyano + 署名生成（vm.sign）で E2E を固定

## Verify
- `cd contracts && forge test`
- 追加：Synergy/Formation 未対応を明記し、earthBoostEdges は NONE 固定で revert すること
