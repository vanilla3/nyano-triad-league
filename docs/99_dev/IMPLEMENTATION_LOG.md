# 実装ログ

> 1コミット=1まとまりで追記する（Why/What/Verify）。

## 2026-02-13 — WO005-B follow-up: responsive stage secondary controls

### Why
- Stage focus中にウィンドウ幅が変わった場合、補助コントロール表示が初期値のままで、狭幅で情報過多/広幅で操作導線不足になることがあった。
- Stageの「1画面導線」を維持するため、表示閾値の共通化と resize追従が必要だった。

### What
- `apps/web/src/lib/stage_layout.ts`
  - `shouldShowStageSecondaryControls` を追加し、補助コントロール表示のブレークポイント判定を共通化。
- `apps/web/src/lib/__tests__/stage_layout.test.ts`
  - 補助コントロール表示判定（390/768/769/NaN）を検証。
- `apps/web/src/pages/Match.tsx`
  - Stage controls の初期表示/再計算を共通判定に切替。
  - resize時の自動追従を追加（手動トグル後は manual override でユーザー設定を優先）。
- `apps/web/src/pages/Replay.tsx`
  - Stage transport controls に同等の resize追従 + manual override を追加。
- `apps/web/e2e/stage-focus.spec.ts`
  - mobile `replay-stage` で controls が初期非表示であること、
  - `Show controls` で復帰できることを追加検証。
  - 375px 幅 `battle-stage` で Commit ボタンが viewport 内に収まることを検証。
  - 375px 幅で横方向オーバーフローが発生しないことを検証。
  - game index / RPC 失敗時でも `replay-stage` の `Load replay` / `Retry load` / `Clear share params` が表示され、リカバリ導線が維持されることを検証。
- `apps/web/src/lib/ai/turn_timing.ts`
  - AI自動打ちの待機時間を再調整（base/turn-step/difficulty/jitter を引き上げ）。
  - 「早すぎて機械的」に見えるテンポを抑え、思考演出の体感を改善。
- `apps/web/src/lib/ai/__tests__/turn_timing.test.ts`
  - baseline と upper bound の期待値を更新し、調整後の決定論を検証。
- `apps/web/src/components/NyanoReaction.tsx`
  - `reduced-motion` と `data-vfx`（off/low/medium/high）に応じて cut-in timing を切替。
  - `vfx=off` / reduced-motion 時は burst 無効 + 表示時間短縮で負荷と過演出を抑制。
  - `vfx=low` 時は impact を抑えつつ burst を無効化。
- `apps/web/src/components/__tests__/NyanoReaction.timing.test.ts`
  - reduced-motion / vfx off / vfx low / vfx high の timing 分岐を検証。
- `apps/web/src/lib/demo_decks.ts`
  - `buildEmergencyGuestFallbackData` を追加し、index非依存で guest 5v5 を生成可能化。
- `apps/web/src/pages/Match.tsx`
  - Game Index 読込失敗時、guest mode では緊急フォールバックを適用して対戦継続。
  - `error/status` と toast でフォールバック状態を明示。
- `apps/web/src/lib/__tests__/demo_decks.test.ts`
  - 緊急フォールバックデッキの構成（5v5/10枚 map）を検証。
- `apps/web/e2e/stage-focus.spec.ts`
  - battle-stage guest で index 読込失敗時にフォールバックで継続できることを検証。

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
- `pnpm -C apps/web test -- src/lib/ai/__tests__/turn_timing.test.ts`
- `pnpm -C apps/web test -- src/components/__tests__/NyanoReaction.timing.test.ts`
- `pnpm -C apps/web test -- src/lib/__tests__/demo_decks.test.ts`

## 2026-02-13 — WO005-A follow-up: Stage route canonicalization + smoke coverage

### Why
- `/battle-stage` `/replay-stage` のクエリ正規化ロジックがページごとに重複しており、回帰時に差分を見落としやすかった。
- Stage専用ルートのスモークが E2E で未カバーだったため、URL互換と起動安定性を自動で担保する必要があった。

### What
- `apps/web/src/lib/stage_focus_params.ts` を追加:
  - `ui=engine` 強制、`focus=1` 正規化、legacy `layout` の除去を共通化。
- `apps/web/src/pages/BattleStage.tsx` / `apps/web/src/pages/ReplayStage.tsx`:
  - 重複していた `useEffect` 内のクエリ補正処理を `normalizeStageFocusParams` に統一。
- `apps/web/src/lib/__tests__/stage_focus_params.test.ts` を追加:
  - 欠損補完、legacy `layout=focus` 吸収、`focus=focus` 正規化、no-op ケースを検証。
- `apps/web/e2e/stage-focus.spec.ts` を追加:
  - `/battle-stage` `/replay-stage` のURL正規化と、主要UI（Hand Dock / replay focus guard）表示を確認。

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 — WO005-A: Stage UI/UX foundation (viewport fit + hierarchy)

### Why
- `/battle-stage` と `/replay-stage` の Pixi 盤面サイズが固定寄りで、PC環境によっては主要操作導線が縦方向に伸びやすかった。
- AGENTS/Work Order更新に合わせ、Stage-firstで UI/UX 基盤（情報階層 + 1画面導線）を先に安定化する必要があった。

### What
- `codex/execplans/005_uiux_foundation.md` を新規作成し、Milestone A の実装計画を文書化。
- `apps/web/src/lib/stage_layout.ts` を追加:
  - viewport と stage種別（battle/replay）から `maxWidthPx` / `minHeightPx` を算出。
- `apps/web/src/lib/__tests__/stage_layout.test.ts` を追加:
  - desktop/mobile/invalid入力の境界を検証。
- `apps/web/src/pages/Match.tsx`:
  - battle-stage で viewport追従サイズを使用。
  - stage専用レイアウトクラス（root/toolbar/arena/board/cutin/dock）を適用。
  - stage routeでは desktop quick-commit 重複表示を抑止。
- `apps/web/src/pages/Replay.tsx`:
  - replay-stage で viewport追従サイズを使用。
  - stage専用レイアウトクラス（root/toolbar/cutin/arena-inner）を適用。
- `apps/web/src/styles.css`:
  - stage shell/panel のトークン変数を追加。
- `apps/web/src/mint-theme/mint-theme.css`:
  - `stage-focus-*` と `mint-focus-hand-dock--stage` スタイルを追加し、視線誘導と下部操作導線を強化。

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- smoke.spec.ts`


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

## 2026-02-13 - commit-0113: settled import automation + verified ladder record mode

### Why
- Commit0112 でローカル import UI は入ったが、入力が手貼り前提で運用負荷が残っていた。
- pointsDelta を `settled_attested` として扱う導線には、署名検証済み record を選べるモードが必要だった。
- 既存の season points 移行を壊さずに、`fast import` と `verified import` を段階導入する必要があった。

### What
- `apps/web/src/lib/settled_points_import.ts`
  - `parseVerifiedLadderRecordsImportJson(...)` を追加。
  - payload 形式 `{ domain, records }` を受け取り、`verifyLadderMatchRecordV1(...)` で record ごとに検証。
  - issue code `attestation_invalid` を追加し、検証失敗理由を集約。
  - duplicate 判定ロジックを `pushUniqueSettledEvent(...)` に共通化。
- `apps/web/src/lib/__tests__/settled_points_import.test.ts`
  - verified import の schema 不正ケース・attestation 失敗ケースを追加。
- `apps/web/src/pages/Events.tsx`
  - import mode 切替 UI を追加：
    - `Settled events (fast)`
    - `Verified records (domain + signatures)`
  - `/game/settled_events.json` 自動読込ボタンを追加。
  - mode に応じて parser を切り替え、同じ apply フローで local attempts に反映。
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0113 完了を追記し、Doing を「バックエンド経由の自動供給と定期同期」へ更新。

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/settled_points_import.test.ts`
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`

## 2026-02-13 - commit-0112: settled event JSON import for local pointsDelta migration

### Why
- DEV_TODO の Doing では、Phase 4 の pointsDelta 連携を URL 手入力から `on-chain settled event` 取り込みへ進める段階だった。
- 既存フローは Replay URL の `pda` 依存のため、後から settled event を一括反映する導線がなく、season points の移行効率が低かった。
- ローカル保存の event attempts に対して、安全に `pointsDeltaA` を適用するには、`matchId` 一致だけでなく winner / tiles 整合チェックが必要だった。

### What
- `apps/web/src/lib/settled_points_import.ts` を追加。
  - 入力 schema 対応:
    - settled event 配列
    - `{ settledEvents: [...] }`
    - `{ records: [{ settled: ... }] }`
  - `validateLadderMatchSettledEventV1(...)` を使って settled event を検証。
  - `matchId` 単位で正規化し、競合 duplicate を issue として報告。
  - `applySettledPointsToAttempts(...)` でローカル attempt へ適用:
    - no local / winner mismatch / tiles mismatch / draw を安全にスキップ
    - 整合した attempt のみ `pointsDeltaA` + `pointsDeltaSource=settled_attested` を更新
- `apps/web/src/pages/Events.tsx`
  - `Settled points import (local)` UI を追加（JSON貼り付け、適用、入力クリア）。
  - import 結果サマリ（input/valid/updated/matched/unchanged/no-local/mismatch）と issue 抜粋表示を追加。
  - `Apply settled JSON` 実行時に更新対象 attempt を `upsertEventAttempt(...)` で永続化。
  - My Pawprints 一覧に `deltaA` バッジ表示を追加。
- `apps/web/src/lib/__tests__/settled_points_import.test.ts`
  - parse（複数schema）・duplicate conflict・apply（正常更新/不整合/ローカル未一致）を検証。
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0112 完了を追記し、Doing を「取得自動化と署名検証フロー統合」へ更新。

### Verify
- `pnpm -C apps/web test -- src/lib/__tests__/settled_points_import.test.ts`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`

## 2026-02-13 - commit-0111: phased pointsDelta integration for season progress

### Why
- DEV_TODO の Doing「pointsDelta 連携へ段階拡張」に対し、現状の season points は provisional ルールのみだった。
- on-chain settled event の自動取り込み前に、`pointsDeltaA` を安全に受け取って集計に反映できる移行レイヤーが必要だった。
- 既存履歴との互換性を守るため、部分データで順位が不安定化しない採用条件を固定したかった。

### What
- `apps/web/src/lib/event_attempts.ts`
  - `EventAttemptV1` に optional `pointsDeltaA` / `pointsDeltaSource` を追加。
- `apps/web/src/lib/appUrl.ts`
  - replay share URL に `pda`（pointsDeltaA）を追加できるよう拡張。
- `apps/web/src/pages/Replay.tsx`
  - `?pda=` を int32 で解析。
  - Event attempt 保存時に `pointsDeltaA` を保持。
  - share/canonical link でも `pda` を維持。
- `apps/web/src/lib/season_archive.ts`
  - event単位の `pointsDeltaTotal` / `pointsDeltaAttemptCount` / `pointsDeltaCoveragePercent` を追加。
  - archive markdown に delta 列を追加。
- `apps/web/src/lib/season_progress.ts`
  - source 概念（`provisional` / `points_delta`）を追加。
  - event内で `pointsDeltaA` が100%揃った場合のみ `points_delta` 採用、未充足は provisional 維持。
  - source mix 集計と markdown 出力を追加。
- `apps/web/src/pages/Events.tsx`
  - progress パネルに source mix 表示を追加。
  - board に source badge（delta/provisional）と coverage 表示を追加。
  - event行に delta total / coverage を追加。
- Tests
  - `apps/web/src/lib/__tests__/appUrl.test.ts`
  - `apps/web/src/lib/__tests__/season_archive.test.ts`
  - `apps/web/src/lib/__tests__/season_progress.test.ts`
  - pointsDelta 入力・集計・採用条件を追加検証。

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web test -- src/lib/__tests__/appUrl.test.ts src/lib/__tests__/season_archive.test.ts src/lib/__tests__/season_progress.test.ts`
  - この実行環境では `vite/vitest` 起動時に `spawn EPERM` で完走不可

## 2026-02-13 - commit-0110: local season points and reward-tier guidance on /events

### Why
- Phase 4 の未完了項目「シーズン制（ランキング/報酬/アーカイブ）」に対して、archive は実装済みだが ranking/reward の導線が不足していた。
- 公式の on-chain `pointsDelta` 連携を入れる前段として、ローカル履歴から決定的に再計算できる暫定進行指標が必要だった。
- 集計ロジックを UI に埋め込むと将来の pointsDelta 移行時に回帰しやすいため、pure function として分離する必要があった。

### What
- `apps/web/src/lib/season_progress.ts` を追加。
  - `Win +3 / Loss +1 / Event clear +2` のローカル points ルールを固定。
  - reward tier（Rookie/Bronze/Silver/Gold/Legend）判定を追加。
  - event別 points board を決定的 tie-break で生成。
  - progress markdown 出力を追加。
- `apps/web/src/pages/Events.tsx`
  - `Local season points (provisional)` パネルを追加（tier / next / progress bar / hint）。
  - `Season points board`（event別）を追加。
  - `Copy summary` を archive + progress の結合出力へ拡張。
- `apps/web/src/lib/__tests__/season_progress.test.ts`
  - points算出、tier遷移、tie-break、markdown 出力を検証。
- Docs
  - `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` に Commit0110 を追記。
  - `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md` の Phase 4 進捗を更新。

### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`

## 2026-02-12 - commit-0107: phase4 onboarding quickstart (Home checklist + Match progress sync)

### Why
- Phase 4 の参加導線で「新規参加者向けチュートリアル（3分理解→1分参加）」が未実装だった。
- ルール確認から初回対戦までを短くし、離脱しやすい最初の1分をプロダクト側で補助する必要があった。

### What
- `apps/web/src/lib/onboarding.ts` を新規追加。
  - 進捗3ステップ（`read_quick_guide` / `start_first_match` / `commit_first_move`）を定義。
  - localStorage への読み書き、完了数集計、全完了判定、reset を実装。
- `apps/web/src/lib/__tests__/onboarding.test.ts` を新規追加。
  - 既定値、進捗永続化、完了数判定、異常payload fallback、reset を検証。
