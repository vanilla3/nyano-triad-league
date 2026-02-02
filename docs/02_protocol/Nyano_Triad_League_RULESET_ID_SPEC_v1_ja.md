# Nyano Triad League — Ruleset ID 仕様（v1）

目的：**“同じルール = 同じ rulesetId”** を暗号学的に保証し、運営がいなくてもコミュニティがルール提案・環境共有・検証を回せるようにする。

v1では **JSON canonicalization ではなく**、Solidity互換の **固定ABIエンコード** を採用する。

- メリット：言語差（キー順・数値表記・Unicode等）による衝突を避けられる  
- メリット：将来、オンチェーンの RulesetRegistry が **同じIDをコントラクト内で計算**できる道が開く

参照実装：`packages/triad-engine/src/ruleset_id.ts`

---

## 1. rulesetId の定義

```text
rulesetId = keccak256( abi.encode(RulesetConfigV1Canonical) )
```

- `RulesetConfigV1Canonical` は **無効化されたセクションを正規化（ゼロ化）** した後の値を指す。
- これにより、例えば `comboBonus.enabled=false` のときに `momentumAt` 等が違っても **同じID** になる（= 同じ挙動）。

---

## 2. 安定コード（enum → uint8）

これらは **rulesetId の安定性に直結**するため、変更は破壊的。

### 2.1 TraitType → code（uint8）

| TraitType | code |
|---|---:|
| none | 0 |
| cosmic | 1 |
| light | 2 |
| shadow | 3 |
| forest | 4 |
| metal | 5 |
| flame | 6 |
| aqua | 7 |
| thunder | 8 |
| wind | 9 |
| earth | 10 |

### 2.2 TraitDerivationSource → code（uint8）

| source | code |
|---|---:|
| season | 0 |
| class | 1 |
| fixed | 2 |

### 2.3 traitDerivation scheme → code（uint8）

| scheme | code |
|---|---:|
| nyanoTrait_v1 | 1 |

### 2.4 Aqua diagonalStrengthMethod → code（uint8）

| method | code |
|---|---:|
| min | 0 |
| sum | 1 |

---

## 3. Canonicalization（無効化セクションの正規化）

**同じ挙動**なのに設定値の違いで rulesetId が分裂すると、コミュニティ運用が崩れます。  
v1では以下を正規化します。

### 3.1 tactics.warningMark
- `enabled=false` の場合：`maxUses/extraUses/penalty/edgeMin` をすべて **0** にする

### 3.2 tactics.comboBonus
- `enabled=false` の場合：閾値・triadPlus をすべて **0** にする

### 3.3 tactics.secondPlayerBalance
- `enabled=false` の場合：`firstMoveTriadPlus` を **0** にする

### 3.4 synergy.traitDerivation
- `enabled=false` の場合：マッピング配列（seasonTrait/classTrait/raritySource/fixedTrait）を **すべて0（none/season）** にする
- 併せて `td_scheme` も **0** に正規化する（無効時はschemeを識別しない）

### 3.5 synergy.traitEffects
- `enabled=false` の場合：すべての trait を disabled として **数値0** にする  
- `enabled=true` の場合でも、個別 trait が `enabled=false` なら、その trait のパラメータは **0/false** に正規化する

### 3.6 synergy.formationBonuses
- `enabled=false` の場合：五行/日食の設定を **0** にする
- 五行調和の `requiredElements` は **集合として扱い、順序を無視** する（codeで昇順にソート）

---

## 4. ABIエンコード（v1 fixed order）

`abi.encode(...)` の引数順（v1）は以下で固定する。  
**この順序が rulesetId を規定**します。

```text
abi.encode(
  // version
  uint8 version,

  // tactics.warningMark
  uint8 warning_enabled,
  uint8 warning_maxUsesPerPlayer,
  uint8 warning_secondPlayerExtraUses,
  int8  warning_penaltyAllTriad,
  uint8 warning_edgeMin,

  // tactics.comboBonus
  uint8 combo_enabled,
  uint8 combo_momentumAt,
  uint8 combo_dominationAt,
  uint8 combo_feverAt,
  uint8 combo_momentumTriadPlus,
  uint8 combo_dominationTriadPlus,

  // tactics.secondPlayerBalance
  uint8 spb_enabled,
  uint8 spb_firstMoveTriadPlus,

  // synergy.traitDerivation
  uint8 td_enabled,
  uint8 td_scheme,
  uint8[4] td_seasonTraitCodes,
  uint8[5] td_classTraitCodes,
  uint8[5] td_raritySourceCodes,
  uint8[5] td_fixedTraitCodes,

  // synergy.traitEffects
  uint8 te_enabled,

  // cosmic
  uint8 cosmic_enabled,
  uint8 cosmic_cornerTriadPlus,

  // light
  uint8 light_enabled,
  uint8 light_adjacencyTriadPlus,
  uint8 light_stack,

  // shadow
  uint8 shadow_enabled,

  // forest
  uint8 forest_enabled,
  uint8 forest_shieldHits,

  // metal
  uint8 metal_enabled,

  // flame
  uint8 flame_enabled,

  // aqua
  uint8 aqua_enabled,
  uint8 aqua_diagonalStrengthMethod,

  // thunder
  uint8 thunder_enabled,
  int8  thunder_adjacentEnemyAllTriadDelta,

  // wind
  uint8 wind_enabled,

  // earth
  uint8 earth_enabled,
  uint8 earth_boost,
  int8  earth_oppositePenalty,
  uint8 earth_requireChoice,

  // formationBonuses
  uint8 fb_enabled,

  // five elements harmony
  uint8 fe_enabled,
  uint8 fe_comboBonusScale,
  uint8[5] fe_requiredElementCodes,

  // eclipse
  uint8 eclipse_enabled,
  uint8 eclipse_lightAlsoIgnoresWarningMark,
  uint8 eclipse_shadowCountsAsLightSource
)
```

---

## 5. テストベクタ（v1）

TS参照実装の `DEFAULT_RULESET_CONFIG_V1` に対する rulesetId（v1）:

- `0x9fbdb6105169f321d8f2342fdcc2892e559588ac37b30ab1f5012709cf92b065`

※ `fiveElementsHarmony.requiredElements` は順序を無視するため、ソート後のコード列で計算している。
