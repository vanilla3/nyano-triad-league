# WO-046: Shareworthy UI polish（micro-delight + share actions）v1

目的:
- 「触っていて面白い」「見ていて気持ちいい」体験を 1段上げる
- 共有導線（URL/JSON/リプレイ）を “押したくなる” デザインに整え、シェアされる確率を上げる
- ただし、主役（カード/盤面）を邪魔しない。控えめに効かせる。

---

## 1) 対象

- Match 結果/共有まわり:
  - `apps/web/src/features/match/MatchShareActionsRow.tsx`
  - `apps/web/src/features/match/matchReplayShare.ts`
  - `apps/web/src/features/match/MatchResultOverlay.tsx`（存在する場合）
- Match の操作UI:
  - `apps/web/src/pages/Match.tsx`
  - `apps/web/src/components/BoardViewMint.tsx`
- App shell / navigation（必要なら）:
  - `apps/web/src/components/mint/MintGameShell.tsx`
  - `apps/web/src/components/mint/MintAppChrome.tsx`

---

## 2) 改善アイデア（採用は “合うものだけ”）

### 2-1. micro-delight（押下の気持ちよさ）
- `MintPressable` を “全ての主要ボタン” に徹底し、押下時の反応を統一
- 押した瞬間:
  - scale 0.98 + 影が少し強く + sheen が短く走る（0.12s 以内）
- 離した瞬間:
  - ease-out-back で少し戻り（オーバーシュート弱め）
- クリック成功時:
  - vfx high: 小さな sparkle burst（小さく、短く）
  - vfx low: 光るだけ（粒子なし）

### 2-2. 視線誘導（次にやることが分かる）
- Idle guide を “邪魔しない” 範囲で強化
  - 盤面: 置けるマスが薄く呼吸（pulse）する
  - 手札: 次に選ぶべきカードが 1 枚だけ少し浮く（重要: 全部光らせない）

### 2-3. シェア導線（見た目と文言）
- 共有ボタンを「同サイズ・同トーン」で並べる（情報密度を上げない）
- 文言は短く:
  - 「URLをコピー」「JSONをコピー」「リプレイを見る」「共有」
- 可能なら Web Share API を優先し、無ければコピー/ダウンロード
- “結果カード” を作る場合は、DOM→画像化よりも軽量な方法（SVGレンダリング等）を検討

### 2-4. 過剰演出の抑制（上品さ）
- 常時キラキラを増やさない。決定/勝利/反転の瞬間だけ。
- reduced motion は “即座に静か” へ寄せる（待たせない）

---

## 3) 実装ガイド

- 演出のトリガーは `VisualSettings`（vfxQuality）と `prefers-reduced-motion` で必ずゲート
- 既存:
  - `apps/web/src/lib/sfx.ts`（効果音）
  - `apps/web/src/lib/visual/visualSettings.ts`（VFX品質）
  - `apps/web/src/mint-theme/mint-theme.css`（モーション/質感トークン）
- 新規を増やしすぎない（依存追加は最小）

---

## 4) 受け入れ条件（Acceptance）

- 共有ボタンが視覚的に “押したくなる” 形になり、文言が短く自然
- 押下/選択/決定のフィードバックが統一され、Match の操作が気持ちいい
- vfx low / reduced motion でも破綻しない（演出が抑制される）
- 主役（盤面とカード）が見づらくならない（視線誘導が過剰でない）

---

## 5) 参考
- `docs/01_design/NYTL_GAME_UI_QUALITY_PRINCIPLES_SAKURAI_LENS_v1_ja.md`
- `docs/01_design/NYTL_UI_MOTION_SYSTEM_TAME_TSUME_v1_ja.md`

---

## Execution Status (2026-02-20)

- Status: `Completed`
- Completed in this step:
  - `MatchShareActionsRow` micro-polish: pressable hit target classes, clearer action labeling, and pre-finalize hint for share/replay unlock timing.
  - Matching unit test updated and verified.
  - Full frontend checks passed after integration: `pnpm.cmd lint:text` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test --` / `pnpm.cmd -C apps/web build`.
  - Follow-up: `MatchGuestPostGamePanel` share controls were aligned to the same mint micro-delight spec (`mint-share-actions` / `mint-share-action__btn`, `mint-pressable`, `mint-hit`, aria labels, and non-finalize hint), with `isRpg` passthrough from `MatchSideColumnPanels`.
  - Follow-up verification: `pnpm.cmd -C apps/web test -- MatchGuestPostGamePanel MatchSideColumnPanels MatchShareActionsRow`, then full suite (`lint:text`, `lint`, `typecheck`, `test --`, `build`) all passed.
  - Follow-up (consistency sweep): unified Match focus-toolbar replay action copy/a11y with share rows (`Open replay` + `aria-label` + `title`) in `apps/web/src/pages/Match.tsx`.
  - Follow-up verification: `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web test -- matchStageActionCallbacks MatchGuestPostGamePanel MatchSideColumnPanels MatchShareActionsRow`, and full suite (`lint`, `typecheck`, `test --`, `build`) all passed.
  - Follow-up (Replay parity): added `resolveReplayMintButtonClass` helper and aligned Replay share actions (`Copy share URL`) to Mint micro-delight classes (`mint-pressable`, `mint-hit`, `mint-share-action__btn`) with consistent `aria-label`/`title` on share buttons in focus/setup/result sections.
  - Follow-up verification: `pnpm.cmd -C apps/web test -- replayUiHelpers replayUiActions replayShareLinkBuilders replayTransportState`, then full suite (`lint:text`, `lint`, `typecheck`, `test --`, `build`) all passed.
- Remaining:
  - None for WO-046 v1 (further share entry-point polish can be tracked as follow-up WO if needed).
- Follow-up (2026-02-20): Added Web Share API fallback integration for Match/Replay share actions via `apps/web/src/lib/webShare.ts`, `useMatchReplayActions`, and `replayActionRunners` so supported devices open native share while unsupported/cancel/error paths safely fall back to clipboard copy.
- Follow-up verification (2026-02-20): `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web test -- useMatchReplayActions replayActionRunners webShare replayUiHelpers`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web build` all passed (sandboxed vitest hit spawn EPERM once; rerun elevated passed).
- Follow-up (2026-02-20, step6): extended native-share-first behavior to Match setup sharing in `apps/web/src/features/match/useMatchShareClipboardActions.ts` with unchanged URL format and clipboard fallback.
- Follow-up verification (2026-02-20, step6): `pnpm.cmd lint:text`, `pnpm.cmd -C apps/web test -- useMatchShareClipboardActions useMatchReplayActions replayActionRunners webShare`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web build` all passed (sandboxed vitest hit spawn EPERM once; rerun elevated passed).
