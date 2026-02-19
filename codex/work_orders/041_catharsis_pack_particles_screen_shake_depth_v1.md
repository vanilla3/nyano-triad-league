# WO-041: Catharsis Pack（Particles / Screen Shake / Depth）

目的: 「置いた・奪った・連鎖した・勝った」の瞬間に、
**中毒性のある気持ちよさ（カタルシス）**を足す。

ただし常時派手にしない。
派手さは **イベントの重要度** と **VFX設定** によって段階的に出す。

---

## Scope

- ✅ Match（Mint stage）のイベントに合わせて VFX を追加
  - 置いた: ripple
  - 奪った: burst + micro shake
  - 連鎖: stronger burst + converge
  - 勝利: win burst + confetti（vfx=high のみ）
- ✅ Z軸/奥行き表現を少し強化（カード/スロット/盤面フレーム）
- ✅ `prefers-reduced-motion` と `data-vfx` で安全に抑制できる

- ❌ ゲームロジック変更（triad-engine）はしない
- ❌ 演出をMatch以外へ無理に波及させない（必要なら別WO）

---

## 対象ファイル

- Match stage wrapper:
  - `apps/web/src/components/DuelStageMint.tsx`
- Board:
  - `apps/web/src/components/BoardViewMint.tsx`
- Reaction/VFX gating:
  - `apps/web/src/components/NyanoReaction.tsx`
  - `apps/web/src/lib/vfxQuality.ts`
- Styles:
  - `apps/web/src/mint-theme/mint-theme.css`

---

## 実装方針

### 1) “重要度” を UI 側で扱えるようにする

既存の `impactBurst` を拡張し、段階表現をできるようにする（例）:

- `impactBurst: null | "soft" | "medium" | "hard" | "win"`

この値は **UI専用**。
ゲームの結果・乱数・勝敗には影響しない。

### 2) Screen Shake（小さく、短く、限定的に）

- `hard` と `win` だけ付ける（`medium` は任意）
- 4〜8f 程度（短い）
- 1〜3px 以内（小さい）

`prefers-reduced-motion` では shake 無効。

### 3) Particles（軽量DOM + CSS変数で）

外部ライブラリ無しで実装する。

推奨案:
- `MintParticlesBurst` コンポーネントを作り、
  `burstId` が変わったタイミングで particle seed を生成
- particle は `<span>` を N 個並べ、CSS変数でランダム値を渡す
  - `--dx`, `--dy`, `--rot`, `--delay`, `--scale`
- CSS keyframes は 1種類にして、変数で挙動を変える

`data-vfx` により粒子数を変える:

- off: 0
- low: 0〜4（ほぼ無し）
- medium: 6〜10
- high: 12〜18 + confetti

### 4) Depth（Z軸）

- Board の “凹み” を内側影で強調
- Card は hover/drag/selected で `translateZ` をほんの少し（やりすぎない）
- パネル類は “前/中/後” のレイヤーを `z-index` と shadow で統一

---

## Acceptance Criteria

- [ ] 置いた/奪った/連鎖/勝利の瞬間が「気持ちいい」方向へ増強される
- [ ] ただし常時派手にならない（演出の出る頻度・面積が適切）
- [ ] `prefers-reduced-motion` と `data-vfx=off` で演出が抑制される
- [ ] レイアウトが崩れない（CLS無し。DOM追加で押し広げない）
- [ ] Match の処理・勝敗・ターン進行に影響しない

---

## 手動チェック

- Match: 1枚置く / 奪う / 連鎖（複数枚反転） / 勝利 の4パターンを見る
- `data-vfx=off/low/high` で段階差が出る
- `prefers-reduced-motion` で shake が止まる

---

## 実行コマンド

```bash
pnpm -C apps/web typecheck
pnpm -C apps/web test
pnpm -C apps/web lint
pnpm -C apps/web build
```
