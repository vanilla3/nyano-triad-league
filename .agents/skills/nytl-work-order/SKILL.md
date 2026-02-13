---
name: nytl-work-order
description: Create or update a Work Order file under codex/work_orders/ for this repository. Trigger when asked to write TODO/roadmap/task list or to turn requirements into an actionable PR plan. Do NOT edit production code; only output/update a Work Order markdown file.
---

# nytl-work-order

## 目的
ユーザーの要望を、**Codexが1PRで実装できる粒度**に落とした Work Order に変換します。

## ルール
- 実装（コード変更）はしない。Work Order（Markdown）だけ作る/更新する。
- 1 Work Order = 1 PR（大きい場合は分割提案）
- 受け入れ条件（AC）を“測定可能”にする
- 調査ポイントに、具体的なファイルパスを含める
- 検証手順（コマンド/手動シナリオ）を必ず書く

## 出力フォーマット
- `codex/work_orders/NNN_<slug>.md` を作成
- 既存テンプレ：`codex/work_orders/000_TEMPLATE.md` をベースにする

## 追加ガイド
- UI変更は before/after（スクショ or 手順）を必ず要求
- NFT/Replayは後方互換を意識（破壊的変更はversioning）

