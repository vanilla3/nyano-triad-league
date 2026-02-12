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
