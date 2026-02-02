# Nyano Triad League — Trait導出仕様（v1）

Nyano Peace（BlueAtelierNFT）の **オンチェーン Trait** を、Nyano Triad League の **ゲーム内 TraitType（10種）** に変換するための仕様です。

- オンチェーンの `Trait` は `{ classId, seasonId, rarity }` の3値（整数）です。
- ゲーム内 `TraitType` は `Cosmic/Light/.../Earth` の10種です。
- **公式戦オンチェーン決済** と **オフチェーン参照実装** が一致するため、導出は決定論で、かつ Solidity に移植しやすい形にします。

---

## 1. 目的

- NFT側の属性（オンチェーンで読める）を、そのままゲーム性に接続する
- ただしオンチェーン `Trait` とゲーム内 `TraitType` は同一ではないため、**変換ルールを公開し固定**する
- 運営がいなくてもコミュニティが「ルール提案 → ルール採用 → 再現/検証」を回せるようにする

---

## 2. 入力（Nyano Peace のオンチェーン Trait）

`getTrait(tokenId)` が返す構造体：

- `classId: uint8`（1..5）
- `seasonId: uint8`（1..4）
- `rarity: uint8`（1..5）

> classId / seasonId / rarity の意味（名称）はコントラクト内コメントに準拠します。  
> - classId: Fabric / Metal / Acrylic / Paper / Secret  
> - seasonId: Spring / Summer / Autumn / Winter  
> - rarity: Common / Uncommon / Rare / SuperRare / Legendary

---

## 3. 出力（ゲーム内 TraitType）

`TraitType` は以下10種のいずれか：

- `cosmic`
- `light`
- `shadow`
- `forest`
- `metal`
- `flame`
- `aqua`
- `thunder`
- `wind`
- `earth`

---

## 4. ルールセット設定（RulesetConfig.synergy.traitDerivation）

この導出仕様は、ルールセットの一部として設定（JSON）で公開されます。

### 4.1 型（NyanoTraitDerivationConfigV1）

```ts
type TraitDerivationSource = "season" | "class" | "fixed";

interface NyanoTraitDerivationConfigV1 {
  enabled: boolean;
  scheme: "nyanoTrait_v1";

  // seasonTrait[seasonId-1] => TraitType（length 4）
  seasonTrait: TraitType[];

  // classTrait[classId-1] => TraitType（length 5）
  classTrait: TraitType[];

  // raritySource[rarity-1] => source（length 5）
  raritySource: TraitDerivationSource[];

  // fixedTrait[rarity-1] => TraitType（length 5）
  fixedTrait: TraitType[];
}
```

---

## 5. 導出スキーム（nyanoTrait_v1）

### 5.1 アルゴリズム（疑似コード）

```txt
入力: onchainTrait = {classId, seasonId, rarity}
設定: cfg = traitDerivation (scheme="nyanoTrait_v1")

1) 値検証
  classId in [1..5]
  seasonId in [1..4]
  rarity in [1..5]
  seasonTrait length = 4
  classTrait  length = 5
  raritySource length = 5
  fixedTrait  length = 5

2) raritySource を見る
  source = raritySource[rarity-1]

  if source == "season":
      return seasonTrait[seasonId-1]

  if source == "class":
      return classTrait[classId-1]

  if source == "fixed":
      return fixedTrait[rarity-1]

  otherwise:
      revert
```

---

## 6. 既定値（参照実装のデフォルト）

参照実装（TS）のデフォルトは以下です：

- Common/Uncommon → season（四季=四元素）
- Rare → class（素材/概念）
- SuperRare → thunder
- Legendary → cosmic

```json
{
  "enabled": true,
  "scheme": "nyanoTrait_v1",
  "seasonTrait": ["wind","flame","earth","aqua"],
  "classTrait": ["light","metal","cosmic","forest","shadow"],
  "raritySource": ["season","season","class","fixed","fixed"],
  "fixedTrait": ["none","none","none","thunder","cosmic"]
}
```

---

## 7. エラー処理と互換性

- 範囲外の値が入力された場合は **revert/throw**（不正なNFT/不正な読み取り/不正なトランスクリプトを即座に拒否）
- ルール変更は `scheme` 文字列を増やす（例：`nyanoTrait_v2`）  
  → 既存の replay/検証と衝突しないようにする

---

## 8. 補足（なぜ rarity を使うのか）

- Nyano Peace の rarity はオンチェーンで公開され、第三者が検証可能
- ゲームデザイン上も「レアリティ偏重（P2W）抑制」や「デッキ予算制限」の基礎にできる
- 本仕様 v1 では rarity を **TraitType の分岐**にのみ使用し、強さの係数調整は `traitEffects` 側で行います
