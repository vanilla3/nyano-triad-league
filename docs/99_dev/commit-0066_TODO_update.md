# commit-0066 TODO update

## Done
- [x] RPGテーマファイルを追加（CSS + BoardViewRPG）
- [x] /match と /replay に ui=rpg スイッチを追加（既存UIと共存）
- [x] Tailwind の extend に RPGトークンを追加（任意）

## Next (P0)
- [ ] /match?ui=rpg の “手札/ログ/結果” もRPG版へ統合（HandDisplayRPG / TurnLogRPG / GameResultOverlayRPG）
- [ ] 入力盤面を BoardView 系に寄せる（selectableCells/onCellSelect を利用）
- [ ] /overlay の盤面も BoardViewRPGMini へ差し替え（ui=rpg 時のみでも可）

## Next (P1)
- [ ] ScoreBar 常設
- [ ] flipTraces を TurnLog に表示（配信で説明できるログへ）
- [ ] Nyanoの反応（表情差分なし）を演出で補完
