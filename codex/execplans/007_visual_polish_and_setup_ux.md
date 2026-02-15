# Visual Polish & Setup UX (Long-term) — ExecPlan 007

この ExecPlan は living document です。`Progress` / `Decision Log` / `Surprises & Discoveries` / `Outcome` を作業とともに更新します。

---

## 1) Purpose / Big Picture

Nyano Triad League の体験は、カードの見た目は強くなってきた一方で、
**盤面（舞台）・設定（導線）・コメント/カットイン（演出）**が “ゲーム会社品質” に届く余地があります。

本 ExecPlan の目的は次の 3 点です。

1. **盤面とステージの視覚品質を上げる**
   - 背景/質感/奥行き/光/情報階層を整え、「置きたくなる盤面」にする

2. **設定 UI を「触るだけで分かる」水準へ**
   - Match Setup の情報密度を制御し、初心者でも迷わず開始できる
   - ただし URL 互換・上級者の自由度は落とさない

3. **演出がレイアウトを壊さない**
   - Nyano コメント（NyanoReaction）の表示で UI がガタつかない
   - reduced-motion / low-vfx を尊重し、端末性能差でも破綻しない

---

## 2) Scope

### In-scope

- 盤面/ステージの視覚アップデート（主に Mint UI / Stage-first）
- Nyano コメント/カットインのレイアウト安定化
- Match Setup（ルール設定含む）の情報設計・UI 改善
- UX Scorecard の追加項目（必要なら）
- 最低限の回帰防止（unit/e2e）

### Out-of-scope

- ルール/エンジンの破壊的変更（決定論や transcript 再現を崩す変更）
- 既存 URL 互換や `state_json v1` の破壊
- 大量の画像アセット追加（ライセンス不明資産の導入は禁止）
- いきなり “全画面デザイン総入れ替え”

---

## 3) Non-negotiable constraints (Invariants)

- 決定論（transcript 再現）を壊さない
- URL 互換（`/match` `/replay` と query param 体系）を壊さない
- `state_json v1` / `streamer_bus` / viewer command の互換を壊さない
- Pixi/WebGL 失敗時のフォールバックを残す
- `prefers-reduced-motion` と `data-vfx` を尊重する
- タップ領域は原則 44×44px 以上

---

## 4) Current State (What exists today)

### 4-1) 盤面

- `apps/web/src/components/BoardViewMint.tsx`
- `apps/web/src/components/DuelStageMint.tsx`
- `apps/web/src/mint-theme/mint-theme.css`

課題（観測）:

- カードに比べ、盤面背景/セル/フレームの “素材感” が弱く、舞台としての説得力が不足
- 重要状態（置ける/置けない/選択/確定/連鎖）が分かる一方、見た目の統一感がまだ伸びる

### 4-2) Nyano コメント（NyanoReaction）

- `apps/web/src/components/NyanoReaction.tsx`
- `apps/web/src/pages/Match.tsx`（差し込み位置）

課題（観測）:

- コメント出現/消失でコンテンツが押し下げられ、瞬間的にレイアウトが崩れる（体験品質を損なう）

### 4-3) Match Setup（ルール設定含む）

- `apps/web/src/pages/Match.tsx`（CollapsibleSection を含め巨大）
- `apps/web/src/pages/Rulesets.tsx`（ルールセット一覧）

課題（観測）:

- 初見には選択肢が多く、何をどの順番で触れば良いかが掴みにくい
- “上級者向けの詳細” と “初心者が必要な最低限” が同列で表示されがち

---

## 5) Proposed Design

### 5-1) 盤面は「舞台（Stage）」として設計する

- 背景: ベタ色を避け、**薄いグラデーション + 控えめなパターン**で空気感を作る
- セル: 置ける/置けないの差を「色」だけに頼らず、**形状（膨らみ/沈み）と光**で説明する
- フレーム: 盤面全体が 1 枚のオブジェクトに見える “縁” を付ける
- VFX tier: `data-vfx` で段階導入（off/low は軽量、medium/high は少し豪華）

