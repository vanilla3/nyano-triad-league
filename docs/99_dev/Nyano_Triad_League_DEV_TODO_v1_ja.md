# Nyano Triad League ?????TODO??1??

?????????????????????????????????????????????????????????????????????????????????ODO??????

---

## ??Done

- ??Commit0001: ???????????????ocs??????riad-engine skeleton??
- ??Commit0002: ??????????????v1??IP-712 / matchId?????? ruleset config spec????????
- ??Commit0003: ??????????????????????????????????????????????????+ ERC-6551 / staking???????
- ??Commit0004: triad-engine Layer2??arning mark / combo bonus / second-player balance??????+ ??????????????
- ??Commit0005: triad-engine Layer3??rait????v1??????+ ???????
- ??Commit0006: Nyano Peace ??????????? Trait ??????????TraitType ???????1??
  - `synergy.traitDerivation` ??ruleset ??????
  - TS???????makeCardDataFromNyano` / `deriveTraitTypeFromNyanoTraitV1`??
  - `TRAIT_DERIVATION_SPEC` ????

  - Shadow / Forest / Earth / Thunder / Light
  - Cosmic / Metal / Flame / Aqua / Wind
  - `TRAIT_EFFECTS_SPEC` ???????????????uleset/transcript????????????

---

- ??Commit0007: Formation bonuses??ayer3??????1 ????+ ????????
  - ??????????ive Elements Harmony????omboBonus ?? triadPlus ?????????
  - ??????clipse????ight+Shadow ??????????ight???????????hadow??ight??????
  - MatchResult ?? `formations` ????????I/????? ?????????????????????????
  - `FORMATION_BONUS_SPEC` ??????uleset/transcript ????


- ??Commit0008: rulesetId ????????????BI???????????? RULESET_ID_SPEC + ??????????
  - ??????????????????????????????ID????????????
  - ????????? requiredElements ?????????????????????
  - `computeRulesetIdV1(ruleset)` ????????S?????????
- ??Sprint UX: Home???????????????????????????????????????quickplay_to_first_place_ms`??
- ??Sprint UX: Home LCP ??????????????????????home_lcp_ms`??
- ??Sprint UX: Home Settings ?? UX????? PASS/FAIL ???????????-1/B-1/B-4/G-3??
- ??Sprint UX: `Copy Snapshot` ?? `PLAYTEST_LOG.md` ??????????????????????????
- ??Sprint UX: web lint warning 2??????????pnpm -C apps/web lint` warning 0??
- ??Sprint UX: Snapshot??????????????????oute/viewport/language/UA?????????????????????????
- ??Sprint UX: NyanoCardArt ????????? Retry ???????????etry nonce ???????????
- ??Commit0104: ??????????????????????????????roposal / vote / adopt??? TS ???????
  - `season_council.ts` ????????roposalId / vote hash / EIP-712 vote verify / tally / adopt??
  - ?????????????????????????canonicalize?????voter??????nonce?????????? rulesetId ??????
  - ????? `SEASON_COUNCIL_SPEC` ??????
- ??Commit0105: permissionless ladder format v1??ranscript + settled event + ????????? TS ???????
  - `ladder.ts` ????????IP-712 attestation / record verify / deterministic standings??
  - indexer ??????? tie-break ???????oints ??wins ??tileDiff ??losses ??address??
  - ????? `LADDER_FORMAT_SPEC` ??????
- ??Commit0106: Phase 3 hardening??rror tracking + release runbook???????????
  - `apps/web/src/lib/error_tracking.ts` ????????lobal error / unhandledrejection ???????
  - sink ?????????????ocal / console / remote, env??????
  - `docs/99_dev/RELEASE_RUNBOOK_v1_ja.md` ????????ersioning/changelog/rollback/feature flag??
  - `pnpm run release:check` ????????????????????????????
- ??Commit0107: ????????????quickstart ????????????????????????
  - `apps/web/src/lib/onboarding.ts` ????????ocalStorage????????????????????????
  - Home ????????????1????????????????????????1?????????????????????
  - Match ????????????????? `start_first_match` / `commit_first_move` ????????
  - `onboarding.test.ts` ???????????????????????????fallback??eset??
- ??Commit0108: /stream ???????????????G??????/ BAN / slow mode???????
  - `stream_moderation.ts` ???????????????????pure function ????
  - VoteControlPanel ?? moderation ????I??low mode??? / banned users / blocked words???????
  - ?????????? BAN / NG??????/ slow mode ?????????udit ?? reject ????????
  - `local_settings` ?? moderation ?????????????????oundtrip test ?????
- ??Commit0109: /events ?? Season Archive??ocal???????
  - `season_archive.ts` ????????eason/event?????????? pure function ????
  - Events ?? season ????????/??????????????????Replay?????Markdown???????????
  - `event_attempts` ??????????????? API ????????????????????????????????
  - `season_archive.test.ts` / `event_attempts.test.ts` ??????? storage API ??????
- ??WO005-A follow-up: Stage route query????? + Stage E2E??????????????
  - `normalizeStageFocusParams` ?????????ui=engine` + `focus=1` + `layout`??????????
  - `/battle-stage` `/replay-stage` ??? `stage-focus.spec.ts` ??????????RL???????????I??????????
- ??WO005-B follow-up: Stage????????????????????????????????????
  - `shouldShowStageSecondaryControls` ??????????????????UI????????????????
  - Match/Replay ?? stage route ?? resize ????+ ??????????????anual override???????
  - mobile replay-stage ?? transport ???????????????+ Show controls ??????E2E ??????
- ??WO005-C follow-up: 375px??? Commit ?????????????2E????
  - battle-stage focus ?????????? Commit ???????viewport ?????????????????
  - ???????????????????scrollWidth - clientWidth`?????????????????????
- ??WO005-D follow-up: replay-stage ???????????????????E2E????
  - game index / RPC ?????????replay-stage ?? `Load replay` ?????????????????
  - `Retry load` ?? `Clear share params` ?????????????????????????????????
- ??WO005-E follow-up: Nyano AI ????????????????????
  - `computeAiAutoMoveDelayMs` ????????/?????????/??????????????????????????
  - `turn_timing.test.ts` ????????????????????????????????????
- ??WO005-F follow-up: Nyano cut-in ??reduced-motion / low-vfx ???????
  - `NyanoReaction` ?? cut-in timing ??`reduced-motion` ?? `data-vfx` ?????????
  - `vfx=off/low` ??? burst ????????????????????????
  - `NyanoReaction.timing.test.ts` ?????????????????????????
- ??WO005-G follow-up: Game Index ??????? guest battle ??????????????????
  - Game Index ??????????? guest mode ?????????????????????????????
  - stage battle ??????????????????????????????????????????E2E ??????
- ??Commit0110: /events ?? Local Season Points???????????/???????????????
  - `season_progress.ts` ????????oints?????tier?????event??????????????pure function ????
  - Events ?? `Local season points (provisional)` ???????ier/??Tier????/??????????????
  - `Season points board` ?? markdown ??????rchive + progress???????
  - `season_progress.test.ts` ????????oints/tier/tie-break/markdown??
- ??Commit0111: /events ?? season points ??pointsDelta ??????????????
  - Replay URL ?? `pda`??ointsDeltaA??? Event attempt ???????????
  - `season_archive.ts` ?? pointsDelta ?????????????????????
  - `season_progress.ts` ????vent?????attempt?? pointsDelta ??????????????ointsDelta????????????? provisional ??????
  - Events UI ?? markdown ?? source mix??ointsDelta/provisional????????????
- ??Commit0112: /events ?? settled event JSON ?????????????????????? pointsDelta ?????
  - `settled_points_import.ts` ????????chema?????settled event??????winner/tiles????????????
  - Events ?? `Settled points import (local)` UI ??????????????????????????????????
  - matchId ??????????????? local attempt ?? `pointsDeltaA` / `pointsDeltaSource=settled_attested` ?????
- ??Commit0113: /events ?? settled import ??????????? + ?????????????????????
  - `parseVerifiedLadderRecordsImportJson` ????????{domain, records}` ??`verifyLadderMatchRecordV1` ????????
  - import UI ?? mode ?????settled events` / `verified records`???????
  - `/game/settled_events.json` ???????????????????
  - verified import ???????????attestation_invalid`??? issue ??????
## ?? Doing (now)

- ?? Phase 4 ?????????????????? / ??????????? pointsDelta ????????????????????????????/????UI????????????????????????????????????????????????
- ?? WO005??tage UI/UX?????? `/battle-stage` `/replay-stage` ?????????????????????????????????

## ??? Next (high priority)


### A. ???????????????????????
- [x] ??????????olidity????Transcript??????1 ABI-encode hash??
- [x] RulesetRegistry??ermissionless???????????ulesetId -> config hash / metadata ??????????
- [x] ??ind?????/????????????????????????ommit-reveal / seed / ????????????

### B. ????????????????????????????????????????
- [x] ??????ayer4??????????????????orner boost / center locked / chain cap???1??????
  - `meta.chainCapPerTurn` ??TS??????????????????????????????????????????????????
  - v1???? engine-only??ulesetId canonicalization ???????????

### C. ????????????????????????????????????????
- [x] ???????????????????uleset proposal / vote / adopt ??????????????
- [x] ??????????????????????????????????????????????????????????
  - transcript + settled event + EIP-712 attestation ???????????
  - indexer ???????????tie-break ????????buildLadderStandingsV1`??

---

## ?? Research / Optional