- `apps/web/src/pages/Home.tsx`
  - 「はじめての1分スタート」チェックリストUIを追加。
  - 1分ルールモーダルを追加し、表示時に `read_quick_guide` を更新。
  - クイック対戦導線で `start_first_match` を更新し、進捗リセット操作を追加。
- `apps/web/src/pages/Match.tsx`
  - guest match 開始時に `start_first_match` を更新。
  - 最初の手が確定したタイミング（`turns.length >= 1`）で `commit_first_move` を更新。
- `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md`
  - Phase 4 の「新規参加者向けチュートリアル」項目を完了に更新。
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0107 を追記し、Doing を次フェーズへ更新。

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web test -- src/lib/__tests__/onboarding.test.ts`
  - この実行環境では `vite/vitest` 起動時に `spawn EPERM` が発生し完走不可

## 2026-02-12 - commit-0108: stream moderation controls (NG words / ban / slow mode)

### Why
- Phase 4 の未完了項目「モデレーション機能（NGワード、BAN、スローモード連携）」が `/stream` に不足していた。
- 既存 anti-spam（レート制限・投票変更回数）だけでは、配信現場での明示的な除外制御が足りなかった。

### What
- `apps/web/src/lib/stream_moderation.ts` を新規追加。
  - BAN 判定、NGワード判定、slow mode 判定を pure function 化。
  - comma/newline 形式の設定文字列を正規化・重複除去するパーサを追加。
- `apps/web/src/pages/Stream.tsx`
  - moderation 設定 state を追加（slow mode 秒数 / banned users / blocked words）。
  - localStorage 永続化を追加（`stream.moderation.*`）。
  - `addVoteFromChat` で受理前に moderation 判定を適用:
    - banned user reject
    - blocked word reject
    - slow mode reject
  - vote audit に `banned/ng-word/slow` の reject カウンタを追加。
- `apps/web/src/components/stream/VoteControlPanel.tsx`
  - Moderation UI（slow mode秒数・BAN list・NG words）を追加。
  - audit 表示に moderation reject 内訳を追加。
- `apps/web/src/lib/local_settings.ts`
  - moderation 設定の read/write ヘルパを追加。
- Tests:
  - `apps/web/src/lib/__tests__/stream_moderation.test.ts` を追加。
  - `apps/web/src/lib/__tests__/local_settings.test.ts` に moderation roundtrip を追加。
- Docs:
  - `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md` の Phase 4 moderation 項目を完了に更新。
  - `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` に Commit0108 を追記。

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web test -- src/lib/__tests__/stream_moderation.test.ts src/lib/__tests__/local_settings.test.ts`
  - この実行環境では `vite/vitest` 起動時に `spawn EPERM` が発生し完走不可

## 2026-02-12 - commit-0105: permissionless ladder format v1 (record verify + deterministic standings)

### Why
- DEV_TODO の高優先項目「ラダー（ランキング）を許可不要で第三者運用できるフォーマット」が未完了だった。
- transcript / settled event / 署名の3点を最小セットで固定しないと、同じデータでも再計算結果が揺れるリスクがあった。
- indexer依存を避けるため、重複処理・ソート順・tie-break順を仕様として固定する必要があった。

### What
- `packages/triad-engine/src/ladder.ts` を新規追加。
  - `LadderMatchAttestationV1`（EIP-712）を追加。
    - typed-data payload / digest / signer recover / signature verify を実装。
  - `LadderMatchRecordV1` 検証を実装。
    - `hashTranscriptV1(transcript) == settled.matchId` を必須化。
    - transcript header と settled event の ruleset/season/player 一致を検証。
    - playerA/playerB の両署名検証を必須化。
  - `buildLadderStandingsV1(...)` を実装。
    - sourceキー（chainId:blockNumber:txHash:logIndex）で重複排除。
    - 同一sourceの内容不一致を reject。
    - points / wins / draws / losses / tileDiff を集計。
    - tie-break順を固定（points desc → wins desc → tileDiff desc → losses asc → address asc）。
- `packages/triad-engine/src/index.ts`
  - `ladder` エクスポートを追加。
- `packages/triad-engine/test/ladder.test.js`
  - 正常系、transcript不一致、署名不一致、重複排除、conflicting duplicate rejection、固定tie-breakを追加検証。
- `docs/02_protocol/Nyano_Triad_League_LADDER_FORMAT_SPEC_v1_ja.md`
  - ladder v1 のフォーマット仕様を新規追加。
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - ladder項目を完了に更新。

### Verify
- `pnpm -C packages/triad-engine lint`
- `pnpm -C packages/triad-engine build`
- `pnpm -C packages/triad-engine test`（この実行環境では `node:test` が `spawn EPERM` のため完走不可）
- `node -e ...` で ladder の署名検証・standings集計をスモーク実行（成功）

## 2026-02-12 - commit-0106: phase3 hardening (web error tracking + release runbook)

### Why
- Phase 3 の未完了項目（エラートラッキング / リリース手順）が残っており、回帰検知と出荷手順の標準化が不足していた。
- 依存追加を最小に抑えつつ、まず実運用できるエラー収集の基盤が必要だった。

### What
- `apps/web/src/lib/error_tracking.ts` を新規追加。
  - global `error` / `unhandledrejection` 向けの収集ロジックを実装。
  - sink を切替可能化（`local` / `console` / `remote`）。
  - localStorage リングバッファ（既定50件）で履歴保持。
  - env 設定:
    - `VITE_ERROR_TRACKING_MODE`
    - `VITE_ERROR_TRACKING_ENDPOINT`
    - `VITE_ERROR_TRACKING_MAX_EVENTS`
    - `VITE_APP_RELEASE`
- `apps/web/src/main.tsx`
  - `installGlobalErrorTracking()` を起動時に導入。
- `apps/web/src/lib/__tests__/error_tracking.test.ts`
  - sink解析、イベント正規化、ローカル保持、クリア、console sink を検証。
- `package.json`
  - `release:check` スクリプトを追加（engine lint/build + web typecheck/lint/build）。
- `docs/99_dev/RELEASE_RUNBOOK_v1_ja.md`
  - versioning / changelog / rollback / feature flag / release check を定義。
- `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md`
  - Phase 3 の未完了2項目を完了に更新。
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0106 を反映し、Doing を次フェーズへ更新。

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/error_tracking.test.ts`
  - この実行環境では `vite/vitest` 起動時に `spawn EPERM` が発生し完走不可

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

## 2026-02-12 - commit-0103: Nyano card-art retry CTA + nonce-based reload

### Why
- `NyanoCardArt` は gateway fallback を試した後に即 placeholder 固定となり、回線復帰時にユーザーが再試行できなかった。
- 同じ URL への再読込ではブラウザキャッシュにより失敗状態が残るケースがあり、明示的な cache-busting が必要だった。

### What
- `apps/web/src/lib/card_image_retry.ts`
  - Added image retry utilities:
    - `normalizeImageRetryQueryKey(...)`
    - `applyImageRetryNonce(...)`
    - `buildImageRetryAttemptSources(...)`
  - Supports absolute/relative URL safely and keeps nonce=0 as no-op.
- `apps/web/src/lib/__tests__/card_image_retry.test.ts`
  - Added coverage for:
    - retry query key normalization,
    - nonce injection behavior (absolute + relative URL),
    - attempt-source planning with fallback dedupe.
- `apps/web/src/components/NyanoCardArt.tsx`
  - Integrated retry-source planner for primary + fallback gateways.
  - Added failed-state `Retry` button:
    - increments retry nonce,
    - rebuilds source queue with cache-busting query,
    - re-attempts loading from primary source.
  - Kept existing placeholder fallback and debug badge behavior.

### Verify
- `pnpm -C apps/web test -- src/lib/__tests__/card_image_retry.test.ts`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test`

## 2026-02-12 - commit-0104: season council minimal protocol (proposal / vote / adopt)

### Why
- DEV_TODO の高優先項目として「シーズンの議会（ruleset proposal / vote / adopt）」が未完了だった。
- 運営不在でも第三者が同じ採択結果を再現できるように、決定論な集計規則を先に固定する必要があった。
- 署名投票（EIP-712）を導入する前提を崩さない形で、最小の TS 参照実装を追加したかった。

### What
- `packages/triad-engine/src/season_council.ts` を新規追加。
  - Proposal:
    - `canonicalizeSeasonCouncilCandidatesV1(...)`
    - `hashSeasonCouncilCandidateSetV1(...)`
    - `buildSeasonCouncilProposalIdV1(...)`
  - Vote:
    - `buildSeasonCouncilVoteHashV1(...)`
    - EIP-712 payload/digest/recover/verify helpers:
      - `buildSeasonCouncilVoteTypedDataV1(...)`
      - `buildSeasonCouncilVoteTypedDataDigestV1(...)`
      - `recoverSeasonCouncilVoteSignerV1(...)`
      - `verifySeasonCouncilVoteSignatureV1(...)`
  - Tally/Adopt:
    - `tallySeasonCouncilVotesV1(...)`
      - 同一 voter は最大 nonce 採用
      - 同一 nonce 競合はエラー
      - proposal不一致 / 期限切れ / 候補外は reject
      - 同率は `rulesetId` 昇順で tie-break
    - `adoptSeasonCouncilRulesetV1(...)`
      - quorum 到達 + winner 存在時のみ採択
- `packages/triad-engine/src/index.ts`
  - `season_council` エクスポートを追加。
- `packages/triad-engine/test/season_council.test.js`
  - proposalId canonicalization、vote hash 決定性、EIP-712 sign/verify/recover、nonce 競合、tally/adopt 条件を追加検証。
- `docs/02_protocol/Nyano_Triad_League_SEASON_COUNCIL_SPEC_v1_ja.md`
  - v1 最小プロトコル仕様を新規追加（proposal/vote/adopt、deterministic rule、EIP-712 型）。
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Wind公平化を完了に更新。
  - 「シーズンの議会」項目を完了に更新。
  - Doing を「ラダー format 固定」へ更新。

### Verify
- `pnpm -C packages/triad-engine lint`
- `pnpm -C packages/triad-engine test`
## 2026-02-13 — WO005-H follow-up: Pixi texture failure status + retry controls

### Why
- Stage routes now keep gameplay available during index/RPC failures, but card-art texture failures in Pixi mode had no explicit feedback path.
- We needed a non-blocking UX that explains when placeholder cards are shown and allows user-triggered retry without creating tight auto-retry loops.

### What
- `apps/web/src/engine/renderers/IBattleRenderer.ts`
  - Added optional texture status contract:
    - `BattleRendererTextureStatus`
    - `onTextureStatus?(...)`
    - `retryTextureLoads?()`
- `apps/web/src/engine/renderers/pixi/textureResolver.ts`
  - Added failed/pending state introspection:
    - `isPending(...)`, `isFailed(...)`, `clearFailed(...)`
  - Added load outcome events via `onStatus(...)`.
  - Mark failed tokenIds when all URLs fail, clear failure mark on successful retry.
- `apps/web/src/engine/renderers/pixi/PixiBattleRenderer.ts`
  - Added texture status aggregation for visible board tokenIds.
  - Emits status snapshots to React through `onTextureStatus`.
  - Prevents immediate re-request loops for failed tokenIds until explicit retry.
  - Added `retryTextureLoads()` to clear failed flags and re-attempt loading.
- `apps/web/src/engine/components/BattleStageEngine.tsx`
  - Added stage-local status banner:
    - loading progress while textures are pending
    - failure guidance when placeholders are active
    - `Retry card art` action wired to renderer retry hook
- `apps/web/src/engine/__tests__/textureResolverPreload.test.ts`
  - Added tests for failed status marking/events and successful retry recovery.

### Verify
- `pnpm -C apps/web test -- src/engine/__tests__/textureResolverPreload.test.ts`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
- `pnpm -C apps/web build`
## 2026-02-13 — WO005-I follow-up: auto fallback to Mint board when Pixi/WebGL init fails

### Why
- `ui=engine` stage routes previously showed an init error placeholder when Pixi failed, but did not keep an interactive board path.
- This could block play/replay flow on devices or sessions where WebGL or dynamic chunk load failed.

### What
- `apps/web/src/engine/components/BattleStageEngine.tsx`
  - Added `onInitError` callback prop.
  - Wrapped dynamic import + renderer init in a unified try/catch and report init failures through callback.
- `apps/web/src/pages/Match.tsx`
  - Added engine renderer failure state and automatic fallback from `BattleStageEngine` to `BoardViewMint`.
  - Added compact fallback banner with `Retry Pixi` action.
  - Kept focus-hand commit controls available while fallback board is active.
- `apps/web/src/pages/Replay.tsx`
  - Added the same engine-failure state and fallback to `BoardViewMint` when Pixi init fails.
  - Added `Retry Pixi` action in replay view.