### 5-2) Nyano コメントは「レイアウトを動かさない」

- コメント領域を常に確保（slot / min-height）し、**出現は transform/opacity だけ**で行う
- テキストは 2 行程度でクランプし、急な高さ変動を避ける
- aria-live の設計を見直し、読み上げと視覚効果を両立

### 5-3) Match Setup は “ガイド付き + 詳細は折りたたみ”

- まず 3 つだけ：
  1) デッキ、2) ルール（おすすめプリセット）、3) 対戦（Nyano/人）
- “高度な設定” は一段奥（Disclosure / Drawer）
- いま何が選ばれているかを常に 1 行のサマリで表示
- 既存 URL param は内部状態の真実として維持し、UI はその編集器になる

---

## 6) Implementation Steps (Milestones)

### Milestone A: Nyano コメントのレイアウト安定化

- WO006: NyanoReaction slot 化・クランプ・回帰防止

### Milestone B: 盤面/舞台のビジュアル磨き込み

- WO007: Mint board + stage chrome の素材感・統一感アップ

### Milestone C: Match Setup（ルール設定）を Nintendo 品質へ

- WO008: Setup パネルの再設計（初心者導線 + advanced 折りたたみ）
- WO009: Rulesets 画面の “おすすめ/導線/要約” 整備（ルール選択の迷いを減らす）

### Milestone D: 回帰防止（UX regression）

- WO010: レイアウト崩れ/主要導線の E2E を追加（必要に応じて）

---

## 7) Verification

### Commands

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- （必要時）`pnpm -C apps/web e2e`

### Manual checks

- `/match?ui=mint` で Nyano コメントが出ても手札・盤面がズレない
- `/battle-stage?ui=engine&focus=1` で VFX tier / reduced-motion が効く
- モバイル幅（390px 前後）で Match Setup → 1 手目まで迷わず到達

---

## 8) Risks / Rollback

- リスク: CSS 変更で既存レイアウトが崩れる、可読性が落ちる
- ロールバック:
  - CSS を feature-flag（`data-theme` / `data-vfx`）で段階導入
  - 変更は可能な限り追加/上書きで行い、旧スタイルへ戻せるようにする

---

## 9) Progress

- [x] Milestone A / WO006
- [x] Milestone B / WO007
- [x] Milestone C / WO008
- [x] Milestone C / WO009
- [x] Milestone D / WO010

---

## 10) Decision Log

- 2026-02-14: 盤面/設定/コメントを “長期タスクの柱” として分離し、WO 単位で安全に前進する方針に決定
- 2026-02-14: NyanoReaction は mount/unmount を許容しつつ、レイアウト側は常設 slot で固定して Layout Shift を抑える方針を採用
- 2026-02-14: WO007 では既存構造を崩さず、CSS層（board/frame/cell/stage/vfx分岐）中心で素材感と統一感を上げる方針を採用

---

## 11) Surprises & Discoveries

- `NyanoReaction` 自体よりも、`Match/Replay` 側の条件描画（DOM増減）が縦ズレの主因だった。slot 化で根本を抑制できた。
- `BoardViewMint` は既に状態表現が豊富だったため、ロジック変更よりも「背景層/陰影層/VFX分岐」の調整が最も低リスクで効果が高かった。

---

## 12) Outcome / Retrospective

- WO006 を実装。`NyanoReactionSlot` を導入し、`Match/Replay` で常時 slot を確保。コメント文は 2 行クランプに統一。
- WO007 を実装。`DuelStageMint` に舞台レイヤー（rim/atmo）を追加し、`mint-theme.css` で board/frame/cell の質感と VFX tier 分岐を強化。

---

## 13) 2026-02-14 WO008 Update

- Implemented `apps/web/src/components/match/MatchSetupPanelMint.tsx`.
- Replaced the monolithic Match setup block in `apps/web/src/pages/Match.tsx` with the new panel.
- Added progressive disclosure structure:
  - Primary: deck/ruleset/opponent
  - Secondary: board/first-player mode/data mode/stream toggle
  - Advanced: chain cap + first-player advanced inputs in a drawer
