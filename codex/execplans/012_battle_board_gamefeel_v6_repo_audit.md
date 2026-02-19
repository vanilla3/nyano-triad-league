# ExecPlan 012: Battle Board Gamefeel v6 + Repo Quality Audit

## 目的

Nyano Triad League の「バトル盤面（Match画面）」を、添付の参考UI（ガラス調・パステル・ぷにっとした立体感）に寄せつつ、
**ゲームとしての“手触り（game feel）”と理解しやすさ（Nintendo品質）**を底上げする。

同時に、サイト全体の不整合・潜在不具合・将来の拡張を阻害する技術負債を棚卸しし、
Codexが迷わず改善を進められるように「作業単位（Work Order）」へ分解する。

## 非目標（やらない）

- ゲームルール（triad-engine）の挙動変更は原則しない（UI/演出中心）。
- 新規の大規模ライブラリ導入（Pixi刷新・Framer Motion全面採用など）は避ける。
  - どうしても必要なら「理由・代替案・容量/性能への影響」を明記して提案 → 最小導入。

## 参照

- 参考UI画像（デザイン指針・仕様ではない）
  - `docs/01_design/reference_ui/board_reference.png`
  - `docs/01_design/reference_ui/menu_reference.png`
  - `docs/01_design/reference_ui/arena_reference.png`
  - `docs/01_design/reference_ui/deck_builder_reference.png`
  - `docs/01_design/reference_ui/onboarding_reference.png`

- 既存の思想/ガイド
  - `docs/01_design/NYTL_BATTLE_BOARD_UI_QUALITY_GUIDE_SAKURAI_LENS_v1_ja.md`
  - `docs/01_design/NYTL_GAME_UI_QUALITY_PRINCIPLES_SAKURAI_LENS_v1_ja.md`
  - `docs/01_design/NYTL_MINT_THEME_SYSTEM_v1_ja.md`

## 実装の中心ファイル

- バトル盤面
  - `apps/web/src/pages/Match.tsx`
  - `apps/web/src/components/DuelStageMint.tsx`
  - `apps/web/src/components/BoardViewMint.tsx`
  - `apps/web/src/components/HandDisplayMint.tsx`
  - `apps/web/src/components/BattleTopHudMint.tsx`
  - `apps/web/src/components/BattleHudMint.tsx`
  - `apps/web/src/components/PlayerSidePanelMint.tsx`
  - `apps/web/src/components/NyanoReactionSlot.tsx`

- 見た目（Mint）
  - `apps/web/src/mint-theme/mint-theme.css`
  - `apps/web/src/components/mint/MintPressable.tsx`
  - `apps/web/src/components/mint/GlassPanel.tsx`

## Work Orders

1. **WO-032**: ボタン/パネルの「立体・質感」強化（ぷにっと、ガラス、縁、陰影）
2. **WO-033**: 盤面のゲームフィール強化（セル・トレイ・置く/めくる演出）
3. **WO-034**: HUD/情報設計の見直し（視線誘導・可読性・誤操作防止・安定レイアウト）
4. **WO-035**: 追加ルール（classic rules）を“使える形”で露出（Arena/Quick Play/共有導線）
5. **WO-036**: サイト全体の不整合/不具合の棚卸し＆掃除（BOM/ロックファイル/古いUI混在など）
6. **WO-037**: 将来拡張のための構造整理（Match.tsx肥大化の分割、UI設計資産の再利用）
7. **WO-038**: 破壊的UI変更を防ぐ（バトル盤面のビジュアル回帰チェック導入）

## 実行順

- まずWO-036（掃除）→ 以降の差分が読みやすくなる
- 次にWO-032（素材感の核）→ 他UIへ波及
- その後WO-033/034（盤面とHUDを一体でチューニング）
- ルール導線はWO-035
- 最後にWO-037/038（長期品質）

## 検証（Codexが必ず行う）

- セットアップ
  - `pnpm -w install`
  - `pnpm -C apps/web dev`
- 静的チェック
  - `pnpm -C apps/web lint`
  - `pnpm -C apps/web build`
- E2E
  - `pnpm -C apps/web test:e2e`
- 手動チェック（最低限）
  - `Home → Arena → Match` の遷移が破綻しない
  - Matchでカード選択→配置→めくりが気持ちよく、情報が読み取れる
  - `prefers-reduced-motion` / `data-vfx` が効いて、動きが抑制できる

## Definition of Done

- 参考UIに近い「ガラス×ぷに×立体感」へ近づいたと分かる（ボタン・盤面・HUD）
- 演出が増えても **読みやすさ / 触りやすさ** が落ちない
- Layout shift（レイアウトがガタつく）が増えていない
- ルール追加がUI導線から利用できる（少なくともQuick Play/Match設定から）
- リポジトリ内の不整合が整理され、次の拡張がやりやすい
