# commit-0013-fix3 TODO update（差分）

## Done
- momentum（comboCount=3）unit test の transcript 形式を `TranscriptV1({header,turns})` に合わせ、`pnpm test` を再びグリーン化

## Next
- shared vectors に domination / fever / draw ケースを追加（退行検出力を最大化）
- combo bonus の適用順序（mark→bonus→compare 等）を spec に明文化（engine spec追記）
