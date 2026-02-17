# 実裁E��グ

> 1コミッチE1まとまりで追記する！Ehy/What/Verify�E�、E
## 2026-02-13  EWO005-B follow-up: responsive stage secondary controls

### Why
- Stage focus中にウィンドウ幁E��変わった場合、補助コントロール表示が�E期値のままで、狭幁E��惁E��過夁E庁E��E��操作導線不足になることがあった、E- Stageの、E画面導線」を維持するため、表示閾値の共通化と resize追従が忁E��だった、E
### What
- `apps/web/src/lib/stage_layout.ts`
  - `shouldShowStageSecondaryControls` を追加し、補助コントロール表示のブレークポイント判定を共通化、E- `apps/web/src/lib/__tests__/stage_layout.test.ts`
  - 補助コントロール表示判定！E90/768/769/NaN�E�を検証、E- `apps/web/src/pages/Match.tsx`
  - Stage controls の初期表示/再計算を共通判定に刁E��、E  - resize時�E自動追従を追加�E�手動トグル後�E manual override でユーザー設定を優先）、E- `apps/web/src/pages/Replay.tsx`
  - Stage transport controls に同等�E resize追征E+ manual override を追加、E- `apps/web/e2e/stage-focus.spec.ts`
  - mobile `replay-stage` で controls が�E期非表示であること、E  - `Show controls` で復帰できることを追加検証、E  - 375px 幁E`battle-stage` で Commit ボタンぁEviewport 冁E��収まることを検証、E  - 375px 幁E��横方向オーバ�Eフローが発生しなぁE��とを検証、E  - game index / RPC 失敗時でめE`replay-stage` の `Load replay` / `Retry load` / `Clear share params` が表示され、リカバリ導線が維持されることを検証、E- `apps/web/src/lib/ai/turn_timing.ts`
  - AI自動打ちの征E��時間を再調整�E�Ease/turn-step/difficulty/jitter を引き上げ�E�、E  - 「早すぎて機械皁E��に見えるテンポを抑え、思老E���Eの体感を改喁E��E- `apps/web/src/lib/ai/__tests__/turn_timing.test.ts`
  - baseline と upper bound の期征E��を更新し、調整後�E決定論を検証、E- `apps/web/src/components/NyanoReaction.tsx`
  - `reduced-motion` と `data-vfx`�E�Eff/low/medium/high�E�に応じて cut-in timing を�E替、E  - `vfx=off` / reduced-motion 時�E burst 無効 + 表示時間短縮で負荷と過演�Eを抑制、E  - `vfx=low` 時�E impact を抑えつつ burst を無効化、E- `apps/web/src/components/__tests__/NyanoReaction.timing.test.ts`
  - reduced-motion / vfx off / vfx low / vfx high の timing 刁E��を検証、E- `apps/web/src/lib/demo_decks.ts`
  - `buildEmergencyGuestFallbackData` を追加し、index非依存で guest 5v5 を生成可能化、E- `apps/web/src/pages/Match.tsx`
  - Game Index 読込失敗時、guest mode では緊急フォールバックを適用して対戦継続、E  - `error/status` と toast でフォールバック状態を明示、E- `apps/web/src/lib/__tests__/demo_decks.test.ts`
  - 緊急フォールバックチE��キの構�E�E�Ev5/10极Emap�E�を検証、E- `apps/web/e2e/stage-focus.spec.ts`
  - battle-stage guest で index 読込失敗時にフォールバックで継続できることを検証、E
### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
- `pnpm -C apps/web test -- src/lib/ai/__tests__/turn_timing.test.ts`
- `pnpm -C apps/web test -- src/components/__tests__/NyanoReaction.timing.test.ts`
- `pnpm -C apps/web test -- src/lib/__tests__/demo_decks.test.ts`

## 2026-02-13  EWO005-A follow-up: Stage route canonicalization + smoke coverage

### Why
- `/battle-stage` `/replay-stage` のクエリ正規化ロジチE��が�Eージごとに重褁E��ており、回帰時に差刁E��見落としやすかった、E- Stage専用ルート�EスモークぁEE2E で未カバ�Eだったため、URL互換と起動安定性を�E動で拁E��する忁E��があった、E
### What
- `apps/web/src/lib/stage_focus_params.ts` を追加:
  - `ui=engine` 強制、`focus=1` 正規化、legacy `layout` の除去を�E通化、E- `apps/web/src/pages/BattleStage.tsx` / `apps/web/src/pages/ReplayStage.tsx`:
  - 重褁E��てぁE�� `useEffect` 冁E�Eクエリ補正処琁E�� `normalizeStageFocusParams` に統一、E- `apps/web/src/lib/__tests__/stage_focus_params.test.ts` を追加:
  - 欠損補完、legacy `layout=focus` 吸収、`focus=focus` 正規化、no-op ケースを検証、E- `apps/web/e2e/stage-focus.spec.ts` を追加:
  - `/battle-stage` `/replay-stage` のURL正規化と、主要UI�E�Eand Dock / replay focus guard�E�表示を確認、E
### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13  EWO005-A: Stage UI/UX foundation (viewport fit + hierarchy)

### Why
- `/battle-stage` と `/replay-stage` の Pixi 盤面サイズが固定寁E��で、PC環墁E��よっては主要操作導線が縦方向に伸びめE��かった、E- AGENTS/Work Order更新に合わせ、Stage-firstで UI/UX 基盤�E�情報階層 + 1画面導線）を先に安定化する忁E��があった、E
### What
- `codex/execplans/005_uiux_foundation.md` を新規作�Eし、Milestone A の実裁E��画を文書化、E- `apps/web/src/lib/stage_layout.ts` を追加:
  - viewport と stage種別�E�Eattle/replay�E�かめE`maxWidthPx` / `minHeightPx` を算�E、E- `apps/web/src/lib/__tests__/stage_layout.test.ts` を追加:
  - desktop/mobile/invalid入力�E墁E��を検証、E- `apps/web/src/pages/Match.tsx`:
  - battle-stage で viewport追従サイズを使用、E  - stage専用レイアウトクラス�E�Eoot/toolbar/arena/board/cutin/dock�E�を適用、E  - stage routeでは desktop quick-commit 重褁E��示を抑止、E- `apps/web/src/pages/Replay.tsx`:
  - replay-stage で viewport追従サイズを使用、E  - stage専用レイアウトクラス�E�Eoot/toolbar/cutin/arena-inner�E�を適用、E- `apps/web/src/styles.css`:
  - stage shell/panel のト�Eクン変数を追加、E- `apps/web/src/mint-theme/mint-theme.css`:
  - `stage-focus-*` と `mint-focus-hand-dock--stage` スタイルを追加し、視線誘導と下部操作導線を強化、E
### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- smoke.spec.ts`


## 2026-02-01  Ecommit-0002

