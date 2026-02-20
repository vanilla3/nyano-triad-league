# Work Order: 007 Nyanoカットインのレイアウト安定化 + カタルシス強化

## 1) 背景 / 目的

- Nyano のコメント（カットイン）は “可愛さ” と “ゲーム感” を上げる重要要素です。
- しかし現状、出現/消失でレイアウトが動くと **一瞬崩れて見える** 可能性があります。
- また、配置/反転の「気持ちいい瞬間」が、もう一段 “中毒性” を出せます。

このWOでは、
1) カットインでレイアウトが動かない（安定）  
2) 重要瞬間だけ “強い余韻” を入れる（カタルシス）  
を実現します。

---

## 2) この Work Order の範囲

### MUST
- Nyanoカットイン（`NyanoReaction`）の表示で **レイアウトが揺れない** ようにする
  - overlay 方式（absolute）か、予約領域方式（固定高さ）で解決
  - Stage focus / 非focus / Match / Replay で挙動が一致する
- カタルシス（演出）を追加
  - flip / win / braveburst など “意味がある瞬間だけ”
  - `data-vfx` と `prefers-reduced-motion` で抑制できる

### SHOULD
- 盤面の Z軸（奥行き）を感じる演出（軽い浮き/影/ハイライト）
- 小さな screen shake（ごく短く）を high-impact 時だけ

### NOT DO
- 演出を動画ベタ貼りで重くする
- 常時点滅や過剰なグリッチ

---

## 3) 実装ガイド（触る場所）

- `apps/web/src/components/NyanoReaction.tsx`
- `apps/web/src/pages/Match.tsx`
- `apps/web/src/pages/Replay.tsx`
- `apps/web/src/mint-theme/mint-theme.css`

ヒント:
- “揺れない” の最短ルートは、**親レイアウトから切り離す**（absolute overlay）です。
- アニメは短く。出現 100〜220ms / 消失 70〜140ms を目安に。

---

## 4) 受け入れ基準

- Nyanoカットインが出ても、盤面や手札の位置がガタつかない
- high-impact 時に “気持ちいい瞬間” が増える（ただし過剰にしない）
- reduced-motion では強演出が抑制される
- `pnpm -C apps/web test` / `typecheck` / `build` が PASS

---

## 5) 検証

```bash
pnpm -C apps/web test
pnpm -C apps/web typecheck
pnpm -C apps/web build
```

手動:
- `/match` で Nyanoコメントが出る状況を作り、レイアウトが動かないこと
- `/battle-stage` で flip が発生する状況を作り、演出が “意味のある瞬間だけ” 強くなること
