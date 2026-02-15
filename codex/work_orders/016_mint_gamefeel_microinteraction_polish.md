# Work Order: 016 — Mint Gamefeel 微細演出（Microinteraction）最終磨き込み

参照: `docs/01_design/NYTL_MINT_UI_REFERENCE_PASTEL_GAMEFEEL_v0_ja.md`

## 1) 背景 / 目的（ユーザー視点）
- “スマホゲー感”は、大きなレイアウト以上に、**タップした瞬間の手触り**で決まる。
- 現状の Mint UI は十分に可愛いが、押下/選択/ハイライトの文法が場所ごとに微妙に違い、統一感が薄れる。

## 2) 成果物（Deliverables）
- [x] Mint UI の主要インタラクションに統一された “押す感” を実装
  - board cell: hover/tap/selected
  - hand card: hover/tap/selected/used
  - pills/buttons: hover/tap
- [x] `prefers-reduced-motion` / `data-vfx` で動きを抑制
- [x] 既存の flip/chain 演出と喧嘩しない（主役は盤面）

## 3) 要件（Requirements）
### MUST
- 操作性を落とさない（過度なアニメで遅くしない）
- reduced motion では motion を止めても “違和感が少ない” デザイン

### SHOULD
- “押す/離す” は transform/box-shadow の小さな変化で表現
- “選択中” はリング/グローで明確化（色弱でも区別できる）
- `:focus-visible` を丁寧に（キーボードでも迷わない）

### COULD
- vfx=high のみ、selected に軽い sparkles を足す

## 4) 非要件（Non-goals）
- 新しいアセット導入
- アニメの増やしすぎ（目が疲れる）

## 5) 受け入れ条件（Acceptance Criteria）
- `/match?ui=mint` で
  - セル/カード/ピルを触ると「押せた」が分かる
  - 選択状態が明確
  - 端末幅 360px でもボタンが押しやすい
- reduced motion でアニメが抑制される

## 6) 調査ポイント（Investigation）
- `apps/web/src/mint-theme/mint-theme.css`
  - `mint-cell`, `mint-card`, `mint-prompt`, `mint-scorebar` など
- `apps/web/src/components/BoardViewMint.tsx` / `HandDisplayMint.tsx`

## 7) 実装方針（Approach）
- Mint theme の共通ユーティリティとして
  - `--mint-press-...` などの変数
  - `mint-pressable` class
  を用意し、複数UIで同じ文法を使う。

## 8) タスクリスト（細分化）
- [x] A-1: `mint-pressable`（hover/active/focus-visible）を追加
- [x] A-2: board cell / hand card / pill を `mint-pressable` に寄せる
- [x] A-3: selected ring/glow の統一（A/B 色と衝突しない）
- [x] A-4: reduced motion / vfx gating

## 12) 実装メモ（2026-02-15）
- `apps/web/src/mint-theme/mint-theme.css`
  - 共通ユーティリティ `mint-pressable` / `mint-pressable--cell|--card|--pill` を追加
  - hover/active/focus-visible の挙動を CSS 変数 (`--mint-press-*`) で統一
  - selected ring/glow 変数を `--mint-selected-ring` / `--mint-selected-glow` に統一
  - `prefers-reduced-motion` と `data-vfx=off|low` で press演出を抑制
- `apps/web/src/components/BoardViewMint.tsx`
  - selectable cell に `mint-pressable mint-pressable--cell` を付与
  - `tabIndex=0` + Enter/Space 操作を追加し、focus-visible 導線を強化
- `apps/web/src/components/HandDisplayMint.tsx`
  - hand card に `mint-pressable mint-pressable--card` を付与
- `apps/web/src/components/GameResultOverlayMint.tsx`
  - result action buttons に `mint-pressable mint-pressable--pill` を付与
- `apps/web/e2e/ux-guardrails.spec.ts`
  - Nyano slotシナリオ内で、hand card/cell に `mint-pressable` が付いていることを追加検証

## 9) 検証（Verification）
### 自動
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

### 手動
- `/match?ui=mint` で
  - カード選択→セル選択
  - hover/active/focus-visible の確認
  - reduced motion の確認

## 10) リスク / ロールバック
- リスク: 影/グローが強すぎて可読性が落ちる
  - 対策: default は控えめ、強い演出は vfx=high のみに
- ロールバック: CSS差分を revert

## 11) PR説明（PR body 雛形）
- What: Mint UI の microinteraction を統一（press/hover/selected）
- Why: 手触りの統一で“ゲーム感”と品質感を上げるため
- How: mint-theme 共通クラス + 適用範囲の調整
- Test: `pnpm -C apps/web test && pnpm -C apps/web build`
