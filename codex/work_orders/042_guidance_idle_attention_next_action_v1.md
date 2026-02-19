# WO-042: Guidance（次の一手の視線誘導 + Idle アテンション）

目的: 「触れば分かる」状態をさらに強める。

- 初見/久しぶりのプレイヤーが **迷う瞬間**にだけ、控えめに誘導する
- 誘導は常時点滅ではなく、**Idle時だけ**／**主役だけ** に絞る

---

## Scope

- ✅ Idle 検知（数秒操作が無い）で、主役 UI にだけ微弱 pulse を付ける
- ✅ Match のフェーズに応じて誘導対象を切り替える
  - 例: select_card → 手札枠
  - 例: place_card →置けるセルの薄いハイライト
- ✅ Home/Arena/Decks でも “主役ボタン” だけ軽い breath
- ✅ `prefers-reduced-motion` と `data-vfx` で停止/弱化

- ❌ チュートリアルの文章増量はしない（必要なら別WO）

---

## 対象ファイル

- Idle hook（新規）:
  - `apps/web/src/hooks/useIdle.ts`（追加）
- Match:
  - `apps/web/src/pages/Match.tsx`
  - `apps/web/src/components/BoardViewMint.tsx`
  - `apps/web/src/components/HandDisplayMint.tsx`
- App shell / Home:
  - `apps/web/src/components/mint/MintGameShell.tsx`
  - `apps/web/src/pages/Home.tsx`
- Styles:
  - `apps/web/src/mint-theme/mint-theme.css`

---

## 実装方針

### 1) Idle の定義

- pointer / keyboard / touch のいずれかが発生したら “active”
- 3〜5秒入力が無ければ “idle”
- Idle は UI の pulse を始め、入力で即停止

### 2) 誘導対象の選び方（1画面1主役）

- Match:
  - `phase=select_card` → 手札コンテナ（枠光）
  - `phase=place_card` → “置けるセル” だけ（全点滅はしない）
- Home:
  - Quick Play / Play（主役）だけ

### 3) 表現

- ループは **ゆっくり**（1.8〜3.0s）
- 変化量は **小さく**（scale 1.0 → 1.015 程度）
- 透明度チカチカは禁止

### 4) 抑制

- `prefers-reduced-motion` → pulse 無効
- `data-vfx=off` → pulse 無効
- `data-vfx=low` → pulse をさらに弱く/遅く

---

## Acceptance Criteria

- [x] 初見でも次の行動が迷いにくい（“押せる場所” が自然に目に入る）
- [x] うるさくない（主役以外は動かない、点滅しない）
- [x] `reduce motion` / `vfx=off` で停止し、静的でも成立する

---

## 実行コマンド

```bash
pnpm -C apps/web typecheck
pnpm -C apps/web test
pnpm -C apps/web lint
pnpm -C apps/web build
```
