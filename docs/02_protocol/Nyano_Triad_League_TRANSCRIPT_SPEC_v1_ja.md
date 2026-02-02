# Nyano Triad League — 対戦トランスクリプト仕様（v1）

この仕様は **(a) オフチェーン参照実装（TS）** と **(b) 公式戦オンチェーン決済** が一致するための「唯一の真実」です。
運営がいなくても第三者がUI/解析/検証ツールを作れるよう、形式は公開・安定させます。

---

## 1. 設計原則

- **決定論**：同じ入力（トランスクリプト＋オンチェーン属性）→同じ結果
- **拡張可能**：将来ルールを増やしても互換を壊しにくい（version + reserved）
- **署名可能**：両プレイヤーが内容に同意したことを暗号学的に証明
- **第三者提出OK**：提出者（gas支払い者）はプレイヤーでなくてもよい

---

## 2. 用語

- **トランスクリプト**：試合を再現するための全入力（デッキ、先攻、9手、選択肢…）
- **ルールセット**：試合に適用するルールの集合（rulesetIdで識別）

補足：`rulesetId` の計算は別仕様に固定する（Solidity互換）。
- `docs/02_protocol/Nyano_Triad_League_RULESET_ID_SPEC_v1_ja.md`
- **公式戦**：オンチェーンで結果を確定し、イベントとして永続化される試合

---

## 3. フィールド定義（論理モデル）


### 3.0 参照オンチェーン属性（Nyano Peace）

トランスクリプトは **tokenId（=Nyano）** だけを保持し、カード性能はオンチェーンから再計算します。
公式戦（オンチェーン決済）でも、第三者のリプレイ検証でも、参照する読み取り関数は同一です。

参照する関数（すべて `view`）:

- `getTriad(tokenId) -> {up,right,left,down}`（各 1..10）
- `getJankenHand(tokenId) -> uint8`（0=Rock, 1=Paper, 2=Scissors）
- `getCombatStats(tokenId) -> {hp,atk,matk,def,mdef,agi}`（各 1..1000）
- `getTrait(tokenId) -> {classId, seasonId, rarity}`（classId 1..5 / seasonId 1..4 / rarity 1..5）
  - **ゲーム内 `TraitType`（10種）** は、`rulesetConfig.synergy.traitDerivation` により決定論で導出します
  - 仕様：`Nyano_Triad_League_TRAIT_DERIVATION_SPEC_v1_ja.md`
  - TS参照実装：`deriveTraitTypeFromNyanoTraitV1(...)` / `makeCardDataFromNyano(...)`

> 注意：トランスクリプト自体は traitType を持ちません。

同様に、**フォーメーションボーナス**もトランスクリプトに書きません。  
フォーメーションは「デッキのTraitType（導出済み）」と `rulesetConfig.synergy.formationBonuses` から派生して決定します。  
（仕様：`Nyano_Triad_League_FORMATION_BONUS_SPEC_v1_ja.md`）

  
> 「どの導出規則を使うか」は rulesetId で固定されるべきであり、後から解釈が変わらないようにします。

### 3.1 MatchHeader（固定部）
- `version: uint16`
  - v1 = 1
- `rulesetId: bytes32`
  - 例：`keccak256(rulesetConfigBytes)`
- `seasonId: uint32`
  - 0 を「非シーズン」として扱ってもよい
- `playerA: address`
- `playerB: address`
- `deckA: uint256[5]`（Nyano tokenId）
- `deckB: uint256[5]`
- `firstPlayer: uint8`
  - 0 = playerA, 1 = playerB
- `deadline: uint64`
  - これ以降は提出不可（replayの凍結）
- `salt: bytes32`
  - 同じデッキ・同じ手順でも試合IDを一意にするために必須（match hash衝突回避）

### 3.2 Turn（可変部、9要素固定）
各ターンで「配置」と、必要なら「追加アクション（例：警戒マーク）」を記録します。

- `cell: uint8`
  - 0..8（3×3を row-major で番号付け）
- `cardIndex: uint8`
  - 0..4（そのプレイヤーのデッキ内インデックス）
- `warningMarkCell: uint8`
  - 0..8 または 255（=none）
  - そのターンの配置後に「警戒マーク」を置く場合に使用
