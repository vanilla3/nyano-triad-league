# Work Order: 015 — NyanoReaction のレイアウト崩れ（CLS）を根絶する v2

関連: 既存 `codex/work_orders/006_reaction_layout_stability.md`

## 1) 背景 / 目的（ユーザー視点）
- Nyano のコメントが出る瞬間にコメント欄が動き、画面が一瞬ガタつく（表示が崩れる）。
- 演出としては良いのに、UI が揺れると “安っぽさ” と “入力ミスの不安” が出る。

## 2) 成果物（Deliverables）
- [x] NyanoReaction の表示/非表示で周囲レイアウトが一切動かない（縦伸びを防止）
- [x] テキスト折り返しによる高さ増加を抑える（line-clamp / ellipsis）
- [x] `prefers-reduced-motion` 時にアニメが静的でも不自然にならない
- [x] 簡易的な回帰防止（e2e or 開発用計測）

## 3) 要件（Requirements）
### MUST
- Slot の高さを **固定**する（`min-height` だけに頼らない）
- Reaction 本体は Slot 内で `position: absolute` で重ねる（レイアウトに影響させない）
- どの画面幅でも、テキストが増えても Slot の高さが増えない

### SHOULD
- テキストは 2 行までで切る（line-clamp）
- 画像/バッジなどがはみ出さない（overflow hidden）
- CLS の発生有無を確認できる手段を用意

### COULD
- 反応がない時でも「空気感」が残る薄いプレースホルダ（ただし動かない）

## 4) 非要件（Non-goals）
- NyanoReaction の文言生成ロジックの変更（内容は既存のまま）
- 派手な追加アニメ

## 5) 受け入れ条件（Acceptance Criteria）
- `/match?ui=mint` で NyanoReaction が出る/消えるとき、
  - 盤面/手札/ボタンの位置が目視で動かない
  - スクロール位置がズレない
- 360px 幅で長文のコメントでも Slot 高さが固定される

## 6) 調査ポイント（Investigation）
- `apps/web/src/components/NyanoReactionSlot.tsx`
- `apps/web/src/components/NyanoReaction.tsx`
- `apps/web/src/mint-theme/mint-theme.css`
- Reaction が `null` を返す条件（kind=idle 等）と、Slot が placeholder を出さない条件

## 7) 実装方針（Approach）
- Slot 側で「固定高さ + relative」を担保
- Reaction 側で「absolute + inset + overflow」
- テキスト領域は CSS line clamp を使い、最大2行に制限
- 既存の `006_reaction_layout_stability` の方針を踏襲しつつ、
  “inputが常に non-null で placeholder が出ない” など実装上の穴を塞ぐ

## 8) タスクリスト（細分化）
- [x] A-1: Slot の CSS を `height: ...`（clampでもOK）に変更し、`overflow: hidden` を付与
- [x] A-2: Slot の子は常に placeholder を保持（inputがnon-nullでも、Reactionがnullならplaceholderを出す）
  - 例: Slot 内で `hasVisibleReaction` を状態として持つ / もしくは NyanoReaction を常時マウントして visibility 制御
- [x] A-3: NyanoReaction のテキストを 2 行で切る（line-clamp）
- [x] A-4: 低幅（360px）での崩れを手動検証
- [x] A-5: 可能なら Playwright で “レイアウトシフトが起きない” を軽く検知
  - 例: LayoutShift API を page.evaluate で購読し、一定しきい値以下をアサート

## 12) 実装メモ（2026-02-15）
- `apps/web/src/components/NyanoReactionSlot.tsx`
  - `pickReactionKind` で `idle` を判定し、`input !== null` でも可視リアクションがない場合は `mint-nyano-reaction-slot--idle` を維持
  - placeholder を常時マウントし、`mint-nyano-reaction-slot__content` 内にリアクションを重ねる構造へ変更
- `apps/web/src/mint-theme/mint-theme.css`
  - slot を `min-height` 依存から `height: clamp(...)` + `overflow: hidden` へ変更
  - `mint-nyano-reaction-slot__content` を absolute overlay 化し、リアクション本体を `inset: 0` で固定
  - stage-focus cut-in の余白を除去し、slot 内で高さ固定を維持
- `apps/web/src/components/__tests__/NyanoReactionSlot.test.tsx`
  - 新しいDOM構造（placeholder + content wrapper）に合わせて更新
  - `input` はあるが `kind=idle` のケースで slot が idle 扱いになることを追加検証
- `apps/web/e2e/ux-guardrails.spec.ts`
  - LayoutShift API の軽量プローブを追加し、Nyano slotガード中の CLS しきい値チェックを追加

## 9) 検証（Verification）
### 自動
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

### 手動
- `/match?ui=mint` で数手進め、NyanoReaction が出る状況を作る
- ウィンドウ幅 360px / 768px で反復（出る→消える）して、ガタつきを確認

## 10) リスク / ロールバック
- リスク: 固定高さが小さすぎて内容が切れすぎる
  - 対策: 高さは少し余裕を持って確保し、line-clamp と合わせる
- ロールバック: Slot/Reaction の CSS 差分を revert

## 11) PR説明（PR body 雛形）
- What: NyanoReaction 表示時のレイアウトシフトを固定高さ + absolute overlay で根絶
- Why: ゲーム画面の安定性と高級感を守るため
- How: Slot layout, line-clamp, optional layout shift detection
- Test: `pnpm -C apps/web test && pnpm -C apps/web build`