- `apps/web/e2e/stage-focus.spec.ts`
  - Added WebGL-unavailable scenario for `/battle-stage` and verification that fallback + retry UI appears.
  - Hardened 375px commit-visibility assertion to handle transient fallback mode without flakiness.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/engine/__tests__/BattleStageEngine.test.ts src/engine/__tests__/rendererHardening.test.ts`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
- `pnpm -C apps/web build`
## 2026-02-13 — WO005-J follow-up: replay-stage WebGL fallback e2e coverage

### Why
- We added Pixi-init failure fallback to Mint board in both battle and replay routes, but only battle had explicit e2e protection.
- Replay fallback path needed the same regression guard to keep stage routes resilient on WebGL-unavailable environments.

### What
- `apps/web/e2e/stage-focus.spec.ts`
  - Added `/replay-stage` scenario that forces WebGL context failure and verifies:
    - fallback banner visibility,
    - replay-specific retry action (`Retry Pixi renderer in replay`).
  - Hardened existing 375px commit-visibility assertion:
    - pass when commit button is in viewport in normal Pixi path,
    - also pass when Pixi fallback mode is active (`Retry Pixi renderer` visible).

### Verify
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-U follow-up: stage keyboard guard hardening

### Why
- Stage keyboard shortcuts should not hijack browser/OS shortcuts (Ctrl/Alt/Meta combinations).
- Replay keyboard updates introduced stronger key handling, so we hardened behavior to reduce accidental default-prevent side effects.

### What
- `apps/web/src/pages/Match.tsx`
  - Stage keyboard handler now ignores modified key presses (`Alt/Ctrl/Meta`).
- `apps/web/src/pages/Replay.tsx`
  - Keyboard handler now:
    - ignores modified key presses (`Alt/Ctrl/Meta`),
    - ignores `contentEditable` targets,
    - keeps Arrow step shortcuts without forcing `preventDefault`,
    - only prevents default on `Space` when replay can actually play.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-V follow-up: glassmorphism + cinematic stage polish

### Why
- Stage and shared UI already had baseline polish, but we needed stronger "game screen" atmosphere and richer material depth without changing interaction flow.
- The user requested further visual quality with glassmorphism while preserving existing design intent.

### What
- `apps/web/src/styles.css`
  - Added shared glass tokens (`--nytl-glass-*`) for panel/button depth consistency.
  - Upgraded global page background to multi-layer soft cyan ambience with slow drift animation.
  - Refined shared `card`, `card-hd`, `card-bd`, `btn`, `btn-primary` to frosted glass treatment with brighter specular highlights.
  - Added reduced-motion guard for ambient background drift.
- `apps/web/src/mint-theme/mint-theme.css`
  - Enhanced `stage-focus-root` with atmospheric gradient layers and subtle cinematic texture.
  - Added animated ambient glow layer (`mint-stage-atmo-drift`) behind stage content.
  - Upgraded `stage-focus-toolbar` and `stage-focus-toolbar-actions` with stronger glass depth and top sheen highlight.
  - Upgraded `stage-focus-arena-shell` and stage board shell with richer translucency + depth shadows.
  - Added VFX safety controls:
    - disable stage ambient overlays when `data-vfx="off"`
    - tone down ambient intensity for `data-vfx="low"`
    - disable stage ambient animation under `prefers-reduced-motion`.

### Verify
- `pnpm -C apps/web build`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`

## 2026-02-13 - WO005-T follow-up: replay load-failure e2e determinism

### Why
- `stage-focus` e2e had intermittent failure in the replay load-failure scenario due cached local data (GameIndex / RPC preference) changing runtime behavior across runs.
- We needed deterministic preconditions so the regression test always validates recovery UI under the intended failure path.

### What
- `apps/web/e2e/stage-focus.spec.ts`
  - In `/replay-stage keeps recovery controls when replay load fails`:
    - clear `localStorage` keys before navigation:
      - `nyano.gameIndex.v1`
      - `nytl.rpc.user`
      - `nytl.rpc.lastOk`
    - keep existing network abort routes (`game/index` + known RPC hosts).
  - This ensures replay card resolution cannot silently succeed from stale cache.

### Verify
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-S follow-up: stage action feedback chips

### Why
- Stage keyboard shortcuts and toolbar actions were functional, but users had little immediate confirmation that a command was accepted.
- We needed lightweight, non-blocking feedback in the same top action area (battle/replay), without adding modal/toast noise.

### What
- `apps/web/src/pages/Match.tsx`
  - Added short-lived stage action feedback state (`Ready` / action message) with auto-clear timer.
  - Wired feedback updates to stage key actions and top toolbar actions:
    - focus exit, fullscreen, controls, HUD, replay open, manual Nyano move.
  - Added commit/undo feedback when actions are accepted in stage focus flow.
  - Added visible+accessible feedback chip in battle focus toolbar (`aria-live`).
- `apps/web/src/pages/Replay.tsx`
  - Added the same short-lived stage action feedback state with auto-clear timer.
  - Wired feedback to replay stage key actions and toolbar actions:
    - focus exit, fullscreen, controls/setup/panels toggles,
    - start/prev/play/next/end transport,
    - highlight jumps.
  - Reused feedback-aware handlers in keyboard and toolbar paths for consistency.
  - Added visible+accessible feedback chip in replay focus toolbar (`aria-live`).
- `apps/web/src/mint-theme/mint-theme.css`
  - Added `stage-focus-toolbar-feedback` style tokenized as a compact pill.
  - Added mobile responsive behavior so feedback wraps cleanly under 768px.
- `apps/web/e2e/stage-focus.spec.ts`
  - Extended stage keyboard shortcut tests to assert battle/replay feedback text updates.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
## 2026-02-13 — WO005-L follow-up: replay toolbar quick transport in stage focus

### Why
- Replay stage focus still depended on lower replay transport controls, which could require scrolling on desktop flows.
- We needed a top-level quick transport path (playback + step controls) to keep board and key replay actions in one viewport.

### What
- `apps/web/src/pages/Replay.tsx`
  - Added `showStageToolbarTransport` gate for stage-focus replay toolbar quick controls.
  - Added toolbar quick transport group with:
    - `start / prev / play-pause / next / end`,
    - speed selector (`Replay speed from focus toolbar`),
    - step status badge.
  - Reused existing replay state (`step`, `isPlaying`, `playbackSpeed`) so behavior stays deterministic.
- `apps/web/src/mint-theme/mint-theme.css`
  - Added replay-specific toolbar action styling:
    - `stage-focus-toolbar-actions--replay`
    - `stage-focus-toolbar-speed`
    - `stage-focus-toolbar-speed-select`
  - Added responsive wrapping behavior under mobile widths.
- `apps/web/e2e/stage-focus.spec.ts`
  - Added desktop regression test to verify top replay play button is visible/in-viewport and no horizontal overflow regression occurs.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
## 2026-02-13 — WO005-M follow-up: battle toolbar warning mark selector

### Why
- Battle stage focus already had top `Commit/Undo`, but warning-mark selection still depended on lower controls.
- We needed the full placement-confirmation flow to complete from top toolbar in desktop focus view.

### What
- `apps/web/src/pages/Match.tsx`
  - Added `warning` selector to stage-focus toolbar action group.
  - Selector reuses existing warning-mark state (`draftWarningMarkCell`) and option rules:
    - excludes selected placement cell,
    - disables when AI turn / game over / warning limit reached.
  - Keeps existing lower hand-dock warning selector for continuity.
- `apps/web/e2e/stage-focus.spec.ts`
  - Extended desktop top-toolbar test to assert `Warning mark from focus toolbar` visibility.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
## 2026-02-13 — WO005-N follow-up: stage toolbar guidance hints

### Why
- As top toolbar actions expanded on battle/replay stage routes, first-time users still needed quick guidance for how to use this row.
- We wanted persistent but low-noise hints in the same action zone, with e2e protection against accidental regressions.

### What
- `apps/web/src/pages/Match.tsx`
  - Added `Battle focus toolbar hint` text in the top battle action group:
    - `tap or drag to board, then commit`.
- `apps/web/src/pages/Replay.tsx`
  - Upgraded replay toolbar status from raw step fraction to semantic text:
    - `stepStatusText · phaseInfo.label`.
  - Added `Replay focus toolbar hint` text:
    - `hotkeys: ← → space [ ]`.
- `apps/web/src/mint-theme/mint-theme.css`
  - Added shared `stage-focus-toolbar-hint` style.
  - Added responsive wrapping for hint text under mobile widths.
- `apps/web/e2e/stage-focus.spec.ts`
  - Extended desktop battle/replay toolbar tests to assert hint visibility.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
## 2026-02-13 — WO005-O follow-up: replay toolbar highlight jump controls

### Why
- Replay stage focus already had transport controls at the top, but highlight jump controls still lived in the timeline panel below.
- We needed top-toolbar access to highlight navigation so key tactical moments can be reached without scrolling.

### What
- `apps/web/src/pages/Replay.tsx`
  - Added top-toolbar highlight controls:
    - `Previous highlight from focus toolbar`
    - `Next highlight from focus toolbar`
  - Added top-toolbar highlight status:
    - `Replay highlight status in focus toolbar` (`N/M highlights` or `0 highlights`).
  - Reused existing highlight jump helpers and state (`jumpToPrevHighlight`, `jumpToNextHighlight`, `currentHighlightIdx`) to keep behavior consistent.
- `apps/web/e2e/stage-focus.spec.ts`
  - Extended desktop replay toolbar test to assert highlight jump controls/status visibility.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
## 2026-02-13 — WO005-P follow-up: sticky stage focus toolbars

### Why
- Stage focus routes now have richer top toolbars, but long pages could still push users to scroll and lose context.
- We needed top controls to remain reachable while scrolling in both battle and replay stage pages.

### What
- `apps/web/src/mint-theme/mint-theme.css`
  - Made `.stage-focus-toolbar` sticky:
    - `position: sticky`
    - `top: max(6px, env(safe-area-inset-top))`
    - `z-index: 34`
- `apps/web/src/pages/Match.tsx`
  - Added accessible label for toolbar container:
    - `Stage focus toolbar` (stage route),
    - `Engine focus toolbar` (non-stage engine focus).
- `apps/web/src/pages/Replay.tsx`
  - Added accessible label for toolbar container:
    - `Replay focus toolbar` (stage route),
    - `Engine replay toolbar` (non-stage engine focus).
- `apps/web/e2e/stage-focus.spec.ts`
  - Added scroll regression tests:
    - `/battle-stage keeps focus toolbar visible after scroll`
    - `/replay-stage keeps focus toolbar visible after scroll`

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
## 2026-02-13 — WO005-Q follow-up: stage keyboard shortcuts

### Why
- Stage focus controls became rich enough that keyboard shortcuts are useful for PC play/replay flow.
- We wanted parity between visible toolbar actions and keyboard-triggered quick operations without requiring pointer travel.

### What
- `apps/web/src/pages/Match.tsx`
  - Added stage-focus keyboard shortcuts:
    - `Enter`: commit
    - `Backspace`: undo
    - `F`: fullscreen
    - `C`: show/hide controls
    - `H`: show/hide HUD
    - `R`: open replay (when available)
  - Added input-focus guard to avoid hijacking typing in form fields.
  - Updated battle toolbar hint text with shortcut summary.
- `apps/web/src/pages/Replay.tsx`
  - Extended existing replay keyboard handler with stage-only toggles:
    - `F`: fullscreen
    - `C`: show/hide controls
    - `S`: show/hide setup
    - `D`: show/hide timeline/details panel
  - Updated replay toolbar hint text to include stage shortcut keys.
- `apps/web/e2e/stage-focus.spec.ts`
  - Added keyboard regression tests:
    - `/battle-stage supports stage keyboard shortcuts`
    - `/replay-stage supports stage keyboard shortcuts`

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
## 2026-02-13 — WO005-R follow-up: Escape-to-exit focus mode

### Why
- Stage keyboard shortcuts improved flow, but exiting focus mode still required pointer interaction (`Exit Focus` button).
- We needed a fast keyboard exit for both battle/replay stage routes.

### What
- `apps/web/src/pages/Match.tsx`
  - Added `Escape` shortcut in stage keyboard handler to call `setFocusMode(false)`.
  - In `/battle-stage`, `setFocusMode(false)` now exits to `/match` instead of being re-canonicalized to focus mode.
  - Updated battle toolbar hint to include `Esc`.
- `apps/web/src/pages/Replay.tsx`
  - Added `Escape` shortcut in stage keyboard handler to call `setFocusMode(false)`.
  - In `/replay-stage`, `setFocusMode(false)` now exits to `/replay` instead of being re-canonicalized to focus mode.
  - Updated replay toolbar hint to include `Esc`.
- `apps/web/e2e/stage-focus.spec.ts`
  - Extended keyboard shortcut tests:
    - battle: `Escape` navigates to `/match` and removes `focus` query param.
    - replay: `Escape` navigates to `/replay` and removes `focus` query param.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
## 2026-02-13 — WO005-K follow-up: stage toolbar quick commit controls

### Why
- In stage focus mode, commit controls existed in the hand dock only, so users could still feel commit confirmation is far from the top flow.
- We needed a always-visible top action path on desktop focus layout, while keeping existing hand-dock actions unchanged.

### What
- `apps/web/src/pages/Match.tsx`
  - Added stage-focus toolbar action group with:
    - selection status (`card/cell`),
    - `Commit` action (`Commit move from focus toolbar`),
    - `Undo` action (`Undo move from focus toolbar`),
    - `Nyano Move` when manual AI turn action is available.
  - Kept existing focus hand dock controls as-is, so both top and bottom commit flows remain valid.
- `apps/web/src/mint-theme/mint-theme.css`
  - Added `stage-focus-toolbar-actions` and `stage-focus-toolbar-status` styles.
  - Added mobile responsive behavior for toolbar action wrapping.
- `apps/web/e2e/stage-focus.spec.ts`
  - Added desktop stage-route check that `Commit move from focus toolbar` is visible/in-viewport and no horizontal overflow regression appears.

