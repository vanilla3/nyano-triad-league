# Work Order: 006 — Nyanoコメント表示でレイアウトが崩れないようにする（Layout Stability）

## 1) 背景 / 目的（ユーザー視点）

Nyano のコメント（NyanoReaction）が出る瞬間、コメント欄（カットイン領域）が “押し広げ” でレイアウトを動かし、
手札や盤面が一瞬ガタついて見えます。

これは **体験品質のコア**（遊びの手触り）を損ね、任天堂品質の「気持ちよさ」を阻害します。

## 2) 成果物（Deliverables）

- [x] NyanoReaction が出現/消失しても、周辺 UI が縦にズレない（slot 確保 or overlay）
- [x] 文字量で高さがブレない（2行クランプ等）
- [x] reduced-motion を尊重（動きを減らしても layout が崩れない）
- [x] 回帰防止のテスト（unit か e2e のどちらか）
- [x] 関連 CSS/コンポーネントの短い docs コメント（“なぜ slot を確保するか”）

## 3) 要件（Requirements）

### MUST

- NyanoReaction が表示されても、**手札/盤面/ツールバーが視覚的にズレない**（≒ Layout Shift 0 に近づける）
- `ui=mint` / `ui=rpg` / `ui=engine` のどれでも破綻しない（少なくとも mint + stage focus を担保）
- URL / transcript / state_json などの互換を壊さない（見た目の修正のみ）

### SHOULD

- コメントのテキストは 1〜2 行で読み切れる見た目（長文は省略・展開は将来）
- “差し込み位置” を固定し、画面の主要操作対象（手札・セル）を押し下げない

### COULD

- 追加で Playwright E2E を入れ、コメント出現時の bounding box が変わらないことを機械検証

## 4) 非要件（Non-goals）

- Nyano コメントの文言生成ロジックの変更
- 演出の作り直し（表情/文言の追加など）
- 盤面全体のビジュアル刷新（WO007 で扱う）

## 5) 受け入れ条件（Acceptance Criteria）

1. `/match?ui=mint` で対戦を開始し、NyanoReaction が出る局面（AI手番/フリップ/勝敗など）で
   - コメント領域出現の前後で、手札（HandDisplayMint）の位置が跳ねない
   - 盤面（BoardViewMint）の位置が跳ねない

2. `prefers-reduced-motion` を有効にしても、コメント領域の出現でレイアウトが動かない

3. 既存の動作（クリック/ドラッグ、アニメ、SFX）の回帰がない

## 6) 調査ポイント（Investigation）

- NyanoReaction 本体: `apps/web/src/components/NyanoReaction.tsx`
- 差し込み位置（レイアウトの原因）: `apps/web/src/pages/Match.tsx`
  - 現状: `nyanoReactionInput && <NyanoReaction ... />` で **DOM が増減**している
- CSS: `apps/web/src/mint-theme/mint-theme.css`
  - `.mint-nyano-reaction` / `.stage-focus-cutin` の高さが内容で変動しうる

再現の目安:

- 対戦中にコメントが出る瞬間、手札の上下位置が微妙に動く（特にモバイル）

## 7) 実装方針（Approach）

### 方針A（最短・低リスク）: “Slot を常に確保”

- Match 側に **常時表示の slot コンテナ**（min-height 固定）を置く
- NyanoReaction の mount/unmount は許容しても、slot が高さを持つのでレイアウトは動かない
- テキストは 2 行程度でクランプして高さの揺れも抑える

### 方針B（根治・完成度高）: “Overlay で浮かせる”

- slot は確保しつつ、NyanoReaction 本体は `position:absolute` で overlay
- layout に影響するのは slot の固定サイズのみ

### 今回採用

- **方針A + 必要なら B の一部**
  - まず “ズレない” を達成し、その上で視覚品質（影/吹き出し/位置）を微調整

## 8) タスクリスト（細分化）

- [x] `Match.tsx` に `NyanoReactionSlot`（新規コンポーネント or div）を導入
  - [x] slot は常に存在し、`min-height` で高さを確保
  - [x] コメントが無いときは空（透明）でも OK
- [x] `NyanoReaction.tsx` のテキストを 2 行クランプ（CSS）
- [x] stage focus (`.stage-focus-cutin`) でも同じ slot に載せ替える
- [x] reduced-motion 時の表示も確認（transform/opacity のみで）
- [x] テスト追加
  - 候補1: `apps/web/e2e/stage-focus.spec.ts` に “NyanoReaction 出現でも UI が動かない” を追加
  - 候補2: `apps/web/src/pages/__tests__/...` で slot の存在と class を検証

## 9) 検証（Verification）

### 自動

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- （e2e を触った場合）`pnpm -C apps/web e2e`

### 手動

- モバイル幅 390px 前後で `/match?ui=mint` を操作
- Nyano コメントが出る場面で、手札/盤面の位置が動かないことを目視
- reduced-motion 有効でも同様

## 10) リスク / ロールバック

- リスク: slot の高さが大きすぎて UI 密度が下がる
  - 対策: `min-height` を控えめにし、2行クランプで収める
- ロールバック: slot 追加部分を revert（既存の NyanoReaction を残す）

## 11) PR説明（PR body 雛形）

- What: NyanoReaction の表示を slot 化し、コメント出現/消失でレイアウトが動かないようにした
- Why: コメント表示時の UI ジャンプ（layout shift）が体験品質を損ねていたため
- How: 常時存在する slot（min-height）+ テキスト2行クランプ + （必要なら overlay）
- Test: `pnpm -C apps/web test && pnpm -C apps/web build` + 手動確認（モバイル/ reduced-motion）
