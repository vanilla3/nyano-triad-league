# Work Order: 006 UI/UX Audit + Motion Tokens（サイト全体）

## 1) 背景 / 目的

前段で導入した UI/UX 改善（Stage UI/UX foundation / Mint theme / data-vfx / reduced-motion など）が、
**「綺麗に」**運用できる状態になっているかを点検し、さらに “気持ちよさ” を底上げします。

ゲーム系サイトの体験価値は、ルール以前に **触感（レスポンス + モーション + 余韻）**で決まります。  
そこで本WOでは、散らばりがちなアニメの時間・イージングを **トークン化**し、主要UIへ横断適用します。

---

## 2) この Work Order の範囲

### MUST
- UI/UX 改善が「壊れていない」ことを確認し、必要なら修復
  - reduced-motion / data-vfx が守られている
  - レイアウトの破綻・読みづらさがない
  - コンポーネント間でトーンが極端にブレていない
- **モーション設計のトークン化**
  - duration / easing を CSS variables として定義（散在する cubic-bezier を減らす）
  - ボタン、カード出現、ポップアップ、通知、カットイン等で統一感を出す
- `pnpm lint:text`（文字化け検出）が通る状態を維持

### SHOULD
- “押せた感” の統一（押下→反応が 1フレームでも早く）
- 画面遷移やセクション展開の「タメとツメ」を揃える

### NOT DO（非ゴール）
- ルール/エンジン/URL互換の破壊
- 大規模なデザイン一括置換（段階導入）

---

## 3) 実装ガイド（触る場所）

- モーション設計メモ: `docs/03_ops/NYTL_UI_MOTION_SYSTEM_TAME_TSUME_v1_ja.md`
- QA チェックリスト: `docs/03_ops/NYTL_UIUX_QA_CHECKLIST_v1_ja.md`
- CSS:
  - `apps/web/src/styles.css`
  - `apps/web/src/mint-theme/mint-theme.css`
- 主要 UI:
  - `apps/web/src/components/*`（特にボタン・ダイアログ・Nyano系）
  - `apps/web/src/pages/*`（Match/Replay/Stage）

---

## 4) 受け入れ基準

- duration/easing の共通トークンが追加され、主要 UI がそれを参照している
- reduced-motion の時、主要アニメが短縮/抑制される（無駄に動かない）
- `pnpm lint:text` が PASS
- `pnpm -C apps/web test` / `typecheck` / `build` が PASS

---

## 5) 検証

```bash
pnpm lint:text
pnpm lint
pnpm -C apps/web test
pnpm -C apps/web typecheck
pnpm -C apps/web build
```

手動:
- Home / Match / Battle Stage / Replay を軽く触って
  - 押下→反応が “気持ちいい”
  - 動きが短く、意味がある
  - 視線誘導が自然

---

## 6) 実装メモ（桜井っぽい基準）

- “同じ種類の動きは、同じ時間” にする（統一感は品質）
- “強い動きは、たまに” にする（常時強いと疲れる）
- UI は勝手に説明しない。**触った結果**が説明になるようにする
