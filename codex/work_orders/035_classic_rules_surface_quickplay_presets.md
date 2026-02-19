# WO-035: Classic Rules Surface (Quick Play / Arena / Share)

## ゴール

過去に追加した classic rules（Order/Chaos/Swap/Reverse/Ace-Killer/Plus/Same/Type系/Open系）を
**「使える場所」へ露出**し、
プレイヤーが迷わず選べるようにする。

今の課題:
- 実装はあるが、入口導線（Home/Arena）から“気づきにくい”
- ルールが多いので、選び方が難しい

## 関連コード

- ルールエンジン
  - `packages/triad-engine/src/classic_rules.ts`
  - `packages/triad-engine/src/classic_rules_meta.ts`
  - `packages/triad-engine/src/classic_rules_param.ts`
- UI/設定
  - `apps/web/src/components/match/MatchSetupPanelMint.tsx`
  - `apps/web/src/components/match/MintRulesetPicker.tsx`
  - `apps/web/src/components/ClassicRulesRibbonMint.tsx`
  - `apps/web/src/pages/Home.tsx`
  - `apps/web/src/pages/Arena.tsx`

## 実装タスク

### 1) “プリセット”で入口を作る

ユーザーは最初から細かいスイッチを弄れない。
まずは **プリセット（おすすめ）** を作る。

例（提案）:
- Classic Light: `Open(Three)` + `Order`
- Classic Plus/Same: `Same` + `Plus`
- Chaos Party: `Chaos` + `Reverse` + `Swap`
- Type Battle: `Type Ascend`（or Descend）

要件:
- 3〜6個程度（多すぎると逆効果）
- 各プリセットに “ひとこと説明” を付与
- 「カスタム」へ進む導線も用意

### 2) Home / Arena から使えるようにする

最低限どちらかでOKだが、理想は両方。

- Home: Quick Play の下に「ルール: Standard / Classic（プリセット）」
- Arena: Match作成時に「ルールを選ぶ」カードを追加

要件:
- 2タップ以内で classic preset を選べる
- 選択したルールが Match URL（rk=classic_custom or preset id）に反映される

### 3) Match中にルールを理解できる

- `ClassicRulesRibbonMint` は表示されている前提。
- ここに「？」ボタン（説明モーダル）を付ける。
  - ルール名 + 1行説明
  - `classic_rules_meta` を使って表示

※説明は長くしない。迷ったら短く。

### 4) 共有（Share）

- 現在のルールセットをコピーできる
  - 既に仕組みがあるなら利用
  - 無ければ `buildMatchRulesetUrl` を拡張

要件:
- コピー後にトーストで通知

## 受け入れ基準

- classic rules が “入口（Home/Arena）” から選べる
- プリセットは少数精鋭で分かりやすい
- Match中にルール内容を理解できる
- 共有URLで同じルールが再現できる

## 手動チェック

- プリセットを選ぶ → Match開始 → リボンに反映
- 共有URLを別タブで開く → 同じルールになる
