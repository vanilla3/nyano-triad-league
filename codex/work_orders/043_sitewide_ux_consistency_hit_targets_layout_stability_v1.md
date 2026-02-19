# WO-043: Sitewide UX Consistency（ヒット領域 / レイアウト安定 / 押せる感）

目的: 見た目が良くなっても「触りにくい」「誤操作する」「ガタつく」ではゲームにならない。

サイト全体を横断して、
**Nintendo品質の“迷わなさ”**を支える基礎（押せる感・一貫性・安定）を整える。

---

## Scope

- ✅ ヒット領域（最小サイズ）の統一（ボタン/アイコン/タブ/カード）
- ✅ “押せる/押せない” の判別性（hover/disabled/focus）
- ✅ レイアウト安定（CLS）対策（可変要素の予約領域、absolute利用）
- ✅ スクロール/ページ遷移時の違和感を減らす（トップに戻る/戻らないの一貫性）

- ❌ デザインの全面刷新はしない（ミントテーマの範囲で整える）

---

## 対象ファイル（目安）

- App shell / Navigation:
  - `apps/web/src/components/mint/MintGameShell.tsx`
  - `apps/web/src/components/mint/MintNav.tsx`

- Buttons:
  - `apps/web/src/components/mint/MintPressable.tsx`
  - `apps/web/src/components/mint/MintButton.tsx`（存在する場合）

- Pages:
  - `apps/web/src/pages/Home.tsx`
  - `apps/web/src/pages/Decks.tsx`
  - `apps/web/src/pages/Arena.tsx`
  - `apps/web/src/pages/Replay.tsx`

- Styles:
  - `apps/web/src/mint-theme/mint-theme.css`

---

## 実装方針

### 1) 最小ヒット領域

- “押せるもの” は最小サイズを統一する。
  - 目安: 44px〜48px（タップ前提）

実装案:
- `.mint-hit`（または既存クラス）に `min-height/min-width` を持たせる
- アイコンボタンは `padding` で当たり判定を広げる

### 2) 押せる/押せないの見分け

- hover: 少し明るく／浮く
- active: 沈む
- disabled: コントラストを下げ、カーソル/押下反応を止める
- focus-visible: 目立つ rim（キーボード操作の迷いを消す）

### 3) レイアウト安定（CLS）

- 可変コンテンツ（コメント、バッジ、ツールチップ）は
  - 予約領域を確保、または absolute overlay にする
- “開いた瞬間に全体がズレる” を禁止

### 4) ページ遷移の一貫性

- 画面遷移時の scroll 挙動（維持/トップ）をルール化し、統一する
- `AnimatedOutlet` の出現/消失が、コンテンツを押し下げない

---

## Acceptance Criteria

- [ ] 主要操作のヒット領域が小さすぎない（アイコン/タブ含む）
- [ ] hover/active/disabled/focus の見分けが付く
- [ ] UI の表示/非表示でレイアウトがガタつかない
- [ ] 戻る/進むの体験がページごとにブレない

---

## 実行コマンド

```bash
pnpm -C apps/web typecheck
pnpm -C apps/web test
pnpm -C apps/web lint
pnpm -C apps/web build
```
