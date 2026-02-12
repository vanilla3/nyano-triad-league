# 実装ログ

> 1コミット=1まとまりで追記する（Why/What/Verify）。


## 2026-02-01 — commit-0002

### Why
- 初期ZIPの構成上、`nyano-triad-league-starter/` が同梱されており、ワークスペースの中心が曖昧だった。
- 公式戦（検証可能）に必要な **matchIdの定義** を、JSON等の揺れる形式ではなく Solidity 互換の固定エンコードに寄せたかった。
- Design v2.0 の Layer2（TACTICS）の核である **警戒マーク** は、早期に入れることでゲームの“読み合い”が立ち上がる。

### What
- `packages/triad-engine` を正規位置へ移設し、starter同梱を解消。
- Transcript v1 の matchId を `keccak256(abi.encode(...))` 相当の **固定ABIエンコード** に変更（TS参照実装）。
- Layer2：警戒マークを実装（最大3回／1ターン有効／踏んだカードTriad-1）。
- ゴールデンテスト追加（警戒マークの有無で中心がフリップする/しない）。
- `TRANSCRIPT_SPEC` に固定ABIエンコードを明記。
- CI：lockfile未コミット段階を想定し `--frozen-lockfile` を一時解除。

### Verify
- `pnpm -C packages/triad-engine test`
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` と `docs/02_protocol/Nyano_Triad_League_TRANSCRIPT_SPEC_v1_ja.md` の更新確認


## 2026-02-01 — commit-0003

### Why
- Design v2.0 の Layer2（TACTICS）のもう一つの柱である **コンボボーナス** を早期に入れ、連鎖（コンボ）を「狙う理由」を作りたかった。
- 公式戦（検証可能）では、同じトランスクリプトから **同じ派生効果（次ターンバフ）** が再現できる必要があるため、コンボ数の定義を仕様として固定したかった。
- 「運営がいなくても盛り上がる」方向に向け、ERC-6551（TBA）とステーキングを **プロトコル部品** としてどう使うかを並行して整理しておきたかった。

### What
- TSエンジンに **コンボボーナス** を実装：
  - `comboCount = 1（配置） + flipCount（このターンでひっくり返した枚数）`
  - 3: Momentum（次の自分のカード 全辺+1）
  - 4: Domination（次の自分のカード 全辺+2）
  - 5+: Nyano Fever（次の自分のカードが警戒マークを無効化）
- 参照実装の出力に `turns: TurnSummary[]` を追加し、UI/解析が “運営なし” でも作りやすい形にした。
- ゴールデンテスト追加：Momentum が次ターンのカードに +1 として反映されるケース。
- `RULESET_CONFIG_SPEC` と `TRANSCRIPT_SPEC` に、コンボ数の定義と派生値の扱いを追記。
- 自律化検討として `ERC6551_and_Staking_Notes_v1_ja.md` を追加（TBA/ステーキングの使い所と段階導入案）。

### Verify
- `pnpm -C packages/triad-engine test`
- 仕様更新：`docs/02_protocol/*` と `docs/99_dev/*` の差分確認


## 2026-02-01 — commit-0004

### Why
- Layer2（警戒マーク/コンボボーナス/後攻補正）は「シーズンやルールセット」で ON/OFF を切り替えられる必要がある（運営が消えてもコミュニティが環境を作れるため）。
- 設計ドキュメント v2.0 にある「先攻・後攻バランス（後攻初手+1 もしくは後攻警戒+1回）」を、エンジン側で安全に選択できる形にしたかった。
- 警戒マークの Triad 下限（0 or 1）が曖昧だと、境界ケースの結果がズレて後から地獄になるため、v1の決定を固定したかった。

### What
- `RulesetConfigV1`（engine-side subset）を導入し、`simulateMatchV1(..., ruleset)` でルールを指定可能にした（未指定は `DEFAULT_RULESET_CONFIG_V1`）。
- 警戒マーク：
  - rulesetで `enabled` を切り替え可能（無効時は transcript フィールドを無視）。
  - 使用回数を `maxUsesPerPlayer` に明確化し、後攻に `secondPlayerExtraUses` を付与可能にした。
  - Triad下限は **0（0..10にクランプ）** を v1の決定として types/spec に明記。
- コンボボーナス：
  - rulesetで `enabled` を切り替え可能にし、閾値/効果量も設定で変更できるようにした（v2デフォルトは維持）。
- 後攻補正：
  - rulesetで `secondPlayerBalance.firstMoveTriadPlus` を指定すると、後攻の初手に全辺+Xを付与できる。
- テスト追加：
  - 後攻初手+1 の有無でフリップ結果が変わるケース。
  - 後攻だけ警戒マーク +1 回を許可するケース（4回目でthrowしない）。

### Verify
- `pnpm -C packages/triad-engine test`
- ドキュメント更新：`docs/02_protocol/Nyano_Triad_League_RULESET_CONFIG_SPEC_v1_ja.md` / `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` の差分確認

---

## Commit0005 — Layer3（Synergy / Trait効果 v1）

- 実装：`packages/triad-engine` に TraitEffectsConfig を追加し、v1のTrait効果を決定論で実装。
- 追加/更新した仕様：
  - `docs/02_protocol/Nyano_Triad_League_RULESET_CONFIG_SPEC_v1_ja.md`（TS shape に合わせて具体化）
  - `docs/02_protocol/Nyano_Triad_League_TRANSCRIPT_SPEC_v1_ja.md`（Earth選択の必須条件を明確化）
  - `docs/02_protocol/Nyano_Triad_League_TRAIT_EFFECTS_SPEC_v1_ja.md`（新規：Traitの厳密仕様）

### 実装したTrait（v1）
- Cosmic：角配置 allTriad +1
- Light：隣接味方 allTriad +1（非スタック既定）
- Shadow：警戒マーク debuff 無効化（消費はする）
- Forest：最初のフリップ試行を1回無効化（shield）
- Metal：連鎖攻撃ではフリップ不可
- Flame：Triad同値時、じゃんけんで常に勝つ（相手がFlameでない場合）
- Aqua：斜め4方向にも攻撃（斜め強度は `min(edgeA, edgeB)` 既定）
- Thunder：隣接敵カードの全辺 -1（永続、capture前に適用）
- Wind：先攻/後攻選択（transcriptのfirstPlayerで表現）
- Earth：辺選択 +2 / 対辺 -1（`earthBoostEdge`、requireChoice既定 true）

### ゴールデンテスト追加
- Shadow が警戒マークを無視するケース
- Forest shield が1回だけフリップを無効化するケース
- Earth の選択で結果が変わるケース
- Thunder の永続デバフ
- Light の隣接バフで結果が変わるケース

### 次の焦点
- Nyano Peace のオンチェーン属性 → TraitType 導出の暫定ルール（JSON公開＋議論可能な形）
- Formation bonuses（Layer3拡張）


## 2026-02-02 — commit-0006

### Why
- Layer3（Trait効果）を実装した時点で、次のボトルネックは「Nyano Peace のオンチェーン Trait（classId/seasonId/rarity）を、ゲーム内 TraitType（10種）へどう落とすか」だった。
- 導出規則が曖昧なままだと、インデクサやUIごとに解釈が割れて **replay / 公式戦オンチェーン決済が破綻**する。
- さらに、class/season/rarity がオンチェーンで公開されている以上、それをゲーム性（環境設計/デッキ予算など）に接続できる「拡張点」として、ルールセットに含めておきたかった。

### What
- `RulesetConfigV1.synergy.traitDerivation`（NyanoTraitDerivationConfigV1）を追加。
- TS参照実装に Nyano用ヘルパを追加（`packages/triad-engine/src/nyano.ts`）：
  - `DEFAULT_NYANO_TRAIT_DERIVATION_CONFIG_V1`
  - `deriveTraitTypeFromNyanoTraitV1(...)`
  - `makeCardDataFromNyano(...)`（on-chain read → CardData の組み立て）
- デフォルトルールセットに `traitDerivation` を同梱（ルールの“標準解釈”を固定）。
- 仕様追加：`Nyano_Triad_League_TRAIT_DERIVATION_SPEC_v1_ja.md`
- 既存仕様更新：ruleset/transcript/trait-effects が導出ルールを参照するように追記。
- テスト追加：rarityごとの導出分岐と `makeCardDataFromNyano` の組み立てをゴールデン化。

### Verify
- `pnpm -C packages/triad-engine test`
- `pnpm -C packages/triad-engine build`
- `docs/02_protocol/*` / `docs/99_dev/*` の差分確認

## 2026-02-02 — commit-0007

### Why
- Design v2.0 の「フォーメーションボーナス（2.3.3）」は、デッキ構築を“強カードの寄せ集め”から脱却させる中核なので、早めに参照実装へ落としたかった。
- また Season 3 の例（五行調和ボーナス3倍 / Light+Shadow=日食）にあるように、シーズン環境（Layer4）が **倍率・追加効果** として上書きできる土台が必要だった。
- “運営がいなくても盛り上がる”には、第三者がリプレイや環境分析を作れるよう、どのformationが有効だったかを結果に含めておくのが重要。

### What
- `RulesetConfigV1.synergy.formationBonuses` を追加（data-driven）。
- v1の最小セットとして、2つのformationを実装：
  - **五行調和（Five Elements Harmony）**：
    - 条件：Flame/Aqua/Earth/Wind/Thunder がデッキに揃う
    - 効果：comboBonus（Momentum/Domination）の triadPlus を `comboBonusScale` 倍
  - **日食（Eclipse）**：
    - 条件：Light と Shadow がデッキに揃う
    - 効果（rulesetでON/OFF可能）：
      - Lightが警戒マークの -1 を無効化
      - Shadowを Light光源として扱い、Light aura を発生させる
- `MatchResult.formations` を追加し、UI/解析が “運営なし” でも作りやすい形にした。
- 仕様追加：
  - `Nyano_Triad_League_FORMATION_BONUS_SPEC_v1_ja.md`
- 既存仕様追従：
  - ruleset spec / transcript spec を formation 仕様に追従させた。
- テスト追加：
  - 五行調和による comboBonus 倍率適用が次ターンに反映されること
  - 日食により Light が警戒マークを踏んでも triad が下がらないこと

### Verify
- `pnpm -C packages/triad-engine test`
- `pnpm -C packages/triad-engine build`
- 仕様差分：`docs/02_protocol/*` / `docs/99_dev/*` の更新確認

## 2026-02-02 — commit-0008

### Why
- “運営がいなくても回る”ためには、コミュニティが提案する ruleset が **衝突せずに識別**できる必要がある。
- JSONのような曖昧なシリアライズだと、言語差（キー順・数値表記・Unicode等）で **同じルールなのにIDが分裂** しやすい。
- 将来オンチェーンに RulesetRegistry を置く場合も、Solidity側で同じIDを計算できる形（= fixed ABI encoding）が望ましい。

### What
- `computeRulesetIdV1(ruleset)` を追加（TS参照実装）。
  - `rulesetId = keccak256(abi.encode(RulesetConfigV1Canonical))` を固定。
  - 無効化セクション（enabled=false）は **ゼロ化して正規化**（同じ挙動でIDが分裂しない）。
  - 五行調和の `requiredElements` は集合として扱い、**順序を無視**（code昇順にソート）。
- 仕様追加：
  - `Nyano_Triad_League_RULESET_ID_SPEC_v1_ja.md`
  - RULESET_CONFIG_SPEC / TRANSCRIPT_SPEC を参照追記
- テスト追加：
  - default rulesetId の test vector を固定
  - 無効化セクションの正規化が効いていること
  - requiredElements の順序がIDに影響しないこと

### Verify
- `pnpm -C packages/triad-engine test`
- `pnpm -C packages/triad-engine build`
- 仕様差分：`docs/02_protocol/*` / `docs/99_dev/*` の更新確認


## 2026-02-08 — commit-0083: /stream parser統一（票割れゼロ）

### Why
- Stream.tsx に 9 個の重複関数があり、triad_vote_utils / triad_viewer_command と同じ計算を独自実装していた。
- `parseChatMove()` が独自パース実装で、`parseViewerMoveTextLoose()` と異なる正規化をするため票割れが発生していた。

### What
- `triad_viewer_command.ts` に `parseChatMoveLoose()` を追加。canonical / legacy / shorthand 全てを `formatViewerMoveText()` で同一キーに正規化。
- Stream.tsx から 9 個の重複関数を削除、triad_vote_utils / triad_viewer_command の import に置換。
- `parseChatMove()` を `parseChatMoveLoose()` に置換。`ParsedMove` 型 → `ViewerMove` に統一。
- `buildStateJsonContent()` / `buildAiPrompt()` を `computeStrictAllowed()` / `computeToPlay()` に切替。
- Match.tsx のスマートクォート（U+201C/U+201D）ビルドエラーを修正。

### Verify
- `pnpm build:web` 成功


## 2026-02-08 — commit-0084: エラー表示常設 + flip理由表示統一

### Why
- 外部連携（warudo等）の成功/失敗が一時的な toast でしか表示されず、ストリーマーが見逃しやすかった。
- Overlay の flip 理由表示が手動の flipStats 集計で、TurnLog の FlipTraceBadges と一致しなかった。

### What
- StreamOperationsHUD に `ExternalResult` 型と `ExternalStatusRow` コンポーネントを追加。
- Stream.tsx に `lastExternalResult` state を追加、`sendNyanoWarudo()` で記録。
- `OverlayStateV1` に `externalStatus` フィールドを追加（互換拡張）。
- Overlay.tsx の手動 flipStats バッジ → `FlipTraceBadges` コンポーネントに置換。
- Overlay.tsx の手動 "Why:" セクション → `flipTracesSummary()` に統一。

### Verify
- `pnpm build:web` 成功


## 2026-02-08 — commit-0085: Overlay HUD 視認性 + UI クオリティアップ

### Why
- OBS controls=0 モードで 720p/1080p 表示時に文字が小さすぎて判読困難だった。
- パネル背景の透過が強く、配信映像と重なると文字が見えにくかった。

### What
- ScoreBar に `size` prop を追加（"sm" | "md" | "lg"）。
- Overlay OBS モードのフォント階層を一律引き上げ（10px→12px, 11px→12px, xs→sm, sm→base）。
- パネル背景 `bg-white/70` → `bg-white/90`（OBS モード）。
- toPlay 表示を `to-play-pill` コンポーネント化（プレイヤーカラー付き）。
- セル座標ラベルを常時表示に変更。ボード gap を OBS モードで拡大。
- index.css に `vote-countdown-inline`, `to-play-pill` CSS コンポーネントを追加。

### Verify
- `pnpm build:web` 成功


## 2026-02-12 — commit-0086: Quick Play 導線テレメトリ追加（Home→初手配置）

### Why
- UX スコアカード B-1「Home から試合開始まで10秒以内」が未計測で、改善のループを回しにくかった。
- 既存の `first_place_ms` は Match ページ起点のため、Home CTA からの体験時間を直接評価できなかった。

### What
- `telemetry.ts` に `quickplay_to_first_place_ms` を追加（Session + Cumulative 平均）。
- Home の「🎮 すぐ遊ぶ」押下時に `markQuickPlayStart()` を記録し、Match 側の初回配置で消費して計測するようにした。
- Home > Settings の UX Telemetry パネルに `Avg quick-play to first place` を表示追加。
- テスト追加：
  - Home マーカーありで計測されること
  - マーカーが1回で消費されること
- ドキュメント更新：
  - `UX_SCORECARD` の B-1 を「計測可能」に更新
  - テレメトリ一覧へ `quickplay_to_first_place_ms` を追加

### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`


## 2026-02-12 — commit-0087: Home LCP ローカル計測追加（G-3）

### Why
- UX スコアカード G-3（LCP < 2.5s）が未計測で、改善前後の比較ができなかった。
- 既存の Home Settings テレメトリに、パフォーマンスの中核指標を同じ導線で表示したかった。

### What
- `telemetry.ts` の cumulative stats に `avg_home_lcp_ms` を追加。
- `recordHomeLcpMs()` を追加し、Home ページの LCP をローカル集計できるようにした。
- Home で `PerformanceObserver`（`largest-contentful-paint`）を監視し、`visibilitychange/pagehide` か 6 秒フォールバックで記録。
- Home > Settings のメトリクスに `Avg Home LCP` を追加。
- テスト追加：
  - Home LCP 平均の計算
  - 不正値（NaN / 負数 / Infinity）を無視する挙動
- `UX_SCORECARD` を更新し、G-3 を「計測可能」に変更。

### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`


## 2026-02-12 — commit-0088: UX目標スナップショット表示 + quick-play計測の堅牢化

### Why
- テレメトリ値が増えてきたため、配信前チェックで「目標を満たしているか」を即判定できる表示が必要だった。
- `quickplay_to_first_place_ms` は古い開始時刻が残ると外れ値になり得るため、異常値ガードを入れて誤判定を防ぎたかった。

### What
- `telemetry.ts` に `evaluateUxTargets(stats)` を追加し、A-1/B-1/B-4/G-3 の PASS/FAIL/INSUFFICIENT を算出可能にした。
- Home > Settings に `UX Target Snapshot` を追加し、上記4項目を目標値と現在値つきで可視化。
- quick-play 計測に上限（10分）を追加し、古い開始時刻による外れ値を無視するようにした。
- テスト追加：
  - stale quick-play marker を無視すること
  - `evaluateUxTargets` の insufficient 判定
  - pass/fail 混在ケースの判定

### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`


## 2026-02-12 — commit-0089: UX計測ログのコピー導線 + Playtest Log テンプレ

### Why
- 計測値が見えるようになった一方で、`UX_SCORECARD` 運用の記録転記が手作業で、継続しにくかった。
- 配信前/改修後に同じフォーマットで比較できるログ出力を、UIから1クリックで取得したかった。

### What
- `telemetry.ts` に以下を追加：
  - `buildUxTelemetrySnapshot(stats)`（timestamp + stats + target checks）
  - `formatUxTelemetrySnapshotMarkdown(snapshot)`（`PLAYTEST_LOG.md` 貼り付け形式）
- Home Settings の `UX Telemetry` に `Copy Snapshot` ボタンを追加。
  - クリックで markdown をクリップボードにコピーし、`docs/ux/PLAYTEST_LOG.md` への貼り付けを案内。
- `docs/ux/PLAYTEST_LOG.md` を新規作成し、記録テンプレを追加。
- `UX_SCORECARD` の記録先表記をテンプレ作成済み状態へ更新。
- テスト追加：
  - snapshot 生成の timestamp/shape
  - markdown 整形内容

### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`


## 2026-02-12 — commit-0090: lint warning 0 化（web）

### Why
- `pnpm -C apps/web lint` に既知 warning が2件残っており、日常の検証でノイズになっていた。
- warning を放置すると、新規 warning の検知性が落ちるため早めに解消したかった。

### What
- `apps/web/src/engine/renderers/pixi/cellAnimations.ts`
  - 未使用引数 `cellH` を `_cellH` に変更（API互換を維持して lint 準拠）。
- `apps/web/src/engine/__tests__/cellAnimations.test.ts`
  - 未使用の型 import `CellAnimFrame` を削除。

### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`


## 2026-02-12 — commit-0091: UX snapshot に環境コンテキストを追加

### Why
- 同じ指標でも端末や表示サイズで体験値が変わるため、snapshot比較時に実行環境を残す必要があった。
- `PLAYTEST_LOG.md` に貼る情報を増やし、後から「なぜ差が出たか」を追跡しやすくしたかった。

### What
- `telemetry.ts` に `UxTelemetryContext` を追加し、snapshotへ `context` を含められるようにした。
- `formatUxTelemetrySnapshotMarkdown()` を拡張し、`route / viewport / language / userAgent` を出力するようにした。
- Home の `Copy Snapshot` でブラウザ情報を収集して snapshot に埋め込むようにした。
- `PLAYTEST_LOG.md` のテンプレに context 例を追記。
- テスト追加：
  - context あり snapshot 生成
  - markdown の context 出力
- e2e `home.spec.ts` を更新し、Settings 内の `Copy Snapshot` / `UX Target Snapshot` 表示を検証対象に追加。

### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

## 2026-02-12 - commit-0092: UX snapshot local history + Home visibility

### Why
- Snapshot copy alone was one-shot; if clipboard fails or user forgets to paste, telemetry evidence is lost.
- Home Settings needed a quick local view of recent UX snapshot quality without opening external docs.

### What
- `apps/web/src/lib/telemetry.ts`
  - Added local snapshot history storage (`saveUxTelemetrySnapshot`, `readUxTelemetrySnapshotHistory`, `clearUxTelemetrySnapshotHistory`).
  - Added safe parser for stored history to ignore broken/invalid localStorage payloads.
  - Added fixed retention (`MAX_UX_SNAPSHOT_HISTORY = 20`).
- `apps/web/src/pages/Home.tsx`
  - `Copy Snapshot` now saves snapshot locally before clipboard write.
  - Added `Recent Snapshots (Local)` panel (latest 5, PASS/FAIL/N/A summary, route/viewport context).
  - Added `Clear History` action.
  - Copy failure toast now mentions snapshot was still saved locally.
- `apps/web/src/lib/__tests__/telemetry.test.ts`
  - Added tests for history read/write ordering, retention limit, invalid payload handling, and clear behavior.
- `apps/web/e2e/home.spec.ts`
  - Added visibility assertion for `Recent Snapshots (Local)` in Settings.
- `docs/ux/PLAYTEST_LOG.md`
  - Added note about local snapshot history behavior.

### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

## 2026-02-12 - commit-0093: first-player seed helper (Wind fairness)

### Why
- Wind trait fairness options in TODO include commit-reveal / seed / mutual agreement.
- `first_player.ts` already covered commit-reveal and mutual choice, but seed-based deterministic resolution was missing.

### What
- `packages/triad-engine/src/first_player.ts`
  - Added `FirstPlayerSeedV1Input`.
  - Added `deriveFirstPlayerFromSeedV1(input)`:
    - `keccak256(abi.encode(matchSalt, seed)) & 1` (Solidity-compatible deterministic rule).
    - bytes32 validation for both `matchSalt` and `seed`.
- `packages/triad-engine/test/first_player.test.js`
  - Added seed flow tests: deterministic output, sensitivity to seed changes, invalid seed throw.
- `docs/02_protocol/Nyano_Triad_League_RULESET_CONFIG_SPEC_v1_ja.md`
  - Added `deriveFirstPlayerFromSeedV1` to the Wind fairness helper list.

### Verify
- `pnpm -C packages/triad-engine test`
- `pnpm -C packages/triad-engine lint`

## 2026-02-12 - commit-0094: commit-reveal resolver helper hardening

### Why
- Integrators had to call verify + derive separately for commit-reveal flow.
- That split made it easy to forget commit verification or pass one-sided commit data.

### What
- `packages/triad-engine/src/first_player.ts`
  - Added `FirstPlayerCommitRevealResolutionV1Input` with optional `commitA/commitB`.
  - Added `resolveFirstPlayerFromCommitRevealV1(input)`:
    - requires commit pair when verification is used,
    - verifies both commits against reveals,
    - then derives first player deterministically.
- `packages/triad-engine/test/first_player.test.js`
  - Added tests for:
    - successful commit verification path,
    - commit mismatch failure,
    - one-sided commit input failure.
- `docs/02_protocol/Nyano_Triad_League_RULESET_CONFIG_SPEC_v1_ja.md`
  - Added `resolveFirstPlayerFromCommitRevealV1` to helper list.

### Verify
- `pnpm -C packages/triad-engine lint`
- `pnpm -C packages/triad-engine test`

## 2026-02-12 - commit-0095: unified first-player resolver API

### Why
- Consumers still had to choose and call different low-level helpers per mode.
- That made integration code verbose and increased branch-specific mistakes.

### What
- `packages/triad-engine/src/first_player.ts`
  - Added `FirstPlayerResolutionMethodV1` discriminated union:
    - `mutual_choice`
    - `seed`
    - `commit_reveal`
  - Added `resolveFirstPlayerV1(input)` as unified resolver entrypoint.
- `packages/triad-engine/test/first_player.test.js`
  - Added mode-specific tests for `resolveFirstPlayerV1`.
  - Added unsupported mode guard test.
- `docs/02_protocol/Nyano_Triad_League_RULESET_CONFIG_SPEC_v1_ja.md`
  - Added `resolveFirstPlayerV1` to helper list.

### Verify
- `pnpm -C packages/triad-engine lint`
- `pnpm -C packages/triad-engine test`

## 2026-02-12 - commit-0096: first-player flow adoption (committed mutual + web seed mode)

### Why
- `resolveFirstPlayerV1` を導入した後も、両者合意フローの「commit検証付き」導線が不足していた。
- web 側の first-player UI は `manual / mutual / commit_reveal` の3モードのみで、seed フローを直接検証できなかった。

### What
- `packages/triad-engine/src/first_player.ts`
  - Added `FirstPlayerCommittedMutualChoiceV1Input`.
  - Added `resolveFirstPlayerFromCommittedMutualChoiceV1(input)`:
    - verifies both player commits against reveals,
    - requires same `matchSalt`,
    - requires distinct player addresses,
    - resolves via mutual choice agreement.
  - Extended `FirstPlayerResolutionMethodV1` and `resolveFirstPlayerV1(input)` with `committed_mutual_choice`.
- `packages/triad-engine/test/first_player.test.js`
  - Added tests for committed mutual choice happy path and failure paths:
    - commit mismatch,
    - matchSalt mismatch,
    - same-player reject.
  - Added `resolveFirstPlayerV1` mode test for `committed_mutual_choice`.
- `apps/web/src/lib/first_player_resolve.ts`
  - Added `seed` to `FirstPlayerResolutionMode`.
  - Added `seedResolution` input and seed-mode validation/derivation via `deriveFirstPlayerFromSeedV1`.
- `apps/web/src/lib/__tests__/first_player_resolve.test.ts`
  - Added mode parse test for `seed`.
  - Added deterministic seed-mode test and invalid-seed fallback test.
- `apps/web/src/pages/Match.tsx`
  - Added `Seed` option to first-player mode select.
  - Added seed-mode inputs (`fps` + `fpsd`) and randomize action.
  - Wired seed inputs into `resolveFirstPlayer(...)`.
- `docs/02_protocol/Nyano_Triad_League_RULESET_CONFIG_SPEC_v1_ja.md`
  - Updated Wind fairness helper list:
    - added `resolveFirstPlayerFromCommittedMutualChoiceV1`,
    - clarified fairness modes include `seed`.

### Verify
- `pnpm -C packages/triad-engine lint`
- `pnpm -C packages/triad-engine test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test -- src/lib/__tests__/first_player_resolve.test.ts`

## 2026-02-12 - commit-0097: web first-player resolver adds committed mutual-choice mode

### Why
- Engine側で `committed_mutual_choice` を追加済みだったが、web Match UI からは選択・検証できなかった。
- 「公平な先攻決定（commit付き両者合意）」を実運用で試すには、URLパラメータとUIの両方で再現可能にする必要があった。

### What
- `apps/web/src/lib/first_player_resolve.ts`
  - Added `FirstPlayerResolutionMode` value: `committed_mutual_choice`.
  - Added parser support for `committed_mutual_choice`.
  - Added `deriveChoiceCommitHex(...)` helper for choice-commit derivation.
  - Added `committedMutualChoice` input block to resolver input.
  - Added committed mutual-choice resolve path:
    - validates bytes32 fields and required commits,
    - calls `resolveFirstPlayerFromCommittedMutualChoiceV1(...)`,
    - returns fallback/manual on validation or resolver error.
- `apps/web/src/pages/Match.tsx`
  - Added first-player mode option: `Committed mutual choice`.
  - Added URL params for committed mutual flow:
    - `fpoa`, `fpob` (player addresses)
    - `fpna`, `fpnb` (nonces)
    - `fcoa`, `fcob` (commits)
    - reuses `fps` (matchSalt), `fpa`/`fpb` (choices)
  - Added UI inputs and actions:
    - randomize matchSalt/nonces,
    - derive commits from reveal tuple via `deriveChoiceCommitHex(...)`.
- `apps/web/src/lib/__tests__/first_player_resolve.test.ts`
  - Added mode parse test for `committed_mutual_choice`.
  - Added `deriveChoiceCommitHex` tests.
  - Added resolver tests for committed mutual flow:
    - success path,
    - missing commit fallback,
    - mismatched commit fallback.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/first_player_resolve.test.ts`

## 2026-02-12 - commit-0098: web first-player resolver now delegates to engine unified API

### Why
- web 側 `first_player_resolve` が engine の判定ロジックを部分的に再実装しており、将来モード追加時に乖離リスクがあった。
- `commit_reveal` で片側commitだけを受け入れる余地が残っていたため、engine側ポリシーと揃える必要があった。

### What
- `apps/web/src/lib/first_player_resolve.ts`
  - `resolveFirstPlayerV1(...)` を利用する形に統一:
    - `mutual` → `mode: "mutual_choice"`
    - `seed` → `mode: "seed"`
    - `committed_mutual_choice` → `mode: "committed_mutual_choice"`
    - `commit_reveal` → `mode: "commit_reveal"`
  - `commit_reveal` のcommit入力を厳密化:
    - commitA/commitB どちらか片方のみはエラー。
    - 両方入力時のみ engine resolver へ commit pair を渡す。
  - 既存の UI 向けエラーハンドリング（manual fallback + error文字列）は維持。
- `apps/web/src/lib/__tests__/first_player_resolve.test.ts`
  - `commit_reveal` の不一致テストを「両側commit入力あり」の形に更新。
  - 片側commit入力を明示的に reject するテストを追加。

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/first_player_resolve.test.ts`
- `pnpm -C apps/web build`

## 2026-02-12 - commit-0099: Match first-player params update hardening (atomic URL updates)

### Why
- `Match.tsx` の first-player 設定ボタンで `setParam(...)` を連続呼び出ししており、URLパラメータ更新が取りこぼれる可能性があった。
- `commit_reveal` / `committed_mutual_choice` の入力条件がUI上で伝わりづらく、誤入力時の手戻りが発生しやすかった。

### What
- `apps/web/src/pages/Match.tsx`
  - Added `setParams(updates)` helper to apply multiple query param updates in one `setSearchParams(...)` call.
  - Replaced multi-step param writes in first-player actions with atomic updates:
    - commit-reveal randomize
    - commit-reveal derive commits
    - committed-mutual randomize
    - committed-mutual derive commits
    - seed randomize
  - Updated first-player field helper text:
    - commit-reveal now explicitly says Commit A/B must be set together when used.
    - committed-mutual now explicitly says choice A/B must match.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`

## 2026-02-12 - commit-0100: first-player mode switch default-fill for safer setup UX

### Why
- モード切替時に不要パラメータは消えるようになったが、必須入力が空のまま残るケースがあり、切替直後に invalid になりやすかった。
- `seed / commit_reveal / committed_mutual_choice` では、初回入力コストと入力ミスを減らすために安全な初期値補完が必要だった。

### What
- `apps/web/src/lib/first_player_params.ts`
  - Added `buildFirstPlayerModeDefaultParamPatch(mode, current, randomBytes32Hex)`.
  - Mode switch default-fill behavior:
    - `manual`: `fp` を 0/1 に正規化
    - `mutual`: `fpa/fpb` を 0/1 に正規化
    - `seed`: `fps/fpsd` が bytes32 でなければ自動補完
    - `commit_reveal`: `fps/fra/frb` を自動補完し、`fca/fcb` はクリア
    - `committed_mutual_choice`: `fps/fpna/fpnb` 自動補完、`fpoa/fpob` 既定アドレス補完、`fpa/fpb` 正規化、`fcoa/fcob` クリア
- `apps/web/src/lib/__tests__/first_player_params.test.ts`
  - Added tests for default-fill patch behavior across modes.
- `apps/web/src/pages/Match.tsx`
  - First-player mode `onChange` now applies:
    - stale param cleanup (`buildFirstPlayerModeParamPatch`)
    - required default-fill (`buildFirstPlayerModeDefaultParamPatch`)
  - This keeps mode transition deterministic and immediately usable.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/first_player_params.test.ts src/lib/__tests__/first_player_resolve.test.ts`
- `pnpm -C apps/web build`

## 2026-02-12 - commit-0101: Match first-player mode transition e2e coverage

### Why
- first-player モード切替は URL パラメータ状態に強く依存するため、ユニットテストだけでは画面実動作の回帰を拾いきれない。
- mode transition 時の「不要値クリア + 必須値補完」が崩れると、共有URL再現性とUXが悪化する。

### What
- `apps/web/e2e/match-first-player.spec.ts` を新規追加。
  - Case 1: `manual` → `commit_reveal`
    - `fps/fra/frb` が bytes32 で埋まること
    - `fpsd` / committed-mutual系パラメータがクリアされること
  - Case 2: `commit_reveal` → `committed_mutual_choice`
    - `fps/fpna/fpnb` が bytes32 で埋まること
    - `fpa/fpb` が正規化されること
    - `fpoa/fpob` が既定値で補完されること
    - `fra/frb/fca/fcb/fpsd` がクリアされること

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/first_player_params.test.ts src/lib/__tests__/first_player_resolve.test.ts`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- match-first-player.spec.ts`

## 2026-02-12 - commit-0102: first-player alias parsing and committed-mutual address hardening

### Why
- Shared URLs sometimes used mode aliases like `commit-reveal` / `committed-mutual-choice`, but parser support was strict.
- In committed mutual-choice mode, invalid `fpoa/fpob` addresses could remain in URL and cause avoidable resolver failures.

### What
- `apps/web/src/lib/first_player_resolve.ts`
  - Hardened `parseFirstPlayerResolutionMode(...)`:
    - normalize case/whitespace/hyphen to underscore,
    - accept aliases such as `mutual-choice`, `commit-reveal`, and `committed-mutual-choice`.
- `apps/web/src/lib/first_player_params.ts`
  - Added address validation for committed mutual defaults:
    - if `fpoa/fpob` are not `0x` + 40 hex chars, replace with deterministic default addresses.
  - Kept previous behavior that preserves existing commit params (`fca/fcb/fcoa/fcob`) during canonicalization.
- `apps/web/src/lib/__tests__/first_player_resolve.test.ts`
  - Added parse coverage for alias inputs.
- `apps/web/src/lib/__tests__/first_player_params.test.ts`
  - Added committed mutual invalid-address fallback test.
- `apps/web/e2e/match-first-player.spec.ts`
  - Added alias/canonicalization scenario:
    - `fpm=committed-mutual-choice` canonicalizes to `committed_mutual_choice`,
    - invalid `fpoa/fpob` are replaced with defaults,
    - existing commits remain intact.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/first_player_params.test.ts src/lib/__tests__/first_player_resolve.test.ts`
- `pnpm -C apps/web e2e -- match-first-player.spec.ts`
- `pnpm -C apps/web build`
