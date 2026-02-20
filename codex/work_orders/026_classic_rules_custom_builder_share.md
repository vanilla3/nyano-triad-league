# Work Order 026: Classic Rules — カスタムビルダー（複数ルール組み合わせ）+ Share/Replay 互換

## 1) 背景 / 目的（ユーザー視点）
- Classic Rules は「複数ルールの組み合わせ」で面白さが出るが、現状は固定プリセットのみ。
- 任意の組み合わせを UI から選べるようにし、さらに **共有 URL / Replay** で同じルールを再現できるようにする。

## 2) 成果物（Deliverables）
- [x] Match setup（Mint）に「Classic Custom」モードを追加
- [x] Classic ルールを複数選択できる UI（ラジオ/トグル）
- [x] ルール選択を URL param に保存（後方互換）
- [x] Replay が registry に存在しない rulesetId の場合でも、URL param から config を復元できる
- [x] rulesetId と復元 config の不一致を検知し、ユーザーに警告
- [x] テスト（URL encode/decode / share url）

## 3) 要件（Requirements）
### MUST
- Classic の組み合わせができる（最低: reverse / aceKiller / plus / same / swap / order/chaos / allOpen/threeOpen / typeAscend/typeDescend）
- UI は “矛盾しやすい組” をラジオにする
  - card selection: none / order / chaos
  - open rule: none / allOpen / threeOpen
  - type rule: none / typeAscend / typeDescend
  - その他（swap/reverse/aceKiller/plus/same）はトグル
- URL は後方互換
  - 既存 `rk=` などはそのまま動く
  - 新しい param は「無い場合はデフォルト」
- Share/Replay で同じルールに戻せる
  - 例: Match 画面でコピーした Replay URL を別タブで開いても同じルールになる
- triad-engine の決定論は変更しない

### SHOULD
- URL param は短くする（Replay URL は既に長くなりやすい）
  - 推奨: **bitmask を base36** で保存（`cr=<base36>`）
- Replay で「復元ルールの rulesetId が transcript.header.rulesetId と一致しない」場合、
  - 画面上で分かる（warn pill）
  - simulate を止めるのではなく、明確に注意を出す（必要なら “このルールで再生” を押させる）

### COULD
- `buildReplayShareUrl` に `rulesetKey` / `classicMask` を渡せるオプション追加

## 4) 非要件（Non-goals）
- transcript schema にルール config を埋め込む（プロトコル変更）
  - まずは URL param で解決
- Rulesets ページの大改修（必要なら別 WO）

## 5) 受け入れ条件（Acceptance Criteria）
1) `/match?ui=mint&rk=classic_custom` を開くと、Classic カスタム設定 UI が表示される
2) ルールを複数選び、ゲームを 1 手以上進められる
3) Replay URL をコピーし、別タブで開いても
   - 同じルールで再生される（少なくとも画面に同じ classic tags が表示される）
4) `pnpm -C apps/web test && pnpm -C apps/web build` が通る

## 6) 調査ポイント（Investigation）
- `apps/web/src/lib/ruleset_registry.ts`（ruleset config の生成）
- `apps/web/src/components/match/MatchSetupPanelMint.tsx`（match setup UI）
- `apps/web/src/pages/Match.tsx`（ruleset の解決 / share URL）
- `apps/web/src/pages/Replay.tsx`（rulesetId 解決 / fallback）
- `apps/web/src/lib/appUrl.ts`（share URL builder）

## 7) 実装方針（Approach）
### 方針A: URL param で classic flags を保持し、Match/Replay の両方で復元
- `rk=classic_custom`
- `cr=<mask>`（base36）

採用: **方針A**

### ルールの mask 仕様案（例）
- bit0: swap
- bit1: reverse
- bit2: aceKiller
- bit3: plus
- bit4: same
- bit5-6: cardSelection (00 none / 01 order / 10 chaos)
- bit7-8: openRule (00 none / 01 allOpen / 10 threeOpen)
- bit9-10: typeRule (00 none / 01 typeAscend / 10 typeDescend)

※ 実装では `encode/decode` を 1 箇所に集約し、将来拡張できるようにする。

## 8) タスクリスト（細分化）
- [x] 026-1 `apps/web/src/lib/classic_rules_param.ts`（新規）
  - `encodeClassicRulesMask(config): string`
  - `decodeClassicRulesMask(str): ClassicRulesConfigV1`
  - `normalizeClassicRulesConfig(...)`
- [x] 026-2 Match setup UI
  - ルールの radio/toggle UI を追加
  - 選択状態を `URLSearchParams` に保存/復元
- [x] 026-3 Match の ruleset 解決
  - `rk=classic_custom` の場合、base ruleset（v2）+ classic config で `RulesetConfigV2` を組み立てる
  - 組み立てた config から `rulesetId` を計算
- [x] 026-4 Replay の fallback
  - `resolveRulesetById` 失敗時、`rk`/`cr` から config を復元して simulate
  - `computedRulesetId !== transcript.header.rulesetId` の場合に警告表示
- [x] 026-5 Share URL
  - Match からコピーする Replay URL に `rk`/`cr` を付与
  - `buildReplayShareUrl` にオプション追加する場合は後方互換で
- [x] 026-6 テスト
  - mask encode/decode のラウンドトリップ
  - `cr` が無い/壊れているときのデフォルト

## 9) 検証（Verification）
### 自動
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`

### 手動
- Match で classic custom を選び、reverse+plus+same など複合を設定
- 1 手以上進める
- Replay URL を別タブで開き、同じタグ/ルールで再生される

## 10) リスク / ロールバック
- リスク: URL param の増加で share link が長くなる
  - 対策: mask を base36 にして短縮
- リスク: rulesetId の不一致で誤再生
  - 対策: 不一致を UI で明確に表示
- ロールバック: `rk=classic_custom` の分岐と param 追加を revert
