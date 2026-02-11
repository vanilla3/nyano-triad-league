# Nyano Triad League — Ruleset Config 仕様（v1 / data-driven）

目的：ルールの“可変部分”を設定データとして表現し、コミュニティが提案・共有できるようにする。
オンチェーン決済に対応するため、最終的には **同等の意味を持つ on-chain config** に変換できることが条件。

> 本ドキュメントは「TS参照実装（packages/triad-engine）が受け入れる設定 shape」と、
> それが意味するルールを **決定論で固定** するための仕様です。

---

## 1. Ruleset ID

v1では **固定ABIエンコード** により rulesetId を定義する（Solidity互換）。

- 定義：`rulesetId = keccak256( abi.encode(RulesetConfigV1Canonical) )`
- 仕様の詳細（canonicalization / enum code / ABI順序）は以下に集約：
  - `Nyano_Triad_League_RULESET_ID_SPEC_v1_ja.md`

---


## 2. RulesetConfigV1（TS参照実装の shape）

```ts
interface RulesetConfigV1 {
  version: 1;
  tactics: TacticsConfigV1;
  synergy: SynergyConfigV1;
}
```

- **Layer1/Core** は原則固定（3x3 / 9手 / 連鎖 / じゃんけん / 決定論タイブレーク）。
- 本 config は主に **Layer2（Tactics）** と **Layer3（Synergy）** を表現する。

---

## 3. Layer2: TacticsConfigV1

### 3.1 warningMark（警戒マーク）

```ts
warningMark: {
  enabled: boolean;
  maxUsesPerPlayer: number;       // default 3
  secondPlayerExtraUses: number;  // default 0
  penaltyAllTriad: number;        // default -1
  edgeMin: number;               // v1 decision: 0
}
```

- `enabled=false` の場合：トランスクリプト上の `warningMarkCell` は **無視** する。
- `secondPlayerExtraUses`：後攻だけ使用回数を増やしてバランス調整できる。
- `edgeMin`：ペナルティ/バフ適用後の下限。
  - v1では **0..10にクランプ**（1→0への低下を許す）を推奨。

### 3.2 comboBonus（コンボボーナス）

```ts
comboBonus: {
  enabled: boolean;
  momentumAt: number;        // default 3
  dominationAt: number;      // default 4
  feverAt: number;           // default 5
  momentumTriadPlus: number; // default +1
  dominationTriadPlus: number; // default +2
}
```

- **comboCount 定義（v1固定）**：`comboCount = 1（配置） + flipCount（このターンでひっくり返した枚数）`
- 効果は「次の自分のカード」にだけ適用される。
  - Momentum：全辺+1
  - Domination：全辺+2
  - Fever：次の自分のカードが警戒マークの効果を受けない（マークは消費される）

### 3.3 secondPlayerBalance（後攻補正）

```ts
secondPlayerBalance: {
  enabled: boolean;
  firstMoveTriadPlus: number; // default 0
}
```

- 後攻の初手に「全辺+X」を付与する。
- バランス調整として、`warningMark.secondPlayerExtraUses` と二択運用も可能。

---

## 4. Layer3: SynergyConfigV1（Trait効果）

### 4.1 前提：Traitの導出
Nyano Peace が提供するオンチェーン属性（classId / seasonId / rarity / その他）と、
ゲーム内の Trait 名（Cosmic / Flame / …）が一致する保証はない。

v1の扱い：
- **ゲーム内TraitTypeは ruleset で定義された“導出規則”によって決まる**（=コミュニティが議論できる）
- TS参照実装（`packages/triad-engine`）では、エンジンは **入力として `CardData.trait` を受け取る** だけです（＝CardData生成は呼び出し側）。
ただし Nyano Triad League では、ルールセットに **Trait導出設定（traitDerivation）** を含め、バックエンド/インデクサがオンチェーン値から決定論で `trait` を導出して渡します。

- 仕様：`Nyano_Triad_League_TRAIT_DERIVATION_SPEC_v1_ja.md`
- TSヘルパ：`deriveTraitTypeFromNyanoTraitV1(...)`（`packages/triad-engine`）

### 4.1 traitDerivation（Nyano on-chain Trait → ゲーム内TraitType）

`synergy.traitDerivation` は、Nyano Peace（BlueAtelierNFT）の `getTrait()` で得られる `{classId, seasonId, rarity}` を、ゲーム内 `TraitType`（10種）に変換するルールです。

```ts
traitDerivation?: NyanoTraitDerivationConfigV1;
```

詳細は `TRAIT_DERIVATION_SPEC` を参照してください。

### 4.2 traitEffects（エンジン実装のパラメタ）

```ts
traitEffects: {
  enabled: boolean;

  cosmic:  { enabled: boolean; cornerTriadPlus: number };
  light:   { enabled: boolean; adjacencyTriadPlus: number; stack: boolean };
  shadow:  { enabled: boolean };
  forest:  { enabled: boolean; shieldHits: number };
  metal:   { enabled: boolean };
  flame:   { enabled: boolean };
  aqua:    { enabled: boolean; diagonalStrengthMethod: "min" | "sum" };
  thunder: { enabled: boolean; adjacentEnemyAllTriadDelta: number };
  wind:    { enabled: boolean };
  earth:   { enabled: boolean; boost: number; oppositePenalty: number; requireChoice: boolean };
}
```