- Added one-line setup summary and setup-link copy action.
- Preserved URL param canonicalization and update behavior by keeping `setParam/setParams` flow in `Match.tsx`.
- Added helper tests: `apps/web/src/components/match/__tests__/MatchSetupPanelMint.test.ts`.

## 14) 2026-02-14 WO009 Update

- Rebuilt `apps/web/src/pages/Rulesets.tsx` to add:
  - Recommended section (`おすすめ`)
  - One-line summary per ruleset
  - Direct CTA: `このルールで対戦` -> `/match?ui=mint&rk=...`
- Added `apps/web/src/lib/ruleset_discovery.ts` for rulesetId->rulesetKey resolution and UX metadata.
- Added tests: `apps/web/src/lib/__tests__/ruleset_discovery.test.ts`.
- Verified with `pnpm -C apps/web test`, `pnpm -C apps/web typecheck`, `pnpm -C apps/web build`.

## 15) 2026-02-14 WO010 Update (Completed)

- Added `apps/web/e2e/ux-guardrails.spec.ts` with two guardrail tests:
  - Match Setup controls keep URL params in sync (`rk`, `opp`, `ai`, `ui`).
  - Nyano reaction slot keeps stable non-zero layout and line-clamp behavior when comments appear.
- Validation status:
  - `pnpm -C apps/web test`: pass
  - `pnpm -C apps/web build`: pass
- Runtime execution confirmed:
  - `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` -> `2 passed`.
- Milestone D is now closed.

## 16) 2026-02-15 WO010 Operationalization Update

- Added web script: `pnpm -C apps/web e2e:ux` (`playwright test e2e/ux-guardrails.spec.ts`).
- Added CI step in `.github/workflows/ci.yml`:
  - `E2E UX guardrails` (runs before full E2E suite).
- Updated docs/work-order checklists so WO010 completion is explicit in:
  - `codex/work_orders/010_ux_regression_guardrails.md`
  - `docs/ux/UX_SCORECARD.md`

## 17) 2026-02-15 WO007 Verification Update (Automated)

- Converted WO007 manual verification points into Playwright guardrails:
  - `apps/web/e2e/mint-stage-visual-guardrails.spec.ts`
    - `vfx=off` stage-layer suppression with playable board
    - `prefers-reduced-motion` -> `data-vfx=off`
    - `390px` viewport stage/commit accessibility + no horizontal overflow
- Extended `apps/web/package.json` guardrail script:
  - `e2e:ux` now includes both
    - `e2e/ux-guardrails.spec.ts`
    - `e2e/mint-stage-visual-guardrails.spec.ts`
- Verification:
  - `pnpm.cmd -C apps/web e2e:ux` -> `5 passed`

## 18) 2026-02-15 WO009 Verification Update (Automated)

- Added Rulesets UX guardrail spec:
  - `apps/web/e2e/rulesets-ux-guardrails.spec.ts`
  - covers:
    - recommended section/cards/CTA presence
    - CTA transition to `/match` with `ui=mint` and preserved `rk`
- Added stable test selectors to `apps/web/src/pages/Rulesets.tsx`.
- Extended `e2e:ux` command to include the new spec.
- Verification:
  - `pnpm.cmd -C apps/web e2e:ux` -> `7 passed`

## 19) 2026-02-15 WO008 Verification Update (Automated)

- Added Match Setup UX guardrail spec:
  - `apps/web/e2e/match-setup-ux-guardrails.spec.ts`
  - covers:
    - setup summary updates for URL-backed key choices
    - advanced auto-open behavior for non-manual first-player mode
    - `ccap` URL synchronization in advanced settings
- Added stable test hooks in:
  - `apps/web/src/components/match/MatchSetupPanelMint.tsx`
- Extended `e2e:ux` command with the new spec.
- Verification:
  - `pnpm.cmd -C apps/web e2e:ux` -> `9 passed`