### Verify
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`

## 2026-02-13 - WO005-W follow-up: replay timeline glass premium pass

### Why
- We improved global/stage glass visuals, but replay timeline area was still flatter than the updated stage shell.
- We needed stronger material depth in replay timeline controls while keeping information hierarchy and existing interaction flow unchanged.

### What
- `apps/web/src/styles.css`
  - Upgraded `.replay-timeline-shell` to layered frosted glass with depth shadow and subtle specular sheen.
  - Added timeline glint animation (`replay-timeline-glint`) via pseudo-layer for premium panel feel.
  - Refined timeline chips and pills:
    - `.replay-step-pill`
    - `.replay-phase`
    - `.replay-highlight-index`
    - `.replay-highlight-chip`
    - `.replay-highlight-callout`
  - Refined progress/marker polish:
    - `.replay-progress`
    - `.replay-progress__bar`
    - `.replay-highlight-marker`
  - Added safety gates for accessibility/perf:
    - disable glint animation in `prefers-reduced-motion`
    - hide timeline pseudo-layers when `data-vfx="off"`
    - reduce glint intensity/speed for `data-vfx="low"`.

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-AC follow-up: Pixi card info panel readability pass

### Why
- Pixi board depth was improved, but card stat overlays still felt crowded over NFT art compared with Mint card composition.
- We needed cleaner art visibility while keeping edge/janken information immediately readable in `ui=engine`.

### What
- `apps/web/src/engine/renderers/pixi/PixiBattleRenderer.ts`
  - Added a dedicated bottom glass info panel layer in `updateEdgeTexts(...)` so edge values and janken sit on a coherent panel instead of directly floating over art.
  - Rebalanced card lower overlays in `drawCardSurface(...)`:
    - reduced heavy lower vignette/shadow intensity
    - shifted dark emphasis further toward the lower band to preserve main art region.
  - Tuned card UI layout metrics for cleaner hierarchy:
    - raised panel top ratio (more art space)
    - reduced edge chip footprint and font sizing
    - reduced janken badge size and alpha to avoid visual dominance.
  - Added explicit panel palette tokens (`infoPanelBase/light/dark/border`) for future Pixi/Mint parity tuning.

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-AI follow-up: stage action feedback tone states

### Why
- Stage toolbars already exposed action feedback text, but every state used the same visual chip style.
- We needed clearer at-a-glance feedback priority (info/success/warn) without changing existing command flow.

### What
- `apps/web/src/pages/Match.tsx`
  - Added `stageActionFeedbackTone` state and extended `pushStageActionFeedback(...)` to accept `tone`.
  - Applied tone mapping:
    - `Move committed` -> `success`
    - `Exiting focus mode` -> `warn`
    - other toolbar updates -> `info`
  - Rendered tone-aware class on stage feedback chip (`stage-focus-toolbar-feedback--*`).
- `apps/web/src/pages/Replay.tsx`
  - Added same tone-aware feedback state pattern.
  - Applied tone mapping:
    - playback start / highlight jumps / jump-to-start -> `success`
    - exiting focus -> `warn`
    - other replay controls -> `info`
  - Rendered tone-aware class on replay stage feedback chip.
- `apps/web/src/mint-theme/mint-theme.css`
  - Added feedback tone variants:
    - `.stage-focus-toolbar-feedback--info`
    - `.stage-focus-toolbar-feedback--success`
    - `.stage-focus-toolbar-feedback--warn`

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-AH follow-up: battle stage SFX parity on focus toolbar

### Why
- Replay stage gained top-toolbar SFX control and UI action cues, but battle stage still handled SFX toggle primarily near HUD.
- We needed consistent focus-toolbar behavior between `/battle-stage` and `/replay-stage` for better control discoverability and interaction feel.

### What
- `apps/web/src/pages/Match.tsx`
  - Added reusable `playMatchUiSfx(...)` helper (`SfxName`) for battle stage toolbar actions.
  - Added focus-toolbar SFX toggle button (`mint-sfx-toggle`) in stage route controls.
  - Added light UI action cues to focus-toolbar handlers:
    - fullscreen / controls / HUD toggle
    - exit focus
    - open replay
    - manual Nyano move request
  - Avoided duplicate SFX controls by hiding the HUD-row SFX toggle while on stage route (`isStageFocusRoute`), keeping it on non-stage layouts.

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-AG follow-up: stage VFX tiered board-shell atmosphere pass

### Why
- Stage shell quality improved, but board-shell ambient effects were still mostly static and not clearly tiered by `data-vfx`.
- We needed stronger high-tier atmosphere while keeping low/off tiers lightweight and deterministic.

### What
- `apps/web/src/mint-theme/mint-theme.css`
  - Added board-shell ambient keyframes:
    - `mint-stage-board-breathe`
    - `mint-stage-board-glint`
  - Enhanced `stage-focus-board-shell` overlays:
    - `::before` now uses slow atmospheric drift/breathe
    - `::after` now includes moving glint layer + micro-pattern
  - Added explicit VFX-tier tuning for board shell:
    - `data-vfx="low"`: reduced opacity + slower glint + disabled breathe
    - `data-vfx="medium"`: balanced animation intensity and board tilt
    - `data-vfx="high"`: faster richer glint, stronger ambient overlay, deeper board tilt
  - Extended motion safety:
    - `prefers-reduced-motion` disables board-shell animations
    - `data-vfx="off"` already suppresses board-shell overlays.

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-AF follow-up: replay stage SFX control and action cues

### Why
- Stage battle flow already had SFX toggle + event sounds, but replay stage interactions were still silent.
- We needed parity so replay controls feel tactile in `ui=engine` without changing replay logic.

### What
- `apps/web/src/pages/Replay.tsx`
  - Added replay-side SFX engine wiring (`createSfxEngine`) for engine UI mode.
  - Added stage toolbar SFX mute toggle button (`mint-sfx-toggle`) in replay focus mode.
  - Added `playReplaySfx(...)` cues to replay interaction handlers:
    - transport/toolbar toggles (`fullscreen`, controls/setup/timeline show-hide)
    - replay navigation (`start/prev/play-next/end`)
    - highlight navigation (`prev hl` / `next hl`)
  - Added verification result cues in `handleVerify`:
    - success: `victory_fanfare`
    - mismatch: `error_buzz`
  - Kept all URL, replay payload, and keyboard shortcut behavior unchanged (sound-only enhancement).

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-AE follow-up: stage board-shell token unification pass

### Why
- Stage side panels were upgraded, but board-side hero framing still relied on local hardcoded values and replay board shell parity was incomplete.
- We needed a token-driven stage material system so board shell and side panels stay visually coherent across `/battle-stage` and `/replay-stage`.

### What
- `apps/web/src/styles.css`
  - Added stage material tokens for board/side surfaces:
    - `--stage-board-shell-bg`, `--stage-board-shell-border`, `--stage-board-shell-shadow`
    - `--stage-side-panel-bg`, `--stage-side-panel-bg-muted`, `--stage-side-panel-border`
    - `--stage-side-panel-shadow`, `--stage-side-panel-shadow-strong`
- `apps/web/src/mint-theme/mint-theme.css`
  - Updated `stage-focus-board-shell` to use new board shell tokens and added layered hero shell overlays (`::before`, `::after`).
  - Added `stage-focus-board-shell--replay` variant for tighter replay composition.
  - Updated side panel classes to read from stage side-panel tokens instead of hardcoded values.
  - Extended VFX safety gates so board shell overlays are disabled in `data-vfx="off"` and softened in `data-vfx="low"`.
- `apps/web/src/pages/Replay.tsx`
  - Wrapped replay board output with `stage-focus-board-shell stage-focus-board-shell--replay` in stage focus mode, matching battle-stage board shell hierarchy.

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-AD follow-up: stage side-panel glass hierarchy pass

### Why
- Stage focus mode improved board/HUD quality, but side information areas (turn log/result/debug blocks) still looked visually flatter.
- We needed stronger visual hierarchy between main board and side support panels without changing gameplay flow.

### What
- `apps/web/src/pages/Match.tsx`
  - Added `stage-focus-side-column` to the non-mint right column in stage routes.
  - Applied `stage-focus-side-panel` (and muted variant where appropriate) to winner/info, guest CTA, and Nyano AI debug blocks in stage focus.
- `apps/web/src/pages/Replay.tsx`
  - Added `stage-focus-replay-shell` to stage focus replay content wrapper.
  - Applied `stage-focus-side-panel` to replay timeline, replay metadata card, and stage-hidden transport notice.
- `apps/web/src/mint-theme/mint-theme.css`
  - Added stage side-panel visual system:
    - `stage-focus-side-column`
    - `stage-focus-replay-shell`
    - `stage-focus-side-panel`
    - `stage-focus-side-panel--muted`
    - `stage-focus-side-panel--timeline`
  - Added subtle glint animation (`mint-stage-side-glint`) and layered frosted styling for side panels.
  - Added accessibility/perf gates:
    - disable side-panel glint in `prefers-reduced-motion`
    - hide side-panel overlays in `data-vfx="off"`
    - lower animation intensity/speed in `data-vfx="low"`.

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-Z follow-up: Nyano cut-in and focus hand dock premium pass

### Why
- Stage shell and HUD were upgraded, but Nyano cut-in and focus hand dock still looked comparatively flat.
- We wanted stronger “battle feel” in moment-to-moment interactions while keeping existing controls and route behavior unchanged.

### What
- `apps/web/src/mint-theme/mint-theme.css`
  - Focus hand dock polish:
    - Added layered glass background depth and highlight sheen for `.mint-focus-hand-dock`.
    - Added animated sheen overlay (`mint-focus-hand-sheen`) with `vfx off/low` gating.
    - Enhanced `.mint-focus-hand-row` and `.mint-focus-hand-card` with perspective, snap alignment, edge highlights, and richer selected/hover depth.
    - Tuned mobile sizing and stage sticky blur for hand dock readability.
  - Nyano cut-in polish:
    - Upgraded `.mint-nyano-reaction` shell depth, frame line, and burst banner impact.
    - Increased dialogue headline readability and stage-focus emphasis (`.stage-focus-cutin ... __line`).
    - Improved pixi-tone cut-in depth and reason-chip finish.
  - Accessibility/perf safety:
    - Added reduced-motion fallback for new hand dock sheen.
    - Added `data-vfx="off"` / `data-vfx="low"` behavior for new hand dock animation layer.

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-AB follow-up: Pixi board depth parity pass

### Why
- Mint-side board/cell materials were upgraded, but Pixi renderer still looked flatter in comparison.
- We needed visual parity so `ui=engine` retains the same premium stage feeling without changing game behavior.

### What
- `apps/web/src/engine/renderers/pixi/PixiBattleRenderer.ts`
  - Refined board/cell color palette to softer cyan glass tones:
    - `boardPanel`, `boardPanelInner`, `boardFrame`, `cellEmpty`, `cellShadow`, `gridLine`.
    - Added helper tones: `cellEmptyInset`, `cellSelectableFill`, `boardAura`.
  - Enhanced `drawBoardBackdrop(...)`:
    - added outer board aura layer before depth shadow
    - strengthened top highlight and added subtle lower shade band
    - refined internal grid separator readability with light accent pass
    - added corner glow accents for premium board frame finish
  - Enhanced `drawCellShadow(...)`:
    - now considers `isSelectable` / `isSelected` to boost contact shadow and lift clarity
    - added selective aura under interactive empty cells
  - Enhanced empty-cell drawing in `redraw()`:
    - selected cells now layer base + highlight + selected fill + rim
    - selectable cells now use inset fill and top sheen for tactile affordance
    - flat cells now use recessed inset material
    - placed/flipped/owner/focus states got deeper contact shadows for stronger board tactility

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-AA follow-up: board depth and placement tactility pass

### Why
- Stage HUD/cut-in/hand dock quality improved, but board cells still felt flatter compared to surrounding premium panels.
- We needed stronger card placement tactility and board depth without changing interaction logic.

### What
- `apps/web/src/mint-theme/mint-theme.css`
  - Upgraded board base surface:
    - `.mint-board-inner` now uses richer layered gradients and depth shadow.
    - Added `.mint-board-inner::after` micro-pattern/specular layer to avoid flat fill look.
  - Upgraded board grid foundation:
    - `.mint-grid` now uses responsive gap, slight perspective, and ambient center glow layer.
  - Upgraded cell material quality:
    - `.mint-cell` now uses layered glass-like fill and stronger contact shadow.
    - Enhanced `.mint-cell::before` highlight shading for improved bevel feel.
  - Upgraded interaction and ownership states:
    - `.mint-cell--selectable` / `:hover` / `:active` now provide stronger lift and readable active affordance.
    - `.mint-cell--drop-ready` now has clearer readiness depth.
    - `.mint-cell--flat` refined to matte recessed look.
    - `.mint-cell--selected` gets stronger ring + elevation.
    - `.mint-cell--placed` / `.mint-cell--flipped` now include deeper impact shadows.
    - `.mint-cell--owner-a` / `--owner-b` now include subtle owner-themed top highlights.
    - `.mint-cell--focus` ring readability strengthened for replay focus.

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-Y follow-up: premium HUD glass pass (battle/replay stage)

### Why
- Stage and replay shells already gained stronger glass depth, but the in-battle HUD and SFX toggle still looked flatter than the upgraded environment.
- We wanted the HUD to feel like a cohesive "game control module" without changing interaction logic.

### What
- `apps/web/src/mint-theme/mint-theme.css`
  - Upgraded `.mint-battle-hud` to layered frosted-glass treatment with:
    - richer depth shadow
    - sheen and subtle stripe overlays
    - glint sweep animation (`mint-hud-glint-sweep`)
  - Refined HUD internals for legibility and premium polish:
    - `.mint-battle-hud__turn`, `__turn-value`, `__progress`, `__progress-fill`
    - `.mint-battle-hud__advantage`
    - `.mint-battle-hud__phase`, `__phase-dot`, `__phase-label`
    - `.mint-battle-hud__tip`, `.mint-battle-hud__ai-reason`
  - Improved Pixi-tone variant parity (`.mint-battle-hud--pixi`) so dark HUD keeps glass depth while matching engine tone.
  - Added responsive tuning for narrow screens (`@media (max-width: 760px/480px)`).
  - Upgraded `.mint-sfx-toggle` to glass chip style with hover lift and muted-state polish.
  - Added VFX safety gates for HUD layers:
    - `prefers-reduced-motion`: disables HUD glint animations
    - `data-vfx="off"` / `data-vfx="low"`: disables or softens HUD overlay effects.

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 - WO005-X follow-up: deterministic stage fallback and mobile shortcut feedback

### Why
- Stage fallback E2E checks became flaky because renderer init could still succeed depending on runtime GPU paths.
- Mobile focus improvements hid toolbar action content, which also removed the keyboard feedback live region used by stage shortcut UX checks.

### What
- `apps/web/src/engine/components/BattleStageEngine.tsx`
  - Added `hasWebGlContextSupport()` preflight (`webgl2/webgl/experimental-webgl`) before Pixi dynamic import.
  - If unavailable, immediately routes through existing `onInitError` fallback path so Mint board fallback is deterministic.
- `apps/web/e2e/stage-focus.spec.ts`
  - Consolidated GPU-unavailable setup into `mockGpuUnavailable(page)` and extended it to patch:
    - `HTMLCanvasElement.getContext`
    - `OffscreenCanvas.getContext` (when present)
    - `navigator.gpu`
- `apps/web/src/pages/Match.tsx`
  - Kept stage action feedback (`Battle focus action feedback`) rendered in stage toolbar even when controls are hidden.
  - Preserved compact mobile layout by still hiding heavy toolbar action cluster when controls are toggled off.

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
## 2026-02-13 · WO005-C follow-up: Stage toolbar VFX selector (match/replay)

### Why
- Stage focus routes (`/battle-stage`, `/replay-stage`) had adaptive `data-vfx` tiers but no in-session control for users.
- Pixi VFX quality should switch immediately after preference updates, not only on first app load.

### What
- `apps/web/src/pages/Match.tsx`
  - Added focus toolbar VFX selector (`auto/off/low/medium/high`) and persisted preference.
  - Applied VFX tier immediately via `applyVfxQualityToDocument`, surfaced feedback via stage action chip, and passed tier to Pixi renderer.
- `apps/web/src/pages/Replay.tsx`
  - Added the same VFX selector and immediate-apply flow to replay focus toolbar.
  - Kept replay stage behavior consistent with battle stage behavior.
- `apps/web/src/engine/components/BattleStageEngine.tsx`
  - Added optional `vfxQuality` prop and wired it into renderer state updates.

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-14 · WO006/WO007: Classic Rules (engine + web integration)

### Why
- Added Classic rules spec/work-order docs needed actual implementation to avoid drift between spec and runtime behavior.
- Needed deterministic engine behavior + replay-safe web integration without breaking existing v1 protocol paths.

### What
- `packages/triad-engine/src/types.ts`
  - Added additive `FlipTraceV1.winBy`.
  - Added `ClassicRulesConfigV1`, `RulesetConfigV2`, `RulesetConfig` union.
- `packages/triad-engine/src/classic_rng.ts` (new)
  - Added deterministic Classic RNG (`buildClassicSeed0`, `classicSeed`, `classicRandUint`).
- `packages/triad-engine/src/classic_rules.ts` (new)
  - Added Classic config defaults and helpers:
    - `resolveClassicForcedCardIndex` (Order/Chaos)
    - `resolveClassicSwapIndices` / `applyClassicSwapToDecks` (Swap)
- `packages/triad-engine/src/ruleset_id.ts`
  - Added `encodeRulesetConfigV2`, `computeRulesetIdV2`, `computeRulesetId`.
- `packages/triad-engine/src/engine.ts`
  - Added `DEFAULT_RULESET_CONFIG_V2`, `CLASSIC_PLUS_SAME_RULESET_CONFIG_V2`.
  - Implemented Classic semantics:
    - Order / Chaos move validation
    - Swap pre-turn deck transform
    - Reverse / Ace Killer comparison behavior
    - Same / Plus special captures + chain seeding
    - Type Ascend / Descend trait placement counters
  - Extended flip trace emission with `winBy`.
- `packages/triad-engine/src/verify.ts`, `packages/triad-engine/src/index.ts`
  - Updated to `RulesetConfig` union and exported Classic modules.
- Added new engine tests:
  - `packages/triad-engine/test/classic_ruleset_id_v2.test.js`
  - `packages/triad-engine/test/classic_order_chaos_swap.test.js`
  - `packages/triad-engine/test/classic_reverse_ace.test.js`
  - `packages/triad-engine/test/classic_plus_same.test.js`
  - `packages/triad-engine/test/classic_type_ascend_descend.test.js`
- `apps/web/src/lib/ruleset_registry.ts`
  - Added `classic_plus_same` preset key and registry mapping.
- `apps/web/src/pages/Match.tsx`
  - Switched to generic `computeRulesetId`.
  - Added deterministic Order/Chaos enforcement in turn completion + commit validation.
  - Added forced-card UI behavior (non-legal cards become non-selectable).
  - Added Classic ruleset option in ruleset selector.
  - Propagated `winBy` in overlay payload mapping.
- `apps/web/src/pages/Playground.tsx`, `apps/web/src/pages/Replay.tsx`
  - Updated ruleset typing to `RulesetConfig`.
  - Replay overlay payload now includes `winBy`.
- `apps/web/src/components/flipTraceDescribe.ts`
  - Updated text rendering for `winBy` (`lt`, `same`, `plus`, `aceKiller`).
- `apps/web/src/lib/streamer_bus.ts`
  - Added additive `winBy` field to `lastTurnSummary.flips`.
- Updated web tests:
  - `apps/web/src/lib/__tests__/ruleset_registry.test.ts`
  - `apps/web/src/components/__tests__/flipTraceDescribe.test.ts`

### Verify
- `pnpm.cmd lint` ✅
- `pnpm.cmd test` ✅
- `pnpm.cmd -C packages/triad-engine build` ✅
- `pnpm.cmd -C packages/triad-engine lint` ✅
- `node packages/triad-engine/test/classic_ruleset_id_v2.test.js` ✅
- `node packages/triad-engine/test/classic_order_chaos_swap.test.js` ✅
- `node packages/triad-engine/test/classic_reverse_ace.test.js` ✅
- `node packages/triad-engine/test/classic_plus_same.test.js` ✅
- `node packages/triad-engine/test/classic_type_ascend_descend.test.js` ✅
- `pnpm.cmd -C apps/web build` ✅
- `pnpm.cmd -C apps/web typecheck` ❌ (env issue: TS cannot resolve `pixi.js` / `fflate` in this sandbox run)
- `pnpm.cmd -C apps/web test -- ...` ❌ (sandbox `spawn EPERM` while loading vite/esbuild)
- `pnpm.cmd build:web` ❌ (sandbox `spawn EPERM` in nested pnpm/vite invocation)

## 2026-02-14 - WO007 follow-up: stream strict allowlist parity for Classic Order/Chaos

### Why
- Stream/overlay strict allowlist still assumed "remaining cards x empty cells", which diverged from engine legality when Classic `Order/Chaos` was active.
- `/stream` AI prompt generation also listed non-legal moves under Classic constraints.

### What
- `apps/web/src/lib/ruleset_registry.ts`
  - Added Classic preset keys:
    - `classic_order`
    - `classic_chaos`
  - Added ruleset-id reverse lookup:
    - `resolveRulesetById(rulesetId)`
  - Kept existing presets (`v1`, `v2`, `full`, `classic_plus_same`) intact.
- `apps/web/src/pages/Match.tsx`
  - Added ruleset selector options for `classic_order` and `classic_chaos`.
- `apps/web/src/lib/triad_vote_utils.ts`
  - Updated `computeStrictAllowed` to apply deterministic forced-card constraints via:
    - `resolveRulesetById(...)`
    - `resolveClassicForcedCardIndex(...)`
  - Behavior:
    - Order/Chaos ruleset + protocol snapshot present -> allowlist uses forced slot only.
    - Unknown/missing ruleset context -> preserves previous fallback behavior.
- `apps/web/src/pages/Stream.tsx`
  - Updated `buildAiPrompt` to list legal moves from `computeStrictAllowed(...).allowlist` (single source of truth).
  - WarningMark candidate line now prefers strict-allowlist-derived candidates.
- `apps/web/src/lib/__tests__/ruleset_registry.test.ts`
  - Added coverage for new preset keys and `resolveRulesetById`.
- `apps/web/src/lib/__tests__/triad_vote_utils.test.ts`
  - Added Classic Order/Chaos allowlist constraint tests.

### Verify
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web typecheck` FAIL in this sandbox due module resolution (`pixi.js`, `fflate`) access issue.
- `pnpm.cmd -C apps/web test -- ...` FAIL in this sandbox (`spawn EPERM` during Vite/esbuild startup).

