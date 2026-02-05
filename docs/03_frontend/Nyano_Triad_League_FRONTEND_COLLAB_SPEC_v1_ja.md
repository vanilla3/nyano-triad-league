# Nyano Triad League Frontend Collaboration Spec v1 (JA)

このドキュメントは、第三者（フロント担当者）に UI/UX 改善を依頼する際に、
**どこをどう渡すと編集しやすいか**／**どこを触ると危険か**を明確化するための仕様です。

---

## 1. まず渡すべきもの（最小セット）

フロント改善だけを依頼する場合でも、相手が迷わず再現できるように以下は必須です。

### ✅ 必須
- リポジトリ全体（推奨）
  - `apps/web` だけ渡すと、`@nyano/triad-engine` の参照や protocol docs が欠けやすい
- 仕様ドキュメント
  - `docs/01_product/*`（配信・nyano-warudo 連携）
  - `docs/02_protocol/samples/*`（state_json / transcript / viewer command サンプル）
- UI ガイド（考え方）
  - `docs/03_frontend/UI_ANALYSIS.md`（良いUIの分解フレームワーク）

### ✅ あると早い（推奨）
- `apps/web/src/pages/Stream.tsx` のスクリーンショット（現状の Stream Studio）
- `/match` と `/overlay` のスクショ（before/after が作りやすい）
- 「このPRで直したい」箇所の優先度メモ（後述の Work Pack に沿うと速い）

---

## 2. 開発環境（フロント担当者向け）

### 前提
- Node.js（LTS 推奨）
- pnpm

### よく使うコマンド
```bash
pnpm i
pnpm -C apps/web dev
pnpm -C apps/web build
```

---

## 3. フロントの構造（どこを触るか）

### Pages（画面単位）
- `apps/web/src/pages/Match.tsx`
  - プレイ画面（人間同士 / 将来AI Nyano）
  - `stream=1` のとき overlay bus へ state を publish する
- `apps/web/src/pages/Stream.tsx`
  - 配信オペレーション画面（投票、viewer command、nyano-warudo bridge、サンプルDL）
- `apps/web/src/pages/Overlay.tsx`
  - OBS で載せるオーバーレイ（情報は段階的に開示する設計）
- `apps/web/src/pages/Replay.tsx`
  - transcript を基に再生する画面

> 依頼する UI 作業の多くは Pages か Components に閉じるのが理想です。

### Components（見た目・表示部品）
- `apps/web/src/components/*`
  - `BoardView` / `CardMini` / `TurnLog` / `Toast` / `NyanoImage` など
- 原則
  - **見た目（presentational）**を components に寄せる
  - **状態（stateful）**や protocol 組み立ては pages / lib に寄せる

### Lib（プロトコル/連携の中枢）
- `apps/web/src/lib/streamer_bus.ts`
  - overlay state の publish / subscribe
- `apps/web/src/lib/nyano_warudo_bridge.ts`
  - `POST /v1/snapshots` の送信（AI prompt / state_json）
- `apps/web/src/lib/nyano_assets.ts`
  - Nyano の画像URLなどブランドアセット

---

## 4. 触っていいところ / 触ると危険なところ

### ✅ 触っていい（UI改善が目的なら積極的に）
- `apps/web/src/components/*` の追加・改修
- `apps/web/src/pages/*` のレイアウト・見た目（ただし protocol 出力は壊さない）
- Tailwind クラス・余白・タイポグラフィ・カード設計
- Nyano のアート表現（背景・ヒーロー帯・吹き出し等）

### ⚠️ 触ると危険（事前相談推奨）
- **state_json v1 の schema**
  - `protocol: "triad_league_state_json_v1"` は固定
  - `legalMoves` / `strictAllowed` は nyano-warudo strictAllowed の根幹
- **viewer command の canonical 形式**
  - 基本: `#triad A2->B2 wm=C1`（wmは任意）
- `streamer_bus` の state 形状（Overlay/Stream/Match の結節点）
- `contracts/` と `packages/triad-engine` の仕様変更（UI担当だけで触ると破綻しやすい）

---

## 5. UI改善の依頼の出し方（Work Pack）

他人が動きやすいように、修正依頼は “面” で渡すのがコツです。

### WP-A: Nyanoらしい見た目（ブランド化）
- Nyano画像の常設（ヘッダー/ヒーロー/空状態）
- 背景・カード・タイポの統一
- “かわいい” と “読みやすい” の両立（視認性 > 装飾）

### WP-B: Match（プレイ画面）のゲーム感
- ターンの強調、勝敗の見せ方
- 盤面アニメ（flip、chainの短い演出）
- ルール/効果の要約表示（理由バッジのUI化）

### WP-C: Stream（配信画面）の運用性
- 投票の視認性（残り時間、allowlist件数、hash）
- エラー時の表示（CORS/送信失敗/未接続）
- “今どこが問題か” が3秒で分かる情報設計

### WP-D: Overlay（OBS）の見やすさ
- 視聴者は情報過多に弱いので、段階的開示を徹底
- controls=0 は簡潔、controls=1 は配信者用詳細

---

## 6. PR/コミット運用（依頼時のチェックリスト）

第三者に依頼する場合、最低限この形式に寄せると事故が減ります。

### PR の提出物
- 変更点のスクショ（before/after）
- 影響範囲（どのページ、どのコンポーネント）
- 動作確認（`pnpm -C apps/web build`）

### 禁止に近いもの
- schema を破壊する変更（field削除、型変更、protocol文字列変更）
- “見た目”のために runtime error を許容する変更

---

## 7. 連絡事項（仕様の中心）

- **Nyano-warudo 連携**
  - `POST /v1/snapshots`
  - `kind: "ai_prompt" | "state_json"`
  - 投票開始で state_json を送るのが推奨（strictAllowed を活かす）

- **視聴者提案のコマンド**
  - canonical: `#triad A2->B2 wm=C1`
  - 揺れ吸収: unicode矢印 / 空白区切り / 順序入替（例: `#triad 3 B2`）
