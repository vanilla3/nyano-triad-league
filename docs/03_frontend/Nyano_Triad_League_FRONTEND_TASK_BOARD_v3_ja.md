# Nyano Triad League Frontend タスクボード v3 (JA)

v2 → v3 の更新:
- **ScoreBar** を /match /replay に追加（進行と優勢が即わかる）
- **flipTraces の UI 表示基盤**（TurnLog に badges + 詳細パネル）を追加  
  → “説明できる対戦” と “配信で盛り上がる” の土台

---

## Done（直近で完了）
- [x] /replay: Auto Play + speed（play/pause）
- [x] engine: TurnSummary に flipTraces を出力
- [x] /match & /replay: `ui=rpg` で BoardViewRPG を試せるように（既存UIと共存）
- [x] /match & /replay: ScoreBar（tiles と進行）を表示
- [x] TurnLog: flipTraces を badges/詳細として表示

---

## P0（ゲームとして “遊べる” を固める）
### P0-1: /match の入力盤面を BoardView 系に統一
- 目的: UI違い（通常/RPG）に関係なく、入力経路を一本化して事故を減らす
- 受け入れ条件:
  - selectableCells のみクリック可能
  - 置いた/ひっくり返ったが明確

### P0-2: /match?ui=rpg のページ全体を RPG へ（手札/ログ/結果）
- 対象: `HandDisplayRPG / TurnLogRPG / GameResultOverlayRPG`
- 受け入れ条件:
  - 9手の対局が最後まで遊べる
  - 既存UI（uiなし）を壊さない

---

## P1（“観戦/配信で面白い” へ）
### P1-1: flipTraces を “日本語/視覚” で噛み砕く
- 目的: 「なぜそうなった？」を一瞬で理解できる
- 例: `↑ 7>6` / `= (janken)` / `(chain)` を説明文に変換して表示

### P1-2: Nyano 反応（表情差分なし）
- glow / badge / ひとこと吹き出しで成立させる
- FEVER: 🔥, chain: ✦, 優勢: ✨, 劣勢: 💧 など

---

## P2（配信連携: nyano-warudo）
### P2-1: 投票開始時点でも state_json を送る（strictAllowed をフル活用）
- 目的: “荒れない視聴者参加” を実現

### P2-2: 視聴者提案フォーマット確定（正規表現 + UI例）
- 例: `#triad A2->B2` を固定化
