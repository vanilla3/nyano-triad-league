# Codex 作業ガイド（Nyano Triad League）

このフォルダは、Codex（GPT-5.3-Codex など）へ作業依頼を出す際の「作法」と「テンプレ」を置く場所です。

## 1) まず知っておくこと

- Codex は作業開始前に `AGENTS.md` を読みます。
  - リポジトリ直下 `AGENTS.md` と、各ディレクトリ（例: `apps/web/AGENTS.md`）の指示を階層的にマージします。
- このリポジトリでは **決定論**（transcript 再現）と **URL / プロトコル互換**が最優先です。

## 2) 推奨ワークフロー（失敗しにくい）

1. **現状把握**（該当ページ/コンポーネント/仕様 doc を読む）
2. **ExecPlan を書く**（大きめ改修・不確実性が高い場合）
   - テンプレ: `codex/PLANS.md`
3. **小さく実装**（1 PR = 1 まとまり）
4. **必ず検証**
   - フロント: `pnpm -C apps/web test && pnpm -C apps/web build`
   - エンジン: `pnpm -C packages/triad-engine test`
5. **ログ更新**
   - `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
   - `docs/99_dev/IMPLEMENTATION_LOG.md`

## 3) 依頼文テンプレ（コピペして使う）

- 目的（ユーザー体験として何が良くなるか）
- 対象（ページ/コンポーネント/URL）
- 非ゴール（今回はやらないこと）
- 受け入れ基準（操作手順 + 期待結果）
- 破壊禁止の条件（URL互換、schema、WebGL fallback、reduced motion など）
- 検証コマンド

> テンプレファイル: `codex/WORK_ORDER_TEMPLATE.md`

