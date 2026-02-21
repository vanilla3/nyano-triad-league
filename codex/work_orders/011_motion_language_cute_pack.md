# Work Order: 011 — かわいいモーション言語 v1（トークン化 + 主要UIへ適用）

## 1) 背景 / 目的

Nyano Triad League はゲームサイトなので、UIは「見た目」だけでなく **触り心地（ゲーム感）** が品質を決めます。

参考サイト（yui540 motions）の方向性を踏まえつつ、
Nyano Triad League 用に **再利用できる“モーション言語”** を実装し、
主要な操作点（ボタン/カード/盤面/モーダル）へ適用してください。

## 2) 成果物（Deliverables）

- [ ] モーション言語 v1 の実装（トークン + ユーティリティ）
- [ ] `prefers-reduced-motion` と `data-vfx` での抑制が一括で効く
- [ ] 主要UI（最低限：ボタン、カード、盤面セル、モーダル/トースト）に適用
- [ ] `/_design/motions` のような **調整用ショーケース**（簡易でOK）
- [ ] 既存の見た目/UX を破壊しない（回帰が無いこと）

## 3) 要件（Requirements）

### MUST

- 仕様参照：
  - `docs/03_frontend/MOTION_LIBRARY_SPEC_v1_ja.md`
  - `docs/03_frontend/MOTION_IMPLEMENTATION_STATUS_20260221.md`

- “状態変化が分かる”ことを最優先（可愛さはその次）
- 盤面は **派手すぎない**（連続で気持ちよく、疲れない）
- `prefers-reduced-motion: reduce` では常時アニメ停止（フェード/色変化程度）
- `data-vfx="off"` では常時アニメ停止（背景/シマー/浮遊も止める）

### SHOULD

- モーションの値（duration/easing/scale/translate）を **CSS変数**で統一
- Tailwind の `animation`/`transitionTimingFunction` も拡張してクラスで呼べる
- “押した感”（MOT-01）をサイト全体で統一

### COULD

- 連鎖フリップ（MOT-13）に段階演出（小→中→大）
- レア度に応じた獲得エフェクト（MOT-10/11）

## 4) 非要件（Non-goals）

- ルール追加/変更
- アートアセットの大規模差し替え（必要ならプレースホルダでOK）

## 5) 受け入れ条件（Acceptance Criteria）

1. 主要クリック要素の押下が “同じ触感” になる
   - 例：`.btn` / カード / セル

2. `data-vfx="off"` と `prefers-reduced-motion: reduce` で
   - 常時アニメが止まり、操作に支障がない

3. `/_design/motions` で MOT-01〜14 のうち少なくとも 8 種が確認できる

4. `pnpm -C apps/web build` が通る

## 6) 調査ポイント（Investigation）

- `apps/web/src/styles.css`
  - 既に “呼吸/トースト/シマー/リプレイ” がある
- `apps/web/src/motions.css`
  - legacy `index.css` 由来のモーションを復活させた（盤面/バナー等）
- `apps/web/tailwind.config.ts`
  - `fade-in`, `fade-in-up`, `confetti`, `shake`, `bounce-subtle`, `pulse-soft` などがある
- 適用候補
  - `apps/web/src/components/GameResultOverlay.tsx`
  - `apps/web/src/components/BoardView.tsx`
  - `apps/web/src/pages/_design/Overlay.tsx`

## 7) 実装方針（Approach）

### ステップ案

1) Motion token を追加
- `:root` に `--m-dur-*`, `--m-ease-*`, `--m-amp-*` を追加
- 既存の値を置き換えるのではなく、段階的に導入

2) Motion utility を追加
- `motion-press`, `motion-hover`, `motion-pop-in`, `motion-pop-out`, `motion-magnet` 等
- 可能なら `@layer utilities` にまとめる

3) 主要UIに適用
- ボタン `.btn` → MOT-01/02
- 盤面セル（置ける/選択）→ MOT-03/07
- モーダル/トースト → MOT-04/05

4) ショーケースページ
- `/src/pages/_design/Motions.tsx` を新規
- ルーターに追加（開発用でOK）

## 8) タスクリスト（細分化）

- [ ] Motion token 追加（CSS変数）
- [ ] Motion utility 追加
- [ ] `.btn` を MOT-01/02 に寄せる
- [ ] 盤面セルの hover/selected を MOT-03 で誘導
- [ ] `/_design/motions` 追加
- [ ] VFX / Reduced motion の確認

## 9) 検証（Verification）

### 自動
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

### 手動
- `data-vfx=off` で “動きが止まるが分かりやすい”
- モバイル幅でも押下が気持ちいい（反応が遅れない）

