# WO-044: Match文言の文字化け修正 + Text Hygiene（再発防止）v1

目的:
- Match周辺の UI 文言に混入している **文字化け（mojibake）/ 制御文字（U+0080）/ 私用領域文字（PUA）** を除去し、
  “一瞬で品質が壊れる” 要因をゼロにする。
- 再発防止として **自動検知スクリプト**を追加し、`pnpm lint` 相当で落とせるようにする。

---

## 1) 現状（検出済み）

### 1-1. mojibake が見つかったファイル
- `apps/web/src/features/match/MatchBoardFeedbackPanels.tsx`
- `apps/web/src/features/match/MatchCardLoadEmptyStatePanel.tsx`
- `apps/web/src/features/match/MatchEventPanel.tsx`
- `apps/web/src/features/match/MatchFocusHandDock.tsx`
- `apps/web/src/features/match/MatchGuestModeIntro.tsx`
- `apps/web/src/features/match/MatchGuestPostGamePanel.tsx`
- `apps/web/src/features/match/MatchHandCompactHintPanel.tsx`
- `apps/web/src/features/match/MatchHandStatusHeader.tsx`
- `apps/web/src/features/match/MatchQuickCommitBar.tsx`
- `apps/web/src/features/match/MatchResultSummaryPanel.tsx`
- `apps/web/src/features/match/MatchShareActionsRow.tsx`
- `apps/web/src/features/match/MatchTurnActionPanel.tsx`
- `apps/web/src/features/match/useMatchCardLoadActions.ts`
- `apps/web/src/features/match/__tests__/useMatchCardLoadActions.test.ts`
- `apps/web/src/pages/Match.tsx`

### 1-2. PUA（Private Use Area）文字が見つかったファイル
- `apps/web/src/features/match/MatchGuestModeIntro.tsx` ()
- `apps/web/src/pages/Match.tsx` ()

### 1-3. 制御文字（U+0080）が見つかったファイル
- `apps/web/src/features/match/MatchEventPanel.tsx`
- `apps/web/src/features/match/MatchGuestModeIntro.tsx`
- `apps/web/src/features/match/MatchHandCompactHintPanel.tsx`
- `apps/web/src/features/match/MatchResultSummaryPanel.tsx`
- `apps/web/src/pages/Match.tsx`

---

## 2) 方針

### 2-1. 修正優先度
P0:
- UIに表示される文言（Matchのボタン、説明、共有、ゲスト導入、結果）
P1:
- コメント/テスト文言（ただし mojibake は放置しない）

### 2-2. 修正方法（おすすめ）
- 文字化けは UTF-8 を CP932 として読んで保存した典型パターンが多い。
  - 可能なら「**mojibake → 正しい日本語**」へ復元し、自然な言い回しに整える。
  - 復元が難しい箇所は、意味が通る日本語に **書き直し**でOK（品質優先）。
- PUA アイコンは廃止し、以下へ置き換える:
  - `MintIcon`（既存にあるなら）
  - SVG（inline）
  - もしくは emoji（ミュート/音量などは emoji で十分）

---

## 3) 追加実装: Text Hygiene チェック

### 3-1. 追加するスクリプト
- 例: `scripts/check_text_hygiene.mjs`
- 仕様:
  - `apps/web/src/**/*.{
      ts,tsx,css,md
    }` を対象に走査（実装では glob を普通に書いてOK）
  - 以下を検出したら exit code 1 で失敗
    - mojibake の典型文字（例: `繧` `縺` `繝`）
    - U+0080 などの制御文字（`\u0080`）
    - PUA（`\uE000-\uF8FF` など）
  - エラーメッセージに「ファイルパス」「行番号」「該当スニペット」を含める

### 3-2. package.json への接続
- `package.json` か `apps/web/package.json` に `lint:text` を追加し、CI/ローカルで回せるようにする
- 既存の lint と統合できるなら統合（`pnpm lint` で落ちるのが理想）

---

## 4) 受け入れ条件（Acceptance）

- Match の主要画面（通常/ゲスト導入/結果/共有）で mojibake が表示されない
- コードベースから U+0080 / PUA が消える
- `scripts/check_text_hygiene.mjs` が追加され、ローカルで実行すると現状の混入を検知できる
- 修正後、スクリプトが **成功**し、再発時に確実に落ちる

---

## 5) 注意点

- 文言の二重表記（日本語 + 英語）は必要最低限にする（読みやすさ優先）
- `prefers-reduced-motion` / VFX 設定と同様に、UIの “品質ガード” として扱う（例外を作りすぎない）

---

## Execution Status (2026-02-20)

- Status: `Done (P0 scope)`
- Implemented:
  - Match text copy cleanup for mojibake/control-char/PUA across `apps/web/src/pages/Match.tsx` and impacted `apps/web/src/features/match/*` files.
  - `useMatchCardLoadActions` toast copy normalization and matching test update.
  - `scripts/check_text_hygiene.mjs` cleanup and default scope narrowed to `apps/web/src`.
- Verification passed:
  - `pnpm.cmd lint:text`
  - `pnpm.cmd -C apps/web test --`
  - `pnpm.cmd -C apps/web lint`
  - `pnpm.cmd -C apps/web typecheck`
  - `pnpm.cmd -C apps/web build`
- Follow-up (2026-02-20, step2): strengthened mojibake detection signatures in `scripts/check_text_hygiene.mjs` (including the newly observed share-template corruption pattern) to prevent regressions from passing `lint:text`.
- Follow-up verification (2026-02-20, step2): `pnpm.cmd lint:text` passed after checker rewrite, and downstream web checks (`pnpm.cmd -C apps/web test -- matchShareLinks useMatchReplayActions webShare MatchGuestPostGamePanel`, `pnpm.cmd -C apps/web lint`, `pnpm.cmd -C apps/web typecheck`, `pnpm.cmd -C apps/web build`) remained green.
