# Work Order: 008 — Match Setup（ルール設定含む）を「触るだけで分かる」UIに再設計

## 1) 背景 / 目的（ユーザー視点）

`/match` の Match Setup は機能が揃ってきた一方で、
初見ユーザーには情報が多く「どれを触れば試合が始まるか」が直感的に伝わりにくいです。

任天堂品質を目指すなら、
**最初に必要なものだけ見せ、詳細は必要なときに開ける**
（progressive disclosure）が必須です。

## 2) 成果物（Deliverables）

- [ ] Match Setup を “ガイド付き” に再構成（初心者でも迷わず開始）
- [ ] 既存の URL param 互換を維持したまま UI を刷新（内部状態は param が真実）
- [ ] 高度な設定は折りたたみ/Drawer に隔離（ただし機能は削らない）
- [ ] 主要設定の 1 行サマリ（今の設定が一目で分かる）
- [ ] 最低 1 つ回帰防止テスト（unit か e2e）

## 3) 要件（Requirements）

### MUST

- 既存 query param の意味/互換を壊さない（share URL が死ぬのは NG）
- Event モード・Guest モードの分岐を壊さない
- deck A/B 選択の導線は残す（イベント固定デッキも）
- 390px 幅でも操作可能（タップ領域 44px 以上）

### SHOULD

- “おすすめ” を最上段に置く（迷ったらこれ、で開始できる）
- ルールは **短い説明 + 触感の良い選択 UI**（select 連発を避ける）
- 初心者向け: 用語を柔らかく（例: rulesetKey を直接見せない）

### COULD

- 各設定の簡易プレビュー（小さな図/アイコン）
- 設定変更が “ゲーム開始までの時間” を悪化させないように、選択肢を段階表示

## 4) 非要件（Non-goals）

- ルールの追加/変更（UI の見せ方だけ）
- 別ページへの大移動（/match のままで改善する）

## 5) 受け入れ条件（Acceptance Criteria）

1. `/match?ui=mint` を開いた初見が、
   - 画面上部の案内に従って Deck A/B と “おすすめルール” を選び、
   - 迷わず試合を開始できる

2. 上級者は “高度な設定” を開けば従来同等の操作ができる

3. URL param が既存通り更新され、share URL が従来通り成立する

4. テスト/ビルドが通る

## 6) 調査ポイント（Investigation）

- `apps/web/src/pages/Match.tsx`
  - `CollapsibleSection` がファイル内定義
  - Setup UI が巨大で、状態・param 更新・表示が密結合
- `apps/web/src/pages/Rulesets.tsx`
  - ルールセットの説明文/構造は参照可能

## 7) 実装方針（Approach）

### 方針

1) **Setup UI をコンポーネントに分離**

- `apps/web/src/components/match/MatchSetupPanelMint.tsx`（新規）などに切り出し
- `Match.tsx` は “state/param/engine” を持ち、UI は props で受け取る

2) UI を 3 レイヤに分割

- Primary（常に表示・初心者が触る）
  - Deck A / Deck B
  - ルール（おすすめプリセット）
  - 対戦相手（Nyano / 対人）

- Secondary（よく使うが説明付き）
  - 難易度
  - 先手/後手

- Advanced（折りたたみ/Drawer）
  - 配信用 HUD、詳細パラメータ、検証用トグル、debug 情報

3) 見た目

- select を “ゼロにする” 必要はないが、
  **最初の導線は card/segmented control を中心**に

### コンポーネント候補

- `ChoiceCards`（3〜6 個の選択肢をタップで選ぶ）
- `SegmentedControl`（難易度など）
- `SetupSummaryPill`（現在の設定を 1 行で表示 + Copy link）

## 8) タスクリスト（細分化）

- [ ] `MatchSetupPanelMint` を新規作成し、Match.tsx の Setup 部分を移植
- [ ] Primary UI を card/segmented ベースに置き換え
  - [ ] ルール “おすすめ” を最上段に
  - [ ] 初心者が理解できる短文ラベル + 1行説明
- [ ] Advanced を折りたたみへ
- [ ] 1行サマリ（Deck/Rule/Opponent）を常に表示
- [ ] 回帰防止テスト
  - 例: Setup UI を触ると URL param が更新されること

## 9) 検証（Verification）

### 自動

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

### 手動

- モバイル幅で “Deck → ルール → 開始” が詰まらずに完了
- advanced を開くと従来の細かい設定が触れる
- share URL が変わらず使える

## 10) リスク / ロールバック

- リスク: Setup UI の移植でパラメータ更新が壊れる
  - 対策: param 更新ロジックは Match.tsx 既存関数を呼ぶだけにし、UI は薄く
- ロールバック: 新しい Setup Panel を撤去し旧 UI に戻す

## 11) PR説明（PR body 雛形）

- What: Match Setup をガイド付き + progressive disclosure で再設計
- Why: ルール/設定が分かりにくく、初見の開始体験が弱かったため
- How: Setup UI を分離し、Primary を card/segmented、Advanced を折りたたみへ
- Test: `pnpm -C apps/web test && pnpm -C apps/web build` + 手動（モバイル/URL/イベント）

## 12) Implementation Update (2026-02-14)

### Status
- [x] Setup UI extracted to component (`apps/web/src/components/match/MatchSetupPanelMint.tsx`).
- [x] Progressive disclosure implemented (Primary / Secondary / Advanced drawer).
- [x] One-line setup summary and copy setup link action added.
- [x] Existing URL param behavior preserved (`setParam` / `setParams` in `Match.tsx`).
- [x] Automated test added (`apps/web/src/components/match/__tests__/MatchSetupPanelMint.test.ts`).

### Verification
- [x] `pnpm -C apps/web test`
- [x] `pnpm -C apps/web typecheck`
- [x] `pnpm -C apps/web build`

## 13) 2026-02-15 Follow-up (UX Guardrails)

- [x] Added stable selectors in `apps/web/src/components/match/MatchSetupPanelMint.tsx`
  - setup summary line
  - first-player-mode select
  - advanced toggle/content
  - chain-cap select
- [x] Added `apps/web/e2e/match-setup-ux-guardrails.spec.ts`
  - summary reflects URL-backed key setup choices
  - advanced section auto-opens for non-manual first-player mode
  - chain-cap (`ccap`) stays synchronized in URL
- [x] Added to guardrail suite:
  - `apps/web/package.json` `e2e:ux` includes `e2e/match-setup-ux-guardrails.spec.ts`
- [x] Verification:
  - `pnpm.cmd -C apps/web e2e:ux` -> 9 passed
