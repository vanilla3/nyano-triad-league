# Nyano Triad League DEV TODO (v1 / ja)

このドキュメントは「開発のやること」を、**Codex Work Order（1PR粒度）に落とすための入口**として使います。

## 直近（UI/UX）

- Motion Language（かわいい動きの統一語彙）をサイト全体へ適用
  - 仕様: `docs/01_design/NYTL_MOTION_LANGUAGE_SPEC_TABLE_v0_1_ja.md`
  - まず Match の「選択→配置→奪取」に集中して体感を作る

- バトル盤面の“ゲーム感”を強化
  - 置けるマスの磁石表現、配置の質量感、奪取の確定感、連鎖の因果表示

- ルール設定（Rulesets）を任天堂品質へ
  - 初見で分かる導線（おすすめルール / 迷ったらこれ）
  - Classic Rules（Order/Chaos/Swap/Reverse/AceKiller/Plus/Same/Type/AllOpen/ThreeOpen）をUIで使えるように

## 近未来（運用品質）

- `prefers-reduced-motion` / `data-vfx` の段階設計を徹底（低性能端末/配信でも破綻しない）
- 観測性：UXメトリクス（初回対戦到達、勝敗表示までの時間、誤タップ率の推定）
- E2E（Playwright）で主要導線（Home→Arena→Match→Result、Replay視聴）を固定

---

