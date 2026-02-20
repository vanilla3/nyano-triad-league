# Work Order: 008 サイト全体の “生きているUI” + シェアしたくなる仕掛け

## 1) 背景 / 目的

ゲームに関するサイトでは、サイト自体が “遊び場” であることが大切です。  
**Idle（何もしていない時）でも UI が生きている** と、触りたくなるし、シェアもされやすい。

このWOは「やりすぎない高級感」を狙います。

---

## 2) この Work Order の範囲

### MUST
- サイト全体に “生きている背景” を導入
  - 微速スクロールするグリッド + 微細ノイズ（軽量 CSS 実装）
  - `data-vfx` / reduced-motion に応じて抑制
- “シェアしたくなる” 小さな仕掛け
  - 例: Share ボタン（Web Share API が使えるなら使う / fallback はリンクコピー）
  - UI が1タップで気持ちよく反応する

### SHOULD
- 画面遷移の気持ちよさ（短い遷移 + 余韻）
- スクショ映え（余白・光・枠の設計を統一）

### NOT DO
- 常時派手なグリッチ
- 重い動画背景

---

## 3) 実装ガイド（触る場所）

- 背景: `apps/web/src/AppLayout.tsx` または共通 Layout コンポーネント
- CSS: `apps/web/src/styles.css` / `apps/web/src/mint-theme/mint-theme.css`
- Share: `apps/web/src/components/*`（共通ヘッダ or メニュー）

---

## 4) 受け入れ基準

- どのページでも背景が “死んでない” が、邪魔ではない
- `data-vfx=off` で背景演出が弱まる/止まる
- Share 導線が 1タップで成立（対応ブラウザは native share / それ以外は copy）
- `pnpm -C apps/web build` が PASS

---

## 5) 検証

```bash
pnpm -C apps/web build
```

手動:
- Home / Match / Stage / Zukan で背景が統一されている
- シェア導線を押して挙動確認
