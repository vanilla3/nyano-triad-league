# Work Order: 010 — UX Regression Guardrails（レイアウト崩れ・導線の回帰防止）

## 1) 背景 / 目的（ユーザー視点）

ビジュアルや UI を磨くほど、
「見た目は良くなったが、どこかが壊れた」という回帰が起きやすくなります。

特に今回のテーマは

- コメント出現時のレイアウト安定
- Match Setup の再設計

であり、ここは UX の根幹です。

そこで、最低限の **回帰防止（Guardrails）** をテストに入れて、
安心して磨き込みを積み重ねられる状態にします。

## 2) 成果物（Deliverables）

- [x] Playwright E2E に “重要導線” のテストを追加（最小 1〜2 本）
- [x] レイアウト安定性に関する簡易アサーション（bounding box / CLS 近似）
- [x] docs に「何を守るテストか」短く記載

## 3) 要件（Requirements）

### MUST

- テストが flaky にならない（安定する条件でのみアサート）
- 実行時間を極端に増やさない
- 既存の e2e 構成に沿う（`apps/web/e2e/*.spec.ts`）

### SHOULD

- `ui=mint` と stage focus のどちらかをカバー

### COULD

- `prefers-reduced-motion` 環境での分岐も一度は通す

## 4) 非要件（Non-goals）

- 全ページの網羅
- 画像ピクセル単位のビジュアルスナップショット（将来検討）

## 5) 受け入れ条件（Acceptance Criteria）

1. `pnpm -C apps/web e2e` が通る

2. 新規テストは以下のどちらか（または両方）を保証する

- A) Match Setup で主要設定を変えても試合が開始できる
- B) Nyano コメントが出ても手札/盤面の位置が “ほぼ変わらない”

## 6) 調査ポイント（Investigation）

- 既存 e2e:
  - `apps/web/e2e/stage-focus.spec.ts`
  - `apps/web/e2e/guest-game.spec.ts`
  - `apps/web/e2e/decks-match.spec.ts`

## 7) 実装方針（Approach）

### レイアウト安定のテスト方針（flaky回避）

- “完全に 0px” を求めず、
  **許容誤差（例: 1〜4px）** を設ける
- `getBoundingClientRect()` を2回取り、差分が許容内かを検証
- アニメ完了を待つ (`page.waitForTimeout` 乱用は避け、状態/要素で待つ)

### 導線テスト方針

- 最短導線（おすすめ設定）で 1 手目まで到達できることを確認

## 8) タスクリスト（細分化）

- [x] 新規 e2e spec を追加（または既存 spec に 1 ケース追加）
- [x] stable な待ち条件を定義（data-testid / aria-label の活用）
- [x] bounding box の差分チェックを追加（flaky にならない範囲）
- [x] docs/ux に 1 段落追記（何の回帰を防ぐか）

## 9) 検証（Verification）

- `pnpm -C apps/web e2e`
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`

## 10) リスク / ロールバック

- リスク: flaky テスト化
  - 対策: 許容誤差、待ち条件の安定化、最小ケース
- ロールバック: 追加テストを revert

## 11) PR説明（PR body 雛形）

- What: UX の重要ポイント（導線/レイアウト安定）の e2e guardrail を追加
- Why: ビジュアル/設定 UI 改修で回帰が起きやすいため
- How: 安定な待ち + bounding box 差分（許容誤差）で検証
- Test: `pnpm -C apps/web e2e`

## 12) 2026-02-14 Progress Update (WO010)

- [x] Added new E2E spec: `apps/web/e2e/ux-guardrails.spec.ts`
- [x] Added guardrail checks:
  - Match Setup URL param sync (`rk`, `opp`, `ai`, `ui`)
  - Nyano reaction slot layout stability (bounding-box delta + clamp style)
- [x] Updated docs:
  - `docs/99_dev/IMPLEMENTATION_LOG.md`
  - `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
- [x] Runtime E2E execution:
  - `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` passed (2/2).
  - Stabilization updates added for reliability:
    - tutorial suppression (`nytl.tutorial.seen`)
    - guest tutorial fallback dismiss
    - robust commit helper (`quick commit` + force click + fallback selectors)

## 13) 2026-02-15 Operationalization Update

- [x] Added dedicated web script: `pnpm -C apps/web e2e:ux`
- [x] Added CI guardrail step:
  - `.github/workflows/ci.yml` -> `E2E UX guardrails`
  - runs before full `E2E tests` to fail fast on key UX regressions

## 14) 2026-02-15 Follow-up Update (WO016 linkage)

- [x] Extended `apps/web/e2e/ux-guardrails.spec.ts` to guard WO016 behavior:
  - keyboard accessibility: board cell can be selected via `Enter` when focused (`tabindex=0`)
  - reduced-motion compliance: mint pressable controls resolve to `transitionDuration` including `0s`
- [x] Re-ran focused guardrail:
  - `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` passed (`4/4`)