## 2026-02-14 - WO007 follow-up: Classic Open visibility + additional preset keys

### Why
- Classic `allOpen` / `threeOpen` flags were encoded in `RulesetConfigV2`, but Match/Replay did not expose deterministic reveal metadata.
- Local ruleset selection also lacked direct presets for `swap`, `allOpen`, and `threeOpen`, making verification cumbersome.

### What
- `packages/triad-engine/src/classic_rules.ts`
  - Added `resolveClassicOpenCardIndices(...)`.
  - Behavior:
    - `allOpen` -> mode `all_open`, both players reveal all indices `[0..4]`.
    - `threeOpen` -> mode `three_open`, each player gets deterministic unique 3 indices from seed/tag `three_open`.
    - `allOpen` takes precedence when both flags are enabled.
- `packages/triad-engine/test/classic_open.test.js` (new)
  - Added deterministic + uniqueness coverage for `threeOpen`.
  - Added precedence coverage for `allOpen + threeOpen`.
- `apps/web/src/lib/ruleset_registry.ts`
  - Added ruleset keys and presets:
    - `classic_swap`
    - `classic_all_open`
    - `classic_three_open`
- `apps/web/src/lib/__tests__/ruleset_registry.test.ts`
  - Extended registry key/resolution coverage for new Classic preset keys.
- `apps/web/src/pages/Match.tsx`
  - Added `resolveClassicOpenCardIndices(...)`-based setup hint:
    - `Classic Open: all cards revealed`
    - `Classic Three Open: A[...] / B[...]`
  - Added selector options for new Classic preset keys above.
- `apps/web/src/pages/Replay.tsx`
  - Added replay detail line for deterministic Classic Open metadata (resolved by transcript `rulesetId` via local registry).

### Verify
- `pnpm.cmd -C packages/triad-engine build` OK
- `node packages/triad-engine/test/classic_open.test.js` OK
- `pnpm.cmd -C packages/triad-engine test` FAIL in this sandbox (`node --test` child spawn EPERM)
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web typecheck` FAIL in this sandbox due module resolution (`pixi.js`, `fflate`) access issue.
- `pnpm.cmd -C apps/web test -- src/lib/__tests__/ruleset_registry.test.ts` FAIL in this sandbox (`spawn EPERM` during Vite/esbuild startup).

## 2026-02-14 - WO007 follow-up: Guest deck preview respects Classic Open visibility

### Why
- Guest mode deck preview always showed Nyano deck cards, so Classic hidden-information rules were not visually respected.
- We already had deterministic Open-rule indices, but they were only shown as text metadata.

### What
- `apps/web/src/pages/Match.tsx`
  - Added `HiddenDeckPreviewCard` placeholder for unrevealed card slots.
  - In Guest deck preview (`Nyano Deck (B)`):
    - when no Classic Open rule is active: behavior unchanged (all cards shown).
    - when `allOpen` is active: all Nyano cards shown with open-rule hint.
    - when `threeOpen` is active: only deterministic revealed slots are shown; other slots are masked.

### Verify
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK

## 2026-02-14 - WO007 follow-up: Replay deck inspector Open-rule masking

### Why
- Replay had deterministic Classic Open metadata text, but Deck inspector still displayed all cards unconditionally.
- That made `threeOpen` visibility semantics unclear in replay review.

### What
- `apps/web/src/pages/Replay.tsx`
  - Added `HiddenDeckPreviewCard` placeholder for unrevealed slots.
  - Added Open-rule-aware masking in Deck inspector:
    - `allOpen`: all slots visible.
    - `threeOpen`: only deterministic revealed slot indices are visible for each player, others are masked.
  - Added per-player hint text showing revealed slot indices.

### Verify
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK

## 2026-02-14 - WO007 follow-up: Replay Three Open hidden-slot reveal toggle

### Why
- Masking unrevealed slots by default improves rule-faithful visibility, but replay review sometimes needs full deck inspection.

### What
- `apps/web/src/pages/Replay.tsx`
  - Added `Show hidden slots (post-match analysis)` toggle in Deck inspector when Classic `threeOpen` is active.
  - Kept default behavior as masked; enabling toggle reveals full cards for both players.
  - Owners mapping panel is also hidden by default under `threeOpen`, and is revealed with the same toggle.
  - `allOpen` behavior remains unchanged (all visible without toggle).

### Verify
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK

## 2026-02-14 - WO007 follow-up: shared HiddenDeckPreviewCard component

### Why
- Match and Replay had duplicated JSX/CSS structure for hidden deck-slot placeholders.
- Keeping this in one component reduces drift risk when tuning hidden-slot UI.

### What
- `apps/web/src/components/HiddenDeckPreviewCard.tsx` (new)
  - Added shared hidden-slot visual component.
- `apps/web/src/pages/Match.tsx`
  - Replaced inline hidden-slot JSX with shared component import.
- `apps/web/src/pages/Replay.tsx`
  - Replaced inline hidden-slot JSX with shared component import.

### Verify
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK

## 2026-02-14 - WO007 follow-up: Stream live status shows Classic Open metadata

### Why
- Stream operators could not confirm Classic Open reveal mapping from the Stream page without opening Match/Replay.
- Overlay state already included `protocolV1.header`, so the mapping can be resolved deterministically client-side.

### What
- `apps/web/src/pages/Stream.tsx`
  - Added Classic Open resolver path:
    - `ruleset = resolveRulesetById(protocolV1.header.rulesetId)`
    - `open = resolveClassicOpenCardIndices({ ruleset, header })`
  - Added Live status line:
    - `all_open` -> `all cards revealed`
    - `three_open` -> `A[...] / B[...]`

### Verify
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK

## 2026-02-14 - WO007 follow-up: Overlay now-playing shows Classic Open metadata

### Why
- Stream page gained Classic Open mapping visibility, but OBS operators looking only at `/overlay` still lacked that context.

### What
- `apps/web/src/pages/Overlay.tsx`
  - Added deterministic Classic Open resolution from `state.protocolV1.header` + local ruleset registry.
  - Added Classic Open line in the "Now Playing" panel:
    - `all_open` -> `all cards revealed`
    - `three_open` -> `A[...] / B[...]`

### Verify
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK

## 2026-02-14 - WO007 follow-up: Replay auto mode resolves Classic rulesetId via local registry

### Why
- Replay `mode=auto` previously selected only official v1/v2 engines, so Classic transcripts could fall back to compare mode even when the app already knew that ruleset.
- This produced a mismatch risk between transcript ruleset intent and replay simulation path.

### What
- `apps/web/src/pages/Replay.tsx`
  - Added `resolveRulesetById` lookup in replay load flow.
  - In `mode=auto`:
    - if transcript `rulesetId` exists in local ruleset registry, replay now simulates with that exact config.
    - otherwise keeps previous official fallback behavior (`v1`/`v2`/`compare`).
  - Added Classic-aware registry label generation for replay header text.
  - Updated auto-compare gating to avoid forcing compare mode when registry-resolved ruleset exists.
  - Updated mode selector label text to clarify `auto` uses both registry and official ruleset mappings.

### Verify
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web typecheck` FAIL in this sandbox due module resolution (`pixi.js`, `fflate`) access issue.
- `pnpm.cmd -C apps/web test -- ...` FAIL in this sandbox (`spawn EPERM` during Vite/esbuild startup).