- [ ] ERC-6551??yano??????????????????????????????????????/????????
- [ ] NFT????????????? Season Pass / ???????????? / ???????ybil??????????????????
- [ ] ????????????Oasys?????????????????????????????????????
- Sprint UX: Home Settings now keeps local UX snapshot history (save on copy, view recent 5, clear history).
- ??WO005-H follow-up: Pixi card-art texture failure guidance + manual retry
  - `BattleStageEngine` ?? card-art ??????????????????????????????Retry card art` ??????
  - `TextureResolver` ?? failed/pending ????????? status event ????????????????????????????????
  - `textureResolverPreload.test.ts` ?? failed->retry success ????????????
- ??WO005-I follow-up: Pixi/WebGL init failure auto fallback
  - `ui=engine` ?? Pixi ???????????? `BoardViewMint` ?????????????????????????????
  - `/battle-stage` `/replay-stage` ?? `Retry Pixi` ?????????
  - stage-focus E2E ?? WebGL unavailable ???????????????????????
- ? WO005-J follow-up: replay-stage WebGL fallback ? E2E???????
  - `/replay-stage` ? WebGL unavailable ?? Mint fallback + retry??? stage-focus E2E???
  - 375px commit??????? fallback ?????????????

- [x] 2026-02-14 WO006/WO007 Classic Rules implemented (engine + web): RulesetConfigV2, classic RNG, Order/Chaos/Swap/Reverse/AceKiller/Plus/Same/Type Ascend/Descend, Match UI integration, and classic test coverage.
- [x] Follow-up: update stream strict allowlist for Order/Chaos in `apps/web/src/lib/triad_vote_utils.ts` if Classic is enabled in stream voting mode.
- [x] Follow-up: replay `mode=auto` now resolves known Classic `rulesetId` via local ruleset registry instead of falling back to v1/v2 compare.
- [x] Follow-up: show deterministic Classic Swap slot mapping (`A{n} ? B{m}`) in Match setup and Replay details when swap is active.
- [x] Follow-up: add deterministic Classic Open visibility (`allOpen` / `threeOpen`) metadata in Match/Replay, and expose `classic_swap`, `classic_all_open`, `classic_three_open` presets in ruleset selector.
- [x] Follow-up: in Guest Match deck preview, hide Nyano cards unless revealed by Classic Open rules (`allOpen` / `threeOpen`).
- [x] Follow-up: in Replay Deck inspector, mask unrevealed slots for both players under Classic Three Open (and keep all visible under All Open).
- [x] Follow-up: add Replay Deck inspector toggle to reveal hidden Three Open slots for post-match analysis.
- [x] Follow-up: hide Replay owners mapping under Three Open by default, and reveal it together with the hidden-slot toggle.
- [x] Follow-up: extract hidden deck-slot UI into shared `HiddenDeckPreviewCard` component and reuse in Match/Replay.
- [x] Follow-up: show resolved Classic Open metadata in Stream live status (from `protocolV1.header` + ruleset registry).
- [x] Follow-up: show resolved Classic Open metadata in Overlay ?Now Playing? panel for operator/OBS visibility.
- [x] Follow-up: add additive Classic metadata (`classic.open` / `classic.swap`) to `/stream` `state_json v1` and ai_prompt context for nyano-warudo/operator parity.
- [x] Follow-up: show deterministic Classic Swap mapping in Stream live status and Overlay ?Now Playing?.
- [x] Follow-up: update `state_json v1` sample/spec docs to include additive optional `classic` metadata.
- [x] Follow-up: sync `triad_league_snapshot_request_sample_v1.json` embedded `content` with latest `state_json` sample.
- [x] Follow-up: refactor duplicated Classic Open/Swap resolution into shared `apps/web/src/lib/classic_ruleset_visibility.ts` with unit tests.
- [x] Follow-up: harden Classic metadata resolver to return null (not throw) on malformed `protocolV1.header`.
- [x] Follow-up: sync `triad_league_ai_prompt_sample_v1.txt` and Bridge spec with optional `classic_open` / `classic_swap` ai_prompt lines.
- [x] 2026-02-14 WO006: NyanoReaction slot? `Match/Replay` ?????????????????????????2????? + unit test????
- [x] 2026-02-14 WO007: Mint??/?????????????board sheen, stage rim/atmo, warning-mode????, vfx/reduced-motion??, mobile?????
- [x] 2026-02-14 WO008: Match Setup ? MatchSetupPanelMint ?????Primary/Secondary/Advanced ???1?????Setup URL?????????URL???????????
- [x] 2026-02-14 WO009: Rulesets??????????????????????????????/match ?????????
- [x] 2026-02-15 WO010: `apps/web/e2e/ux-guardrails.spec.ts` ?????tutorial???selector???quick commit fallback??`pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` ? 2 passed ????
- [x] 2026-02-15 WO010??: `apps/web/package.json` ? `e2e:ux` ?????`.github/workflows/ci.yml` ? `E2E UX guardrails` ????????full E2E ????UX??????????
- [x] 2026-02-15 WO007??: `apps/web/e2e/mint-stage-visual-guardrails.spec.ts` ?????manual?????vfx=off / reduced-motion / 390px??E2E??`pnpm.cmd -C apps/web e2e:ux` ? 5 passed ????
- [x] 2026-02-15 WO009??: `apps/web/e2e/rulesets-ux-guardrails.spec.ts` ?????Rulesets????????? + ?????????? + rk????E2E??`pnpm.cmd -C apps/web e2e:ux` ? 7 passed ????
- [x] 2026-02-15 WO008??: `apps/web/e2e/match-setup-ux-guardrails.spec.ts` ?????Match Setup???1?????? + Advanced???? + ccap URL????E2E??`pnpm.cmd -C apps/web e2e:ux` ? 9 passed ????
- [x] 2026-02-15 WO011: Mint gamefeel??????pastel gradient + paw pattern + sparkle/bokeh???`prefers-reduced-motion` / `data-vfx` ???????????`DuelStageMint` ? `mint-stage--gamefeel` ????
- [x] 2026-02-15 WO012: Mint Top HUD????/??A-B???/?TURN?? `ui=mint` ??????`density=minimal` ? Top HUD???`standard/full` ??? `BattleHudMint` ??????
- [x] 2026-02-15 WO013: Mint???????????????Avatar/Label/Remaining?????Desktop? `panel|board|panel`?mobile?????????????
- [x] 2026-02-15 WO014: Mint?????????? + ??????????ActionPrompt???????`mint-prompt-slot` ?????????
- [x] 2026-02-15 WO015: NyanoReaction slot? fixed-height + absolute overlay ???`kind=idle` ?? placeholder ????LayoutShift API ? `ux-guardrails` ?????CLS????????
- [x] 2026-02-15 WO016: `mint-pressable` ?????board cell / hand card / result button ??????hover/active/focus-visible?????reduced-motion / data-vfx ????????
- [x] 2026-02-15 WO016/WO010??: `ux-guardrails` ??????Enter??? reduced-motion ?? pressable transition ?????????4 passed??
- [x] 2026-02-15 Match UX??: Nyano???????????????? stage impact ? transform?????????????????????????????????????????
- [x] 2026-02-15 Match UX??: ???????????????????HUD/AI notice???????????????????????????????????
- [x] 2026-02-15 Match UX??: ???????????????? ? ???????????close???? + ???????????????
- [x] 2026-02-15 Match UX??: ?????????Battle summary?????????????/??????????????????
- [x] 2026-02-15 Battle Stage focus UX??: ????????????????????????????????????????????`ui=engine&focus=1` ????????????????????`stage-focus` / `ux-guardrails` E2E????????
- [x] 2026-02-15 Battle Stage UX??: stage focus ?????? + Nyano???????????????????????????????????????????????????????
- [x] 2026-02-15 Battle Stage UX??: stage-focus E2E??????/??????????????????????????????
- [x] 2026-02-15 Battle Stage UX??: ?????????????????fixed????? + stage?????? + board??????`stage-focus` / `ux-guardrails` E2E????????
- [x] 2026-02-15 Match/Stage UX??: `/match?ui=mint` ? Nyano????+??????????????????????ON/OFF??????????Prompt??????Details `?` ??????????????????????stage focus ? Pixi??/???????????????????????? board-dock ????????stage-focus 15 passed / ux-guardrails 7 passed??
- [x] 2026-02-15 WO017: `MintGameShell` / `MintAppChrome` ?????Mint????? App chrome ????UI??`focusRoute`?`/battle-stage` `/replay-stage` / `focus=1`??????????
- [x] 2026-02-15 WO018: Home ? Mint?????????????Arena/Decks/Replay/Stream ?4?????3????????????????Tools/Settings ???????
- [x] 2026-02-15 WO019: Arena ??????UI??????????????????Quick Play????????? + `difficulty` ???????
- [x] 2026-02-15 WO020: Decks ? Deck Builder 3???????Deck Stats/Filter?Card Browser?????????Deck Summary + Save Deck??
- [x] 2026-02-15 WO021: `/start` ????????Onboarding 3??? + DONE?? pill ????Home ??????????
- [x] 2026-02-15 WO022: Mint UI??????????`GlassPanel` `MintPressable` `MintIcon` `MintBigButton` `MintTabNav` `MintTypography`???????????
- [x] 2026-02-15 WO023: Gemini?????????????????`scripts/gemini_image_gen.mjs` / `scripts/asset_prompts/nytl_ui_assets.v1.json` / `docs/01_design/NYTL_ASSET_GEN_GEMINI_NANO_BANANA_PRO_v1_ja.md` / `apps/web/public/assets/gen/.gitkeep`??
- [x] 2026-02-15 WO024: e2e/visual guardrails ????`e2e/mint-app-screens-guardrails.spec.ts`???Home/Decks???e2e????Mint UI??????
- [x] 2026-02-15 Follow-up: `MintPressable` ??????lint???????`MatchSetupPanelMint` ? helper ? `MatchSetupPanelMint.helpers.ts` ????? Fast Refresh ??????
- [x] 2026-02-15 Follow-up: `src/lib/theme.ts` ???????? `src/lib/__tests__/theme.test.ts` ????theme?????? / URL query+hash ???????
- [x] 2026-02-15 Follow-up: `e2e/mint-app-screens-guardrails.spec.ts` ?????Mint App Chrome ? `theme` ??????Tab????? `focusRoute`?`/match?focus=1` `/battle-stage`??? chrome ?????????????
- [x] 2026-02-15 Follow-up: Events/Replay/Stream ? Mint???????????Replay ? 390px ?????????????? `rulesetId`/`matchId` ??? + debug pre ??????`mint-app-screens-guardrails` ? 390px ????????
- [x] 2026-02-15 Follow-up: Events/Replay/Stream ??? Mint ?????????????`theme` ?????????? Match ??? `mint-match-board-shell` / `mint-match-quick-commit` ??????????????secondary screen ? board ????UI???????
- [x] 2026-02-15 Follow-up: Events/Replay/Stream ?????????????overview pills???????????????????????? quicknav ??????????????????????????????????????????
- [x] 2026-02-17 Arena follow-up: `MintPageGuide` / difficulty hint ????CSS? `mint-theme.css` ?????`Arena.tsx` ? UTF-8 BOM ??????????????? `type="button"` ????
- [x] 2026-02-17 Mint guide rollout: `MINT_PAGE_GUIDES` ? `events/replay/stream` ??????????Mint????????????????Replay? `!isStageFocus` ???????
- [x] 2026-02-17 Mint guide rollout follow-up: `e2e/mint-app-screens-guardrails.spec.ts` ? `.mint-page-guide` ?????????????Arena/Events/Replay/Stream ????????????
- [x] 2026-02-17 CI follow-up: `/battle-stage` ? board/dock ???? desktop ??????`.mint-focus-hand-dock--stage` ???????? `ux-guardrails` ? quick commit ????????????????? flaky ????
- [x] 2026-02-17 ui=mint Pixi parity follow-up: /match ? hand dock + HUD/commentary tone ? Pixi???????mint??Top HUD/side panel???????? ux-guardrails ? hand dock ?????????reduced-motion ?? dock card transition ??????pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts 7 passed / pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts 15 passed??
- [x] 2026-02-17 e2e:ux follow-up: mint-stage-visual-guardrails ? commit control ??? hand dock/quick commit ???????ui=mint ?????CI??????pnpm.cmd -C apps/web e2e:ux 14 passed??
- [x] 2026-02-17 copy cleanup follow-up: Home/Start/Stream ????????????/???????/??/??/DONE-TODO?????????????????UI??????????????????
- [x] 2026-02-17 i18n UX follow-up: Replay??? Arena/Decks/Rulesets/Events ???UI???????????????????????????????`replay_timeline`/`replay_highlights` ?????????`e2e/replay-ruleset-fallback-guardrails.spec.ts` ???????????????`pnpm -C apps/web test` / `typecheck` / `build` / `pnpm.cmd -C apps/web e2e:ux` ??????

---

## Next (Planned)

- [x] 2026-02-17 WO025: Classic Rules ????????reverse / aceKiller / typeAscend / typeDescend / plus / same?+ UI ????????
- [x] 2026-02-17 WO026: Classic Rules ?????????????????+ Share/Replay ???URL param `cr` bitmask??
- [x] 2026-02-17 WO027: ????? UI ? ???????? Nintendo ????MintRulesetPicker??


## Update 2026-02-17 (WO025/WO026/WO027)

- [x] WO025: Classic preset surface expansion completed.
  - Added reverse / aceKiller / typeAscend / typeDescend / plus / same presets to registry and setup UI.
  - Added Classic discoverability section in /rulesets.
- [x] WO026: Classic custom builder + URL/share/replay compatibility completed.
  - Added rk=classic_custom and cr (base36 bitmask) encode/decode.
  - Match stores/restores custom rules via URL; Replay can fallback-restore from rk/cr when rulesetId is unmapped.
  - Added mismatch warning when fallback rulesetId differs from transcript rulesetId.
- [x] WO027: Nintendo-quality rules setup flow completed (incremental).
  - Added MintRulesetPicker (family -> preset/custom -> summary/help).
  - Kept existing select[data-testid=match-setup-ruleset] for compatibility while moving primary UX to picker.

### Residual follow-ups
- [x] Add dedicated Replay UX test for rulesetId mismatch warning pill (rk/cr fallback mismatch case).
- [x] Consider splitting MintRulesetPicker visual primitives into mint theme CSS tokens if further polish is required.


## Update 2026-02-17 (follow-up)

- [x] Added replay fallback guardrail E2E:
  - apps/web/e2e/replay-ruleset-fallback-guardrails.spec.ts
  - Validates rk/cr fallback + mismatch warning visibility.
- [x] Integrated replay fallback guardrail into pnpm -C apps/web e2e:ux.
- [x] Hardened UX E2E commit helper for dock/toolbar/legacy commit paths to reduce flaky failures.
- [x] 2026-02-17 Stream copy follow-up: Stream/HUD/Warudo/Share ??????????????????????`_design/Home` ?????????/???????????????????????`pnpm -C apps/web test` / `typecheck` / `build` / `pnpm.cmd -C apps/web e2e:ux` ??????
- [x] 2026-02-17 Overlay copy follow-up: Overlay?????????????/??/???/OBS?????????????????`Now Playing`/`Chat voting`/`No signal yet`/`remaining` ??E2E????????????`pnpm -C apps/web test` / `typecheck` / `build` / `pnpm.cmd -C apps/web e2e:ux` ????
- [x] 2026-02-17 App chrome copy follow-up: ???????????????/????????????????URL???????`pnpm -C apps/web test` / `typecheck` / `build` / `pnpm.cmd -C apps/web e2e:ux` ????

- [x] 2026-02-17 i18n follow-up: Home/Playground ???????????????????E2E????Tools / Settings / Copy Snapshot / Reset Metrics / Nyano Lab??????????pnpm -C apps/web test / typecheck / build ??????E2E????? spawn EPERM ?????

- [x] 2026-02-18 i18n follow-up: Events/Decks/Replay ????UI???????????E2E???? Save Deck / Replay from transcript / Load replay / Show controls ????????pnpm -C apps/web test / typecheck / build ????
- [x] 2026-02-18 i18n follow-up verify: pnpm.cmd -C apps/web e2e:ux 15 passed?

- [x] 2026-02-18 i18n/e2e follow-up: Match ? Decks ????????????????????????????pps/web/e2e/guest-game.spec.ts ???UI??????pnpm -C apps/web test / typecheck / build / pnpm.cmd -C apps/web e2e:ux / ??3spec ????
- [x] 2026-02-17 i18n follow-up: Home/Events/Match/Replay copy was adjusted to Japanese-first player-facing text; stage-focus compatibility labels were preserved (`Replay from transcript`, `Load replay`, `Error:`, `Retry load`, `Clear share params`). Verified with `pnpm -C apps/web test`, `pnpm.cmd -C apps/web typecheck`, `pnpm -C apps/web build`, and targeted Playwright (`stage-focus`, `ux-guardrails`, `mint-stage-visual-guardrails`).
- [x] 2026-02-18 Arena follow-up: difficulty card click in /arena now starts guest match immediately (no extra quick-play click). Added e2e guardrail in apps/web/e2e/quick-play.spec.ts. Verified with test/typecheck/build and targeted e2e.
- [x] 2026-02-18 copy cleanup follow-up: Overlay/Replay/Playground ? user-visible "debug" ???????????????Arena ????????????????????quick-play e2e + test/typecheck/build ???
- [x] 2026-02-18 onboarding copy follow-up: Home/Start ? "3??????" ??????2?????? + 3????????home E2E ? test/typecheck/build ???
- [x] 2026-02-18 Home UX cleanup: onboarding card ????/???/?????????????????????????debug=1 ???????home e2e + test/typecheck/build ???
- [x] 2026-02-18 Start UX cleanup: Start ???????????????????2??????????????????????????home e2e + test/typecheck/build ???

- [x] 2026-02-18 WO028: Match Mint board tray/cell material v5 applied with asset-first + CSS fallback and vfx/reduced-motion gating.
- [x] 2026-02-18 WO029: Match in-game Classic rules ribbon + open-hand mini visibility + order fixed-card badge added.
- [x] 2026-02-18 WO030: Match board/hand micro-juice improved (pressed states + tap_soft selection SFX) with reduced-motion compatibility.
- [x] 2026-02-18 Match usability follow-up: Classic/Open player labels were unified via helpers and updated to Japanese-first copy (with ARIA English compatibility tokens kept for existing e2e selectors). Verified with `pnpm -C apps/web test`, `pnpm -C apps/web typecheck`, `pnpm -C apps/web build`.
- [x] 2026-02-18 Match Setup UX follow-up: Match Setup copy was migrated to Japanese-first wording (header/sections/advanced/actions) while preserving URL/state behavior and E2E compatibility tokens (`Human vs Human`, `first=...`, `board=...`). Verified with `pnpm -C apps/web test`, `pnpm -C apps/web typecheck`, `pnpm -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux`.
- [x] 2026-02-18 Match battle UX copy follow-up: commit/undo/nyano action labels and error/toast copy were aligned to Japanese-first wording while preserving existing aria labels for E2E compatibility. Verified with `pnpm -C apps/web test`, `pnpm -C apps/web typecheck`, `pnpm -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux`.
- [x] 2026-02-18 i18n follow-up: Stream page player-facing copy was further cleaned up (prototype/internal wording removed or replaced) while preserving compatibility tokens where needed.
- [x] 2026-02-18 E2E hardening follow-up: smoke + stage-focus selectors were updated to JP/EN bilingual assertions for replay recovery and key page headings to avoid copy-induced flakes.
- [x] Local dev environment note update: pnpm -C apps/web typecheck / pnpm -C apps/web build are executable in this environment. Playwright E2E remains blocked by spawn EPERM.
- [x] 2026-02-18 i18n follow-up: Stream operator toasts and Overlay stale-warning copy were aligned to Japanese-first wording with key English compatibility tokens retained.
- [x] 2026-02-18 i18n follow-up: Replay mode/board selectors and overlay-tool labels were aligned to Japanese-first wording while retaining E2E compatibility tokens (Replay from transcript / Load replay / engine v1/v2).
- [x] 2026-02-18 i18n follow-up: Rulesets Classic section heading/subcopy was polished to Japanese-first wording.
- [x] 2026-02-18 i18n follow-up: Replay summary/details copy was polished to Japanese-first wording (mode display, step-sync labels, JSON copy labels) while preserving compatibility tokens.
- [x] 2026-02-18 i18n follow-up: Rulesets list meta labels and placeholder were polished to Japanese-first wording.
- [x] 2026-02-18 E2E hardening follow-up: rulesets UX heading assertion now accepts JP/EN copy.
- [x] 2026-02-18 i18n follow-up: Replay focus transport toggle became Japanese-first (`?????????????`) while preserving `Hide/Show controls` compatibility tokens and E2E selectors were updated to JP/EN dual-match.
- [x] 2026-02-18 Decks filter follow-up: switched Decks to CardBrowserMint and replaced abstract presets with game-relevant hand/edge presets; verified with test/typecheck/build.
- [x] 2026-02-18 Decks follow-up: added df URL-sync guardrail test and stable filter testids (`decks-filter-*`).
- [x] 2026-02-18 Decks follow-up: added legacy df id normalization (attacker/defender/other) and canonical URL rewrite.
- [x] 2026-02-18 Decks follow-up: hardened df normalization for case/space variants and added tests.
- [x] 2026-02-18 Replay follow-up: mismatch warning pill now has stable testid (`replay-ruleset-mismatch-warning`) and fallback guardrail test uses it.
- [x] 2026-02-18 Residual follow-up closure: dedicated Replay mismatch warning guardrail is implemented and tracked.
- [x] 2026-02-18 Match Setup rules picker follow-up: `MintRulesetPicker` ? mint-theme ????/?????????????????????`data-testid` / `aria-pressed` ????? E2E ??????`pnpm -C apps/web test` / `typecheck` / `build` ?????? E2E ????? `spawn EPERM` ?????
- [x] 2026-02-18 validation note update: ?????? `pnpm -C apps/web typecheck` / `pnpm -C apps/web build` ????????????? Playwright worker `spawn EPERM`?E2E????
- [x] 2026-02-18 Events copy cleanup: ????????? `??` ? `???` ????????????????`pnpm -C apps/web test` / `typecheck` / `build` ???
- [x] 2026-02-18 Match Setup test follow-up: `MintRulesetPicker.test.tsx` ????????????????????testid ???? static markup ????
- [x] 2026-02-18 Stream/Overlay copy follow-up: RPC/???????????????????????????????????????`pnpm -C apps/web test` / `typecheck` / `build` ???

- [x] 2026-02-18 E2E follow-up: stream-vote/stage-focus selector resilience. Updated stream vote assertions to JP/EN dual-match selectors and made replay-stage failure recovery test robust for both manual-load and auto-load flows. Verified with pnpm.cmd test/typecheck/build and targeted playwright runs.

- [x] 2026-02-18 E2E follow-up: replay-url selector hardening. Replay URL spec now uses JP/EN resilient selectors and disambiguated load button targeting; verified with pnpm.cmd test/typecheck/build and pnpm.cmd e2e (74 passed).
- [x] 2026-02-18 WO032-036 follow-up: Match board gamefeel polish (press depth / hover ghost / place&flip FX), Home/Arena classic quick presets, and in-match rules help were added with URL compatibility preserved.
- [x] 2026-02-18 WO036 follow-up: root package-lock.json removed (pnpm-only lock policy).
- [x] 2026-02-18 verification note: lint/typecheck passed. build/e2e are currently blocked in this local environment by spawn EPERM (esbuild/playwright child process spawn).
- [x] 2026-02-18 follow-up: Added optional `qp` preset restore for Home/Arena quick play (`qp` absent => standard), keeping existing match/replay URL compatibility.
- [x] 2026-02-18 follow-up: Added unit test for classic quick presets normalization and URL generation.
- [x] 2026-02-18 follow-up #2: Home?Arena and Arena?Pixi Stage now preserve selected quick preset intent (standard/classic), including classic custom mask propagation.
- [x] 2026-02-18 WO037-step1: Match/Replay URL parser utilities were extracted to `features/match/urlParams.ts` (behavior unchanged, shared parser path established).
- [x] 2026-02-18 WO037-step2: Rulesets -> Match links now preserve `theme` and `classic_custom` mask (`cr`) for better URL continuity.
- [x] 2026-02-19 WO037-step3: `Match.tsx` ? URL ???????? `features/match/urlParams.ts` ? `parseMatchSearchParams` ??????????????????URL???????
- [x] 2026-02-19 WO037-step3: `urlParams.test.ts` ? match ???????????????????
- [x] 2026-02-19 WO035-follow-up: Home/Arena ??????? URL ???????`buildQuickGuestMatchPath` / `buildQuickGuestStagePath`???preset????????????
- [x] 2026-02-19 WO035-follow-up: `classic_quick_presets.test.ts` ???/???????? URL ???????????
- [x] 2026-02-19 WO037-step4: `Match.tsx` ?? `rk/cr` ????????? `features/match/urlParams.ts` ????`withMatchParamCompatibility` / `resolveClassicMaskParamPatch`??
- [x] 2026-02-19 WO037-step4: `urlParams.test.ts` ? URL?????????????????????
- [x] 2026-02-19 WO037-step5: Match URL ????????? `useMatchSearchMutators` hook ???????????????
- [x] 2026-02-19 WO037-step6: `Replay.tsx` ? URL ??/??? `features/match/replayUrlParams.ts` ???????????????????
- [x] 2026-02-19 WO037-step6: `replayUrlParams.test.ts` ?????UI/focus/step-mode ? URL ??????
- [x] 2026-02-19 WO037-step7: Replay ? mode/step/int32 ??? `features/match/replayModeParams.ts` ?????`Replay.tsx` ???????????URL????????????
- [x] 2026-02-19 WO037-step7: `replayModeParams.test.ts` ?????mode/step/int32/display ???????
- [x] 2026-02-19 WO037-step8: Replay ruleset URL fallback/auto mode ??? `features/match/replayRulesetParams.ts` ?????`Replay.tsx` ??????????URL???????
- [x] 2026-02-19 WO037-step8: `replayRulesetParams.test.ts` ?????fallback/mode ?????????
- [x] 2026-02-19 WO037-step8 follow-up: Replay mode ??????????????
- [x] 2026-02-19 WO037-step9: Match URL helper (`matchUrlParams.ts`) ?????`Match.tsx` / `useMatchSearchMutators.ts` ? URL????????stage/focus/board-ui/event??
- [x] 2026-02-19 WO037-step9: `matchUrlParams.test.ts` ???? URL helper ???????
- [x] 2026-02-19 WO037-step10: Match ?????????? `matchTurnUtils.ts` ?????`Match.tsx` ???????
- [x] 2026-02-19 WO037-step10: `matchTurnUtils.test.ts` ????? turn/use/warning/fill ???????
- [x] 2026-02-19 WO037-step11: first-player ?? helper ? `matchFirstPlayerParams.ts` ?????`Match.tsx` ? payload ????????
- [x] 2026-02-19 WO037-step11: `matchFirstPlayerParams.test.ts` ????? manual/mutual/event?????????
- [x] 2026-02-19 WO037-step12: ruleset ?? helper ? `matchRulesetParams.ts` ?????`Match.tsx` ? classic/ruleset ????????
- [x] 2026-02-19 WO037-step12: `matchRulesetParams.test.ts` ????? classic_custom/chainCap/label/mask ???????

- [x] 2026-02-19 WO037-step13: consolidated board/hand derived helpers into apps/web/src/features/match/matchBoardDerived.ts and reduced Match.tsx duplication for selectable/effective-used/classic labels.
- [x] 2026-02-19 WO037-step13: added apps/web/src/features/match/__tests__/matchBoardDerived.test.ts coverage for available/selectable/warn/open/swap derivations.
- [x] 2026-02-19 WO037-step14: extracted first-player commit/reveal helper mutations to apps/web/src/features/match/matchFirstPlayerMutations.ts (randomize patches + commit derivation) and simplified Match.tsx handlers.
- [x] 2026-02-19 WO037-step14: added apps/web/src/features/match/__tests__/matchFirstPlayerMutations.test.ts and verified pnpm -C apps/web lint/test/typecheck/build plus pnpm.cmd -C apps/web e2e:ux.
- [x] 2026-02-19 WO037-step15: extracted Classic Open presentation builder to apps/web/src/features/match/matchBoardDerived.ts and replaced Match.tsx inline object assembly.
- [x] 2026-02-19 WO037-step15: expanded apps/web/src/features/match/__tests__/matchBoardDerived.test.ts for presentation shape and re-verified lint/test/typecheck/build + e2e:ux.

- [x] 2026-02-19 WO037-step16: extracted Match card-loading logic (index/guest fallback/verified rpc) to apps/web/src/features/match/matchCardLoaders.ts and reduced Match.tsx responsibility.
- [x] 2026-02-19 WO037-step16: added apps/web/src/features/match/__tests__/matchCardLoaders.test.ts to lock loading branches and RPC toast classification.
- [x] 2026-02-19 WO037-step16: verified pnpm -C apps/web lint/test/typecheck/build plus pnpm.cmd -C apps/web e2e:ux (15 passed).
- [x] 2026-02-19 WO037-step17: replay share URL/QR composition moved to `apps/web/src/features/match/matchReplayShare.ts` and wired into `Match.tsx` (URL compatibility unchanged).
- [x] 2026-02-19 WO037-step17: added `apps/web/src/features/match/__tests__/matchReplayShare.test.ts` (gzip fallback + replay bundle/transcript payload + URL params).
- [x] 2026-02-19 recovery follow-up: fixed strict TS test typing in `matchReplayShare.test.ts` and re-verified `pnpm -C apps/web lint/test/typecheck/build`.
- [x] 2026-02-19 WO037-step17 verify follow-up: `pnpm.cmd -C apps/web e2e:ux` passed (15 passed).
- [x] 2026-02-19 WO037-step18: stream command commit gating/resolution moved to `apps/web/src/features/match/matchStreamCommands.ts` and wired into `Match.tsx`.
- [x] 2026-02-19 WO037-step18: added `apps/web/src/features/match/__tests__/matchStreamCommands.test.ts` (gating + forced-card override coverage).
- [x] 2026-02-19 WO037-step18: re-verified `pnpm -C apps/web lint/test/typecheck/build`.
- [x] 2026-02-19 WO037-step18 verify follow-up: `pnpm.cmd -C apps/web e2e:ux` passed (15 passed).
- [x] 2026-02-19 WO037-step19: setup/replay share link builder logic moved to `apps/web/src/features/match/matchShareLinks.ts` and wired into `Match.tsx`.
- [x] 2026-02-19 WO037-step19: added `apps/web/src/features/match/__tests__/matchShareLinks.test.ts` (setup URL / replay URL / share template coverage).
- [x] 2026-02-19 WO037-step19: re-verified `pnpm -C apps/web lint/test/typecheck/build` and `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step20: setup param patch builders moved to `apps/web/src/features/match/matchSetupParamPatches.ts` and wired into `Match.tsx`.
- [x] 2026-02-19 WO037-step20: added `apps/web/src/features/match/__tests__/matchSetupParamPatches.test.ts` (ruleset/classic-mask/first-player patch coverage).
- [x] 2026-02-19 WO037-step20: re-verified `pnpm -C apps/web lint/test/typecheck/build` and `pnpm.cmd -C apps/web e2e:ux` (15 passed).

