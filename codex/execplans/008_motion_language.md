# Execution Plan 008 — Motion Language v1（かわいいモーション集の体系化）

## Goal

- 参考サイト（yui540 motions）の“触り心地”を、Nyano Triad League のUIへ自然に取り入れる
- その場しのぎのアニメ追加ではなく、**再利用可能なトークン/ユーティリティ**に落とす

## Inputs

- `docs/03_frontend/MOTION_LIBRARY_SPEC_v1_ja.md`
- `docs/03_frontend/MOTION_IMPLEMENTATION_STATUS_20260221.md`
- `apps/web/src/styles.css`
- `apps/web/src/motions.css`
- `apps/web/tailwind.config.ts`

## Strategy

1) 現状モーションの棚卸し（status doc を更新）
2) Motion token（CSS変数）を追加し、値の“言語化”を行う
3) Motion utility を作り、主要UIへ段階適用
4) `/_design/motions` で可視化してチューニング可能にする

## Work Orders

- 入口：`codex/work_orders/011_motion_language_cute_pack.md`

