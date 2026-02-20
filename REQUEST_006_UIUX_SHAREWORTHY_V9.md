# Codex Request: UI/UX Shareworthy v9（サイト全体 + バトル演出）

## ゴール

- サイト全体の操作感が “ゲームっぽく” なり、触っていて気持ちいい
- バトル盤面の重要瞬間（置く/反転/勝敗）にカタルシスがある
- Nyano のカットインがレイアウトを崩さない
- reduced-motion / data-vfx を守りつつ、軽量で上質な演出に寄せる
- URL / protocol / deterministic replay を壊さない

---

## 作業の進め方（必須）

1) **必ず最初に読む**
- リポジトリ直下 `AGENTS.md`
- `apps/web/AGENTS.md`
- QA: `docs/03_ops/NYTL_UIUX_QA_CHECKLIST_v1_ja.md`
- Motion: `docs/03_ops/NYTL_UI_MOTION_SYSTEM_TAME_TSUME_v1_ja.md`

2) **Work Order を順番に実行**
- `codex/work_orders/006_uiux_audit_motion_tokens.md`
- `codex/work_orders/007_nyano_cutin_layout_stability_catharsis.md`
- `codex/work_orders/008_sitewide_alive_background_and_shareworthy.md`

3) **各 Work Order ごとに**
- 変更は “最小限” で、危険なリファクタは避ける
- 必ず検証を実行し、結果をコミットメッセージに残す
- 破壊禁止（URL/決定論/フォールバック/reduced-motion）を再確認

---

## 検証コマンド（各WOの最後に）

```bash
pnpm lint:text
pnpm lint
pnpm -C apps/web test
pnpm -C apps/web typecheck
pnpm -C apps/web build
```

---

## 重要な注意（非ゴール）

- ルール変更は禁止（見た目/体験の改善に集中）
- 重い動画背景は禁止（CSS/軽量シェーダー的表現で）
- 版権が不明なアセット追加は禁止（必要なら `docs/03_ops/NYTL_ASSET_LIST_v1_ja.md` を参照して “こちらで生成” 依頼）

---

## 完了条件（最終チェック）

- カットインでレイアウトが動かない
- 主要UIの動きが統一され、押下が気持ちいい
- 背景が “生きている” が、邪魔ではない
- `pnpm lint:text` が通る
