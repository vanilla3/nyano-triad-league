# Motion QA ガイド v1（かわいいモーション集の壊れ防止）

目的：NYTL では「動き」が UX の核です。  
一方で、CSS の入口や Tailwind の keyframes が整理されていく過程で **参照しているのに定義が無い（＝動かない）** 事故が起きやすいです。

このドキュメントは、**Codex が実装を進めても “モーションが死なない”** ためのチェック手順を固定します。

---

## 1) 入口（このリポジトリの前提）

- Global base: `apps/web/src/styles.css`
- Legacy motion utilities: `apps/web/src/motions.css`
- Tailwind motions: `apps/web/tailwind.config.ts` の `extend.keyframes / extend.animation`

`apps/web/src/index.css` は **legacy（非import）**。参照しているクラスが残っている場合は `motions.css` に移設する。

---

## 2) ローカル動作確認

### 2.1 モーション確認ページ

- URL: `/motions?dev=1`

確認観点：

- VFX tier（off/low/medium/high）切替で、過剰演出が抑制される
- `prefers-reduced-motion: reduce` のとき、装飾アニメが止まる
- `animate-cell-place / animate-cell-flip / result-banner-shimmer` などが実際に動く

> `?dev=1` なしで本番（PROD）アクセスされた場合は “開発用” 表示にしている（想定外露出を避ける）。

### 2.2 “死んだクラス”を検出する（CI向け）

```bash
pnpm lint:motion
```

このコマンドは `apps/web/src/**/*.{ts,tsx,js,jsx}` を走査し、
- `animate-*`（Tailwind animation utility）
- `flip-delay-*`
- `result-banner-shimmer` 等

の参照が、実際に
- `tailwind.config.ts` の `extend.animation` に存在する
- もしくは `src/motions.css` に定義されている

ことを検証します。  
不一致があると exit code 1 で落ちます。

---

## 3) ルール（運用）

- 新規のモーション追加は基本 **Tailwind（extend.keyframes/animation）** へ。
- どうしても Tailwind で扱いにくい “専用ユーティリティ” は `motions.css` へ（ただし最小限）。
- `motions.css` は **単体 import（main.tsx）** されるため、`@layer utilities` は使わない。
  - Tailwind/PostCSS の組み合わせによっては `@layer utilities` があるだけで
    `@tailwind utilities` が同一ファイルに無いとエラーになることがあります。
  - layer が必要な場合は `styles.css` へ移設する。
- `prefers-reduced-motion` と `data-vfx="off"` の両方を尊重する。
