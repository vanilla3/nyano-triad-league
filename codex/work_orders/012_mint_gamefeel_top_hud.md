# Work Order: 012 — Mint Gamefeel トップHUD（スコア＆ターンを定位置化）

参照: `docs/01_design/NYTL_MINT_UI_REFERENCE_PASTEL_GAMEFEEL_v0_ja.md`

## 1) 背景 / 目的（ユーザー視点）
- 参照画像では、上部に「スコア」と「ターン」が固定され、盤面に集中しながらも状況が一瞬で分かる。
- 現状は HUD が盤面の上にあるものの、情報が多めで“ゲーム画面の定位置HUD”としてはまだ整理余地がある。

## 2) 成果物（Deliverables）
- [x] Mint UI に参照画像寄りの Top HUD（左: ロゴ / 中央: A-Bスコア / 右: TURNピル）を追加
- [x] 既存 `BattleHudMint` の情報は維持しつつ、`density=minimal` で Top HUD を優先表示
- [x] レスポンシブで破綻しない（360px幅〜）
- [x] アクセシブル（aria-label / キーボードフォーカス）

## 3) 要件（Requirements）
### MUST
- 既存のゲーム進行/入力は変えない
- スコア/ターンの値は既存状態から取得し、二重管理しない
- `ui=mint` のみ適用（他UIへ影響を広げない）

### SHOULD
- Top HUD は “ガラスパネル＋ホログラム縁” のトーンに統一
- スコアは左右対称で即読（アイコン + A/B + count）
- TURN は独立したピルで視線誘導

### COULD
- ターン進行に合わせた軽い pulse（vfx high のみ）

## 4) 非要件（Non-goals）
- ロゴの完全再現（画像素材は追加しない）
- 情報量の増加（むしろ“固定表示”を整える）

## 5) 受け入れ条件（Acceptance Criteria）
- `/match?ui=mint` で Top HUD が表示される
- 360px幅でも
  - ロゴ/スコア/ターンが重ならない
  - 文字が潰れない
- `density=minimal` では Top HUD が主、詳細は Drawer へ
- `density=standard/full` でも破綻しない（既存 `BattleHudMint` の情報が必要なら折りたたみ）

## 6) 調査ポイント（Investigation）
- `apps/web/src/components/BattleHudMint.tsx`
- `apps/web/src/pages/Match.tsx`（Mint UI の HUD 生成箇所）
- `apps/web/src/mint-theme/mint-theme.css`（mint-scorebar / mint-hud）

## 7) 実装方針（Approach）
- 方針A: 新規コンポーネント `BattleTopHudMint.tsx` を追加し、Match側で差し替える
- 方針B: `BattleHudMint` に “layout=top” のvariantを足す

今回は **方針A**（分離して安全）を推奨。

## 8) タスクリスト（細分化）
- [x] A-1: `BattleTopHudMint.tsx` を新規作成
  - props: `board`, `turnCount`, `maxTurns`, `currentPlayer`（必要最小）
  - 表示: 左ロゴ / 中スコア / 右TURN
- [x] A-2: `mint-theme.css` に Top HUD 用クラスを追加（glass/pill/shadow）
- [x] A-3: `Match.tsx` の Mint UI HUD 部分を
  - `density=minimal` → Top HUD
  - `density=standard/full` → 既存 HUD（or 併用）
  にする
- [x] A-4: aria-label/role の付与（読み上げで意味が通る）

## 12) 実装メモ（2026-02-15）
- `apps/web/src/components/BattleTopHudMint.tsx`
  - Top HUD 専用コンポーネントを追加（左ロゴ/中央スコア/右TURN）
  - スコアは `board` から A/B タイル数を算出し、状態の二重管理を回避
  - `role` / `aria-label` / `aria-live` を付与
- `apps/web/src/pages/Match.tsx`
  - Mint UI (`ui=mint`) で Top HUD を表示
  - `density=minimal` では Top HUD を優先し、`standard/full` は既存 `BattleHudMint` も併用
  - `ui=engine/rpg` の挙動は維持
- `apps/web/src/mint-theme/mint-theme.css`
  - Top HUD の glass/pill/shadow スタイル、360px 対応レスポンシブを追加
  - `prefers-reduced-motion` / `data-vfx` 分岐へ Top HUD を接続
- `apps/web/src/components/__tests__/BattleTopHudMint.test.tsx`
  - エクスポート確認 + スコア/ターン文言の最小テストを追加

## 9) 検証（Verification）
### 自動
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

### 手動
- `/match?ui=mint`
  - turn 0〜数手進行してスコア/ターンの更新が自然
  - 360px/768px/1280px の幅で表示確認

## 10) リスク / ロールバック
- リスク: HUD の切替が複雑になり可読性が落ちる
  - 対策: `density` を唯一の切替軸にする（無闇にフラグ増やさない）
- ロールバック: Top HUD コンポーネント差分を revert

## 11) PR説明（PR body 雛形）
- What: Mint UI に参照画像風の Top HUD（score/turn定位置）を追加
- Why: 視線誘導と状況把握を高速化し“ゲーム感”を上げるため
- How: 新規 HUD コンポーネント + mint-theme CSS
- Test: `pnpm -C apps/web test && pnpm -C apps/web build`
