# Nyano Triad League â€Eé–‹ç™ºTODOEE1EE

ã“ãEãƒ•ã‚¡ã‚¤ãƒ«ã¯ã€Œä»Šãªã«ã‚’ä½œã£ã¦ãE‚‹ã‹ã€ã€Œæ¬¡ã«ãªã«ã‚’ä½œã‚‹ã‹ã€ã‚’ã€ã‚³ãƒŸãƒ¥ãƒ‹ãƒ†ã‚£ã¨å…±æœ‰ã™ã‚‹ãŸã‚ãEå®Ÿè£EODOã§ã™ã€E

---

## âœEDone

- âœECommit0001: åˆæœŸã‚»ãƒEƒˆã‚¢ãƒEEEEocsé››å½¢ã€triad-engine skeletonEE
- âœECommit0002: ãƒˆãƒ©ãƒ³ã‚¹ã‚¯ãƒªãƒ—ãƒˆv1EEIP-712 / matchIdæ–¹é‡ï¼E ruleset config specEˆæ¦‚å¿µEE
- âœECommit0003: ã‚ªãƒ¼ãƒˆãƒãƒŸãEè¦–ç‚¹Eˆé‹å–¶ä¸åœ¨ã§ã‚‚å›ã‚‹ä»•çµE¿E‰ãEãƒ­ãƒ¼ãƒ‰ãEãƒEEè‰æ¡E+ ERC-6551 / stakingæ¤œè¨ãƒ¡ãƒ¢
- âœECommit0004: triad-engine Layer2EEarning mark / combo bonus / second-player balanceE‰å®Ÿè£E+ ã‚´ãƒ¼ãƒ«ãƒEƒ³ãƒE‚¹ãƒE
- âœECommit0005: triad-engine Layer3EEraitåŠ¹æEv1E‰å®Ÿè£E+ ä»•æ§˜æ›´æ–°
- âœECommit0006: Nyano Peace ã‚ªãƒ³ãƒã‚§ãƒ¼ãƒ³ Trait â†Eã‚²ãƒ¼ãƒ å†ETraitType ã®å°åEEE1EE
  - `synergy.traitDerivation` ã‚Eruleset ã«è¿½åŠ 
  - TSãƒ˜ãƒ«ãƒ‘ï¼EmakeCardDataFromNyano` / `deriveTraitTypeFromNyanoTraitV1`EE
  - `TRAIT_DERIVATION_SPEC` è¿½åŠ 

  - Shadow / Forest / Earth / Thunder / Light
  - Cosmic / Metal / Flame / Aqua / Wind
  - `TRAIT_EFFECTS_SPEC` è¿½åŠ ã€æ—¢å­˜ä»•æ§˜ï¼Euleset/transcriptE‰ã‚’å®Ÿè£E«è¿½å¾E

---

- âœECommit0007: Formation bonusesEEayer3æ‹¡å¼µE‰v1 å®Ÿè£E+ ä»•æ§˜è¿½åŠ 
  - äº”è¡Œèª¿å’Œï¼Eive Elements HarmonyE‰ï¼šcomboBonus ã® triadPlus ã‚’å€ç‡é©ç”¨
  - æ—¥é£Ÿï¼EclipseE‰ï¼šLight+Shadow ã®ã‚¯ãƒ­ã‚¹EEightãŒè­¦æˆ’ç„¡åŠ¹EShadowãŒLightå…‰æºï¼E
  - MatchResult ã« `formations` ã‚’è¿½åŠ EEI/è§£æãŒ â€œé‹å–¶ãªã—â€Eã§ã‚‚ä½œã‚Šã‚E™ãE¼E
  - `FORMATION_BONUS_SPEC` è¿½åŠ ã€ruleset/transcript è¿½å¾E


- âœECommit0008: rulesetId å‚çEå®Ÿè£E¼ˆå›ºå®šABIã‚¨ãƒ³ã‚³ãƒ¼ãƒ‰ï¼E RULESET_ID_SPEC + ãƒE‚¹ãƒˆãEã‚¯ã‚¿
  - ç„¡åŠ¹åŒ–ã‚»ã‚¯ã‚·ãƒ§ãƒ³ã‚’æ­£è¦åŒ–EˆåŒæŒ™å‹•ã§IDãŒåEè£‚ã—ãªãE¼E
  - äº”è¡Œèª¿å’ŒãE requiredElements ã‚’é›†åˆæ‰±ãE¼ˆé Eºã‚’ç„¡è¦–ï¼E
  - `computeRulesetIdV1(ruleset)` ã‚’è¿½åŠ EESå‚çEå®Ÿè£E¼E
- âœESprint UX: Homeã€Œã™ãéŠã¶ã€âEåˆæ‰‹é…ç½®ã¾ã§ã®æ™‚é–“è¨ˆæ¸¬ã‚’è¿½åŠ EEquickplay_to_first_place_ms`EE
- âœESprint UX: Home LCP ã®ãƒ­ãƒ¼ã‚«ãƒ«è¨ˆæ¸¬ã‚’è¿½åŠ EEhome_lcp_ms`EE
- âœESprint UX: Home Settings ã« UXç›®æ¨™ãE PASS/FAIL åˆ¤å®šã‚’è¿½åŠ EE-1/B-1/B-4/G-3EE
- âœESprint UX: `Copy Snapshot` ã¨ `PLAYTEST_LOG.md` ã‚’è¿½åŠ ã—ã€è¨ˆæ¸¬ãƒ­ã‚°é‹ç”¨ã‚’å›ºå®E
- âœESprint UX: web lint warning 2ä»¶ã‚’è§£æ¶ˆï¼Epnpm -C apps/web lint` warning 0EE
- âœESprint UX: Snapshotã«ç’°å¢E‚³ãƒ³ãƒE‚­ã‚¹ãƒˆï¼Eoute/viewport/language/UAE‰ã‚’å«ã‚ã€æ¯”è¼Eƒ­ã‚°ç²¾åº¦ã‚’å‘ä¸E
- âœESprint UX: NyanoCardArt ã®å¤±æ•—æ™‚ã« Retry å°ç·šã‚’è¿½åŠ EEetry nonce ä»˜ãå†èª­è¾¼EE
- âœECommit0104: ã€Œã‚·ãƒ¼ã‚ºãƒ³ã®è­°ä¼šã€æœ€å°ãEãƒ­ãƒˆã‚³ãƒ«EEroposal / vote / adoptE‰ã‚’ TS å‚çEå®Ÿè£E
  - `season_council.ts` ã‚’è¿½åŠ EEroposalId / vote hash / EIP-712 vote verify / tally / adoptEE
  - æ±ºå®šè«–ãƒ«ãƒ¼ãƒ«ã‚’å›ºå®šï¼ˆå€™è£œé›†åEcanonicalizeã€åŒä¸€voterã¯æœ€å¤§nonceæ¡ç”¨ã€åŒçEE rulesetId æ˜E E¼E
  - ä»•æ§˜æ›¸ `SEASON_COUNCIL_SPEC` ã‚’è¿½åŠ 
