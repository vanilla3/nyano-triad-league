# Nyano Triad League — フォーメーションボーナス仕様（v1）

フォーメーションボーナスは、**デッキ構築（5枚の組み合わせ）**に意味を与えるための Synergy（Layer3）要素です。

- 目的：強いカードを5枚並べるだけでなく、「組み合わせ」を考える深みを作る
- 重要：公式戦で検証可能にするため、効果は **決定論** で定義する
- 運営不在でも回すため、ルールは ruleset（設定データ）として表現し、コミュニティが提案できる形にする

参照：Design Document v2.0「2.3.3 フォーメーションボーナス」/ 「Season 3: 五行調和ボーナス3倍」/ 「Light+Shadow=日食」など。

---

## 1. 仕様原則

- フォーメーションは **トランスクリプトに書かない**
  - トランスクリプトは「何を置いたか（deck+9手）」のみ
  - フォーメーションは `deck` と `rulesetConfig` から **派生** する
- 適用タイミングは **試合開始時に確定**
  - deckのTraitType（=導出済み）を数え、activeなformationを決める
- Season（Meta）は「倍率・禁止」などの形で上書き可能
  - 例：Season 4 で formationBonuses を無効化

---

## 2. RulesetConfigV1 への追加

`synergy.formationBonuses` を追加します（TS参照実装に準拠）。

```ts
formationBonuses: {
  enabled: boolean;

  fiveElementsHarmony: {
    enabled: boolean;
    comboBonusScale: number; // default 2
    requiredElements: Array<"flame"|"aqua"|"earth"|"wind"|"thunder">;
  };

  eclipse: {
    enabled: boolean;
    lightAlsoIgnoresWarningMark: boolean;
    shadowCountsAsLightSource: boolean;
  };
}
```

---

## 3. Formation 定義（v1）

### 3.1 五行調和（Five Elements Harmony）

**条件**
- デッキに以下が **すべて1枚以上** 含まれる：
  - Flame / Aqua / Earth / Wind / Thunder

**効果（v1）**
- `comboBonus` の triadPlus を `comboBonusScale` 倍する（Momentum / Domination）
  - 例：Momentum（+1）が `scale=2` なら **+2**
- Fever（警戒無効化）は倍率対象外（binary）

**設計意図**
- “多様性デッキ” を明確に強くする（Season 3 のテーマとも整合）
- バフは「次ターン1回」なので、強いが制御可能

**Season例**
- Season 3: 五行調和ボーナス3倍 → `comboBonusScale=3`

---

### 3.2 日食（Eclipse）

**条件**
- デッキに Light と Shadow が両方含まれる

**効果（v1、rulesetでON/OFF可能）**
- `lightAlsoIgnoresWarningMark=true` の場合：
  - Lightカードが警戒マークを踏んでも Triad-1 を受けない（マークは消費）
- `shadowCountsAsLightSource=true` の場合：
  - Shadowカードを「Lightの光源」とみなし、隣接味方に Light aura（+1）を与える

**設計意図**
- Light/Shadowの混成に明確な意味を与え、メタに“物語”を作る
- 効果は小さく、説明可能（3秒ルール）

---

## 4. 実装メモ（TS参照実装）

- `simulateMatchV1` の開始時に `deckTraits` を数え、`formationsByPlayer` を決める
- MatchResult に `formations: {A: FormationId[], B: FormationId[]}` を含め、UI/解析が作りやすい形にする
- 今後：
  - “3枚同Trait” “全Trait異なる” などを追加する場合も、同じ枠組み（rulesetで条件+効果）に載せる
