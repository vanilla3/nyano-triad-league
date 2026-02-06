# Nyano Triad League Frontend タスクボード v2 (JA)

v1 から更新点:
- RPGテーマ（BoardViewRPG）を “壊さずに試せる” 形で統合したため、後続のタスクを追加。
- 配信（nyano-warudo）とゲーム感の両輪で優先度を付け直し。

---

## P0（今すぐ / 影響大・壊れやすいので小刻みに）

### P0-1: RPGテーマを “ページ全体” に拡張
- 現状: `ui=rpg` で盤面表示だけ差し替え
- 目標: `/match?ui=rpg` の時に
  - 手札: `HandDisplayRPG`
  - 結果: `GameResultOverlayRPG`
  - ログ: `TurnLogRPG`
  を一体として使い、レイアウトも暗背景前提に整える
- 受け入れ条件:
  - 9手の通常対局が最後まで遊べる（入力〜結果〜replay）
  - 既存UI（uiなし）を壊さない

### P0-2: “入力盤面” を BoardView 系に統一
- 現状: Match の入力UIが BoardView 以外で構成されている
- 目標: 入力盤面も BoardView / BoardViewRPG 側へ寄せる（クリック処理と selectableCells を利用）
- 受け入れ条件:
  - 置けるマスだけが反応
  - 置いた/ひっくり返ったが分かる（既存アニメも維持）

---

## P1（ゲーム体験を“ゲーム”へ）

### P1-1: ScoreBar（常設） + 進行UI（Turn 1/9）
- /match /replay に常設し “今の優勢” を一瞬で分かるように

### P1-2: Flip理由の可視化（flipTraces）
- `TurnSummary.flipTraces` は engine から出力済み  
- UI側で “なぜひっくり返ったか” を短文で表示（配信向け）

### P1-3: Nyanoの反応（表情差分なしで成立）
- glow / badge / ひとこと吹き出し で “Nyanoが生きている感”
- 例: FEVER中は🔥、勝勢は✨、負勢は💧 など

---

## P2（配信連携・運用）

### P2-1: state_json を投票開始時点でも送る（strictAllowedを生かす）
- nyano-warudo 側の荒れ防止のため、開始時に allowlist を確定して送る

### P2-2: 視聴者提案フォーマット確定（正規表現 + UI例）
- `#triad A2->B2` のような形式を固定し、UIに例として常設

---

## 依頼しやすい作業単位（外注/協力者向け）
- UIのみ（CSS/コンポーネント）で完結するもの: P1-1 / P1-3
- 型/engine理解が必要だが安全に切れるもの: P1-2
- 配信連携は実装範囲が広いので P2 は小さくPRを分ける