- `earthBoostEdge: uint8`
  - 0..3（0=UP,1=RIGHT,2=DOWN,3=LEFT）または 255（=none）
  - Synergy（Trait）で Earth 効果が有効な場合の“配置時選択”。
  - **そのターンに置いたカードが Earth trait かつ ruleset が `requireChoice=true` のときは、0..3 を必ず指定**。
  - Earthでないカードのターンは 255（=none）推奨（ただし ruleset は無視してよい）。
- `reserved: uint8`
  - 将来拡張用（常に0を推奨）

> 重要：rulesetが利用しないフィールドは **無視** する。
> （例：警戒マーク無効のrulesetでは `warningMarkCell` を無視）

---

## 3.3 派生値（例：連鎖数 / コンボボーナス）
- 連鎖（コンボ）は **トランスクリプトに直接書かない**（結果は決定論で導出される）。
- v2設計に基づくデフォルト定義：
  - `flipCount`：そのターンでひっくり返した枚数
  - `comboCount = 1（配置） + flipCount`
- comboBonus は `comboCount` に応じて「次の自分のカード」へ効果を付与する（Momentum / Domination / Nyano Fever）。

---

## 4. 正当性ルール（Validation）

トランスクリプトは以下を満たす必要がある：

- デッキ内の tokenId は **重複不可**
- 9手の `cell` は **重複不可**（同じマスに2回置かない）
- 各ターンの `cardIndex` は、そのプレイヤーがまだ使っていないカードであること
- `deadline` は未来（または「今から十分短い」）であること（UI側で制約）
- `warningMarkCell` は **空きマス** であること（置いた時点で）
- `warningMark` の使用回数は ruleset の上限以下であること
- `earthBoostEdge`：
  - ruleset が Earth 効果を有効化しており、かつそのターンに置いたカードが Earth trait の場合、`requireChoice=true` なら **0..3 を必須**。
  - それ以外は 255（=none）推奨（ただし未使用フィールドは ruleset が無視する）

---

## 5. 署名（EIP-712推奨）

### 5.1 Domain
- `name: "NyanoTriadLeague"`
- `version: "1"`
- `chainId`
- `verifyingContract`

### 5.2 Message
- `MatchHeader` + `Turn[9]` を含む構造体

> 実装上の注意：Solidityで `Turn[9]` のEIP-712ハッシュ化が面倒なら、
> `turnsPacked: bytes`（固定長18〜36bytes程度にパック）へ落とす設計も可。
> ただし “読みやすさ” と “実装容易性” のトレードオフを明文化すること。

---

## 6. Match ID（推奨）

- `matchId = keccak256( abi.encode(header, turns) )`
- コントラクトは `matchId` を保存して二重提出を防ぐ（replay防止）

### 6.1 参照実装（TS）の固定ABIエンコード（v1）

JSONのような曖昧なシリアライズを避けるため、v1では **固定ABIエンコード** を採用します。

```text
keccak256( abi.encode(
  uint16 version,
  bytes32 rulesetId,
  uint32 seasonId,
  address playerA,
  address playerB,
  uint256[5] deckA,
  uint256[5] deckB,
  uint8 firstPlayer,
  uint64 deadline,
  bytes32 salt,
  uint8[9] cells,
  uint8[9] cardIndexes,
  uint8[9] warningMarkCells,
  uint8[9] earthBoostEdges,
  uint8[9] reserved
))
```

正規化ルール：
- `warningMarkCell` / `earthBoostEdge` / `reserved` が未使用の場合は **255（=none）** を入れる
- 未使用フィールドは ruleset が **無視** する（ただしmatchId計算には含める）

---

## 7. バージョニング戦略

- **v1**：3×3 / 9手固定 / reserved付き
- 破壊的変更が必要なら `version` を上げ、旧バージョン決済も残す（可能なら）
- rulesetId は “同じ仕様なら同じ” を保証する（config hash）

---

## 8. 最低限のテストベクタ（必須）

- 少なくとも以下をゴールデンテストとして保存：
  - Coreのみ（警戒/traitなし）
  - 連鎖が発生するケース
  - 同値じゃんけんが勝敗を分けるケース
  - 警戒マークが勝敗を変えるケース（ruleset対応後）
  - Earth選択が勝敗を変えるケース（ruleset対応後）