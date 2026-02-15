# Work Order: 011 — Mint Gamefeel 背景＆ステージ土台（参照画像ベース）

参照: `docs/01_design/NYTL_MINT_UI_REFERENCE_PASTEL_GAMEFEEL_v0_ja.md`

## 1) 背景 / 目的（ユーザー視点）
- Mint UI はすでにカード/盤面の“かわいい統一”が進んでいるが、画面全体としては「Webアプリの一画面」感が残る。
- 参照画像が持つ“ゲーム画面らしさ”の要因は、**背景レイヤー（グラデ/模様/粒子）と、盤面を支えるステージ土台**が一体化している点。

## 2) 成果物（Deliverables）
- [x] Mint UI の背景レイヤー（グラデ + 薄い肉球パターン + ふわっと粒子）を追加
- [x] `DuelStageMint` の外枠/土台を強化（ボードが“置かれている”感）
- [x] `prefers-reduced-motion` と `data-vfx`（low/medium/high/off）で演出を制御
- [x] docs 更新（参照仕様に沿った実装メモを短く追記）

## 3) 要件（Requirements）
### MUST
- **外部アセット追加はしない**（ライセンス不明回避）
  - 画像/パターンは CSS（gradient / inline svg data-url）で生成する
- UI の情報/入力を変えない（見た目の改修のみ）
- `prefers-reduced-motion: reduce` のとき、粒子/ふわふわ移動を止める
- `data-vfx="off"` のとき、FX は完全オフ（静的BGのみ）
- スクロールバーが増えない（overflow管理）

### SHOULD
- 肉球パターンは低コントラストで“気づく人は気づく”程度
- 粒子は 60fps を阻害しない（DOMを増やしすぎない / transform主体）
- ステージの土台に “奥行き” を出す（外側shadow + 内側highlight）

### COULD
- うっすらノイズ（CSS/SVG）を足して高級感
- board の外側に光のにじみ（glow）を足す

## 4) 非要件（Non-goals）
- 参照画像の完全一致
- Pixi/エンジン描画の変更
- 大量の粒子DOM（Canvasパーティクル等）

## 5) 受け入れ条件（Acceptance Criteria）
- `/match?ui=mint` を開いたとき、盤面の背後に
  - パステルグラデ
  - 薄い肉球パターン
  - ふわっと漂う粒子（vfx on のとき）
  が見える
- `prefers-reduced-motion: reduce` で粒子が停止し、見た目が破綻しない
- `data-vfx=off` で粒子/強いグローが無効化される
- UI のクリック領域が壊れない（BGは `pointer-events: none`）

## 6) 調査ポイント（Investigation）
- `apps/web/src/components/DuelStageMint.tsx`
- `apps/web/src/mint-theme/mint-theme.css`
- VFX制御: `apps/web/src/lib/visualSettings.ts`（`data-vfx`）

## 7) 実装方針（Approach）
- 方針A（推奨）: CSS疑似要素で背景を合成
  - `mint-stage` に `::before`（BG gradient + pattern）
  - `::after`（sparkles/bokeh）
  - 追加DOMを最小化し、transformでアニメ
- 方針B: 背景専用divを少数追加

今回は **方針A** を採用。

## 8) タスクリスト（細分化）
- [x] A-1: `mint-theme.css` に gamefeel 用トークン（BG色/blur/shadow）を追加
- [x] A-2: `mint-stage` に背景レイヤー（gradient + paw pattern）を実装
- [x] A-3: 粒子/スパークル（少数の疑似要素 or background-image）を追加
- [x] A-4: `prefers-reduced-motion` / `data-vfx` で ON/OFF/強度を制御
- [x] A-5: 盤面土台（ステージ枠）を微強化（奥行き、縁、影）
- [x] A-6: docs に「どこを触ったか」を短く追記

## 12) 実装メモ（2026-02-15）
- `apps/web/src/mint-theme/mint-theme.css`
  - gamefeelトークン（参照画像近似色、glass/shadow、paw pattern data-uri）を追加
  - `mint-stage` の背景を pastel gradient + 柔らかい光彩へ更新
  - `mint-stage::before` に低コントラスト paw pattern を追加
  - `mint-stage::after` を sparkle + bokeh 構成へ更新（軽量 animation）
  - `prefers-reduced-motion` / `data-vfx` の停止・強度分岐を追加
- `apps/web/src/components/DuelStageMint.tsx`
  - `mint-stage--gamefeel` バリアントを付与
  - 旧インライン paw SVG を削除（パターンをCSS側へ統合）

## 9) 検証（Verification）
### 自動
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

### 手動
- `/match?ui=mint`
  - 360px 幅で表示崩れなし
  - `prefers-reduced-motion` をONにして粒子停止
  - `data-vfx=off` を強制して（DevToolsで `document.documentElement.dataset.vfx='off'`）演出停止

## 10) リスク / ロールバック
- リスク: 背景が派手すぎて盤面の可読性を落とす
  - 対策: pattern opacity を低く、強い演出は vfx=high のみに
- ロールバック: `mint-stage--gamefeel` のスタイル差分を revert

## 11) PR説明（PR body 雛形）
- What: Mint UI に Pastel Gamefeel の背景レイヤーとステージ土台を追加
- Why: 画面全体の“ゲーム感”を上げ、没入感と視線誘導を強化するため
- How: CSS疑似要素 + vfx/reduced-motion gating
- Test: `pnpm -C apps/web test && pnpm -C apps/web build`
