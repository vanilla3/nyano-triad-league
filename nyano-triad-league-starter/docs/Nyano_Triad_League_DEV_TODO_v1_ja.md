# Nyano Triad League — 開発TODO（v1）

> ルール：毎コミットで「Done / Doing / Next / Blockers」を更新する  
> 目的：実装の迷子を防ぎ、第三者レビューを容易にする

---

## Done（完了）
- [ ] （ここにコミット単位で追記）

## Doing（着手中）
- [ ] （いま触っているタスク）

## Next（次にやる）
### 0. 仕様固定（ブレると後で地獄になるもの）
- [ ] 対戦トランスクリプト仕様を確定（versioning/拡張フィールド設計）
- [ ] ルールセット（シーズン）を data-driven config で表現する方針を確定

### 1. エンジン（TypeScript）— 参照実装
- [ ] Core（Layer1）：Triad比較、じゃんけん決着、連鎖、勝敗判定（決定論）
- [ ] テストベクタ（ゴールデンテスト）：同入力→同出力を保証
- [ ] Tactics（Layer2）を “ルールとしてON/OFF可能” に枠だけ用意
  - [ ] 警戒マーク
  - [ ] コンボボーナス
- [ ] Synergy（Layer3）を “ルールとしてON/OFF可能” に枠だけ用意
  - [ ] Trait効果（どのオンチェーン属性から導出するかを明文化）
  - [ ] フォーメーションボーナス

### 2. Solidity（公式戦決済）
- [ ] Nyano Peace 読み取りinterface（ownerOf / getTriad / getJankenHand / getTrait / getCombatStats）
- [ ] TriadEngine（pure library）実装
- [ ] Match settlement（署名検証＋所有権検証＋結果再計算＋イベント）
- [ ] （後回し）Ruleset Registry / Featured投票

### 3. Frontend（まずは“遊べる”まで）
- [ ] Nyano一覧（所持トークンID取得は当面は簡易でOK：手入力/Alchemy/他）
- [ ] デッキビルダー（予算12固定）
- [ ] 3×3盤面UI（ドラッグ&ドロップ）
- [ ] 連鎖予測UI（後からでもよいが、設計だけ先に）

### 4. 自律化（運営ゼロでも回る仕込み）
- [ ] Events 設計（indexerが拾いやすい粒度）
- [ ] “誰でもsubmitできる” 公式戦フロー（submitterは第三者可）
- [ ] Ruleset Registry 設計（spam対策含む）
- [ ] Featured Season 投票（Nyano保有者の署名投票）

## Blockers（阻害要因）
- [ ] Nyano Peace の「Trait」解釈（ゲーム用Traitをどう導出するか）
- [ ] 公式戦で on-chain に載せる範囲（Coreのみ→拡張ルールも含めるか）
