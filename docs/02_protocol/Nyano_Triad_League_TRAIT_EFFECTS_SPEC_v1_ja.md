# Nyano Triad League — Trait Effects 仕様（v1）

本ドキュメントは、Synergy（Layer3）の Trait 効果を **決定論** で定義します。
TS参照実装（`packages/triad-engine`）は、この仕様に従って `simulateMatchV1` を実装しています。

---

## 1. 前提

- Traitは「ゲーム内の能力名」であり、Nyano Peace のオンチェーン属性と1:1対応する保証はありません。
- v1のTS参照実装では、エンジンは `CardData.trait`（=ゲーム内TraitType）を入力として受け取ります。
  - Nyano Triad League では、ルールセットに `synergy.traitDerivation` を含め、オンチェーン `getTrait()` の `{classId,seasonId,rarity}` から決定論で導出することを推奨します。
  - 導出仕様：`Nyano_Triad_League_TRAIT_DERIVATION_SPEC_v1_ja.md`

---

## 2. TraitType 一覧（v1）

- `none`
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

> NOTE：TraitType は「将来追加」されうるため、UI/解析側は unknown を許容しつつ、
> `enabled=false` の trait は無視する設計が安全です。

---

## 3. 共通ルール

### 3.1 有効化
- `ruleset.synergy.traitEffects.enabled=false` の場合、全Traitを無効化（常に `none` と同等）。

### 3.2 Triad値のクランプ
- すべてのTriad値は **`[edgeMin .. 10]`** にクランプされます。
  - `edgeMin` は `tactics.warningMark.edgeMin`（v1推奨 0）を利用。

### 3.3 適用順序（v1参照実装）
1. **（Layer2）** pending bonus（Momentum/Domination/後攻補正）を allTriad に加算
2. **（Layer2）** 警戒マークの debuff（-1）を適用
   - ただし Nyano Fever / Shadow の場合は無効化（マークは消費）
3. **（Layer3）** Earth の辺再配分（選択）
4. **（Layer3）** Cosmic の角ブースト
5. 盤面に配置（Forest shield state を初期化）
6. **（Layer3）** Thunder debuff（隣接する敵のallTriadを減衰）
7. 直後に capture + chain を解決
   - capture判定では Light aura / Metal / Forest / Flame / Aqua が関与

---

## 4. 各Traitの仕様

### 4.1 Cosmic
- 条件：カードが `cosmic`、かつ置いたマスが角（0,2,6,8）
- 効果：配置カードの全辺に `cornerTriadPlus` を加算

### 4.2 Light
- 条件：カードが `light`
- 効果：Lightカードに隣接する **味方カード（上下左右）** は、全辺に `adjacencyTriadPlus` を加算
  - Light自身は対象外（自分にバフしない）
- `stack`：
  - `false`（既定）：隣接Lightが何枚あっても +1回だけ
  - `true`：隣接するLight枚数ぶんスタック
- バフは「永続的に値を焼き込む」のではなく、**比較時に動的に評価**する
  - したがってLightがひっくり返ると、次の比較からは新しい所有者に対してバフが適用される

### 4.3 Shadow
- 条件：カードが `shadow`
- 効果：相手の警戒マークを踏んでも `penaltyAllTriad` を受けない
  - 警戒マーク自体は消費される（Fever と同様）

### 4.4 Forest
- 条件：カードが `forest`
- 状態：配置時に `forestShield = shieldHits` を付与
- 効果：
  - このカードが「ひっくり返される」直前に、`forestShield > 0` なら 1 減らしてフリップを無効化
  - **直攻 / 連鎖 / 斜め攻撃** のいずれも対象
  - 「フリップが成立する条件」を満たしたときのみ消費（負け判定時には消費されない）

### 4.5 Metal
- 条件：カードが `metal`
- 効果：**連鎖攻撃** ではひっくり返されない
  - 参照実装における定義：
    - 置いたカードからの最初の攻撃は `direct`
    - ひっくり返されたカードが行う攻撃は `chain`
  - `chain` のとき、Metalはフリップ対象外

### 4.6 Flame
- 条件：カードが `flame`
- 効果：Triad比較が同値になり、じゃんけんで勝敗判定を行う場面で、
  - attacker が Flame で defender が Flame でないなら attacker が常に勝つ
  - defender が Flame で attacker が Flame でないなら attacker は常に負け
  - 両方 Flame の場合は通常のじゃんけん

### 4.7 Aqua
- 条件：カードが `aqua`
- 効果：通常の上下左右に加え、**斜め隣接（4方向）** にも攻撃する

#### 斜め攻撃の比較（v1決定）
斜めはTriadの方向が一致しないため、参照実装は以下の方法で「斜め強度」を定義します。

- 例： attacker が defender の「右下（down-right）」に攻撃する場合
  - attacker側：`min(attacker.down, attacker.right)`
  - defender側：`min(defender.up, defender.left)`
  - 同値なら、通常どおり **じゃんけん（Flame補正含む）** で判定

`diagonalStrengthMethod` が `sum` の場合：
- `attacker.down + attacker.right` と `defender.up + defender.left` を比較

> NOTE：`sum` は 0..20 になり強度が上がるため、コミュニティルールとして採用する場合は
> バランス（edgeMin/Lightningなど）を併せて調整することを推奨。

### 4.8 Thunder
- 条件：カードが `thunder`
- 効果：配置した瞬間、隣接する **敵カード（上下左右）** の全辺に `adjacentEnemyAllTriadDelta` を加算（既定 -1）
  - 変化は永続（そのカードが後でひっくり返っても維持）
  - 参照実装では **capture解決より先に** 適用する（即時効果）

### 4.9 Wind
- 条件：デッキに `wind` が1枚以上
- 効果：試合開始時に先攻/後攻を選べる
  - トランスクリプトの `header.firstPlayer` で表現

### 4.10 Earth
- 条件：カードが `earth`
- 効果：配置時に 4辺のうち 1 辺を選び `boost`（既定 +2）、対辺に `oppositePenalty`（既定 -1）
  - 選択はトランスクリプトの `earthBoostEdge` で表現
  - `requireChoice=true` の ruleset では Earth配置ターンで **必須**

---

## 5. テストベクタ（推奨）
- Shadowが警戒マークを無視して勝敗が変わるケース
- Forestが1回だけフリップを無効化するケース
- Earth選択で勝敗が変わるケース
- Thunderが隣接敵を永続デバフするケース
- Lightの隣接バフで勝敗が変わるケース