- âœECommit0105: permissionless ladder format v1EEranscript + settled event + ä¸¡ç½²åï¼‰ã‚’ TS å‚çEå®Ÿè£E
  - `ladder.ts` ã‚’è¿½åŠ EEIP-712 attestation / record verify / deterministic standingsEE
  - indexer éä¾å­˜ãE tie-break ã‚’å›ºå®šï¼Eoints â†Ewins â†EtileDiff â†Elosses â†EaddressEE
  - ä»•æ§˜æ›¸ `LADDER_FORMAT_SPEC` ã‚’è¿½åŠ 
- âœECommit0106: Phase 3 hardeningEError tracking + release runbookE‰ã‚’æœ€å°å®Ÿè£E
  - `apps/web/src/lib/error_tracking.ts` ã‚’è¿½åŠ EElobal error / unhandledrejection ã®åé›†EE
  - sink ã‚’åEæ›¿å¯èƒ½åŒ–ï¼Eocal / console / remote, envè¨­å®šï¼E
  - `docs/99_dev/RELEASE_RUNBOOK_v1_ja.md` ã‚’è¿½åŠ EEersioning/changelog/rollback/feature flagEE
  - `pnpm run release:check` ã‚’è¿½åŠ EˆåEè·å‰ãƒã‚§ãƒE‚¯ã®æ¨™æº–åŒ–EE
- âœECommit0107: æ–°è¦å‚åŠ è€E‘ãEquickstart å°ç·šï¼Eã‚¹ãƒEƒƒãƒ—é€²æ—ï¼‰ã‚’å®Ÿè£E
  - `apps/web/src/lib/onboarding.ts` ã‚’è¿½åŠ EEocalStorageæ°¸ç¶šåŒ–ãƒ»é€²æ—é›†è¨ˆãEãƒªã‚»ãƒEƒˆEE
  - Home ã«ã€ŒãEã˜ã‚ã¦ã®1åˆE‚¹ã‚¿ãƒ¼ãƒˆã€ãƒã‚§ãƒE‚¯ãƒªã‚¹ãƒˆã¨1åˆEƒ«ãƒ¼ãƒ«ãƒ¢ãƒ¼ãƒ€ãƒ«ã‚’è¿½åŠ 
  - Match ã®ã‚²ã‚¹ãƒˆå¯¾æˆ¦å°ç·šã§ `start_first_match` / `commit_first_move` ã‚’èEå‹•æ›´æ–°
  - `onboarding.test.ts` ã‚’è¿½åŠ Eˆæ—¢å®šå€¤ã€æ°¸ç¶šåŒ–ã€ç•°å¸¸å€¤fallbackã€resetEE
- âœECommit0108: /stream ãƒ¢ãƒEƒ¬ãƒ¼ã‚·ãƒ§ãƒ³EEGãƒ¯ãƒ¼ãƒE/ BAN / slow modeE‰ã‚’å®Ÿè£E
  - `stream_moderation.ts` ã‚’è¿½åŠ Eˆåˆ¤å®šãƒ­ã‚¸ãƒE‚¯ã‚Epure function åŒ–ï¼E
  - VoteControlPanel ã« moderation è¨­å®šUIEElow modeç§’æ•° / banned users / blocked wordsE‰ã‚’è¿½åŠ 
  - æŠ•ç¥¨å—ç†å‰ã« BAN / NGãƒ¯ãƒ¼ãƒE/ slow mode ã‚’é©ç”¨ã—ã€audit ã« reject çE”±ã‚’è¨˜éŒ²
  - `local_settings` ã« moderation æ°¸ç¶šåŒ–ã‚­ãƒ¼ã‚’è¿½åŠ EEoundtrip test ä»˜ãEE
- âœECommit0109: /events ã« Season ArchiveEEocalE‰ã‚’è¿½åŠ 
  - `season_archive.ts` ã‚’è¿½åŠ EEeason/eventå˜ä½ãEé›E¨ˆã‚’ pure function åŒ–ï¼E
  - Events ã« season åˆE›¿ãƒ»å‹ç‡/æŒ‘æˆ¦æ•°ã‚µãƒãƒªãƒ¼ãƒ»æœ€æ–°Replayå°ç·šãEMarkdownã‚³ãƒ”ãEã‚’è¿½åŠ 
  - `event_attempts` ã«å…¨ä»¶å–å¾Eå…¨æ¶ˆå» API ã‚’è¿½åŠ Eˆãƒ­ãƒ¼ã‚«ãƒ«é‹ç”¨ã®ä¿å®ˆæ€§å‘ä¸Šï¼E
  - `season_archive.test.ts` / `event_attempts.test.ts` ã§é›E¨ˆã¨ storage API ã‚’æ¤œè¨¼
- âœEWO005-A follow-up: Stage route queryæ­£è¦åŒ– + Stage E2Eã‚¹ãƒ¢ãƒ¼ã‚¯ã‚’è¿½åŠ 
  - `normalizeStageFocusParams` ã‚’å°åEã—ã€`ui=engine` + `focus=1` + `layout`é™¤å»ã‚’åEé€šåŒ–
  - `/battle-stage` `/replay-stage` å‘ã‘ `stage-focus.spec.ts` ã‚’è¿½åŠ ã—ã€URLæ­£è¦åŒ–ã¨ä¸»è¦UIå‡ºç¾ã‚’æ¤œè¨¼
- âœEWO005-B follow-up: Stageè£œåŠ©ã‚³ãƒ³ãƒˆãƒ­ãƒ¼ãƒ«ã®ãƒ¬ã‚¹ãƒãƒ³ã‚·ãƒ–è¿½å¾“ã‚’å¼·åŒE
  - `shouldShowStageSecondaryControls` ã‚’å°åEã—ã€ã‚¹ãƒEEã‚¸è£œåŠ©UIã®è¡¨ç¤ºé–¾å€¤ã‚’åEé€šåŒ–
  - Match/Replay ã® stage route ã§ resize è¿½å¾E+ æ‰‹å‹•ãƒˆã‚°ãƒ«å„ªå…ˆï¼Eanual overrideE‰ã‚’å®Ÿè£E
  - mobile replay-stage ã§ transport éè¡¨ç¤ºãƒEƒ•ã‚©ãƒ«ãƒE+ Show controls å¾©å¸°ã‚EE2E ã§æ¤œè¨¼
