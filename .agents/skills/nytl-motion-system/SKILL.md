---
name: nytl-motion-system
version: 1.0.0
description: |-
  Nyano Triad League の “ゲーム品質モーション” を保つためのガイド。
  タメとツメ（加速/減速/オーバーシュート）、durationの統一、reduced-motion/VFX tier
  を前提にした実装の型を提示する。
---

# NYTL Motion System Skill

## ゴール

- “触ったら必ず返事がある” を全画面で成立させる
- 速度/緩急/奥行きの **統一感** を作る
- 演出は **段階的に抑制できる**（`prefers-reduced-motion` / `data-vfx`）

---

## 設計の原則

### 1) 入場 / 退出 の基準

- 入場: `ease-out`（必要なら `ease-out-back`）
- 退出: `ease-in`
- “画面内で跳ねる” は **例外**（1回だけ。常時バウンドは禁止）

### 2) 時間（60fps換算）

- “返事” : 4〜6f（約 67〜100ms）
- 小さな切替: 8〜12f（約 133〜200ms）
- 画面要素の登場: 12〜15f（約 200〜250ms）
- 退出: 4〜8f（約 67〜133ms）

### 3) 変化量

- 可愛い: 変化量を大きくしがちだが、**上品さ**とトレードオフ。
- 原則: scale は 1.0 → 1.02〜1.05 程度に抑える（例外: 勝利演出）

---

## 実装の型（推奨）

### A) CSS tokens を先に置く

- `apps/web/src/mint-theme/mint-theme.css` に
  - duration tokens（4f/6f/…）
  - easing tokens（out/in/in-out/out-back）
  - amplitude tokens（press/hover/pop）

実装側は “値の直書き” を避け、トークン参照へ寄せる。

### B) ループは控えめに

- Idle 背景は “動いてるか分からない” 速度
- 画面内で同時に動く主役は 1つまで

### C) VFX tier と reduced motion

- `prefers-reduced-motion: reduce` → bounce/overshoot/shake/loop を無効
- `data-vfx=off` → loop / particles を無効
- `data-vfx=low` → 速度を落とす + 粒子数を減らす

---

## NG例

- 常時点滅、常時強いグリッチ
- 重要でない操作に screen shake
- 同時に多数の要素が pulse（視線が散る）

---

## 参照ドキュメント

- `docs/01_design/NYTL_UI_MOTION_SYSTEM_TAME_TSUME_v1_ja.md`
- `docs/01_design/NYTL_GAME_UI_QUALITY_PRINCIPLES_SAKURAI_LENS_v1_ja.md`
