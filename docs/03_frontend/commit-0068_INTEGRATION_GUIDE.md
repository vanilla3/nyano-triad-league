# commit-0068 Integration Guide

## 新規ファイル（2つ）

### 1. `apps/web/src/components/flipTraceDescribe.ts`
flipTrace を日本語テキストに変換するユーティリティ。
→ `apps_web_components/flipTraceDescribe.ts` を `apps/web/src/components/` にコピー

### 2. `apps/web/src/components/NyanoReaction.tsx`
Nyano のリアクションコンポーネント（glow / badge / 吹き出し）。
→ `apps_web_components/NyanoReaction.tsx` を `apps/web/src/components/` にコピー

## 変更ファイル（1つ）

### 3. `apps/web/src/pages/Match.tsx`
P0-1 / P0-2 / P1-1 / P1-2 の実装。旧ファイルを置き換え。
→ `apps_web_pages/Match.tsx` で `apps/web/src/pages/Match.tsx` を上書き

## 主な変更点サマリー

| 項目 | Before | After |
|---|---|---|
| 入力盤面 | `grid grid-cols-3` ボタン（Draft Moves内） | `BoardView`/`BoardViewRPG` に `selectableCells`/`onCellSelect` |
| RPG手札 | 通常UI（CardMini buttons） | `HandDisplayRPG`（`?ui=rpg` 時） |
| RPG結果 | `GameResultOverlay` | `GameResultOverlayRPG`（`?ui=rpg` 時） |
| RPGログ | `TurnLog` | `TurnLogRPG`（`?ui=rpg` 時） |
| レイアウト | Draft Moves + Turn Log（2 section） | Game Arena（1 section, 2 column） |
| flip説明 | badges のみ（英語記号） | badges + 日本語サマリー |
| Nyano反応 | なし | 自動リアクション（15種） |

## 依存関係

新規ファイルの import:
```ts
// Match.tsx に追加される import
import { NyanoReaction, type NyanoReactionInput } from "@/components/NyanoReaction";
import { flipTracesSummary, flipTracesReadout } from "@/components/flipTraceDescribe";
```

## 確認手順

```bash
pnpm -C apps/web dev
```

1. `/match` → デッキ選択 → Load Cards → 盤面クリックで cell 選択 → カード選択 → Commit
2. `/match?ui=rpg` → RPG テーマが全面適用されていること
3. flip 発生時 → 日本語サマリー + Nyano リアクション表示
4. 9手完了 → 結果オーバーレイ（RPG時は RPG版）
5. `/overlay` が正常に受信していること