- `enabled=false` の場合：全Trait効果を無効（CardData.trait はあっても無視）。


### 4.3 formationBonuses（フォーメーションボーナス）

Design v2.0 の「2.3.3 フォーメーションボーナス」に対応する、デッキ構築の組み合わせボーナスです。

```ts
formationBonuses: {
  enabled: boolean;

  fiveElementsHarmony: {
    enabled: boolean;
    comboBonusScale: number;
    requiredElements: Array<"flame"|"aqua"|"earth"|"wind"|"thunder">;
  };

  eclipse: {
    enabled: boolean;
    lightAlsoIgnoresWarningMark: boolean;
    shadowCountsAsLightSource: boolean;
  };
}
```

- `enabled=false` の場合：フォーメーションボーナスを全て無効。
- フォーメーションはトランスクリプトに書かず、**デッキのTraitType** と ruleset から派生して決定する。
- 詳細仕様：`Nyano_Triad_League_FORMATION_BONUS_SPEC_v1_ja.md`

### 4.4 TraitType一覧と効果（v1）

| Trait | 効果（決定論） | 備考 |
|---|---|---|
| Cosmic | 角に置くと全辺 +`cornerTriadPlus` | 角=0,2,6,8 |
| Light | 隣接する味方カード（上下左右）の全辺 +`adjacencyTriadPlus` | 既定は **非スタック**（`stack=false`） |
| Shadow | 警戒マークを踏んでも Triad-1 を受けない（マークは消費） | Fever と同様の“無効化” |
| Forest | 最初のフリップ試行を `shieldHits` 回まで無効化 | 直攻/連鎖どちらも対象 |
| Metal | **連鎖攻撃**ではフリップされない（直攻のみ可） | “置いたカード”からの攻撃は直攻 |
| Flame | Triad同値のとき、じゃんけん判定を常に勝つ（相手がFlameでない場合） | 両者Flameなら通常じゃんけん |
| Aqua | 斜め隣接（4方向）にも攻撃する | 斜め比較は `diagonalStrengthMethod` に従う |
| Thunder | 置いた瞬間、隣接する敵カード（上下左右）の全辺 `adjacentEnemyAllTriadDelta` | 既定は -1、永続 |
| Wind | デッキに1枚でもあると、試合開始時に先攻/後攻を選べる | `firstPlayer` で表現 |
| Earth | 置く際に1辺を選び +`boost`、対辺に `oppositePenalty` | `earthBoostEdge` を使用 |

Wind の公平な表現（commit-reveal / 両者合意）の実装補助として、
`packages/triad-engine/src/first_player.ts` に以下の純関数を用意する：
- `buildFirstPlayerChoiceCommitV1`
- `verifyFirstPlayerChoiceCommitV1`
- `deriveFirstPlayerFromCommitRevealV1`
- `resolveFirstPlayerByMutualChoiceV1`

詳細な“順序（適用タイミング）”や斜め比較の定義は、別紙 `TRAIT_EFFECTS_SPEC` を参照。

---

## 5. JSON例（概念 / TS shapeに合わせた例）

```json
{
  "version": 1,
  "tactics": {
    "warningMark": {
      "enabled": true,
      "maxUsesPerPlayer": 3,
      "secondPlayerExtraUses": 1,
      "penaltyAllTriad": -1,
      "edgeMin": 0
    },
    "comboBonus": {
      "enabled": true,
      "momentumAt": 3,
      "dominationAt": 4,
      "feverAt": 5,
      "momentumTriadPlus": 1,
      "dominationTriadPlus": 2
    },
    "secondPlayerBalance": {
      "enabled": false,
      "firstMoveTriadPlus": 0
    }
  },
  "synergy": {
    "traitEffects": {
      "enabled": true,
      "cosmic": { "enabled": true, "cornerTriadPlus": 1 },
      "light": { "enabled": true, "adjacencyTriadPlus": 1, "stack": false },
      "shadow": { "enabled": true },
      "forest": { "enabled": true, "shieldHits": 1 },
      "metal": { "enabled": true },
      "flame": { "enabled": true },
      "aqua": { "enabled": true, "diagonalStrengthMethod": "min" },
      "thunder": { "enabled": true, "adjacentEnemyAllTriadDelta": -1 },
      "wind": { "enabled": true },
      "earth": { "enabled": true, "boost": 2, "oppositePenalty": -1, "requireChoice": true }
    }
  }
}
```

---

## 6. 実装ガイド（TS / Solidity）

- TS：この shape をそのまま読み込み、`simulateMatchV1(..., ruleset)` に渡して検証する。
- Solidity：対応するサブセットのみ on-chain config として保持し、決済できる ruleset を段階的に増やす。



---

## 6. formationBonuses JSON例（追記）

```json
{
  "synergy": {
    "formationBonuses": {
      "enabled": true,
      "fiveElementsHarmony": {
        "enabled": true,
        "comboBonusScale": 2,
        "requiredElements": ["flame", "aqua", "earth", "wind", "thunder"]
      },
      "eclipse": {
        "enabled": true,
        "lightAlsoIgnoresWarningMark": true,
        "shadowCountsAsLightSource": true
      }
    }
  }
}
```

