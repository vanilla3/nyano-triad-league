# Work Order: 029 — Battle Rules Ribbon（Classic Rules を試合中に見える化）

## Goal

Classic Rules（Order/Chaos/Reverse/Plus/Same/All Open/Three Open/Type Ascend/Type Descend/Swap...）を、
**試合中（Match 画面）に一目で分かる UI** として表示する。

あわせて、Open 系ルール（All Open / Three Open）が有効なときは、
最低限「公開されているカード」が UI に反映され、ルールが“使える” 状態になる。

---

## Scope (in)

- `apps/web/src/pages/Match.tsx`
- `apps/web/src/components/`（Mint UI コンポーネント追加OK）
- `apps/web/src/mint-theme/mint-theme.css`

## Out of scope (not now)

- ルールエンジンの挙動変更（それは engine 側の Work Order）
- ルール設定画面の任天堂品質化（それは WO-027 系）

---

## Requirements

### R1: Rules Ribbon（チップ/バッジ）

- Match 画面で、現在有効な Classic Rules を「チップ列」または「リボン」として表示
  - 置き場所の候補: `BattleTopHudMint` の下 / 盤面上 / サイドパネル上部
  - “探さない” 位置に固定する（スクロールで消えない）

- チップは **短いラベル + icon 的な記号** で読める（文字を詰めすぎない）
  - 例: ORDER / CHAOS / REV / PLUS / SAME / OPEN / 3OPEN / ASC / DESC / SWAP

- チップは `title` 属性で詳細説明を補助（長文は避ける）

### R2: Open ルールの可視化（最低ライン）

- All Open / Three Open のときに、
  **公開されているカードが UI で分かる** ようにする

実装候補（推奨）:

- 左右の `PlayerSidePanelMint` の下部に「Mini hand」を追加
  - 5 枚スロットを表示（小さなカード or カード裏）
  - open 対象インデックスはカード表（小さくても絵が見える）
  - それ以外はカード裏（または薄いプレースホルダ）
  - 既に使用済みのカードは “抜けた/薄い” 表現

※ 完全に “両方の手札を常時表示” までやらなくて良い。
   ただし「公開されている/いない」がゲーム上の判断に使えること。

### R3: Order/Chaos の補助表示

- Order が有効で「このターンに置くカードが固定」になる場合、
  その情報が UI から読み取れるようにする
  - 例: 手札トレイの上に `ORDER: #3 fixed` の小バッジ
  - または選べないカードをわずかに暗くし、固定カードを強調

---

## Implementation notes

### 既に Match.tsx にある情報を活用する

Match.tsx には既に以下の情報がある:

- `classicConfig` / `classicMaskParam` / `activeClassicMask`
- `classicOpenCardIndices` / `classicOpenLabel`
- `classicForcedCardIndex`（Order/Chaos の固定）

これらを “見せる UI” に接続するだけに留める。

### Component 提案

- `ClassicRulesRibbonMint.tsx`
  - props: `{ classicConfig, openLabel, swapLabel, forcedCardIndex, ... }`
  - 表示専用（ロジックは Match.tsx に寄せる）

- `ClassicOpenHandMiniMint.tsx`
  - props: `{ cards, deckTokenIds, openIndices, usedIndices, side }`
  - 画像ロード失敗時はプレースホルダで崩れない

### CSS

- `.mint-rules-ribbon`（ガラスチップ列）
- `.mint-rule-chip`（小さいが“押せそうに見せない”：clickable にはしない）
- `.mint-openhand-mini`（小さな手札列）

---

## Acceptance criteria

1) Match（Mint UI）で試合中に、現在の Classic Rules がチップで見える
2) All Open / Three Open のとき「公開カード」が UI で分かる
3) Order/Chaos の固定カードが UI で分かる（最小限で良い）
4) `pnpm -C apps/web test && pnpm -C apps/web typecheck && pnpm -C apps/web build` が通る

---

## Suggested tests (optional)

- E2E で “classic rules 有効時に ribbon が出る” を 1 本追加できるとなお良い
  - `/match?...&cr=...` の URL パラメータで classic rules を有効化
  - `.mint-rules-ribbon` の存在を確認

（E2E が重ければユニットテストでも可。最低限、表示が壊れないこと。）