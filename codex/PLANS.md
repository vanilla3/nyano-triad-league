# ExecPlan / PLANS.md (Nyano Triad League)

このドキュメントは「長めの作業（UI刷新・大型リファクタ・新機能）」を Codex に任せるときに、
**迷子を防ぐための実行計画（ExecPlan）**のテンプレです。

> 重要: ExecPlan は **“設計書” 兼 “作業ログ”** です。進捗に合わせて更新し、
> 第三者が ExecPlan だけ読めば再開できる状態を維持してください。

---

## ExecPlan テンプレ（コピペ）

以下を新規 Markdown ファイルとして作成し、内容を埋めてください。
（例: `codex/execplans/005_uiux_foundation.md`）

---

# <短く、行動が分かるタイトル>

この ExecPlan は living document です。`Progress` / `Decision Log` / `Surprises & Discoveries` / `Outcome` を作業とともに更新します。

## 1) Purpose / Big Picture

- ユーザーが **何をできるようになるか**（行動で書く）
- それが「ゲーム会社レベルの UI/UX」へどう寄与するか

## 2) Scope

### In-scope
- 

### Out-of-scope
- 

## 3) Non-negotiable constraints (Invariants)

- 決定論（transcript 再現）を壊さない
- URL 互換を壊さない
- `state_json v1` / `streamer_bus` / viewer command の互換を壊さない
- Pixi/WebGL 失敗時のフォールバックを残す
- `prefers-reduced-motion` と `data-vfx` を尊重する

## 4) Current State (What exists today)

- 触る対象ファイル:
  - 
- 現状の問題:
  - 

## 5) Proposed Design

- UI/UX の設計（画面遷移・情報設計・操作）
- コンポーネント分割（presentational / stateful）
- アニメ/音/VFX の方針（tier / reduced-motion）

## 6) Implementation Steps (Milestones)

### Milestone A: <...>
- 作業内容:
  - 
- 変更ファイル:
  - 
- 受け入れ基準:
  - 

### Milestone B: <...>
- 

## 7) Verification

### Commands

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

（必要に応じて）
- `pnpm -C packages/triad-engine test`
- `cd contracts && forge test`

### Manual checks

- 具体的な操作手順（端末幅/ブラウザ/URL/操作順）

## 8) Risks / Rollback

- 想定リスク:
  - 
- ロールバック手段:
  - 

## 9) Progress

- [ ] A-1 ...
- [ ] A-2 ...

## 10) Decision Log

- YYYY-MM-DD: 決定内容 / 理由 / 代替案

## 11) Surprises & Discoveries

- 予想外に分かったこと（制約、バグ、設計上の発見）

## 12) Outcome / Retrospective

- 何が良くなったか（ユーザー体験）
- 追加でやるべき次タスク

## Phase D — Motion Language / “Cute Pack”

- 目的：かわいいモーションを「再利用できる言語」にして、UI全体へ統一的に適用する
- 入口：`codex/work_orders/011_motion_language_cute_pack.md`

## Phase E — Deploy (Vercel + Railway)

- ドキュメント：`docs/04_ops/DEPLOYMENT_VERCEL_RAILWAY_v1_ja.md`
- Vercel SPA fallback：`vercel.json`