### Why
- 初期ZIPの構�E上、`nyano-triad-league-starter/` が同梱されており、ワークスペ�Eスの中忁E��曖昧だった、E- 公式戦�E�検証可能�E�に忁E��な **matchIdの定義** を、JSON等�E揺れる形式ではなぁESolidity 互換の固定エンコードに寁E��たかった、E- Design v2.0 の Layer2�E�EACTICS�E��E核である **警戒�Eーク** は、早期に入れることでゲームの“読み合い”が立ち上がる、E
### What
- `packages/triad-engine` を正規位置へ移設し、starter同梱を解消、E- Transcript v1 の matchId めE`keccak256(abi.encode(...))` 相当�E **固定ABIエンコーチE* に変更�E�ES参�E実裁E��、E- Layer2�E�警戒�Eークを実裁E��最大3回！Eターン有効�E�踏んだカードTriad-1�E�、E- ゴールチE��チE��ト追加�E�警戒�Eークの有無で中忁E��フリチE�Eする/しなぁE��、E- `TRANSCRIPT_SPEC` に固定ABIエンコードを明記、E- CI�E�lockfile未コミット段階を想定し `--frozen-lockfile` を一時解除、E
### Verify
- `pnpm -C packages/triad-engine test`
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` と `docs/02_protocol/Nyano_Triad_League_TRANSCRIPT_SPEC_v1_ja.md` の更新確誁E

## 2026-02-01  Ecommit-0003

### Why
- Design v2.0 の Layer2�E�EACTICS�E��Eもう一つの柱である **コンボ�Eーナス** を早期に入れ、E��鎖（コンボ）を「狙ぁE��由」を作りたかった、E- 公式戦�E�検証可能�E�では、同じトランスクリプトから **同じ派生効果（次ターンバフ�E�E* が�E現できる忁E��があるため、コンボ数の定義を仕様として固定したかった、E- 「運営がいなくても盛り上がる」方向に向け、ERC-6551�E�EBA�E�とスチE�EキングめE**プロトコル部品E* としてどぁE��ぁE��を並行して整琁E��ておきたかった、E
### What
- TSエンジンに **コンボ�Eーナス** を実裁E��E  - `comboCount = 1�E��E置�E�E+ flipCount�E�このターンでひっくり返した枚数�E�`
  - 3: Momentum�E�次の自刁E�EカーチE全辺+1�E�E  - 4: Domination�E�次の自刁E�EカーチE全辺+2�E�E  - 5+: Nyano Fever�E�次の自刁E�Eカードが警戒�Eークを無効化！E- 参�E実裁E�E出力に `turns: TurnSummary[]` を追加し、UI/解析が “運営なし Eでも作りめE��ぁE��にした、E- ゴールチE��チE��ト追加�E�Momentum が次ターンのカードに +1 として反映されるケース、E- `RULESET_CONFIG_SPEC` と `TRANSCRIPT_SPEC` に、コンボ数の定義と派生値の扱ぁE��追記、E- 自律化検討として `ERC6551_and_Staking_Notes_v1_ja.md` を追加�E�EBA/スチE�Eキングの使ぁE��と段階導�E案）、E
### Verify
- `pnpm -C packages/triad-engine test`
- 仕様更新�E�`docs/02_protocol/*` と `docs/99_dev/*` の差刁E��誁E

## 2026-02-01  Ecommit-0004

### Why
- Layer2�E�警戒�Eーク/コンボ�Eーナス/後攻補正�E��E「シーズンめE��ールセチE��」で ON/OFF を�Eり替えられる忁E��がある�E�運営が消えてもコミュニティが環墁E��作れるためE��、E- 設計ドキュメンチEv2.0 にある「�E攻・後攻バランス�E�後攻初手+1 もしく�E後攻警戁E1回）」を、エンジン側で安�Eに選択できる形にしたかった、E- 警戒�Eークの Triad 下限�E�E or 1�E�が曖昧だと、墁E��ケースの結果がズレて後から地獁E��なるため、v1の決定を固定したかった、E
### What
- `RulesetConfigV1`�E�Engine-side subset�E�を導�Eし、`simulateMatchV1(..., ruleset)` でルールを指定可能にした�E�未持E���E `DEFAULT_RULESET_CONFIG_V1`�E�、E- 警戒�Eーク�E�E  - rulesetで `enabled` を�Eり替え可能�E�無効時�E transcript フィールドを無視）、E  - 使用回数めE`maxUsesPerPlayer` に明確化し、後攻に `secondPlayerExtraUses` を付与可能にした、E  - Triad下限は **0�E�E..10にクランプ！E* めEv1の決定として types/spec に明記、E- コンボ�Eーナス�E�E  - rulesetで `enabled` を�Eり替え可能にし、E��値/効果量も設定で変更できるようにした�E�E2チE��ォルト�E維持E��、E- 後攻補正�E�E  - rulesetで `secondPlayerBalance.firstMoveTriadPlus` を指定すると、後攻の初手に全辺+Xを付与できる、E- チE��ト追加�E�E  - 後攻初手+1 の有無でフリチE�E結果が変わるケース、E  - 後攻だけ警戒�Eーク +1 回を許可するケース�E�E回目でthrowしなぁE��、E
### Verify
- `pnpm -C packages/triad-engine test`
- ドキュメント更新�E�`docs/02_protocol/Nyano_Triad_League_RULESET_CONFIG_SPEC_v1_ja.md` / `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` の差刁E��誁E
---

## Commit0005  ELayer3�E�Eynergy / Trait効极Ev1�E�E
- 実裁E��`packages/triad-engine` に TraitEffectsConfig を追加し、v1のTrait効果を決定論で実裁E��E- 追加/更新した仕様！E  - `docs/02_protocol/Nyano_Triad_League_RULESET_CONFIG_SPEC_v1_ja.md`�E�ES shape に合わせて具体化�E�E  - `docs/02_protocol/Nyano_Triad_League_TRANSCRIPT_SPEC_v1_ja.md`�E�Earth選択�E忁E��条件を�E確化！E  - `docs/02_protocol/Nyano_Triad_League_TRAIT_EFFECTS_SPEC_v1_ja.md`�E�新規：Traitの厳寁E��様！E
### 実裁E��たTrait�E�E1�E�E- Cosmic�E�角�E置 allTriad +1
- Light�E�隣接味方 allTriad +1�E�非スタチE��既定！E- Shadow�E�警戒�Eーク debuff 無効化（消費はする�E�E- Forest�E�最初�EフリチE�E試行を1回無効化！Ehield�E�E- Metal�E�連鎖攻撁E��はフリチE�E不可
- Flame�E�Triad同値時、じめE��けんで常に勝つ�E�相手がFlameでなぁE��合！E- Aqua�E�斜めE方向にも攻撁E��斜め強度は `min(edgeA, edgeB)` 既定！E- Thunder�E�隣接敵カード�E全辺 -1�E�永続、capture前に適用�E�E- Wind�E��E攻/後攻選択！EranscriptのfirstPlayerで表現�E�E- Earth�E�辺選抁E+2 / 対辺 -1�E�EearthBoostEdge`、requireChoice既宁Etrue�E�E
### ゴールチE��チE��ト追加
- Shadow が警戒�Eークを無視するケース
- Forest shield ぁE回だけフリチE�Eを無効化するケース
- Earth の選択で結果が変わるケース
- Thunder の永続デバフ
- Light の隣接バフで結果が変わるケース

### 次の焦点
- Nyano Peace のオンチェーン属性 ↁETraitType 導�Eの暫定ルール�E�ESON公開＋議論可能な形�E�E- Formation bonuses�E�Eayer3拡張�E�E

## 2026-02-02  Ecommit-0006

### Why
- Layer3�E�Erait効果）を実裁E��た時点で、次のボトルネックは「Nyano Peace のオンチェーン Trait�E�ElassId/seasonId/rarity�E�を、ゲーム冁ETraitType�E�E0種�E�へどぁE��とすか」だった、E- 導�E規則が曖昧なままだと、インチE��サやUIごとに解釈が割れて **replay / 公式戦オンチェーン決済が破綻**する、E- さらに、class/season/rarity がオンチェーンで公開されてぁE��以上、それをゲーム性�E�環墁E��訁EチE��キ予算など�E�に接続できる「拡張点」として、ルールセチE��に含めておきたかった、E
### What
- `RulesetConfigV1.synergy.traitDerivation`�E�EyanoTraitDerivationConfigV1�E�を追加、E- TS参�E実裁E�� Nyano用ヘルパを追加�E�Epackages/triad-engine/src/nyano.ts`�E�！E  - `DEFAULT_NYANO_TRAIT_DERIVATION_CONFIG_V1`
  - `deriveTraitTypeFromNyanoTraitV1(...)`
  - `makeCardDataFromNyano(...)`�E�En-chain read ↁECardData の絁E��立て�E�E- チE��ォルトルールセチE��に `traitDerivation` を同梱�E�ルールの“標準解釈”を固定）、E- 仕様追加�E�`Nyano_Triad_League_TRAIT_DERIVATION_SPEC_v1_ja.md`
- 既存仕様更新�E�ruleset/transcript/trait-effects が導�Eルールを参照するように追記、E- チE��ト追加�E�rarityごとの導�E刁E��と `makeCardDataFromNyano` の絁E��立てをゴールチE��化、E
### Verify
- `pnpm -C packages/triad-engine test`
- `pnpm -C packages/triad-engine build`
- `docs/02_protocol/*` / `docs/99_dev/*` の差刁E��誁E
## 2026-02-02  Ecommit-0007

### Why
- Design v2.0 の「フォーメーションボ�Eナス�E�E.3.3�E�」�E、デチE��構築を“強カード�E寁E��雁E��”から脱却させる中核なので、早めに参�E実裁E��落としたかった、E- まぁESeason 3 の例（五行調和�Eーナス3倁E/ Light+Shadow=日食）にあるように、シーズン環墁E��Eayer4�E�が **倍率・追加効极E* として上書きできる土台が忁E��だった、E- “運営がいなくても盛り上がる”には、第三老E��リプレイめE��墁E�E析を作れるよぁE��どのformationが有効だったかを結果に含めておくのが重要、E
### What
- `RulesetConfigV1.synergy.formationBonuses` を追加�E�Eata-driven�E�、E- v1の最小セチE��として、Eつのformationを実裁E��E  - **五行調和！Eive Elements Harmony�E�E*�E�E    - 条件�E�Flame/Aqua/Earth/Wind/Thunder がデチE��に揁E��
    - 効果：comboBonus�E�Eomentum/Domination�E��E triadPlus めE`comboBonusScale` 倁E  - **日食！Eclipse�E�E*�E�E    - 条件�E�Light と Shadow がデチE��に揁E��
    - 効果！EulesetでON/OFF可能�E�！E      - Lightが警戒�Eークの -1 を無効匁E      - ShadowめELight光源として扱ぁE��Light aura を発生させる
- `MatchResult.formations` を追加し、UI/解析が “運営なし Eでも作りめE��ぁE��にした、E- 仕様追加�E�E  - `Nyano_Triad_League_FORMATION_BONUS_SPEC_v1_ja.md`
- 既存仕様追従！E  - ruleset spec / transcript spec めEformation 仕様に追従させた、E- チE��ト追加�E�E  - 五行調和による comboBonus 倍率適用が次ターンに反映されること
  - 日食により Light が警戒�Eークを踏んでめEtriad が下がらなぁE��と

### Verify
- `pnpm -C packages/triad-engine test`
- `pnpm -C packages/triad-engine build`
- 仕様差刁E��`docs/02_protocol/*` / `docs/99_dev/*` の更新確誁E
## 2026-02-02  Ecommit-0008

### Why
- “運営がいなくても回る”ためには、コミュニティが提案すめEruleset ぁE**衝突せずに識別**できる忁E��がある、E- JSONのような曖昧なシリアライズだと、言語差�E�キー頁E�E数値表記�EUnicode等）で **同じルールなのにIDが�E裁E* しやすい、E- 封E��オンチェーンに RulesetRegistry を置く場合も、Solidity側で同じIDを計算できる形�E�E fixed ABI encoding�E�が望ましい、E
### What
- `computeRulesetIdV1(ruleset)` を追加�E�ES参�E実裁E��、E  - `rulesetId = keccak256(abi.encode(RulesetConfigV1Canonical))` を固定、E  - 無効化セクション�E�Enabled=false�E��E **ゼロ化して正規化**�E�同じ挙動でIDが�E裂しなぁE��、E  - 五行調和�E `requiredElements` は雁E��として扱ぁE��E*頁E��を無要E*�E�Eode昁E��E��ソート）、E- 仕様追加�E�E  - `Nyano_Triad_League_RULESET_ID_SPEC_v1_ja.md`
  - RULESET_CONFIG_SPEC / TRANSCRIPT_SPEC を参照追訁E- チE��ト追加�E�E  - default rulesetId の test vector を固宁E  - 無効化セクションの正規化が効ぁE��ぁE��こと
  - requiredElements の頁E��がIDに影響しなぁE��と

### Verify
- `pnpm -C packages/triad-engine test`
- `pnpm -C packages/triad-engine build`
- 仕様差刁E��`docs/02_protocol/*` / `docs/99_dev/*` の更新確誁E

## 2026-02-08  Ecommit-0083: /stream parser統一�E�票割れゼロ�E�E
### Why
- Stream.tsx に 9 個�E重褁E��数があり、triad_vote_utils / triad_viewer_command と同じ計算を独自実裁E��てぁE��、E- `parseChatMove()` が独自パ�Eス実裁E��、`parseViewerMoveTextLoose()` と異なる正規化をするため票割れが発生してぁE��、E
### What
- `triad_viewer_command.ts` に `parseChatMoveLoose()` を追加。canonical / legacy / shorthand 全てめE`formatViewerMoveText()` で同一キーに正規化、E- Stream.tsx から 9 個�E重褁E��数を削除、triad_vote_utils / triad_viewer_command の import に置換、E- `parseChatMove()` めE`parseChatMoveLoose()` に置換。`ParsedMove` 垁EↁE`ViewerMove` に統一、E- `buildStateJsonContent()` / `buildAiPrompt()` めE`computeStrictAllowed()` / `computeToPlay()` に刁E��、E- Match.tsx のスマ�Eトクォート！E+201C/U+201D�E�ビルドエラーを修正、E
### Verify
- `pnpm build:web` 成功


## 2026-02-08  Ecommit-0084: エラー表示常設 + flip琁E��表示統一

### Why
- 外部連携�E�Earudo等）�E成功/失敗が一時的な toast でしか表示されず、ストリーマ�Eが見送E��めE��かった、E- Overlay の flip 琁E��表示が手動�E flipStats 雁E��で、TurnLog の FlipTraceBadges と一致しなかった、E
### What
- StreamOperationsHUD に `ExternalResult` 型と `ExternalStatusRow` コンポ�Eネントを追加、E- Stream.tsx に `lastExternalResult` state を追加、`sendNyanoWarudo()` で記録、E- `OverlayStateV1` に `externalStatus` フィールドを追加�E�互換拡張�E�、E- Overlay.tsx の手動 flipStats バッジ ↁE`FlipTraceBadges` コンポ�Eネントに置換、E- Overlay.tsx の手動 "Why:" セクション ↁE`flipTracesSummary()` に統一、E
### Verify
- `pnpm build:web` 成功


## 2026-02-08  Ecommit-0085: Overlay HUD 視認性 + UI クオリチE��アチE�E

### Why
- OBS controls=0 モードで 720p/1080p 表示時に斁E��が小さすぎて判読困難だった、E- パネル背景の透過が強く、E�E信映像と重なると斁E��が見えにくかった、E
### What
- ScoreBar に `size` prop を追加�E�Esm" | "md" | "lg"�E�、E- Overlay OBS モード�Eフォント階層を一律引き上げ�E�E0pxↁE2px, 11pxↁE2px, xs→sm, sm→base�E�、E- パネル背景 `bg-white/70` ↁE`bg-white/90`�E�EBS モード）、E- toPlay 表示めE`to-play-pill` コンポ�Eネント化�E��Eレイヤーカラー付き�E�、E- セル座標ラベルを常時表示に変更。�EーチEgap めEOBS モードで拡大、E- index.css に `vote-countdown-inline`, `to-play-pill` CSS コンポ�Eネントを追加、E
### Verify
- `pnpm build:web` 成功


## 2026-02-12  Ecommit-0086: Quick Play 導線テレメトリ追加�E�Eome→�E手�E置�E�E
### Why
- UX スコアカーチEB-1「Home から試合開始まで10秒以冁E��が未計測で、改喁E�Eループを回しにくかった、E- 既存�E `first_place_ms` は Match ペ�Eジ起点のため、Home CTA からの体験時間を直接評価できなかった、E
### What
- `telemetry.ts` に `quickplay_to_first_place_ms` を追加�E�Eession + Cumulative 平坁E��、E- Home の「🎮 すぐ遊�E」押下時に `markQuickPlayStart()` を記録し、Match 側の初回配置で消費して計測するようにした、E- Home > Settings の UX Telemetry パネルに `Avg quick-play to first place` を表示追加、E- チE��ト追加�E�E  - Home マ�Eカーありで計測されること
  - マ�EカーぁE回で消費されること
- ドキュメント更新�E�E  - `UX_SCORECARD` の B-1 を「計測可能」に更新
  - チE��メトリ一覧へ `quickplay_to_first_place_ms` を追加

### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`


## 2026-02-12  Ecommit-0087: Home LCP ローカル計測追加�E�E-3�E�E
### Why
- UX スコアカーチEG-3�E�ECP < 2.5s�E�が未計測で、改喁E��後�E比輁E��できなかった、E- 既存�E Home Settings チE��メトリに、パフォーマンスの中核持E��を同じ導線で表示したかった、E
### What
- `telemetry.ts` の cumulative stats に `avg_home_lcp_ms` を追加、E- `recordHomeLcpMs()` を追加し、Home ペ�Eジの LCP をローカル雁E��できるようにした、E- Home で `PerformanceObserver`�E�Elargest-contentful-paint`�E�を監視し、`visibilitychange/pagehide` ぁE6 秒フォールバックで記録、E- Home > Settings のメトリクスに `Avg Home LCP` を追加、E- チE��ト追加�E�E  - Home LCP 平坁E�E計箁E  - 不正値�E�EaN / 負数 / Infinity�E�を無視する挙勁E- `UX_SCORECARD` を更新し、G-3 を「計測可能」に変更、E
### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`


## 2026-02-12  Ecommit-0088: UX目標スナップショチE��表示 + quick-play計測の堁E��匁E
### Why
- チE��メトリ値が増えてきたため、E�E信前チェチE��で「目標を満たしてぁE��か」を即判定できる表示が忁E��だった、E- `quickplay_to_first_place_ms` は古ぁE��始時刻が残ると外れ値になり得るため、異常値ガードを入れて誤判定を防ぎたかった、E
### What
- `telemetry.ts` に `evaluateUxTargets(stats)` を追加し、A-1/B-1/B-4/G-3 の PASS/FAIL/INSUFFICIENT を算�E可能にした、E- Home > Settings に `UX Target Snapshot` を追加し、上訁E頁E��を目標値と現在値つきで可視化、E- quick-play 計測に上限�E�E0刁E��を追加し、古ぁE��始時刻による外れ値を無視するよぁE��した、E- チE��ト追加�E�E  - stale quick-play marker を無視すること
  - `evaluateUxTargets` の insufficient 判宁E  - pass/fail 混在ケースの判宁E
### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`


## 2026-02-12  Ecommit-0089: UX計測ログのコピ�E導緁E+ Playtest Log チE��プレ

### Why
- 計測値が見えるよぁE��なった一方で、`UX_SCORECARD` 運用の記録転記が手作業で、継続しにくかった、E- 配信剁E改修後に同じフォーマットで比輁E��きるログ出力を、UIから1クリチE��で取得したかった、E
### What
- `telemetry.ts` に以下を追加�E�E  - `buildUxTelemetrySnapshot(stats)`�E�Eimestamp + stats + target checks�E�E  - `formatUxTelemetrySnapshotMarkdown(snapshot)`�E�EPLAYTEST_LOG.md` 貼り付け形式！E- Home Settings の `UX Telemetry` に `Copy Snapshot` ボタンを追加、E  - クリチE��で markdown をクリチE�Eボ�Eドにコピ�Eし、`docs/ux/PLAYTEST_LOG.md` への貼り付けを案�E、E- `docs/ux/PLAYTEST_LOG.md` を新規作�Eし、記録チE��プレを追加、E- `UX_SCORECARD` の記録先表記をチE��プレ作�E済み状態へ更新、E- チE��ト追加�E�E  - snapshot 生�Eの timestamp/shape
  - markdown 整形冁E��

### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`


## 2026-02-12  Ecommit-0090: lint warning 0 化！Eeb�E�E
### Why
- `pnpm -C apps/web lint` に既知 warning ぁE件残っており、日常の検証でノイズになってぁE��、E- warning を放置すると、新要Ewarning の検知性が落ちるため早めに解消したかった、E
### What
- `apps/web/src/engine/renderers/pixi/cellAnimations.ts`
  - 未使用引数 `cellH` めE`_cellH` に変更�E�EPI互換を維持して lint 準拠�E�、E- `apps/web/src/engine/__tests__/cellAnimations.test.ts`
  - 未使用の垁Eimport `CellAnimFrame` を削除、E
### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`


## 2026-02-12  Ecommit-0091: UX snapshot に環墁E��ンチE��ストを追加

### Why
- 同じ持E��でも端末めE��示サイズで体験値が変わるため、snapshot比輁E��に実行環墁E��残す忁E��があった、E- `PLAYTEST_LOG.md` に貼る情報を増やし、後から「なぜ差が�Eたか」を追跡しやすくしたかった、E
### What
- `telemetry.ts` に `UxTelemetryContext` を追加し、snapshotへ `context` を含められるようにした、E- `formatUxTelemetrySnapshotMarkdown()` を拡張し、`route / viewport / language / userAgent` を�E力するよぁE��した、E- Home の `Copy Snapshot` でブラウザ惁E��を収雁E��て snapshot に埋め込むようにした、E- `PLAYTEST_LOG.md` のチE��プレに context 例を追記、E- チE��ト追加�E�E  - context あり snapshot 生�E
  - markdown の context 出劁E- e2e `home.spec.ts` を更新し、Settings 冁E�E `Copy Snapshot` / `UX Target Snapshot` 表示を検証対象に追加、E
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
- Commit0112 でローカル import UI は入ったが、�E力が手貼り前提で運用負荷が残ってぁE��、E- pointsDelta めE`settled_attested` として扱ぁE��線には、署名検証済み record を選べるモードが忁E��だった、E- 既存�E season points 移行を壊さずに、`fast import` と `verified import` を段階導�Eする忁E��があった、E
### What
- `apps/web/src/lib/settled_points_import.ts`
  - `parseVerifiedLadderRecordsImportJson(...)` を追加、E  - payload 形弁E`{ domain, records }` を受け取り、`verifyLadderMatchRecordV1(...)` で record ごとに検証、E  - issue code `attestation_invalid` を追加し、検証失敗理由を集紁E��E  - duplicate 判定ロジチE��めE`pushUniqueSettledEvent(...)` に共通化、E- `apps/web/src/lib/__tests__/settled_points_import.test.ts`
  - verified import の schema 不正ケース・attestation 失敗ケースを追加、E- `apps/web/src/pages/Events.tsx`
  - import mode 刁E�� UI を追加�E�E    - `Settled events (fast)`
    - `Verified records (domain + signatures)`
  - `/game/settled_events.json` 自動読込ボタンを追加、E  - mode に応じて parser を�Eり替え、同ぁEapply フローで local attempts に反映、E- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0113 完亁E��追記し、Doing を「バチE��エンド経由の自動供給と定期同期」へ更新、E
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/settled_points_import.test.ts`
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`

## 2026-02-13 - commit-0112: settled event JSON import for local pointsDelta migration

### Why
- DEV_TODO の Doing では、Phase 4 の pointsDelta 連携めEURL 手�E力かめE`on-chain settled event` 取り込みへ進める段階だった、E- 既存フローは Replay URL の `pda` 依存�Eため、後かめEsettled event を一括反映する導線がなく、season points の移行効玁E��低かった、E- ローカル保存�E event attempts に対して、安�Eに `pointsDeltaA` を適用するには、`matchId` 一致だけでなぁEwinner / tiles 整合チェチE��が忁E��だった、E
### What
- `apps/web/src/lib/settled_points_import.ts` を追加、E  - 入劁Eschema 対忁E
    - settled event 配�E
    - `{ settledEvents: [...] }`
    - `{ records: [{ settled: ... }] }`
  - `validateLadderMatchSettledEventV1(...)` を使って settled event を検証、E  - `matchId` 単位で正規化し、競吁Eduplicate めEissue として報告、E  - `applySettledPointsToAttempts(...)` でローカル attempt へ適用:
    - no local / winner mismatch / tiles mismatch / draw を安�EにスキチE�E
    - 整合しぁEattempt のみ `pointsDeltaA` + `pointsDeltaSource=settled_attested` を更新
- `apps/web/src/pages/Events.tsx`
  - `Settled points import (local)` UI を追加�E�ESON貼り付け、E��用、�E力クリア�E�、E  - import 結果サマリ�E�Enput/valid/updated/matched/unchanged/no-local/mismatch�E�と issue 抜粋表示を追加、E  - `Apply settled JSON` 実行時に更新対象 attempt めE`upsertEventAttempt(...)` で永続化、E  - My Pawprints 一覧に `deltaA` バッジ表示を追加、E- `apps/web/src/lib/__tests__/settled_points_import.test.ts`
  - parse�E�褁E��schema�E��Eduplicate conflict・apply�E�正常更新/不整吁Eローカル未一致�E�を検証、E- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0112 完亁E��追記し、Doing を「取得�E動化と署名検証フロー統合」へ更新、E
### Verify
- `pnpm -C apps/web test -- src/lib/__tests__/settled_points_import.test.ts`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`

## 2026-02-13 - commit-0111: phased pointsDelta integration for season progress

### Why
- DEV_TODO の Doing「pointsDelta 連携へ段階拡張」に対し、現状の season points は provisional ルールのみだった、E- on-chain settled event の自動取り込み前に、`pointsDeltaA` を安�Eに受け取って雁E��に反映できる移行レイヤーが忁E��だった、E- 既存履歴との互換性を守るため、E��刁E��ータで頁E��が不安定化しなぁE��用条件を固定したかった、E
### What
- `apps/web/src/lib/event_attempts.ts`
  - `EventAttemptV1` に optional `pointsDeltaA` / `pointsDeltaSource` を追加、E- `apps/web/src/lib/appUrl.ts`
  - replay share URL に `pda`�E�EointsDeltaA�E�を追加できるよう拡張、E- `apps/web/src/pages/Replay.tsx`
  - `?pda=` めEint32 で解析、E  - Event attempt 保存時に `pointsDeltaA` を保持、E  - share/canonical link でめE`pda` を維持、E- `apps/web/src/lib/season_archive.ts`
  - event単位�E `pointsDeltaTotal` / `pointsDeltaAttemptCount` / `pointsDeltaCoveragePercent` を追加、E  - archive markdown に delta 列を追加、E- `apps/web/src/lib/season_progress.ts`
  - source 概念�E�Eprovisional` / `points_delta`�E�を追加、E  - event冁E�� `pointsDeltaA` ぁE00%揁E��た場合�Eみ `points_delta` 採用、未允E��は provisional 維持、E  - source mix 雁E��と markdown 出力を追加、E- `apps/web/src/pages/Events.tsx`
  - progress パネルに source mix 表示を追加、E  - board に source badge�E�Eelta/provisional�E�と coverage 表示を追加、E  - event行に delta total / coverage を追加、E- Tests
  - `apps/web/src/lib/__tests__/appUrl.test.ts`
  - `apps/web/src/lib/__tests__/season_archive.test.ts`
  - `apps/web/src/lib/__tests__/season_progress.test.ts`
  - pointsDelta 入力�E雁E���E採用条件を追加検証、E
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web test -- src/lib/__tests__/appUrl.test.ts src/lib/__tests__/season_archive.test.ts src/lib/__tests__/season_progress.test.ts`
  - こ�E実行環墁E��は `vite/vitest` 起動時に `spawn EPERM` で完走不可

## 2026-02-13 - commit-0110: local season points and reward-tier guidance on /events

### Why
- Phase 4 の未完亁E��E��「シーズン制�E�ランキング/報酬/アーカイブ）」に対して、archive は実裁E��みだぁEranking/reward の導線が不足してぁE��、E- 公式�E on-chain `pointsDelta` 連携を�Eれる前段として、ローカル履歴から決定的に再計算できる暫定進行指標が忁E��だった、E- 雁E��ロジチE��めEUI に埋め込むと封E��の pointsDelta 移行時に回帰しやすいため、pure function として刁E��する忁E��があった、E
### What
- `apps/web/src/lib/season_progress.ts` を追加、E  - `Win +3 / Loss +1 / Event clear +2` のローカル points ルールを固定、E  - reward tier�E�Eookie/Bronze/Silver/Gold/Legend�E�判定を追加、E  - event別 points board を決定的 tie-break で生�E、E  - progress markdown 出力を追加、E- `apps/web/src/pages/Events.tsx`
  - `Local season points (provisional)` パネルを追加�E�Eier / next / progress bar / hint�E�、E  - `Season points board`�E�Event別�E�を追加、E  - `Copy summary` めEarchive + progress の結合出力へ拡張、E- `apps/web/src/lib/__tests__/season_progress.test.ts`
  - points算�E、tier遷移、tie-break、markdown 出力を検証、E- Docs
  - `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` に Commit0110 を追記、E  - `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md` の Phase 4 進捗を更新、E
### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`

## 2026-02-12 - commit-0107: phase4 onboarding quickstart (Home checklist + Match progress sync)

### Why
- Phase 4 の参加導線で「新規参加老E��けチュートリアル�E�E刁E��解ↁE刁E��加�E�」が未実裁E��った、E- ルール確認から�E回対戦までを短くし、E��脱しやすい最初�E1刁E��プロダクト�Eで補助する忁E��があった、E
### What
- `apps/web/src/lib/onboarding.ts` を新規追加、E  - 進捁EスチE��プ！Eread_quick_guide` / `start_first_match` / `commit_first_move`�E�を定義、E  - localStorage への読み書き、完亁E��雁E��、�E完亁E��定、reset を実裁E��E- `apps/web/src/lib/__tests__/onboarding.test.ts` を新規追加、E  - 既定値、E��捗永続化、完亁E��判定、異常payload fallback、reset を検証、E- `apps/web/src/pages/Home.tsx`
  - 「�Eじめての1刁E��タート」チェチE��リスチEIを追加、E  - 1刁E��ールモーダルを追加し、表示時に `read_quick_guide` を更新、E  - クイチE��対戦導線で `start_first_match` を更新し、E��捗リセチE��操作を追加、E- `apps/web/src/pages/Match.tsx`
  - guest match 開始時に `start_first_match` を更新、E  - 最初�E手が確定したタイミング�E�Eturns.length >= 1`�E�で `commit_first_move` を更新、E- `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md`
  - Phase 4 の「新規参加老E��けチュートリアル」頁E��を完亁E��更新、E- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0107 を追記し、Doing を次フェーズへ更新、E
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web test -- src/lib/__tests__/onboarding.test.ts`
  - こ�E実行環墁E��は `vite/vitest` 起動時に `spawn EPERM` が発生し完走不可

## 2026-02-12 - commit-0108: stream moderation controls (NG words / ban / slow mode)

### Why
- Phase 4 の未完亁E��E��「モチE��ーション機�E�E�EGワード、BAN、スローモード連携�E�」が `/stream` に不足してぁE��、E- 既孁Eanti-spam�E�レート制限�E投票変更回数�E�だけでは、E�E信現場での明示皁E��除外制御が足りなかった、E
### What
- `apps/web/src/lib/stream_moderation.ts` を新規追加、E  - BAN 判定、NGワード判定、slow mode 判定を pure function 化、E  - comma/newline 形式�E設定文字�Eを正規化・重褁E��去するパ�Eサを追加、E- `apps/web/src/pages/Stream.tsx`
  - moderation 設宁Estate を追加�E�Elow mode 秒数 / banned users / blocked words�E�、E  - localStorage 永続化を追加�E�Estream.moderation.*`�E�、E  - `addVoteFromChat` で受理前に moderation 判定を適用:
    - banned user reject
    - blocked word reject
    - slow mode reject
  - vote audit に `banned/ng-word/slow` の reject カウンタを追加、E- `apps/web/src/components/stream/VoteControlPanel.tsx`
  - Moderation UI�E�Elow mode秒数・BAN list・NG words�E�を追加、E  - audit 表示に moderation reject 冁E��を追加、E- `apps/web/src/lib/local_settings.ts`
  - moderation 設定�E read/write ヘルパを追加、E- Tests:
  - `apps/web/src/lib/__tests__/stream_moderation.test.ts` を追加、E  - `apps/web/src/lib/__tests__/local_settings.test.ts` に moderation roundtrip を追加、E- Docs:
  - `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md` の Phase 4 moderation 頁E��を完亁E��更新、E  - `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` に Commit0108 を追記、E
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web test -- src/lib/__tests__/stream_moderation.test.ts src/lib/__tests__/local_settings.test.ts`
  - こ�E実行環墁E��は `vite/vitest` 起動時に `spawn EPERM` が発生し完走不可

## 2026-02-12 - commit-0105: permissionless ladder format v1 (record verify + deterministic standings)

### Why
- DEV_TODO の高優先頁E��「ラダー�E�ランキング�E�を許可不要で第三老E��用できるフォーマット」が未完亁E��った、E- transcript / settled event / 署名�E3点を最小セチE��で固定しなぁE��、同じデータでも�E計算結果が揺れるリスクがあった、E- indexer依存を避けるため、E��褁E�E琁E�Eソート頁E�Etie-break頁E��仕様として固定する忁E��があった、E
### What
- `packages/triad-engine/src/ladder.ts` を新規追加、E  - `LadderMatchAttestationV1`�E�EIP-712�E�を追加、E    - typed-data payload / digest / signer recover / signature verify を実裁E��E  - `LadderMatchRecordV1` 検証を実裁E��E    - `hashTranscriptV1(transcript) == settled.matchId` を忁E��化、E    - transcript header と settled event の ruleset/season/player 一致を検証、E    - playerA/playerB の両署名検証を忁E��化、E  - `buildLadderStandingsV1(...)` を実裁E��E    - sourceキー�E�EhainId:blockNumber:txHash:logIndex�E�で重褁E��除、E    - 同一sourceの冁E��不一致めEreject、E    - points / wins / draws / losses / tileDiff を集計、E    - tie-break頁E��固定！Eoints desc ↁEwins desc ↁEtileDiff desc ↁElosses asc ↁEaddress asc�E�、E- `packages/triad-engine/src/index.ts`
  - `ladder` エクスポ�Eトを追加、E- `packages/triad-engine/test/ladder.test.js`
  - 正常系、transcript不一致、署名不一致、E��褁E��除、conflicting duplicate rejection、固定tie-breakを追加検証、E- `docs/02_protocol/Nyano_Triad_League_LADDER_FORMAT_SPEC_v1_ja.md`
  - ladder v1 のフォーマット仕様を新規追加、E- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - ladder頁E��を完亁E��更新、E
### Verify
- `pnpm -C packages/triad-engine lint`
- `pnpm -C packages/triad-engine build`
- `pnpm -C packages/triad-engine test`�E�この実行環墁E��は `node:test` ぁE`spawn EPERM` のため完走不可�E�E- `node -e ...` で ladder の署名検証・standings雁E��をスモーク実行（�E功！E
## 2026-02-12 - commit-0106: phase3 hardening (web error tracking + release runbook)

### Why
- Phase 3 の未完亁E��E���E�エラートラチE��ング / リリース手頁E��が残っており、回帰検知と出荷手頁E�E標準化が不足してぁE��、E- 依存追加を最小に抑えつつ、まず実運用できるエラー収集の基盤が忁E��だった、E
### What
- `apps/web/src/lib/error_tracking.ts` を新規追加、E  - global `error` / `unhandledrejection` 向けの収集ロジチE��を実裁E��E  - sink を�E替可能化！Elocal` / `console` / `remote`�E�、E  - localStorage リングバッファ�E�既宁E0件�E�で履歴保持、E  - env 設宁E
    - `VITE_ERROR_TRACKING_MODE`
    - `VITE_ERROR_TRACKING_ENDPOINT`
    - `VITE_ERROR_TRACKING_MAX_EVENTS`
    - `VITE_APP_RELEASE`
- `apps/web/src/main.tsx`
  - `installGlobalErrorTracking()` を起動時に導�E、E- `apps/web/src/lib/__tests__/error_tracking.test.ts`
  - sink解析、イベント正規化、ローカル保持、クリア、console sink を検証、E- `package.json`
  - `release:check` スクリプトを追加�E�Engine lint/build + web typecheck/lint/build�E�、E- `docs/99_dev/RELEASE_RUNBOOK_v1_ja.md`
  - versioning / changelog / rollback / feature flag / release check を定義、E- `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md`
  - Phase 3 の未完亁E頁E��を完亁E��更新、E- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0106 を反映し、Doing を次フェーズへ更新、E
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/error_tracking.test.ts`
  - こ�E実行環墁E��は `vite/vitest` 起動時に `spawn EPERM` が発生し完走不可

## 2026-02-12 - commit-0096: first-player flow adoption (committed mutual + web seed mode)

### Why
- `resolveFirstPlayerV1` を導�Eした後も、両老E��意フローの「commit検証付き」導線が不足してぁE��、E- web 側の first-player UI は `manual / mutual / commit_reveal` の3モード�Eみで、seed フローを直接検証できなかった、E
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
- Engine側で `committed_mutual_choice` を追加済みだったが、web Match UI からは選択�E検証できなかった、E- 「�E平な先攻決定！Eommit付き両老E��意）」を実運用で試すには、URLパラメータとUIの両方で再現可能にする忁E��があった、E
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
- web 側 `first_player_resolve` ぁEengine の判定ロジチE��を部刁E��に再実裁E��ており、封E��モード追加時に乖離リスクがあった、E- `commit_reveal` で牁E�Ecommitだけを受け入れる余地が残ってぁE��ため、engine側ポリシーと揁E��る忁E��があった、E
### What
- `apps/web/src/lib/first_player_resolve.ts`
  - `resolveFirstPlayerV1(...)` を利用する形に統一:
    - `mutual` ↁE`mode: "mutual_choice"`
    - `seed` ↁE`mode: "seed"`
    - `committed_mutual_choice` ↁE`mode: "committed_mutual_choice"`
    - `commit_reveal` ↁE`mode: "commit_reveal"`
  - `commit_reveal` のcommit入力を厳寁E��:
    - commitA/commitB どちらか牁E��のみはエラー、E    - 両方入力時のみ engine resolver へ commit pair を渡す、E  - 既存�E UI 向けエラーハンドリング�E�Eanual fallback + error斁E���E�E��E維持、E- `apps/web/src/lib/__tests__/first_player_resolve.test.ts`
  - `commit_reveal` の不一致チE��トを「両側commit入力あり」�E形に更新、E  - 牁E�Ecommit入力を明示皁E�� reject するチE��トを追加、E
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/first_player_resolve.test.ts`
- `pnpm -C apps/web build`

## 2026-02-12 - commit-0099: Match first-player params update hardening (atomic URL updates)

### Why
- `Match.tsx` の first-player 設定�Eタンで `setParam(...)` を連続呼び出ししており、URLパラメータ更新が取りこぼれる可能性があった、E- `commit_reveal` / `committed_mutual_choice` の入力条件がUI上で伝わりづらく、誤入力時の手戻りが発生しめE��かった、E
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
- モード�E替時に不要パラメータは消えるよぁE��なったが、忁E���E力が空のまま残るケースがあり、�E替直後に invalid になりやすかった、E- `seed / commit_reveal / committed_mutual_choice` では、�E回�E力コストと入力ミスを減らすために安�Eな初期値補完が忁E��だった、E
### What
- `apps/web/src/lib/first_player_params.ts`
  - Added `buildFirstPlayerModeDefaultParamPatch(mode, current, randomBytes32Hex)`.
  - Mode switch default-fill behavior:
    - `manual`: `fp` めE0/1 に正規化
    - `mutual`: `fpa/fpb` めE0/1 に正規化
    - `seed`: `fps/fpsd` ぁEbytes32 でなければ自動補宁E    - `commit_reveal`: `fps/fra/frb` を�E動補完し、`fca/fcb` はクリア
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
- first-player モード�E替は URL パラメータ状態に強く依存するため、ユニットテストだけでは画面実動作�E回帰を拾ぁE��れなぁE��E- mode transition 時�E「不要値クリア + 忁E��値補完」が崩れると、�E有URL再現性とUXが悪化する、E
### What
- `apps/web/e2e/match-first-player.spec.ts` を新規追加、E  - Case 1: `manual` ↁE`commit_reveal`
    - `fps/fra/frb` ぁEbytes32 で埋まること
    - `fpsd` / committed-mutual系パラメータがクリアされること
  - Case 2: `commit_reveal` ↁE`committed_mutual_choice`
    - `fps/fpna/fpnb` ぁEbytes32 で埋まること
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
- `NyanoCardArt` は gateway fallback を試した後に即 placeholder 固定となり、回線復帰時にユーザーが�E試行できなかった、E- 同じ URL への再読込ではブラウザキャチE��ュにより失敗状態が残るケースがあり、�E示皁E�� cache-busting が忁E��だった、E
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
- DEV_TODO の高優先頁E��として「シーズンの議会！Euleset proposal / vote / adopt�E�」が未完亁E��った、E- 運営不在でも第三老E��同じ採択結果を�E現できるように、決定論な雁E��規則を�Eに固定する忁E��があった、E- 署名投票�E�EIP-712�E�を導�Eする前提を崩さなぁE��で、最小�E TS 参�E実裁E��追加したかった、E
### What
- `packages/triad-engine/src/season_council.ts` を新規追加、E  - Proposal:
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
      - 同一 nonce 競合�Eエラー
      - proposal不一致 / 期限刁E�� / 候補外�E reject
      - 同率は `rulesetId` 昁E��E�� tie-break
    - `adoptSeasonCouncilRulesetV1(...)`
      - quorum 到遁E+ winner 存在時�Eみ採抁E- `packages/triad-engine/src/index.ts`
  - `season_council` エクスポ�Eトを追加、E- `packages/triad-engine/test/season_council.test.js`
  - proposalId canonicalization、vote hash 決定性、EIP-712 sign/verify/recover、nonce 競合、tally/adopt 条件を追加検証、E- `docs/02_protocol/Nyano_Triad_League_SEASON_COUNCIL_SPEC_v1_ja.md`
  - v1 最小�Eロトコル仕様を新規追加�E�Eroposal/vote/adopt、deterministic rule、EIP-712 型）、E- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Wind公平化を完亁E��更新、E  - 「シーズンの議会」頁E��を完亁E��更新、E  - Doing を「ラダー format 固定」へ更新、E
### Verify
- `pnpm -C packages/triad-engine lint`
- `pnpm -C packages/triad-engine test`
## 2026-02-13  EWO005-H follow-up: Pixi texture failure status + retry controls

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
## 2026-02-13  EWO005-I follow-up: auto fallback to Mint board when Pixi/WebGL init fails

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
## 2026-02-13  EWO005-J follow-up: replay-stage WebGL fallback e2e coverage

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
## 2026-02-13  EWO005-L follow-up: replay toolbar quick transport in stage focus

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
## 2026-02-13  EWO005-M follow-up: battle toolbar warning mark selector

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
## 2026-02-13  EWO005-N follow-up: stage toolbar guidance hints

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
    - `hotkeys: ↁEↁEspace [ ]`.
- `apps/web/src/mint-theme/mint-theme.css`
  - Added shared `stage-focus-toolbar-hint` style.
  - Added responsive wrapping for hint text under mobile widths.
- `apps/web/e2e/stage-focus.spec.ts`
  - Extended desktop battle/replay toolbar tests to assert hint visibility.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
## 2026-02-13  EWO005-O follow-up: replay toolbar highlight jump controls

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
## 2026-02-13  EWO005-P follow-up: sticky stage focus toolbars

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
## 2026-02-13  EWO005-Q follow-up: stage keyboard shortcuts

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
## 2026-02-13  EWO005-R follow-up: Escape-to-exit focus mode

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
## 2026-02-13  EWO005-K follow-up: stage toolbar quick commit controls

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
- We wanted stronger “battle feel Ein moment-to-moment interactions while keeping existing controls and route behavior unchanged.

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
- `pnpm.cmd lint` ✁E- `pnpm.cmd test` ✁E- `pnpm.cmd -C packages/triad-engine build` ✁E- `pnpm.cmd -C packages/triad-engine lint` ✁E- `node packages/triad-engine/test/classic_ruleset_id_v2.test.js` ✁E- `node packages/triad-engine/test/classic_order_chaos_swap.test.js` ✁E- `node packages/triad-engine/test/classic_reverse_ace.test.js` ✁E- `node packages/triad-engine/test/classic_plus_same.test.js` ✁E- `node packages/triad-engine/test/classic_type_ascend_descend.test.js` ✁E- `pnpm.cmd -C apps/web build` ✁E- `pnpm.cmd -C apps/web typecheck` ❁E(env issue: TS cannot resolve `pixi.js` / `fflate` in this sandbox run)
- `pnpm.cmd -C apps/web test -- ...` ❁E(sandbox `spawn EPERM` while loading vite/esbuild)
- `pnpm.cmd build:web` ❁E(sandbox `spawn EPERM` in nested pnpm/vite invocation)

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
  - Direct CTA `こ�Eルールで対戦` linking to `/match?ui=mint&rk=<rulesetKey>`.
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

## 2026-02-15 - WO011: Mint gamefeel background and stage shell

### Why
- Mint UI already had polished board/cell treatment, but scene-level gamefeel (pastel atmosphere, subtle pattern, floating particles) was still weak.
- WO011 required a background/stage uplift based on `docs/01_design/NYTL_MINT_UI_REFERENCE_PASTEL_GAMEFEEL_v0_ja.md` without touching game logic.

### What
- Updated `apps/web/src/components/DuelStageMint.tsx`:
  - Added `mint-stage--gamefeel` variant class on stage root.
  - Removed inline paw-print SVG overlay (moved pattern rendering to CSS).
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - Added gamefeel tokens (pastel BG colors, glass/shadow, inline paw pattern data-uri).
  - Upgraded `.mint-stage` background to layered pastel gradients with slow pan.
  - Added low-contrast paw pattern in `.mint-stage::before`.
  - Upgraded `.mint-stage::after` to lightweight sparkle + bokeh blend animation.
  - Strengthened stage rim/board grounding with subtle depth tweaks.
  - Extended `prefers-reduced-motion` and `[data-vfx]` branches for new layers:
    - `off`: no particles/glow, static background.
    - `low/medium/high`: controlled opacity and animation duration.

### Verify
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-15 - WO012: Mint Top HUD (score/turn fixed placement)

### Why
- 参�E画像�EースのUI強化で、上部の状況把握�E�スコア/ターン�E�を定位置化し、盤面への視線集中を改喁E��る忁E��があった、E- 既孁E`BattleHudMint` は惁E��量が多く、`density=minimal` ではよりシンプルな固定HUDが忁E��だった、E
### What
- Added `apps/web/src/components/BattleTopHudMint.tsx`:
  - New top HUD with left logo, center A/B score, right turn pill.
  - Scores are derived from `board` (no duplicated state).
  - Added `role`/`aria-label`/`aria-live` for accessibility.
- Updated `apps/web/src/pages/Match.tsx`:
  - Added Top HUD path only for `ui=mint`.
  - `density=minimal`: show Top HUD only.
  - `density=standard/full`: show Top HUD + existing `BattleHudMint`.
  - Kept `engine/rpg` behavior unchanged.
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - Added `mint-top-hud*` classes (glass panel, score capsule, turn pill).
  - Added responsive behavior for 360px-class widths.
  - Wired reduced-motion and `data-vfx` branches for new HUD effects.
- Added `apps/web/src/components/__tests__/BattleTopHudMint.test.tsx`:
  - Export smoke test and score/turn rendering assertion.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-15 - WO013: Mint stage layout + side player panels

### Why
- 参�E画像にある「左右プレイヤーパネル + 盤面中忁E���E対戦レイアウトを導�Eし、対戦の存在感を高める忁E��があった、E- 既存�E盤面入力系を崩さず、見た目レイヤーとして追加する方針が忁E��だった、E
### What
- Added `apps/web/src/components/PlayerSidePanelMint.tsx`:
  - New side panel component with avatar, player label, and remaining cards.
  - Supports active-player emphasis and aria status labels.
- Updated `apps/web/src/pages/Match.tsx`:
  - Added mint-only side-panel layout (`mint-battle-layout`) around board viewport.
  - Left/right panels show `Player A/B` and remaining cards.
  - Remaining values are derived from existing state:
    - `Math.max(0, 5 - used.usedA.size)`
    - `Math.max(0, 5 - used.usedB.size)`
  - Kept stage-focus and non-mint behavior unchanged.
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - Added `mint-battle-layout` (desktop 3-column: panel | board | panel).
  - Added `mint-player-panel*` styling (glass, ring, depth, remaining card stack motif).
  - Added responsive collapse at `<=1024px` to hide panels and prioritize board.
- Added `apps/web/src/components/__tests__/PlayerSidePanelMint.test.tsx`:
  - Export smoke and label/remaining-card rendering assertion.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-15 - WO014: Mint hand tray + action prompt polish

### Why
- 操作�E起点�E�手札選択）と次アクション誘導！Erompt�E��E、参照画像�EースUIの体験品質に直結する、E- 既存UIでは手札が単純な行表示で、prompt めE段表示だったため、ゲーム画面としての“定位置感”を強化する忁E��があった、E
### What
- Updated `apps/web/src/components/HandDisplayMint.tsx`:
  - Added tray wrapper (`mint-hand-tray`, `mint-hand-tray__rail`) around the hand.
  - Added light card stacking via `mint-hand-card--stacked`.
  - Kept existing click/drag behavior and raised selected card z-index for clarity.
- Updated `apps/web/src/components/BoardViewMint.tsx`:
  - Reworked ActionPrompt markup to two lines (JA/EN hierarchy).
  - Added `mint-prompt-slot` wrapper to stabilize prompt area height and reduce layout jitter.
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - Added glass tray styles, inner sheen, horizontal scroll behavior for hand rail.
  - Tuned selected-card lift/ring/shadow feedback.
  - Upgraded prompt to large pill style with two-line typography.
  - Added mobile adjustments for tray/prompt at `<=480px`.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-15 - WO015: NyanoReaction layout stability v2 (CLS hardening)

### Why
- Nyano コメント表示時に slot 高さめE��言差刁E��縦方向�E揺れが残る可能性があり、Mint match の安定感を損なってぁE��、E- 既存�Eレイアウト安定化を補強し、`input` はあるぁE`kind=idle` で実表示がなぁE��ースも安�Eに扱ぁE��E��があった、E
### What
- Updated `apps/web/src/components/NyanoReactionSlot.tsx`:
  - `pickReactionKind` を使って `hasVisibleReaction` を判定、E  - slot 冁E�E常晁Eplaceholder を�Eウントし、`mint-nyano-reaction-slot__content` に reaction を重ねる構造へ変更、E  - `input !== null` でめE`kind=idle` の場合�E idle slot class を維持、E- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - slot めE`min-height` 依存かめE`height: clamp(...)` + `overflow: hidden` に変更、E  - `mint-nyano-reaction-slot__content` めEabsolute overlay 化し、reaction 本体を `inset: 0` で固定、E  - `stage-focus-cutin` の余白を除去して slot 冁E��まりを安定化、E- Updated `apps/web/src/components/__tests__/NyanoReactionSlot.test.tsx`:
  - placeholder + content wrapper 構造に合わせてチE��ト更新、E  - `kind=idle` ケースで slot ぁEidle 扱ぁE��なることを追加検証、E- Updated `apps/web/e2e/ux-guardrails.spec.ts`:
  - LayoutShift API の軽量�Eローブを追加、E  - Nyano slot シナリオで line-clamp/overflow と合わせて layout-shift しきぁE��チェチE��を追加、E
### Verify
- `pnpm.cmd -C apps/web test -- NyanoReactionSlot` OK
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web typecheck` NG�E�既存依存不足: `pixi.js` / `fflate` 型解決エラー�E�E
## 2026-02-15 - WO016: Mint microinteraction polish (press/hover/focus unification)

### Why
- Mint UI 冁E��セル・手札・ボタンの押下文法が場所ごとに微妙に異なり、“触り忁E�� Eの統一感が不足してぁE��、E- キーボ�Eド操作時の視認性�E�Eocus-visible�E�も揁E��る忁E��があった、E
### What
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - 共通ユーチE��リチE�� `mint-pressable` / `mint-pressable--cell|--card|--pill` を追加、E  - hover/active/focus-visible めECSS 変数 `--mint-press-*` で統一、E  - selected ring/glow めE`--mint-selected-ring` / `--mint-selected-glow` に統一し、A/B 色と両立、E  - `prefers-reduced-motion` と `data-vfx=off|low` に press演�E抑制を追加、E- Updated `apps/web/src/components/BoardViewMint.tsx`:
  - selectable cell に `mint-pressable mint-pressable--cell` を付与、E  - `tabIndex=0` と Enter/Space でのセル選択を追加�E�Eocus-visible 導線）、E- Updated `apps/web/src/components/HandDisplayMint.tsx`:
  - hand card に `mint-pressable mint-pressable--card` を付与、E- Updated `apps/web/src/components/GameResultOverlayMint.tsx`:
  - result action buttons に `mint-pressable mint-pressable--pill` を付与、E- Updated `apps/web/e2e/ux-guardrails.spec.ts`:
  - Nyano slot シナリオで hand card / board cell の `mint-pressable` 適用を検証、E
### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web typecheck` NG�E�既存依存不足: `pixi.js` / `fflate` 型解決エラー�E�E
## 2026-02-15 - WO016/WO010 follow-up: keyboard + reduced-motion UX guardrails

### Why
- WO016 で追加した `mint-pressable` と Enter/Space 導線�E、見た目より先に操作感が壊れめE��ぁE��E- 既孁E`ux-guardrails` は URL同期とレイアウト安定が中忁E��、キーボ�Eド導線と reduced-motion 抑制の回帰を捕まえられてぁE��かった、E
### What
- Updated `apps/web/e2e/ux-guardrails.spec.ts`:
  - Added test: `Mint board cells remain keyboard-selectable via Enter`
    - Mint match で hand card 選択後、`data-board-cell` へフォーカスして Enter で `mint-cell--selected` になることを検証、E  - Added test: `Reduced motion disables pressable transition feedback in Mint battle UI`
    - `page.emulateMedia({ reducedMotion: "reduce" })` 下で hand card / board cell の `transitionDuration` ぁE`0s` を含むことを検証、E
### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK�E�E passed�E�E
## 2026-02-15 - Match UX fix: Nyanoコメント時の盤面ズレ抑止 + Prompt斁E��サイズ調整

### Why
- バトル中、Nyanoコメントに同期して盤面が「ずれる」体感があり、操作�E安定感を損なってぁE��、E- あわせて ActionPrompt�E�「カードを選んでください」）が大きすぎ、盤面視認性を阻害してぁE��、E
### What
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - `mint-stage-impact-board` の transform系アニメーションを廁E��し、位置を動かさなぁE`mint-stage-impact-board-glow` へ置換、E  - `mint-nyano-reaction-slot` に `contain: layout paint` を追加し、コメント描画のレイアウト影響を局所化、E  - `mint-prompt__ja` / `mint-prompt__en` のフォントサイズを縮小！Eesktop/mobile両方�E�、E- Updated `apps/web/e2e/ux-guardrails.spec.ts`:
  - Nyano slotシナリオで board frame の document座標差刁E��ェチE��を追加�E�Eeck Preview状態を固定して計測�E�、E
### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK�E�E passed�E�E- `pnpm.cmd -C apps/web build` OK

## 2026-02-15 - Match UX follow-up: commentary text stability + board/panel rebalance

### Why
- �o�g�����̏󋵎����e�L�X�g�iHUD/AI notice�j�̏o���E��\���ŏc���C�A�E�g���ϓ����A�Ֆʂ��㉺�ɗh���̊����c���Ă����B
- �Ֆʂ����傫��������������A���E�v���C���[�\���͏�񖧓x�������Ă悢�v�]���������B

### What
- Updated `apps/web/src/components/BattleHudMint.tsx`:
  - `moveTip` / `aiReason` �������`�悩��Œ�X���b�g�`��֕ύX�B
  - ���Ԃł������g��ێ����A�����e�L�X�g�̗L����HUD�������h��Ȃ��悤�ɒ����B
- Updated `apps/web/src/pages/Match.tsx`:
  - Mint UI��AI�����o�i�[�� `mint-ai-notice-slot` �ŏ펞�X���b�g�m�ۂ���\���֕ύX�B
  - ��\�����̓v���[�X�z���_�ō��������ێ����A�Ֆʂ̉�������/�����グ��h�~�B
- Updated `apps/web/src/components/PlayerSidePanelMint.tsx` + `apps/web/src/mint-theme/mint-theme.css`:
  - �v���C���[�p�l�����k���iavatar/����/�����T�C�Y�ƃJ���������_�E���j�B
  - �X�e�[�W/�{�[�h�̓����]�����l�߁A�Ֆʂ̌����ڃT�C�Y���g��B
  - HUD�̎����X���b�g�Œ蕝�Eellipsis�Eempty��ԃX�^�C����ǉ��B

### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (4 passed)
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web typecheck` NG (���m�̈ˑ��s��: `pixi.js` / `fflate`)
- Re-verify: `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (5 passed, with AI notice slot guardrail)

## 2026-02-15 - Match UX hotfix: details drawer close reliability + status text no-shift slots

### Why
- �o�g����ʂŁu�ڍ׏��v�h�����[�� �~ �������Ă����Ȃ��i�܂��͑��ăI�[�v������j�̌��������B
- �󋵕\���e�L�X�g�iBattle summary�j���o����������肷��x�ɁA�Ֆʈʒu���㉺���đ̌����s���肾�����B

### What
- Updated `apps/web/src/components/MatchDrawerMint.tsx`:
  - �R���|�[�l���g���N���[���Ē�`���Aclose�N���b�N���̓`�d�}�~��ǉ��B
  - �h�����[�{�̂� click/pointerdown �� stopPropagation ���A�w�i�E�w�ʗv�f�ւ̃C�x���g�R���h�~�B
  - close button �� `type="button"` + �����I�� `�~` �\���ɓ���B
- Updated `apps/web/src/pages/Match.tsx`:
  - `drawerOpen` ���� `DrawerToggleButton` ���\�������A���鑀��Ɠ����̍ăI�[�v����h�~�B
  - `Battle: ...` �󋵕\���������\������Œ�X���b�g�\���֕ύX�i���Ԃ� placeholder �ō����ێ��j�B
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - `mint-ai-notice` �� nowrap + ellipsis ���i�s���ω��ɂ�鍂���h��}�~�j�B
  - `mint-status-summary-slot` / `mint-status-summary` ��ǉ����ABattle summary �̍������Œ�B
- Updated `apps/web/e2e/ux-guardrails.spec.ts`:
  - `Match details drawer closes via the close button and stays closed` ��ǉ��B
  - `Mint status summary slot keeps stable height when battle text appears/disappears` ��ǉ��B
  - helper �� `nytl.ui.density=standard` �����������A�󋵕\���K�[�h���[����������s�B

### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (7 passed)
- `pnpm.cmd -C apps/web build` OK
## 2026-02-15 - Battle Stage focus UX: hand/board no-scroll flow refinement

### Why
- `battle-stage?ui=engine&focus=1` �ŁA��D�h�b�N����ƔՖʑI���܂łɏc�X�N���[����v�������P�[�X������A���쓱�����r�؂�Ă����B
- �Ֆʂ̌������������g�債�A�t�H�[�J�X���ɑI���s�ׂ֏W���ł��鎋�E�݌v���K�v�������B

### What
- Updated `apps/web/src/pages/Match.tsx`:
  - Stage focus ���̎�D�h�b�N�L���� `showStageFocusHandDock` �Ŗ����B
  - Stage focus + hand dock �\������ root/main column �� modifier class ��t�^���A�����Œ�h�b�N�Ɗ����Ȃ��]�����m�ہB
  - �㕔�c�[���o�[�� Commit/Undo/Warning�i�d������Q�j�� hand dock �\�����ɂ͔�\�������A�c��L���팸�B
  - hand dock �� Tailwind `sticky` �w��� stage �� inline �ŕ������Astage ���� CSS �Ǘ��Ɉ�{���B
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - `.mint-focus-hand-dock--stage` �� `position: fixed` �����A��ʉ��ɏ펞�Œ�\���B
  - `.stage-focus-root--with-hand-dock` / `.stage-focus-main-column--with-hand-dock` ��ǉ����A�Œ�h�b�N���̗\�񍂂��𓱓��B
  - Stage focus �� Nyano reaction slot �� cut-in �����T�C�Y�����k���ďc�����̐�L���y�ʉ��B
  - Stage focus board ���� prompt�i�u�J�[�h��I��ł��������v�j�T�C�Y��}������p override ��ǉ��B
- Updated `apps/web/src/lib/stage_layout.ts`:
  - battle �p reserveHeight �����������Aengine board �̎Z�o maxWidth/minHeight ���g����ɒ����B
- Updated `apps/web/e2e/stage-focus.spec.ts`:
  - desktop�e�X�g���utop commit�Œ�v�O�񂩂�udock commit���v�O��ɍX�V�B
  - brittle������������v�A�T�[�V�������A�t�H�[���o�b�N�����̉����`�F�b�N�֒u���B

### Verify
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts` OK (14 passed)
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (7 passed)
- `pnpm.cmd -C apps/web typecheck` NG (���m: `pixi.js` / `fflate` �̌^�����s��)
## 2026-02-15 - Battle Stage UX follow-up: commentary/status moved above board

### Why
- �󋵕\����Nyano�R�����g�̏�Ɍ�o���Ō����ƁA�R�����g���̌����ڈʒu�������������A��ʂ�����Č�����̌����c���Ă����B
- �܂��Astage focus �ŃR�����g/�󋵕\���������i��D�����̋ߖT�j�ɂ���ƁA�������������f����₷�������B

### What
- Updated `apps/web/src/pages/Match.tsx`:
  - `stage focus` �ł́u�󋵕\�� + Nyano�R�����g�v�� `stage-focus-announcer-stack` �Ƃ��ĔՖʂ̏㕔�Ɉڐ݁B
  - �����̉����\���� `!isStageFocusRoute` �����ɂ��Astage focus �ł̓�d�\���������B
  - `showMintStatusSummarySlot` �𓱓����Astage focus �ł͖��x�ݒ�Ɋւ�炸�Œ�X���b�g���m�ہiplaceholder�ێ��j�B
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - `stage-focus-announcer-stack` ��ǉ����A�㕔�ʒm�G���A�̃��C�A�E�g�����艻�B

### Verify
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts` OK (14 passed)
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (7 passed)
- `pnpm.cmd -C apps/web typecheck` NG (���m: `pixi.js` / `fflate`)
### Follow-up
- Updated `apps/web/e2e/stage-focus.spec.ts`:
  - Added `/battle-stage keeps commentary/status stack above board and hand dock` guardrail to lock vertical placement in focus layout.
## 2026-02-15 - Battle Stage UX follow-up: hand dock overlap fix

### Why
- stage focus �Ŏ�D�h�b�N���Ֆʂɔ���Č�����P�[�X������A���F���ƃ^�b�v������j�Q���Ă����B
- �����́A�Œ�h�b�N�̊���W�� filtered ancestor �̉e�����󂯂Ă����_�ƁAstage�h�b�N�������z����傫�������_�B

### What
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - `stage-focus-root--with-hand-dock .stage-focus-arena-shell` �� `backdrop-filter` �𖳌������A`mint-focus-hand-dock--stage` �� fixed ���W�� viewport ��֖߂����B
  - stage focus hand dock ���c�����Ɉ��k�ipadding/card thumbnail height/width �����j�B
  - stage focus hand dock �� board shell �̔������iboard shell margin/padding�Aengine board max-width override�j��ǉ����A�d�Ȃ������B
- Updated `apps/web/src/pages/Match.tsx`:
  - stage focus + hand dock ���� engine board max/min ��␳���A�ߑ�ȔՖʐ�L��}���B
- Updated `apps/web/e2e/stage-focus.spec.ts`:
  - `/battle-stage keeps commentary/status stack above board and hand dock` �ŁA�ՖʂƎ�D�h�b�N�̏d�Ȃ肪�Ȃ����Ƃ��p�����؁B

### Verify
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts` OK (15 passed)
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (7 passed)
- `pnpm.cmd -C apps/web typecheck` NG (���m: `pixi.js` / `fflate`)
## 2026-02-15 - Match/Mint & Stage follow-up: shiftless announcer + prompt/downsize + drawer close + Pixi hand/board rebalance

### Why
- `/match?ui=mint` �ł� Nyano�R�����g/�󋵕\���̏o���ŉ�ʈʒu���h���P�[�X���c���Ă����B
- �u�J�[�h��I��ł��������v���傫���A�Ֆʂ̎�𐫂������Ă����B
- Details �h�����[�� `�~` ���������Ȃ��i���Ă����ăI�[�v���Ɍ�����j�̌����������B
- stage focus �� Pixi �Ֆʂ��ߏ���/��D�J�[�h���F�ቺ������A������ hand dock �Ƃ̔�d�Ȃ���ێ�����K�v���������B

### What
- Updated `apps/web/src/pages/Match.tsx`:
  - Mint UI �� announcer�iBattle summary + Nyano reaction�j�� `mint-announcer-stack` �Ƃ��ĔՖʏ㕔�ɓ���z�u�i`/match` �ł��Œ�X���b�g�^�p�j�B
  - drawer �̊J�� `openDrawer` / `closeDrawer` �ɕ������Aclose����̒Z���Ԃ͍�open��}�~����K�[�h��ǉ��B
  - stage focus + hand dock ���� engine board cap ���Ē������Ahand dock��d�Ȃ�K�[�h�𖞂����ɒ[�ȏk��������B
- Updated `apps/web/src/components/MatchDrawerMint.tsx`:
  - close�{�^���� `�~` �\���ɕύX�A`onPointerDown` �� `onClick` �̗����� close ���m�����B
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - `mint-announcer-stack` ��ǉ��B
  - Prompt �̃T�C�Y��S�̏k���i�ʏ�/stage/mobile�A`mint-prompt__ja`/`__en`/`__text`�j�B
  - stage hand dock �̃J�[�h�\�����c����ێ��ɖ߂��i�����Œ��P���j�A�J�[�h�������񕜁B
  - stage hand dock �� board �̃o�����X�idock footprint / board shell / engine renderer max�j���Ē����B
  - drawer close �{�^���� hit area ���g��B
  - non-stage �� player panel ����i�R���p�N�g���B

### Verify
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts` OK (15 passed)
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (7 passed)
- `pnpm.cmd -C apps/web typecheck` �����s�i���m�̈ˑ�������肪�p���̂��߁j

## 2026-02-15 - WO017?WO024: Mint app screens + primitives + e2e/app-asset pipeline

### Why
- `/match` �ȊO�iHome/Arena/Decks/Onboarding�j���Ǘ���ʊ��ŁA�Q��Mock�́u�X�}�z�Q�[��UI�v���瘨�����Ă����B
- ��ʉ��W�J�̂��߂ɁAMint UI �v���~�e�B�u�iGlass/Pressable/Icon/TabNav/BigButton�j�����ʉ�����K�v���������B
- �����̉摜�����ւ��ɔ����āAGemini �����p�C�v���C���Ǝ�v��ʂ� e2e �K�[�h���Ċm�F�E���������������B

### What
- Added Mint shell/chrome and primitives:
  - `apps/web/src/components/mint/MintGameShell.tsx`
  - `apps/web/src/components/mint/MintAppChrome.tsx`
  - `apps/web/src/components/mint/GlassPanel.tsx`
  - `apps/web/src/components/mint/MintPressable.tsx`
  - `apps/web/src/components/mint/MintBigButton.tsx`
  - `apps/web/src/components/mint/MintTabNav.tsx`
  - `apps/web/src/components/mint/MintTypography.tsx`
  - `apps/web/src/components/mint/icons/MintIcon.tsx`
  - `apps/web/src/lib/theme.ts`
- Updated app layout:
  - `apps/web/src/App.tsx`
    - Mint theme ���̂� App chrome �� `MintGameShell + MintAppChrome` �֐ؑցB
    - `focusRoute`�istage/focus�j�ł͏]���ǂ��� header/footer ��\�����ێ��B
    - `prefers-reduced-motion` / `data-vfx` �ւ̊�������͈ێ��B
- Rebuilt main screens with Mint structure:
  - `apps/web/src/pages/Home.tsx`�i4��{�^���A3�X�e�b�v�Ainfobar�ATools/Settings�j
  - `apps/web/src/pages/Arena.tsx`�iside nav + banner + quick play + difficulty cards�j
  - `apps/web/src/pages/Decks.tsx`�i3�J���� Deck Builder�j
  - `apps/web/src/pages/Start.tsx`�ionboarding 3 cards + progress pill�j
  - `apps/web/src/main.tsx`�i`/start` route�ǉ��j
  - `apps/web/src/components/CardBrowser.tsx`�ipreset filter props�ǉ��j
- Expanded Mint CSS for app screens/primitives:
  - `apps/web/src/mint-theme/mint-theme.css`
    - Shell�w�i�Aglass�p�l���Atab/button/typography�AHome/Arena/Decks/Start ���C�A�E�g�Q��ǉ��B
    - reduced-motion �� `data-vfx=off` �Ŕw�i���o��}���B
- Gemini pipeline availability + asset directory:
  - `apps/web/public/assets/gen/.gitkeep` �ǉ��i�������u������Œ�j
  - Existing `scripts/gemini_image_gen.mjs` / batch prompt / docs �̉^�p���m�F�B
- e2e guardrails:
  - Added `apps/web/e2e/mint-app-screens-guardrails.spec.ts`
  - Updated `apps/web/e2e/home.spec.ts`
  - Updated `apps/web/e2e/smoke.spec.ts`
  - Updated `apps/web/e2e/decks-match.spec.ts`

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e -- e2e/mint-app-screens-guardrails.spec.ts e2e/home.spec.ts e2e/smoke.spec.ts e2e/decks-match.spec.ts` OK (16 passed)

## 2026-02-15 - Mint follow-up: lint cleanup + theme regression tests

### Why
- Keep Mint UI primitives warning-free and enforce URL/theme compatibility by tests.
- Remove lingering Fast Refresh warnings from `MatchSetupPanelMint.tsx` without changing behavior.

### What
- Updated `apps/web/src/components/mint/MintPressable.tsx`:
  - Removed unused destructured props warning by using underscore-prefixed bindings.
- Added `apps/web/src/lib/__tests__/theme.test.ts`:
  - Verifies `resolveAppTheme` precedence (query > storage > default).
  - Verifies `appendThemeToPath` compatibility with existing query/hash and non-overwrite semantics.
- Added `apps/web/src/components/match/MatchSetupPanelMint.helpers.ts` and moved helper functions:
  - `describeRulesetKey`
  - `describeFirstPlayerMode`
  - `buildMatchSetupSummaryLine`
  - `shouldOpenAdvancedSetup`
- Updated imports:
  - `apps/web/src/components/match/MatchSetupPanelMint.tsx`
  - `apps/web/src/components/match/__tests__/MatchSetupPanelMint.test.ts`

### Verify
- `pnpm -C apps/web lint` OK (0 warnings)
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-15 - Mint follow-up: app chrome focusRoute compatibility guardrails

### Why
- `focusRoute` (`focus=1`, `/battle-stage`, `/replay-stage`) では App chrome を�EさなぁE��提があり、Mint画面拡張後もこ�E互換を固定しておく忁E��がある、E- Mint tab navigation 時�E `theme=mint` 引き回し�E�ERL互換�E�も e2e で直接拁E��したい、E
### What
- Updated `apps/web/e2e/mint-app-screens-guardrails.spec.ts`:
  - Added `Mint app chrome preserves theme query across tab navigation`
    - `/?theme=mint` から Arena/Decks タブ�E移時に `theme=mint` を保持することを確認、E  - Added `focus routes keep app chrome hidden for layout compatibility`
    - `/match?...&focus=1` と `/battle-stage?...&focus=1` で
      `.mint-app-chrome` / `.mint-app-footer` / `.app-header` / `.app-footer` が非表示であることを確認、E    - `/battle-stage` では `Commit move from focus hand dock` 可視も確認して、focus動線が維持されることを検証、E
### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e -- e2e/mint-app-screens-guardrails.spec.ts` OK (5 passed)

## 2026-02-15 - Mint follow-up: Events/Replay/Stream polish + replay mobile overflow fix

### Why
- Events/Replay/Stream needed Mint-theme consistency with Home/Arena/Decks/Onboarding.
- `/replay?theme=mint` had a 390px horizontal overflow regression caught by guardrails.

### What
- Updated `apps/web/src/pages/Events.tsx` with Mint structure classes for hero/content/season/event/memo cards.
- Updated `apps/web/src/pages/Stream.tsx` with Mint structure classes for studio/steps/callout/live/recovery/links blocks.
- Updated `apps/web/src/pages/Replay.tsx`:
  - Applied replay page mode classes (`replay-page--standard|focus|stage-focus`) and section classes.
  - Switched classic replay board to `BoardViewMint` when `theme=mint`.
  - Fixed mobile overflow by wrapping long `rulesetId`/`matchId` (`break-all`, `flex-wrap`, `min-w-0`).
  - Constrained debug JSON disclosure layout (`grid-cols-1`, `min-w-0`, `pre max-w-full`).
- Updated `apps/web/src/pages/Match.tsx` to add `mint-board-view--match` class for board skin targeting.
- Updated `apps/web/src/mint-theme/mint-theme.css` with secondary-screen Mint styling and board polish, including reduced-motion / `data-vfx=off` handling.
- Updated `apps/web/src/styles.css` with replay min-width and pre width guards.
- Updated `apps/web/e2e/mint-app-screens-guardrails.spec.ts` to include 390px Events/Replay/Stream reachability checks and improved overflow diagnostics.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e -- e2e/mint-app-screens-guardrails.spec.ts --grep "Events/Replay/Stream"` OK (6 passed)

## 2026-02-15 - Mint follow-up: secondary quick-nav expansion + board shell polish

### Why
- After WO024 polish, Home/Arena/Decks/Start had stronger Mint game-menu feel than Events/Replay/Stream.
- Theme continuity still depended on manual query retention in some secondary routes.
- Match board shell and quick-commit block needed closer visual alignment with the same Mint glass language.

### What
- Updated `apps/web/src/pages/Events.tsx`:
  - Added Mint quick navigation rail (`mint-events-quicknav`) with `GlassPanel` + `MintPressable` + `MintIcon`.
  - Added `resolveAppTheme` + `appendThemeToPath` usage and switched event action links to themed paths.
- Updated `apps/web/src/pages/Replay.tsx`:
  - Added Mint quick navigation rail (`mint-replay-quicknav`) with Match/Events/Stream/Pixi Stage shortcuts.
  - Added theme propagation helper while preserving existing `ui`/`focus` compatibility.
- Updated `apps/web/src/pages/Stream.tsx`:
  - Added Mint quick navigation rail (`mint-stream-quicknav`) for operator routes.
  - Added themed absolute URL helper and applied it to shared links (`match/host/overlay/replay broadcast`) without touching protocol payloads.
  - Updated internal footer/callout links to themed paths.
- Updated `apps/web/src/pages/Match.tsx`:
  - Added `mint-match-board-shell` and `mint-match-board-center` classes around Mint board container.
  - Replaced inline quick-commit styles with `mint-match-quick-commit` class hooks.
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - Added shared quick-nav rail styles for Events/Replay/Stream.
  - Added Mint board shell/quick-commit polish styles and responsive behavior.
  - Added `prefers-reduced-motion` and `data-vfx="off"` branches for new visual hooks.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-15 - Mint follow-up: readability-first overview strips on Events/Replay/Stream

### Why
- Visual direction was aligned, but users still needed to scan too deeply to understand current status.
- Secondary screens needed clearer �gat-a-glance�h hierarchy for mobile game-like readability.

### What
- Updated `apps/web/src/pages/Events.tsx`:
  - Added `mint-events-summary` overview pills (active/upcoming/local attempts/selected season points).
  - Reused existing local summary data so no protocol or logic contract changed.
- Updated `apps/web/src/pages/Replay.tsx`:
  - Added `mint-replay-summary` overview pills (load status/progress/highlights/verify/mode/step status).
  - Kept `focusRoute` behavior unchanged (`isStageFocus` still prioritizes board-first flow).
- Updated `apps/web/src/pages/Stream.tsx`:
  - Added `mint-stream-summary` overview pills (event/live turn/vote/connectivity/warudo state).
  - Reused existing derived states (`connectionHealth`, `timeLeft`, `liveTurn`) without changing stream protocol behavior.
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - Added summary strip styles (`mint-events-summary`, `mint-replay-summary`, `mint-stream-summary`) with responsive behavior.
  - Improved quick-nav readability (icon chip treatment, contrast, wrapping, spacing).
  - Added new classes to existing reduced-motion / `data-vfx="off"` branches.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
## 2026-02-17  EArena follow-up: guide/difficulty styles completion + encoding cleanup

### Why
- `Arena` で追加されぁE`MintPageGuide` と難易度ヒント行�Eクラスに対応CSSが未実裁E��、表示が素のままになる箁E��が残ってぁE��、E- `apps/web/src/pages/Arena.tsx` ぁEUTF-8 BOM 付きになっており、差刁E��イズとエンコーチE��ング不統一を避けるため正規化が忁E��だった、E- 変更運用ルールに合わせ、今回の差刁E��実裁E��グへ明示しておく忁E��があった、E
### What
- `apps/web/src/mint-theme/mint-theme.css`
  - `mint-page-guide__*` スタイル群を追加�E�Eead/grid/item/title/detail�E�、E  - `mint-arena-difficulty__top` / `mint-arena-difficulty__hint` を追加、E  - レスポンシブ時の `mint-page-guide__grid` めE`1100px` / `760px` で段階的に縮退、E- `apps/web/src/pages/Arena.tsx`
  - 難易度選択�Eタンに `type="button"` を追加してフォーム斁E��での誤 submit を予防、E  - UTF-8 BOM を除去し、UTF-8 (BOMなぁE に統一、E- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - 本 follow-up の完亁E��E��を追記、E
### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
## 2026-02-17  EMint guide rollout: apply shared page guide to Events/Replay/Stream

### Why
- `apps/web/src/lib/mint_page_guides.ts` には `events/replay/stream` の斁E��定義がある一方、実際の画面反映は `Arena` のみで、定義と実裁E��不整合だった、E- 画面遷移時�E学習導線を揁E��、Mint二次画面の惁E��設計を統一する忁E��があった、E
### What
- `apps/web/src/pages/Events.tsx`
  - `MintPageGuide` / `MINT_PAGE_GUIDES` を導�Eし、MintチE�Eマ時に `MINT_PAGE_GUIDES.events` を表示、E- `apps/web/src/pages/Replay.tsx`
  - `MintPageGuide` / `MINT_PAGE_GUIDES` を導�Eし、`!isStageFocus` 条件下で `MINT_PAGE_GUIDES.replay` を表示、E  - Stage focus の board-first 導線�E維持、E- `apps/web/src/pages/Stream.tsx`
  - `MintPageGuide` / `MINT_PAGE_GUIDES` を導�Eし、MintチE�Eマ時に `MINT_PAGE_GUIDES.stream` を表示、E
### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`
- `pnpm.cmd -C apps/web e2e -- e2e/mint-app-screens-guardrails.spec.ts`
## 2026-02-17  EMint guide rollout follow-up: e2e guardrails for page guides

### Why
- 共通ガイド�E UI 導線�E土台なので、�Eび「定義だけあり未表示」になる回帰を防ぐ忁E��があった、E
### What
- `apps/web/e2e/mint-app-screens-guardrails.spec.ts`
  - `/arena` `/events` `/replay` `/stream` で `.mint-page-guide` 可視を追加検証、E  - 既存�E 390px 到達性・横オーバ�Eフロー検証と同時にチェチE��、E
### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/mint-app-screens-guardrails.spec.ts`
## 2026-02-17  EStage focus overlap fix + UX guardrail commit fallback hardening

### Why
- CI で `e2e/stage-focus.spec.ts` の「boardAboveDock」判定が失敗し、`/battle-stage` で盤面下端と hand dock が重なるケースが確認された、E- 同じ CI 実行で `ux-guardrails` の `Quick commit move` クリチE��がタイミング依存で flaky になってぁE��、E
### What
- `apps/web/src/mint-theme/mint-theme.css`
  - `.mint-focus-hand-dock--stage` の transform めE`translate(-50%, 0)` に統一、E  - desktop 条件�E�Emin-width: 1200px` かつ `min-height: 700px`�E�で `translate(-50%, 10px)` を適用し、board/dock の重なりを解消、E- `apps/web/e2e/ux-guardrails.spec.ts`
  - `commitMove` で quick commit のクリチE��に短ぁEtimeout と失敗時フォールバックを追加し、描画タイミング差の flaky を抑制、E- `apps/web/src/lib/stage_layout.ts`
  - battle desktop の reserve height めE380 ↁE400 に調整、E- `apps/web/src/lib/__tests__/stage_layout.test.ts`
  - 上記調整に合わせて期征E��を更新、E
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm.cmd -C apps/web test -- src/lib/__tests__/stage_layout.test.ts`
- `pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts`
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts`
- `pnpm.cmd -C apps/web e2e` はローカル実行環墁E�E `spawn EPERM` で完走不可�E�対象specは個別実行で確認）、E## 2026-02-17 - ui=mint parity follow-up: align board/hand/commentary/status flow with Pixi

### Why
- ui=mint and Pixi (ui=engine) still had different battle flow on Match: hand operation location, HUD/commentary presentation tone, and control discovery differed.
- Requirement: keep Mint renderer fallback/path, but align board/hand/commentary/status presentation and interaction flow to Pixi-style operation.

### What
- apps/web/src/pages/Match.tsx
  - Enabled focus hand dock flow for ui=mint as well (non-RPG), not only engine focus.
  - Disabled mint-only top HUD and side player panels while mint/pixi parity mode is active.
  - Unified BattleHudMint and NyanoReactionSlot tone to pixi for the mint parity path.
  - Kept URL/protocol behavior unchanged (ui params, replay/state handling untouched).
- apps/web/e2e/ux-guardrails.spec.ts
  - Updated hand-control detection to accept either legacy hand listbox or focus hand dock.
  - Extended commitMove helper with dock commit action support and robust board-cell selection fallback (click/evaluate/keyboard).
- apps/web/src/mint-theme/mint-theme.css
  - Added .mint-focus-hand-card to reduced-motion transition suppression branch so dock cards also respect prefers-reduced-motion.

### Verify
- pnpm -C apps/web typecheck OK
- pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts OK (7 passed)
- pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts OK (15 passed)
## 2026-02-17 - e2e:ux follow-up: mint stage guardrails accept dock-style commit controls

### Why
- ui=mint now prioritizes hand dock flow, so legacy-only Commit move assertions in mint-stage-visual-guardrails failed on CI.

### What
- pps/web/e2e/mint-stage-visual-guardrails.spec.ts
  - Added expectCommitControlVisible() helper.
  - Updated commit-control assertions to accept any valid mint control path:
    - Commit move
    - Commit move from focus hand dock
    - Quick commit move

### Verify
- pnpm.cmd -C apps/web e2e:ux OK (14 passed)

## 2026-02-17 - WO025/026/027: classic presets + custom ruleset mask + Mint ruleset picker

### Why
- Classic rules were partially implemented in engine/registry but not fully surfaced in Mint setup and replay/share workflows.
- Replay/share needed a backward-compatible way to restore non-registry classic combinations.
- Match setup needed clearer rules UX (preset vs custom, summary-first, low-friction controls).

### What
- apps/web/src/lib/ruleset_registry.ts
  - Added classic presets: classic_plus, classic_same, classic_reverse, classic_ace_killer, classic_type_ascend, classic_type_descend.
  - Added classic_custom key (base v2 classic-off baseline for custom composition flow).
- apps/web/src/lib/ruleset_discovery.ts
  - Added metadata for all new classic presets and classic_custom.
- apps/web/src/pages/Rulesets.tsx
  - Added Classic (Beta) discoverability section with direct /match?ui=mint&rk=... CTAs.
- apps/web/src/lib/classic_rules_param.ts (new)
  - Added classic mask encode/decode/normalize (cr base36 bitmask) and active-tag utility.
- apps/web/src/pages/Match.tsx
  - Added rk=classic_custom + cr decode flow to build runtime classic config.
  - Added URL canonicalization (classic_custom => ensure cr, non-custom => remove cr).
  - Added replay/share URL propagation for rk/cr.
- apps/web/src/pages/Replay.tsx
  - Added fallback ruleset reconstruction from URL params when rulesetId is not found in registry.
  - Added mismatch warning when reconstructed rulesetId differs from transcript header rulesetId.
  - Reused reconstructed ruleset for classic swap/open metadata rendering.
- apps/web/src/components/match/MintRulesetPicker.tsx (new)
  - Added family/preset/custom UX with exclusive radio-like groups and toggle groups.
  - Added short contextual help and active summary.
- apps/web/src/components/match/MatchSetupPanelMint.tsx
  - Integrated MintRulesetPicker while keeping legacy select[data-testid=match-setup-ruleset] for compatibility.
  - Added custom mask visibility (cr=...) when custom mode is active.
- apps/web/src/components/match/MatchSetupPanelMint.helpers.ts
  - Added labels for new classic keys and custom summary rendering.
- apps/web/src/lib/appUrl.ts
  - Extended buildReplayShareUrl options with optional rulesetKey/classicMask (rk/cr).
- Tests
  - Added apps/web/src/lib/__tests__/classic_rules_param.test.ts.
  - Updated registry/helper/url tests for new keys and URL params.
- Stability follow-up
  - Normalized visible commit button text to Commit move for UX/e2e consistency.

### Verify
- pnpm -C apps/web test OK
- pnpm -C apps/web typecheck OK
- pnpm -C apps/web build OK
- pnpm.cmd -C apps/web e2e:ux OK (14 passed)


## 2026-02-17 - Replay fallback mismatch guardrail + UX commit fallback hardening

### Why
- After adding classic custom URL fallback (rk/cr), Replay needed a dedicated E2E guardrail for mismatch warning visibility.
- ux-guardrails commit helper still had edge-case flakiness when only focus-hand-dock controls were present.

### What
- apps/web/e2e/replay-ruleset-fallback-guardrails.spec.ts (new)
  - Added guardrail test for /replay?rk=classic_custom&cr=... fallback restore in auto mode.
  - Asserts URL fallback label and rulesetId mismatch warning are visible.
- apps/web/package.json
  - Added the new replay fallback guardrail spec to e2e:ux.
- apps/web/e2e/ux-guardrails.spec.ts
  - Hardened commitMove helper with additional fallback paths:
    - focus hand card button selection (Focus hand card N)
    - focus toolbar commit action
    - generic commit action fallback
  - Re-applies hand selection after board-cell selection to avoid dock-only state race.

### Verify
- pnpm.cmd -C apps/web e2e:ux OK (15 passed)
- pnpm -C apps/web test OK
- pnpm -C apps/web typecheck OK
- pnpm -C apps/web build OK

## 2026-02-17 - Public copy cleanup for Home/Start/Stream

### Why
- Home/Start/Stream contained developer-facing or roadmap-like copy (`現在のフェーズ`, `次のマイルスト�Eン`, `導線`, `暫定`, `DONE/TODO`) visible to end users.
- Requirement: keep navigation/functionality unchanged and replace internal phrasing with player-facing copy.

### What
- apps/web/src/pages/Home.tsx
  - Replaced hero/menu/infobar copy with player-facing text.
  - Replaced onboarding status labels from DONE/TODO/AUTO to Japanese user-facing labels.
  - Replaced onboarding completion sentence with play-ready wording.
- apps/web/src/pages/Start.tsx
  - Replaced DONE/TODO labels with user-facing status labels.
  - Replaced quickstart footer sentence with user-facing Japanese copy.
  - Fixed step-title typos (`戦闘` -> `対戦`, `本初` -> `最初`).
- apps/web/src/pages/Stream.tsx
  - Replaced internal planning wording in studio description/callout heading with public-facing copy.

### Verify
- pnpm -C apps/web test
- pnpm -C apps/web typecheck
- pnpm -C apps/web build

## 2026-02-17 - Japanese-first UI copy pass (Replay-centric)

### Why
- Several user-facing pages still used English-heavy copy (especially Replay), making the product tone inconsistent for Japanese users.
- Requirement: make UI text Japanese-first without breaking existing links/protocols and without destabilizing layout/E2E guardrails.

### What
- Replay
  - `apps/web/src/pages/Replay.tsx`
    - Converted major UI copy to Japanese-first across summary chips, focus toolbar feedback, setup/help, timeline/detail panels, and deck inspector.
    - Kept E2E-sensitive strings where needed (`Replay from transcript`, `Show controls`, etc.) or embedded compatibility phrases.
    - Localized replay error/help toasts and fallback warnings.
  - `apps/web/src/lib/replay_timeline.ts`
    - Localized phase/status labels (`準備/序盤/中盤/終盤/終局`, `初期盤面`).
  - `apps/web/src/lib/replay_highlights.ts`
    - Localized highlight labels (`大量反転/連鎁EコンチE警告`).
  - `apps/web/src/lib/__tests__/replay_timeline.test.ts`
  - `apps/web/src/lib/__tests__/replay_highlights.test.ts`
    - Updated expected labels to match Japanese-first output.
  - `apps/web/e2e/replay-ruleset-fallback-guardrails.spec.ts`
    - Updated to accept both old/new fallback warning text patterns for compatibility.

- Secondary pages (Japanese-first baseline)
  - `apps/web/src/pages/Arena.tsx`: quick play/banner copy localized.
  - `apps/web/src/pages/Decks.tsx`: headings/buttons/toasts localized while keeping `Save Deck` text for selector compatibility.
  - `apps/web/src/pages/Rulesets.tsx`: list/filter/action copy localized with `Ruleset Registry` compatibility kept in heading.
  - `apps/web/src/pages/Events.tsx`: summary/quick action/import-area copy localized.

### Verify
- pnpm -C apps/web test OK
- pnpm -C apps/web typecheck OK
- pnpm -C apps/web build OK
- pnpm.cmd -C apps/web e2e:ux OK (15 passed)

## 2026-02-17 - Stream/HUD 日本語コピ�E追補と説明文クリーンアチE�E

### Why
- Stream 周辺に英語寁E��の補助斁E��・ト�Eストが残っており、日本語�Eースの体験にムラがあった、E- `_design/Home` にユーザーに見せるべきでなぁE��捗系表現�E�フェーズ/マイルスト�Eン�E�が残存してぁE��、E
### What
- `apps/web/src/pages/Stream.tsx`
  - 経過時間ラベルを日本語化�E�Eたった今` / `秒前` / `刁E��`�E�、E  - 視�E老E��け案�Eコピ�E時トーストを日本語化、E  - ライブ状態�E `Event` / `Turn` 表示めE`イベンチE / `ターン` に統一、E- `apps/web/src/components/stream/StreamSharePanel.tsx`
  - 視�E老E���E/Nightbot コピ�E完亁E��ーストを日本語化、E- `apps/web/src/components/stream/WarudoBridgePanel.tsx`
  - `viewer cmd format` 表示を日本語ラベルへ変更、E  - サンプル出力ブロチE��のインチE��トずれを整形、E- `apps/web/src/components/StreamOperationsHUD.tsx`
  - ヘッダー整形を修正、E  - `VOTE OPEN` / `Vote Status` などを日本語ラベルへ調整、E  - `Last Error` / `Health` / `Ops Log` を日本語化、E  - 相対時刻表示を日本語化、E- `apps/web/src/pages/_design/Home.tsx`
  - 「現在のフェーズ」「次のマイルスト�Eン」をユーザー向け斁E��へ置換、E  - 進捗説明調のチE��ストを一般皁E��利用導線説明へ更新、E
### Verify
- pnpm -C apps/web test OK
- pnpm -C apps/web typecheck OK
- pnpm -C apps/web build OK
- pnpm.cmd -C apps/web e2e:ux OK (15 passed)

## 2026-02-17 - Overlay 日本語�Eース化！E2E互換キーワード維持E��E
### Why
- Overlay は配信表示での露出が多い一方、補助斁E��が英語中忁E��日本語トーンと不整合だった、E- ただぁEE2E ぁE`Now Playing` / `Chat voting` / `No signal yet` / `OPEN` / `remaining` に依存してぁE��ため互換維持が忁E��だった、E
### What
- `apps/web/src/pages/Overlay.tsx`
  - 時刻表記を日本語化�E�Eたった仁E/ 秒前 / 刁E�� / 時間前`�E�、E  - スチE�Eタス要紁E��日本語化�E�勝老Eターン/タイル/征E��中�E�、E  - 上部コントロール・警告�E直前手・投票・エラー・ヘルプ文言を日本語�Eースへ調整、E  - E2E依存語�E併記して維持E��侁E `対戦中 (Now Playing)`, `投票状況E(Chat voting)`, `信号征E�� (No signal yet)`, `残り ...s remaining`�E�、E  - strictAllowed まわりの補助斁E��を日本語化�E�合法手/WM候裁Eホスト征E��中�E�、E
### Verify
- pnpm -C apps/web test OK
- pnpm -C apps/web typecheck OK
- pnpm -C apps/web build OK
- pnpm.cmd -C apps/web e2e:ux OK (15 passed)
- `e2e/cross-tab-overlay.spec.ts` / `e2e/smoke.spec.ts` の個別実行�E環墁E��来 `spawn EPERM` で未完亁E��コマンド実行�E体�E試行済み�E�、E
- `apps/web/src/App.tsx`
  - ヘッダーグループ見�Eし！Elay/Watch�E�を日本語化、E  - Mint/通常フッターリンク斁E��を日本語�Eースへ統一、E  - フッタータグラインめE`決定諁E· コミュニティ主導` に更新、E

## 2026-02-17 - Home/Playground ���{��x�[�X�Ǖ�iE2E�݊����ێ��j

### Why
- Home �� Tools/metrics �̈�� Playground �ɉp��D�ʂ̕������c���Ă���A���{��x�[�X�̌��Ƀ������������B
- ������ Home/Replay �� E2E �͉p����� selector �Ƃ��ĎQ�Ƃ��邽�߁A���S�u���ł͂Ȃ��݊����L���K�v�������B

### What
- apps/web/src/pages/Playground.tsx
  - ���o��/���앶��/��ԕ\������{��x�[�X���i��: �x�N�^�Z�b�g�A�P�[�X�A�^�[�����O�A�f�b�L�m�F�A���݂̏��ҁj�B
  - Nyano Lab �ȂǊ���E2E���Q�Ƃ����͕ێ����A���{������֓���B
  - �R�s�[����g�[�X�g����{�ꉻ�B
- apps/web/src/pages/Home.tsx
  - Tools/Settings�E�e�{�^���E���g���N�X���x������{��D��֕ύX�B
  - E2E�ˑ���͕��L�ŕێ��i��: Tools / Settings, Copy Snapshot, Reset Metrics�j�B
  - �X�i�b�v�V���b�g�֘A�g�[�X�g/���ԕ�������{�ꉻ�B

### Verify
- pnpm -C apps/web test OK
- pnpm -C apps/web typecheck OK
- pnpm -C apps/web build OK
- pnpm.cmd -C apps/web exec playwright test e2e/home.spec.ts e2e/smoke.spec.ts e2e/replay-url.spec.ts �̓��[�J�������� spawn EPERM �ɂ�薢����


## 2026-02-18 - Events/Decks/Replay ���{��UI�Ǖ�

### What
- Decks: �ݒ�^�u������{�ꉻ���ASave Deck ���w�f�b�L�ۑ� (Save Deck)�x�֓���B�ۑ��ς݃f�b�L�̃R�s�[�������wJSON���R�s�[�x�֕ύX�BQuick Play�\�L���w�N�C�b�N�ΐ�x�֒����B
- Events: ��荞�ݎ��s���胁�b�Z�[�W�A���Ճ��O�iMy Pawprints�j�A���[�J�����𑀍�A���s�\���AOpen/Copy/Remove ����{�ꉻ�B
- Replay: �⏕�����i���Ǎ��A���ǂ���ړ��ANyano�f�b�L tokenIds�Aclassic swap/open �⏕�A�c�[���`�b�v�j����{�ꉻ�B

### Verify
- pnpm -C apps/web test OK
- pnpm -C apps/web typecheck OK
- pnpm -C apps/web build OK
- pnpm.cmd -C apps/web e2e:ux OK (15 passed)

## 2026-02-18 - Match/Decks �������� + guest-game E2E�Ǐ]

### What
- Match: �t�H�[���o�b�N/�Ǎ�/���L/������CTA/�f�b�L�v���r���[���ӂ̉p�ꕶ������{��x�[�X���B
- Match: E2E�ˑ��̕����iGuest Quick Play�ACommit move�n�ALoad replay�n�j�͈ێ��B
- Decks: Deck Builder/My Deck/Set as A/Edit/Delete/Save Deck �̉p��g�[�N�����݊����L�����{��D��֒����B
- E2E: pps/web/e2e/guest-game.spec.ts �� Commit Move �Œ�A�T�[�V���������sUI�݊��iQuick commit / Commit move / focus hand dock�j�֍X�V�B

### Verify
- pnpm -C apps/web test OK
- pnpm -C apps/web typecheck OK
- pnpm -C apps/web build OK
- pnpm.cmd -C apps/web e2e:ux OK (15 passed)
- pnpm.cmd -C apps/web e2e -- e2e/decks-match.spec.ts e2e/quick-play.spec.ts e2e/guest-game.spec.ts OK (5 passed)

## 2026-02-17 - i18n copy cleanup (Home/Events/Match/Replay) + stage-focus compatibility

### What
- Home onboarding completion copy was replaced with neutral player-facing wording.
- Events copy was rewritten to Japanese-first user guidance and internal memo text was replaced with player guide text.
- Match visible copy was updated to Japanese-first while preserving E2E-critical English selector labels.
- Replay copy was updated to Japanese-first and compatibility tokens were restored: `Replay from transcript`, `Load replay`, `Error:`, `Retry load`, `Clear share params`.

### Verify
- pnpm -C apps/web test OK
- pnpm.cmd -C apps/web typecheck OK (elevated run needed in this Windows environment due junction EPERM)
- pnpm -C apps/web build OK
- pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts OK (15 passed)
- pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts e2e/mint-stage-visual-guardrails.spec.ts OK (10 passed)
