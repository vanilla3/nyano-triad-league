# Nyano Triad League Frontend タスクボード v4 (JA)

更新: 2026-02-06  
前提: commit-0071 を取り込んだ状態（vote start の state_json 自動送信まで反映済み）

---

## Done（済）
- [x] P0-1: /overlay 視認性改善（HUD: turn/tiles/flip理由/strictAllowed/vote + NyanoReactionBadge）
- [x] /replay: Auto Play + speed（play/pause）
- [x] engine: TurnSummary に flipTraces を付与
- [x] /match & /replay: `ui=rpg` で BoardViewRPG を試せる
- [x] /match & /replay: ScoreBar（tiles と進行）
- [x] TurnLog: flipTraces の表示基盤（badges + 詳細パネル）
- [x] /match: 入力盤面を BoardView/BoardViewRPG に統一（selectableCells/onCellSelect）
- [x] /match?ui=rpg: Hand/Log/Result もRPG UIへ
- [x] flipTraces 日本語化ユーティリティ（配信 readout を含む）
- [x] Nyano Reaction（glow/badge/吹き出し）

---

## P0（済：配信/運用の土台）
### P0-1: /overlay 視認性改善（DONE）
- 進行: turn/tiles を常設表示
- 理由: flipTracesReadout で “なぜ” を表示
- 投票: strictAllowed 件数 + hash + 残り秒 + 同期状態
- NyanoReactionBadge を overlay へ追加

受け入れ条件:
- OBSに貼っても情報が潰れない（スマホ視聴でも判読可能）
- 投票中に “荒れない” 仕組み（allowlistの見える化）がある

---

## P1（観戦で面白くする）
### P1-1: TurnLog を日本語説明に寄せる
- badges: flipTraceShort()
- 詳細: flipTraceFull()
- summary: flipTracesSummary() を turn header に表示

### P1-2: /replay に NyanoReaction を再現
- stepに応じた反応（fever/chain/advantageなど）を表示

---

## P2（nyano-warudo / Twitch）
### P2-1: 投票開始時点でも state_json を送る（DONE / strictAllowedをフル活用）
- “投票開始の瞬間” に state_json（allowlist）を送ることで、投票中の strictAllowed がズレにくくなる
- `/stream` の Nyano Warudo Bridge に `vote start → state_json` を追加（既定ON、設定はlocalStorageに保持）

### P2-2: 視聴者提案フォーマット固定
- 例: `#triad A2->B2`（座標式）
- 正規表現/表示/集計/エラー文言を一貫させる

---

## 依頼しやすい作業単位（協力者向け）
- UI/CSSだけで完結: P0-1 overlay視認性、P1-2 replay演出
- 型/engine理解が必要: P1-1 flipTracesの日本語統合
- 配信連携はPRを小さく: P2は “送信タイミング1箇所” から
