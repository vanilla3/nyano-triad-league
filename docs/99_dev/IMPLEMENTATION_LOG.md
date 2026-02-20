# ???????

> 1???????1??????????????????hy/What/Verify????
## 2026-02-13 ??WO005-B follow-up: responsive stage secondary controls

### Why
- Stage focus???????????????????????????????????????????????????????????????????????????????????????????????????????????????- Stage???????????????????????????????????????????? resize????????????????
### What
- `apps/web/src/lib/stage_layout.ts`
  - `shouldShowStageSecondaryControls` ???????????????????????????????????????????????????????- `apps/web/src/lib/__tests__/stage_layout.test.ts`
  - ????????????????????????90/768/769/NaN?????????- `apps/web/src/pages/Match.tsx`
  - Stage controls ?????????/????????????????????  - resize????????????????????????????? manual override ???????????????????????- `apps/web/src/pages/Replay.tsx`
  - Stage transport controls ??????? resize????+ manual override ????????- `apps/web/e2e/stage-focus.spec.ts`
  - mobile `replay-stage` ?? controls ????????????????????  - `Show controls` ??????????????????????????  - 375px ??`battle-stage` ?? Commit ???????viewport ???????????????????  - 375px ?????????????????????????????????????????  - game index / RPC ?????????`replay-stage` ?? `Load replay` / `Retry load` / `Clear share params` ?????????????????????????????????????????- `apps/web/src/lib/ai/turn_timing.ts`
  - AI?????????????????????????ase/turn-step/difficulty/jitter ????????????  - ????????????????????????????????????????????????????- `apps/web/src/lib/ai/__tests__/turn_timing.test.ts`
  - baseline ?? upper bound ?????????????????????????????????????- `apps/web/src/components/NyanoReaction.tsx`
  - `reduced-motion` ?? `data-vfx`??ff/low/medium/high???????? cut-in timing ???????  - `vfx=off` / reduced-motion ??? burst ???? + ???????????????????????????????  - `vfx=low` ??? impact ???????? burst ?????????- `apps/web/src/components/__tests__/NyanoReaction.timing.test.ts`
  - reduced-motion / vfx off / vfx low / vfx high ?? timing ???????????- `apps/web/src/lib/demo_decks.ts`
  - `buildEmergencyGuestFallbackData` ??????????ndex??????? guest 5v5 ????????????- `apps/web/src/pages/Match.tsx`
  - Game Index ???????????uest mode ??????????????????????????????????????  - `error/status` ?? toast ?????????????????????????- `apps/web/src/lib/__tests__/demo_decks.test.ts`
  - ????????????????????????????v5/10??map?????????- `apps/web/e2e/stage-focus.spec.ts`
  - battle-stage guest ?? index ????????????????????????????????????????????
### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
- `pnpm -C apps/web test -- src/lib/ai/__tests__/turn_timing.test.ts`
- `pnpm -C apps/web test -- src/components/__tests__/NyanoReaction.timing.test.ts`
- `pnpm -C apps/web test -- src/lib/__tests__/demo_decks.test.ts`

## 2026-02-13 ??WO005-A follow-up: Stage route canonicalization + smoke coverage

### Why
- `/battle-stage` `/replay-stage` ????????????????????????????????????????????????????????????????????????- Stage????????????????????E2E ????????????????????RL????????????????????????????????????????
### What
- `apps/web/src/lib/stage_focus_params.ts` ??????:
  - `ui=engine` ??????focus=1` ???????egacy `layout` ??????????????- `apps/web/src/pages/BattleStage.tsx` / `apps/web/src/pages/ReplayStage.tsx`:
  - ?????????? `useEffect` ?????????????????? `normalizeStageFocusParams` ????????- `apps/web/src/lib/__tests__/stage_focus_params.test.ts` ??????:
  - ??????????egacy `layout=focus` ??????focus=focus` ???????o-op ??????????????- `apps/web/e2e/stage-focus.spec.ts` ??????:
  - `/battle-stage` `/replay-stage` ??URL?????????????I??and Dock / replay focus guard??????????????
### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`

## 2026-02-13 ??WO005-A: Stage UI/UX foundation (viewport fit + hierarchy)

### Why
- `/battle-stage` ?? `/replay-stage` ?? Pixi ??????????????????????C?????????????????????????????????????????????- AGENTS/Work Order?????????????tage-first?? UI/UX ????????????? + 1??????????????????????????????????
### What
- `codex/execplans/005_uiux_foundation.md` ????????????ilestone A ??????????????????- `apps/web/src/lib/stage_layout.ts` ??????:
  - viewport ?? stage??????attle/replay?????`maxWidthPx` / `minHeightPx` ???????- `apps/web/src/lib/__tests__/stage_layout.test.ts` ??????:
  - desktop/mobile/invalid????????????????- `apps/web/src/pages/Match.tsx`:
  - battle-stage ?? viewport?????????????????  - stage????????????????????oot/toolbar/arena/board/cutin/dock?????????  - stage route???? desktop quick-commit ???????????????- `apps/web/src/pages/Replay.tsx`:
  - replay-stage ?? viewport?????????????????  - stage????????????????????oot/toolbar/cutin/arena-inner?????????- `apps/web/src/styles.css`:
  - stage shell/panel ????????????????????- `apps/web/src/mint-theme/mint-theme.css`:
  - `stage-focus-*` ?? `mint-focus-hand-dock--stage` ?????????????????????????????????????????????
### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e -- smoke.spec.ts`


## 2026-02-01 ??commit-0002

### Why
- ???ZIP?????????nyano-triad-league-starter/` ?????????????????????????????????????????????- ??????????????????????? **matchId??????** ????SON???????????????????Solidity ???????????????????????????????- Design v2.0 ?? Layer2??ACTICS?????????? **?????????** ????????????????????????????????????????????????
### What
- `packages/triad-engine` ????????????????????tarter????????????- Transcript v1 ?? matchId ??`keccak256(abi.encode(...))` ????? **????BI??????????* ???????S???????????- Layer2??????????????????????3??????????????????????????riad-1????- ??????????????????????????????????????????????????/?????????- `TRANSCRIPT_SPEC` ??????BI?????????????????- CI??ockfile??????????????????? `--frozen-lockfile` ????????????
### Verify
- `pnpm -C packages/triad-engine test`
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` ?? `docs/02_protocol/Nyano_Triad_League_TRANSCRIPT_SPEC_v1_ja.md` ??????????

## 2026-02-01 ??commit-0003

### Why
- Design v2.0 ?? Layer2??ACTICS??????????????????? **????????????** ?????????????????????????????????????????????????- ?????????????????????????????????????????? **?????????????????????????* ???????????????????????????????????????????????????????????- ??????????????????????????????????RC-6551??BA????????????????**????????????* ??????????????????????????????????????????
### What
- TS?????????? **????????????** ????????  - `comboCount = 1???????+ flipCount??????????????????????????????
  - 3: Momentum?????????????????????+1??  - 4: Domination?????????????????????+2??  - 5+: Nyano Fever????????????????????????????????????- ????????????? `turns: TurnSummary[]` ??????????I/????? ????????????????????????????????- ????????????????????omentum ??????????????????? +1 ????????????????????- `RULESET_CONFIG_SPEC` ?? `TRANSCRIPT_SPEC` ?????????????????????????????????????- ????????????? `ERC6551_and_Staking_Notes_v1_ja.md` ????????BA/?????????????????????????????????
### Verify
- `pnpm -C packages/triad-engine test`
- ?????????docs/02_protocol/*` ?? `docs/99_dev/*` ??????????

## 2026-02-01 ??commit-0004

### Why
- Layer2???????????/????????????/?????????????????????????????????? ON/OFF ?????????????????????????????????????????????????????????????- ???????????????v2.0 ??????????????????????????????+1 ?????????????1???????????????????????????????????????????????- ??????????? Triad ????? or 1???????????????????????????????????????????????????1?????????????????????
### What
- `RulesetConfigV1`??ngine-side subset??????????simulateMatchV1(..., ruleset)` ????????????????????????????? `DEFAULT_RULESET_CONFIG_V1`????- ???????????  - ruleset?? `enabled` ??????????????????? transcript ??????????????????  - ?????????`maxUsesPerPlayer` ???????????????? `secondPlayerExtraUses` ????????????????  - Triad????? **0??..10????????????* ??v1?????????? types/spec ????????- ??????????????  - ruleset?? `enabled` ????????????????????/??????????????????????????????2??????????????????- ?????????  - ruleset?? `secondPlayerBalance.firstMoveTriadPlus` ?????????????????????????+X????????????- ???????????  - ??????+1 ??????????????????????????????  - ???????????????? +1 ???????????????????????throw?????????
### Verify
- `pnpm -C packages/triad-engine test`
- ????????????????docs/02_protocol/Nyano_Triad_League_RULESET_CONFIG_SPEC_v1_ja.md` / `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` ??????????
---

## Commit0005 ??Layer3??ynergy / Trait????v1??
- ??????packages/triad-engine` ?? TraitEffectsConfig ??????????1??Trait??????????????????- ????/?????????????  - `docs/02_protocol/Nyano_Triad_League_RULESET_CONFIG_SPEC_v1_ja.md`??S shape ???????????????  - `docs/02_protocol/Nyano_Triad_League_TRANSCRIPT_SPEC_v1_ja.md`??arth?????????????????????  - `docs/02_protocol/Nyano_Triad_League_TRAIT_EFFECTS_SPEC_v1_ja.md`???????rait????????????
### ???????rait??1??- Cosmic??????? allTriad +1
- Light????????? allTriad +1????????????????- Shadow??????????? debuff ???????????????????- Forest?????????????????1?????????hield??- Metal?????????????????????
- Flame??riad??????????????????????????????Flame????????????- Aqua?????????????????????????? `min(edgeA, edgeB)` ??????- Thunder?????????????????? -1????????apture?????????- Wind?????/?????????ranscript??firstPlayer????????- Earth????????+2 / ???? -1??earthBoostEdge`??equireChoice????true??
### ??????????????????
- Shadow ????????????????????????
- Forest shield ????????????????????????????
- Earth ??????????????????????
- Thunder ??????????
- Light ??????????????????????????

### ????????
- Nyano Peace ????????????????? ??TraitType ????????????????SON???????????????????- Formation bonuses??ayer3??????

## 2026-02-02 ??commit-0006

### Why
- Layer3??rait???????????????????????????????????????yano Peace ????????????? Trait??lassId/seasonId/rarity????????????TraitType??0????????????????????????- ?????????????????????????????????I??????????????? **replay / ?????????????????????????**?????- ???????lass/season/rarity ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
### What
- `RulesetConfigV1.synergy.traitDerivation`??yanoTraitDerivationConfigV1?????????- TS???????? Nyano??????????????packages/triad-engine/src/nyano.ts`????  - `DEFAULT_NYANO_TRAIT_DERIVATION_CONFIG_V1`
  - `deriveTraitTypeFromNyanoTraitV1(...)`
  - `makeCardDataFromNyano(...)`??n-chain read ??CardData ??????????- ????????????????????? `traitDerivation` ???????????????????????????????????- ??????????Nyano_Triad_League_TRAIT_DERIVATION_SPEC_v1_ja.md`
- ?????????????uleset/transcript/trait-effects ??????????????????????????????- ???????????arity????????????? `makeCardDataFromNyano` ??????????????????????
### Verify
- `pnpm -C packages/triad-engine test`
- `pnpm -C packages/triad-engine build`
- `docs/02_protocol/*` / `docs/99_dev/*` ??????????
## 2026-02-02 ??commit-0007

### Why
- Design v2.0 ???????????????????????????.3.3????????????????????????????????????????????????????????????????????????????????????- ????Season 3 ????????????????????3??/ Light+Shadow=??????????????????????????????ayer4??? **?????????????* ??????????????????????????????- ??????????????????????????????????????????????????????????????????formation????????????????????????????????????
### What
- `RulesetConfigV1.synergy.formationBonuses` ????????ata-driven????- v1?????????????????????formation????????  - **??????????ive Elements Harmony??*??    - ??????lame/Aqua/Earth/Wind/Thunder ???????????
    - ??????omboBonus??omentum/Domination??? triadPlus ??`comboBonusScale` ??  - **??????clipse??*??    - ??????ight ?? Shadow ???????????
    - ??????uleset??ON/OFF????????      - Light????????????? -1 ???????      - Shadow??Light??????????????ight aura ?????????
- `MatchResult.formations` ??????????I/????? ????????????????????????????????- ??????????  - `Nyano_Triad_League_FORMATION_BONUS_SPEC_v1_ja.md`
- ??????????????  - ruleset spec / transcript spec ??formation ???????????????- ???????????  - ???????????? comboBonus ??????????????????????????????
  - ???????? Light ????????????????????triad ?????????????

