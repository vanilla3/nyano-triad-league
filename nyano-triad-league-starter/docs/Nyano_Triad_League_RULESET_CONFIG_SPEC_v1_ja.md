# Nyano Triad League — Ruleset Config 仕様（v1 / data-driven）

目的：ルールの“可変部分”を設定データとして表現し、コミュニティが提案・共有できるようにする。  
オンチェーン決済に対応するため、**最終的には同等の意味を持つ on-chain config** に変換できることが条件。

---

## 1. Ruleset ID
- `rulesetId = keccak256(configCanonicalBytes)`  
- “同じルール = 同じID” を保証するため、canonical化（キー順、数値型、enumの表記）を必須とする。

---

## 2. 4層構造（Layered）
設計は「Core/Tactics/Synergy/Meta」の4層を採用する。  
（Layer1は理解の容易さのため極力固定、上位レイヤーで変化を出す）

### 2.1 Core（Layer1 / 固定に寄せる）
- boardSize: 3x3（v1固定）
- chainRule: enabled（連鎖）
- tieBreak:
  - primary: tileCount
  - secondary: combatStatSum（または別の決定論ルール）

### 2.2 Tactics（Layer2 / ON/OFF可能）
- warningMark:
  - enabled: bool
  - maxUsesPerMatch: int（例：3）
  - penaltyAllTriad: int（例：-1）
  - expires: "nextTurnStart"（v1固定）
- comboBonus:
  - enabled: bool
  - thresholds: 3,4,5+
  - bonuses: +1, +2, (ignoreWarningMark)
- secondPlayerBalance:
  - enabled: bool
  - firstMoveBonus: +1 allTriad（例）

### 2.3 Synergy（Layer3 / ここが“Nyanoらしさ”）
- traitEffects:
  - enabled: bool
  - **traitDerivation**（重要）：Nyanoのオンチェーン属性からゲーム内Traitをどう導出するか
    - 例）classId/seasonId/rarity/janken/triadパターンなどを組み合わせて決定論的に分類
  - effectTable:
    - traitType -> effect定義（Cosmic/Light/… など）
- formationBonuses:
  - enabled: bool
  - definitions:
    - sameTrait>=3 => multiplier 1.5
    - allDifferentTrait => firstCard +2
    - jankenAllKinds => chooseJankenOnTie
    - etc

### 2.4 Meta（Layer4 / シーズン変動）
- boardRule: centerLocked / cornerBoost / edgeBoost / etc
- triadAdjust: lowBoost / highNerf / oddBoost / evenBoost / flatten
- deckConstraints:
  - budgetCap（例：12）
  - sameTraitLimit
  - jankenLimit
  - rarityLimit
- specialRules:
  - chainCap
  - warningMarkDisabled
  - blindHand

---

## 3. “Trait”導出の扱い（重要）
Nyano Peace が提供する属性（例：classId, seasonId, rarity など）と、  
ゲーム内の能力名（Cosmic, Flame…）が一致する保証はない。  

したがって v1 は以下を採用する：

- **ゲーム内TraitTypeは ruleset が定義する**
- traitDerivation は ruleset の一部として公開し、コミュニティが議論・提案できる

> これにより「既存NFTを尊重しつつ、ゲーム体験を伸ばす」余地が生まれる。  
> そして運営がいなくても、コミュニティが“最適な解釈”を育てられる。

---

## 4. 参考：JSON例（概念）

```json
{
  "version": 1,
  "name": "Season 0 — Core+Trait",
  "rulesetId": "0x…",
  "layers": {
    "core": { "chain": true, "tieBreak": "combatStatSum" },
    "tactics": {
      "warningMark": { "enabled": true, "maxUses": 3, "penalty": -1 },
      "comboBonus": { "enabled": true, "t3": 1, "t4": 2, "t5": "ignoreWarning" }
    },
    "synergy": {
      "traitDerivation": { "type": "byClassIdAndSeasonId", "tableId": "v1" },
      "effects": { "Cosmic": "...", "Flame": "..." }
    },
    "meta": { "budgetCap": 12 }
  }
}
```

---

## 5. 実装ガイド（TS / Solidity）

- TS：上記JSONをそのまま読み込み、Ruleプラグインを組み立てる
- Solidity：**対応するサブセットのみ** を on-chain config として保持し、決済可能な ruleset を増やしていく
