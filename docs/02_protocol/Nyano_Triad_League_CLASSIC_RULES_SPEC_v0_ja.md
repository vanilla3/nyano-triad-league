# Nyano Triad League Classic Rules Spec (draft)

Status: draft (v0)

この文書は、FFXIV系のトリプルトライアドで使われる「追加ルール」群を、Nyano Triad League のプロトコル思想（決定論・検証可能性・後方互換）に合わせて導入するための仕様案です。

参照（ルール説明の原典）: https://llenn-diary.com/tripletriad_rule/

---

## 1. 目的

- 試合ごとの「縛り」や「クセ」を増やし、対戦の読み合いを豊かにする。
- 乱数を含むルールも、**決定論的（salt + transcript から再現可能）**にする。
- 既存の TRANSCRIPT_SPEC_v1 / RULESET_CONFIG_SPEC_v1 を壊さず、段階的に拡張できる設計を提供する。

---

## 2. 非ゴール

- 既存の on-chain settlement（コントラクト）の即時対応。
- 既存の公式 onchain ruleset（`official_onchain_rulesets.json`）の置き換え。
- 「ドラフト」「サドンデス」を v1 transcript だけで表現すること（構造上困難）。

---

## 3. 用語

- **Classic Rules**: FFXIV由来の追加ルール群（本仕様の対象）。
- **ルール有効（active）**: ruleset の設定により、その試合で該当ルールの判定が行われる状態。
- **決定論的乱数（deterministic RNG）**: `header.salt` 等から導出される再現可能な疑似乱数。

---

## 4. 設計思想（Nyano側の不変条件）

本プロジェクトは、次を「壊さない」ことを最優先とする。

1. **決定論**: 同一の `Transcript` / `CardData` / `Ruleset` からは常に同じ結果が得られる。
2. **検証可能性**: 第三者が replay できる（隠し状態がある場合も、少なくとも seed から再現可能）。
3. **後方互換**:
   - `TranscriptV1` は固定長 9 ターンであり、その形は維持する。
   - `state_json v1` / `streamer_bus v1` は「追記のみ」(additive) を原則とする。

---

## 5. ルール定義（Nyano版）

### 5.1 オーダー（Order）

- 各プレイヤーは、手札の「左から順」に出す。
- `cardIndex` は **未使用の最小 index** でなければならない。
- 実装は「検証」主体: transcript の `cardIndex` が規則に合わない場合は invalid とする。

### 5.2 カオス（Chaos）

- 各ターンに出すカードは、残り手札から **決定論的乱数** で選ばれる。
- transcript の `cardIndex` は「その乱数結果」と一致しなければならない。
- 乱数の seed は `header.salt` から導出し、(turnIndex, player) を混ぜる。

### 5.3 オールオープン（All Open）

- 両者の 5 枚手札を最初から公開する。
- 盤面結果には影響しない（UI/観戦表現のルール）。

### 5.4 スリーオープン（Three Open）

- 相手の手札 5 枚のうち、3 枚だけ公開する。
- 公開する 3 枚は **決定論的乱数**で決める。
- 盤面結果には影響しない（UI/観戦表現のルール）。

### 5.5 スワップ（Swap）

- 試合開始前に、互いの手札から 1 枚ずつを **決定論的乱数** で選び、交換する。
- transcript header の deck は「交換前デッキ」を保持してよい。
  - engine は内部で swap を適用した deck を使ってシミュレートする。
- 交換後の deck で Order/Chaos 等のルールを判定する。

### 5.6 リバース（Reverse）

- 比較ルールを反転し、**小さい数字が勝つ**。
- 同値の場合は従来通り `janken` により勝敗を決める。

### 5.7 エースキラー（Ace Killer）

- 例外規則として、`1` は `10`（A）に勝つ。
- それ以外の比較は通常の大小で判定する（Reverse がある場合は Reverse の比較規則に従う）。

### 5.8 タイプアセンド（Type Ascend）

- Nyano側の「タイプ」は `CardData.trait` を用いる（`none` はタイプ無し扱い）。
- タイプ `T` のカードが盤面に「出された」回数に応じ、タイプ `T` を持つカードの全辺を `+k` する。
  - `k` は「その試合で `T` が出された回数」。
  - 影響対象は **両者の手札・盤面**（同タイプは相手に出されても強くなる）。
- 端値は `clampEdge`（min/max）で丸める。