### Verify
- `pnpm -C packages/triad-engine test`
- `pnpm -C packages/triad-engine build`
- ??????????docs/02_protocol/*` / `docs/99_dev/*` ??????????
## 2026-02-02 ??commit-0008

### Why
- ?????????????????????????????????????????????ruleset ??**???????????**???????????????- JSON?????????????????????????????????????????????????????Unicode????? **???????????????ID?????* ????????- ???????????????? RulesetRegistry ?????????????olidity???????ID?????????????? fixed ABI encoding???????????
### What
- `computeRulesetIdV1(ruleset)` ????????S???????????  - `rulesetId = keccak256(abi.encode(RulesetConfigV1Canonical))` ???????  - ?????????????????nabled=false??? **??????????????**?????????ID??????????????  - ????????? `requiredElements` ????????????????*?????????*??ode???????????????- ??????????  - `Nyano_Triad_League_RULESET_ID_SPEC_v1_ja.md`
  - RULESET_CONFIG_SPEC / TRANSCRIPT_SPEC ?????????- ???????????  - default rulesetId ?? test vector ?????  - ??????????????????????????????????
  - requiredElements ???????ID??????????????

### Verify
- `pnpm -C packages/triad-engine test`
- `pnpm -C packages/triad-engine build`
- ??????????docs/02_protocol/*` / `docs/99_dev/*` ??????????

## 2026-02-08 ??commit-0083: /stream parser?????????????????
### Why
- Stream.tsx ?? 9 ?????????????????riad_vote_utils / triad_viewer_command ??????????????????????????- `parseChatMove()` ?????????????????parseViewerMoveTextLoose()` ????????????????????????????????????????
### What
- `triad_viewer_command.ts` ?? `parseChatMoveLoose()` ????????anonical / legacy / shorthand ??????`formatViewerMoveText()` ???????????????????- Stream.tsx ??? 9 ?????????????????riad_vote_utils / triad_viewer_command ?? import ????????- `parseChatMove()` ??`parseChatMoveLoose()` ????????ParsedMove` ????`ViewerMove` ????????- `buildStateJsonContent()` / `buildAiPrompt()` ??`computeStrictAllowed()` / `computeToPlay()` ???????- Match.tsx ??????????????????+201C/U+201D????????????????????
### Verify
- `pnpm build:web` ???


## 2026-02-08 ??commit-0084: ?????????????? + flip???????????

### Why
- ?????????arudo????????/???????????? toast ??????????????????????????????????????????- Overlay ?? flip ????????????? flipStats ???????urnLog ?? FlipTraceBadges ????????????????
### What
- StreamOperationsHUD ?? `ExternalResult` ??? `ExternalStatusRow` ???????????????????- Stream.tsx ?? `lastExternalResult` state ????????sendNyanoWarudo()` ???????- `OverlayStateV1` ?? `externalStatus` ???????????????????????????- Overlay.tsx ????? flipStats ????? ??`FlipTraceBadges` ???????????????????- Overlay.tsx ????? "Why:" ?????????? ??`flipTracesSummary()` ????????
### Verify
- `pnpm build:web` ???


## 2026-02-08 ??commit-0085: Overlay HUD ?????? + UI ??????????????

### Why
- OBS controls=0 ??????? 720p/1080p ????????????????????????????????????- ??????????????????????????????????????????????????????
### What
- ScoreBar ?? `size` prop ????????sm" | "md" | "lg"????- Overlay OBS ???????????????????????????????0px??2px, 11px??2px, xs??m, sm??ase????- ???????? `bg-white/70` ??`bg-white/90`??BS ??????????- toPlay ??????`to-play-pill` ?????????????????????????????????????- ??????????????????????????????????gap ??OBS ?????????????- index.css ?? `vote-countdown-inline`, `to-play-pill` CSS ???????????????????
### Verify
- `pnpm build:web` ???


## 2026-02-12 ??commit-0086: Quick Play ??????????????????ome??????????
### Why
- UX ????????????B-1??ome ?????????????10????????????????????????????????????????????- ????? `first_place_ms` ?? Match ????????????????ome CTA ?????????????????????????????????
### What
- `telemetry.ts` ?? `quickplay_to_first_place_ms` ????????ession + Cumulative ????????- Home ?????? ?????????????? `markQuickPlayStart()` ?????????atch ?????????????????????????????????????- Home > Settings ?? UX Telemetry ??????? `Avg quick-play to first place` ????????????- ???????????  - Home ????????????????????????
  - ????????????????????????
- ????????????????  - `UX_SCORECARD` ?? B-1 ???????????????????
  - ?????????????? `quickplay_to_first_place_ms` ??????

### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`


## 2026-02-12 ??commit-0087: Home LCP ??????????????????-3??
### Why
- UX ????????????G-3??CP < 2.5s?????????????????????????????????????- ????? Home Settings ????????????????????????????????????????????????????????
### What
- `telemetry.ts` ?? cumulative stats ?? `avg_home_lcp_ms` ????????- `recordHomeLcpMs()` ??????????ome ??????? LCP ???????????????????????????- Home ?? `PerformanceObserver`??largest-contentful-paint`??????????visibilitychange/pagehide` ??6 ?????????????????????- Home > Settings ????????????? `Avg Home LCP` ????????- ???????????  - Home LCP ?????????  - ????????aN / ???? / Infinity?????????????- `UX_SCORECARD` ?????????-3 ????????????????????
### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`


## 2026-02-12 ??commit-0088: UX???????????????????? + quick-play???????????
### Why
- ??????????????????????????????????????????????????????????????????????????????????????- `quickplay_to_first_place_ms` ??????????????????????????????????????????????????????????????????????????
### What
- `telemetry.ts` ?? `evaluateUxTargets(stats)` ??????????-1/B-1/B-4/G-3 ?? PASS/FAIL/INSUFFICIENT ????????????????- Home > Settings ?? `UX Target Snapshot` ????????????????????????????????????????????- quick-play ???????????0?????????????????????????????????????????????????- ???????????  - stale quick-play marker ???????????
  - `evaluateUxTargets` ?? insufficient ????  - pass/fail ????????????????
### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`


## 2026-02-12 ??commit-0089: UX???????????????????+ Playtest Log ??????

### Why
- ???????????????????????????????UX_SCORECARD` ???????????????????????????????????????- ??????????????????????????????????????????????I???1???????????????????????
### What
- `telemetry.ts` ?????????????  - `buildUxTelemetrySnapshot(stats)`??imestamp + stats + target checks??  - `formatUxTelemetrySnapshotMarkdown(snapshot)`??PLAYTEST_LOG.md` ?????????????- Home Settings ?? `UX Telemetry` ?? `Copy Snapshot` ?????????????  - ????????? markdown ???????????????????????docs/ux/PLAYTEST_LOG.md` ??????????????????- `docs/ux/PLAYTEST_LOG.md` ?????????????????????????????- `UX_SCORECARD` ???????????????????????????????????- ???????????  - snapshot ????? timestamp/shape
  - markdown ????????

### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`


## 2026-02-12 ??commit-0090: lint warning 0 ????eb??
### Why
- `pnpm -C apps/web lint` ?????? warning ???????????????????????????????????????????- warning ???????????????warning ???????????????????????????????????
### What
- `apps/web/src/engine/renderers/pixi/cellAnimations.ts`
  - ????????? `cellH` ??`_cellH` ???????PI???????????? lint ???????- `apps/web/src/engine/__tests__/cellAnimations.test.ts`
  - ??????????import `CellAnimFrame` ???????
### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`


## 2026-02-12 ??commit-0091: UX snapshot ?????????????????????

### Why
- ??????????????????????????????????????????????napshot??????????????????????????????- `PLAYTEST_LOG.md` ???????????????????????????????????????????????????????????
### What
- `telemetry.ts` ?? `UxTelemetryContext` ??????????napshot?? `context` ???????????????????- `formatUxTelemetrySnapshotMarkdown()` ?????????route / viewport / language / userAgent` ?????????????????- Home ?? `Copy Snapshot` ????????????????????? snapshot ???????????????????- `PLAYTEST_LOG.md` ?????????? context ?????????- ???????????  - context ??? snapshot ???
  - markdown ?? context ????- e2e `home.spec.ts` ?????????ettings ??? `Copy Snapshot` / `UX Target Snapshot` ??????????????????????
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
- Commit0112 ?????????? import UI ????????????????????????????????????????????- pointsDelta ??`settled_attested` ????????????????????????????? record ????????????????????????- ????? season points ?????????????fast import` ?? `verified import` ????????????????????????
### What
- `apps/web/src/lib/settled_points_import.ts`
  - `parseVerifiedLadderRecordsImportJson(...)` ????????  - payload ????`{ domain, records }` ??????????verifyLadderMatchRecordV1(...)` ?? record ???????????  - issue code `attestation_invalid` ????????????????????????????  - duplicate ????????????`pushUniqueSettledEvent(...)` ?????????- `apps/web/src/lib/__tests__/settled_points_import.test.ts`
  - verified import ?? schema ????????????attestation ?????????????????- `apps/web/src/pages/Events.tsx`
  - import mode ??? UI ????????    - `Settled events (fast)`
    - `Verified records (domain + signatures)`
  - `/game/settled_events.json` ?????????????????????  - mode ??????? parser ?????????????apply ??????? local attempts ???????- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0113 ????????????oing ????????????????????????????????????????????
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/settled_points_import.test.ts`
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`

## 2026-02-13 - commit-0112: settled event JSON import for local pointsDelta migration

### Why
- DEV_TODO ?? Doing ??????hase 4 ?? pointsDelta ??????URL ????????`on-chain settled event` ?????????????????????????- ??????????? Replay URL ?? `pda` ???????????????settled event ???????????????????????eason points ???????????????????- ????????????? event attempts ?????????????? `pointsDeltaA` ??????????????matchId` ?????????????winner / tiles ???????????????????????
### What
- `apps/web/src/lib/settled_points_import.ts` ????????  - ????schema ????
    - settled event ???
    - `{ settledEvents: [...] }`
    - `{ records: [{ settled: ... }] }`
  - `validateLadderMatchSettledEventV1(...)` ???????? settled event ????????  - `matchId` ??????????????????duplicate ??issue ???????????  - `applySettledPointsToAttempts(...)` ?????????? attempt ??????:
    - no local / winner mismatch / tiles mismatch / draw ??????????????
    - ???????attempt ???? `pointsDeltaA` + `pointsDeltaSource=settled_attested` ?????
- `apps/web/src/pages/Events.tsx`
  - `Settled points import (local)` UI ????????SON??????????????????????????  - import ??????????nput/valid/updated/matched/unchanged/no-local/mismatch??? issue ????????????????  - `Apply settled JSON` ??????????????? attempt ??`upsertEventAttempt(...)` ?????????  - My Pawprints ?????? `deltaA` ?????????????????- `apps/web/src/lib/__tests__/settled_points_import.test.ts`
  - parse?????schema???duplicate conflict??apply??????????/????????????????????????????- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0112 ????????????oing ???????????????????????????????????????
### Verify
- `pnpm -C apps/web test -- src/lib/__tests__/settled_points_import.test.ts`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`

## 2026-02-13 - commit-0111: phased pointsDelta integration for season progress

### Why
- DEV_TODO ?? Doing??ointsDelta ??????????????????????????? season points ?? provisional ??????????????????- on-chain settled event ??????????????????pointsDeltaA` ????????????????????????????????????????????????????- ????????????????????????????????????????????????????????????????????????????
### What
- `apps/web/src/lib/event_attempts.ts`
  - `EventAttemptV1` ?? optional `pointsDeltaA` / `pointsDeltaSource` ????????- `apps/web/src/lib/appUrl.ts`
  - replay share URL ?? `pda`??ointsDeltaA?????????????????????- `apps/web/src/pages/Replay.tsx`
  - `?pda=` ??int32 ????????  - Event attempt ??????? `pointsDeltaA` ???????  - share/canonical link ????`pda` ????????- `apps/web/src/lib/season_archive.ts`
  - event????? `pointsDeltaTotal` / `pointsDeltaAttemptCount` / `pointsDeltaCoveragePercent` ????????  - archive markdown ?? delta ?????????- `apps/web/src/lib/season_progress.ts`
  - source ??????provisional` / `points_delta`?????????  - event??? `pointsDeltaA` ??00%???????????? `points_delta` ????????????? provisional ??????  - source mix ????? markdown ???????????- `apps/web/src/pages/Events.tsx`
  - progress ??????? source mix ????????????  - board ?? source badge??elta/provisional??? coverage ????????????  - event??? delta total / coverage ????????- Tests
  - `apps/web/src/lib/__tests__/appUrl.test.ts`
  - `apps/web/src/lib/__tests__/season_archive.test.ts`
  - `apps/web/src/lib/__tests__/season_progress.test.ts`
  - pointsDelta ??????????????????????????????
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web test -- src/lib/__tests__/appUrl.test.ts src/lib/__tests__/season_archive.test.ts src/lib/__tests__/season_progress.test.ts`
  - ????????????? `vite/vitest` ??????? `spawn EPERM` ?????????

## 2026-02-13 - commit-0110: local season points and reward-tier guidance on /events

### Why
- Phase 4 ?????????????????????????????????/????/??????????????????????rchive ?????????????ranking/reward ???????????????????- ????? on-chain `pointsDelta` ???????????????????????????????????????????????????????????????????????????- ????????????UI ???????????????? pointsDelta ??????????????????????ure function ???????????????????????
### What
- `apps/web/src/lib/season_progress.ts` ????????  - `Win +3 / Loss +1 / Event clear +2` ?????????? points ?????????????  - reward tier??ookie/Bronze/Silver/Gold/Legend????????????  - event?? points board ??????? tie-break ???????  - progress markdown ???????????- `apps/web/src/pages/Events.tsx`
  - `Local season points (provisional)` ?????????????ier / next / progress bar / hint????  - `Season points board`??vent???????????  - `Copy summary` ??archive + progress ????????????????- `apps/web/src/lib/__tests__/season_progress.test.ts`
  - points?????ier??????ie-break??arkdown ???????????- Docs
  - `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` ?? Commit0110 ????????  - `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md` ?? Phase 4 ???????????
### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`

## 2026-02-12 - commit-0107: phase4 onboarding quickstart (Home checklist + Match progress sync)

### Why
- Phase 4 ???????????????????????????????????????????????????????????????????- ??????????????????????????????????????????????1?????????????????????????????????
### What
- `apps/web/src/lib/onboarding.ts` ???????????  - ?????????????read_quick_guide` / `start_first_match` / `commit_first_move`?????????  - localStorage ???????????????????????????????????eset ????????- `apps/web/src/lib/__tests__/onboarding.test.ts` ???????????  - ?????????????????????????????????payload fallback??eset ????????- `apps/web/src/pages/Home.tsx`
  - ??????????1???????????????????????I????????  - 1???????????????????????????????? `read_quick_guide` ???????  - ???????????????? `start_first_match` ??????????????????????????????- `apps/web/src/pages/Match.tsx`
  - guest match ??????? `start_first_match` ???????  - ?????????????????????????turns.length >= 1`??? `commit_first_move` ???????- `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md`
  - Phase 4 ?????????????????????????????????????????????- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0107 ?????????oing ???????????????????
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web test -- src/lib/__tests__/onboarding.test.ts`
  - ????????????? `vite/vitest` ??????? `spawn EPERM` ?????????????

## 2026-02-12 - commit-0108: stream moderation controls (NG words / ban / slow mode)

### Why
- Phase 4 ??????????????????????????????G????????AN?????????????????????? `/stream` ??????????????- ????anti-spam??????????????????????????????????????????????????????????????????????
### What
- `apps/web/src/lib/stream_moderation.ts` ???????????  - BAN ??????G???????????low mode ????? pure function ????  - comma/newline ?????????????????????????????????????????????- `apps/web/src/pages/Stream.tsx`
  - moderation ????state ????????low mode ??? / banned users / blocked words????  - localStorage ?????????????stream.moderation.*`????  - `addVoteFromChat` ???????? moderation ?????????:
    - banned user reject
    - blocked word reject
    - slow mode reject
  - vote audit ?? `banned/ng-word/slow` ?? reject ????????????????- `apps/web/src/components/stream/VoteControlPanel.tsx`
  - Moderation UI??low mode?????BAN list??NG words?????????  - audit ?????? moderation reject ????????????- `apps/web/src/lib/local_settings.ts`
  - moderation ????? read/write ????????????- Tests:
  - `apps/web/src/lib/__tests__/stream_moderation.test.ts` ????????  - `apps/web/src/lib/__tests__/local_settings.test.ts` ?? moderation roundtrip ????????- Docs:
  - `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md` ?? Phase 4 moderation ????????????????  - `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` ?? Commit0108 ????????
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web test -- src/lib/__tests__/stream_moderation.test.ts src/lib/__tests__/local_settings.test.ts`
  - ????????????? `vite/vitest` ??????? `spawn EPERM` ?????????????

## 2026-02-12 - commit-0105: permissionless ladder format v1 (record verify + deterministic standings)

### Why
- DEV_TODO ????????????????????????????????????????????????????????????????????????????????- transcript / settled event / ?????3??????????????????????????????????????????????????????????????????- indexer???????????????????????????????tie-break??????????????????????????????
### What
- `packages/triad-engine/src/ladder.ts` ???????????  - `LadderMatchAttestationV1`??IP-712?????????    - typed-data payload / digest / signer recover / signature verify ????????  - `LadderMatchRecordV1` ????????????    - `hashTranscriptV1(transcript) == settled.matchId` ?????????    - transcript header ?? settled event ?? ruleset/season/player ????????????    - playerA/playerB ?????????????????????  - `buildLadderStandingsV1(...)` ????????    - source??????hainId:blockNumber:txHash:logIndex????????????    - ????source??????????????reject??    - points / wins / draws / losses / tileDiff ???????    - tie-break?????????oints desc ??wins desc ??tileDiff desc ??losses asc ??address asc????- `packages/triad-engine/src/index.ts`
  - `ladder` ??????????????????- `packages/triad-engine/test/ladder.test.js`
  - ????????ranscript????????????????????????????onflicting duplicate rejection?????ie-break????????????- `docs/02_protocol/Nyano_Triad_League_LADDER_FORMAT_SPEC_v1_ja.md`
  - ladder v1 ???????????????????????????- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - ladder????????????????
### Verify
- `pnpm -C packages/triad-engine lint`
- `pnpm -C packages/triad-engine build`
- `pnpm -C packages/triad-engine test`??????????????? `node:test` ??`spawn EPERM` ??????????????- `node -e ...` ?? ladder ????????????standings????????????????????????
## 2026-02-12 - commit-0106: phase3 hardening (web error tracking + release runbook)

### Why
- Phase 3 ???????????????????????????? / ?????????????????????????????????????????????????????????????- ????????????????????????????????????????????????????????????????
### What
- `apps/web/src/lib/error_tracking.ts` ???????????  - global `error` / `unhandledrejection` ???????????????????????  - sink ?????????????local` / `console` / `remote`????  - localStorage ?????????????????0??????????????  - env ????
    - `VITE_ERROR_TRACKING_MODE`
    - `VITE_ERROR_TRACKING_ENDPOINT`
    - `VITE_ERROR_TRACKING_MAX_EVENTS`
    - `VITE_APP_RELEASE`
- `apps/web/src/main.tsx`
  - `installGlobalErrorTracking()` ??????????????- `apps/web/src/lib/__tests__/error_tracking.test.ts`
  - sink??????????????????????????????????????onsole sink ????????- `package.json`
  - `release:check` ?????????????????ngine lint/build + web typecheck/lint/build????- `docs/99_dev/RELEASE_RUNBOOK_v1_ja.md`
  - versioning / changelog / rollback / feature flag / release check ????????- `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md`
  - Phase 3 ????????????????????????- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0106 ?????????oing ???????????????????
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/error_tracking.test.ts`
  - ????????????? `vite/vitest` ??????? `spawn EPERM` ?????????????

## 2026-02-12 - commit-0096: first-player flow adoption (committed mutual + web seed mode)

### Why
- `resolveFirstPlayerV1` ?????????????????????????????ommit??????????????????????????- web ???? first-player UI ?? `manual / mutual / commit_reveal` ??3?????????????eed ??????????????????????????
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
- Engine???? `committed_mutual_choice` ??????????????????eb Match UI ??????????????????????????- ????????????????ommit???????????????????????????????RL???????????UI????????????????????????????????
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
- web ?? `first_player_resolve` ??engine ????????????????????????????????????????????????????????????????????- `commit_reveal` ?????commit???????????????????????????????ngine????????????????????????????
### What
- `apps/web/src/lib/first_player_resolve.ts`
  - `resolveFirstPlayerV1(...)` ????????????????:
    - `mutual` ??`mode: "mutual_choice"`
    - `seed` ??`mode: "seed"`
    - `committed_mutual_choice` ??`mode: "committed_mutual_choice"`
    - `commit_reveal` ??`mode: "commit_reveal"`
  - `commit_reveal` ??commit??????????:
    - commitA/commitB ????????????????????????    - ????????????? engine resolver ?? commit pair ????????  - ????? UI ?????????????????????anual fallback + error??????????????- `apps/web/src/lib/__tests__/first_player_resolve.test.ts`
  - `commit_reveal` ????????????????????commit????????????????????  - ???commit???????????? reject ???????????????
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/first_player_resolve.test.ts`
- `pnpm -C apps/web build`

## 2026-02-12 - commit-0099: Match first-player params update hardening (atomic URL updates)

### Why
- `Match.tsx` ?? first-player ??????????? `setParam(...)` ?????????????????????RL???????????????????????????????????????- `commit_reveal` / `committed_mutual_choice` ???????????I????????????????????????????????????????????
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
- ????????????????????????????????????????????????????????????????????????????????????? invalid ????????????????- `seed / commit_reveal / committed_mutual_choice` ??????????????????????????????????????????????????????????????
### What
- `apps/web/src/lib/first_player_params.ts`
  - Added `buildFirstPlayerModeDefaultParamPatch(mode, current, randomBytes32Hex)`.
  - Mode switch default-fill behavior:
    - `manual`: `fp` ??0/1 ???????
    - `mutual`: `fpa/fpb` ??0/1 ???????
    - `seed`: `fps/fpsd` ??bytes32 ?????????????????    - `commit_reveal`: `fps/fra/frb` ????????????fca/fcb` ????????
    - `committed_mutual_choice`: `fps/fpna/fpnb` ??????????fpoa/fpob` ????????????????fpa/fpb` ???????fcoa/fcob` ??????
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
- first-player ??????????? URL ??????????????????????????????????????????????????????????????????????????- mode transition ????????????????? + ?????????????????????????RL???????UX??????????
### What
- `apps/web/e2e/match-first-player.spec.ts` ???????????  - Case 1: `manual` ??`commit_reveal`
    - `fps/fra/frb` ??bytes32 ??????????
    - `fpsd` / committed-mutual??????????????????????????
  - Case 2: `commit_reveal` ??`committed_mutual_choice`
    - `fps/fpna/fpnb` ??bytes32 ??????????
    - `fpa/fpb` ???????????????
    - `fpoa/fpob` ????????????????????
    - `fra/frb/fca/fcb/fpsd` ???????????????

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
- `NyanoCardArt` ?? gateway fallback ???????????? placeholder ???????????????????????????????????????????????- ??? URL ????????????????????????????????????????????????????????????????? cache-busting ?????????????
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
- DEV_TODO ????????????????????????????????uleset proposal / vote / adopt??????????????????- ??????????????????????????????????????????????????????????????????????????????????- ?????????IP-712??????????????????????????????? TS ??????????????????????
### What
- `packages/triad-engine/src/season_council.ts` ???????????  - Proposal:
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
      - ???? voter ?????? nonce ????
      - ???? nonce ???????????
      - proposal?????? / ?????? / ??????? reject
      - ????? `rulesetId` ????? tie-break
    - `adoptSeasonCouncilRulesetV1(...)`
      - quorum ????+ winner ????????????- `packages/triad-engine/src/index.ts`
  - `season_council` ??????????????????- `packages/triad-engine/test/season_council.test.js`
  - proposalId canonicalization??ote hash ????????IP-712 sign/verify/recover??once ??????ally/adopt ????????????????- `docs/02_protocol/Nyano_Triad_League_SEASON_COUNCIL_SPEC_v1_ja.md`
  - v1 ???????????????????????????roposal/vote/adopt??eterministic rule??IP-712 ??????- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Wind??????????????????  - ?????????????????????????????????  - Doing ????????? format ?????????????
### Verify
- `pnpm -C packages/triad-engine lint`
- `pnpm -C packages/triad-engine test`
## 2026-02-13 ??WO005-H follow-up: Pixi texture failure status + retry controls

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
## 2026-02-13 ??WO005-I follow-up: auto fallback to Mint board when Pixi/WebGL init fails

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
## 2026-02-13 ??WO005-J follow-up: replay-stage WebGL fallback e2e coverage

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
## 2026-02-13 ??WO005-L follow-up: replay toolbar quick transport in stage focus

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
## 2026-02-13 ??WO005-M follow-up: battle toolbar warning mark selector

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
## 2026-02-13 ??WO005-N follow-up: stage toolbar guidance hints

### Why
- As top toolbar actions expanded on battle/replay stage routes, first-time users still needed quick guidance for how to use this row.
- We wanted persistent but low-noise hints in the same action zone, with e2e protection against accidental regressions.

### What
- `apps/web/src/pages/Match.tsx`
  - Added `Battle focus toolbar hint` text in the top battle action group:
    - `tap or drag to board, then commit`.
- `apps/web/src/pages/Replay.tsx`
  - Upgraded replay toolbar status from raw step fraction to semantic text:
    - `stepStatusText ?? phaseInfo.label`.
  - Added `Replay focus toolbar hint` text:
    - `hotkeys: ????space [ ]`.
- `apps/web/src/mint-theme/mint-theme.css`
  - Added shared `stage-focus-toolbar-hint` style.
  - Added responsive wrapping for hint text under mobile widths.
- `apps/web/e2e/stage-focus.spec.ts`
  - Extended desktop battle/replay toolbar tests to assert hint visibility.

### Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web e2e -- stage-focus.spec.ts`
## 2026-02-13 ??WO005-O follow-up: replay toolbar highlight jump controls

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
## 2026-02-13 ??WO005-P follow-up: sticky stage focus toolbars

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
## 2026-02-13 ??WO005-Q follow-up: stage keyboard shortcuts

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
## 2026-02-13 ??WO005-R follow-up: Escape-to-exit focus mode

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
## 2026-02-13 ??WO005-K follow-up: stage toolbar quick commit controls

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
- We wanted stronger ??attle feel??in moment-to-moment interactions while keeping existing controls and route behavior unchanged.

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
## 2026-02-13 ?? WO005-C follow-up: Stage toolbar VFX selector (match/replay)

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

## 2026-02-14 ?? WO006/WO007: Classic Rules (engine + web integration)

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
- `pnpm.cmd lint` ??- `pnpm.cmd test` ??- `pnpm.cmd -C packages/triad-engine build` ??- `pnpm.cmd -C packages/triad-engine lint` ??- `node packages/triad-engine/test/classic_ruleset_id_v2.test.js` ??- `node packages/triad-engine/test/classic_order_chaos_swap.test.js` ??- `node packages/triad-engine/test/classic_reverse_ace.test.js` ??- `node packages/triad-engine/test/classic_plus_same.test.js` ??- `node packages/triad-engine/test/classic_type_ascend_descend.test.js` ??- `pnpm.cmd -C apps/web build` ??- `pnpm.cmd -C apps/web typecheck` ??(env issue: TS cannot resolve `pixi.js` / `fflate` in this sandbox run)
- `pnpm.cmd -C apps/web test -- ...` ??(sandbox `spawn EPERM` while loading vite/esbuild)
- `pnpm.cmd build:web` ??(sandbox `spawn EPERM` in nested pnpm/vite invocation)

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
    - added ??560px sizing adjustments for stage/board/frame/grid density.
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
  - Recommended section (`??????`) using top curated presets.
  - One-line summary surfaced for each ruleset row.
  - Direct CTA `???????????????` linking to `/match?ui=mint&rk=<rulesetKey>`.
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
- WO009 UI was implemented, but discovery flow regressions (`??????` visibility and `/match` CTA routing) were not guarded by browser E2E.

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
- ??????????????UI??????????????????????????/??????????????????????????????????????????????????????- ????`BattleHudMint` ??????????????density=minimal` ????????????????????UD?????????????
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
- ??????????????????????????????? + ??????????????????????????????????????????????????????????????- ?????????????????????????????????????????????????????????????????
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
- ???????????????????????????????????????rompt?????????????????UI????????????????????- ????I???????????????????????rompt ???????????????????????????????????????????????????????????????????
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
- Nyano ??????????????? slot ?????????????????????????????????????????int match ?????????????????????- ??????????????????????????????input` ???????`kind=idle` ?????????????????????????????????????????
### What
- Updated `apps/web/src/components/NyanoReactionSlot.tsx`:
  - `pickReactionKind` ???????? `hasVisibleReaction` ???????  - slot ???????placeholder ????????????mint-nyano-reaction-slot__content` ?? reaction ??????????????????  - `input !== null` ????`kind=idle` ??????? idle slot class ????????- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - slot ??`min-height` ???????`height: clamp(...)` + `overflow: hidden` ???????  - `mint-nyano-reaction-slot__content` ??absolute overlay ?????eaction ????? `inset: 0` ????????  - `stage-focus-cutin` ????????????? slot ???????????????- Updated `apps/web/src/components/__tests__/NyanoReactionSlot.test.tsx`:
  - placeholder + content wrapper ??????????????????????  - `kind=idle` ???????? slot ??idle ????????????????????????- Updated `apps/web/e2e/ux-guardrails.spec.ts`:
  - LayoutShift API ????????????????????  - Nyano slot ????????? line-clamp/overflow ???????? layout-shift ?????????????????????
### Verify
- `pnpm.cmd -C apps/web test -- NyanoReactionSlot` OK
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web typecheck` NG?????????????: `pixi.js` / `fflate` ??????????????
## 2026-02-15 - WO016: Mint microinteraction polish (press/hover/focus unification)

### Why
- Mint UI ???????????????????????????????????????????????????????????????????????????????????- ???????????????????????ocus-visible????????????????????
### What
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - ??????????????? `mint-pressable` / `mint-pressable--cell|--card|--pill` ????????  - hover/active/focus-visible ??CSS ??? `--mint-press-*` ????????  - selected ring/glow ??`--mint-selected-ring` / `--mint-selected-glow` ??????????/B ??????????  - `prefers-reduced-motion` ?? `data-vfx=off|low` ?? press??????????????- Updated `apps/web/src/components/BoardViewMint.tsx`:
  - selectable cell ?? `mint-pressable mint-pressable--cell` ????????  - `tabIndex=0` ?? Enter/Space ???????????????????ocus-visible ????????- Updated `apps/web/src/components/HandDisplayMint.tsx`:
  - hand card ?? `mint-pressable mint-pressable--card` ????????- Updated `apps/web/src/components/GameResultOverlayMint.tsx`:
  - result action buttons ?? `mint-pressable mint-pressable--pill` ????????- Updated `apps/web/e2e/ux-guardrails.spec.ts`:
  - Nyano slot ????????? hand card / board cell ?? `mint-pressable` ????????????
### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web typecheck` NG?????????????: `pixi.js` / `fflate` ??????????????
## 2026-02-15 - WO016/WO010 follow-up: keyboard + reduced-motion UX guardrails

### Why
- WO016 ????????? `mint-pressable` ?? Enter/Space ???????????????????????????????????- ????`ux-guardrails` ?? URL???????????????????????????????????????? reduced-motion ??????????????????????????????
### What
- Updated `apps/web/e2e/ux-guardrails.spec.ts`:
  - Added test: `Mint board cells remain keyboard-selectable via Enter`
    - Mint match ?? hand card ????????data-board-cell` ?????????????? Enter ?? `mint-cell--selected` ?????????????????  - Added test: `Reduced motion disables pressable transition feedback in Mint battle UI`
    - `page.emulateMedia({ reducedMotion: "reduce" })` ??? hand card / board cell ?? `transitionDuration` ??`0s` ????????????????
### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK?? passed??
## 2026-02-15 - Match UX fix: Nyano??????????????????????? + Prompt?????????????

### Why
- ?????????yano??????????????????????????????????????????????????????????????- ?????? ActionPrompt?????????????????????????????????????????????????????????
### What
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - `mint-stage-impact-board` ?? transform???????????????????????????????????????`mint-stage-impact-board-glow` ????????  - `mint-nyano-reaction-slot` ?? `contain: layout paint` ??????????????????????????????????????????????  - `mint-prompt__ja` / `mint-prompt__en` ??????????????????????esktop/mobile????????- Updated `apps/web/e2e/ux-guardrails.spec.ts`:
  - Nyano slot????????? board frame ?? document??????????????????????eck Preview????????????????????
### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK?? passed??- `pnpm.cmd -C apps/web build` OK

## 2026-02-15 - Match UX follow-up: commentary text stability + board/panel rebalance

### Why
- ??????????????HUD/AI notice??????????????????????????????????????
- ??????????????????????????????????????????

### What
- Updated `apps/web/src/components/BattleHudMint.tsx`:
  - `moveTip` / `aiReason` ???????????????????
  - ???????????????????????HUD?????????????
- Updated `apps/web/src/pages/Match.tsx`:
  - Mint UI?AI?????? `mint-ai-notice-slot` ?????????????????
  - ????????????????????????????/????????
- Updated `apps/web/src/components/PlayerSidePanelMint.tsx` + `apps/web/src/mint-theme/mint-theme.css`:
  - ????????????avatar/??/????????????????
  - ????/?????????????????????????
  - HUD???????????ellipsis?empty??????????

### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (4 passed)
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web typecheck` NG (???????: `pixi.js` / `fflate`)
- Re-verify: `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (5 passed, with AI notice slot guardrail)

## 2026-02-15 - Match UX hotfix: details drawer close reliability + status text no-shift slots

### Why
- ????????????????? ? ????????????????????????????
- ?????????Battle summary?????????????????????????????????

### What
- Updated `apps/web/src/components/MatchDrawerMint.tsx`:
  - ?????????????????close??????????????
  - ??????? click/pointerdown ? stopPropagation ?????????????????????
  - close button ? `type="button"` + ???? `?` ??????
- Updated `apps/web/src/pages/Match.tsx`:
  - `drawerOpen` ?? `DrawerToggleButton` ?????????????????????????
  - `Battle: ...` ??????????????????????????? placeholder ???????
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - `mint-ai-notice` ? nowrap + ellipsis ?????????????????
  - `mint-status-summary-slot` / `mint-status-summary` ?????Battle summary ???????
- Updated `apps/web/e2e/ux-guardrails.spec.ts`:
  - `Match details drawer closes via the close button and stays closed` ????
  - `Mint status summary slot keeps stable height when battle text appears/disappears` ????
  - helper ? `nytl.ui.density=standard` ??????????????????????

### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (7 passed)
- `pnpm.cmd -C apps/web build` OK
## 2026-02-15 - Battle Stage focus UX: hand/board no-scroll flow refinement

### Why
- `battle-stage?ui=engine&focus=1` ????????????????????????????????????????????????
- ?????????????????????????????????????????

### What
- Updated `apps/web/src/pages/Match.tsx`:
  - Stage focus ?????????? `showStageFocusHandDock` ????
  - Stage focus + hand dock ???? root/main column ? modifier class ????????????????????????
  - ???????? Commit/Undo/Warning???????? hand dock ??????????????????
  - hand dock ? Tailwind `sticky` ??? stage ? inline ?????stage ?? CSS ???????
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - `.mint-focus-hand-dock--stage` ? `position: fixed` ??????????????
  - `.stage-focus-root--with-hand-dock` / `.stage-focus-main-column--with-hand-dock` ????????????????????
  - Stage focus ? Nyano reaction slot ? cut-in ?????????????????????
  - Stage focus board ?? prompt???????????????????????? override ????
- Updated `apps/web/src/lib/stage_layout.ts`:
  - battle ? reserveHeight ??????engine board ??? maxWidth/minHeight ?????????
- Updated `apps/web/e2e/stage-focus.spec.ts`:
  - desktop?????top commit????????dock commit?????????
  - brittle????????????????????????????????????

### Verify
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts` OK (14 passed)
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (7 passed)
- `pnpm.cmd -C apps/web typecheck` NG (??: `pixi.js` / `fflate` ??????)
## 2026-02-15 - Battle Stage UX follow-up: commentary/status moved above board

### Why
- ?????Nyano?????????????????????????????????????????????????????
- ???stage focus ?????/????????????????????????????????????

### What
- Updated `apps/web/src/pages/Match.tsx`:
  - `stage focus` ??????? + Nyano?????? `stage-focus-announcer-stack` ????????????
  - ???????? `!isStageFocusRoute` ?????stage focus ??????????
  - `showMintStatusSummarySlot` ?????stage focus ?????????????????????placeholder????
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - `stage-focus-announcer-stack` ???????????????????????

### Verify
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts` OK (14 passed)
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (7 passed)
- `pnpm.cmd -C apps/web typecheck` NG (??: `pixi.js` / `fflate`)
### Follow-up
- Updated `apps/web/e2e/stage-focus.spec.ts`:
  - Added `/battle-stage keeps commentary/status stack above board and hand dock` guardrail to lock vertical placement in focus layout.
## 2026-02-15 - Battle Stage UX follow-up: hand dock overlap fix

### Why
- stage focus ????????????????????????????????????????
- ??????????????? filtered ancestor ????????????stage?????????????????

### What
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - `stage-focus-root--with-hand-dock .stage-focus-arena-shell` ? `backdrop-filter` ??????`mint-focus-hand-dock--stage` ? fixed ??? viewport ???????
  - stage focus hand dock ????????padding/card thumbnail height/width ????
  - stage focus hand dock ? board shell ?????board shell margin/padding?engine board max-width override?????????????
- Updated `apps/web/src/pages/Match.tsx`:
  - stage focus + hand dock ?? engine board max/min ????????????????
- Updated `apps/web/e2e/stage-focus.spec.ts`:
  - `/battle-stage keeps commentary/status stack above board and hand dock` ?????????????????????????

### Verify
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts` OK (15 passed)
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (7 passed)
- `pnpm.cmd -C apps/web typecheck` NG (??: `pixi.js` / `fflate`)
## 2026-02-15 - Match/Mint & Stage follow-up: shiftless announcer + prompt/downsize + drawer close + Pixi hand/board rebalance

### Why
- `/match?ui=mint` ?? Nyano????/??????????????????????????
- ???????????????????????????????
- Details ????? `?` ?????????????????????????????
- stage focus ? Pixi ??????/???????????????? hand dock ??????????????????

### What
- Updated `apps/web/src/pages/Match.tsx`:
  - Mint UI ? announcer?Battle summary + Nyano reaction?? `mint-announcer-stack` ?????????????`/match` ????????????
  - drawer ???? `openDrawer` / `closeDrawer` ?????close????????open????????????
  - stage focus + hand dock ?? engine board cap ??????hand dock??????????????????????
- Updated `apps/web/src/components/MatchDrawerMint.tsx`:
  - close???? `?` ??????`onPointerDown` ? `onClick` ???? close ?????
- Updated `apps/web/src/mint-theme/mint-theme.css`:
  - `mint-announcer-stack` ????
  - Prompt ????????????/stage/mobile?`mint-prompt__ja`/`__en`/`__text`??
  - stage hand dock ???????????????????????????????????
  - stage hand dock ? board ??????dock footprint / board shell / engine renderer max??????
  - drawer close ???? hit area ????
  - non-stage ? player panel ??????????

### Verify
- `pnpm.cmd -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts` OK (15 passed)
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` OK (7 passed)
- `pnpm.cmd -C apps/web typecheck` ????????????????????

## 2026-02-15 - WO017?WO024: Mint app screens + primitives + e2e/app-asset pipeline

### Why
- `/match` ???Home/Arena/Decks/Onboarding????????????Mock????????UI??????????
- ??????????Mint UI ???????Glass/Pressable/Icon/TabNav/BigButton??????????????
- ??????????????Gemini ?????????????? e2e ????????????????

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
    - Mint theme ??? App chrome ? `MintGameShell + MintAppChrome` ????
    - `focusRoute`?stage/focus???????? header/footer ???????
    - `prefers-reduced-motion` / `data-vfx` ??????????
- Rebuilt main screens with Mint structure:
  - `apps/web/src/pages/Home.tsx`?4?????3?????infobar?Tools/Settings?
  - `apps/web/src/pages/Arena.tsx`?side nav + banner + quick play + difficulty cards?
  - `apps/web/src/pages/Decks.tsx`?3??? Deck Builder?
  - `apps/web/src/pages/Start.tsx`?onboarding 3 cards + progress pill?
  - `apps/web/src/main.tsx`?`/start` route???
  - `apps/web/src/components/CardBrowser.tsx`?preset filter props???
- Expanded Mint CSS for app screens/primitives:
  - `apps/web/src/mint-theme/mint-theme.css`
    - Shell???glass????tab/button/typography?Home/Arena/Decks/Start ??????????
    - reduced-motion ? `data-vfx=off` ?????????
- Gemini pipeline availability + asset directory:
  - `apps/web/public/assets/gen/.gitkeep` ?????????????
  - Existing `scripts/gemini_image_gen.mjs` / batch prompt / docs ???????
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
- `focusRoute` (`focus=1`, `/battle-stage`, `/replay-stage`) ???? App chrome ?????????????????int??????????????????????????????????????- Mint tab navigation ??? `theme=mint` ????????RL?????? e2e ????????????????
### What
- Updated `apps/web/e2e/mint-app-screens-guardrails.spec.ts`:
  - Added `Mint app chrome preserves theme query across tab navigation`
    - `/?theme=mint` ??? Arena/Decks ?????????? `theme=mint` ???????????????????  - Added `focus routes keep app chrome hidden for layout compatibility`
    - `/match?...&focus=1` ?? `/battle-stage?...&focus=1` ??
      `.mint-app-chrome` / `.mint-app-footer` / `.app-header` / `.app-footer` ???????????????????????    - `/battle-stage` ???? `Commit move from focus hand dock` ??????????????ocus????????????????????????
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
- Secondary screens needed clearer ?at-a-glance? hierarchy for mobile game-like readability.

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
## 2026-02-17 ??Arena follow-up: guide/difficulty styles completion + encoding cleanup

### Why
- `Arena` ???????????`MintPageGuide` ????????????????????????????SS?????????????????????????????????????????????- `apps/web/src/pages/Arena.tsx` ??UTF-8 BOM ???????????????????????????????????????????????????????????????????????????- ??????????????????????????????????????????????????????????????
### What
- `apps/web/src/mint-theme/mint-theme.css`
  - `mint-page-guide__*` ??????????????????ead/grid/item/title/detail????  - `mint-arena-difficulty__top` / `mint-arena-difficulty__hint` ????????  - ?????????????? `mint-page-guide__grid` ??`1100px` / `760px` ???????????????- `apps/web/src/pages/Arena.tsx`
  - ????????????????? `type="button"` ????????????????????????? submit ???????  - UTF-8 BOM ?????????TF-8 (BOM???? ????????- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - ?? follow-up ?????????????????
### Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
## 2026-02-17 ??Mint guide rollout: apply shared page guide to Events/Replay/Stream

### Why
- `apps/web/src/lib/mint_page_guides.ts` ???? `events/replay/stream` ??????????????????????????????????? `Arena` ???????????????????????????????- ?????????????????????????int??????????????????????????????????????
### What
- `apps/web/src/pages/Events.tsx`
  - `MintPageGuide` / `MINT_PAGE_GUIDES` ?????????int???????? `MINT_PAGE_GUIDES.events` ????????- `apps/web/src/pages/Replay.tsx`
  - `MintPageGuide` / `MINT_PAGE_GUIDES` ?????????!isStageFocus` ??????? `MINT_PAGE_GUIDES.replay` ????????  - Stage focus ?? board-first ???????????- `apps/web/src/pages/Stream.tsx`
  - `MintPageGuide` / `MINT_PAGE_GUIDES` ?????????int???????? `MINT_PAGE_GUIDES.stream` ????????
### Verify
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`
- `pnpm.cmd -C apps/web e2e -- e2e/mint-app-screens-guardrails.spec.ts`
## 2026-02-17 ??Mint guide rollout follow-up: e2e guardrails for page guides

### Why
- ?????????? UI ????????????????????????????????????????????????????????????????
### What
- `apps/web/e2e/mint-app-screens-guardrails.spec.ts`
  - `/arena` `/events` `/replay` `/stream` ?? `.mint-page-guide` ???????????????  - ????? 390px ?????????????????????????????????????????
### Verify
- `pnpm.cmd -C apps/web e2e -- e2e/mint-app-screens-guardrails.spec.ts`
## 2026-02-17 ??Stage focus overlap fix + UX guardrail commit fallback hardening

### Why
- CI ?? `e2e/stage-focus.spec.ts` ????oardAboveDock?????????????/battle-stage` ???????????? hand dock ????????????????????????- ??? CI ????? `ux-guardrails` ?? `Quick commit move` ?????????????????????? flaky ?????????????
### What
- `apps/web/src/mint-theme/mint-theme.css`
  - `.mint-focus-hand-dock--stage` ?? transform ??`translate(-50%, 0)` ????????  - desktop ??????min-width: 1200px` ??? `min-height: 700px`??? `translate(-50%, 10px)` ?????????oard/dock ??????????????- `apps/web/e2e/ux-guardrails.spec.ts`
  - `commitMove` ?? quick commit ???????????????timeout ????????????????????????????????????????????? flaky ???????- `apps/web/src/lib/stage_layout.ts`
  - battle desktop ?? reserve height ??380 ??400 ????????- `apps/web/src/lib/__tests__/stage_layout.test.ts`
  - ?????????????????????????????
### Verify
- `pnpm -C apps/web typecheck`
- `pnpm.cmd -C apps/web test -- src/lib/__tests__/stage_layout.test.ts`
- `pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts`
- `pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts`
- `pnpm.cmd -C apps/web e2e` ?????????????????? `spawn EPERM` ???????????????spec??????????????????## 2026-02-17 - ui=mint parity follow-up: align board/hand/commentary/status flow with Pixi

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
- Home/Start/Stream contained developer-facing or roadmap-like copy (`?????????????`, `????????????????`, `????, `????, `DONE/TODO`) visible to end users.
- Requirement: keep navigation/functionality unchanged and replace internal phrasing with player-facing copy.

### What
- apps/web/src/pages/Home.tsx
  - Replaced hero/menu/infobar copy with player-facing text.
  - Replaced onboarding status labels from DONE/TODO/AUTO to Japanese user-facing labels.
  - Replaced onboarding completion sentence with play-ready wording.
- apps/web/src/pages/Start.tsx
  - Replaced DONE/TODO labels with user-facing status labels.
  - Replaced quickstart footer sentence with user-facing Japanese copy.
  - Fixed step-title typos (`???? -> `????`, `???? -> `????).
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
    - Localized phase/status labels (`???/???/????/???/????`, `???????`).
  - `apps/web/src/lib/replay_highlights.ts`
    - Localized highlight labels (`???????/??????????????).
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

## 2026-02-17 - Stream/HUD ?????????????????????????????????

### Why
- Stream ????????????????????????????????????????????????????????????????????????- `_design/Home` ????????????????????????????????????????????/???????????????????????????
### What
- `apps/web/src/pages/Stream.tsx`
  - ???????????????????????????? / `???` / `???`????  - ???????????????????????????????????  - ?????????? `Event` / `Turn` ??????`??????? / `??????` ????????- `apps/web/src/components/stream/StreamSharePanel.tsx`
  - ????????/Nightbot ??????????????????????????- `apps/web/src/components/stream/WarudoBridgePanel.tsx`
  - `viewer cmd format` ??????????????????????  - ??????????????????????????????????????- `apps/web/src/components/StreamOperationsHUD.tsx`
  - ???????????????????  - `VOTE OPEN` / `Vote Status` ???????????????????????  - `Last Error` / `Health` / `Ops Log` ??????????  - ?????????????????????- `apps/web/src/pages/_design/Home.tsx`
  - ????????????????????????????????????????????????????????????  - ??????????????????????????????????????????????
### Verify
- pnpm -C apps/web test OK
- pnpm -C apps/web typecheck OK
- pnpm -C apps/web build OK
- pnpm.cmd -C apps/web e2e:ux OK (15 passed)

## 2026-02-17 - Overlay ???????????????2E???????????????????
### Why
- Overlay ???????????????????????????????????????????????????????????????????????- ?????E2E ??`Now Playing` / `Chat voting` / `No signal yet` / `OPEN` / `remaining` ??????????????????????????????????
### What
- `apps/web/src/pages/Overlay.tsx`
  - ????????????????????????/ ??? / ??? / ?????????  - ????????????????????????????????/??????/??????????  - ??????????????????????????????????????????????????????????????????????  - E2E?????????????????????? `?????? (Now Playing)`, `????????(Chat voting)`, `??????? (No signal yet)`, `??? ...s remaining`????  - strictAllowed ????????????????????????????/WM???????????????????
### Verify
- pnpm -C apps/web test OK
- pnpm -C apps/web typecheck OK
- pnpm -C apps/web build OK
- pnpm.cmd -C apps/web e2e:ux OK (15 passed)
- `e2e/cross-tab-overlay.spec.ts` / `e2e/smoke.spec.ts` ????????????????? `spawn EPERM` ???????????????????????????????????
- `apps/web/src/App.tsx`
  - ??????????????????????lay/Watch????????????  - Mint/?????????????????????????????????????????  - ???????????????????`???????? ?????????????? ????????

## 2026-02-17 - Home/Playground ?????????E2E???????

### Why
- Home ? Tools/metrics ??? Playground ???????????????????????????????
- ??? Home/Replay ? E2E ?????? selector ?????????????????????????????

### What
- apps/web/src/pages/Playground.tsx
  - ???/????/??????????????: ??????????????????????????????
  - Nyano Lab ????E2E??????????????????????
  - ???????????????
- apps/web/src/pages/Home.tsx
  - Tools/Settings????????????????????????
  - E2E???????????: Tools / Settings, Copy Snapshot, Reset Metrics??
  - ??????????????/???????????

### Verify
- pnpm -C apps/web test OK
- pnpm -C apps/web typecheck OK
- pnpm -C apps/web build OK
- pnpm.cmd -C apps/web exec playwright test e2e/home.spec.ts e2e/smoke.spec.ts e2e/replay-url.spec.ts ????????? spawn EPERM ??????


## 2026-02-18 - Events/Decks/Replay ???UI??

### What
- Decks: ????????????Save Deck ??????? (Save Deck)????????????????????JSON?????????Quick Play???????????????
- Events: ???????????????????My Pawprints????????????????Open/Copy/Remove ??????
- Replay: ????????????????Nyano??? tokenIds?classic swap/open ????????????????

### Verify
- pnpm -C apps/web test OK
- pnpm -C apps/web typecheck OK
- pnpm -C apps/web build OK
- pnpm.cmd -C apps/web e2e:ux OK (15 passed)

## 2026-02-18 - Match/Decks ???? + guest-game E2E??

### What
- Match: ???????/??/??/???CTA/????????????????????????
- Match: E2E??????Guest Quick Play?Commit move??Load replay??????
- Decks: Deck Builder/My Deck/Set as A/Edit/Delete/Save Deck ????????????????????????
- E2E: pps/web/e2e/guest-game.spec.ts ? Commit Move ???????????UI???Quick commit / Commit move / focus hand dock?????

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

## 2026-02-18 - Arena quick-start flow improvement

### Why
- Arena required two actions (difficulty select then quick play button) to start a guest battle, so the primary flow felt indirect.

### What
- apps/web/src/pages/Arena.tsx
  - Difficulty card click now updates the difficulty query and immediately navigates to guest match.
  - Added assist copy that cards start battle immediately.
- apps/web/src/mint-theme/mint-theme.css
  - Added mint-arena-difficulty__assist style.
- apps/web/e2e/quick-play.spec.ts
  - Added guardrail test for immediate start from Arena difficulty card.

### Verify
- pnpm.cmd -C apps/web e2e -- e2e/quick-play.spec.ts OK (2 passed)
- pnpm.cmd -C apps/web test OK
- pnpm.cmd -C apps/web typecheck OK
- pnpm.cmd -C apps/web build OK

## 2026-02-18 - User-facing copy cleanup (debug label removal + Arena JP guidance)

### Why
- Some user-visible labels still exposed developer-facing wording such as "debug".
- Arena side navigation still mixed English-first labels while the product is moving to Japanese-first copy.

### What
- apps/web/src/pages/Overlay.tsx
  - Replaced the visible "(debug)" label with "??".
- apps/web/src/pages/Replay.tsx
  - Replaced disclosure title "?JSON????debug?" with "??JSON???".
- apps/web/src/pages/Playground.tsx
  - Replaced disclosure title "?JSON????debug?" with "??JSON???".
- apps/web/src/pages/Arena.tsx
  - Side nav labels switched to Japanese-first (??? / ???? / ???? / ???).
  - Banner title adjusted to "Nyano Triad League ????".
  - Events link copy adjusted to "?????????".

### Verify
- pnpm.cmd -C apps/web e2e -- e2e/quick-play.spec.ts OK (2 passed)
- pnpm.cmd -C apps/web test OK
- pnpm.cmd -C apps/web typecheck OK
- pnpm.cmd -C apps/web build OK

## 2026-02-18 - Home onboarding wording alignment (2-step start)

### Why
- Users can start a guest battle after step 2, so the fixed heading "3-step start" was misleading.

### What
- apps/web/src/pages/Home.tsx
  - Updated onboarding heading to "??2?????????".
  - Added note clarifying step 3 is optional practice.
  - Updated progress chip text to neutral "?? X/3".
  - Updated step 3 label/status to optional wording.
- apps/web/src/pages/Start.tsx
  - Updated progress label to "?? X/3".
  - Updated step 3 and footer copy to clarify optional third step.
- apps/web/src/mint-theme/mint-theme.css
  - Added `.mint-home-onboarding__note` style.
- apps/web/e2e/home.spec.ts
  - Updated expected heading text.

### Verify
- pnpm.cmd -C apps/web e2e -- e2e/home.spec.ts OK (1 passed)
- pnpm.cmd -C apps/web test OK
- pnpm.cmd -C apps/web typecheck OK
- pnpm.cmd -C apps/web build OK

## 2026-02-18 - Home onboarding status cleanup for player-facing clarity

### Why
- On Home onboarding cards, labels like "?? / ???" were not clear to players and looked like internal progress markers.
- Home also exposed developer-oriented tools/metrics text in normal view.

### What
- apps/web/src/pages/Home.tsx
  - Removed per-card status labels from onboarding cards (?????? / ?????? / ???????????).
  - Removed onboarding progress pill from the heading area.
  - Removed "?????????????" action from default onboarding footer.
  - Gated Home developer tools section behind `debug=1` and changed summary label to `?????`.
- apps/web/e2e/home.spec.ts
  - Updated default Home expectations (no status labels, no dev tools by default).
  - Added `debug=1` case to verify dev tools remain available when explicitly enabled.

### Verify
- pnpm.cmd -C apps/web e2e -- e2e/home.spec.ts OK (2 passed)
- pnpm.cmd -C apps/web test OK
- pnpm.cmd -C apps/web typecheck OK
- pnpm.cmd -C apps/web build OK

## 2026-02-18 - Start page copy cleanup aligned with Home onboarding UX

### What
- apps/web/src/pages/Start.tsx
  - Removed card-level status labels (`??/???/??`).
  - Updated header pill to guidance copy (`?? 2 ???????`).
  - Updated footer helper copy to emphasize 1->2 path and optional step 3.
  - Localized footer quick links (`Decks`/`Arena` -> `???`/`????`).

### Verify
- pnpm.cmd -C apps/web e2e -- e2e/home.spec.ts OK (2 passed)
- pnpm.cmd -C apps/web test OK
- pnpm.cmd -C apps/web typecheck OK
- pnpm.cmd -C apps/web build OK

## 2026-02-18 - Match Mint battle board gamefeel (WO-028/029/030)

### Why
- Improve Mint Match battle board feel toward playful game UI while keeping clarity-first UX.
- Keep transcript determinism / URL compatibility untouched.

### What
- WO-028 (`apps/web/src/mint-theme/mint-theme.css`)
  - Strengthened board tray/cell material layers (rim/well/sheen/noise) with asset-first + CSS fallback.
  - Added additional `data-vfx` / reduced-motion-friendly gating for decorative sheen layers.
- WO-029 (`apps/web/src/pages/Match.tsx`, `apps/web/src/components/PlayerSidePanelMint.tsx`, new components + CSS)
  - Added Classic rules ribbon: `ClassicRulesRibbonMint`.
  - Added open-hand mini visibility: `ClassicOpenHandMiniMint`.
  - Wired `classicOpenCardIndices` / `classicForcedCardIndex` into in-match UI (chips + open mini + order lock badge).
- WO-030 (`apps/web/src/components/BoardViewMint.tsx`, `apps/web/src/components/HandDisplayMint.tsx`, `apps/web/src/lib/sfx.ts`, `apps/web/src/pages/Match.tsx`, CSS)
  - Added pointer-based pressed states for board cells and hand cards.
  - Added subtle `tap_soft` SFX and hooked to card/cell selection flows.
  - Kept reduced-motion behavior (non-error SFX already suppressed in reduced mode).

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e:ux` OK (15 passed)
## 2026-02-18 - Match classic labels and accessibility follow-up

### Why
- Keep Mint Match understandable for Japanese-first users while preserving existing automation selectors and URL compatibility.
- Reduce duplicated label logic by centralizing classic/open/player label helpers.

### What
- `apps/web/src/components/match/classicRulesUi.ts`
  - Added `getPlayerDisplayLabel`, `getPlayerEnglishLabel`, `getClassicOpenModeLabel`.
- `apps/web/src/pages/Match.tsx`
  - Reused helper labels for open-hand mode and side labels.
- `apps/web/src/components/PlayerSidePanelMint.tsx`
  - Updated panel copy to Japanese-first with English in ARIA for compatibility.
- `apps/web/src/components/HandDisplayMint.tsx`
  - Updated hand tray/listbox ARIA labels to Japanese-first while keeping `Player A/B hand` tokens.
- `apps/web/src/components/ClassicOpenHandMiniMint.tsx`
  - Updated section ARIA label to Japanese copy.
- Added/updated unit coverage:
  - `apps/web/src/components/match/__tests__/classicRulesUi.test.ts`
  - `apps/web/src/components/__tests__/PlayerSidePanelMint.test.tsx`

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
## 2026-02-18 - Match Setup Japanese-first usability pass

### Why
- Match Setup still had many English-only strings, which reduced readability for Japanese-first players.
- Needed to improve clarity without breaking URL params, determinism, or existing E2E selectors.

### What
- `apps/web/src/components/match/MatchSetupPanelMint.tsx`
  - Converted major visible copy to Japanese-first (header, section labels, deck/opponent/ruleset/help text, advanced panel, action buttons).
  - Kept key aria labels/test IDs/URL wiring unchanged for compatibility.
  - Updated `Current` ruleset display to use localized helper label.
- `apps/web/src/components/match/MatchSetupPanelMint.helpers.ts`
  - Added `describeRulesetKeyDisplay` for Japanese-first ruleset labels with English token fallback.
  - Updated setup summary line to Japanese-first while preserving compatibility tokens (e.g. `Human vs Human`, `first=...`, `board=...`).
- `apps/web/src/components/match/__tests__/MatchSetupPanelMint.test.ts`
  - Added assertion for new localized ruleset display helper.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e:ux` OK (15 passed)
## 2026-02-18 - Match battle control copy polish (Japanese-first)

### Why
- Match battle controls still mixed English/Japanese labels, making flow less clear for Japanese-first players.
- Needed to keep E2E selector compatibility and URL/state behavior unchanged.

### What
- `apps/web/src/pages/Match.tsx`
  - Updated battle error/toast messages to clearer Japanese wording.
  - Updated focus toolbar warning select option labels (`cell` -> `????`).
  - Updated visible action labels in battle controls:
    - `Commit move` -> `??????????
    - `Undo` -> `1?????
    - `Nyano Move` -> `??????????`
  - Updated AI turn guidance text to match visible action labels.
  - Updated engine fallback error copy (`??????????????`).
- Kept all existing aria labels used by E2E (`Commit move`, `Quick commit move`, etc.) unchanged.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e:ux` OK (15 passed)
## 2026-02-18 - Stream copy cleanup and smoke/stage-focus i18n hardening

### Why
- Continue Japanese-first UX cleanup while preserving URL/ARIA compatibility and replay recovery affordances.
- Stabilize E2E assertions after bilingual UI copy updates.

### What
- `apps/web/src/pages/Stream.tsx`
  - Replaced remaining developer-tone wording (`prototype`, internal bus wording) with player-facing Japanese-first copy.
  - Localized summary labels (`Overlay` -> `???????????`, `Match bus` -> `????????`).
  - Improved guidance text clarity in step sections while preserving compatibility tokens where needed.
- `apps/web/e2e/smoke.spec.ts`
  - Updated route smoke assertions to bilingual regex checks (JP/EN) for `/arena`, `/decks`, `/replay`, `/rulesets`, `/events`, `/stream`.
- `apps/web/e2e/stage-focus.spec.ts`
  - Updated replay load-failure checks to bilingual selectors for `Load replay`, `Error:`, `Retry load`, `Clear share params`.

### Verify
- `pnpm.cmd test` (apps/web) OK
- `pnpm.cmd typecheck` (apps/web) blocked in this environment by module/permission issue (`TS2307 pixi.js/fflate` + `EPERM` reads in node_modules)
- `pnpm.cmd build` (apps/web) blocked in this environment by `esbuild spawn EPERM`
## 2026-02-18 - Stream/Overlay Japanese-first message pass

### What
- `apps/web/src/pages/Stream.tsx`
  - Localized remaining operator toasts/messages to Japanese-first (`No live state`, download warnings, picker/vote feedback, warudo send result text).
  - Localized stream vote note text to JP-first while keeping English hint in parentheses.
- `apps/web/src/pages/Overlay.tsx`
  - Localized stale warning banner to Japanese-first with `Data stale` token retained.

### Verify
- `pnpm.cmd test` (apps/web) OK
## 2026-02-18 - Replay/Rulesets Japanese-first copy follow-up

### What
- `apps/web/src/pages/Replay.tsx`
  - Mode/board UI select labels were changed to Japanese-first while preserving compatibility tokens (`engine v1`, `engine v2`).
  - Stream tools disclosure and overlay action labels were changed to clearer Japanese-first wording.
  - Result banner helper labels were polished (`step` -> `????, `matchId??????`, `?????????????? (Transcript)`).
- `apps/web/src/pages/Rulesets.tsx`
  - Classic section heading/subcopy was changed to Japanese-first wording (`??????????????????lassic`).

### Verify
- `pnpm.cmd test` (apps/web) OK
- `apps/web/e2e/rulesets-ux-guardrails.spec.ts`
  - Updated heading assertion to JP/EN bilingual match (`Ruleset Registry|???????????????`) for copy-change resilience.
## 2026-02-18 - Replay/Rulesets copy polish (Japanese-first, compatibility-safe)

### What
- `apps/web/src/pages/Replay.tsx`
  - Added `replayModeDisplay()` and switched summary mode display from raw key to Japanese-first labels.
  - Refined overlay sync panel copy (`????(step)` / `???????????????????????????).
  - Refined detail panel labels (`???????????`, JSON copy button labels, transcript/result section labels).
- `apps/web/src/pages/Rulesets.tsx`
  - Search placeholder and row meta labels adjusted to Japanese-first wording (`??? / rulesetId / ????`, `????????`, `??????????).
  - Updated unmapped action hint (`????????????????).
- `apps/web/e2e/rulesets-ux-guardrails.spec.ts`
  - Header assertion updated to JP/EN bilingual match.

### Verify
- `pnpm.cmd test` (apps/web) OK
- `apps/web/src/pages/Replay.tsx`
  - Stage focus transport toggle labels changed to Japanese-first (`?????????????`) with English compatibility tokens retained in parentheses.
  - Stage focus feedback message changed to Japanese-first with English compatibility token (`Controls hidden/shown`) retained.
- `apps/web/e2e/stage-focus.spec.ts`
  - Updated replay focus controls assertions to JP/EN bilingual selectors and feedback checks.
## 2026-02-18 - Deck filters UX follow-up (game-relevant presets)

### What
- Decks page now uses CardBrowserMint for Japanese-first filter UX.
- Filter presets were updated to game-relevant categories: all, rock-focused, scissors-focused, paper-focused, high-edge.
- Added hint text explaining hand type + edge sum relevance.
- Localized preview success toast and added type="button" for filter buttons.

### Verify
- pnpm.cmd -C apps/web test OK
- pnpm.cmd -C apps/web typecheck OK
- pnpm.cmd -C apps/web build OK
- Playwright smoke run blocked by spawn EPERM in this environment
## 2026-02-18 - Decks filter URL-sync guardrail follow-up

### What
- Added `data-testid="decks-filter-*"` to Decks filter buttons for stable UI guardrails.
- Added `Decks filter preset keeps URL sync via df param` to `e2e/mint-app-screens-guardrails.spec.ts`.
  - Verifies `df=paper` initial restore.
  - Verifies click updates URL to `df=power`.
  - Verifies selecting `all` removes `df` and returns to default preset.

### Verify
- `pnpm.cmd -C apps/web test` OK
- `pnpm.cmd -C apps/web typecheck` OK
- `pnpm.cmd -C apps/web build` OK
- Playwright E2E execution remains environment-blocked (`spawn EPERM`).
## 2026-02-18 - Decks df backward-compat normalization follow-up

### What
- `deck_filters` now supports legacy ids and canonical normalization:
  - `attacker -> rock`
  - `defender -> paper`
  - `other -> scissors`
- `Decks` URL sync now normalizes `df` on load:
  - unknown `df` is removed
  - legacy `df` is rewritten to canonical id with `replace` navigation
- Added e2e guardrail coverage update in `mint-app-screens-guardrails`:
  - verifies legacy `df=attacker` is normalized to `df=rock`.

### Verify
- `pnpm.cmd -C apps/web test` OK
- `pnpm.cmd -C apps/web typecheck` OK
- `pnpm.cmd -C apps/web build` OK
- Playwright execution remains blocked in this environment (`spawn EPERM`).
## 2026-02-18 - Decks df normalization hardening (case/space)

### What
- `normalizeDeckFilterPresetId` now trims and lowercases incoming `df` values.
- This allows robust recovery from shared links such as `df=ROCK` or `df=%20Defender%20`.
- Added unit coverage in `deck_filters.test.ts` for case/space normalization.

### Verify
- `pnpm.cmd -C apps/web test` OK
- `pnpm.cmd -C apps/web typecheck` OK
- `pnpm.cmd -C apps/web build` OK
## 2026-02-18 - Replay fallback mismatch guardrail hardening

### What
- Added stable selector on Replay mismatch warning pill:
  - `data-testid="replay-ruleset-mismatch-warning"`
- Updated `e2e/replay-ruleset-fallback-guardrails.spec.ts` to assert the warning pill by testid in addition to message text.
- This makes the guardrail resilient to copy adjustments while still validating rk/cr fallback mismatch behavior.

### Verify
- `pnpm.cmd -C apps/web test` OK
- `pnpm.cmd -C apps/web typecheck` OK
- `pnpm.cmd -C apps/web build` OK
- Playwright run is environment-blocked (`spawn EPERM`).

## 2026-02-18 - Match Setup rules picker visual/token follow-up

### What
- `apps/web/src/components/match/MintRulesetPicker.tsx`
  - Shifted picker structure to dedicated mint theme classes (`mint-ruleset-picker__*`) while preserving existing ruleset behavior (`rk`/`cr` URL compatibility is unchanged).
  - Updated copy to Japanese-first labels with English compatibility tokens in parentheses.
  - Restored stable selectors and accessibility hints (`data-testid`, `aria-pressed`) for future E2E resilience.
- `apps/web/src/mint-theme/mint-theme.css`
  - Added a dedicated style block for rules picker controls (family buttons, chips, toggles, summary, help).
  - Added reduced-motion and `data-vfx="off"` handling for picker visuals.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK
- `pnpm.cmd -C apps/web e2e -- e2e/match-setup-ux-guardrails.spec.ts` failed in this local environment (`spawn EPERM`).

## 2026-02-18 - MintRulesetPicker regression test follow-up

### What
- Added `apps/web/src/components/match/__tests__/MintRulesetPicker.test.tsx`.
  - Verifies family row/current summary render for non-classic mode.
  - Verifies classic custom UI renders expected controls, Japanese-first labels, and stable `data-testid` attributes.
  - Keeps compatibility guardrails lightweight via static-markup tests (aligned with existing component test style).

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-18 - Events copy cleanup (user-facing wording)

### What
- `apps/web/src/pages/Events.tsx`
  - Replaced user-facing `??` wording with `???` in season-point summary/ranking sections.
  - Kept scoring semantics unchanged; copy only.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-18 - Stream/Overlay fallback error copy cleanup

### What
- `apps/web/src/pages/Stream.tsx`
  - Local fallback error messages were updated to Japanese-first wording:
    - `RPC????? (RPC connection failed)`
    - `??????? (External integration error)`
- `apps/web/src/pages/Overlay.tsx`
  - Sticky error fallback messages were updated to Japanese-first wording with compatibility tokens in parentheses.

### Verify
- `pnpm -C apps/web test` OK
- `pnpm -C apps/web typecheck` OK
- `pnpm -C apps/web build` OK

## 2026-02-18 - E2E selector resilience follow-up (stream/replay-stage)

### What
- apps/web/e2e/stream-vote.spec.ts
  - Replaced brittle English-only assertions with JP/EN dual-match selectors for stream headings, vote panel labels, validation feedback, and start/closed controls.
  - Updated clipboard assertion to accept both `slot` and JP label tokens.
- apps/web/e2e/stage-focus.spec.ts
  - Hardened replay-load-failure case so `Load replay` click is conditional (manual-load and auto-load UI flows both supported).

### Verify
- pnpm.cmd test (workdir: apps/web) OK
- pnpm.cmd typecheck (workdir: apps/web) OK
- pnpm.cmd build (workdir: apps/web) OK
- pnpm.cmd playwright test e2e/stream-vote.spec.ts (workdir: apps/web) OK
- pnpm.cmd playwright test e2e/smoke.spec.ts e2e/stage-focus.spec.ts --grep "(/arena loads|/rulesets loads|/events loads|/replay-stage keeps recovery controls when replay load fails)" (workdir: apps/web) OK

## 2026-02-18 - Replay URL E2E selector hardening

### What
- apps/web/e2e/replay-url.spec.ts
  - Updated heading/assertion selectors to JP/EN dual-match for Replay page copy.
  - Replaced brittle keyboard legend expectation with a JP/EN compatible pattern for replay toggle hint.
  - Narrowed replay load button selector to `Load replay` (localized label) to avoid strict-mode collision with `Retry load`.

### Verify
- pnpm.cmd test (workdir: apps/web) OK
- pnpm.cmd typecheck (workdir: apps/web) OK
- pnpm.cmd build (workdir: apps/web) OK
- pnpm.cmd playwright test e2e/replay-url.spec.ts (workdir: apps/web) OK
- pnpm.cmd e2e (workdir: apps/web) OK (74 passed)

## 2026-02-18 - WO032-036 follow-up (battle board gamefeel + classic quick presets)
- Match: press-state depth, hover ghost preview, place/flip effect layers, and multi-flip stage burst.
- Classic rules: shared quick preset catalog added and surfaced on Home/Arena quick play.
- Match ribbon: added in-match rules help toggle.
- Ruleset discovery: JP-first copy and optional classicMask/theme support in buildMatchRulesetUrl.
- Decks: summary slot card collapse issue fixed.
- VFX/reduced-motion: new board effects now gated for off/low/reduce.
- Repo consistency: removed root package-lock.json (pnpm lock policy).

### Verify (this environment)
- pnpm.cmd run lint (apps/web): OK (warnings only)
- pnpm.cmd run typecheck (apps/web): OK
- pnpm.cmd run build (apps/web): blocked by spawn EPERM (esbuild child-process pipe)
- pnpm.cmd run e2e (apps/web): blocked by spawn EPERM (playwright worker spawn)
- 2026-02-18 follow-up: Home/Arena quick play now support optional `qp` URL param for classic preset restore (`standard` when absent). Preset links remain backward-compatible and existing rk/cr URL behavior is unchanged.
- Added tests: `apps/web/src/lib/__tests__/classic_quick_presets.test.ts` for preset id normalization and match URL generation.
- Verification in this environment: `pnpm.cmd run lint` and `pnpm.cmd run typecheck` passed; `build/e2e` remain blocked by spawn EPERM.
- 2026-02-18 follow-up #2: stabilized quick preset continuity. Arena links from Home now carry selected preset intent, and Arena's Pixi Stage launch now mirrors selected ruleset preset (including classic custom `cr` when needed).
- 2026-02-18 follow-up #2 verify: lint/typecheck passed. build/e2e remain blocked by spawn EPERM in this environment.
- 2026-02-18 WO037-step1: Extracted shared URL param parsers to `apps/web/src/features/match/urlParams.ts` and reused from Match/Replay (`parseFocusMode`, board/opponent/ai/season/bool parsers).
- Added unit tests for extracted parsers: `apps/web/src/features/match/__tests__/urlParams.test.ts`.
- Verification: lint/typecheck passed. build/e2e remain blocked by spawn EPERM in this environment.
- 2026-02-18 WO037-step2: Rulesets links now preserve current `theme` and keep `cr` for `classic_custom` when launching Match (via `buildMatchRulesetUrl` options).
- 2026-02-18 WO037-step2: shared URL parser module is now used by both Match and Replay for focus parsing to reduce drift.
- Verification: lint/typecheck passed; build/e2e blocked by spawn EPERM.
- 2026-02-19 WO037-step3: Match URL parsing was consolidated via `parseMatchSearchParams` in `apps/web/src/features/match/urlParams.ts` (UI/focus/mode/ruleset/first-player URL params), and `Match.tsx` now consumes the shared parser to reduce drift while preserving URL compatibility.
- Added parser coverage in `apps/web/src/features/match/__tests__/urlParams.test.ts` for match-wide URL defaults/aliases.
- Verification (this environment): `pnpm -C apps/web lint` OK / `pnpm -C apps/web typecheck` OK / `pnpm -C apps/web test` OK / `pnpm -C apps/web build` OK / `pnpm.cmd -C apps/web e2e` blocked by Playwright worker `spawn EPERM`.
- 2026-02-19 WO035-follow-up: Quick Play URL builders were consolidated in `apps/web/src/lib/classic_quick_presets.ts` (`buildQuickGuestMatchPath` / `buildQuickGuestStagePath`) and adopted by Home/Arena to prevent preset drift while keeping URL compatibility (`rk`/`cr` behavior unchanged).
- Added tests for unified quick URL builders in `apps/web/src/lib/__tests__/classic_quick_presets.test.ts`.
- Verification: `pnpm -C apps/web test` / `pnpm -C apps/web lint` / `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` passed.
- 2026-02-19 WO037-step4: `Match.tsx` ? URL ??????? `features/match/urlParams.ts` ??????`withMatchParamCompatibility` / `resolveClassicMaskParamPatch`??`rk`/`cr` ????? classic mask ????????????????????????????
- Tests: `apps/web/src/features/match/__tests__/urlParams.test.ts` ? URL????????????????
- Verification: `pnpm -C apps/web test` / `lint` / `typecheck` / `build` OK?`pnpm.cmd -C apps/web e2e` ? Playwright worker `spawn EPERM` ??????
- 2026-02-19 WO037-step5: Match URL mutators (`setParam` / `setParams` / `setFocusMode`) ? `apps/web/src/features/match/useMatchSearchMutators.ts` ??????`Match.tsx` ? hook ???????????? URL ????????
- Verification: `pnpm -C apps/web test` / `lint` / `typecheck` / `build` OK?`pnpm.cmd -C apps/web e2e` ? `spawn EPERM` ? worker ?????
- 2026-02-19 WO037-step6: Replay URL handling was extracted to `apps/web/src/features/match/replayUrlParams.ts` (`parseReplayBoardUi`, `toMatchBoardUi`, stage URL builder, board-ui/focus/step-mode mutators). `Replay.tsx` now reuses these helpers to reduce in-page URL mutation duplication.
- Added tests: `apps/web/src/features/match/__tests__/replayUrlParams.test.ts`.
- Verification: `pnpm -C apps/web lint` / `pnpm -C apps/web test` / `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` passed. `pnpm.cmd -C apps/web e2e` blocked by `spawn EPERM` in this environment.
- 2026-02-19 WO037-step7: Replay mode/step/int32 URL parser?? `apps/web/src/features/match/replayModeParams.ts` ?????`Replay.tsx` ? `parseReplayMode` / `parseReplayStepParam` / `parseSignedInt32Param` / `replayModeDisplay` ??????????????????????????????????
- Tests: `apps/web/src/features/match/__tests__/replayModeParams.test.ts` ????
- Verification: `pnpm -C apps/web test` / `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` OK?
- 2026-02-19 WO037-step8: Replay ruleset URL fallback/mode auto??? `apps/web/src/features/match/replayRulesetParams.ts` ????`resolveReplayRulesetFromParams` / `pickDefaultReplayMode` / `shouldAutoCompareByRulesetId`??`Replay.tsx` ????????URL????????
- Tests: `apps/web/src/features/match/__tests__/replayRulesetParams.test.ts` ????
- Verification: `pnpm -C apps/web lint` / `pnpm -C apps/web test` / `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` OK?
- 2026-02-19 WO037-step8 follow-up: `replayModeParams.ts` ??????????????`??/????v1/????v2/??`??
- 2026-02-19 WO037-step9: Match URL helper ? `apps/web/src/features/match/matchUrlParams.ts` ????`buildMatchStageUrl` / `withMatchBoardUi` / `withMatchFocusMode` / `withoutMatchEvent`??`Match.tsx` ? `useMatchSearchMutators.ts` ? helper ???????stage URL?focus/board-ui/event ? URL????????URL?????????
- Tests: `apps/web/src/features/match/__tests__/matchUrlParams.test.ts` ????
- Verification: `pnpm -C apps/web lint` / `pnpm -C apps/web test` / `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` OK?
- 2026-02-19 WO037-step10: Match ????????????? `apps/web/src/features/match/matchTurnUtils.ts` ????`turnPlayer` / `parseDeckTokenIds` / `computeUsed` / `countWarningMarks` / `fillTurns`??`Match.tsx` ? helper import ?????????????????
- Tests: `apps/web/src/features/match/__tests__/matchTurnUtils.test.ts` ????
- Verification: `pnpm -C apps/web lint` / `pnpm -C apps/web test` / `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` OK?
- 2026-02-19 WO037-step11: first-player ??????? `apps/web/src/features/match/matchFirstPlayerParams.ts` ????`resolveMatchFirstPlayer` / `resolveEffectiveFirstPlayer`??`Match.tsx` ? resolve payload ??????????
- Tests: `apps/web/src/features/match/__tests__/matchFirstPlayerParams.test.ts` ????
- Verification: `pnpm -C apps/web lint` / `pnpm -C apps/web test` / `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` OK?
- 2026-02-19 WO037-step12: ruleset ??????? `apps/web/src/features/match/matchRulesetParams.ts` ????classic_custom base / chainCap?? / classic?????????mask????`Match.tsx` ? ruleset ??????????
- Tests: `apps/web/src/features/match/__tests__/matchRulesetParams.test.ts` ????
- Verification: `pnpm -C apps/web lint` / `pnpm -C apps/web test` / `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` OK?

- 2026-02-19 WO037-step13: consolidated board/hand derived logic into apps/web/src/features/match/matchBoardDerived.ts; Match.tsx now reuses helper functions for available/selectable/effective-used/current-warn/classic labels and guest visibility.
- 2026-02-19 WO037-step13 tests: added apps/web/src/features/match/__tests__/matchBoardDerived.test.ts.
- 2026-02-19 WO037-step14: extracted first-player commit/reveal mutation helpers to apps/web/src/features/match/matchFirstPlayerMutations.ts and updated Match.tsx callbacks to consume helper patches/derivations.
- 2026-02-19 WO037-step14 tests: added apps/web/src/features/match/__tests__/matchFirstPlayerMutations.test.ts.
- Verification: pnpm -C apps/web lint OK / pnpm -C apps/web test OK / pnpm -C apps/web typecheck OK / pnpm -C apps/web build OK / pnpm.cmd -C apps/web e2e:ux OK (15 passed).
- 2026-02-19 WO037-step15: moved Classic Open presentation object assembly from Match.tsx into resolveClassicOpenPresentation (features/match/matchBoardDerived.ts) and reused it in Match UI render paths.
- 2026-02-19 WO037-step15 tests: extended apps/web/src/features/match/__tests__/matchBoardDerived.test.ts with Classic Open presentation assertions.
- Verification refresh: pnpm -C apps/web lint OK / pnpm -C apps/web test OK / pnpm -C apps/web typecheck OK / pnpm -C apps/web build OK / pnpm.cmd -C apps/web e2e:ux OK (15 passed).
- 2026-02-19 WO037-step16: extracted Match card loading flows into apps/web/src/features/match/matchCardLoaders.ts (index guest/normal branches, guest fallback payload, RPC load + placeholder Nyano auto-pick) while preserving URL and gameplay behavior.
- 2026-02-19 WO037-step16 tests: added apps/web/src/features/match/__tests__/matchCardLoaders.test.ts (index unavailable/missing token/rpc success+routing/error-toast classification).
- Verification refresh: pnpm -C apps/web lint OK / pnpm -C apps/web test OK / pnpm -C apps/web typecheck OK / pnpm -C apps/web build OK / pnpm.cmd -C apps/web e2e:ux OK (15 passed).
- 2026-02-19 WO037-step17: extracted replay-share composition logic to `apps/web/src/features/match/matchReplayShare.ts` (`buildReplayShareDataPayload` / `buildMatchReplayJson` / `buildMatchReplayShareUrlFromJson` / `buildMatchReplayShareUrl`) and switched `Match.tsx` to reuse helper-based share URL + QR generation while preserving URL compatibility.
- 2026-02-19 WO037-step17 tests: added `apps/web/src/features/match/__tests__/matchReplayShare.test.ts` for gzip fallback, transcript-vs-bundle payload, and share URL param composition.
- 2026-02-19 recovery follow-up: fixed strict TypeScript narrowing issue in `matchReplayShare.test.ts` after interrupted local session so `pnpm -C apps/web typecheck` passes again.
- Verification refresh: `pnpm -C apps/web lint` / `pnpm -C apps/web test` / `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` OK.
- 2026-02-19 WO037-step17 verify follow-up: `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step18: extracted stream command commit gating/resolution from `Match.tsx` into `apps/web/src/features/match/matchStreamCommands.ts` (`resolveStreamCommitTurnFromCommand`) and reduced in-page conditional branching while preserving behavior.
- 2026-02-19 WO037-step18 tests: added `apps/web/src/features/match/__tests__/matchStreamCommands.test.ts` covering stream side mismatch, AI-turn ignore, turn mismatch, board-full ignore, and classic forced-card override.
- Verification refresh: `pnpm -C apps/web lint` / `pnpm -C apps/web test` / `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` OK.
- 2026-02-19 WO037-step18 verify follow-up: `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step19: extracted match setup/replay share link builders into `apps/web/src/features/match/matchShareLinks.ts` (`buildMatchSetupShareUrl` / `buildMatchReplayLink` / `buildMatchShareTemplateMessage`) and updated `Match.tsx` call sites to use helpers while preserving URL/share compatibility.
- 2026-02-19 WO037-step19 tests: added `apps/web/src/features/match/__tests__/matchShareLinks.test.ts` for setup URL normalization, replay URL null-guard/param forwarding, and share template text.
- Verification refresh: `pnpm -C apps/web lint` / `pnpm -C apps/web test` / `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step20: extracted setup URL param patch builders to `apps/web/src/features/match/matchSetupParamPatches.ts` (`buildRulesetKeyChangeParamPatch` / `buildClassicMaskChangeParamPatch` / `buildFirstPlayerModeChangeParamPatch`) and updated `Match.tsx` to consume helpers for ruleset/classic-mask/first-player mode updates.
- 2026-02-19 WO037-step20 tests: added `apps/web/src/features/match/__tests__/matchSetupParamPatches.test.ts` for ruleset patch behavior and canonical first-player patch generation.
- Verification refresh: `pnpm -C apps/web lint` / `pnpm -C apps/web test` / `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).

- 2026-02-19 WO037-step21: extracted stage/focus action callback side-effects from Match.tsx into apps/web/src/features/match/matchStageActionCallbacks.ts (controls/assist/fullscreen/focus-exit/replay/ai-move feedback runners) and kept existing feedback text + sfx behavior.
- 2026-02-19 WO037-step21 tests: added apps/web/src/features/match/__tests__/matchStageActionCallbacks.test.ts to lock callback side-effect ordering and focus-route gating.
- Verification refresh: pnpm -C apps/web lint OK / pnpm.cmd -C apps/web test -- matchStageActionCallbacks OK / pnpm.cmd -C apps/web test OK / pnpm.cmd -C apps/web typecheck OK / pnpm.cmd -C apps/web build OK / pnpm.cmd -C apps/web e2e:ux OK (15 passed).
- 2026-02-19 WO037-step22: extracted stage action feedback timer/state helpers to `apps/web/src/features/match/matchStageFeedback.ts` (`pushStageActionFeedbackWithTimeout` / `resetStageActionFeedbackState` / `clearStageActionFeedbackTimer`) and switched `Match.tsx` to use helper-based feedback lifecycle management.
- 2026-02-19 WO037-step22 tests: added `apps/web/src/features/match/__tests__/matchStageFeedback.test.ts` for focus-route guard, timeout reset, timer replacement, and explicit reset/clear helpers.
- Verification refresh: `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web test -- matchStageFeedback` / `pnpm.cmd -C apps/web test -- matchStageActionCallbacks` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step23: extracted stage assist/control route+resize synchronization from `Match.tsx` into `apps/web/src/features/match/useMatchStageUi.ts` (`useMatchStageUi`, `resolveStageAssistVisibility`, `resolveStageControlsVisibility`) and switched page state wiring to the new hook without changing focus-mode behavior.
- 2026-02-19 WO037-step23 tests: added `apps/web/src/features/match/__tests__/useMatchStageUi.test.ts` for assist visibility resolution and stage controls visibility gating (non-focus/SSR/focus-width paths).
- Verification refresh: `pnpm.cmd -C apps/web test -- useMatchStageUi` / `pnpm.cmd -C apps/web test -- matchStageFeedback` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step24: extracted stage fullscreen state/toggle behavior from `Match.tsx` into `apps/web/src/features/match/useMatchStageFullscreen.ts` (`useMatchStageFullscreen`, `resolveIsStageFullscreen`, `toggleStageFullscreenCore`) and switched Match to hook-based fullscreen lifecycle handling with the same focus-route gating and toast warning behavior.
- 2026-02-19 WO037-step24 tests: added `apps/web/src/features/match/__tests__/useMatchStageFullscreen.test.ts` for fullscreen state resolution and toggle core branches (ignored/exited/no-target/entered).
- Verification refresh: `pnpm.cmd -C apps/web test -- useMatchStageFullscreen` / `pnpm.cmd -C apps/web test -- useMatchStageUi` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step25: extracted battle-stage board sizing state/resize sync from `Match.tsx` into `apps/web/src/features/match/useMatchStageBoardSizing.ts` (`useMatchStageBoardSizing`, `resolveMatchStageBoardSizing`) and switched Match stage sizing wiring to hook-based control while preserving battle-stage sizing behavior.
- 2026-02-19 WO037-step25 tests: added `apps/web/src/features/match/__tests__/useMatchStageBoardSizing.test.ts` for default viewport fallback, viewport-driven sizing, and battle-kind profile assertions.
- Verification refresh: `pnpm.cmd -C apps/web test -- useMatchStageBoardSizing` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step26: extracted Match stage route derivation (`stageMatchUrl`, `isBattleStageRoute`, `isStageFocusRoute`) into `apps/web/src/features/match/matchStageRouteState.ts` (`useMatchStageRouteState`, `resolveMatchStageRouteState`, route predicate helpers) and switched `Match.tsx` to consume the shared route-state hook.
- 2026-02-19 WO037-step26 tests: added `apps/web/src/features/match/__tests__/matchStageRouteState.test.ts` for pathname predicate compatibility and stage-route derived state assertions.
- Verification refresh: `pnpm.cmd -C apps/web test -- matchStageRouteState` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step27: extracted stage-focus engine board size derivation from `Match.tsx` into `apps/web/src/features/match/matchStageEngineBoardSizing.ts` (`resolveStageFocusEngineBoardMaxWidthCapPx` / `resolveMatchStageEngineBoardSizing`) and replaced inline cap/max/min board calculations with helper-driven values while preserving stage-focus hand-dock behavior.
- 2026-02-19 WO037-step27 tests: added `apps/web/src/features/match/__tests__/matchStageEngineBoardSizing.test.ts` for focus/dock cap activation, cap floor, capped max/min dimensions, and undefined-base passthrough.
- Verification refresh: `pnpm.cmd -C apps/web test -- matchStageEngineBoardSizing` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd test` (`apps/web`) / `pnpm.cmd build` (`apps/web`) / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step28: extracted stage-focus keyboard shortcut resolution/dispatch from `Match.tsx` into `apps/web/src/features/match/matchStageFocusShortcuts.ts` (`resolveMatchStageFocusShortcutAction` / `runMatchStageFocusShortcutAction`) and reduced in-page keydown branching to helper invocation while preserving focus-route shortcut behavior.
- 2026-02-19 WO037-step28 tests: added `apps/web/src/features/match/__tests__/matchStageFocusShortcuts.test.ts` for editable/modifier ignore rules, shortcut resolution guards, and action dispatch coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- matchStageFocusShortcuts` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd test` (`apps/web`) / `pnpm.cmd build` (`apps/web`) / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step29: extracted stage-focus/mint presentation flag derivation from `Match.tsx` into `apps/web/src/features/match/matchStagePresentationState.ts` (`resolveMatchStagePresentationState`) and replaced inline boolean gating for hand dock, HUD/panel visibility, quick-commit, focus-toolbar action visibility, and focus-toolbar button availability.
- 2026-02-19 WO037-step29 tests: added `apps/web/src/features/match/__tests__/matchStagePresentationState.test.ts` for hand-dock gating, mint HUD density branches, quick-commit conditions, focus-toolbar availability, legacy-vs-mint summary slot behavior, and manual AI action gating.
- Verification refresh: `pnpm.cmd -C apps/web test -- matchStagePresentationState` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd test` (`apps/web`) / `pnpm.cmd build` (`apps/web`) / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step30: extracted stage-focus keyboard event subscription from `Match.tsx` into `apps/web/src/features/match/useMatchStageFocusShortcuts.ts` (`useMatchStageFocusShortcuts`, `createMatchStageFocusKeydownHandler`) and switched `Match.tsx` to hook-driven shortcut wiring while preserving existing shortcut behavior.
- 2026-02-19 WO037-step30 tests: added `apps/web/src/features/match/__tests__/useMatchStageFocusShortcuts.test.ts` for keydown handler dispatch, replay guard, editable-target ignore behavior, and commit/undo shortcut routing.
- Verification refresh: `pnpm.cmd -C apps/web test -- useMatchStageFocusShortcuts` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd test` (`apps/web`) / `pnpm.cmd build` (`apps/web`) / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step31: extracted stage-action feedback state/timer lifecycle from `Match.tsx` into `apps/web/src/features/match/useMatchStageActionFeedback.ts` (`useMatchStageActionFeedback`, `createPushStageActionFeedback`) and switched `Match.tsx` to hook-driven feedback wiring while preserving focus-route feedback behavior.
- 2026-02-19 WO037-step31 tests: added `apps/web/src/features/match/__tests__/useMatchStageActionFeedback.test.ts` for route-gated push behavior and timeout-based feedback reset flow via injected timer API.
- Verification refresh: `pnpm.cmd -C apps/web test -- useMatchStageActionFeedback` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd test` (`apps/web`) / `pnpm.cmd build` (`apps/web`) / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step32: extracted stage-focus layout class composition from `Match.tsx` into `apps/web/src/features/match/matchStageLayoutClasses.ts` (`resolveMatchStageLayoutClasses`) and replaced inline className branching for root/focus-toolbar/arena/grid/main-column/announcer/engine-fallback/board-shell/board-center/non-mint-side-column with helper-driven values.
- 2026-02-19 WO037-step32 tests: added `apps/web/src/features/match/__tests__/matchStageLayoutClasses.test.ts` for focus vs non-focus root/toolbar labels, arena/layout class branches, mint/non-mint board class composition, and announcer/fallback banner toggles.
- Verification refresh: `pnpm.cmd -C apps/web test -- matchStageLayoutClasses` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd test` (`apps/web`) / `pnpm.cmd build` (`apps/web`) / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step33: extracted stage-action callback wiring from `Match.tsx` into `apps/web/src/features/match/useMatchStageActionCallbacks.ts` (`useMatchStageActionCallbacks`, `createMatchStageActionCallbacks`) and switched Match to hook-driven controls/assist/fullscreen/focus-exit/replay/ai callbacks while preserving feedback and SFX behavior.
- 2026-02-19 WO037-step33 tests: added `apps/web/src/features/match/__tests__/useMatchStageActionCallbacks.test.ts` for stage-assist state flip behavior plus controls/fullscreen/replay/focus-exit/ai side-effect wiring coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- useMatchStageActionCallbacks` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd test` (`apps/web`) / `pnpm.cmd build` (`apps/web`) / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step34: extracted replay/share action wiring from `Match.tsx` into `apps/web/src/features/match/useMatchReplayActions.ts` (`useMatchReplayActions`, `createMatchReplayActions`) and switched Match to hook-driven replay URL building, share URL copy, replay open, and share-template copy callbacks while preserving URL compatibility and toast behavior.
- 2026-02-19 WO037-step34 tests: added `apps/web/src/features/match/__tests__/useMatchReplayActions.test.ts` for replay URL param forwarding and copy/open/template side-effect coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- useMatchReplayActions` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd test` (`apps/web`) / `pnpm.cmd build` (`apps/web`) / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step35: extracted Nyano reaction/impact helpers from `Match.tsx` into `apps/web/src/features/match/matchStageReaction.ts` (`resolveMatchNyanoReactionInput`, `resolveMatchNyanoReactionImpact`, `shouldTriggerStageImpactBurst`, `resolveStageImpactBurstDurationMs`, `resolveBoardImpactBurstState`, `resolveBoardImpactBurstDurationMs`) and switched Match to helper-driven stage/board burst gating while preserving focus-route and animation behavior.
- 2026-02-19 WO037-step35 tests: added `apps/web/src/features/match/__tests__/matchStageReaction.test.ts` for reaction input composition, impact/burst gating, and board burst cooldown logic.
- Verification refresh: `pnpm.cmd -C apps/web test -- matchStageReaction` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd test` (`apps/web`) / `pnpm.cmd build` (`apps/web`) / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step36: extracted Match SFX side-effect wiring from `Match.tsx` into `apps/web/src/features/match/useMatchStageSfxEffects.ts` (`useMatchStageSfxEffects`, `resolveBoardAnimationSfxUpdate`, `resolveGameEndSfxName`, `resolveValidationErrorSfxName`) and switched Match to hook-driven board animation place/flip sounds, end-of-match fanfare, and validation error buzz behavior.
- 2026-02-19 WO037-step36 tests: added `apps/web/src/features/match/__tests__/useMatchStageSfxEffects.test.ts` for board-animation SFX update decisions, game-end SFX resolution, and error-buzz gating.
- Verification refresh: `pnpm.cmd -C apps/web test -- useMatchStageSfxEffects` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd test` (`apps/web`) / `pnpm.cmd build` (`apps/web`) / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step37: extracted turn-log and last-turn flip derivations from `Match.tsx` into `apps/web/src/features/match/matchTurnLogDerived.ts` (`resolveMatchLastFlipSummaryText`, `resolveMatchLastFlipTraces`, `resolveMatchRpgLogEntries`) and switched Match to helper-driven summary text, overlay arrow traces, and RPG log entries while preserving display/output behavior.
- 2026-02-19 WO037-step37 tests: added `apps/web/src/features/match/__tests__/matchTurnLogDerived.test.ts` for latest-turn summary composition, flip-trace arrow mapping, and RPG janken fallback mapping.
- Verification refresh: `pnpm.cmd -C apps/web test -- matchTurnLogDerived` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd test` (`apps/web`) / `pnpm.cmd build` (`apps/web`) / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step38: extracted Match share clipboard action wiring from `Match.tsx` into `apps/web/src/features/match/useMatchShareClipboardActions.ts` (`useMatchShareClipboardActions`, `createMatchShareClipboardActions`) and switched Match to hook-driven setup URL copy + transcript JSON copy callbacks while preserving URL compatibility and toast/error behavior.
- 2026-02-19 WO037-step38 tests: added `apps/web/src/features/match/__tests__/useMatchShareClipboardActions.test.ts` for setup URL copy success/warn branches and transcript copy success/error handling.
- Verification refresh: `pnpm.cmd -C apps/web test -- useMatchShareClipboardActions` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step39: extracted replay-share QR URL derivation from `Match.tsx` into `apps/web/src/features/match/matchShareQr.ts` (`resolveMatchShareQrUrl`) and `apps/web/src/features/match/MatchShareQrCode.tsx` (`MatchShareQrCode`), then switched the page-level Share QR block to delegate to the feature component.
- 2026-02-19 WO037-step39 tests: added `apps/web/src/features/match/__tests__/matchShareQrCode.test.ts` for transcript-null guard and replay-share URL argument forwarding (`step:9`, `absolute:true`, URL param passthrough).
- 2026-02-19 WO037-step39 recovery: fixed crash-time corruption fallout in `apps/web/src/pages/Match.tsx` (unterminated string literals and missing JSX closing tags) so the page compiles/renders again before continuing refactor work.
- Verification refresh: `pnpm.cmd -C apps/web test -- matchShareQrCode` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step40: removed the temporary in-page `ShareQrCode` wrapper from `apps/web/src/pages/Match.tsx` and replaced its only callsite with direct `MatchShareQrCode` props (`transcript`/`eventId` passthrough), reducing page-local indirection while preserving share/replay URL behavior.
- Verification refresh: `pnpm.cmd -C apps/web test -- matchShareQrCode` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step41: removed local `looksLikeRpcError` from `apps/web/src/pages/Match.tsx` and switched Match Setup CTA gating to feature helper reuse via `resolveRpcLoadErrorToastKind(error) === "rpc"` from `apps/web/src/features/match/matchCardLoaders.ts`.
- Verification refresh: `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step42: extracted RPC load error toast message mapping from `apps/web/src/pages/Match.tsx` to `apps/web/src/features/match/matchCardLoaders.ts` via `resolveRpcLoadErrorToastMessage` + shared `RpcLoadErrorToastKind`, and switched Match RPC error handling to helper-based warning rendering.
- 2026-02-19 WO037-step42 tests: expanded `apps/web/src/features/match/__tests__/matchCardLoaders.test.ts` with toast message resolver coverage (`missing_tokenid` / `rpc` / null).
- Verification refresh: `pnpm.cmd -C apps/web test -- matchCardLoaders` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step43: extracted Match card-load action wiring into `apps/web/src/features/match/useMatchCardLoadActions.ts` (`createMatchCardLoadActions`, `useMatchCardLoadActions`) and switched `apps/web/src/pages/Match.tsx` to hook-driven `loadCardsFromIndex` / `loadCardsFromRpc` / `loadCards` handling while preserving guest fallback, RPC status ref updates, and toast behavior.
- 2026-02-19 WO037-step43 tests: added `apps/web/src/features/match/__tests__/useMatchCardLoadActions.test.ts` for index guest-fallback state apply, RPC precondition error branch, RPC success/error apply flow, and mode-based loader routing.
- Verification refresh: `pnpm.cmd -C apps/web test -- useMatchCardLoadActions` / `pnpm.cmd -C apps/web test -- matchCardLoaders` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step44: extracted Match guest auto-load effect from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/useMatchGuestAutoLoad.ts` (`useMatchGuestAutoLoad`, `shouldAutoLoadGuestCards`) and switched Match to hook-driven guest auto-load invocation while preserving existing `isGuestMode`-triggered timing behavior.
- 2026-02-19 WO037-step44 tests: added `apps/web/src/features/match/__tests__/useMatchGuestAutoLoad.test.ts` for guest auto-load predicate branches (non-guest, has-cards, loading, idle guest).
- Verification refresh: `pnpm.cmd -C apps/web test -- useMatchGuestAutoLoad` / `pnpm.cmd -C apps/web test -- useMatchCardLoadActions` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step45: extracted Match card-load UI state derivation from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/matchCardLoadUiState.ts` (`resolveCanLoadCards`, `resolveMatchCardLoadEmptyState`) and switched Match setup/empty-board rendering to helper-driven `canLoad` and empty-state selection while preserving existing behavior.
- 2026-02-19 WO037-step45 tests: added `apps/web/src/features/match/__tests__/matchCardLoadUiState.test.ts` for guest/non-guest load availability and loading/guest/setup empty-state resolution.
- Verification refresh: `pnpm.cmd -C apps/web test -- matchCardLoadUiState` / `pnpm.cmd -C apps/web test -- useMatchGuestAutoLoad` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step46: extracted Match setup-panel card-load presentation derivation from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/matchCardLoadSetupState.ts` (`resolveMatchCardLoadSetupState`) and switched `MatchSetupPanelMint` props (`defaultOpen`, setup `error`, `showRpcSettingsCta`) to helper-driven state while preserving current behavior.
- 2026-02-19 WO037-step46 tests: added `apps/web/src/features/match/__tests__/matchCardLoadSetupState.test.ts` for cards-loaded suppression, RPC CTA gating, non-RPC error behavior, and null-error behavior.
- Verification refresh: `pnpm.cmd -C apps/web test -- matchCardLoadSetupState` / `pnpm.cmd -C apps/web test -- matchCardLoadUiState` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed).
- 2026-02-19 WO037-step47: extracted Match card-load empty-state panel rendering from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchCardLoadEmptyStatePanel.tsx` and switched Match to feature-component rendering for loading skeleton / guest load CTA / setup prompt branches while preserving behavior.
- 2026-02-19 WO037-step47 tests: added `apps/web/src/features/match/__tests__/MatchCardLoadEmptyStatePanel.test.tsx` for loading skeleton markup, guest button callback invocation, and setup prompt copy coverage.
- Verification refresh: `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: first sandboxed `pnpm.cmd -C apps/web test --` attempt hit `spawn EPERM`; rerun outside sandbox passed.
- 2026-02-19 WO037-step48: extracted Winner/Match-info rendering branch from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchResultSummaryPanel.tsx` and switched Match to component-driven summary rendering (`result` present vs pending branch) while preserving class/style behavior for standard and RPG modes.
- 2026-02-19 WO037-step48 tests: added `apps/web/src/features/match/__tests__/MatchResultSummaryPanel.test.tsx` for winner summary output, stage-focus pending style branch, and RPG style shell branch.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchResultSummaryPanel MatchCardLoadEmptyStatePanel` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: full `pnpm.cmd -C apps/web test --` ran outside sandbox due EPERM spawn restriction in sandbox.
- 2026-02-19 WO037-step49: extracted Match guest post-game CTA block from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchGuestPostGamePanel.tsx` and switched Match to feature-component wiring for guest rematch/load/save actions, share/replay/template buttons, and post-finalize QR details while preserving existing behavior and URL/share invariants.
- 2026-02-19 WO037-step49 tests: added `apps/web/src/features/match/__tests__/MatchGuestPostGamePanel.test.tsx` for hidden branch, saved-label/stage-focus branch, and action callback + QR details branch coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchGuestPostGamePanel` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: full `pnpm.cmd -C apps/web test --` ran outside sandbox due EPERM spawn restriction in sandbox.
- 2026-02-19 WO037-step50: extracted the non-mint side-column collapsed AI debug notes block from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchAiNotesPanel.tsx` and switched Match to feature-component rendering for visibility/style/count handling while preserving existing presentation behavior.
- 2026-02-19 WO037-step50 tests: added `apps/web/src/features/match/__tests__/MatchAiNotesPanel.test.tsx` for hidden branch, standard/stage-focus branch, and RPG style branch coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchAiNotesPanel MatchGuestPostGamePanel` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: full `pnpm.cmd -C apps/web test --` ran outside sandbox due EPERM spawn restriction in sandbox.
- 2026-02-19 WO037-step51: extracted the Match Event section from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchEventPanel.tsx` and switched Match to feature-component wiring for event visibility, status/ruleset/AI labels, Events page link, clear-event action, and Nyano deck tokenIds rendering while preserving existing behavior.
- 2026-02-19 WO037-step51 tests: added `apps/web/src/features/match/__tests__/MatchEventPanel.test.tsx` for hidden branch, event details rendering, and clear button callback coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchEventPanel MatchAiNotesPanel` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: full `pnpm.cmd -C apps/web test --` ran outside sandbox due EPERM spawn restriction in sandbox.
- 2026-02-19 WO037-step52: extracted the guest-mode intro area from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchGuestModeIntro.tsx` and switched Match to feature-component rendering for guest quick-play banner visibility plus mini-tutorial slot injection while preserving current behavior.
- 2026-02-19 WO037-step52 tests: added `apps/web/src/features/match/__tests__/MatchGuestModeIntro.test.tsx` for hidden branch, guest banner/decks link copy rendering, and tutorial-slot rendering.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchGuestModeIntro MatchEventPanel` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: full `pnpm.cmd -C apps/web test --` ran outside sandbox due EPERM spawn restriction in sandbox.
- 2026-02-19 WO037-step53: extracted non-mint side-column share buttons from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchShareActionsRow.tsx` and switched Match to feature-component wiring for JSON/share/replay actions while preserving existing disabled gating and RPG/standard class branching.
- 2026-02-19 WO037-step53 tests: added `apps/web/src/features/match/__tests__/MatchShareActionsRow.test.tsx` for class branch, disabled-state, and callback wiring coverage.
- 2026-02-19 WO037-step54: replaced the Mint drawer inline share-buttons block in `apps/web/src/pages/Match.tsx` with the extracted `MatchShareActionsRow` component, unifying share-action UI rendering across Mint and non-mint layouts without changing URL/share behavior.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchShareActionsRow` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: sandboxed vitest startup hit `spawn EPERM`; test commands were rerun outside sandbox and passed.
- 2026-02-19 WO037-step55: extracted the Mint drawer AI debug notes details block from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchMintAiNotesPanel.tsx` and switched Match to feature-component rendering for note-count visibility + content slot while preserving mint styling.
- 2026-02-19 WO037-step55 tests: added `apps/web/src/features/match/__tests__/MatchMintAiNotesPanel.test.tsx` for hidden branch, summary/children rendering, and mint panel shell style coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchMintAiNotesPanel` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: full `pnpm.cmd -C apps/web test --` was executed outside sandbox due vitest EPERM spawn restriction in sandbox.
- 2026-02-19 WO037-step56: extracted the Mint drawer density-toggle UI from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchMintDensityToggle.tsx` and switched Match to feature-component rendering for `minimal/standard/full` selection while preserving style and behavior.
- 2026-02-19 WO037-step56 tests: added `apps/web/src/features/match/__tests__/MatchMintDensityToggle.test.tsx` for option rendering, selected-style branch, and onChange callback coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchMintDensityToggle` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: full `pnpm.cmd -C apps/web test --` was executed outside sandbox due vitest EPERM spawn restriction in sandbox.
- 2026-02-19 WO037-step57: extracted the Mint drawer winner/match-info summary block from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchMintResultSummaryPanel.tsx` and switched Match to feature-component rendering with existing `matchResultSummary` reuse.
- 2026-02-19 WO037-step57 tests: added `apps/web/src/features/match/__tests__/MatchMintResultSummaryPanel.test.tsx` for winner branch output, pending branch output, and mint style variable coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchMintResultSummaryPanel` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: full `pnpm.cmd -C apps/web test --` was executed outside sandbox due vitest EPERM spawn restriction in sandbox.
- 2026-02-19 WO037-step58: extracted the Mint drawer TurnLog section from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchMintTurnLogPanel.tsx` and switched Match to feature-component rendering for `sim.ok` fallback handling and selected-turn index clamping.
- 2026-02-19 WO037-step58 tests: added `apps/web/src/features/match/__tests__/MatchMintTurnLogPanel.test.tsx` for fallback label branch, TurnLog prop forwarding with index clamp, and custom empty label branch coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchMintTurnLogPanel` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: full `pnpm.cmd -C apps/web test --` was executed outside sandbox due vitest EPERM spawn restriction in sandbox.
- 2026-02-19 WO037-step59: extracted the non-mint side-column TurnLog section from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchSideTurnLogPanel.tsx` and switched Match to feature-component rendering for RPG/standard branch routing plus non-RPG fallback handling.
- 2026-02-19 WO037-step59 tests: added `apps/web/src/features/match/__tests__/MatchSideTurnLogPanel.test.tsx` for RPG branch rendering, standard fallback rendering, and standard TurnLog prop forwarding with selected-index clamp.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchSideTurnLogPanel` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: full `pnpm.cmd -C apps/web test --` was executed outside sandbox due vitest EPERM spawn restriction in sandbox.
- 2026-02-19 WO037-step60: extracted non-mint side-column panel composition from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchSideColumnPanels.tsx`, centralizing the wiring of turn-log, result summary, share actions, guest post-game CTA, and AI notes while preserving behavior.
- 2026-02-19 WO037-step60 tests: added `apps/web/src/features/match/__tests__/MatchSideColumnPanels.test.tsx` for composition order, guest/share callback forwarding, and AI note visibility derivation coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchSideColumnPanels` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: full `pnpm.cmd -C apps/web test --` was executed outside sandbox due vitest EPERM spawn restriction in sandbox.
- 2026-02-19 WO037-step61: extracted Mint drawer panel composition from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchMintDrawerPanels.tsx`, centralizing density toggle, turn-log, winner summary, share actions, and AI notes wiring while preserving existing behavior.
- 2026-02-19 WO037-step61 tests: added `apps/web/src/features/match/__tests__/MatchMintDrawerPanels.test.tsx` for composition order, density/share callback forwarding, and AI note visibility derivation coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchMintDrawerPanels` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step62: extracted Mint drawer shell wiring from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchMintDrawerShell.tsx`, centralizing drawer-toggle visibility (`!open`) and drawer open/close composition while preserving existing Mint panel behavior.
- 2026-02-19 WO037-step62 tests: added `apps/web/src/features/match/__tests__/MatchMintDrawerShell.test.tsx` for closed/open rendering branches plus callback/children forwarding coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchMintDrawerShell` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step63: extracted hand-status header rendering from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchHandStatusHeader.tsx`, centralizing mint/rpg/standard style branching, selected-cell + dragging hints, and mint forced-order badge rendering while preserving behavior.
- 2026-02-19 WO037-step63 tests: added `apps/web/src/features/match/__tests__/MatchHandStatusHeader.test.tsx` for mint forced-badge rendering, RPG style branch, and standard style branch coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchHandStatusHeader` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step64: extracted hand-card panel branching from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchHandCardsPanel.tsx`, centralizing Mint (`HandDisplayMint`), RPG (`HandDisplayRPG`), and standard button-fallback rendering while preserving selection/drag/disabled behavior.
- 2026-02-19 WO037-step64 tests: added `apps/web/src/features/match/__tests__/MatchHandCardsPanel.test.tsx` for mint callback forwarding, RPG branch routing, and standard fallback button behavior coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchHandCardsPanel` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step65: extracted hand-area action controls from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchTurnActionPanel.tsx`, centralizing warning-mark selector rendering, commit/undo button state branching, and conditional AI-move action wiring while preserving behavior.
- 2026-02-19 WO037-step65 tests: added `apps/web/src/features/match/__tests__/MatchTurnActionPanel.test.tsx` for warning option filtering and focus class, callback/disabled-state forwarding, and RPG class branch with AI button visibility coverage.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchTurnActionPanel` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step66: extracted hand-area compact hint and shared rose error shell rendering from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchHandCompactHintPanel.tsx` and `apps/web/src/features/match/MatchErrorPanel.tsx`, and replaced both hand-section error display and simulation-error fallback panel with the shared error component.
- 2026-02-19 WO037-step66 tests: added `apps/web/src/features/match/__tests__/MatchHandCompactHintPanel.test.tsx` for draft-summary visibility behavior and `apps/web/src/features/match/__tests__/MatchErrorPanel.test.tsx` for error shell rendering.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchHandCompactHintPanel MatchErrorPanel` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step67: extracted the stage-focus hand-dock action row from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchFocusHandDockActions.tsx`, centralizing warning-mark selector wiring plus commit/undo button state handling while preserving existing mint focus behavior.
- 2026-02-19 WO037-step67 tests: added `apps/web/src/features/match/__tests__/MatchFocusHandDockActions.test.tsx` for warning option filtering against the current draft cell, callback/disabled-state forwarding, and selector disable conditions (`isAiTurn` / warn depleted).
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchFocusHandDockActions` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step68: extracted the stage-focus hand-dock card row from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchFocusHandDockCards.tsx`, preserving loading-shell rendering, fan tilt/drop CSS variable derivation, selected/forced/used card styling, and drag-drop payload wiring.
- 2026-02-19 WO037-step68 tests: added `apps/web/src/features/match/__tests__/MatchFocusHandDockCards.test.tsx` for loading branch rendering, click/drag callback forwarding on enabled cards, and disabled-card guard behavior (click blocked + drag prevented).
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchFocusHandDockCards` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step69: extracted the stage-focus hand-dock header status row from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchFocusHandDockHeaderRow.tsx`, centralizing AI thinking/selected-card+cell status text derivation while keeping the existing label copy and forced-rule badge rendering in-page.
- 2026-02-19 WO037-step69 tests: added `apps/web/src/features/match/__tests__/MatchFocusHandDockHeaderRow.test.tsx` for AI thinking text, selected card/cell text, and null placeholder text branches.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchFocusHandDockHeaderRow` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step70: extracted the stage-focus hand-dock shell composition from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchFocusHandDock.tsx`, consolidating stage/inline dock class branching, forced-card badge rendering, and child composition of header/cards/actions while preserving current behavior.
- 2026-02-19 WO037-step70 tests: added `apps/web/src/features/match/__tests__/MatchFocusHandDock.test.tsx` for stage-vs-inline shell class branching, forced-badge visibility, and key child prop forwarding.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchFocusHandDock` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step71: extracted the hand-area interaction branch composition from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchHandInteractionArea.tsx`, centralizing the normal-controls path (`MatchHandStatusHeader` + `MatchHandCardsPanel` + `MatchTurnActionPanel`) and compact-hint fallback path while preserving behavior.
- 2026-02-19 WO037-step71 tests: added `apps/web/src/features/match/__tests__/MatchHandInteractionArea.test.tsx` for visible-controls rendering, focus-dock compact-hint rendering, and mint-select telemetry forwarding with undo availability derived from turn count.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchHandInteractionArea` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step72: extracted the Mint desktop quick-commit toolbar from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchQuickCommitBar.tsx`, preserving draft summary text, warning-cell option filtering, warning selector disable guards, and quick commit/undo action wiring.
- 2026-02-19 WO037-step72 tests: added `apps/web/src/features/match/__tests__/MatchQuickCommitBar.test.tsx` for warning option filtering by selected draft cell, warning/commit/undo callback forwarding, and disable-state gating.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchQuickCommitBar` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step73: extracted board-adjacent feedback rendering from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchBoardFeedbackPanels.tsx`, consolidating `LastMoveFeedback` route/animation wiring and non-stage legacy status summary styling while preserving behavior.
- 2026-02-19 WO037-step73 tests: added `apps/web/src/features/match/__tests__/MatchBoardFeedbackPanels.test.tsx` for active/idle animation feedback branches, standard summary rendering, and stage-focus summary suppression.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchBoardFeedbackPanels` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: vitest in sandbox hits `spawn EPERM`, so targeted/full test runs were executed outside sandbox.
- 2026-02-19 WO037-step74: extracted right-column layout branching from `apps/web/src/pages/Match.tsx` into `apps/web/src/features/match/MatchInfoColumn.tsx`, centralizing Mint drawer shell/panels and non-mint side-column composition routing while preserving existing prop/callback wiring (`drawerOpen`, density control, share/replay actions, guest post-game actions).
- 2026-02-19 WO037-step74 tests: added `apps/web/src/features/match/__tests__/MatchInfoColumn.test.tsx` for Mint/non-mint branch routing, drawer prop forwarding, and side-column prop forwarding.
- Verification refresh: `pnpm.cmd -C apps/web test -- MatchInfoColumn` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` OK (15 passed). Note: initial sandboxed targeted vitest run failed with `spawn EPERM`; rerun outside sandbox succeeded.
- 2026-02-19 WO035: introduced classic quick preset utilities in `apps/web/src/lib/classic_quick_presets.ts` and wired quick preset selection into `apps/web/src/pages/Home.tsx` / `apps/web/src/pages/Arena.tsx` (`qp` param, quick match/stage URL builders), plus `apps/web/src/pages/Rulesets.tsx` match CTA propagation of `theme` and `cr` via `buildMatchRulesetUrl` options.
- 2026-02-19 WO035 replay/url cleanup: moved Replay URL/mode/ruleset resolver logic out of `apps/web/src/pages/Replay.tsx` into feature helpers (`apps/web/src/features/match/replayUrlParams.ts`, `apps/web/src/features/match/replayModeParams.ts`, `apps/web/src/features/match/replayRulesetParams.ts`) to align with Match-page modularization boundaries.
- 2026-02-19 WO036 UI consistency: updated Mint interaction surfaces (`apps/web/src/components/BoardViewMint.tsx`, `apps/web/src/components/ClassicRulesRibbonMint.tsx`, `apps/web/src/components/mint/MintPressable.tsx`, `apps/web/src/mint-theme/mint-theme.css`) with hover ghost preview, compact rule-help disclosure, pressed-state visual feedback, and quick-rules chip styles; normalized lockfile policy by removing `package-lock.json` from a pnpm-managed repo.
- 2026-02-19 WO035/WO036 validation: `pnpm.cmd -C apps/web test -- classic_quick_presets ruleset_discovery` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test --` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` all passed (15 Playwright tests).
- 2026-02-19 WO039/040/041/042/043: completed motion/background/gamefeel/idle-guidance/UX consistency pass for Mint UI by adding a shared motion token set + `mint-motion-*` utilities, Alive background layers (`mint-app-shell__grid` / `mint-app-shell__noise`), stage burst levels with particle/confetti layer wiring, idle guidance states (`useIdle`, board selectable cue, hand-tray cue, primary CTA cue), and minimum hit-target hardening via `mint-hit` on `MintPressable`.
- 2026-02-19 WO039/040/041/042/043 integration: wired Match stage/board/hand to new guidance and burst states in `apps/web/src/pages/Match.tsx`, extended `DuelStageMint` (`impactBurstLevel`) and `BoardViewMint` (`idleGuideSelectables`), and updated `Home`/`Arena` quick-play CTA guidance plus `AnimatedOutlet` motion class usage.
- 2026-02-19 WO039/040/041/042/043 validation: `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test --` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` all passed (Vitest 173 files / 1584 tests, Playwright 15 tests).
- 2026-02-19 docs consistency cleanup: marked WO-039/040/041/042/043 acceptance checklists complete in their work-order files and resolved the stale DEV TODO replay mismatch-test checkbox to align with implemented `apps/web/e2e/replay-ruleset-fallback-guardrails.spec.ts`.
- 2026-02-19 WO027 follow-up polish: tokenized `MintRulesetPicker` visual primitives in `apps/web/src/mint-theme/mint-theme.css` (`--mint-ruleset-*` custom properties) and switched picker transitions to shared motion tokens (`--mint-motion-*`) to keep styling/motion consistent with sitewide mint theme.
- 2026-02-19 docs consistency cleanup (WO025/026/027): updated the stale `Next (Planned)` checkboxes in `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` to `[x]` so top-level status matches the already-completed WO update section below it.
- 2026-02-19 WO001/WO002 consistency sync: marked `codex/work_orders/001_fix_nft_images.md` and `codex/work_orders/002_fix_replay_share.md` checklists complete based on existing implementation (`resolveNyanoImageUrl`, `NyanoCardArt`, `textureResolver`, `appUrl`, `Replay` recovery UI, `replay_bundle`). Validation run: `pnpm.cmd -C apps/web test -- resolveNyanoImageUrl tokenImageUrls textureResolver card_image_retry appUrl replay_bundle replay_share_params` (7 files / 80 tests passed).
- 2026-02-19 WO003-A scaffold: introduced `engineAssetManifest` (v1 manifest + URL map builders) and added `public/assets/engine/{board,cell,card,fx}` placeholders for incremental Pixi visual asset rollout. Validation: `pnpm.cmd -C apps/web test -- engineAssetManifest` and `pnpm.cmd -C apps/web build` passed.
- 2026-02-19 WO003-B: added `boardLayerTokensForQuality` and refactored `PixiBattleRenderer` board rendering into explicit shadow/base/detail layers (`boardBackdropShadow` + existing base/detail). Cell shadow/aura alphas now reuse the same quality token source; added unit test `apps/web/src/engine/__tests__/boardLayerTokens.test.ts`.
- 2026-02-19 WO003-C: refined Pixi place/flip event animation profile in `apps/web/src/engine/renderers/pixi/cellAnimations.ts` by shortening durations (low 220/220/90, medium/high 360/440/120) and reducing scale/brightness peak amplitudes for cleaner, less noisy feedback while keeping event readability; synchronized assertions in `apps/web/src/engine/__tests__/cellAnimations.test.ts`.
- 2026-02-19 WO003-D: implemented high-tier pseudo holo/foil finish by adding `foilFx.ts` and wiring `PixiBattleRenderer` to keep a subtle static foil base only on `vfx=high` with texture present, while preserving event-synced short foil flash during place/flip animations.
- 2026-02-19 WO003-E: added VFX switching guard tests (`foilFx.test.ts`, `vfxQualitySwitchGuard.test.ts`) and updated WO003 manual verification steps for Match/Replay focus-toolbar VFX selector flow. Validation: `pnpm.cmd -C apps/web test -- foilFx vfxQualitySwitchGuard cellAnimations boardLayerTokens preloadPolicy`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web build`.
- 2026-02-20 WO038: introduced Playwright screenshot guardrail for engine board (`apps/web/e2e/engine-stage-visual-regression.spec.ts`) with deterministic guest-pvp/focus URL and stable visual mode (`prefers-reduced-motion`, `vfx=off`), plus committed baseline snapshots for initial/after-place states and wired spec into `e2e:ux`.
- 2026-02-20 docs consistency: synchronized WO008/WO009 checklist states with their completed implementation updates (Deliverables + task breakdown set to done) to avoid planning/status drift.
- 2026-02-20 docs consistency: synchronized WO025/WO026/WO027 checklist states with existing implementation evidence (ruleset registry/discovery expansion, classic custom mask encode/decode + replay fallback, MintRulesetPicker + tests) to keep planning docs aligned with shipped behavior.
- 2026-02-20 WO037-step75: shared Pixi fallback hook for Match and Replay; added useEngineRendererFallback tests; verified with apps/web test, lint, typecheck, build.
- 2026-02-20 WO037-step76: Replay now uses useMatchStageActionFeedback for stage-focus feedback timers/reset behavior, replacing duplicated local timer state/effects in Replay.tsx. Verification: pnpm.cmd -C apps/web test -- useMatchStageActionFeedback / lint / typecheck / build OK.
- 2026-02-20 WO037-step77: Replay now reuses useMatchStageFullscreen for fullscreen state and toggle handling, removing local fullscreenchange listener and inline toggle callback from Replay.tsx. Verification: pnpm.cmd -C apps/web test -- useMatchStageFullscreen / lint / typecheck / build OK.
- 2026-02-20 WO037-step78: Replay now uses useMatchStageUi for stage-controls visibility/toggle behavior, removing duplicated resize/manual-override logic from Replay.tsx. Verification: pnpm.cmd -C apps/web test -- useMatchStageUi / lint / typecheck / build OK.
- 2026-02-20 WO037-step79: extracted Replay keydown shortcut resolution/dispatch into replayStageFocusShortcuts + useReplayStageFocusShortcuts and replaced inline keydown effect in Replay.tsx. Verification: pnpm.cmd -C apps/web test -- replayStageFocusShortcuts useReplayStageFocusShortcuts / lint / typecheck / build OK.
- 2026-02-20 WO037-step80: extracted Replay stage board sizing/responsive resize logic into useReplayStageBoardSizing and replaced local sizing state/effect in Replay.tsx. Verification: pnpm.cmd -C apps/web test -- useReplayStageBoardSizing / lint / typecheck / build OK.
- 2026-02-20 WO037-step81: extracted Replay stage-focus UI action callbacks (fullscreen/controls/setup/panels/exit) into replayStageActionCallbacks + useReplayStageActionCallbacks and replaced inline callback definitions in Replay.tsx. Verification: pnpm.cmd -C apps/web test -- replayStageActionCallbacks useReplayStageActionCallbacks / lint / typecheck / build OK.

- 2026-02-20 WO037-step82: extracted Replay stage route derivation (/replay-stage detection, focus-route bool, stage URL generation) into apps/web/src/features/match/replayStageRouteState.ts (isReplayStagePathname, resolveReplayStageRouteState, useReplayStageRouteState) and replaced duplicated route logic in apps/web/src/pages/Replay.tsx.
- 2026-02-20 WO037-step82 verification: pnpm.cmd -C apps/web test -- replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (sandboxed vitest failed once with spawn EPERM; rerun outside sandbox passed).

- 2026-02-20 WO037-step83: extracted Replay search-param mutators from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/useReplaySearchMutators.ts (setReplayBoardUi + setFocusMode) with pure helpers resolveReplayBoardUiMutation/resolveReplayFocusModeMutation.
- 2026-02-20 WO037-step83 tests/verification: added apps/web/src/features/match/__tests__/useReplaySearchMutators.test.ts and verified pnpm.cmd -C apps/web test -- useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (sandboxed vitest failed once with spawn EPERM; rerun outside sandbox passed).

- 2026-02-20 WO037-step84: extracted Replay share URL mode/step sync logic from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/useReplayStepModeUrlSync.ts using resolveReplayStepModeSyncMutation + useReplayStepModeUrlSync.
- 2026-02-20 WO037-step84 tests/verification: added apps/web/src/features/match/__tests__/useReplayStepModeUrlSync.test.ts and verified pnpm.cmd -C apps/web test -- useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (sandboxed vitest failed once with spawn EPERM; rerun outside sandbox passed).

- 2026-02-20 WO037-step85: extracted Replay non-engine focus guard logic from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/useReplayEngineFocusGuard.ts using resolveReplayEngineFocusGuardMutation + useReplayEngineFocusGuard.
- 2026-02-20 WO037-step85 tests/verification: added apps/web/src/features/match/__tests__/useReplayEngineFocusGuard.test.ts and verified pnpm.cmd -C apps/web test -- useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (sandboxed vitest failed once with spawn EPERM; rerun outside sandbox passed).

- 2026-02-20 WO037-step86: extracted Replay broadcast URL sync (broadcast=1 query mutation + local toggle state update) from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/useReplayBroadcastToggle.ts via resolveReplayBroadcastToggleMutation + useReplayBroadcastToggle.
- 2026-02-20 WO037-step86 tests/verification: added apps/web/src/features/match/__tests__/useReplayBroadcastToggle.test.ts and verified pnpm.cmd -C apps/web test -- useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (sandboxed vitest failed once with spawn EPERM; rerun outside sandbox passed).

- 2026-02-20 WO037-step87: extracted Replay error-panel share actions from inline JSX handlers in apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayShareParamActions.ts (resolveReplayRetryPayload / resolveReplayClearShareParamsMutation), then rewired Retry/Clear buttons to dedicated handlers.
- 2026-02-20 WO037-step87 tests/verification: added apps/web/src/features/match/__tests__/replayShareParamActions.test.ts and verified pnpm.cmd -C apps/web test -- replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (sandboxed vitest failed once with spawn EPERM; rerun outside sandbox passed).

- 2026-02-20 WO037-step88: extracted Replay highlight navigation helpers (next/prev wrap-around step resolution, current highlight index, toolbar status text formatter) from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayHighlightNavigation.ts and switched corresponding callbacks/memos to these pure helpers.
- 2026-02-20 WO037-step88 tests/verification: added apps/web/src/features/match/__tests__/replayHighlightNavigation.test.ts and verified pnpm.cmd -C apps/web test -- replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step89: extracted Replay transport derived state from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayTransportState.ts (canStepBack/canStepForward/canPlay/showStageToolbarTransport + transport class tokens), and replaced inline derivations with a memoized helper call.
- 2026-02-20 WO037-step89 tests/verification: added apps/web/src/features/match/__tests__/replayTransportState.test.ts and verified pnpm.cmd -C apps/web test -- replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step90: extracted Replay autoplay timer logic from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/useReplayAutoplay.ts (resolveReplayAutoplayIntervalMs / resolveReplayAutoplayAdvance / useReplayAutoplay) and replaced inline interval effect with hook call.
- 2026-02-20 WO037-step90 tests/verification: added apps/web/src/features/match/__tests__/useReplayAutoplay.test.ts and verified pnpm.cmd -C apps/web test -- useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step91: extracted Replay stage impact burst behavior from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/useReplayStageImpactBurst.ts (resolveReplayNyanoReactionImpact / resolveReplayStageImpactBurstPlan / useReplayStageImpactBurst), reusing shared match-stage reaction helpers for impact and burst-duration rules.
- 2026-02-20 WO037-step91 tests/verification: added apps/web/src/features/match/__tests__/useReplayStageImpactBurst.test.ts and verified pnpm.cmd -C apps/web test -- useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step92: extracted Replay compare-state derivation from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayCompareState.ts (resolveReplayCompareMode / resolveReplayCompareDiverged), then replaced inline compare/diverged expressions with helper calls.
- 2026-02-20 WO037-step92 tests/verification: added apps/web/src/features/match/__tests__/replayCompareState.test.ts and verified pnpm.cmd -C apps/web test -- replayCompareState useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step93: extracted Replay preload token-id derivation from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayPreloadTokenIds.ts (deckA/deckB merge + first-seen dedupe), then replaced inline Set-based logic with helper call.
- 2026-02-20 WO037-step93 tests/verification: added apps/web/src/features/match/__tests__/replayPreloadTokenIds.test.ts and verified pnpm.cmd -C apps/web test -- replayPreloadTokenIds replayCompareState useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step94: extracted Replay classic visibility derivation from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayClassicState.ts (resolveReplayClassicState + formatClassicOpenSlots), including swap/open resolution, open-slot visibility sets, and three-open mask flag.
- 2026-02-20 WO037-step94 tests/verification: added apps/web/src/features/match/__tests__/replayClassicState.test.ts and verified pnpm.cmd -C apps/web test -- replayClassicState replayPreloadTokenIds replayCompareState useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step95: extracted Replay board compare/delta and Nyano reaction input derivation from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayDerivedState.ts (replayBoardEquals / resolveReplayBoardDelta / resolveReplayNyanoReactionInput), and switched Replay.tsx call sites to use helper imports.
- 2026-02-20 WO037-step95 tests/verification: added apps/web/src/features/match/__tests__/replayDerivedState.test.ts and verified pnpm.cmd -C apps/web test -- replayDerivedState replayClassicState replayPreloadTokenIds replayCompareState useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step96: extracted Replay small UI helpers from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayUiHelpers.ts (STAGE_VFX_OPTIONS / clampInt / formatStageVfxLabel) and replaced in-page references with helper imports.
- 2026-02-20 WO037-step96 tests/verification: added apps/web/src/features/match/__tests__/replayUiHelpers.test.ts and verified pnpm.cmd -C apps/web test -- replayUiHelpers replayDerivedState replayClassicState replayPreloadTokenIds replayCompareState useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step97: extracted Replay ruleset label formatters from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayRulesetLabel.ts (rulesetLabelFromConfig / rulesetLabelFromRegistryConfig / rulesetLabelFromUrlFallback) and switched Replay.tsx to import the shared helpers.
- 2026-02-20 WO037-step97 tests/verification: added apps/web/src/features/match/__tests__/replayRulesetLabel.test.ts and verified pnpm.cmd -C apps/web test -- replayRulesetLabel replayUiHelpers replayDerivedState replayClassicState replayPreloadTokenIds replayCompareState useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step98: extracted Replay ruleset context derivation from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayRulesetContext.ts (resolveReplayRulesetContext / resolveReplayRulesetIdMismatchWarning + mismatch warning constant), then switched Replay.tsx load flow to consume the helper return values.
- 2026-02-20 WO037-step98 tests/verification: added apps/web/src/features/match/__tests__/replayRulesetContext.test.ts and verified pnpm.cmd -C apps/web test -- replayRulesetContext replayRulesetLabel replayUiHelpers replayDerivedState replayClassicState replayPreloadTokenIds replayCompareState useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step99: extracted Replay current simulation+label selection from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayResultSelection.ts (resolveReplayCurrentResult), then replaced inline v1/v2/compare/resolved branch logic with helper output wiring.
- 2026-02-20 WO037-step99 tests/verification: added apps/web/src/features/match/__tests__/replayResultSelection.test.ts and verified pnpm.cmd -C apps/web test -- replayResultSelection replayRulesetContext replayRulesetLabel replayUiHelpers replayDerivedState replayClassicState replayPreloadTokenIds replayCompareState useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step100: extracted Replay overlay summary derivation from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayOverlaySummary.ts (resolveReplayOverlayLastMove / resolveReplayOverlayLastTurnSummary), then replaced inline pushOverlay summary assembly with helper calls.
- 2026-02-20 WO037-step100 tests/verification: added apps/web/src/features/match/__tests__/replayOverlaySummary.test.ts and verified pnpm.cmd -C apps/web test -- replayOverlaySummary replayResultSelection replayRulesetContext replayRulesetLabel replayUiHelpers replayDerivedState replayClassicState replayPreloadTokenIds replayCompareState useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step101: extracted Replay overlay publish payload assembly from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayOverlayState.ts (buildReplayOverlayErrorState / buildReplayOverlayProtocolV1 / buildReplayOverlayState), then replaced inline pushOverlay payload objects with helper calls.
- 2026-02-20 WO037-step101 tests/verification: added apps/web/src/features/match/__tests__/replayOverlayState.test.ts and verified pnpm.cmd -C apps/web test -- replayOverlayState replayOverlaySummary replayResultSelection replayRulesetContext replayRulesetLabel replayUiHelpers replayDerivedState replayClassicState replayPreloadTokenIds replayCompareState useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (vitest executed outside sandbox).

- 2026-02-20 WO037-step102: extracted Replay card resolution from apps/web/src/pages/Replay.tsx into apps/web/src/features/match/replayCardLoaders.ts (resolveReplayCardsFromPayload + formatReplayMissingCardsError), covering v2 embedded-card path and v1 resolveCards + missing-card guard error composition.
- 2026-02-20 WO037-step102 tests/verification: added apps/web/src/features/match/__tests__/replayCardLoaders.test.ts and verified pnpm.cmd -C apps/web test -- replayCardLoaders replayOverlayState replayOverlaySummary replayResultSelection replayRulesetContext replayRulesetLabel replayUiHelpers replayDerivedState replayClassicState replayPreloadTokenIds replayCompareState useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState / pnpm.cmd -C apps/web lint / pnpm.cmd -C apps/web typecheck / pnpm.cmd -C apps/web build OK (sandboxed vitest failed once with spawn EPERM; rerun outside sandbox passed).
