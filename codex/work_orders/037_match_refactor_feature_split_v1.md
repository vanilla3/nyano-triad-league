# WO-037: Match Refactor (Feature Split) v1

## ゴール

`apps/web/src/pages/Match.tsx` は機能が集中しすぎており、
UI改善・ルール追加・不具合修正のたびに事故りやすい。

そこで **挙動を変えずに**、
- 責務分離
- 再利用性
- テスト容易性
を上げ、今後の拡張性を確保する。

## 重要な制約

- ゲームロジックの結果が変わる改変は禁止（乱数/AI/ルール）
- URLパラメータ互換性を壊さない
- リファクタ後に lint/build/e2e を必ず通す

## 現状の問題（観察）

- Match.tsx が巨大で、UIと状態管理と副作用が混在
- Mint UI と legacy UI の分岐が多い
- 演出（VFX/SFX）とゲーム進行が近接しすぎている

## 分割案（推奨）

`apps/web/src/features/match/` を新設し、以下へ移す。

- `features/match/hooks/`
  - `useMatchUrlParams.ts`（URL→設定）
  - `useMatchEngine.ts`（triad-engineとの接続）
  - `useMatchSfx.ts`（SFX）
  - `useMatchVfx.ts`（VFX/boardAnim）

- `features/match/ui/`
  - `MatchMintView.tsx`（Mint UI レイアウト）
  - `MatchLegacyView.tsx`（旧UI レイアウト）
  - `MatchOverlays.tsx`（トースト/モーダル/ガイド）

- `features/match/model/`
  - `matchTypes.ts`（UIが使う型定義）

Match.tsx には
- ルートのI/O（router/params）
- View選択
だけ残す。

## 実装タスク

1) “動かす前提”を固定
- リファクタ前に、
  - Match開始〜終了までの主要ルートでスクリーンショット（任意）
  - 重要ログ（URL/設定/勝敗）
  を残す

2) 段階的に移す
- 1コミットで全部やらない
- まず純関数/型から
- 次に hook
- 最後に view

3) 依存を減らす
- `features/match` の外へ漏れる参照を減らす
- `@/lib` は純関数に近いものだけ

4) “差分が読める”命名
- `MatchMintView` / `MatchLegacyView` のように明確に

## 受け入れ基準

- 既存のURL（rk/ui/themeなど）で同じ挙動
- lint/build/e2e が通る
- Match.tsx が “見通せるサイズ”に縮む（目安: 300行以内）

## 手動チェック

- Guest match（Nyano AI）
- 自分同士（local）
- ruleset を切り替えた match
- SFX/VFX 設定の切り替え