- âœEWO005-C follow-up: 375pxå¹E§ Commit å°ç·šãEå¯è¦–æ€§ã‚’E2Eå›ºå®E
  - battle-stage focus æ‰‹æœ­ãƒ‰ãƒƒã‚¯ã® Commit ãƒœã‚¿ãƒ³ãEviewport å†E«åã¾ã‚‹ã“ã¨ã‚’æ¤œè¨¼
  - æ¨ªæ–¹å‘ã‚ªãƒ¼ãƒãEãƒ•ãƒ­ãƒ¼EEscrollWidth - clientWidth`E‰ãŒç™ºç”Ÿã—ãªãE“ã¨ã‚’æ¤œè¨¼
- âœEWO005-D follow-up: replay-stage ã®å¤±æ•—æ™‚ãƒªã‚«ãƒãƒªå°ç·šã‚’E2Eå›ºå®E
  - game index / RPC å¤±æ•—æ™‚ã§ã‚Ereplay-stage ã® `Load replay` å°ç·šãŒæ®‹ã‚‹ã“ã¨ã‚’æ¤œè¨¼
  - `Retry load` ã¨ `Clear share params` ãŒè¡¨ç¤ºã•ã‚Œã€åEè©¦è¡Œå¯èƒ½ã§ã‚ã‚‹ã“ã¨ã‚’æ¤œè¨¼
- âœEWO005-E follow-up: Nyano AI ã®æ€è€E¾E©Ÿãƒ†ãƒ³ãƒã‚’èª¿æ•´
  - `computeAiAutoMoveDelayMs` ã®åŸºæº–å€¤/é›£æ˜“åº¦ä¿‚æ•°/ã‚¸ãƒE‚¿ãƒ¼ã‚’è¦‹ç›´ã—ã€å³æ‰“ã¡æ„Ÿã‚’æŠ‘åˆ¶
  - `turn_timing.test.ts` ã®å¢E•Œãƒ»ä¸Šé™æœŸå¾E€¤ã‚’æ›´æ–°ã—ã€æ±ºå®šè«–ã‚’ç¶­æŒE
- âœEWO005-F follow-up: Nyano cut-in ã‚Ereduced-motion / low-vfx ã§è»½é‡åŒ–
  - `NyanoReaction` ã® cut-in timing ã‚E`reduced-motion` ã¨ `data-vfx` ã§æ®µéšåˆ¶å¾¡
  - `vfx=off/low` æ™‚ã« burst æ¼”åEã‚’æŠ‘åˆ¶ã—ã€è¡¨ç¤ºæ™‚é–“ã‚’çŸ­ç¸®
  - `NyanoReaction.timing.test.ts` ã‚’è¿½åŠ ã—ã€æŒ™å‹•ã‚’ãƒ¦ãƒ‹ãƒƒãƒˆæ¤œè¨¼
- âœEWO005-G follow-up: Game Index å¤±æ•—æ™‚ã® guest battle ãƒ•ã‚©ãƒ¼ãƒ«ãƒãƒƒã‚¯ã‚’è¿½åŠ 
  - Game Index èª­è¾¼å¤±æ•—æ™‚ã« guest mode ã§ç·Šæ€¥ãƒEƒƒã‚­ã¸è‡ªå‹•ãƒ•ã‚©ãƒ¼ãƒ«ãƒãƒƒã‚¯
  - stage battle ãŒç¶™ç¶šå¯èƒ½Eˆã‚«ãƒ¼ãƒ‰ãƒ­ãƒ¼ãƒ‰å¤±æ•—ã§è©°ã¾ã‚‰ãªãE¼‰ã“ã¨ã‚EE2E ã§æ¤œè¨¼
- âœECommit0110: /events ã« Local Season PointsEˆãƒ©ãƒ³ã‚­ãƒ³ã‚°/å ±é…¬å°ç·šï¼‰ã‚’è¿½åŠ 
  - `season_progress.ts` ã‚’è¿½åŠ EEointsç®—åEãƒ»tieråˆ¤å®šãEeventåˆ¥ãƒ©ãƒ³ã‚­ãƒ³ã‚°ã‚Epure function åŒ–ï¼E
  - Events ã« `Local season points (provisional)` ãƒ‘ãƒãƒ«EEier/æ¬¡Tierã¾ã§/é€²æ—ãƒãƒ¼E‰ã‚’è¿½åŠ 
  - `Season points board` ã¨ markdown å‡ºåŠ›ï¼Erchive + progressE‰ã‚’è¿½åŠ 
  - `season_progress.test.ts` ã‚’è¿½åŠ EEoints/tier/tie-break/markdownEE
- âœECommit0111: /events ã® season points ã‚EpointsDelta æ®µéšé€£æºã¸æ‹¡å¼µ
  - Replay URL ã® `pda`EEointsDeltaAE‰ã‚’ Event attempt ã«ä¿å­˜å¯èƒ½åŒE
  - `season_archive.ts` ã« pointsDelta åˆè¨Eã‚«ãƒãƒ¬ãƒE‚¸é›E¨ˆã‚’è¿½åŠ 
  - `season_progress.ts` ã§ã€Œeventå†EEå…¨attemptã« pointsDelta ãŒã‚ã‚‹å ´åˆãEã¿ã€pointsDeltaæ¡ç”¨Eˆæœªå…E¶³ã¯ provisional ç¶­æŒE¼E
  - Events UI ã¨ markdown ã« source mixEEointsDelta/provisionalE‰è¡¨ç¤ºã‚’è¿½åŠ 
- âœECommit0112: /events ã« settled event JSON å–ã‚Šè¾¼ã¿ã‚’è¿½åŠ Eˆãƒ­ãƒ¼ã‚«ãƒ« pointsDelta åæ˜ EE
  - `settled_points_import.ts` ã‚’è¿½åŠ EEchemaå¯¾å¿œãEsettled eventæ¤œè¨¼ãƒ»winner/tilesæ•´åˆãƒã‚§ãƒE‚¯EE
  - Events ã« `Settled points import (local)` UI ã‚’è¿½åŠ Eˆè²¼ã‚Šä»˜ã‘â†’é©ç”¨â†’é›†è¨ˆçµæœè¡¨ç¤ºEE
  - matchId ä¸€è‡´ã‹ã¤çµæœæ•´åˆãE local attempt ã« `pointsDeltaA` / `pointsDeltaSource=settled_attested` ã‚’åæ˜ 
- âœECommit0113: /events ã® settled import ã‚’ã€Œå–å¾—èEå‹•åŒ– + ç½²åæ¤œè¨¼ãƒ¢ãƒ¼ãƒ‰ã€ã«æ‹¡å¼µ
  - `parseVerifiedLadderRecordsImportJson` ã‚’è¿½åŠ EE{domain, records}` ã‚E`verifyLadderMatchRecordV1` ã§æ¤œè¨¼EE
  - import UI ã« mode åˆE›¿EEsettled events` / `verified records`E‰ã‚’è¿½åŠ 
  - `/game/settled_events.json` è‡ªå‹•èª­è¾¼ãƒœã‚¿ãƒ³ã‚’è¿½åŠ 
  - verified import ã®å¤±æ•—ç†ç”±EEattestation_invalid`E‰ã‚’ issue ã«é›E´E
## ğŸš§ Doing (now)

