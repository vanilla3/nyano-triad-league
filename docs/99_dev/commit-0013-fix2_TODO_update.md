# commit-0013-fix2 TODO update（差分）

## Done
- momentum（comboCount=3）の unit test を core+tactics vectors 互換の形に修正し、`pnpm test` を再びグリーン化

## Next
- shared vectors に domination / fever / draw ケースを追加（退行検出力を最大化）
- combo bonus の適用順序（mark→bonus→compare 等）を spec に明文化（engine spec追記）
