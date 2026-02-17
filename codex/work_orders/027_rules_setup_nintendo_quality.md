# Work Order 027: ルール設定 UI — “触れば分かる” Nintendo 品質へ

## 1) 背景 / 目的（ユーザー視点）
- ルール（engine v1/v2 / classic）は選べるようになってきたが、
  現状の UI は「dropdown + ラベル中心」で、初見ユーザーが理解しづらい。
- 目指すのは、説明文を長くするのではなく **形・階層・強調**で理解できる UI。

## 2) 成果物（Deliverables）
- [ ] Match setup（Mint）のルール選択部分を分かりやすく整理
- [ ] “おすすめ” と “カスタム” の導線が迷わない
- [ ] 選択中のルールが一目で分かる（タグ/アイコン/サマリ）
- [ ] ヘルプ（短い説明）が必要なときだけ出る（popover/modal）
- [ ] テスト（最低限: レンダリング/URL保存）

## 3) 要件（Requirements）
### MUST
- 読む文章を増やさずに、ルール選択が理解できる
- ルールの状態（選択/未選択/排他）が視覚的に明確
- キーボード/スクリーンリーダーでも操作できる（aria）
- `prefers-reduced-motion` を尊重
- URL 互換を壊さない

### SHOULD
- ルール選択を “2段階” にする
  - ① 大分類: engine v1 / engine v2 / classic
  - ② classic の詳細: preset / custom
- 選択中のルールを “サマリピル” に集約
  - 例: `Classic: Reverse + Plus + Same` / `Open: Three`

### COULD
- ルール説明を「長押し/ホバー」で出す（モバイルは長押し推奨）

## 4) 非要件（Non-goals）
- ルールのバランス調整
- ルールの新規追加

## 5) 受け入れ条件（Acceptance Criteria）
1) /match?ui=mint のルール設定で、初見でも「何を選んでいるか」が分かる
2) classic custom で排他ルール（order vs chaos 等）が迷わず選べる
3) `pnpm -C apps/web build` が通る

## 6) 調査ポイント（Investigation）
- `apps/web/src/components/match/MatchSetupPanelMint.tsx`
- `apps/web/src/components/mint/*`（既存プリミティブ）
- `apps/web/src/mint-theme/mint-theme.css`

## 7) 実装方針（Approach）
### 方針A: 既存 UI を段階的に置き換える（安全）
- dropdown を残しつつ、上に “segmented tabs + quick tiles” を追加
- classic custom は折りたたみ（details）で露出

### 方針B: ルール設定を独立コンポーネント化（中期）
- `MintRulesetPicker` を新規作成し、Match setup から呼ぶ

今回採用: **方針B**（ただし差分は小さく）
- 理由: Match setup の見通しが良くなり、他画面（Rulesets/Events）にも転用できる

## 8) タスクリスト（細分化）
- [ ] 027-1 `MintRulesetPicker`（新規）を作る
  - 大分類（engine v1/v2/classic）
  - classic: preset/custom
  - サマリピル
  - help popover（短文）
- [ ] 027-2 `MatchSetupPanelMint` から呼び出す
- [ ] 027-3 CSS（mint-theme）で “ゲーム UI の部品” に寄せる
  - pill / tile / selected ring
- [ ] 027-4 最低限のテスト
  - レンダリング
  - URL param が変化する

## 9) 検証（Verification）
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`

手動:
- モバイル幅でルール選択 → すぐ対戦開始 → ルールが反映

## 10) リスク / ロールバック
- リスク: UI 追加で setup が縦長になりすぎる
  - 対策: 折りたたみ + “おすすめ” を上に固定
- ロールバック: `MatchSetupPanelMint` の差分を戻せば復旧