- ğŸ”§ Phase 4 ã®é‹ç”¨é¢Eˆãƒ©ãƒ³ã‚­ãƒ³ã‚° / å ±é…¬å°ç·šï¼‰ã‚’ pointsDelta é€£æºã¸æ®µéšæ‹¡å¼µã™ã‚‹Eˆæ‰‹å‹•å–ã‚Šè¾¼ã¿/æ¤œè¨¼UIã¾ã§å®ŒäºE€‚æ¬¡ã¯ãƒãƒƒã‚¯ã‚¨ãƒ³ãƒ‰çµŒç”±ã®è‡ªå‹•ä¾›çµ¦ã¨å®šæœŸåŒæœŸEE
- ğŸ”§ WO005EEtage UI/UXåŸºç›¤EE `/battle-stage` `/replay-stage` ã®ä½é€Eå¤±æ•—æ™‚ä½“é¨“ã¨å°ç·šæ¤œè¨¼ã‚’ç¶™ç¶šã™ã‚E

## ğŸ§© Next (high priority)


### A. ãƒ«ãƒ¼ãƒ«ãƒ»ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã®å®‰å®šåŒ–
- [x] å…¬å¼æˆ¦å‘ã‘EšSolidityå´ã®Transcriptæ¤œè¨¼EE1 ABI-encode hashEE
- [x] RulesetRegistryEEermissionlessE‰æœ€å°å®Ÿè£E¼šrulesetId -> config hash / metadata ã‚’ç™»éŒ²ã§ãã‚‹
- [x] ã€ŒWindEˆåEæ”»/å¾Œæ”»é¸æŠï¼‰ã€ãEå…¬å¹³ãªè¡¨ç¾EEommit-reveal / seed / ä¸¡è€Eˆæ„ãªã©EE

### B. ã‚²ãƒ¼ãƒ ã®â€œé¢ç™½ã•â€ã‚’ç©ã¿å¢—ã™EˆãŸã ã—æ±ºå®šè«–ã§EE
- [x] ãƒ¡ã‚¿EEayer4E‰ãEå°ã•ãªå¯å¤‰ï¼ˆä¾‹ï¼šcorner boost / center locked / chain capE‰ã‚’1ã¤è¿½åŠ 
  - `meta.chainCapPerTurn` ã‚ETSå‚çEã‚¨ãƒ³ã‚¸ãƒ³ã«è¿½åŠ EEã‚¿ãƒ¼ãƒ³ã®æˆåŠŸãƒ•ãƒªãƒEEæ•°ã‚’ä¸Šé™åŒ–å¯èƒ½EE
  - v1ã§ã¯ engine-onlyEEulesetId canonicalization ã«ã¯æœªåæ˜ EE

