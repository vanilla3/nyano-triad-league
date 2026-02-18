# Work Order: 030 — Battle Board Micro-juice v5（押した感・気持ちよさの補強）

## Goal

バトル盤面（Mint UI）の「触った瞬間の手触り」を 1 段階上げる。
特に、以下を強化する:

- カード選択 → セル選択 → 配置 の一連の流れが“気持ちいい”
- 押下（press）/ 選択（selected）/ 実行結果（placed/flip）の差が直感的

---

## Scope (in)

- `apps/web/src/components/BoardViewMint.tsx`
- `apps/web/src/components/HandDisplayMint.tsx`（必要な範囲だけ）
- `apps/web/src/mint-theme/mint-theme.css`
- 既存 SFX（必要なら最小限の拡張まで）: `apps/web/src/lib/sfx.ts`

## Out of scope (not now)

- 大規模なアニメーションライブラリ導入（framer-motion など）は今回入れない
- Pixi/WebGL 側の演出変更はやらない

---

## Requirements

### R1: Press の物理感

- セル/ボタン/カードが “押したら沈む”
  - 例: `translateY(1px)` + shadow を短く
  - `:active` だけでなく `data-pressed` などでタッチデバイスにも安定させる

### R2: Hover/Focus の一貫性

- hover（マウス）と focus-visible（キーボード）で同系統の強調
- ただし **過剰な拡大/点滅は禁止**（情報を読ませる）

### R3: 配置・奪取・連鎖の気持ちよさ

- 既存の `placing` / `flip` / `chain` の演出を壊さず、
  盤面側に “受け止め” を足す
  - セル側 ripple を少しだけ強化
  - カード側 shadow を配置瞬間に変える（置いた感）

### R4: 音（任意 / 最小限）

- 既存の SFX は `card_place/flip/chain_flip` がある
- 追加するなら “小さいタップ音” 1 種だけ（うるさくしない）
  - 例: `tap_soft` を追加し、カード選択 or セル選択の確定時に鳴らす
  - `prefers-reduced-motion` では鳴らさない（既存方針に従う）

---

## Implementation plan

### Step 0: どこが「押した感」を担うかを決める

- セル: `.mint-cell`（BoardViewMint の slot）
- 手札カード: `HandDisplayMint` 内のカードラッパ
- ボタン: `.mint-ui-pressable`（ただし今回の主役は盤面）

### Step 1: セルの press/hover/selected を明確化

- `mint-theme.css` で `.mint-cell` に以下の状態を追加
  - `:hover`（hover）
  - `:focus-visible`（keyboard）
  - `.mint-cell--pressed`（pointerdown で付与）
  - `.mint-cell--selectable` / `.mint-cell--selected`（既存）

推奨:
- press は 120ms 程度で沈む → 200ms 程度で戻る（overshoot 1 回）
- `prefers-reduced-motion` では transition を短くする or 無効

### Step 2: BoardViewMint に pointerdown/up の最小実装

- selectable なセルに対して
  - `onPointerDown` で `pressedIndex` state をセット
  - `onPointerUp/onPointerCancel/onPointerLeave` で解除
- pressed state は class 付与で表現（CSS 主導）

### Step 3: 手札カード側の選択フィードバック

- 選択中カードの “縁/影/少し浮く” を統一
- hover で少し浮く（ただしスマホでは hover が無いので、selected を最優先）

### Step 4: （任意）tap_soft SFX を追加

- `apps/web/src/lib/sfx.ts` に `tap_soft` を追加する場合
  - `export type SfxName` に追加
  - `SOUNDS` に追加
  - 音は 50〜80ms の短い pop（控えめ）
- 使用箇所は “確定操作” のみ
  - 例: カード選択確定、セル選択確定、commit

---

## Acceptance criteria

1) 盤面セルをタップ/クリックしたとき「沈み込み」が感じられる
2) hover/focus/selected の差が自然で、迷いが減る
3) 配置・奪取が気持ちよくなり、演出が邪魔にならない
4) `prefers-reduced-motion` で過剰な動き/音が抑制される
5) `pnpm -C apps/web test && pnpm -C apps/web typecheck && pnpm -C apps/web build` が通る

---

## Notes

- “強い演出” ではなく、**小さな反応の積み重ね** で手触りを作る。
- 盤面は情報密度が高いので、発光/点滅よりも「縁/影/沈み込み」を優先する。