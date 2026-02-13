---
name: nytl-qa-runner
description: Plan and execute verification for Nyano Triad League changes (tests/build/e2e/manual). Trigger after code changes are made or when asked to validate a PR. Provide commands, expected outputs, and a concise pass/fail report.
---

# nytl-qa-runner

## 目的
変更が入ったときに、どのテストを走らせ、何を確認すべきかを決め、結果を整理します。

## 実行の基本
- まず軽いものから：`pnpm lint` → `pnpm typecheck` → `pnpm test`
- UI/導線変更：関連する `pnpm -C apps/web e2e` を追加
- 画像/レンダラ変更：該当の unit（engine tests）を重点確認

## 手動確認（必須の観点）
- スマホ幅（375px）での操作
- 遅い回線（throttle）での画像ロード
- 失敗ケース（画像失敗、リプレイデータ破損、ネットワーク失敗）

## 出力
- 実行したコマンド一覧
- 主要ログ/失敗箇所（抜粋）
- 最終の Pass/Fail と、次のアクション

