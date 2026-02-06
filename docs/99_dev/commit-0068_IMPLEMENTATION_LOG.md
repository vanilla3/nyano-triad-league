# commit-0068 IMPLEMENTATION LOG

## Summary
- **P0-1**: /match の入力盤面を BoardView / BoardViewRPG へ統一（selectableCells/onCellSelect）
- **P0-2**: `?ui=rpg` でページ全体を RPG 化（HandDisplayRPG / TurnLogRPG / GameResultOverlayRPG）
- **P1-1**: flipTraces の説明文を短い日本語で表示（`flipTraceDescribe.ts`）
- **P1-2**: Nyano リアクション表示（`NyanoReaction.tsx`）— glow/badge/吹き出し

## Why
### P0-1: 入力盤面の統一
- 旧: Draft Moves に粗い `grid grid-cols-3` ボタン + Turn Log に表示専用 BoardView → 2つの盤面が存在
- 新: 1つの BoardView/RPG が入力と表示を兼務。selectableCells で空きセルをハイライト、onCellSelect でクリック入力
- 効果: 操作が直感的になり、"置く → ひっくり返る" の体験が一画面で完結

### P0-2: RPG UI 全体化
- 旧: `?ui=rpg` で盤面だけ RPG、手札/ログ/結果は通常 UI → 統一感なし
- 新: HandDisplayRPG / TurnLogRPG / GameResultOverlayRPG を使い、ページ全体をダークRPG
- 背景色も `#0A0A0A` に変更、ボタン類も `.rpg-result__btn` を使用

### P1-1: flipTraces 日本語
- `flipTraceDescribe.ts` に3レベルの説明関数:
  - `flipTraceShort()`: badges 用（例: `↑ 7>6 じゃんけん勝ち`）
  - `flipTraceFull()`: TurnLog 詳細用（例: `B2→A2: 上方向 7>6 で奪取`）
  - `flipTracesSummary()`: ターン全体要約（例: `2枚奪取（連鎖1・じゃんけん1）`）
  - `flipTracesReadout()`: 配信読み上げ用

### P1-2: Nyano リアクション
- `NyanoReaction.tsx`: ゲームイベントから自動判定 → emoji + badge + 吹き出し表示
  - 15種の反応: idle/flip_single/flip_multi/chain/fever/momentum/domination/warning_triggered/advantage/disadvantage/draw_state/victory/defeat/game_draw
  - RPG / 通常の両スタイル対応
  - 3.2秒で自動フェードアウト
  - `NyanoReactionBadge`: overlay 用のコンパクト版

## Changes

### New Files
| File | Purpose |
|---|---|
| `apps_web_components/flipTraceDescribe.ts` | flipTrace の日本語変換ユーティリティ |
| `apps_web_components/NyanoReaction.tsx` | Nyano リアクションコンポーネント |

### Modified Files
| File | Changes |
|---|---|
| `apps_web_pages/Match.tsx` | P0-1: 入力盤面統一, P0-2: RPG全体化, P1-1/P1-2 統合, レイアウト再構成 |

## Match.tsx 構造変更の詳細

### Before（旧レイアウト）
```
section: Hero
section: Event
section: Match (settings + load)
section: Draft Moves
  ├─ grid grid-cols-3 (crude cell buttons)  ← 入力用の粗いUI
  ├─ Warning mark selector
  ├─ Card selection buttons
  └─ Commit/Undo
section: Turn Log
  ├─ ScoreBar
  ├─ BoardView / BoardViewRPG (display only) ← 表示専用
  ├─ LastMoveFeedback
  ├─ Winner info
  └─ TurnLog component
```

### After（新レイアウト）
```
section: Hero
section: Event
section: Match Setup (collapsible — cards読込後は折り畳み)
section: Game Arena (unified)
  ├─ Left Column
  │   ├─ ScoreBar
  │   ├─ Interactive BoardView / BoardViewRPG  ← 入力+表示を兼務
  │   ├─ LastMoveFeedback
  │   ├─ Flip Summary (日本語)
  │   ├─ NyanoReaction
  │   ├─ Hand Display (RPG or standard)
  │   ├─ Warning mark + Commit/Undo
  │   └─ Error display
  └─ Right Column
      ├─ TurnLog / TurnLogRPG
      ├─ Winner / match info
      ├─ Share buttons
      └─ AI debug notes (collapsible)
```

## 安全性
- **state_json v1 schema**: 変更なし（protocol 出力は壊していない）
- **viewer command**: 変更なし
- **streamer_bus**: state 形状変更なし
- **engine**: 変更なし（flipTraces の読み取りのみ）
- **overlay**: publish する overlay state の構造は維持

## Verify
1. `pnpm -C apps/web dev` → `/match` で対局が最後まで遊べること
2. `?ui=rpg` で RPG テーマが全体に適用されること
3. flip 発生時に日本語サマリーが表示されること
4. Nyano リアクションが表示・フェードアウトすること
5. 既存 UI（`ui` パラメータなし）が壊れていないこと
6. `/overlay` への state publish が正常であること
