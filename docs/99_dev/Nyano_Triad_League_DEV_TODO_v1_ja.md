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
