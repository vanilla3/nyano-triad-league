# Work Order 025: Classic Rules — プリセット拡充 + UI から選べるようにする

## 1) 背景 / 目的（ユーザー視点）
- エンジンには Classic Rules（Reverse / AceKiller / TypeAscend / TypeDescend / Plus / Same …）が実装済みだが、
  Web UI から選べるのは一部プリセットのみ。
- 「追加したはずのルールが遊べない」状態は、機能の価値がユーザーに届かない。

## 2) 成果物（Deliverables）
- [ ] Classic Rules の不足プリセットを `ruleset_registry` に追加
- [ ] Match setup（Mint）で追加プリセットを選べるようにする
- [ ] Rulesets ページ（または同等の導線）で Classic プリセットを発見できる
- [ ] Replay で `rulesetId` から Classic プリセットが解決できる（registry に載る）
- [ ] 最低限のテスト追加

## 3) 要件（Requirements）
### MUST
- Reverse / AceKiller / TypeAscend / TypeDescend を少なくとも **単体プリセット**として追加する
- `resolveRulesetById()` で新規プリセットが解決できるようにする（Replay 互換）
- URL 互換を壊さない（既存の `rk=` はそのまま動く）
- 既存の決定論を壊さない（triad-engine 側ロジックは変更しない）

### SHOULD
- Plus と Same は「単体」も追加（`classic_plus` / `classic_same`）し、
  `classic_plus_same` は従来通り残す
- Rulesets ページに「Classic（Beta）」セクションを追加し、
  参照画像に寄せた “分かりやすい入口” を作る

### COULD
- よく使う複合プリセット（例: `plus+same+reverse`）を 1〜2 個追加
  - ただし爆発を避け、厳選する

## 4) 非要件（Non-goals）
- Classic ルールのカスタムビルダー（複数チェックで任意組み合わせ）
  - これは WO-026 で扱う
- transcript schema の変更

## 5) 受け入れ条件（Acceptance Criteria）
1) `/match?ui=mint` のルール選択で
   - Reverse / AceKiller / TypeAscend / TypeDescend が選べる
2) それぞれ選択して 1 手以上進められる（クラッシュしない）
3) Replay URL で再生したとき、`rulesetId` から同じプリセットが解決され、
   ルール表記（classic tags）が表示される
4) `pnpm -C apps/web test && pnpm -C apps/web build` が通る

## 6) 調査ポイント（Investigation）
- `apps/web/src/lib/ruleset_registry.ts`
- `apps/web/src/lib/ruleset_discovery.ts`
- `apps/web/src/components/match/MatchSetupPanelMint.tsx`
- `apps/web/src/pages/Rulesets.tsx`（導線を追加する場合）
- `apps/web/src/pages/Replay.tsx`（label 表示の確認）

## 7) 実装方針（Approach）
- 方針A（安全・最短）: registry に “固定 config” のプリセットを追加し、
  UI はその key を選択できるようにする。
  - Replay は `rulesetId -> registry` 解決で動く
  - 影響範囲が局所化される

今回採用: **方針A**

## 8) タスクリスト（細分化）
- [ ] 025-1 `ruleset_registry` に classic 単体プリセットを追加
  - `classic_reverse`
  - `classic_ace_killer`
  - `classic_type_ascend`
  - `classic_type_descend`
  - (should) `classic_plus` / `classic_same`
- [ ] 025-2 `RULESET_KEY_META` / discovery の表示情報を追加
- [ ] 025-3 Match setup（Mint）で選択肢として表示
- [ ] 025-4 Rulesets ページ（or Home/Arena）に Classic への導線を追加
  - “まずここを触ればルールが選べる” を作る
- [ ] 025-5 テスト追加
  - registry で key->id が安定
  - Match setup options に key が出る

## 9) 検証（Verification）
### 自動
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`

### 手動
- /match?ui=mint を開く
- ルールを各プリセットに切替 → ゲーム開始 → 1〜2手進める
- リプレイ URL をコピーして別タブで開き、同じタグが表示される

## 10) リスク / ロールバック
- リスク: ルール選択肢が増えて UI が煩雑になる
  - 対策: まずは “Classic（Beta）” セクションにまとめる。おすすめは別枠。
- ロールバック: registry 追加分と UI options を revert すれば戻る
