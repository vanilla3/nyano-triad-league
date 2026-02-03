# Nyano Triad League — Ruleset Package 仕様（v1 / Draft）

目的：コミュニティが **「同じルール = 同じ rulesetId」** を再現しつつ、オンチェーン登録に必要な最小情報をまとめて配布できる形を用意する。  
運営がいなくなっても、第三者が UI / indexer / bot / tournament を作れることがゴール。

---

## 1. Ruleset Package とは

RulesetRegistry に登録するために最低限必要な情報をまとめた “小さなメタデータ” です。

### 最小フィールド（推奨）
- `name`: 人間が識別しやすい短い名前
- `engineId`: 決済エンジン識別子（例：1=V1, 2=V2）
- `rulesetId`: `bytes32`（トランスクリプトが参照するID）
- `configHash`: `bytes32`（ルール定義のハッシュ）
- `uri`: 仕様書（IPFS/HTTPS）

> **現状 v1** では `configHash == rulesetId` になります。  
> 理由：`rulesetId = keccak256(abi.encode(RulesetConfigV1Canonical))` のため。  
> ただし将来、rulesetId が “ゲーム挙動だけのID” に縮退した場合に備え、フィールドは残します。

---

## 2. 現状のオンチェーン対応範囲

オンチェーン決済エンジンは段階導入のため、現時点では **固定 config のみ**に対応します。

- Engine v1: Core + Tactics（警戒・コンボ）
- Engine v2: v1 + Shadow が警戒マークの -1 を無視

コミュニティが自由に ruleset config を提案して遊ぶことはできますが、  
オンチェーン確定（League で `settle`）できるのは “公式固定 config” に限られます。

---

## 3. 公式 rulesetId / configHash の生成手順

### 3.1 準備（triad-engine を build）
```bash
pnpm -C packages/triad-engine build
```

### 3.2 公式 ruleset package を出力
```bash
node scripts/print_official_onchain_rulesets.mjs --out rulesets/official_onchain_rulesets.json
```

出力 JSON には v1/v2 の `rulesetId`, `engineId`, `configHash` が含まれます。  
`uri` はコミュニティで合意した仕様書 URL（IPFS推奨）に差し替えてください。

---

## 4. RulesetRegistry への登録例（cast）

`rulesets/official_onchain_rulesets.json` の値を使います。

```bash
cast send <RULESET_REGISTRY_ADDRESS> \
  "register(bytes32,bytes32,uint8,string)" \
  <RULESET_ID> <CONFIG_HASH> <ENGINE_ID> <URI> \
  --private-key <PK>
```

---

## 5. League への提出（推奨）

RulesetRegistry が設定されている League では、次が推奨です。

- `submitMatch(t, sigA, sigB)`（自動で engineId を選択して決済）
- 明示したい場合のみ：`submitMatchV1` / `submitMatchV2`

---

## 6. セキュリティ要点

- rulesetId に対して engineId を on-chain に固定しないと、第三者が “別エンジンでの不正決済” を試みられます。
- そのため、RulesetRegistry の `engineId` と League の submit 入口を必ず整合させます。