### C. è‡ªèµ°ã™ã‚‹ã‚³ãƒŸãƒ¥ãƒ‹ãƒ†ã‚£è¨­è¨ˆï¼ˆé‹å–¶ãŒæ¶ˆãˆã¦ã‚‚å›ã‚‹ï¼E
- [x] ã€Œã‚·ãƒ¼ã‚ºãƒ³ã®è­°ä¼šã€ï¼šruleset proposal / vote / adopt ã®æœ€å°ãEãƒ­ãƒˆã‚³ãƒ«
- [x] ãƒ©ãƒ€ãƒ¼Eˆãƒ©ãƒ³ã‚­ãƒ³ã‚°E‰ã‚’â€œè¨±å¯ä¸è¦â€ã§ç¬¬ä¸‰è€EŒé‹ç”¨ã§ãã‚‹ãƒ•ã‚©ãƒ¼ãƒãƒƒãƒE
  - transcript + settled event + EIP-712 attestation ã§å†è¨ˆç®—å¯èƒ½
  - indexer éä¾å­˜ãEå›ºå®Etie-break ã‚’å®Ÿè£E¼EbuildLadderStandingsV1`EE

---

## ğŸ”¬ Research / Optional

- [ ] ERC-6551EEyanoãƒˆãEã‚¯ãƒ³å¢E•Œã®ã‚¢ã‚«ã‚¦ãƒ³ãƒˆï¼‰ã‚’ä½¿ã£ãŸã€Œãƒãƒ¼ãƒ /ã‚®ãƒ«ãƒ‰ã€E
- [ ] NFTã‚¹ãƒEEã‚­ãƒ³ã‚°ã§ Season Pass / ãƒ«ãƒ¼ãƒ«æŠ•ç¥¨æ¨© / å‚åŠ æ EEybilå¯¾ç­–ï¼‰ã‚’æä¾›ã™ã‚‹è¨­è¨E
- [ ] äº’æ›æ€§Ešéå»ã®Oasysã‚¨ã‚³ã‚·ã‚¹ãƒEƒ ã‹ã‚‰ã®è³E”£ç§»è¡Œæ–¹é‡ï¼ˆå¿E¦ãªã‚‰ï¼E
- Sprint UX: Home Settings now keeps local UX snapshot history (save on copy, view recent 5, clear history).
- âœEWO005-H follow-up: Pixi card-art texture failure guidance + manual retry
  - `BattleStageEngine` ã« card-art ã®èª­ã¿è¾¼ã¿çŠ¶æ…Eå¤±æ•—çŠ¶æ…‹ã‚’è¡¨ç¤ºã—ã€`Retry card art` ã‚’è¿½åŠ 
  - `TextureResolver` ã« failed/pending çŠ¶æ…‹ç®¡çE¨ status event ã‚’è¿½åŠ ã—ã¦ã€å¤±æ•—æ™‚ã®ç„¡é™åEè©¦è¡Œã‚’é˜²æ­¢
  - `textureResolverPreload.test.ts` ã« failed->retry success ã®æ¤œè¨¼ã‚’è¿½åŠ 
- âœEWO005-I follow-up: Pixi/WebGL init failure auto fallback
  - `ui=engine` ã§ Pixi åˆæœŸåŒ–å¤±æ•—æ™‚ã« `BoardViewMint` ã¸è‡ªå‹•ãƒ•ã‚©ãƒ¼ãƒ«ãƒãƒƒã‚¯ã—ã¦é€²è¡Œç¶™ç¶E
  - `/battle-stage` `/replay-stage` ã« `Retry Pixi` å°ç·šã‚’è¿½åŠ 
  - stage-focus E2E ã« WebGL unavailable ã‚±ãƒ¼ã‚¹ã‚’è¿½åŠ ã—ã¦å›å¸°é˜²æ­¢
- ? WO005-J follow-up: replay-stage WebGL fallback ‚Ì E2E‰ñ‹A–h~‚ğ’Ç‰Á
  - `/replay-stage` ‚Ì WebGL unavailable ‚É Mint fallback + retry“±ü‚ğ stage-focus E2E‚ÅŒÅ’è
  - 375px commit‰Â‹«ƒeƒXƒg‚ğ fallback ƒ‚[ƒh‚à‹–—e‚·‚é”»’è‚Ö‹­‰»

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
- [x] Follow-up: show resolved Classic Open metadata in Overlay gNow Playingh panel for operator/OBS visibility.
- [x] Follow-up: add additive Classic metadata (`classic.open` / `classic.swap`) to `/stream` `state_json v1` and ai_prompt context for nyano-warudo/operator parity.
- [x] Follow-up: show deterministic Classic Swap mapping in Stream live status and Overlay gNow Playingh.
- [x] Follow-up: update `state_json v1` sample/spec docs to include additive optional `classic` metadata.
- [x] Follow-up: sync `triad_league_snapshot_request_sample_v1.json` embedded `content` with latest `state_json` sample.
- [x] Follow-up: refactor duplicated Classic Open/Swap resolution into shared `apps/web/src/lib/classic_ruleset_visibility.ts` with unit tests.
- [x] Follow-up: harden Classic metadata resolver to return null (not throw) on malformed `protocolV1.header`.
- [x] Follow-up: sync `triad_league_ai_prompt_sample_v1.txt` and Bridge spec with optional `classic_open` / `classic_swap` ai_prompt lines.
- [x] 2026-02-14 WO006: NyanoReaction slot‚ğ `Match/Replay` ‚É“±“ü‚µAƒRƒƒ“ƒg•\¦‚ÌƒŒƒCƒAƒEƒgƒVƒtƒg‚ğ—}~i2sƒNƒ‰ƒ“ƒv + unit test•t‚«jB
- [x] 2026-02-14 WO007: Mint”Õ–Ê/ƒXƒe[ƒW‚Ì¿Š´‚ğ–‚«‚İiboard sheen, stage rim/atmo, warning-mode‹Šo‹­’², vfx/reduced-motion•ªŠò, mobileÅ“K‰»jB
- [x] 2026-02-14 WO008: Match Setup ‚ğ MatchSetupPanelMint ‚Ö•ª—£‚µAPrimary/Secondary/Advanced \¬E1sƒTƒ}ƒŠESetup URLƒRƒs[“±ü‚ğ’Ç‰ÁBURLƒpƒ‰ƒ[ƒ^ŒİŠ·‚ğˆÛB
- [x] 2026-02-14 WO009: Rulesets‰æ–Ê‚Éw‚¨‚·‚·‚ßxw—v–ñxw‚±‚Ìƒ‹[ƒ‹‚Å‘Îíx“±ü‚ğ’Ç‰Á‚µA/match ‚Ö‚Ì‘JˆÚ‚ğ–¾Šm‰»B
- [x] 2026-02-15 WO010: `apps/web/e2e/ux-guardrails.spec.ts` ‚ğˆÀ’è‰»itutorial‰ñ”ğEselector‹­‰»Equick commit fallbackjB`pnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts` ‚Å 2 passed ‚ğŠm”FB
- [x] 2026-02-15 WO010‰^—p: `apps/web/package.json` ‚É `e2e:ux` ‚ğ’Ç‰Á‚µA`.github/workflows/ci.yml` ‚É `E2E UX guardrails` ƒXƒeƒbƒv‚ğ’Ç‰Áifull E2E ‘O‚ÉÅ¬UXƒK[ƒh‚ğæsŒŸØjB
- [x] 2026-02-15 WO007’Ç•â: `apps/web/e2e/mint-stage-visual-guardrails.spec.ts` ‚ğ’Ç‰Á‚µAmanualŠm”F€–Úivfx=off / reduced-motion / 390pxj‚ğE2E‰»B`pnpm.cmd -C apps/web e2e:ux` ‚Å 5 passed ‚ğŠm”FB
- [x] 2026-02-15 WO009’Ç•â: `apps/web/e2e/rulesets-ux-guardrails.spec.ts` ‚ğ’Ç‰Á‚µARulesets“±üi‚¨‚·‚·‚ß•\¦ + ‚±‚Ìƒ‹[ƒ‹‚Å‘Îí‘JˆÚ + rk•Ûj‚ğE2E‰»B`pnpm.cmd -C apps/web e2e:ux` ‚Å 7 passed ‚ğŠm”FB
- [x] 2026-02-15 WO008’Ç•â: `apps/web/e2e/match-setup-ux-guardrails.spec.ts` ‚ğ’Ç‰Á‚µAMatch Setup“±üi1sƒTƒ}ƒŠ“¯Šú + Advanced©“®“WŠJ + ccap URL“¯Šúj‚ğE2E‰»B`pnpm.cmd -C apps/web e2e:ux` ‚Å 9 passed ‚ğŠm”FB
- [x] 2026-02-15 WO011: Mint gamefeel”wŒi‚ğÀ‘•ipastel gradient + paw pattern + sparkle/bokehj‚µA`prefers-reduced-motion` / `data-vfx` •ªŠò‚Å‰‰o‹­“x‚ğ§ŒäB`DuelStageMint` ‚Í `mint-stage--gamefeel` ‚É“ˆêB
- [x] 2026-02-15 WO012: Mint Top HUDi¶ƒƒS/’†‰›A-BƒXƒRƒA/‰ETURNj‚ğ `ui=mint` Œü‚¯‚É’Ç‰ÁB`density=minimal` ‚Í Top HUD—DæA`standard/full` ‚ÍŠù‘¶ `BattleHudMint` •¹—p‚É®—B
- [x] 2026-02-15 WO013: Mint”Õ–Ê‚Ì¶‰E‚ÉƒvƒŒƒCƒ„[ƒpƒlƒ‹iAvatar/Label/Remainingj‚ğ’Ç‰ÁBDesktop‚Í `panel|board|panel`Amobile‚Íƒpƒlƒ‹”ñ•\¦‚Å”Õ–Ê—DæB
- [x] 2026-02-15 WO014: MintèD‚ğƒKƒ‰ƒX’²ƒgƒŒƒC + Œy‚¢d‚È‚è‚ÖXV‚µAActionPrompt‚ğ“ñ’iƒsƒ‹‰»B`mint-prompt-slot` ‚Å•\¦—h‚ê‚ğ—}§B
- [x] 2026-02-15 WO015: NyanoReaction slot‚ğ fixed-height + absolute overlay ‰»‚µA`kind=idle` ‚à placeholder ‚ğˆÛBLayoutShift API ‚ğ `ux-guardrails` ‚É’Ç‰Á‚µ‚ÄCLS‰ñ‹A‚ğŒy—ÊŠÄ‹B
- [x] 2026-02-15 WO016: `mint-pressable` ‚ğ“±“ü‚µAboard cell / hand card / result button ‚Ì‰Ÿ‰º•¶–@ihover/active/focus-visiblej‚ğ“ˆêBreduced-motion / data-vfx —}§•ªŠò‚ğ’Ç‰ÁB
- [x] 2026-02-15 WO016/WO010’Ç•â: `ux-guardrails` ‚ÉƒL[ƒ{[ƒhEnter‘I‘ğ‚Æ reduced-motion ‚Ì pressable transition —}§ƒeƒXƒg‚ğ’Ç‰Ái4 passedjB
- [x] 2026-02-15 Match UXC³: NyanoƒRƒƒ“ƒg˜A“®‚Ì”Õ–ÊƒYƒŒ—vˆö‚¾‚Á‚½ stage impact ‚Ì transformƒAƒjƒ‚ğ”ñˆÊ’u•Ï‰»Œ^‚Ö’uŠ·B‚ ‚í‚¹‚ÄuƒJ[ƒh‚ğ‘I‚ñ‚Å‚­‚¾‚³‚¢v‚Ì•¶šƒTƒCƒY‚ğk¬B
- [x] 2026-02-15 Match UX’Ç•â: ó‹µÀ‹µƒeƒLƒXƒg‹Nˆö‚Ì”Õ–ÊƒYƒŒ‚ğ—}§iHUD/AI notice‚ÌŒÅ’èƒXƒƒbƒg‰»jB‡‚í‚¹‚Ä”Õ–Ê‚ğŠg‘å‚µA¶‰EƒvƒŒƒCƒ„[ƒpƒlƒ‹‚ğk¬B
- [x] 2026-02-15 Match UXC³: ƒoƒgƒ‹‰æ–ÊuÚ×î•ñvƒhƒƒ[‚Ì ~ ‚Å•Â‚¶‚È‚¢–â‘è‚ğC³iclose“`”d§Œä + ŠJ‚¢‚Ä‚¢‚éŠÔ‚ÍƒgƒOƒ‹”ñ•\¦jB
- [x] 2026-02-15 Match UXC³: ó‹µ•\¦ƒeƒLƒXƒgiBattle summaryj‚ğŒÅ’èƒXƒƒbƒg‰»‚µA•\¦/”ñ•\¦‚Å”Õ–ÊˆÊ’u‚ª‚¸‚ê‚È‚¢‚æ‚¤‰ü‘PB
- [x] 2026-02-15 Battle Stage focus UX‰ü‘P: èDƒhƒbƒN‚ğ‰º•”ŒÅ’è‰»‚µAd•¡ƒc[ƒ‹ƒo[‘€ì‚ğ®—B”Õ–ÊƒTƒCƒYZo‚ğŠg‘åŠñ‚è‚É’²®‚µ‚ÄA`ui=engine&focus=1` ‚ÅƒXƒNƒ[ƒ‹‘O’ñ‚É‚È‚è‚É‚­‚¢“±ü‚Ö‰ü‘PB`stage-focus` / `ux-guardrails` E2E‚Å‰ñ‹AŠm”FÏ‚İB
- [x] 2026-02-15 Battle Stage UX’Ç•â: stage focus ‚Ìuó‹µ•\¦ + NyanoƒRƒƒ“ƒgv‚ğ”Õ–Êã•”‚ÌŒÅ’èƒXƒƒbƒg‚ÖˆÚİB‰º‘¤ièD“±ü‹ß–Tj‚Ì•\¦‚ğ~‚ßA‹ü“±ü‚ÆƒŒƒCƒAƒEƒgˆÀ’è«‚ğ‰ü‘PB
- [x] 2026-02-15 Battle Stage UX’Ç•â: stage-focus E2E‚ÉuƒRƒƒ“ƒg/ó‹µ•\¦‚ª”Õ–ÊEèDƒhƒbƒN‚æ‚èã‚É‚ ‚évƒK[ƒhƒŒ[ƒ‹‚ğ’Ç‰ÁB
- [x] 2026-02-15 Battle Stage UX’Ç•â: èDƒhƒbƒN‚ª”Õ–Ê‚É”í‚é–â‘è‚ğC³ifixedŠî€‚Ì¥³ + stageƒhƒbƒNcˆ³k + boardè—L•â³jB`stage-focus` / `ux-guardrails` E2E‚Å‰ñ‹AŠm”FÏ‚İB
- [x] 2026-02-15 Match/Stage UX’Ç•â: `/match?ui=mint` ‚Ì NyanoƒRƒƒ“ƒg+ó‹µ•\¦‚ğ”Õ–Êã•”ŒÅ’èƒXƒ^ƒbƒN‚Ö“ˆê‚µA•\¦ON/OFF‚Å‚ÌˆÊ’u‚¸‚ê‚ğ—}§BPrompt•¶š‚ğk¬BDetails `~` ‚Ì•Â‚¶‚é“±ü‚ğˆÀ’è‰»iÄƒI[ƒvƒ“—}~ŠÜ‚ŞjBstage focus ‚Ì Pixi”Õ–Ê/èDƒhƒbƒN‚ğÄƒoƒ‰ƒ“ƒX‚µAèD‰Â‹«‚ğ‰ñ•œ‚µ‚Â‚Â board-dock ”ñd‚È‚è‚ğˆÛistage-focus 15 passed / ux-guardrails 7 passedjB
- [x] 2026-02-15 WO017: `MintGameShell` / `MintAppChrome` ‚ğ’Ç‰Á‚µAMintƒe[ƒ}‚Ì App chrome ‚ğƒQ[ƒ€UI‰»B`focusRoute`i`/battle-stage` `/replay-stage` / `focus=1`j‚ÍŠù‘¶‹““®‚ğˆÛB
- [x] 2026-02-15 WO018: Home ‚ğ MintƒƒCƒ“ƒƒjƒ…[\¬‚ÖXViArena/Decks/Replay/Stream ‚Ì4‘åƒ{ƒ^ƒ“A3ƒXƒeƒbƒv“±üA‰º•”ƒCƒ“ƒtƒHƒo[ATools/Settings Ü‚è‚½‚½‚İjB
- [x] 2026-02-15 WO019: Arena ‚ğƒ‚[ƒh‘I‘ğUI‚ÖXVi¶ƒTƒCƒhƒiƒrA’†‰›ƒoƒi[A‰EQuick PlayA‰º•”“ïˆÕ“xƒJ[ƒh + `difficulty` ƒNƒGƒŠ•ÛjB
- [x] 2026-02-15 WO020: Decks ‚ğ Deck Builder 3ƒJƒ‰ƒ€‚ÖXViDeck Stats/FilterACard BrowserA’†‰›ƒtƒH[ƒ€A‰EDeck Summary + Save DeckjB
- [x] 2026-02-15 WO021: `/start` ƒy[ƒW‚ğ’Ç‰Á‚µAOnboarding 3ƒJ[ƒh + DONEi’» pill ‚ğÀ‘•BHome ‚©‚ç‘JˆÚ“±ü‚ğ’Ç‰ÁB
- [x] 2026-02-15 WO022: Mint UIƒvƒŠƒ~ƒeƒBƒu‚ğ’Ç‰Ái`GlassPanel` `MintPressable` `MintIcon` `MintBigButton` `MintTabNav` `MintTypography`j‚µAå—v‰æ–Ê‚É“K—pB
- [x] 2026-02-15 WO023: Gemini‰æ‘œ¶¬ƒpƒCƒvƒ‰ƒCƒ“‚ğŠm”FE®”õi`scripts/gemini_image_gen.mjs` / `scripts/asset_prompts/nytl_ui_assets.v1.json` / `docs/01_design/NYTL_ASSET_GEN_GEMINI_NANO_BANANA_PRO_v1_ja.md` / `apps/web/public/assets/gen/.gitkeep`jB
- [x] 2026-02-15 WO024: e2e/visual guardrails ‚ğ’Ç‰Ái`e2e/mint-app-screens-guardrails.spec.ts`j‚µAHome/DecksŒnŠù‘¶e2eŠú‘Ò’l‚ğMint UI‚É’Ç]XVB
- [x] 2026-02-15 Follow-up: `MintPressable` ‚Ì–¢g—p•Ï”lintŒx‚ğ‰ğÁ‚µA`MatchSetupPanelMint` ‚Ì helper ‚ğ `MatchSetupPanelMint.helpers.ts` ‚Ö•ª—£‚µ‚Ä Fast Refresh Œx‚ğ‰ğÁB
- [x] 2026-02-15 Follow-up: `src/lib/theme.ts` ‚Ì‰ñ‹A–h~‚Æ‚µ‚Ä `src/lib/__tests__/theme.test.ts` ‚ğ’Ç‰Áitheme‰ğŒˆ—Dæ‡ˆÊ / URL query+hash ŒİŠ·‚ğŒÅ’èjB
- [x] 2026-02-15 Follow-up: `e2e/mint-app-screens-guardrails.spec.ts` ‚ğŠg’£‚µAMint App Chrome ‚Ì `theme` ƒNƒGƒŠ•ÛiTab‘JˆÚj‚Æ `focusRoute`i`/match?focus=1` `/battle-stage`j‚Å‚Ì chrome ”ñ•\¦ŒİŠ·‚ğ‰ñ‹AƒeƒXƒg‰»B
- [x] 2026-02-15 Follow-up: Events/Replay/Stream ‚ğ Mint“ñŸ‰æ–Êƒg[ƒ“‚Ö‘µ‚¦AReplay ‚Ì 390px ‰¡ƒXƒNƒ[ƒ‹‰ñ‹A‚ğC³i’·‚¢ `rulesetId`/`matchId` Ü•Ô‚µ + debug pre ‚Ì•S‘©jB`mint-app-screens-guardrails` ‚Å 390px “’B«‚ğŒÅ’è‰»B
- [x] 2026-02-15 Follow-up: Events/Replay/Stream ‚É‹¤’Ê Mint ƒNƒCƒbƒNƒiƒr“±ü‚ğ’Ç‰Á‚µA`theme` “`”d‚ğ‹­‰»B‚ ‚í‚¹‚Ä Match ”Õ–Ê‚É `mint-match-board-shell` / `mint-match-quick-commit` ‚ÌŒ©‚½–Ú‹­‰»ƒNƒ‰ƒX‚ğ’Ç‰Á‚µAsecondary screen ‚Æ board ‚ÌƒQ[ƒ€UIƒg[ƒ“‚ğ“ˆêB
- [x] 2026-02-15 Follow-up: Events/Replay/Stream ‚Ìæ“ª‚É—v–ñƒXƒe[ƒ^ƒX‘Ñioverview pillsj‚ğ’Ç‰Á‚µAd—vî•ñ‚Ì—Dæ‡ˆÊ‚ğ‰Â‹‰»B‚ ‚í‚¹‚Ä quicknav ‚ÌƒAƒCƒRƒ“‹”F«EƒeƒLƒXƒg‰Â“Ç«E—]”’‚ğ‰ü‘P‚µ‚ÄuŒ©‚â‚·‚­‚í‚©‚è‚â‚·‚¢v“±ü‚Ö’²®B
- [x] 2026-02-17 Arena follow-up: `MintPageGuide` / difficulty hint ‚Ì–¢À‘•CSS‚ğ `mint-theme.css` ‚É’Ç‰Á‚µA`Arena.tsx` ‚Ì UTF-8 BOM ‚ğœ‹B‡‚í‚¹‚Ä“ïˆÕ“xƒ{ƒ^ƒ“‚É `type="button"` ‚ğ’Ç‰ÁB
- [x] 2026-02-17 Mint guide rollout: `MINT_PAGE_GUIDES` ‚Ì `events/replay/stream` ‚ğŠeƒy[ƒW‚ÉÚ‘±‚µAMintƒe[ƒ}‚Ì‹¤’ÊƒKƒCƒh“±ü‚ğ“ˆêiReplay‚Í `!isStageFocus` ğŒ‚ğˆÛjB
- [x] 2026-02-17 Mint guide rollout follow-up: `e2e/mint-app-screens-guardrails.spec.ts` ‚É `.mint-page-guide` ‰Â‹ƒAƒT[ƒVƒ‡ƒ“‚ğ’Ç‰Á‚µAArena/Events/Replay/Stream ‚ÌƒKƒCƒh“±ü‰ñ‹A‚ğ–h~B
- [x] 2026-02-17 CI follow-up: `/battle-stage` ‚Ì board/dock d‚È‚è‚ğ desktop ğŒ‚Å‰ğÁi`.mint-focus-hand-dock--stage` •â³jB‚ ‚í‚¹‚Ä `ux-guardrails` ‚Ì quick commit ƒNƒŠƒbƒN‚ğƒtƒH[ƒ‹ƒoƒbƒN•t‚«‚É‚µ‚Ä flaky ‚ğ’áŒ¸B
- [x] 2026-02-17 ui=mint Pixi parity follow-up: /match ‚Å hand dock + HUD/commentary tone ‚ğ PixiŠñ‚¹‚É“ˆê‚µAmintê—pTop HUD/side panel‚ğ—}~B‚ ‚í‚¹‚Ä ux-guardrails ‚ğ hand dock “±ü‘Î‰‚ÖXV‚µAreduced-motion ‚Ì dock card transition —}§‚ğ’Ç‰Áipnpm.cmd -C apps/web e2e -- e2e/ux-guardrails.spec.ts 7 passed / pnpm.cmd -C apps/web e2e -- e2e/stage-focus.spec.ts 15 passedjB
- [x] 2026-02-17 e2e:ux follow-up: mint-stage-visual-guardrails ‚Ì commit control ”»’è‚ğ hand dock/quick commit ŒİŠ·‚ÉXV‚µAui=mint V“±ü‚Å‚ÌCI¸”s‚ğ‰ğÁipnpm.cmd -C apps/web e2e:ux 14 passedjB
- [x] 2026-02-17 copy cleanup follow-up: Home/Start/Stream ‚Ì“à•”Œü‚¯•¶Œ¾iƒtƒF[ƒY/ƒ}ƒCƒ‹ƒXƒg[ƒ“/“±ü/b’è/DONE-TODOj‚ğƒ†[ƒU[Œü‚¯•\Œ»‚Ö’uŠ·‚µAŒöŠJUI‚©‚çŠJ”­i’»à–¾‚ªŒ©‚¦‚È‚¢‚æ‚¤’²®B
- [x] 2026-02-17 i18n UX follow-up: Replay’†S‚É Arena/Decks/Rulesets/Events ‚Ì‰pŒêUI•¶Œ¾‚ğ“ú–{Œêƒx[ƒX‚Ö’²®iƒeƒXƒgˆË‘¶‚Ì‰pŒêƒ‰ƒxƒ‹‚ÍŒİŠ·ˆÛjB`replay_timeline`/`replay_highlights` •¶Œ¾‚à“ú–{Œê‰»‚µA`e2e/replay-ruleset-fallback-guardrails.spec.ts` ‚ğ“ú‰pŒİŠ·ƒAƒT[ƒVƒ‡ƒ“‚ÖXVB`pnpm -C apps/web test` / `typecheck` / `build` / `pnpm.cmd -C apps/web e2e:ux` ‚Å‰ñ‹AŠm”FB

---

## Next (Planned)

- [ ] 2026-02-17 WO025: Classic Rules ƒvƒŠƒZƒbƒgŠg[ireverse / aceKiller / typeAscend / typeDescend / plus / samej+ UI ‚©‚ç‘I‘ğ‰Â”\‚ÉB
- [ ] 2026-02-17 WO026: Classic Rules ƒJƒXƒ^ƒ€ƒrƒ‹ƒ_[i•¡”‘g‚İ‡‚í‚¹j+ Share/Replay ŒİŠ·iURL param `cr` bitmaskjB
- [ ] 2026-02-17 WO027: ƒ‹[ƒ‹İ’è UI ‚ğ gG‚ê‚Î•ª‚©‚éh Nintendo •i¿‚ÖiMintRulesetPickerjB


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
- [ ] Add dedicated Replay UX test for rulesetId mismatch warning pill (rk/cr fallback mismatch case).
- [ ] Consider splitting MintRulesetPicker visual primitives into mint theme CSS tokens if further polish is required.


## Update 2026-02-17 (follow-up)

- [x] Added replay fallback guardrail E2E:
  - apps/web/e2e/replay-ruleset-fallback-guardrails.spec.ts
  - Validates rk/cr fallback + mismatch warning visibility.
- [x] Integrated replay fallback guardrail into pnpm -C apps/web e2e:ux.
- [x] Hardened UX E2E commit helper for dock/toolbar/legacy commit paths to reduce flaky failures.
- [x] 2026-02-17 Stream copy follow-up: Stream/HUD/Warudo/Share ‚Ì•â••¶Œ¾‚Æƒg[ƒXƒg‚ğ“ú–{Œêƒx[ƒX‚É“ˆê‚µA`_design/Home` ‚ÌuŒ»İ‚ÌƒtƒF[ƒY/Ÿ‚Ìƒ}ƒCƒ‹ƒXƒg[ƒ“v‚ğƒ†[ƒU[Œü‚¯•¶Œ¾‚Ö’uŠ·B`pnpm -C apps/web test` / `typecheck` / `build` / `pnpm.cmd -C apps/web e2e:ux` ‚Å‰ñ‹AŠm”FB
- [x] 2026-02-17 Overlay copy follow-up: Overlay‚Ìå—v•\¦iã•”ƒXƒe[ƒ^ƒX/“Š•[/ƒGƒ‰[/OBSƒeƒ“ƒvƒŒj‚ğ“ú–{Œêƒx[ƒX‚Ö’²®‚µA`Now Playing`/`Chat voting`/`No signal yet`/`remaining` “™‚ÌE2EˆË‘¶Œê‚Í•¹‹L‚ÅŒİŠ·ˆÛB`pnpm -C apps/web test` / `typecheck` / `build` / `pnpm.cmd -C apps/web e2e:ux` ‚ğ’Ê‰ßB
- [x] 2026-02-17 App chrome copy follow-up: ƒwƒbƒ_[Œ©o‚µ‚Æƒtƒbƒ^[ƒŠƒ“ƒN/ƒ^ƒOƒ‰ƒCƒ“‚ğ“ú–{Œêƒx[ƒX‚Ö’²®iURL\‘¢‚Í•s•ÏjB`pnpm -C apps/web test` / `typecheck` / `build` / `pnpm.cmd -C apps/web e2e:ux` ‚ğ’Ê‰ßB

- [x] 2026-02-17 i18n follow-up: Home/Playground ‚Ìå—v•\¦•¶Œ¾‚ğ“ú–{Œêƒx[ƒX‚Ö’²®‚µAE2EˆË‘¶ŒêiTools / Settings / Copy Snapshot / Reset Metrics / Nyano Labj‚Í•¹‹L‚ÅŒİŠ·ˆÛBpnpm -C apps/web test / typecheck / build ‚Í’Ê‰ßA’Ç‰ÁE2EŒÂ•ÊÀs‚Í spawn EPERM ‚Å–¢Š®—¹B

- [x] 2026-02-18 i18n follow-up: Events/Decks/Replay ‚Ìc‰pŒêUI‚ğ“ú–{Œêƒx[ƒX‚Ö’²®iE2EˆË‘¶Œê‚Ì Save Deck / Replay from transcript / Load replay / Show controls “™‚ÍŒİŠ·ˆÛjBpnpm -C apps/web test / typecheck / build ‚ğ’Ê‰ßB
- [x] 2026-02-18 i18n follow-up verify: pnpm.cmd -C apps/web e2e:ux 15 passedB

- [x] 2026-02-18 i18n/e2e follow-up: Match ‚Æ Decks ‚Ì•¶Œ¾‚ğ“ú–{Œêƒx[ƒX‚Ö’²®‚µ‚Â‚Â‰pŒêƒg[ƒNƒ“ŒİŠ·‚ğˆÛBpps/web/e2e/guest-game.spec.ts ‚ğŒ»sUI‚Ö’Ç]C³Bpnpm -C apps/web test / typecheck / build / pnpm.cmd -C apps/web e2e:ux / å—v3spec ‚ğ’Ê‰ßB
- [x] 2026-02-17 i18n follow-up: Home/Events/Match/Replay copy was adjusted to Japanese-first player-facing text; stage-focus compatibility labels were preserved (`Replay from transcript`, `Load replay`, `Error:`, `Retry load`, `Clear share params`). Verified with `pnpm -C apps/web test`, `pnpm.cmd -C apps/web typecheck`, `pnpm -C apps/web build`, and targeted Playwright (`stage-focus`, `ux-guardrails`, `mint-stage-visual-guardrails`).
- [x] 2026-02-18 Arena follow-up: difficulty card click in /arena now starts guest match immediately (no extra quick-play click). Added e2e guardrail in apps/web/e2e/quick-play.spec.ts. Verified with test/typecheck/build and targeted e2e.
- [x] 2026-02-18 copy cleanup follow-up: Overlay/Replay/Playground ? user-visible "debug" ???????????????Arena ????????????????????quick-play e2e + test/typecheck/build ???
- [x] 2026-02-18 onboarding copy follow-up: Home/Start ? "3??????" ??????2?????? + 3????????home E2E ? test/typecheck/build ???
