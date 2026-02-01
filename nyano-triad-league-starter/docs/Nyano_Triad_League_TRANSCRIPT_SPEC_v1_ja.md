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
- **公式戦**：オンチェーンで結果を確定し、イベントとして永続化される試合

---

## 3. フィールド定義（論理モデル）

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
  - Earth系ルールで“配置時の選択”がある場合に使用
- `reserved: uint8`  
  - 将来拡張用（常に0を推奨）

> 重要：rulesetが利用しないフィールドは **無視** する。  
> （例：警戒マーク無効のrulesetでは `warningMarkCell` を無視）

---

## 4. 正当性ルール（Validation）

トランスクリプトは以下を満たす必要がある：

- デッキ内の tokenId は **重複不可**
- 9手の `cell` は **重複不可**（同じマスに2回置かない）
- 各ターンの `cardIndex` は、そのプレイヤーがまだ使っていないカードであること
- `deadline` は未来（または「今から十分短い」）であること（UI側で制約）
- `warningMarkCell` は **空きマス** であること（置いた時点で）
- `warningMark` の使用回数は ruleset の上限以下であること
- `earthBoostEdge` は ruleset が要求する場合のみ必須、それ以外は255推奨

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
