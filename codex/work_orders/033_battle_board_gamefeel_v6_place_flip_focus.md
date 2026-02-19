# WO-033: Battle Board Gamefeel v6 (Place / Flip / Focus)

## ゴール

バトル盤面の「置く・めくる・選ぶ」を、
**気持ちよく（手触り）**、かつ **分かりやすく（視線誘導）**する。

参考UIの“ゲームっぽさ”の中核は、
「押した瞬間に反応する」＋「成功時にご褒美がある」＋「情報が迷子にならない」。

## 触るべき主ファイル

- 盤面
  - `apps/web/src/components/BoardViewMint.tsx`
  - `apps/web/src/mint-theme/mint-theme.css`
- ステージ演出
  - `apps/web/src/components/DuelStageMint.tsx`
  - `apps/web/src/pages/Match.tsx`

## 実装タスク

### 1) 「置ける場所」を“静かな強さ”で示す

現状の `.mint-cell--placeable` は派手に寄りがちなので、
以下へ調整する（視認性は保ちつつ、眩しさを減らす）。

- 外側の強い光彩よりも
  - **内側の縁（inset）**
  - **薄いパルス**
  - **角に小さなスパークル**

を優先。

要件:
- 「置けないセル」は無理に暗くしない（背景として残す）
- `data-vfx=low/off` でパルス・スパークルを止める

### 2) ゴーストプレビュー（任意だが効果が大きい）

マウス/トラックパッド操作時のみ:
- カードを選択中に、セルへホバーすると
  - そのセルに「薄いカード影（ゴースト）」を表示

実装案:
- `BoardViewMint` に `hoveredCell` state を追加
- `onPointerEnter` で `event.pointerType === 'mouse'` の時だけ set
- `selectedCardId` と `cardById` からカードを取得し、
  `CardNyanoDuel` を `opacity: 0.18` / `filter: saturate(0.9)` 程度で描画

モバイルでは hover が無いので無視してOK。

### 3) 置いた時の“衝撃”を作る（ripple + flash + bounce）

現状:
- `.mint-cell--placed` に `mint-cell-place` アニメーションあり

追加:
- placed cell に **リップル（波紋）** を足す
  - `mint-place-ripple` keyframes が既にあるので使う
  - DOMを増やすなら `span.mint-cell__ripple` を placed cell のみ追加
- カード本体にも軽い “squash & stretch” を足す

要件:
- 0.4〜0.6秒で収束
- 視界を塞がない（透明度は高め）
- `data-vfx=off` で停止

### 4) めくり（Flip）の“因果”を読み取れるようにする

「めくれた」ことは分かるが、
**なぜめくれたか**が分かりにくいとゲームが難しく感じる。

施策:
- 既存の回転に加えて、
  - めくれたセルに **色付きバースト**（オーナーカラー）
  - 元セル→対象セルの **短いトレイル**（矢印/線）

を追加。

実装案:
- `BoardViewMint` は `flippedCells` を受け取っている
- flipped セルに `span.mint-cell__burst` を挿入
- 可能なら `flippedCells` を “順序つき” で渡し、
  連鎖の順番でエフェクトを遅延させる（delay: idx*60ms）

### 5) ステージ全体の“盛り上がり”を最小コストで

`DuelStageMint` には `impactBurst` がある。
これを「大きい連鎖」でも発火させると、
盤面全体が“ゲームっぽく”なる。

- 条件例
  - `flippedCells.length >= 2` で1回だけ
  - 連続発火はクールダウン（例: 1.2s）

要件:
- `prefers-reduced-motion` / `data-vfx=low/off` で弱める/止める

### 6) 効果音・触覚（任意）

- 既存SFXがある前提で、
  - “置いた”
  - “めくった”

の音量/種類を少しだけゲーム寄りに調整。

モバイルでは `navigator.vibrate(10)` を任意で。
設定でOFFにできるなら尚良い。

## 受け入れ基準

- 置く/めくるの反応が **一瞬で返ってくる**（体感）
- 置ける場所が自然に見える（光り過ぎない）
- 連鎖が起きた時に気持ちいいが、視認性を壊さない
- `data-vfx=off` で大半の演出が止まる
- `pnpm -C apps/web build` が通る

## 手動チェック

- PC（マウス）: ゴーストプレビューが邪魔にならない
- スマホ（タッチ）: 置く操作の邪魔をしない
- 連鎖時: 何が起きたか分かる
- 低VFX: 目に痛くない & 軽い
