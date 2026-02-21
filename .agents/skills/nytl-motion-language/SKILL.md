---
name: nytl-motion-language
description: Apply Nyano Motion Language v0.1 across UI. Trigger when asked to add cute/premium motion, easing, micro-interactions, or battle juice. Must respect prefers-reduced-motion and data-vfx tiers.
---

# nytl-motion-language

## 目的
Nyano Triad League の UI を「かわいく、上質で、迷わない」触感へ統一します。

## 参照
- 仕様表: `docs/01_design/NYTL_MOTION_LANGUAGE_SPEC_TABLE_v0_1_ja.md`

## コア原則
- 動きは意味のために使う（情報を読ませるための補助）
- 常時動くものは薄く、短く、少なく（Ambientは最後に入れる）
- `transform/opacity` を優先して、レイアウトを揺らさない

## 安全規約
- `prefers-reduced-motion: reduce` では非本質モーションを停止/置換
- `data-vfx=off|low|medium|high` で段階導入（offでも成立させる）

## 実装の型
- motion tokens（CSS variables）を `:root` と theme（mint/rpg/overlay）へ
- motion primitives（Pressable, Popover, Toast, BoardCell）に集約
- 盤面の要所（選択→配置→奪取→連鎖）へ適用し、効果測定
