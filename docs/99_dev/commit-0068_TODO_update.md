# commit-0068 TODO update

## Done
- [x] P0-1: /match 入力盤面を BoardView / BoardViewRPG へ統一（selectableCells/onCellSelect）
- [x] P0-2: RPG UI をページ全体へ（HandDisplayRPG / TurnLogRPG / GameResultOverlayRPG）
- [x] P1-1: flipTraces の説明文を "短い日本語" へ（配信で読み上げやすく）
- [x] P1-2: Nyano反応（glow/badge/吹き出し）— 15種のリアクション自動判定
- [x] Match Setup を collapsible に（cards 読込後は自動で折り畳み）
- [x] AI debug notes を details/summary で折り畳み

## Done (previous)
- [x] ScoreBar: /match & /replay
- [x] TurnLog: flipTraces badges + detail panel
- [x] engine: flipTraces を TurnSummary に付与
- [x] /replay: Auto Play + speed（play/pause）
- [x] /match & /replay: `ui=rpg` で BoardViewRPG を試せるように（既存UIと共存）

## Next (P0 残り)
- [ ] /overlay の視認性改善（flip理由/進行/allowlist件数など）
  - flipTraceDescribe.ts の `flipTracesReadout()` を overlay に適用
  - NyanoReactionBadge を overlay に追加

## Next (P1)
- [ ] flipTraceFull() を TurnLog の詳細パネルへ統合（badges の横に日本語説明）
- [ ] /replay にも NyanoReaction を追加（step 毎のリアクション再現）
- [ ] Nyano反応のタイミング調整（flip animation 完了後に表示）

## Next (P2: 配信連携)
- [ ] 投票開始時点でも state_json を送る（strictAllowed をフル活用）
- [ ] 視聴者提案フォーマット確定（正規表現 + UI例）
- [ ] Twitch chat の `#triad` を受けて vote に反映