## 2026-02-14 - WO007 follow-up: Classic Swap visibility in Match/Replay

### Why
- Classic `Swap` was already enforced in the engine, but web UI did not explicitly show which slots were swapped.
- Operators/reviewers needed deterministic visibility of swap mapping for manual verification and replay reading.

### What
- `apps/web/src/pages/Match.tsx`
  - Added `resolveClassicSwapIndices(...)` usage for current ruleset/header.
  - Added setup panel hint when swap is active:
    - `Classic Swap: A{n} ? B{m}`
- `apps/web/src/pages/Replay.tsx`
  - Added `resolveClassicSwapIndices(...)` usage based on transcript `rulesetId` (via local registry lookup).
  - Added replay detail line when swap is active:
    - `classic swap: A{n} ? B{m}`

### Verify
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web typecheck` FAIL in this sandbox due module resolution (`pixi.js`, `fflate`) access issue.
- `pnpm.cmd -C apps/web test -- ...` FAIL in this sandbox (`spawn EPERM` during Vite/esbuild startup).

## 2026-02-14 - WO007 follow-up: add Classic Open/Swap metadata to Stream state_json

### Why
- Stream/Overlay now display Classic Open/Swap, but `state_json` payload did not expose the same resolved metadata explicitly.
- nyano-warudo and stream operators benefit from reading deterministic Classic metadata directly from one payload.

### What
- `apps/web/src/pages/Stream.tsx`
  - Added `resolveClassicStateJson(...)` helper that resolves deterministic Classic metadata from `protocolV1.header` + local ruleset registry.
  - Extended `buildStateJsonContent()` with additive field:
    - `classic: { rulesetId, open, swap } | null`
  - Extended `buildAiPrompt()` with explicit `classic_open` / `classic_swap` lines when active.
  - Reused the same helper for Stream live status Classic Open display.

### Verify
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK

## 2026-02-14 - WO007 follow-up: show Classic Swap in Stream/Overlay operator HUD

### Why
- Classic Swap was already visible in Match/Replay details and in `state_json`, but stream operators watching only `/stream` and `/overlay` still missed swap mapping.

### What
- `apps/web/src/pages/Stream.tsx`
  - Added `Classic Swap` line in live status using the same deterministic classic metadata resolver as `state_json`.
- `apps/web/src/pages/Overlay.tsx`
  - Extended Classic metadata resolution to include both `open` and `swap`.
  - Added `Classic Swap` line in the "Now Playing" panel.

### Verify
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK

## 2026-02-14 - Classic state_json sample/spec update (additive docs)

### Why
- `state_json` now emits additive `classic` metadata, so protocol samples/spec should show the field explicitly for integration consumers.

### What
- `docs/02_protocol/samples/triad_league_state_json_content_sample_v1.json`
  - Added `classic` sample object (`rulesetId`, `open`, `swap`).
- `docs/01_product/Nyano_Triad_League_NYANO_WARUDO_BRIDGE_SPEC_v1_ja.md`
  - Added `classic` optional/additive field note in `state_json schema (v1)`.

### Verify
- JSON sample parses as valid JSON.

## 2026-02-14 - Sync snapshot request sample with latest state_json sample

### Why
- `triad_league_snapshot_request_sample_v1.json` embeds `state_json` as a string; it should stay in sync with the canonical `state_json` sample.

### What
- Re-generated `docs/02_protocol/samples/triad_league_snapshot_request_sample_v1.json` from:
  - `docs/02_protocol/samples/triad_league_state_json_content_sample_v1.json`

### Verify
- Snapshot request sample parses as valid JSON.

## 2026-02-14 - Refactor: share Classic metadata resolver across Stream/Overlay

### Why
- `Stream.tsx` and `Overlay.tsx` had duplicated logic to resolve Classic Open/Swap from `protocolV1.header`.
- Duplicated resolver code increases drift risk when Classic behavior evolves.

### What
- Added `apps/web/src/lib/classic_ruleset_visibility.ts`
  - `resolveClassicMetadataFromHeader(...)`
  - `resolveClassicMetadataFromOverlayState(...)`
  - shared types for resolved Classic open/swap metadata
  - malformed header guard (`try/catch`) so invalid `protocolV1.header` never crashes Stream/Overlay.
- Updated:
  - `apps/web/src/pages/Stream.tsx`
  - `apps/web/src/pages/Overlay.tsx`
  to use the shared resolver.
- Added tests:
  - `apps/web/src/lib/__tests__/classic_ruleset_visibility.test.ts`
  - covers unknown/non-classic/all-open/swap/three-open deterministic paths.

### Verify
- `pnpm.cmd -C apps/web lint` OK
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web test -- src/lib/__tests__/classic_ruleset_visibility.test.ts` FAIL in this sandbox (`spawn EPERM` / esbuild startup).

## 2026-02-14 - Sync ai_prompt sample/spec with Classic context lines

### Why
- `buildAiPrompt()` now emits optional `classic_open` / `classic_swap` lines, but sample/spec docs were still in an older prompt format.

### What
- Updated `docs/02_protocol/samples/triad_league_ai_prompt_sample_v1.txt` to current ai_prompt format.
- Updated `docs/01_product/Nyano_Triad_League_NYANO_WARUDO_BRIDGE_SPEC_v1_ja.md` to note optional Classic context lines in `ai_prompt`.

## 2026-02-14 - WO006 Nyano reaction layout stability (slot + clamp)

### Why
- `NyanoReaction` was conditionally mounted/unmounted in Match/Replay, which could change vertical layout flow when comments appeared/disappeared.
- UX scorecard `G-4` requires no visible layout jump for Nyano comment/cut-in rendering.

### What
- Added `apps/web/src/components/NyanoReactionSlot.tsx`.
  - Always renders a stable slot container.
  - Renders `NyanoReaction` only when input exists, while preserving slot height.
  - Adds a code comment explaining why slot is always mounted.
- Updated `apps/web/src/pages/Match.tsx` and `apps/web/src/pages/Replay.tsx` to use `NyanoReactionSlot`.
- Updated `apps/web/src/mint-theme/mint-theme.css`.
  - Added `.mint-nyano-reaction-slot*` classes with fixed `min-height` (including stage-focus variant).
  - Changed `.mint-nyano-reaction__line` to 2-line clamp (`-webkit-line-clamp: 2`) to avoid height spikes from long text.
- Added `apps/web/src/components/__tests__/NyanoReactionSlot.test.tsx` to guard slot stability behavior.

### Verify
- `pnpm -C apps/web test` (includes `NyanoReactionSlot.test.tsx`)
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

## 2026-02-14 - WO007 board/stage visual polish (Mint board as stage)

### Why
- Card visuals were already strong, but board/stage surfaces still felt flatter than intended.
- WO007 targets "material depth + visual hierarchy" without changing gameplay logic.

### What
- Updated `apps/web/src/components/DuelStageMint.tsx`
  - Added lightweight stage layers: `mint-stage__rim` and `mint-stage__atmo`.
- Updated `apps/web/src/mint-theme/mint-theme.css`
  - Board/frame polish:
    - added subtle frame pattern + rim depth
    - added `mint-board-sheen` motion layer on `.mint-board-inner::after`
  - Cell polish:
    - added `.mint-cell::after` specular/depth layer
    - added warning-mode visual treatment (`.mint-cell--warning-mode`) for non-color-only affordance
  - Stage polish:
    - added rim/atmosphere styles and animation (`mint-stage-atmo-float`)
  - Performance/accessibility gates:
    - added reduced-motion fallback for board sheen/atmo
    - extended `[data-vfx=off|low|medium|high]` branching for new layers
  - Mobile tuning:
    - added ≤560px sizing adjustments for stage/board/frame/grid density.
- Added `apps/web/src/components/__tests__/DuelStageMint.test.tsx`
  - verifies stage layer presence and impact class composition.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-14 - WO010 UX regression guardrails (E2E)

### Why
- WO010 requires minimum UX guardrails that fail fast when setup flow or layout stability regresses.
- The highest-risk points are Match Setup URL sync and Nyano comment-slot layout stability.

### What
- Added `apps/web/e2e/ux-guardrails.spec.ts`.
- Added guardrail test 1:
  - Match Setup primary controls update URL params consistently (`rk`, `opp`, `ai`, `ui`).
- Added guardrail test 2:
  - Nyano reaction slot keeps non-zero stable height while reactions appear during live play.
  - Includes bounded height-delta assertion and CSS clamp/overflow assertion for reaction line.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web build` OK
- `pnpm -C apps/web e2e -- e2e/ux-guardrails.spec.ts` blocked in this environment:
  - Playwright worker spawn fails with `Error: spawn EPERM`.
- `pnpm -C apps/web typecheck` currently fails in this environment with missing module resolution:
  - `Cannot find module 'pixi.js'`
  - `Cannot find module 'fflate'`

## 2026-02-14 - WO008 Match Setup progressive disclosure + setup summary

### Why
- Match setup controls in `Match.tsx` had grown into a long monolithic block that was hard to scan and harder to change safely.
- WO008 requires a setup UI that is understandable by interaction, while preserving URL-param compatibility and existing match semantics.

### What
- Added `apps/web/src/components/match/MatchSetupPanelMint.tsx` and moved setup rendering there.
- Replaced legacy in-page setup block in `apps/web/src/pages/Match.tsx` with `MatchSetupPanelMint`.
- Introduced Primary / Secondary / Advanced structure:
  - Primary: deck, ruleset, opponent selection
  - Secondary: board, first-player mode, data mode, stream toggle
  - Advanced (drawer): chain cap and first-player advanced inputs
- Added one-line setup summary and `Copy Setup Link` action.
- Kept URL update logic in `Match.tsx` (`setParam`, `setParams`, canonical first-player patch) and passed callbacks down.
- Added helper tests:
  - `apps/web/src/components/match/__tests__/MatchSetupPanelMint.test.ts`
- During integration, fixed multiple malformed string literals in `apps/web/src/pages/Match.tsx` to restore compile-safe source.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-14 - WO009 Rulesets page: recommended + summary + play CTA

### Why
- `/rulesets` listed registry entries but did not clearly guide users to a good default or direct match flow.
- WO009 requires explicit discovery rails: recommendation, summary, and one-click move to `/match`.

### What
- Rebuilt `apps/web/src/pages/Rulesets.tsx` with:
  - Recommended section (`おすすめ`) using top curated presets.
  - One-line summary surfaced for each ruleset row.
  - Direct CTA `このルールで対戦` linking to `/match?ui=mint&rk=<rulesetKey>`.
  - URL-backed filter/selection via `q` and `rk` query params.
- Added `apps/web/src/lib/ruleset_discovery.ts`:
  - `rulesetId -> rulesetKey` resolver
  - UX metadata (summary/tags/recommended)
  - match-link builder helper
- Added test `apps/web/src/lib/__tests__/ruleset_discovery.test.ts`.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-15 - WO010 follow-up: guardrail E2E hardening and green run

### Why
- Initial WO010 spec existed, but execution was unstable due runtime overlays and actionability flakiness.
- We needed the guardrail to be runnable and reliable, not just present.

### What
- Updated `apps/web/e2e/ux-guardrails.spec.ts`:
  - Added tutorial suppression via `localStorage` init script (`nytl.tutorial.seen=true`).
  - Added fallback dismiss helper for guest tutorial modal (`Got it!` / `Skip tutorial`).
  - Switched Match Setup URL-sync case to non-guest route so setup panel is guaranteed visible.
  - Hardened move commit helper:
    - force-click board cells / quick-commit button for animation-heavy state
    - fallback to explicit hand selection + exact commit selector when needed
  - Kept assertions focused on guardrail intent:
    - URL param sync (`rk`, `opp`, `ai`, `ui`)
    - Nyano reaction slot layout stability (`min-height` behavior, bounded delta, 2-line clamp)

### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (2 passed).

## 2026-02-15 - WO010 follow-up: CI operational guardrail step

### Why
- WO010 guardrail spec is stable, but needed explicit CI wiring so key UX regressions fail early.

### What
- Updated `apps/web/package.json`:
  - Added `e2e:ux` script: `playwright test e2e/ux-guardrails.spec.ts`.
- Updated `.github/workflows/ci.yml`:
  - Added `E2E UX guardrails` step before full `E2E tests`.
- Updated planning/docs alignment:
  - `codex/work_orders/010_ux_regression_guardrails.md` checklist completed.
  - `codex/execplans/007_visual_polish_and_setup_ux.md` Milestone D marked complete.
  - `docs/ux/UX_SCORECARD.md` status updated with WO010 guardrail and CI step.

### Verify
- `pnpm.cmd -C apps/web e2e:ux` (local run for script validation).

## 2026-02-15 - WO007 follow-up: visual manual checks converted to E2E guardrails

### Why
- WO007 still had manual verification points (`mobile / reduced-motion / vfx=off`) that could regress silently.
- We converted these into deterministic browser checks and attached them to the existing UX guardrail run.

### What
- Added `apps/web/e2e/mint-stage-visual-guardrails.spec.ts`:
  - `vfx=off` keeps board usable while heavy stage-atmosphere layer is hidden
  - `prefers-reduced-motion` resolves document visual tier to `data-vfx=off`
  - `390px` viewport keeps mint stage/commit flow reachable and avoids horizontal overflow
- Updated `apps/web/package.json`:
  - `e2e:ux` now runs:
    - `e2e/ux-guardrails.spec.ts`
    - `e2e/mint-stage-visual-guardrails.spec.ts`

### Verify
- `pnpm.cmd -C apps/web e2e:ux` OK (`5 passed`)

## 2026-02-15 - WO009 follow-up: Rulesets discovery flow E2E guardrails

### Why
- WO009 UI was implemented, but discovery flow regressions (`おすすめ` visibility and `/match` CTA routing) were not guarded by browser E2E.

### What
- Updated `apps/web/src/pages/Rulesets.tsx` with stable `data-testid` hooks for E2E:
  - recommended section/cards/play CTA/select
  - selected summary / list table / list play CTA
- Added `apps/web/e2e/rulesets-ux-guardrails.spec.ts`:
  - verifies recommended cards/summary/CTA are visible
  - verifies clicking CTA navigates to `/match` with `ui=mint` and preserved `rk`
- Updated `apps/web/package.json`:
  - `e2e:ux` now includes `e2e/rulesets-ux-guardrails.spec.ts`

### Verify
- `pnpm.cmd -C apps/web e2e:ux` OK (`7 passed`)

## 2026-02-15 - WO008 follow-up: Match Setup progressive-disclosure E2E guardrails

### Why
- WO008 setup redesign was implemented, but progressive-disclosure behavior and summary/URL sync still needed browser-level regression coverage.

### What
- Updated `apps/web/src/components/match/MatchSetupPanelMint.tsx` with stable test hooks:
  - `match-setup-summary-line`
  - `match-setup-first-player-mode`
  - `match-setup-advanced-toggle`
  - `match-setup-advanced-content`
  - `match-setup-chain-cap`
- Added `apps/web/e2e/match-setup-ux-guardrails.spec.ts`:
  - summary reflects URL-backed key setup choices
  - advanced section auto-opens when first-player mode becomes non-manual
  - chain-cap control keeps `ccap` in URL
- Updated `apps/web/package.json`:
  - `e2e:ux` now includes `e2e/match-setup-ux-guardrails.spec.ts`

### Verify
- `pnpm.cmd -C apps/web e2e:ux` OK (`9 passed`)

## 2026-02-21 - WO011: Motion Language v1 tokenization + showcase

### Why
- WO011 requested a reusable motion language (token + utility), broad application to primary UI surfaces, and a visible tuning page.

### What
- Added/expanded motion primitives in `apps/web/src/motions.css`:
  - `motion-press`, `motion-hover-lift`, `motion-magnet`
  - `motion-pop-in`, `motion-pop-out`, `motion-slide-in`
  - `motion-impact`, `motion-idle`, `motion-shimmer`
  - `motion-place`, `motion-flip`, `motion-modal`, `motion-backdrop`
- Unified suppression behavior for both:
  - `prefers-reduced-motion: reduce`
  - `data-vfx="off"`
- Applied motion language to key UI surfaces:
  - Buttons/cards/toasts in `apps/web/src/styles.css`
  - Board cells in `apps/web/src/components/BoardView.tsx`
  - Result modal in `apps/web/src/components/GameResultOverlay.tsx`
  - Removed hardcoded inline transition strings from:
    - `apps/web/src/components/GameResultOverlayMint.tsx`
    - `apps/web/src/components/NyanoReaction.tsx`
  - Added tokenized transition bridge selectors for mint surfaces in `apps/web/src/motions.css`
- Added showcase route/page:
  - `apps/web/src/pages/_design/Motions.tsx`
  - route `/_design/motions` in `apps/web/src/main.tsx`

### Verify
- `pnpm.cmd -C apps/web test -- motionTransitionTokenGuard NyanoReaction NyanoReactionSlot` OK
- `pnpm.cmd -C apps/web test -- cellAnimations boardLayerTokens` OK
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web typecheck` failed due pre-existing unrelated RulesetKey/type mismatch errors in match/ruleset modules (not introduced by WO011 diff)

