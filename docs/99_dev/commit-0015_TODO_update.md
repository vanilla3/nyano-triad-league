# commit-0015 TODO update（差分）

## Done（commit-0015）
- 警戒マーク使用回数上限（各プレイヤー最大3回）を TS/Solidity 両方で不変条件テスト化

## Next（commit-0016）
- shared vectors に「警戒マークが実際に踏まれたターンで debuff→反転防止→次ターンで失効」を含むケースを追加（タイミングの退行検出）
- Fever の “次手効果（warning mark 無視）” が意味を持つ拡張フォーマット案を v2 として切り出し、仕様/ベクタを分離（4x4等）
