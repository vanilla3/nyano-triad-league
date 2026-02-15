# Work Order: 014 — Mint Gamefeel 手札トレイ＆プロンプト（操作の起点を強化）

参照: `docs/01_design/NYTL_MINT_UI_REFERENCE_PASTEL_GAMEFEEL_v0_ja.md`

## 1) 背景 / 目的（ユーザー視点）
- ゲームの操作は「手札を選ぶ」→「盤面を選ぶ」なので、手札エリアの“触れる感”と、次アクションの誘導は体験の中核。
- 参照画像では、手札がガラスのトレイで囲われ、カードが少し重なって“手で扱っている”感じを作っている。
- また、プロンプトが大きいピルとして定位置にあり、迷いが少ない。

## 2) 成果物（Deliverables）
- [x] `HandDisplayMint` を “トレイ” として見せる（ガラス枠 + 影 + カード重なり）
- [x] `BoardViewMint` の ActionPrompt を参照画像のような “大きいピル + 二段表記” に寄せる
- [x] 選択中カードのフィードバックを明確化（浮き/影/リング）
- [x] Reduced motion / vfx を尊重（過剰なアニメは抑制）

## 3) 要件（Requirements）
### MUST
- 既存の操作（クリック選択/ドラッグドロップ）が壊れない
- `usedIndices`（使用済み）表示が分かりやすいまま
- 文字が読める（コントラスト/サイズ）

### SHOULD
- 手札トレイは “盤面セルのトレイ感” と同じ文法にする（角丸/縁/影）
- プロンプトは 1箇所に固定（表示/非表示で周囲がガタつかない）
- カード重なりは「選びやすさ」を優先（重なりすぎない）

### COULD
- “カードを選んでください / Choose a card” の 2言語を視覚的に階層化（ja大きめ、en小さめ）

## 4) 非要件（Non-goals）
- カード自体のアート/フレームの刷新（今回は盤面外を優先）
- 新しい音素材の追加

## 5) 受け入れ条件（Acceptance Criteria）
- `/match?ui=mint` で
  - 手札が“トレイ”に入って見える
  - カードが軽く重なり、選択中カードが明確
  - プロンプトが大きいピルになり、二段表記で読める
- 手札が 0〜5 枚に変化してもレイアウトが極端に崩れない

## 6) 調査ポイント（Investigation）
- `apps/web/src/components/HandDisplayMint.tsx`
- `apps/web/src/components/BoardViewMint.tsx`（`mint-prompt`）
- `apps/web/src/mint-theme/mint-theme.css`

## 7) 実装方針（Approach）
- 手札トレイ:
  - HandDisplayMint の外枠に tray container を追加
  - 既存のカードボタンを tray 内で重ね/スクロールさせる（端末幅に応じて）
- プロンプト:
  - `mint-prompt` スタイルを参照画像寄りに更新
  - 高さを固定し、表示タイミングでレイアウトが揺れないようにする

## 8) タスクリスト（細分化）
- [x] A-1: HandDisplayMint に `mint-hand-tray` wrapper を追加
- [x] A-2: `mint-theme.css` に tray スタイル（glass/shadow/inner highlight）を追加
- [x] A-3: カードの重なり/選択状態の影を調整
- [x] A-4: `mint-prompt` の見た目をピルに寄せる（border, gradient, shadow, typography）
- [x] A-5: Prompt の高さ/表示制御を見直し（ガタつき防止）

## 12) 実装メモ（2026-02-15）
- `apps/web/src/components/HandDisplayMint.tsx`
  - `mint-hand-tray` / `mint-hand-tray__rail` を追加し、手札をトレイUIとして表示
  - カードに `mint-hand-card--stacked` を付与して軽い重なりを導入
  - 選択カードは `z-index` を上げて操作性を確保
- `apps/web/src/components/BoardViewMint.tsx`
  - ActionPrompt を2段（JA/EN）構造へ変更
  - `mint-prompt-slot` を追加し、表示時の高さを固定してガタつきを抑制
- `apps/web/src/mint-theme/mint-theme.css`
  - `mint-hand-tray` 系（glass/shadow/inner sheen、横スクロール対応）を追加
  - 選択カードの浮き/リング/影を強化
  - `mint-prompt` を大きいピル + 二段テキストに更新
  - 480px以下向けに tray/prompt のサイズを調整

## 9) 検証（Verification）
### 自動
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

### 手動
- `/match?ui=mint`
  - カード選択→セル選択→コミット
  - ドラッグドロップができる（該当環境）
  - 360px/768px の幅で tray と prompt が破綻しない

## 10) リスク / ロールバック
- リスク: 重なりが強すぎて選びづらくなる
  - 対策: overlap は小さく、スクロール/スワイプで補完
- ロールバック: CSS差分を revert

## 11) PR説明（PR body 雛形）
- What: Mint UI の手札トレイとプロンプトを参照画像風に調整
- Why: 操作の起点を明確にし、ゲーム感と迷いの少なさを上げるため
- How: HandDisplayMint wrapper + mint-prompt styling
- Test: `pnpm -C apps/web test && pnpm -C apps/web build`