- [x] 2026-02-19 WO037-step21: stage/focus action callback runners moved to apps/web/src/features/match/matchStageActionCallbacks.ts and wired into Match.tsx (controls/assist/fullscreen/focus-exit/replay/ai-move).
- [x] 2026-02-19 WO037-step21: added apps/web/src/features/match/__tests__/matchStageActionCallbacks.test.ts for feedback ordering + focus-route gating coverage.
- [x] 2026-02-19 WO037-step21: re-verified pnpm -C apps/web lint, pnpm.cmd -C apps/web test -- matchStageActionCallbacks, pnpm.cmd -C apps/web test, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build, pnpm.cmd -C apps/web e2e:ux (15 passed).
- [x] 2026-02-19 WO037-step22: stage feedback timer/state helper module added at `apps/web/src/features/match/matchStageFeedback.ts` and wired into `Match.tsx`.
- [x] 2026-02-19 WO037-step22: added `apps/web/src/features/match/__tests__/matchStageFeedback.test.ts` (focus guard / timeout reset / timer replacement / reset-clear helpers).
- [x] 2026-02-19 WO037-step22: re-verified `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web test -- matchStageFeedback`, `pnpm.cmd -C apps/web test -- matchStageActionCallbacks`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step23: added `apps/web/src/features/match/useMatchStageUi.ts` and moved stage assist/control route+resize sync logic out of Match.tsx.
- [x] 2026-02-19 WO037-step23: added `apps/web/src/features/match/__tests__/useMatchStageUi.test.ts` (assist/control visibility helper coverage).
- [x] 2026-02-19 WO037-step23: re-verified `pnpm.cmd -C apps/web test -- useMatchStageUi`, `pnpm.cmd -C apps/web test -- matchStageFeedback`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step24: added `apps/web/src/features/match/useMatchStageFullscreen.ts` and moved stage fullscreen state/toggle logic out of Match.tsx.
- [x] 2026-02-19 WO037-step24: added `apps/web/src/features/match/__tests__/useMatchStageFullscreen.test.ts` (fullscreen state + toggle core branch coverage).
- [x] 2026-02-19 WO037-step24: re-verified `pnpm.cmd -C apps/web test -- useMatchStageFullscreen`, `pnpm.cmd -C apps/web test -- useMatchStageUi`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step25: added `apps/web/src/features/match/useMatchStageBoardSizing.ts` and moved Match battle-stage board sizing + resize sync out of `Match.tsx`.
- [x] 2026-02-19 WO037-step25: added `apps/web/src/features/match/__tests__/useMatchStageBoardSizing.test.ts` (default viewport / provided viewport / battle profile coverage).
- [x] 2026-02-19 WO037-step25: re-verified `pnpm.cmd -C apps/web test -- useMatchStageBoardSizing`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step26: added `apps/web/src/features/match/matchStageRouteState.ts` and moved stage route-derived state (`stageMatchUrl` / `isBattleStageRoute` / `isStageFocusRoute`) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step26: added `apps/web/src/features/match/__tests__/matchStageRouteState.test.ts` (route predicate compatibility + derived state coverage).
- [x] 2026-02-19 WO037-step26: re-verified `pnpm.cmd -C apps/web test -- matchStageRouteState`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step27: added `apps/web/src/features/match/matchStageEngineBoardSizing.ts` and moved stage-focus engine board cap/max/min sizing derivation out of `Match.tsx`.
- [x] 2026-02-19 WO037-step27: added `apps/web/src/features/match/__tests__/matchStageEngineBoardSizing.test.ts` (cap activation/floor, capped sizing, undefined base passthrough coverage).
- [x] 2026-02-19 WO037-step27: re-verified `pnpm.cmd -C apps/web test -- matchStageEngineBoardSizing`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd test` (`apps/web`), `pnpm.cmd build` (`apps/web`), `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step28: added `apps/web/src/features/match/matchStageFocusShortcuts.ts` and moved stage-focus keyboard shortcut resolution/dispatch logic out of `Match.tsx`.
- [x] 2026-02-19 WO037-step28: added `apps/web/src/features/match/__tests__/matchStageFocusShortcuts.test.ts` (editable/modifier ignore, guarded shortcut resolution, action dispatch coverage).
- [x] 2026-02-19 WO037-step28: re-verified `pnpm.cmd -C apps/web test -- matchStageFocusShortcuts`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd test` (`apps/web`), `pnpm.cmd build` (`apps/web`), `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step29: added `apps/web/src/features/match/matchStagePresentationState.ts` and moved stage-focus/mint presentation boolean derivation out of `Match.tsx`.
- [x] 2026-02-19 WO037-step29: added `apps/web/src/features/match/__tests__/matchStagePresentationState.test.ts` (hand-dock/HUD/quick-commit/focus-toolbar/status-slot/manual-ai gating coverage).
- [x] 2026-02-19 WO037-step29: re-verified `pnpm.cmd -C apps/web test -- matchStagePresentationState`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd test` (`apps/web`), `pnpm.cmd build` (`apps/web`), `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step30: added `apps/web/src/features/match/useMatchStageFocusShortcuts.ts` and moved stage-focus keyboard shortcut listener wiring out of `Match.tsx`.
- [x] 2026-02-19 WO037-step30: added `apps/web/src/features/match/__tests__/useMatchStageFocusShortcuts.test.ts` (keydown dispatch/replay-guard/editable-ignore/commit-undo routing coverage).
- [x] 2026-02-19 WO037-step30: re-verified `pnpm.cmd -C apps/web test -- useMatchStageFocusShortcuts`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd test` (`apps/web`), `pnpm.cmd build` (`apps/web`), `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step31: added `apps/web/src/features/match/useMatchStageActionFeedback.ts` and moved stage-action feedback state/timer lifecycle out of `Match.tsx`.
- [x] 2026-02-19 WO037-step31: added `apps/web/src/features/match/__tests__/useMatchStageActionFeedback.test.ts` (route-gated push + timeout reset flow coverage with injected timer API).
- [x] 2026-02-19 WO037-step31: re-verified `pnpm.cmd -C apps/web test -- useMatchStageActionFeedback`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd test` (`apps/web`), `pnpm.cmd build` (`apps/web`), `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step32: added `apps/web/src/features/match/matchStageLayoutClasses.ts` and moved stage-focus layout className derivation out of `Match.tsx`.
- [x] 2026-02-19 WO037-step32: added `apps/web/src/features/match/__tests__/matchStageLayoutClasses.test.ts` (focus/non-focus root+toolbar, arena/layout, board shell/center, announcer/fallback class coverage).
- [x] 2026-02-19 WO037-step32: re-verified `pnpm.cmd -C apps/web test -- matchStageLayoutClasses`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd test` (`apps/web`), `pnpm.cmd build` (`apps/web`), `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step33: added `apps/web/src/features/match/useMatchStageActionCallbacks.ts` and moved stage-action callback wiring (controls/assist/fullscreen/focus-exit/replay/ai) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step33: added `apps/web/src/features/match/__tests__/useMatchStageActionCallbacks.test.ts` (assist state toggle + callback side-effect wiring coverage).
- [x] 2026-02-19 WO037-step33: re-verified `pnpm.cmd -C apps/web test -- useMatchStageActionCallbacks`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd test` (`apps/web`), `pnpm.cmd build` (`apps/web`), `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step34: added `apps/web/src/features/match/useMatchReplayActions.ts` and moved replay/share callback wiring (`buildReplayUrl` / `copyShareUrl` / `openReplay` / `copyShareTemplate`) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step34: added `apps/web/src/features/match/__tests__/useMatchReplayActions.test.ts` (replay URL forwarding + copy/open/template side-effect coverage).
- [x] 2026-02-19 WO037-step34: re-verified `pnpm.cmd -C apps/web test -- useMatchReplayActions`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd test` (`apps/web`), `pnpm.cmd build` (`apps/web`), `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step35: added `apps/web/src/features/match/matchStageReaction.ts` and moved Nyano reaction input/impact derivation + stage/board impact burst gating logic out of `Match.tsx`.
- [x] 2026-02-19 WO037-step35: added `apps/web/src/features/match/__tests__/matchStageReaction.test.ts` (reaction input composition, impact/burst gating, board burst cooldown coverage).
- [x] 2026-02-19 WO037-step35: re-verified `pnpm.cmd -C apps/web test -- matchStageReaction`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd test` (`apps/web`), `pnpm.cmd build` (`apps/web`), `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step36: added `apps/web/src/features/match/useMatchStageSfxEffects.ts` and moved SFX side-effect wiring (board animation flip/place, game-end fanfare, validation-error buzz) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step36: added `apps/web/src/features/match/__tests__/useMatchStageSfxEffects.test.ts` (board animation SFX update, game-end SFX, error-buzz resolver coverage).
- [x] 2026-02-19 WO037-step36: re-verified `pnpm.cmd -C apps/web test -- useMatchStageSfxEffects`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd test` (`apps/web`), `pnpm.cmd build` (`apps/web`), `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step37: added `apps/web/src/features/match/matchTurnLogDerived.ts` and moved flip-summary/flip-trace/RPG-turn-log derivation logic out of `Match.tsx`.
- [x] 2026-02-19 WO037-step37: added `apps/web/src/features/match/__tests__/matchTurnLogDerived.test.ts` (last-turn summary + flip-trace mapping + RPG log janken fallback coverage).
- [x] 2026-02-19 WO037-step37: re-verified `pnpm.cmd -C apps/web test -- matchTurnLogDerived`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd test` (`apps/web`), `pnpm.cmd build` (`apps/web`), `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step38: added `apps/web/src/features/match/useMatchShareClipboardActions.ts` and moved setup-link copy / transcript JSON copy callback wiring out of `Match.tsx`.
- [x] 2026-02-19 WO037-step38: added `apps/web/src/features/match/__tests__/useMatchShareClipboardActions.test.ts` (setup URL copy success/warn branches + transcript copy error/success coverage).
- [x] 2026-02-19 WO037-step38: re-verified `pnpm.cmd -C apps/web test -- useMatchShareClipboardActions`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step39: added `apps/web/src/features/match/matchShareQr.ts` and `apps/web/src/features/match/MatchShareQrCode.tsx`, and moved replay-share QR URL derivation out of `Match.tsx` (page now delegates to feature component).
- [x] 2026-02-19 WO037-step39: added `apps/web/src/features/match/__tests__/matchShareQrCode.test.ts` (null transcript guard + replay-share URL argument forwarding coverage).
- [x] 2026-02-19 WO037-step39 recovery: repaired broken string literals / JSX closing tags in `Match.tsx` and revalidated page compile path after crash-time file corruption.
- [x] 2026-02-19 WO037-step39: re-verified `pnpm.cmd -C apps/web test -- matchShareQrCode`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step40: removed the in-page `ShareQrCode` wrapper from `Match.tsx` and switched guest post-game QR rendering to direct `MatchShareQrCode` usage (feature boundary cleanup, no behavior change).
- [x] 2026-02-19 WO037-step40: re-verified `pnpm.cmd -C apps/web test -- matchShareQrCode`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step41: removed `Match.tsx` local RPC error predicate and switched `showRpcSettingsCta` to `resolveRpcLoadErrorToastKind(error) === "rpc"` from `features/match/matchCardLoaders.ts` (feature helper reuse, behavior maintained).
- [x] 2026-02-19 WO037-step41: re-verified `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step42: added `resolveRpcLoadErrorToastMessage` + `RpcLoadErrorToastKind` in `apps/web/src/features/match/matchCardLoaders.ts` and replaced `Match.tsx` inline RPC toast message branching with feature-helper delegation.
- [x] 2026-02-19 WO037-step42: added toast-message helper coverage in `apps/web/src/features/match/__tests__/matchCardLoaders.test.ts` and re-verified `pnpm.cmd -C apps/web test -- matchCardLoaders`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step43: added `apps/web/src/features/match/useMatchCardLoadActions.ts` and moved Match card-load action wiring (`loadCardsFromIndex` / `loadCardsFromRpc` / `loadCards`) out of `Match.tsx` while preserving RPC status propagation and guest fallback behavior.
- [x] 2026-02-19 WO037-step43: added `apps/web/src/features/match/__tests__/useMatchCardLoadActions.test.ts` (index guest fallback apply, RPC validation/success/error apply, mode-based loader routing coverage) and re-verified `pnpm.cmd -C apps/web test -- useMatchCardLoadActions`, `pnpm.cmd -C apps/web test -- matchCardLoaders`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step44: added `apps/web/src/features/match/useMatchGuestAutoLoad.ts` and moved Match guest auto-load effect (`isGuestMode && !cards && !loading`) out of `Match.tsx` while keeping trigger timing compatible (`isGuestMode` transition-based).
- [x] 2026-02-19 WO037-step44: added `apps/web/src/features/match/__tests__/useMatchGuestAutoLoad.test.ts` (auto-load predicate coverage for guest/non-guest + loaded + loading branches) and re-verified `pnpm.cmd -C apps/web test -- useMatchGuestAutoLoad`, `pnpm.cmd -C apps/web test -- useMatchCardLoadActions`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step45: added `apps/web/src/features/match/matchCardLoadUiState.ts` and moved Match card-load availability/empty-state branching (`canLoad`, loading-vs-guest-vs-setup prompt) out of `Match.tsx` via helper functions.
- [x] 2026-02-19 WO037-step45: added `apps/web/src/features/match/__tests__/matchCardLoadUiState.test.ts` (guest/non-guest canLoad and empty-state resolver branch coverage) and re-verified `pnpm.cmd -C apps/web test -- matchCardLoadUiState`, `pnpm.cmd -C apps/web test -- useMatchGuestAutoLoad`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step46: added `apps/web/src/features/match/matchCardLoadSetupState.ts` and moved Match setup-panel load presentation derivation (`defaultOpen`, setup error visibility, RPC settings CTA gating) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step46: added `apps/web/src/features/match/__tests__/matchCardLoadSetupState.test.ts` (cards-loaded hide branch, rpc/non-rpc error branch, no-error branch) and re-verified `pnpm.cmd -C apps/web test -- matchCardLoadSetupState`, `pnpm.cmd -C apps/web test -- matchCardLoadUiState`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step47: added `apps/web/src/features/match/MatchCardLoadEmptyStatePanel.tsx` and moved Match `!cards` empty-state panel rendering (loading skeleton / guest load button / setup prompt) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step47: added `apps/web/src/features/match/__tests__/MatchCardLoadEmptyStatePanel.test.tsx` (loading skeleton markup + guest button callback + setup prompt copy) and re-verified `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step48: added `apps/web/src/features/match/MatchResultSummaryPanel.tsx` and moved Match winner/match-info rendering (winner tiles + matchId / pre-finish message branch) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step48: added `apps/web/src/features/match/__tests__/MatchResultSummaryPanel.test.tsx` (winner summary branch, stage-focus muted pending branch, RPG style branch) and re-verified `pnpm.cmd -C apps/web test -- MatchResultSummaryPanel MatchCardLoadEmptyStatePanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step49: added `apps/web/src/features/match/MatchGuestPostGamePanel.tsx` and moved Match guest post-game CTA block (guest rematch/load/save + share/replay/template + QR details) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step49: added `apps/web/src/features/match/__tests__/MatchGuestPostGamePanel.test.tsx` (hidden branch, saved-label/state branch, action callback wiring + QR details branch) and re-verified `pnpm.cmd -C apps/web test -- MatchGuestPostGamePanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step50: added `apps/web/src/features/match/MatchAiNotesPanel.tsx` and moved the non-mint side-column collapsed AI debug notes block out of `Match.tsx`.
- [x] 2026-02-19 WO037-step50: added `apps/web/src/features/match/__tests__/MatchAiNotesPanel.test.tsx` (hidden branch, standard/stage-focus branch, RPG style branch) and re-verified `pnpm.cmd -C apps/web test -- MatchAiNotesPanel MatchGuestPostGamePanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step51: added `apps/web/src/features/match/MatchEventPanel.tsx` and moved Match Event section (event summary/status + ruleset/ai labels + events link + clear action + Nyano tokenIds display) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step51: added `apps/web/src/features/match/__tests__/MatchEventPanel.test.tsx` (hidden branch, rendered event details, clear button callback wiring) and re-verified `pnpm.cmd -C apps/web test -- MatchEventPanel MatchAiNotesPanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step52: added `apps/web/src/features/match/MatchGuestModeIntro.tsx` and moved Match guest-mode intro area (guest quick-play banner + mini tutorial slot) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step52: added `apps/web/src/features/match/__tests__/MatchGuestModeIntro.test.tsx` (hidden branch, guest banner/decks link copy, tutorial slot rendering) and re-verified `pnpm.cmd -C apps/web test -- MatchGuestModeIntro MatchEventPanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step53: added `apps/web/src/features/match/MatchShareActionsRow.tsx` and moved non-mint side-column share buttons (JSON copy / share URL / replay) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step53: added `apps/web/src/features/match/__tests__/MatchShareActionsRow.test.tsx` (default/RPG class branch, disabled gating, callback wiring) and re-verified `pnpm.cmd -C apps/web test -- MatchShareActionsRow`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step54: switched Mint drawer share buttons in `apps/web/src/pages/Match.tsx` to the extracted `MatchShareActionsRow` component so share-action rendering is unified between Mint and non-mint views.
- [x] 2026-02-19 WO037-step54: re-verified `pnpm.cmd -C apps/web test -- MatchShareActionsRow`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step55: added `apps/web/src/features/match/MatchMintAiNotesPanel.tsx` and moved Mint drawer AI debug notes details block out of `Match.tsx`.
- [x] 2026-02-19 WO037-step55: added `apps/web/src/features/match/__tests__/MatchMintAiNotesPanel.test.tsx` (hidden branch, summary/children rendering, mint shell class/style coverage) and re-verified `pnpm.cmd -C apps/web test -- MatchMintAiNotesPanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step56: added `apps/web/src/features/match/MatchMintDensityToggle.tsx` and moved the Mint drawer density toggle block (`minimal/standard/full`) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step56: added `apps/web/src/features/match/__tests__/MatchMintDensityToggle.test.tsx` (option rendering, active style branch, onChange callback wiring) and re-verified `pnpm.cmd -C apps/web test -- MatchMintDensityToggle`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step57: added `apps/web/src/features/match/MatchMintResultSummaryPanel.tsx` and moved Mint drawer winner/match-info block out of `Match.tsx` while reusing `matchResultSummary`.
- [x] 2026-02-19 WO037-step57: added `apps/web/src/features/match/__tests__/MatchMintResultSummaryPanel.test.tsx` (winner branch rendering, pending branch rendering, mint style variable coverage) and re-verified `pnpm.cmd -C apps/web test -- MatchMintResultSummaryPanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step58: added `apps/web/src/features/match/MatchMintTurnLogPanel.tsx` and moved Mint drawer TurnLog ready/fallback branching (`sim.ok` + selected index clamp) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step58: added `apps/web/src/features/match/__tests__/MatchMintTurnLogPanel.test.tsx` (fallback label branch, TurnLog prop forwarding + selected-index clamp, custom empty label branch) and re-verified `pnpm.cmd -C apps/web test -- MatchMintTurnLogPanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step59: added `apps/web/src/features/match/MatchSideTurnLogPanel.tsx` and moved non-mint side-column turn log branching (RPG/standard + `sim.ok` fallback + selected index clamp) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step59: added `apps/web/src/features/match/__tests__/MatchSideTurnLogPanel.test.tsx` (RPG branch, standard fallback branch, standard TurnLog forwarding + selected-index clamp) and re-verified `pnpm.cmd -C apps/web test -- MatchSideTurnLogPanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step60: added `apps/web/src/features/match/MatchSideColumnPanels.tsx` and moved non-mint side-column composition wiring (turn log, result summary, share actions, guest post-game panel, AI notes panel) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step60: added `apps/web/src/features/match/__tests__/MatchSideColumnPanels.test.tsx` (composition order, guest/share callback forwarding, AI visibility derivation) and re-verified `pnpm.cmd -C apps/web test -- MatchSideColumnPanels`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step61: added `apps/web/src/features/match/MatchMintDrawerPanels.tsx` and moved Mint drawer composition wiring (density toggle, turn log, winner summary, share actions, AI notes) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step61: added `apps/web/src/features/match/__tests__/MatchMintDrawerPanels.test.tsx` (composition order, density/share callback forwarding, AI visibility derivation) and re-verified `pnpm.cmd -C apps/web test -- MatchMintDrawerPanels`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step62: added `apps/web/src/features/match/MatchMintDrawerShell.tsx` and moved Mint drawer shell wiring (toggle button visibility + drawer open/close shell) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step62: added `apps/web/src/features/match/__tests__/MatchMintDrawerShell.test.tsx` (closed/open branch rendering, callback/children forwarding) and re-verified `pnpm.cmd -C apps/web test -- MatchMintDrawerShell`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step63: added `apps/web/src/features/match/MatchHandStatusHeader.tsx` and moved hand-status header rendering (mint/rpg/standard class branch, selected-cell/drag hint, mint forced-order badge) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step63: added `apps/web/src/features/match/__tests__/MatchHandStatusHeader.test.tsx` (mint forced badge branch, rpg style branch, standard style branch) and re-verified `pnpm.cmd -C apps/web test -- MatchHandStatusHeader`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step64: added `apps/web/src/features/match/MatchHandCardsPanel.tsx` and moved hand-card panel branching (Mint `HandDisplayMint`, RPG `HandDisplayRPG`, standard card-button fallback) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step64: added `apps/web/src/features/match/__tests__/MatchHandCardsPanel.test.tsx` (mint branch callback forwarding, rpg branch routing, standard fallback button behavior) and re-verified `pnpm.cmd -C apps/web test -- MatchHandCardsPanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step65: added `apps/web/src/features/match/MatchTurnActionPanel.tsx` and moved hand-area action controls (warning-mark selector + commit/undo + conditional AI move button) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step65: added `apps/web/src/features/match/__tests__/MatchTurnActionPanel.test.tsx` (warning option filtering/focus class, callback forwarding + disabled states, rpg class branch + AI visibility) and re-verified `pnpm.cmd -C apps/web test -- MatchTurnActionPanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step66: added `apps/web/src/features/match/MatchHandCompactHintPanel.tsx` and `apps/web/src/features/match/MatchErrorPanel.tsx`, then moved hand-area compact hint and rose error-shell rendering out of `Match.tsx` (including simulation-error fallback in board section).
- [x] 2026-02-19 WO037-step66: added `apps/web/src/features/match/__tests__/MatchHandCompactHintPanel.test.tsx` and `apps/web/src/features/match/__tests__/MatchErrorPanel.test.tsx` (hint summary visibility and error-shell rendering) and re-verified `pnpm.cmd -C apps/web test -- MatchHandCompactHintPanel MatchErrorPanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step67: added `apps/web/src/features/match/MatchFocusHandDockActions.tsx` and moved the stage-focus hand-dock action row (warning mark selector + commit/undo controls) out of `Match.tsx` while preserving mint focus behavior and disabled gating.
- [x] 2026-02-19 WO037-step67: added `apps/web/src/features/match/__tests__/MatchFocusHandDockActions.test.tsx` (warning-option filtering, callback/disabled forwarding, selector disable conditions) and re-verified `pnpm.cmd -C apps/web test -- MatchFocusHandDockActions`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step68: added `apps/web/src/features/match/MatchFocusHandDockCards.tsx` and moved the stage-focus hand-dock card row rendering (loading shell, fan style vars, selected/forced/used classes, drag-drop wiring) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step68: added `apps/web/src/features/match/__tests__/MatchFocusHandDockCards.test.tsx` (loading shell branch, click/drag callback forwarding, disabled drag/click guard) and re-verified `pnpm.cmd -C apps/web test -- MatchFocusHandDockCards`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step69: added `apps/web/src/features/match/MatchFocusHandDockHeaderRow.tsx` and moved the stage-focus hand-dock header row status rendering (`Thinking...` / selected card+cell status) out of `Match.tsx` while preserving existing label and forced-rule badge wiring.
- [x] 2026-02-19 WO037-step69: added `apps/web/src/features/match/__tests__/MatchFocusHandDockHeaderRow.test.tsx` (AI thinking branch, selected card/cell branch, null placeholder branch) and re-verified `pnpm.cmd -C apps/web test -- MatchFocusHandDockHeaderRow`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step70: added `apps/web/src/features/match/MatchFocusHandDock.tsx` and moved stage-focus hand-dock shell composition (dock class branch, forced-order badge, header/cards/actions wiring) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step70: added `apps/web/src/features/match/__tests__/MatchFocusHandDock.test.tsx` (stage/inline class branch, forced-badge visibility, child-prop forwarding) and re-verified `pnpm.cmd -C apps/web test -- MatchFocusHandDock`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step71: added `apps/web/src/features/match/MatchHandInteractionArea.tsx` and moved hand-area interaction branch composition (`MatchHandStatusHeader` / `MatchHandCardsPanel` / `MatchTurnActionPanel` vs `MatchHandCompactHintPanel`) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step71: added `apps/web/src/features/match/__tests__/MatchHandInteractionArea.test.tsx` (visible-controls branch, compact-hint branch, mint-select telemetry forwarding + undo availability) and re-verified `pnpm.cmd -C apps/web test -- MatchHandInteractionArea`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step72: added `apps/web/src/features/match/MatchQuickCommitBar.tsx` and moved the Mint desktop quick-commit toolbar (draft summary, warning mark selector, quick commit/undo actions) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step72: added `apps/web/src/features/match/__tests__/MatchQuickCommitBar.test.tsx` (warning option filtering, callback/action forwarding, disabled gating) and re-verified `pnpm.cmd -C apps/web test -- MatchQuickCommitBar`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step73: added `apps/web/src/features/match/MatchBoardFeedbackPanels.tsx` and moved post-board feedback rendering (last-move feedback + non-mint legacy status summary) out of `Match.tsx`.
- [x] 2026-02-19 WO037-step73: added `apps/web/src/features/match/__tests__/MatchBoardFeedbackPanels.test.tsx` (animation feedback branch, standard summary branch, stage-focus summary suppression) and re-verified `pnpm.cmd -C apps/web test -- MatchBoardFeedbackPanels`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO037-step74: added `apps/web/src/features/match/MatchInfoColumn.tsx` and moved right-column composition branching (Mint drawer shell/panels vs non-mint side-column panels) out of `Match.tsx` while preserving existing callback wiring and URL/share invariants.
- [x] 2026-02-19 WO037-step74: added `apps/web/src/features/match/__tests__/MatchInfoColumn.test.tsx` (Mint/non-mint branch routing, drawer props forwarding, side-column prop forwarding) and re-verified `pnpm.cmd -C apps/web test -- MatchInfoColumn`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO035: added classic quick preset support (`apps/web/src/lib/classic_quick_presets.ts`) and wired it into `Home`/`Arena` quick-play flows plus `Rulesets` match-link propagation (`theme`/`cr`), with Replay URL parsing helpers split to `features/match/replay*`.
- [x] 2026-02-19 WO036: refined Mint interaction UX (board hover ghost preview, classic ribbon help panel, pressable pressed-state polish, quick-rule chips styling), removed `package-lock.json` to keep pnpm lock policy, and re-verified `pnpm.cmd -C apps/web test -- classic_quick_presets ruleset_discovery`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test --`, `pnpm.cmd -C apps/web build`, `pnpm.cmd -C apps/web e2e:ux` (15 passed).
- [x] 2026-02-19 WO039: motion system token unification completed in `apps/web/src/mint-theme/mint-theme.css` (`--mint-motion-*`, ease set, `mint-motion-enter|exit|pop` helpers) and route transition switched to `mint-motion-enter` in `apps/web/src/components/AnimatedOutlet.tsx`.
- [x] 2026-02-19 WO040: Alive background layers completed by extending `apps/web/src/components/mint/MintGameShell.tsx` + `apps/web/src/mint-theme/mint-theme.css` with `mint-app-shell__grid` / `mint-app-shell__noise`, speed/opacity tokens, and `reduce-motion` / `data-vfx` gating.
- [x] 2026-02-19 WO041: catharsis layer completed by adding stage burst-level styling (`mint-stage--burst-soft|medium|hard|win`) and particle/confetti effects for `mint-stage__burst-particles`, plus Match-side burst-level wiring in `apps/web/src/pages/Match.tsx` and `apps/web/src/components/DuelStageMint.tsx`.
- [x] 2026-02-19 WO042: idle guidance completed via new hook `apps/web/src/hooks/useIdle.ts` and wiring in `apps/web/src/pages/Home.tsx`, `apps/web/src/pages/Arena.tsx`, `apps/web/src/pages/Match.tsx`, `apps/web/src/components/BoardViewMint.tsx`, and `apps/web/src/features/match/MatchHandInteractionArea.tsx`.
- [x] 2026-02-19 WO043: sitewide UX baseline refined by adding `mint-hit` minimum target utility and applying it through `apps/web/src/components/mint/MintPressable.tsx`, plus rule-summary min-height and idle prompt emphasis to reduce visual jump and improve "pressable" affordance.
- [x] 2026-02-19 WO039-043 validation refresh: `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test --` / `pnpm.cmd -C apps/web build` / `pnpm.cmd -C apps/web e2e:ux` all passed (Vitest 173 files/1584 tests, Playwright UX 15 tests).
- [x] 2026-02-19 WO001 status sync: `codex/work_orders/001_fix_nft_images.md` �̐��ʕ�/�^�X�N��������Ԃɍ��킹�Ċ������ishared resolver + DOM/Pixi���� + retry/preload + tests�j�B
- [x] 2026-02-19 WO002 status sync: `codex/work_orders/002_fix_replay_share.md` �̐��ʕ�/�^�X�N��������Ԃɍ��킹�Ċ������iBASE_URL�Ή� share URL + Replay�������� + replay bundle versioning + tests�j�B
- [x] 2026-02-19 WO003-A scaffold: added Pixi asset scaffold directories (`apps/web/public/assets/engine/{board,cell,card,fx}`) plus BASE_URL-aware manifest helper (`apps/web/src/engine/renderers/pixi/engineAssetManifest.ts`) and unit test (`apps/web/src/engine/__tests__/engineAssetManifest.test.ts`).
- [x] 2026-02-19 WO003-B layer split: `PixiBattleRenderer` �̔Ֆʕ`��� shadow/base/detail �̃��C���[�Ӗ��ɕ������A�i�������� `boardLayerTokensForQuality`�i`apps/web/src/engine/renderers/pixi/boardLayerTokens.ts`�j�֏W��Bcell shadow ����g�[�N���Q�Ƃɓ���B
- [x] 2026-02-19 WO003-C animation polish: shortened Pixi place/flip timing in `apps/web/src/engine/renderers/pixi/cellAnimations.ts` (low 220/220/90, medium+high 360/440/120) and tuned keyframes to gentler event-focused motion; updated coverage in `apps/web/src/engine/__tests__/cellAnimations.test.ts`.
- [x] 2026-02-19 WO003-D foil polish: added high-tier-only pseudo foil base + event-synced foil flash composition in `apps/web/src/engine/renderers/pixi/PixiBattleRenderer.ts` with shared gating/intensity helpers in `apps/web/src/engine/renderers/pixi/foilFx.ts`.
- [x] 2026-02-19 WO003-E vfx switch guard: added `apps/web/src/engine/__tests__/foilFx.test.ts` and `apps/web/src/engine/__tests__/vfxQualitySwitchGuard.test.ts`, then updated WO003 verification handbook steps (Match/Replay focus-toolbar VFX switching).
- [x] 2026-02-20 WO038 visual regression: added `apps/web/e2e/engine-stage-visual-regression.spec.ts` with 390x844 Pixi board screenshots (initial + after first place), seeded stable mode (`reduced-motion` + `nytl.vfx.quality=off`), and registered it in `apps/web/package.json` `e2e:ux`.
- [x] 2026-02-20 WO008/WO009 docs sync: aligned stale top-level Deliverables/Task checkboxes in `codex/work_orders/008_match_setup_nintendo_quality.md` and `codex/work_orders/009_rulesets_page_make_it_obvious.md` with already-completed implementation status sections (no runtime behavior change).
- [x] 2026-02-20 WO025/026/027 docs sync: reconciled stale top-level Deliverables/Task checklists in `codex/work_orders/025_classic_rules_presets_surface.md`, `codex/work_orders/026_classic_rules_custom_builder_share.md`, and `codex/work_orders/027_rules_setup_nintendo_quality.md` against existing implemented artifacts/tests (docs-only cleanup).
- [x] 2026-02-20 WO037-step75: Match/Replay Pixi fallback state was shared into useEngineRendererFallback with tests.
- [x] 2026-02-20 WO037-step76: Replay stage feedback timer/state logic now reuses useMatchStageActionFeedback.
- [x] 2026-02-20 WO037-step77: Replay fullscreen state/toggle now reuses useMatchStageFullscreen.
- [x] 2026-02-20 WO037-step78: Replay stage controls visibility/toggle now reuses useMatchStageUi.
- [x] 2026-02-20 WO037-step79: Replay keyboard shortcut handling extracted to useReplayStageFocusShortcuts + replayStageFocusShortcuts.
- [x] 2026-02-20 WO037-step80: Replay stage board sizing moved to useReplayStageBoardSizing.
- [x] 2026-02-20 WO037-step81: Replay stage focus UI callbacks were extracted to useReplayStageActionCallbacks.

- [x] 2026-02-20 WO037-step82: Replay stage route derivation (/replay-stage detection + focus route + stage URL) was extracted to replayStageRouteState / useReplayStageRouteState.

- [x] 2026-02-20 WO037-step83: Replay URL mutators (board-ui switch and focus-mode toggle) were extracted to useReplaySearchMutators with tested pure mutation helpers.

- [x] 2026-02-20 WO037-step84: Replay share URL mode/step sync effect was extracted to useReplayStepModeUrlSync with tested pure mutation helper.

- [x] 2026-02-20 WO037-step85: Replay non-engine focus auto-clear effect was extracted to useReplayEngineFocusGuard with tested pure mutation helper.

- [x] 2026-02-20 WO037-step86: Replay broadcast toggle URL sync was extracted to useReplayBroadcastToggle with tested pure mutation helper.

- [x] 2026-02-20 WO037-step87: Replay error-panel actions (retry decode/load + clear share params) were extracted into replayShareParamActions helpers and bound via dedicated handlers in Replay.tsx.

- [x] 2026-02-20 WO037-step88: Replay highlight navigation math/status formatting was extracted to replayHighlightNavigation helpers and wired back into Replay callbacks/memos.

- [x] 2026-02-20 WO037-step89: Replay transport derived state (playability/step edges/focus toolbar visibility/button classes) was extracted to replayTransportState helper with tests.

- [x] 2026-02-20 WO037-step90: Replay autoplay timer/step-advance logic was extracted to useReplayAutoplay with tested pure interval/advance helpers.

- [x] 2026-02-20 WO037-step91: Replay stage impact burst logic (impact resolve + burst plan + timeout effect) was extracted to useReplayStageImpactBurst.

- [x] 2026-02-20 WO037-step92: Replay compare-mode/diverged-state derivation was extracted to replayCompareState helpers with tests.

- [x] 2026-02-20 WO037-step93: Replay preload token-id derivation was extracted to replayPreloadTokenIds helper with order-preserving dedupe tests.

- [x] 2026-02-20 WO037-step94: Replay classic open/swap visibility state was consolidated into replayClassicState helper (including slot-label formatter).

- [x] 2026-02-20 WO037-step95: Replay board compare/delta and Nyano reaction input derivation were extracted to replayDerivedState helpers and Replay.tsx now reuses them (including shared turnPlayer import).

- [x] 2026-02-20 WO037-step96: Replay stage VFX option/label and step clamp helpers were extracted to replayUiHelpers and Replay.tsx now reuses shared helpers.

- [x] 2026-02-20 WO037-step97: Replay ruleset label formatters were moved to replayRulesetLabel helpers and Replay.tsx now consumes the shared helper module.

- [x] 2026-02-20 WO037-step98: Replay ruleset context derivation (effective mode / resolved ruleset usage / rulesetId mismatch warning) was extracted to replayRulesetContext and Replay.tsx now reuses it.

- [x] 2026-02-20 WO037-step99: Replay current-result selection (v1/v2/compare/resolved ruleset + label) was extracted to replayResultSelection and Replay.tsx now uses the helper.

- [x] 2026-02-20 WO037-step100: Replay overlay last-move/last-turn-summary derivation was extracted to replayOverlaySummary and Replay.tsx now reuses the helper functions.

- [x] 2026-02-20 WO037-step101: Replay overlay publish payload assembly was extracted to replayOverlayState helpers (error/payload/protocol snapshot) and Replay.tsx now delegates to the helper module.

- [x] 2026-02-20 WO037-step102: Replay card-resolution branch (v2 embedded cards / v1 resolveCards + missing-card guard) was extracted to replayCardLoaders and Replay.tsx now delegates to the helper.

- [x] 2026-02-20 WO037-step102: added apps/web/src/features/match/__tests__/replayCardLoaders.test.ts and re-verified pnpm.cmd -C apps/web test -- replayCardLoaders replayOverlayState replayOverlaySummary replayResultSelection replayRulesetContext replayRulesetLabel replayUiHelpers replayDerivedState replayClassicState replayPreloadTokenIds replayCompareState useReplayStageImpactBurst useReplayAutoplay replayTransportState replayHighlightNavigation replayShareParamActions useReplayBroadcastToggle useReplayEngineFocusGuard useReplayStepModeUrlSync useReplaySearchMutators replayStageRouteState, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step103: Replay share-link builders were extracted to apps/web/src/features/match/replayShareLinks.ts (resolveReplayShareJson / buildReplayShareLink), and Replay.tsx now delegates canonical/current share URL composition.

- [x] 2026-02-20 WO037-step103: added apps/web/src/features/match/__tests__/replayShareLinks.test.ts and re-verified pnpm.cmd -C apps/web test -- replayShareLinks replayCardLoaders, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step104: Replay event-attempt save guards and payload builder were extracted to apps/web/src/features/match/replayEventAttempts.ts, and Replay.tsx saveToMyAttempts now delegates those checks/build steps.

- [x] 2026-02-20 WO037-step104: added apps/web/src/features/match/__tests__/replayEventAttempts.test.ts and re-verified pnpm.cmd -C apps/web test -- replayEventAttempts replayShareLinks replayCardLoaders, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step105: Replay overlay publish action flow was extracted to apps/web/src/features/match/replayOverlayActions.ts (runReplayOverlayPublishAction), and Replay.tsx now delegates overlay publish/error/silent toast branching.

- [x] 2026-02-20 WO037-step105: added apps/web/src/features/match/__tests__/replayOverlayActions.test.ts and re-verified pnpm.cmd -C apps/web test -- replayOverlayActions replayEventAttempts replayShareLinks replayCardLoaders replayOverlayState replayOverlaySummary, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step106: Replay verify/copy UI actions were extracted to apps/web/src/features/match/replayUiActions.ts (runReplayVerifyAction / copyReplayValueWithToast + status/sfx resolvers), and Replay.tsx now delegates those side-effect branches.

- [x] 2026-02-20 WO037-step106: added apps/web/src/features/match/__tests__/replayUiActions.test.ts and re-verified pnpm.cmd -C apps/web test -- replayUiActions replayOverlayActions replayEventAttempts replayShareLinks replayCardLoaders replayOverlayState replayOverlaySummary, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step107: Replay simulation selection block (ruleset context + v1/v2/resolved simulation + current label/result choose) was extracted to apps/web/src/features/match/replaySimulationState.ts, and Replay.tsx load flow now delegates this derivation.

- [x] 2026-02-20 WO037-step107: added apps/web/src/features/match/__tests__/replaySimulationState.test.ts and re-verified pnpm.cmd -C apps/web test -- replaySimulationState replayUiActions replayOverlayActions replayEventAttempts replayShareLinks replayCardLoaders replayOverlayState replayOverlaySummary, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step108: Replay load orchestration (input text resolution + payload parse + ruleset fallback params + card resolve + simulation derive + start-step clamp) was extracted to apps/web/src/features/match/replayLoadAction.ts, and Replay.tsx load now delegates to runReplayLoadAction.

- [x] 2026-02-20 WO037-step108: added apps/web/src/features/match/__tests__/replayLoadAction.test.ts and re-verified pnpm.cmd -C apps/web test -- replayLoadAction replaySimulationState replayUiActions replayOverlayActions replayEventAttempts replayShareLinks replayCardLoaders replayOverlayState replayOverlaySummary, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step109: Replay retry/initial auto-load recovery flow was extracted to apps/web/src/features/match/replayLoadRecovery.ts (runReplayRetryLoadFlow / runReplayInitialAutoLoadFlow), and Replay.tsx now delegates retry decode branches and first-load share handling.

- [x] 2026-02-20 WO037-step109: added apps/web/src/features/match/__tests__/replayLoadRecovery.test.ts and re-verified pnpm.cmd -C apps/web test -- replayLoadRecovery replayLoadAction replaySimulationState replayUiActions replayOverlayActions replayEventAttempts replayShareLinks replayCardLoaders replayOverlayState replayOverlaySummary, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step110: Replay sim-state shape and builders were extracted to apps/web/src/features/match/replaySimState.ts (ReplaySimState / REPLAY_INPUT_PROMPT_ERROR / buildReplaySimErrorState / buildReplaySimSuccessState), and Replay.tsx setSim calls now use the shared builders.

- [x] 2026-02-20 WO037-step110: added apps/web/src/features/match/__tests__/replaySimState.test.ts and re-verified pnpm.cmd -C apps/web test -- replaySimState replayLoadRecovery replayLoadAction replaySimulationState replayUiActions replayOverlayActions replayEventAttempts replayShareLinks replayCardLoaders replayOverlayState replayOverlaySummary, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.
- [x] 2026-02-20 WO037-step111: Replay share/save action runner helpers were extracted to apps/web/src/features/match/replayActionRunners.ts (runReplayShareCopyAction / runReplaySaveAttemptAction), and Replay.tsx now delegates duplicated setup/result-panel async handlers to these shared helpers.

- [x] 2026-02-20 WO037-step111: added apps/web/src/features/match/__tests__/replayActionRunners.test.ts and re-verified pnpm.cmd -C apps/web test -- replayActionRunners replayUiActions replayEventAttempts replayLoadRecovery replayLoadAction replaySimState replayOverlayActions replayShareLinks, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step112: Replay generic copy action runner was added to apps/web/src/features/match/replayActionRunners.ts (runReplayCopyAction), and Replay.tsx copy buttons now delegate via the runner to unify async copy handling and avoid inline floating promises.

- [x] 2026-02-20 WO037-step112: expanded apps/web/src/features/match/__tests__/replayActionRunners.test.ts and re-verified pnpm.cmd -C apps/web test -- replayActionRunners replayUiActions replayEventAttempts replayLoadRecovery replayLoadAction replaySimState replayOverlayActions replayShareLinks, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step113: Replay stage-panel visibility state sync (showStagePanels / showStageSetup) was extracted to apps/web/src/features/match/useReplayStagePanelVisibility.ts, and Replay.tsx now consumes the hook instead of duplicated focus-route effects.

- [x] 2026-02-20 WO037-step113: added apps/web/src/features/match/__tests__/useReplayStagePanelVisibility.test.ts and re-verified pnpm.cmd -C apps/web test -- useReplayStagePanelVisibility useReplayStageActionCallbacks replayActionRunners replayUiActions replayLoadRecovery replayLoadAction replaySimState, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step114: Replay share-link builders were extracted to apps/web/src/features/match/replayShareLinkBuilders.ts (buildReplayCanonicalShareLink / buildReplayCurrentShareLink), and Replay.tsx now reuses shared base input + helper calls for canonical/current URL composition.

- [x] 2026-02-20 WO037-step114: added apps/web/src/features/match/__tests__/replayShareLinkBuilders.test.ts and re-verified pnpm.cmd -C apps/web test -- replayShareLinkBuilders replayShareLinks replayActionRunners replayEventAttempts replayLoadAction replayLoadRecovery replaySimState replayUiActions, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step115: Replay transport action callbacks (start/prev/play-toggle/next/end/highlight prev-next) were extracted to apps/web/src/features/match/useReplayTransportActionCallbacks.ts, and Replay.tsx now delegates shortcut/toolbar actions via the shared callback hook.

- [x] 2026-02-20 WO037-step115: added apps/web/src/features/match/__tests__/useReplayTransportActionCallbacks.test.ts and re-verified pnpm.cmd -C apps/web test -- useReplayTransportActionCallbacks useReplayStageFocusShortcuts replayTransportState replayShareLinkBuilders replayActionRunners replayLoadRecovery replayLoadAction replaySimState, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step116: Replay clear-share-params action flow was extracted to apps/web/src/features/match/replayLoadRecovery.ts (runReplayClearShareParamsFlow), and Replay.tsx now delegates URL mutation + prompt reset through the shared recovery helper.

- [x] 2026-02-20 WO037-step116: expanded apps/web/src/features/match/__tests__/replayLoadRecovery.test.ts and re-verified pnpm.cmd -C apps/web test -- replayLoadRecovery replayShareParamActions replayLoadAction replaySimState useReplayTransportActionCallbacks replayShareLinkBuilders replayActionRunners, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.

- [x] 2026-02-20 WO037-step117: Replay copy-toast wrapper creation was extracted to apps/web/src/features/match/replayUiActions.ts (createReplayCopyWithToast), and Replay.tsx now reuses the shared helper instead of defining a local async wrapper.

- [x] 2026-02-20 WO037-step117: expanded apps/web/src/features/match/__tests__/replayUiActions.test.ts and re-verified pnpm.cmd -C apps/web test -- replayUiActions replayActionRunners replayLoadRecovery replayShareLinkBuilders useReplayTransportActionCallbacks replayLoadAction replaySimState, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build.
- [x] 2026-02-20 WO037-step118: Stage VFX UI/options and change flow were unified for Match/Replay by adding shared helpers (apps/web/src/features/match/stageVfxUi.ts, apps/web/src/features/match/stageVfxPreference.ts) and wiring both pages to reuse the same VFX apply/sfx/feedback path.

- [x] 2026-02-20 WO037-step118: added apps/web/src/features/match/__tests__/stageVfxPreference.test.ts and re-verified pnpm.cmd -C apps/web test -- stageVfxPreference replayUiHelpers, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build (sandboxed vitest hit spawn EPERM; rerun outside sandbox passed).
- [x] 2026-02-20 WO037-step119: Match/Replay �� Stage VFX state �������ƕύX�n���h���� useStageVfxPreference �ɓ������A�y�[�W���̏d��������팸�B

- [x] 2026-02-20 WO037-step119: added apps/web/src/features/match/__tests__/useStageVfxPreference.test.ts and re-verified pnpm.cmd -C apps/web test -- useStageVfxPreference stageVfxPreference replayUiHelpers, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build (sandboxed vitest hit spawn EPERM; rerun outside sandbox passed).
- [x] 2026-02-20 WO037-step120: Stage VFX �Z���N�g�� option label ������ resolveStageVfxOptionLabel �ɋ��ʉ����AMatch/Replay �� JSX ����d����팸�B

- [x] 2026-02-20 WO037-step120: expanded apps/web/src/features/match/__tests__/replayUiHelpers.test.ts and re-verified pnpm.cmd -C apps/web test -- replayUiHelpers useStageVfxPreference stageVfxPreference, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build (sandboxed vitest hit spawn EPERM; rerun outside sandbox passed).
- [x] 2026-02-20 WO043-followup-1: direct mint-pressable controls in Home/Arena/Decks/ResultOverlay/TabNav/RulesetPicker were hardened with mint-hit so touch hit targets consistently respect the 44px baseline.

- [x] 2026-02-20 WO043-followup-1: re-verified pnpm.cmd -C apps/web test -- MintRulesetPicker, pnpm.cmd -C apps/web lint, pnpm.cmd -C apps/web typecheck, pnpm.cmd -C apps/web build (sandboxed vitest hit spawn EPERM; rerun outside sandbox passed).

- [x] 2026-02-20 WO044-step1: Match周辺の文字衛生(P0)として mojibake / control-char / PUA 汚染を除去。対象: `apps/web/src/pages/Match.tsx` と `apps/web/src/features/match/*` の該当UI文言、および `useMatchCardLoadActions` と対応テスト期待値。

- [x] 2026-02-20 WO044-step1: `scripts/check_text_hygiene.mjs` を整理し、既定スキャン範囲を `apps/web/src` に固定（広域チェックは `--root` 指定で実行）。再検証: `pnpm.cmd lint:text` / `pnpm.cmd -C apps/web test --` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web build`。
- [x] 2026-02-20 WO045-step2: Mint shell background layers were upgraded with cloud-corners + paw-pattern channels (`MintGameShell` + `mint-theme.css`), with asset-first and CSS-fallback composition so placeholder PNGs do not break visual quality.

- [x] 2026-02-20 WO046-step1: Match share action row received micro-delight and guidance polish (`MatchShareActionsRow` + Mint theme styles): pressable hit area, explicit share action labels, and pre-finalize hint copy. Verified with `pnpm.cmd -C apps/web test -- MatchShareActionsRow MatchGuestPostGamePanel`.

- [x] 2026-02-20 WO045/046-step2 verification: `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web build` all passed.
- [x] 2026-02-20 WO045-step3: replaced placeholder material assets with production-sized textures in `apps/web/public/assets/gen` (`tx_noise_256_v1.png`, `slot_inner_shadow_256_v1.png`, `fx_sparkle_tile_512_v1.png`, `board_tray_tex_1024_v1.png`, `bg_paw_tile_512_v1.png`, `bg_cloud_corners_16x9_v3.png`).

- [x] 2026-02-20 WO045/046-step3 verification: re-ran full web checks after asset replacement: `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web test --` (218 files / 1746 tests), `pnpm.cmd -C apps/web build` all passed.

- [x] 2026-02-20 WO046-step2: `MatchGuestPostGamePanel` を `MatchShareActionsRow` と同系統の micro-delight に統一。share row に `mint-share-actions*` を適用し、共有ボタンへ `mint-pressable` / `mint-hit` / a11y label を追加、未確定時ヒントを表示。

- [x] 2026-02-20 WO046-step2 verification: `pnpm.cmd -C apps/web test -- MatchGuestPostGamePanel MatchSideColumnPanels MatchShareActionsRow`、`pnpm.cmd lint:text`、`pnpm.cmd -C apps/web lint`、`pnpm.cmd -C apps/web typecheck`、`pnpm.cmd -C apps/web test --`、`pnpm.cmd -C apps/web build` all passed.

- [x] 2026-02-20 WO046-step3: Match focus toolbar の `Open Replay` 表記を share actions と同一の `Open replay` に統一し、`aria-label` / `title` を付与して a11y を揃えた（`apps/web/src/pages/Match.tsx`）。

- [x] 2026-02-20 WO046-step3 verification: `pnpm.cmd lint:text`、`pnpm.cmd -C apps/web test -- matchStageActionCallbacks MatchGuestPostGamePanel MatchSideColumnPanels MatchShareActionsRow`、`pnpm.cmd -C apps/web lint`、`pnpm.cmd -C apps/web typecheck`、`pnpm.cmd -C apps/web test --`、`pnpm.cmd -C apps/web build` all passed.

- [x] 2026-02-20 WO046-step4: Replay の share 導線を Mint 規格へ統一。`replayUiHelpers` に `resolveReplayMintButtonClass` を追加し、`Replay.tsx` の共有ボタン（focus toolbar / setup / result hero）へ `mint-pressable` / `mint-hit` / `mint-share-action__btn` と `aria-label` / `title` を適用。

- [x] 2026-02-20 WO046-step4 verification: `pnpm.cmd -C apps/web test -- replayUiHelpers replayUiActions replayShareLinkBuilders replayTransportState`、`pnpm.cmd lint:text`、`pnpm.cmd -C apps/web lint`、`pnpm.cmd -C apps/web typecheck`、`pnpm.cmd -C apps/web test --`（218 files / 1748 tests）、`pnpm.cmd -C apps/web build` all passed.

- [x] 2026-02-20 WO045-step4: 任意P1素材 `ui_sheen_soft_512_v1.png` / `ui_rim_highlight_512_v1.png` を `apps/web/public/assets/gen` に追加し、`mint-theme.css` の `mint-share-action__btn` に asset-first + fallback で反射/リム質感を適用。

- [x] 2026-02-20 WO045-step4 verification: `pnpm.cmd lint:text`、`pnpm.cmd -C apps/web lint`、`pnpm.cmd -C apps/web typecheck`、`pnpm.cmd -C apps/web test --`（218 files / 1748 tests）、`pnpm.cmd -C apps/web build` all passed.
- [x] 2026-02-20 WO046-step5: added native-share-first fallback for Match/Replay share actions (`apps/web/src/lib/webShare.ts`, `useMatchReplayActions`, `replayActionRunners`, `Replay.tsx`) and verified with `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web test -- useMatchReplayActions replayActionRunners webShare replayUiHelpers`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web build` (sandbox vitest EPERM once; elevated rerun passed).