### 5.9 タイプディセンド（Type Descend）

- Type Ascend の逆。
- タイプ `T` のカードが出された回数に応じ、タイプ `T` を持つカードの全辺を `-k`。
- 数値は最低 1 を下回らない（Nyano側の edgeMin と整合するため、実装は `clampEdge` を使う）。

### 5.10 プラス（Plus）

- 置いたカードについて、隣接カードとの接触辺の「合計値」を計算する。
  - 例: 置いたカードの `right` と、右隣カードの `left` を足す。
- **合計値が一致する辺が 2 辺以上**ある場合、その一致に関与した隣接カードをひっくり返す。
  - ただし、隣接カードの中に相手色が 1 枚も無い場合は何も起きない。
- ひっくり返しで得たカードは、既存の chain flip（コンボ）処理の起点になり得る。

### 5.11 セイム（Same）

- 置いたカードの接触辺と、隣接カードの接触辺が「同値」である辺が **2 辺以上**ある場合、該当する隣接カードをひっくり返す。
  - ただし、隣接カードの中に相手色が 1 枚も無い場合は何も起きない。
- ひっくり返しで得たカードは chain flip（コンボ）処理の起点になり得る。

### 5.12 サドンデス（Sudden Death）

- 引き分けの場合、盤面の自分色カードで再試合する。

注意: Nyano の `TranscriptV1` は 9 ターン固定のため、Sudden Death を 1 transcript に収めるには
`TranscriptV2`（複数ラウンド）等が必要。v0 の実装スコープからは外す。

### 5.13 ルーレット（Roulette）

- ルール候補群のうち 1 つだけを、試合開始時に **決定論的乱数**で選択して適用する。

### 5.14 ドラフト（Draft）

- 試合開始前に大会側が提示したカードプールから選んでデッキを構築する。
- match シミュレーション自体は「結果としての deck」を使えば良いが、
  カード提示プールと選択手順をプロトコル化する場合は別仕様が必要。

---

## 6. 決定論的乱数（deterministic RNG）

### 6.1 目標

- salt が固定なら、あらゆる Classic ルール由来の乱数結果は常に一致する。
- 異なる用途（Swap/Chaos/ThreeOpen/Roulette…）の乱数が衝突しないように「ドメイン分離」を行う。

### 6.2 推奨アルゴリズム

`keccak256` を用いる。

```
seed0 = keccak256(
  "nyano-triad-classic-rng-v1" ||
  header.salt ||
  header.playerA ||
  header.playerB ||
  header.rulesetId
)

seed(tag, i...) = keccak256(seed0 || tag || encode(i...))

randUint(tag, i..., mod) = uint256(seed(tag,i...)) % mod
```

注: `tag` は ASCII の固定文字列（例: `"swap"`, `"chaos"`, `"three_open"`）。

---

## 7. ルール間相互作用（優先順位の推奨）

同一ターンで複数ルールが有効な場合、次の順序で解釈する。

1. **前処理**: Swap/Roulette 等、試合開始時に確定するものを確定。
2. **出すカードの決定**: Order/Chaos により `cardIndex` を決定（または transcript を検証）。
3. **カード配置**: warning mark / combo bonus / formation bonus / trait effects / type ascend/descend 等の「辺値修正」を適用。
4. **特殊ひっくり返し**: Same / Plus を評価し、該当カードをひっくり返す。
5. **通常比較によるひっくり返し**: Reverse/Ace Killer など比較規則を適用しつつ、既存の chain flip を実行。
6. **得点/勝敗**: 既存ルールに従う（Sudden Death は v0 では対象外）。

---

## 8. 実装ガイド（差分の当たり）

推奨の実装単位:

- `packages/triad-engine`
  - ruleset config: `RulesetConfigV2`（`version: 2`）を導入し、Classic Rules の有効/無効を表現。
  - RNG helper: `classic_rng.ts` 等。
  - engine: cardIndex 検証（Order/Chaos）と、比較ロジック（Reverse/AceKiller）、特殊ひっくり返し（Same/Plus）、タイプ昇降（Ascend/Descend）。
  - tests: ルールごとの「ゴールデンテスト」を追加。

- `apps/web`
  - ruleset picker: Classic ruleset を選べるように。
  - UI 表示: AllOpen/ThreeOpen による伏せ札表現、Swap によるデッキ表示。
  - vote allowlist: Order/Chaos で legal move が狭まる場合の allowlist を更新。