## 2026-02-21 - WO011 follow-up: ruleset key compatibility recovery

### Why
- After WO011, `apps/web typecheck` still failed due accumulated compatibility drift:
  - `classic_custom` and legacy `classic_*` keys no longer matched `RulesetKey`
  - replay share URL options missed `rulesetKey` / `classicMask`
  - `MatchHandCardsPanel` passed `forcedIndex` to `HandDisplayMint`, but prop type was missing

### What
- Restored legacy ruleset key compatibility in `apps/web/src/lib/ruleset_registry.ts`:
  - added `LegacyRulesetKey` + `LEGACY_RULESET_KEYS`
  - added legacy config mapping (`classic_custom`, `classic_plus`, `classic_same`, `classic_reverse`, `classic_ace_killer`, `classic_type_ascend`, `classic_type_descend`)
  - kept `RULESET_KEYS` canonical for primary discovery flow
- Extended discovery metadata handling for legacy keys in `apps/web/src/lib/ruleset_discovery.ts`.
- Extended replay share URL options in `apps/web/src/lib/appUrl.ts`:
  - added `rulesetKey` / `classicMask` query support (`rk` / `cr`)
- Added missing optional prop to `apps/web/src/components/HandDisplayMint.tsx`:
  - `forcedIndex?: number | null`

### Verify
- `pnpm.cmd -C apps/web typecheck` OK
- `pnpm.cmd -C apps/web test -- ruleset_registry classic_quick_presets MintRulesetPicker matchRulesetParams matchSetupParamPatches matchShareLinks urlParams useMatchReplayActions matchReplayShare replayShareLinks replayRulesetParams` OK (`13 files / 92 tests`)
- `pnpm.cmd -C apps/web build` OK

## 2026-02-21 - Roadmap hygiene follow-up: lint:text recovery and TODO rewrite

### Why
- Roadmap execution was slowed by doc-state inconsistency:
  - `pnpm lint:text` was referenced but missing from root scripts.
  - Active TODO file had mojibake/control/PUA contamination and was no longer reliable as an execution guide.

### What
- Added root script:
  - `package.json` -> `"lint:text": "node scripts/check_text_hygiene.mjs"`
- Hardened text hygiene utility:
  - `scripts/check_text_hygiene.mjs` now accepts `--root` file paths in addition to directories.
- Cleaned failing management docs:
  - Replaced first heading in `codex/work_orders/007_board_stage_visual_polish.md` to remove replacement-char contamination.
  - Backed up and rewrote active TODO snapshot:
    - backup: `docs/99_dev/_archive/Nyano_Triad_League_DEV_TODO_v1_ja_rewrite_input_20260221.md`
    - active: `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`

### Verify
- `pnpm lint:text`

## 2026-02-21 - Match/Replay copy quality pass (Next Priority #2 start)

### Why
- Match/Replay had minor wording inconsistencies in user-facing labels (capitalization and readability), which reduced polish quality.
- We needed to improve copy quality while preserving existing E2E-sensitive labels (`Share URL`, `Replay`, `Load replay`).

### What
- Updated Match labels:
  - `Copy JSON` -> `Copy transcript JSON` (Match side panels)
- Updated Replay labels:
  - `current winner` -> `Winner`
  - `tieBreak` -> `Tie-break`
  - `playerA deck`/`playerB deck` -> `Player A deck`/`Player B deck`
  - `owners (read-only)` -> `Owners (read-only)`
  - Open-rule phrasing clarified: `slots X are revealed`
- No URL/protocol/state-shape changes.

### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- MatchGuestPostGamePanel replayUiHelpers`

## 2026-02-21 - Match/Replay copy quality pass (round 2)

### Why
- After starting Next Priority #2, several high-visibility labels in Match/Replay still had inconsistent casing/wording.
- We polished these without touching E2E-sensitive control labels.

### What
- `apps/web/src/pages/Match.tsx`
  - `Winner` / `Match ID` wording unified in result panels.
  - Classic Open helper text unified to `slots ... are revealed`.
- `apps/web/src/pages/Replay.tsx`
  - Previous round changes retained; no selector-sensitive labels changed.
- Updated roadmap note in active TODO.

### Verify
- `pnpm lint:text` OK
- `pnpm -C apps/web lint` OK (existing warnings only)
- `pnpm -C apps/web typecheck` OK

## 2026-02-21 - Match/Replay copy quality pass (round 3)

### Why
- Replay still contained mixed label styles (`rulesetId`/`matchId` lowercase) compared to Match panels.
- We aligned visible labels for a single, share-friendly tone.

### What
- `apps/web/src/pages/Replay.tsx`
  - `winner:` -> `Winner:`
  - `auto (rulesetId registry/official)` -> `auto (Ruleset ID registry/official)`
  - `Copy matchId` / toast label -> `Copy Match ID` / `Match ID`
  - `rulesetId` -> `Ruleset ID`
  - `classic swap/open` -> `Classic swap/open`
  - `matchId` -> `Match ID`

### Verify
- `pnpm lint:text`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`

## 2026-02-21 - ExecPlan 014 readability recovery

### Why
- `codex/execplans/014_uiux_polish_qa_shareworthy_v8.md` had severe encoding noise and was hard to use as an active execution tracker.

### What
- Rewrote ExecPlan 014 into a clean, readable living-document format.
- Preserved practical status: WO-044/045/046 complete, text-hygiene/copy-pass follow-ups tracked.
- Added explicit verification and next-action sections.

### Verify
- Open/read `codex/execplans/014_uiux_polish_qa_shareworthy_v8.md`

## 2026-02-21 - Next Priority #1: text hygiene guardrail in CI/release flow

### Why
- `pnpm lint:text` was restored locally, but CI and release-check flow did not enforce it yet.
- To keep text hygiene green continuously, the same guardrail must run in automation.

### What
- `/.github/workflows/ci.yml`
  - Added `Text hygiene guardrail` step to the `web` job: `pnpm lint:text`.
- `/package.json`
  - Updated `release:check` to run `pnpm lint:text` first.
- Updated active TODO to record completion.

### Verify
- `pnpm lint:text`

## 2026-02-21 - Match/Replay copy quality pass (round 4)

### Why
- Replay label output still had one remaining low-visibility inconsistency in `ruleset registry` wording.

### What
- `apps/web/src/pages/Replay.tsx`
  - `rulesetId registry (...)` -> `Ruleset ID registry (...)`
  - applied for v1/v2/classic variants from `rulesetLabelFromRegistryConfig`.

### Verify
- `pnpm lint:text`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test -- replayUiHelpers`

## 2026-02-21 - ExecPlan 014 sync update

### Why
- After CI/release integration of `lint:text`, ExecPlan 014 needed status synchronization.

### What
- Updated `codex/execplans/014_uiux_polish_qa_shareworthy_v8.md`:
  - marked CI/release integration of `lint:text` as complete.
  - refreshed outcome wording to reflect current guardrail enforcement.

### Verify
- Open/read `codex/execplans/014_uiux_polish_qa_shareworthy_v8.md`

## 2026-02-21 - Match/Replay copy quality pass (round 5)

### Why
- A small set of user-facing labels still used mixed technical casing (`matchId` / `rulesetId`) in Match-side summary surfaces and Replay helper labeling.
- We finalized these without touching URL params, protocol payload keys, or selector-sensitive controls.

### What
- `apps/web/src/features/match/MatchResultSummaryPanel.tsx`
  - `matchId:` -> `Match ID:`
- `apps/web/src/features/match/MatchMintResultSummaryPanel.tsx`
  - `matchId:` -> `Match ID:`
- `apps/web/src/components/match/MatchSetupPanelMint.tsx`
  - `rulesetId unchanged` -> `Ruleset ID unchanged`
  - `rulesetId:` -> `Ruleset ID:`
- `apps/web/src/features/match/replayRulesetLabel.ts`
  - `rulesetId由来` -> `Ruleset ID由来` (v1/v2/classic variants)
- Updated associated tests:
  - `apps/web/src/features/match/__tests__/MatchResultSummaryPanel.test.tsx`
  - `apps/web/src/features/match/__tests__/MatchMintResultSummaryPanel.test.tsx`
  - `apps/web/src/features/match/__tests__/replayRulesetLabel.test.ts`

### Verify
- `pnpm lint:text` OK
- `pnpm -C apps/web test -- MatchResultSummaryPanel MatchMintResultSummaryPanel replayRulesetLabel MatchSetupPanelMint replaySimulationState` OK
- `pnpm -C apps/web lint` OK (existing warnings only in `MatchSetupPanelMint.tsx`)
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-21 - Match/Replay copy quality pass (round 6)

### Why
- Replay の fallback mismatch 警告に `rulesetId` の技術語表記が残っており、他の UI 表記 (`Ruleset ID`) とトーンが揃っていなかった。

### What
- `apps/web/src/features/match/replayRulesetContext.ts`
  - `REPLAY_RULESET_ID_MISMATCH_WARNING` の文言を更新:
    - `transcript rulesetId` -> `transcript Ruleset ID`
- 既存の判定ロジック/URL パラメータ/プロトコルキーは変更なし（表示文言のみ）。

### Verify
- `pnpm lint:text` OK
- `pnpm -C apps/web test -- replayRulesetContext replayLoadAction replaySimulationState replayResultSelection` OK
- `pnpm -C apps/web lint` OK (existing warnings only in `MatchSetupPanelMint.tsx`)

## 2026-02-21 - Match/Replay copy quality pass (round 7)

### Why
- Replay summary panel still used `Classic swap` / `Classic open` while Match terminology had already been normalized.
- Capitalization consistency helps share-ready polish and quick visual scanning.

### What
- `apps/web/src/pages/Replay.tsx`
  - `Classic swap` -> `Classic Swap`
  - `Classic open` -> `Classic Open`
- No selector-sensitive labels changed.
- No URL/protocol/state key changes.

### Verify
- `pnpm lint:text` OK
- `pnpm -C apps/web test --` OK (`222 files / 1764 tests`)
- `pnpm -C apps/web lint` OK (existing warnings only in `MatchSetupPanelMint.tsx`)
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-21 - Next Priority #1 follow-up: text hygiene in local lint flow

### Why
- `lint:text` は CI と `release:check` で有効化済みだったが、日常の `pnpm lint` 実行では自動的に走らなかった。
- ローカル段階での早期検知を強化し、文字衛生の再発をさらに防ぐため。

### What
- `package.json`
  - root `lint` script を更新:
    - `pnpm -C apps/web lint`
    - -> `pnpm lint:text && pnpm -C apps/web lint`

