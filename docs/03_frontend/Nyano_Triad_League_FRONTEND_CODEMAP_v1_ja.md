# Nyano Triad League Frontend コードマップ v1 (JA)

このドキュメントは、フロント担当が「どこを見れば何が分かるか」を最短で把握できるように、
主要ページ・主要コンポーネント・データの流れを要点だけまとめたものです。

---

## 1. 技術スタック（apps/web）
- Vite + React + TypeScript
- Tailwind CSS（`tailwind.config.ts` / `src/index.css`）
- RPC: viem（Nyano NFT 読み取り）
- game engine: `@nyano/triad-engine`（off-chain で simulate / ruleset / transcript 生成）

---

## 2. “4画面”の役割（重要）
### `/match`（対局）
- **入力**：カードロード → 手番をコミット（9手で終局）
- **出力**：transcript / share URL / replay
- **UIの核**：盤面・手札・手番・フリップ演出・結果オーバーレイ

主な編集ポイント:
- `apps/web/src/pages/Match.tsx`
- 盤面表示: `apps/web/src/components/BoardView.tsx`
- 演出: `apps/web/src/components/BoardFlipAnimator.tsx`
- カード: `apps/web/src/components/CardMini.tsx`
- ログ: `apps/web/src/components/TurnLog.tsx`
- Nyano画像: `apps/web/src/components/NyanoImage.tsx`

### `/replay`（再生）
- **入力**：share URL / transcript JSON / event attempt
- **出力**：step 操作・結果バナー・共有
- **UIの核**：スクラブ・Auto Play・結果の常設表示

主な編集ポイント:
- `apps/web/src/pages/Replay.tsx`

### `/stream`（配信運用）
- **入力**：現在の state/transcript・投票開始/停止・合法手 allowlist
- **出力**：nyano-warudo へ `/v1/snapshots` 投稿（state_json / ai_prompt）
- **UIの核**：OPS HUD（hash/allowlist件数/投票残り/同期状況）

主な編集ポイント:
- `apps/web/src/pages/Stream.tsx`
- HUD: `apps/web/src/components/StreamOperationsHUD.tsx`

### `/overlay`（配信用オーバーレイ）
- **入力**：streamer_bus の publish state / snapshots
- **出力**：OBS に載せる表示（盤面・手・投票）
主な編集ポイント:
- `apps/web/src/pages/Overlay.tsx`

---

## 3. エンジン側（packages/triad-engine）
- `simulateMatchV1WithHistory(transcript, cards, ruleset)` が基本
- `boardHistory` と `turns: TurnSummary[]` を使って UI を作る
- `TurnSummary` には `flipCount/ comboEffect/ warningMark` 等が入る
- **flip理由の説明をするなら `FlipTraceV1` を turns に載せるのが最短**（※本コミットで追加）

主な編集ポイント:
- `packages/triad-engine/src/engine.ts`
- 型: `packages/triad-engine/src/types.ts`

---

## 4. UI改善の“勝ち筋”
- 盤面：置く/ひっくり返るの気持ちよさ（演出は短く、情報は明確に）
- ログ：何が起きたか（flipCount/理由/コンボ）を読める
- 配信：運用情報（allowlist/hash/timer）を常に見える位置へ
- Nyanoらしさ：画像は固定でも glow / バッジ / 吹き出しで反応を作れる
