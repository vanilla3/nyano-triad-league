# Codex 作業ガイド（Nyano Triad League）

このフォルダは、Codex（GPT-5.3-Codex など）へ作業依頼を出す際の「作法」と「テンプレ」を置く場所です。

## 1) まず知っておくこと

- Codex は作業開始前に `AGENTS.md` を読みます。
  - リポジトリ直下 `AGENTS.md` と、各ディレクトリ（例: `apps/web/AGENTS.md`）の指示を階層的にマージします。
- このリポジトリでは **決定論**（transcript 再現）と **URL / プロトコル互換**が最優先です。

運用メモ（短いガイド）:
- `codex/CODEX_OPERATOR_GUIDE.md`

## 2) 推奨ワークフロー（失敗しにくい）

1. **現状把握**（該当ページ/コンポーネント/仕様 doc を読む）
2. **ExecPlan を書く**（大きめ改修・不確実性が高い場合）
   - テンプレ: `codex/PLANS.md`
   - 既存例: `codex/execplans/`
3. **小さく実装**（1 PR = 1 まとまり）
   - `codex/work_orders/*.md` を 1 本ずつ
4. **必ず検証**
   - フロント: `pnpm -C apps/web test && pnpm -C apps/web build`
   - エンジン: `pnpm -C packages/triad-engine test`


UI/モーションの目視確認（開発用）:
- `apps/web` を起動して `http://localhost:5173/motions?dev=1` を開き、VFX tier 切替と主要アニメの再生を確認する

5. **ログ更新（必要なら）**
   - `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
   - `docs/99_dev/IMPLEMENTATION_LOG.md`

補足: Work Order を 1 本ずつ回すなら `codex/scripts/run_work_order.sh` / `.ps1` を使うと安全です。

事前チェック（おすすめ）:

- `pnpm codex:doctor`
  - Work Order の重複ID（同じ 3 桁 prefix）
  - text hygiene（mojibake / 制御文字 / PUA / 文字化け replacement）
  - pnpm lock 方針（package-lock の混入）
  - deploy 設定ファイルの有無

- `pnpm lint:motion`
  - 参照している `animate-*` / `flip-delay-*` 等が **実際に定義されているか** を検査（かわいいモーション集の回帰防止）

- `pnpm codex:index`
  - `codex/WORK_ORDERS_INDEX.md` を再生成（Work Order が増えた時に便利）

※ Work Order は **必ず 3 桁 prefix が一意**になるようにしてください（例: `049_*.md`）。

## 3) 依頼文テンプレ（コピペして使う）

- 目的（ユーザー体験として何が良くなるか）
- 対象（ページ/コンポーネント/URL）
- 非ゴール（今回はやらないこと）
- 受け入れ基準（操作手順 + 期待結果）
- 破壊禁止の条件（URL互換、schema、WebGL fallback、reduced motion など）
- 検証コマンド

> テンプレファイル: `codex/WORK_ORDER_TEMPLATE.md`

## 4) 公式リファレンス（Codex）

- AGENTS.md: https://developers.openai.com/codex/guides/agents-md/
- Config basics: https://developers.openai.com/codex/config-basic/
- Config reference: https://developers.openai.com/codex/config-reference/
- Security（approval/sandbox）: https://developers.openai.com/codex/security/
- Prompting guide（Cookbook）: https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide/
- Exec Plans（Cookbook）: https://developers.openai.com/cookbook/articles/codex_exec_plans/