> NOTE: 旧TODOは文字化けしていたため `_archive/` に退避しました。
- [x] 2026-02-20 WO044-followup-3: hardened `scripts/check_text_hygiene.mjs` with `--root` support, line/column diagnostics, PUA detection, and stricter mojibake pattern matching to reduce false positives while keeping docs/codex/scripts scanable.
- [x] 2026-02-20 WO044-followup-3: cleaned residual mojibake/PUA blockers by normalizing `apps/web/src/features/match/MatchFocusHandDockActions.tsx`, replacing invalid UTF-8 in `codex/work_orders/007_board_stage_visual_polish.md`, and replacing literal PUA examples in `codex/work_orders/044_match_copy_mojibake_cleanup_text_hygiene_v1.md` with codepoint notation.
- [x] 2026-02-20 WO009-followup-1: integrated classic rules key expansion into runtime typing/URL plumbing by extending `apps/web/src/lib/ruleset_registry.ts` (`classic_custom`, `classic_plus`, `classic_same`, `classic_reverse`, `classic_ace_killer`, `classic_type_ascend`, `classic_type_descend`), adding replay URL `rk`/`cr` support in `apps/web/src/lib/appUrl.ts`, and aligning dependent callers.
- [x] 2026-02-20 WO009-followup-1 verification: `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test -- MatchFocusHandDockActions MintRulesetPicker MatchSetupPanelMint ruleset_discovery appUrl classic_ruleset_visibility matchRulesetParams matchSetupParamPatches matchShareLinks urlParams` (sandbox spawn EPERM once; elevated rerun passed), `pnpm.cmd -C apps/web lint`, and `pnpm.cmd -C apps/web build` all passed.
- [x] 2026-02-20 WO044-followup-4: normalized user-facing copy in `apps/web/src/components/GameResultOverlayMint.tsx` (titles/subtitles/actions/summary icons) and removed hard-coded transition style props via class-based motion tokens.
- [x] 2026-02-20 WO044-followup-4: removed residual PUA/mojibake from reaction visuals by replacing `apps/web/src/components/NyanoReaction.tsx` reaction emoji/badge literals with standard Unicode and cleaning the corrupted header comment block.
- [x] 2026-02-20 WO044-followup-4 verification: `pnpm.cmd -C apps/web test -- motionTransitionTokenGuard NyanoReaction NyanoReactionSlot` (sandbox EPERM once; elevated rerun passed), `pnpm.cmd -C apps/web test --`, `pnpm.cmd -C apps/web lint`, and `pnpm.cmd lint:text` passed.
- [x] 2026-02-21 WO046-followup-10: implemented immediate press-ack feedback foundation in `apps/web/src/styles.css` (`.mint-pressable` + `.mint-hit`) with data-attribute driven 0ms press response, sheen micro-delight, VFX tier gating (`data-vfx=off|low`), and reduced-motion safe fallback.
- [x] 2026-02-21 WO046-followup-10 verification: `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web test -- MintPressable MatchShareActionsRow replayUiHelpers` (sandbox EPERM once; elevated rerun passed), `pnpm.cmd -C apps/web test --`, and `pnpm.cmd -C apps/web build` all passed.
- [x] 2026-02-21 WO046-followup-11: wired share-ready state classing (`mint-share-actions__row--ready`) in `MatchShareActionsRow` and `MatchGuestPostGamePanel`, and added concrete styling for `mint-share-actions*` classes in `apps/web/src/styles.css` (row container, button material, unlock hint/ready chips, and one-shot first-share callout animation gated by VFX/reduced-motion).
- [x] 2026-02-21 WO046-followup-11 tests/verification: `pnpm.cmd -C apps/web test -- MatchShareActionsRow MatchGuestPostGamePanel replayUiHelpers MintPressable` (sandbox EPERM once; elevated rerun passed), `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web test --`, and `pnpm.cmd -C apps/web build` passed.
- [x] 2026-02-21 WO043-followup-1: reduced share-row CLS by unifying mint share guidance into a single persistent status slot in `MatchShareActionsRow` / `MatchGuestPostGamePanel` (`mint-share-actions__status` with hint/ready variants), so finalize state switches no longer mount/unmount different note blocks.
- [x] 2026-02-21 WO043-followup-1: added status-slot sizing in `apps/web/src/styles.css` (`.mint-share-actions__status { min-height: 38px; }`) while keeping existing hint/ready visual variants and one-shot ready emphasis behavior.
- [x] 2026-02-21 WO043-followup-1 verification: `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web test -- MatchShareActionsRow MatchGuestPostGamePanel replayUiHelpers` (sandbox EPERM once; elevated rerun passed), `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web build`, and `pnpm.cmd -C apps/web test --` passed.
- [x] 2026-02-21 WO041-followup-2: tuned Nyano cut-in to stay as “supporting actor” by shortening `resolveReactionCutInTiming` durations (`high: 760/2800`, `mid: 620/2500`, `low: 500/2100` ms) in `apps/web/src/components/NyanoReaction.tsx` and reducing mint cut-in footprint (padding/radius/avatar/text scale) in `apps/web/src/components/NyanoReaction.tsx` + `apps/web/src/mint-theme/mint-theme.css`.
- [x] 2026-02-21 WO041-followup-2: made strong burst banner rarer by gating high-impact burst banner rendering to `vfx=high` only (`showBurstBanner`), preserving reduced-motion and `vfx=off|low` suppression paths.
- [x] 2026-02-21 WO041-followup-2 verification: `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web test -- NyanoReaction.timing motionTransitionTokenGuard` (sandbox EPERM once; elevated rerun passed), `pnpm.cmd -C apps/web lint`, and `pnpm.cmd -C apps/web build` passed.
- [x] 2026-02-21 WO042-followup-1: connected idle guidance to real CTAs by wiring `useIdle` into `apps/web/src/pages/Home.tsx` (hero quick-play button gets `home-hero__cta--idle`) and `apps/web/src/pages/Arena.tsx` (Quick Play button gets `mint-idle-attention`) so only one “next action” target softly breathes per page after inactivity.
- [x] 2026-02-21 WO042-followup-1: refined idle guidance styling in `apps/web/src/styles.css` by making hero CTA shimmer opt-in (`home-hero__cta--idle`), adding shared `mint-idle-attention` breathe keyframes, and enforcing suppression under `prefers-reduced-motion` and `data-vfx=off|low`.
- [x] 2026-02-21 WO042-followup-1 verification: `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web build`, and `pnpm.cmd -C apps/web test --` all passed.
- [x] 2026-02-21 WO042-followup-2: extended idle-only guidance to Deck Studio by wiring `useIdle` into `apps/web/src/pages/Decks.tsx` and applying `mint-idle-attention` only to the primary `Save deck` CTA (disabled while preview loading).
- [x] 2026-02-21 WO042-followup-2 verification: `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web build`, and `pnpm.cmd -C apps/web test --` passed after Decks integration.
- [x] 2026-02-21 WO042-followup-3: extended idle-only guidance into Match play flow by wiring `useIdle` in `apps/web/src/pages/Match.tsx`, adding guarded idle state routing, and connecting visual hooks (`mint-hand-area--idle-guide`, `mint-hand--idle-guide`, `mint-board--idle-guide`, `engine-drop-grid--idle-guide`) through `Match.tsx`, `HandDisplayMint.tsx`, `BattleStageEngine.tsx`, and `mint-theme.css`.
- [x] 2026-02-21 WO042-followup-3 verification: `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web test -- MatchHandInteractionArea` (sandbox spawn EPERM once; elevated rerun passed), `pnpm.cmd -C apps/web test --`, and `pnpm.cmd -C apps/web build` passed.
- [x] 2026-02-21 WO042-followup-4: extracted Match idle-guidance decision branches into `apps/web/src/features/match/matchStageIdleGuidance.ts` (`shouldDisableMatchStageIdleGuidance` / `resolveMatchStageIdleGuidanceTargets`) and switched `apps/web/src/pages/Match.tsx` to consume the shared helpers.
- [x] 2026-02-21 WO042-followup-4 verification: added `apps/web/src/features/match/__tests__/matchStageIdleGuidance.test.ts` and ran `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web test -- matchStageIdleGuidance MatchHandInteractionArea` (sandbox spawn EPERM once; elevated rerun passed), `pnpm.cmd -C apps/web test --`, and `pnpm.cmd -C apps/web build`.
- [x] 2026-02-21 WO043-followup-2: expanded press/hit UX consistency on high-frequency focus actions by adding `mint-pressable mint-hit` to `apps/web/src/features/match/MatchFocusHandDockActions.tsx`, wiring Replay transport/focus button class resolution through `apps/web/src/features/match/replayTransportState.ts`, and applying the resolved classes in `apps/web/src/pages/Replay.tsx` and `apps/web/src/pages/Match.tsx` focus toolbars.
- [x] 2026-02-21 WO043-followup-2 verification: `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test -- MatchFocusHandDockActions replayTransportState replayUiHelpers` (sandbox spawn EPERM once; elevated rerun passed), `pnpm.cmd -C apps/web test --`, and `pnpm.cmd -C apps/web build` passed.
- [x] 2026-02-21 WO043-followup-3: expanded `mint-pressable mint-hit` coverage from stage-focus controls to page-level CTAs in `apps/web/src/pages/Home.tsx`, `apps/web/src/pages/Arena.tsx`, `apps/web/src/pages/Decks.tsx`, and remaining Replay action rows in `apps/web/src/pages/Replay.tsx` to keep press feedback/hit area behavior consistent sitewide.
- [x] 2026-02-21 WO043-followup-3 verification: `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web test -- replayUiActions replayUiHelpers replayTransportState` (sandbox spawn EPERM once; elevated rerun passed), `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test --`, and `pnpm.cmd -C apps/web build` passed.
- [x] 2026-02-21 WO043-followup-4: completed page-wide press/hit consistency sweep by applying `mint-pressable mint-hit` to remaining `btn` actions in `apps/web/src/pages/Match.tsx`, `apps/web/src/pages/Events.tsx`, `apps/web/src/pages/Stream.tsx`, `apps/web/src/pages/Overlay.tsx`, `apps/web/src/pages/Nyano.tsx`, `apps/web/src/pages/Playground.tsx`, `apps/web/src/pages/Rulesets.tsx`, and `apps/web/src/pages/_design/Home.tsx`.
- [x] 2026-02-21 WO043-followup-4 verification: `rg -n -P 'className=\\\"(?=[^\\\"]*\\bbtn\\b)(?![^\\\"]*mint-pressable)[^\\\"]*\\\"' apps/web/src/pages` returned no hits (excluding tests), and `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test --`, `pnpm.cmd -C apps/web build` all passed.
- [x] 2026-02-21 telemetry-followup-1: extended local UX telemetry to include `first_result_ms` / `avg_first_result_ms` (time to first result reveal), wired result capture in `apps/web/src/pages/Match.tsx`, and surfaced the metric in Home telemetry cards + snapshot markdown output.
- [x] 2026-02-21 telemetry-followup-1 verification: `pnpm.cmd -C apps/web test -- telemetry` (sandbox spawn EPERM once; elevated rerun passed), `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test --`, and `pnpm.cmd -C apps/web build` passed.