### Verify
- `pnpm lint` OK（`lint:text` 実行後に web lint が継続実行されることを確認）

## 2026-02-21 - Lint quality follow-up: Match setup helpers split for Fast Refresh rule

### Why
- `apps/web lint` had persistent `react-refresh/only-export-components` warnings in `MatchSetupPanelMint.tsx`.
- The file exported non-component helper functions for testing convenience, which reduced lint signal quality.

### What
- Added `apps/web/src/components/match/MatchSetupPanelMint.summary.ts`:
  - moved `describeRulesetKey`
  - moved `describeFirstPlayerMode`
  - moved `buildMatchSetupSummaryLine`
  - moved `shouldOpenAdvancedSetup`
- Updated `apps/web/src/components/match/MatchSetupPanelMint.tsx`:
  - removed helper exports
  - imported helpers from `MatchSetupPanelMint.summary.ts`
- Updated `apps/web/src/components/match/__tests__/MatchSetupPanelMint.test.ts`:
  - import source switched from `MatchSetupPanelMint` to `MatchSetupPanelMint.summary`

### Verify
- `pnpm lint` OK (warning-free)
- `pnpm -C apps/web test -- MatchSetupPanelMint MintRulesetPicker` OK
- `pnpm -C apps/web typecheck` OK

## 2026-05-01 - Vercel production deploy recovery

### Why
- Production Vercel deployments were completing without running the monorepo Vite build, leaving the public app URL serving an empty 404-like deployment.
- The root `vercel.json` only defined SPA rewrites and did not tell Vercel where the web app build output lives.

### What
- Updated root `vercel.json` to install with `pnpm install --frozen-lockfile`, build with `pnpm build:web`, and serve `apps/web/dist`.
- Kept the existing SPA rewrite to preserve deep links such as `/match`, `/replay`, and `/battle-stage`.
- Added `.vercel` to `.gitignore` so local project linkage and pulled env files are not committed.

### Verify
- `pnpm test` OK
- `pnpm release:check` OK
- `vercel build --prod` OK
- Production alias verified at `https://v0-nyano-triad-league.vercel.app`

## 2026-05-01 - Mint theme app shell enablement

### Why
- Production was serving the older app chrome even though Mint theme assets and components existed in the repo.
- The Mint app shell CSS was not loaded globally by the top-level app layout, so the default `theme=mint` setting did not change the site chrome/home surface.

### What
- Updated `apps/web/src/App.tsx` to resolve the app theme through `resolveAppTheme`, load `@/mint-theme/mint-theme.css`, and render `MintGameShell` / `MintAppChrome` for non-focus Mint routes.
- Updated `apps/web/src/lib/theme.ts` to sanitize allowed themes and migrate legacy stored `classic` theme values back to `mint`.
- Brought the current Mint CSS/home surface forward so the production bundle includes the Mint shell and home classes.

### Verify
- `pnpm -C apps/web typecheck` OK
- `pnpm build:web` OK
- `pnpm -C apps/web e2e:ux -- --reporter=line` OK
- Built bundle contains `mint-app-footer`, `mint-app-main`, `mint-app-shell`, and `mint-home`.

## 2026-05-01 - Mint home visual gamefeel and player copy pass

### Why
- Mint theme was enabled, but the home screen still read like a navigation/admin surface instead of a game lobby.
- The first viewport needed a visible board fantasy, a clearer play action, and friendlier player-facing Japanese copy.

### What
- Updated `apps/web/src/pages/Home.tsx`:
  - Added a Mint lobby hero with primary battle action, 3x3 board preview, and compact play highlights.
  - Reworded menu, difficulty, quick-play, onboarding, and info-bar copy around player actions.
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - Added the hero/battle-card/board-preview styling and responsive mobile constraints.
  - Tuned the quick-play panel to feel like a match card while preserving existing routes.
- Updated `apps/web/src/App.tsx`:
  - Renamed Mint shell labels from tool-like wording to player-facing lobby/footer wording.

### Verify
- `pnpm lint:text` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
- `pnpm -C apps/web lint` OK
- `pnpm release:check` OK
- Playwright local preview smoke at 1280px and 390px OK:
  - Mint theme active.
  - Battle CTA and 3x3 board preview visible.
  - No horizontal overflow (`scrollWidth === clientWidth`).

## 2026-05-01 - Mint Arena/Events/Stream game-page pass with Mini Nyano

### Why
- Arena, Events, and Stream still read like utility/admin screens after the Mint shell and home pass.
- The provided Mini Nyano character should appear in mascot/thumb slots so the secondary routes feel like player-facing game facilities.

### What
- Added `apps/web/public/nyano/mini-nyano.png` and exported `NYANO_MINI_IMAGE_URL`.
- Rebuilt Arena as an arena-gate surface with Nyano AI, difficulty cards, a 3x3 mini board, and player-facing Japanese CTAs.
- Added Events and Stream hero surfaces, Mini Nyano mascot art, page guides, status chips, and friendlier copy while preserving existing routes, event attempt data, overlay links, and stream controls.
- Added shared Mint game-page CSS with responsive width guards to prevent long stream URLs from causing horizontal overflow.

### Verify
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
- Playwright MCP local preview smoke at 1280px and 390px OK:
  - `/arena?theme=mint`, `/events?theme=mint`, `/stream?theme=mint`
  - Hero, guide, and Mini Nyano image present.
  - No horizontal overflow (`scrollWidth === clientWidth`).

## 2026-05-01 - Events/Replay Japanese copy cleanup

### Why
- Events and Replay still had English labels in visible controls, toasts, and helper text.
- The Mint theme needs readable player-facing Japanese across secondary game pages.

### What
- Localized Events season summaries, challenge history, settled-point import labels, and event metadata.
- Localized Replay setup, playback controls, event replay panel, sharing/saving actions, result details, timeline highlights, streamer overlay tools, and deck inspector text.
- Localized replay timeline/highlight helpers and Mint page guides used by Events/Replay.
- Localized replay share-link errors and season reward tier labels shown on Events.

### Verify
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web build` OK
- `pnpm lint:text` OK
- Playwright local preview DOM smoke OK:
  - `/events?theme=mint`
  - `/replay?theme=mint`

## 2026-05-01 - Nyano favicon asset refresh

### Why
- The browser/tab icon should match the current Mini Nyano character branding instead of the older generic favicon.
- Small favicon sizes need a face-focused crop so the character remains recognizable at 16px/32px.

### What
- Regenerated `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `favicon-192.png`, `favicon-512.webp`, and `apple-touch-icon.png` from `apps/web/public/nyano/mini-nyano.png`.
- Used a rounded Mint background, blue rim, and head-focused crop to keep Nyano readable in browser tabs and mobile home-screen contexts.
- Added the 512px WebP favicon link to `apps/web/index.html`.

### Verify
- Generated asset dimension check OK:
  - `favicon.ico`: 16/32/48/64
  - `favicon-16.png`, `favicon-32.png`, `favicon-192.png`, `favicon-512.webp`, `apple-touch-icon.png`
- `pnpm -C apps/web build` OK
- `pnpm lint:text` OK

## 2026-05-01 - Mint board gamefeel polish

### Why
- The Mint battle board was visually soft but still needed clearer player feedback and a stronger game-like progression layer.
- Pixi focus mode had large white stage space that felt more like an empty app panel than an arena.

### What
- Added a Mint round track above the board with 1/9 progress pips, active player chip, and Japanese phase label.
- Reworded board prompts and engine prompts into clear player-facing Japanese while preserving existing English assist text.
- Replaced selectable empty-cell markers with a pill-style "置く" / "警戒" affordance so available cells read as actionable.
- Added active-player board rim treatments and a subtle arena-floor layer for engine focus mode.
- Added a focused `BoardViewMint` unit test for the new round track and placement prompt.

### Verify
- `pnpm -C apps/web test -- src/components/__tests__/BoardViewMint.test.tsx src/components/__tests__/DuelStageMint.test.tsx` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
- `pnpm lint:text` OK
- `pnpm -C apps/web e2e mint-stage-visual-guardrails.spec.ts --project=chromium` OK
- Playwright local screenshot smoke OK:
  - `/match?mode=guest&opp=pvp&auto=0&rk=v2&ui=mint&fpm=manual&fp=0`
  - `/match?mode=guest&opp=pvp&auto=0&rk=v2&ui=engine&focus=1&fpm=manual&fp=0`
  - 390px Mint match viewport horizontal overflow: 0px

## 2026-05-01 - Battle hand-to-board UX pass

### Why
- In the normal Mint battle flow, the hand lived below the board, so players had to scroll away from the board to choose a card and confirm the move.
- On wide screens the Mint stage could grow too large, making the playable board harder to scan and pushing controls out of view.

### What
- Added a battle command hand dock that appears while the board is near the viewport, rendered through a body portal so it stays anchored on mobile and desktop.
- Reused the existing game-like focus hand rail for normal Mint battles, with compact cards, Japanese command copy, warning selection, commit, and undo in one panel.
- Hid the old full-width hand panel when the command dock is active and collapsed the guest deck preview by default.
- Capped the normal Mint battle stage width so the board reads as a game board instead of a huge page panel on desktop.

### Verify
- In-app browser smoke OK at 390px: board visible, hand dock fixed at bottom, card -> cell -> commit advanced to turn 1/9, horizontal overflow 0px.
- In-app browser smoke OK at desktop width: board capped at 720px and command dock is fixed to the viewport from `document.body`, horizontal overflow 0px.

## 2026-05-01 - Match operation readability polish

### Why
- The Match play surface still felt hard to operate because card/cell/warning selections were split across dense, app-like controls.
- Focus mode and the normal hand controls still had visible English labels, making the in-battle flow harder for Japanese players to read quickly.

### What
- Reworked Match command copy around the hand dock, quick commit bar, warning mark selector, focus toolbar, Pixi fallback notice, and AI turn notice into player-facing Japanese.
- Added A1/B1/C1-style cell labels and card selection summaries so the current move reads as a battle command instead of raw cell/card indexes.
- Wrapped the normal Mint hand controls in a game-like operation panel, tightened the Mint board width, and made used/selected hand-card states clearer.
- Removed the remaining English helper text from the Mint board action prompt and fixed the closed details drawer so it no longer creates horizontal scroll.
- Updated the shared `MatchQuickCommitBar` component so future usage matches the same Japanese command language.

### Verify
- `pnpm -C apps/web test -- src/features/match/__tests__/MatchQuickCommitBar.test.tsx` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
- `pnpm lint:text` OK

## 2026-05-01 - Mint game-site visual polish

### Why
- The Mint site already had a soft cute direction, but buttons, frames, tabs, and secondary panels still needed stronger game-site affordance.
- Nyano character presence was visible on some pages, but the global shell and navigation mark needed a more recognizable mascot cue.

### What
- Added a generated UI cameo asset (`apps/web/public/assets/gen/nyano_ui_cameo_512_v1.webp`) derived from the existing Mini Nyano public asset, with a Mint frame for favicon-like UI use.
- Replaced the Mint chrome mark with the cameo and added a low-opacity mascot watermark to the app shell and key panels.
- Upgraded Mint buttons, cards, tabs, guide panels, quick navigation cards, arena difficulty cards, and home battle panels with beveled rims, inner highlights, pressed states, and subtle game-board decoration.
- Localized the first Match tutorial modal into Japanese and gave it a Mint game-panel frame.
- Tuned mobile hero heading size so event-style Japanese headings do not wrap awkwardly.

### Verify
- `pnpm -C apps/web typecheck` OK
- `pnpm lint:text` OK
- `pnpm -C apps/web build` OK
- Playwright local screenshot smoke OK:
  - `/`, `/arena`, `/events`, `/replay`, `/stream`, `/match`
  - 1440px and 390px viewports
  - horizontal overflow: 0px on checked pages

## 2026-05-01 - Nyano image presentation refinement

### Why
- The home battle preview used a large translucent Nyano cameo over the board, which reduced board clarity and made the visual feel less polished.
- Character art should support the game UI without covering the playfield or competing with the card grid.

### What
- Removed the global large mascot watermark and the home battle-card image overlay.
- Generated a local `nyano_battle_token_256_v1.webp` UI token from the existing Mini Nyano asset, using a Mint rim and transparent WebP output instead of a live image API call.
- Moved Nyano presence into a compact opponent token in the battle card header, leaving the 3x3 board unobstructed.
- Replaced the page guide cameo watermark with an abstract Mint ring decoration so text panels stay clean.

### Verify
- `pnpm -C apps/web typecheck` OK
- `pnpm lint:text` OK
- `pnpm -C apps/web lint` OK
- `pnpm -C apps/web build` OK
- `pnpm -C apps/web e2e:ux` OK
- Playwright local battle-card screenshot smoke OK, horizontal overflow: 0px

## 2026-05-01 - Battle copy Japanese localization pass

### Why
- The post-entry Match screen still had English player-facing copy in the hero, guest-mode banner, first tutorial modal, deck preview labels, and battle action controls.
- The local dev server could keep an old module graph, so the visible tutorial needed a clean Japanese source and a server restart for verification.

### What
- Replaced the first Match tutorial modal text with Japanese battle instructions.
- Localized Match hero copy, feature chips, guest quick play banner, deck preview headings, open-rule helper text, setup panel labels, turn labels, and commit/undo/action labels.
- Updated focused component and E2E expectations to use the new Japanese labels.

### Verify
- `pnpm -C apps/web test -- src/components/__tests__/BattleTopHudMint.test.tsx src/components/match/__tests__/MatchSetupPanelMint.test.ts src/features/match/__tests__/MatchGuestModeIntro.test.tsx src/features/match/__tests__/MatchTurnActionPanel.test.tsx src/features/match/__tests__/matchStageActionCallbacks.test.ts src/features/match/__tests__/useMatchStageActionCallbacks.test.ts` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm lint:text` OK
- `pnpm -C apps/web lint` OK
- `pnpm -C apps/web build` OK
- `pnpm -C apps/web e2e:ux` OK
- Local Playwright smoke OK on `/match?mode=guest&opp=pvp&auto=0&rk=v2&ui=mint&theme=mint`; tutorial rendered Japanese and horizontal overflow stayed 0px.
