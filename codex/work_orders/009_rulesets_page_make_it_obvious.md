# Work Order: 009 — Rulesets 画面を「見れば分かる」設計に（プレビュー/おすすめ/導線）

## 1) 背景 / 目的（ユーザー視点）

Rulesets 画面はルールセットの確認/編集に便利ですが、
初見視点だと「これが何に効くのか」「どれを選べば良いか」が掴みにくいことがあります。

任天堂品質としては、
**見た瞬間に “おすすめ” と “目的” と “次のアクション”** が分かる UI が理想です。

## 2) 成果物（Deliverables）

- [x] Rulesets に “おすすめ” セクション（3〜5個）を追加
- [x] 各 ruleset に短い要約（1行）と “このルールで対戦” 導線を追加
- [x] ルール内容のプレビューを読みやすく（視覚階層/用語）
- [x] 既存 URL/挙動は維持（/rulesets のルーティングや query param）

## 3) 要件（Requirements）

### MUST

- `/rulesets` のページが軽く保たれる（大量レンダリングで重くしない）
- 既存の ruleset 登録・一覧が壊れない
- “対戦へ” 導線は /match の URL 互換を尊重して生成する

### SHOULD

- 初心者向けに用語を補助（tooltip/補足文）
- “おすすめ” は Nyano Triad League が想定する主ルールを上に

### COULD

- 検索/フィルタ UI（classic / experimental / event）

## 4) 非要件（Non-goals）

- ルールの追加/変更
- ruleset の保存形式や schema の変更

## 5) 受け入れ条件（Acceptance Criteria）

1. `/rulesets` を開くと、
   - 上部に “おすすめ” が並び、1タップで /match に飛べる
   - ルールの目的（何が変わるか）が 1行で分かる

2. 従来の一覧・登録がそのまま利用できる

3. テスト/ビルドが通る

## 6) 調査ポイント（Investigation）

- `apps/web/src/pages/Rulesets.tsx`
  - 現状の list/detail を読み、UI 構造を把握
- ルール説明の元データ
  - `apps/web/src/lib/ruleset_registry.ts` など（存在箇所を探索）

## 7) 実装方針（Approach）

- “おすすめ” はハードコードでもよいが、将来の変更を考えて
  `ruleset_registry` 側に `tags` / `recommended` 的な情報があるなら活用
- /match への導線は
  - `rulesetKey` の設定 + 必要なら `ui=mint` など
  - 既存の param 正規化ロジックを尊重して組み立てる

## 8) タスクリスト（細分化）

- [x] ruleset を分類する最小データ（recommended / category）をどこで持つか決める
- [x] Rulesets 画面の上部に Recommended セクションを追加
- [x] 各 ruleset のカードに “このルールで対戦” ボタン
- [x] 詳細パネルのタイポ/階層を整理
- [x] テスト 1 本（リンク生成の妥当性 or recommended が表示されること）

## 9) 検証（Verification）

- `pnpm -C apps/web test`
- `pnpm -C apps/web build`
- 手動: `/rulesets` → “このルールで対戦” → `/match` のパラメータ確認

## 10) リスク / ロールバック

- リスク: recommended の選定が迷走
  - 対策: まずは 3 つに絞って固定（後から調整）
- ロールバック: recommended セクションを撤去し従来 UI に戻す

## 11) PR説明（PR body 雛形）

- What: Rulesets におすすめ/導線/要約を追加し、見れば分かる UI にした
- Why: ルール選択の認知負荷が高く、初見が迷いやすかったため
- How: recommended セクション + /match 導線 + タイポ階層整理
- Test: `pnpm -C apps/web test && pnpm -C apps/web build` + 手動導線確認

## 12) Implementation Update (2026-02-14)

### Status
- [x] Added recommended section UI in `/rulesets`.
- [x] Added one-line summary for each ruleset.
- [x] Added CTA `このルールで対戦` from recommended cards and list rows.
- [x] Added ruleset discovery metadata/resolver (`apps/web/src/lib/ruleset_discovery.ts`).
- [x] Added automated tests (`apps/web/src/lib/__tests__/ruleset_discovery.test.ts`).

### Verification
- [x] `pnpm -C apps/web test`
- [x] `pnpm -C apps/web typecheck`
- [x] `pnpm -C apps/web build`

## 13) 2026-02-15 Follow-up (UX Guardrails)

- [x] Added stable selectors for Rulesets UX checks in `apps/web/src/pages/Rulesets.tsx`
  - recommended section / card / CTA / select
  - selected summary / list table / list CTA
- [x] Added E2E guardrail spec:
  - `apps/web/e2e/rulesets-ux-guardrails.spec.ts`
  - checks recommended visibility + summary/CTA presence
  - checks CTA navigation preserves `/match?ui=mint&rk=...`
- [x] Added to `e2e:ux` command:
  - `apps/web/package.json`
- [x] Verification:
  - `pnpm.cmd -C apps/web e2e:ux` -> 7 passed
