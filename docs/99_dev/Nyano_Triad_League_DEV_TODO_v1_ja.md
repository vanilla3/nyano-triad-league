# Nyano Triad League — 開発TODO（v1）

> ルール：毎コミットで「Done / Doing / Next / Blockers」を更新する  
> 目的：実装の迷子を防ぎ、第三者レビューを容易にする

---

## Done（完了）
- [x] 初期リポジトリ土台（docs / templates / CI / workspace）
- [x] `packages/triad-engine` を正規位置へ移設（starter同梱を解消）
- [x] TS参照実装（Layer1/Core）：Triad比較、じゃんけん決着、連鎖、勝敗判定（決定論）
- [x] Transcript v1：matchId を **keccak256(固定ABIエンコード)** で計算（仕様にも明記）
- [x] Layer2/Tactics：**警戒マーク**（最大3回、1ターン、踏んだカードTriad-1）をTSエンジンに実装
- [x] ゴールデンテスト追加：警戒マークが盤面支配に影響するケース
- [x] CI：lockfile未コミット段階を想定し `pnpm install --frozen-lockfile` を一時的に解除

## Doing（着手中）
- [ ]（なし）

## Next（次にやる）
### 0. 仕様固定（ブレると後で地獄になるもの）
- [ ] 警戒マークの「Triad下限（0 or 1）」を仕様として明文化（現状は 0..10 にクランプ）
- [ ] combo bonus の仕様確定（加点方式 / 表示 / 連鎖との関係）

### 1. エンジン（TypeScript）— 参照実装
- [ ] Tactics（Layer2）：コンボボーナス（rulesetでON/OFF可能）
- [ ] Synergy（Layer3）：Trait効果の導入（まずは代表5種から）
  - [ ] Flame / Aqua / Thunder / Wind / Earth
- [ ] Earth の「配置時選択（earthBoostEdge）」を transcript によって決定論で表現
- [ ] 追加ゴールデンテスト：
  - [ ] 同値じゃんけんが勝敗を分ける
  - [ ] 連鎖が発生する
  - [ ] コンボボーナスが勝敗を変える
  - [ ] Earth選択が勝敗を変える

### 2. Solidity（公式戦決済）
- [ ] Nyano Peace 読み取りinterface（ownerOf / getTriad / getJankenHand / getTrait / getCombatStats）
- [ ] TriadEngine（pure library）実装（TS参照と一致させる）
- [ ] Match settlement（署名検証＋所有権検証＋結果再計算＋イベント）

### 3. Frontend（まずは“遊べる”まで）
- [ ] 3×3盤面UI（配置→結果計算→リプレイ）
- [ ] デッキビルダー（フィルタ：Triad/じゃんけん/rarity/trait）

### 4. 自律化（運営ゼロでも回る仕込み）
- [ ] Events を indexer-friendly に（matchId / replayHash / rulesetId など）
- [ ] Ruleset Registry（permissionless）草案 → 実装順の確定

## Blockers（阻害要因）
- [ ] Nyano Peace の「Trait」解釈（ゲーム用Traitをどのオンチェーン属性から導出するか）
- [ ] 公式戦で on-chain に載せる範囲（Coreのみ→拡張ルールも含めるか）
- [ ] lockfile（pnpm-lock.yaml）をいつコミットするか（CIをfrozenへ戻すタイミング）
