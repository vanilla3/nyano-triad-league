# ExecPlan 014: UI/UX Polish + QA（Shareworthy v8）

この ExecPlan は living document です。作業しながら `Progress` / `Decision Log` / `Outcome` を更新してください。

関連 Request:
- `codex/REQUEST_014_UIUX_POLISH_QA_SHAREWORTHY_V8.md`

---

## 1) Purpose / Big Picture

- Match（バトル盤面）を中心に「触り心地」を上げ、見た瞬間に “ゲームっぽい” と伝わる UI にする
- これまでの改善（Motion/VFX/SFX/Alive background/Idle guide）を **品質事故なく**定着させる
- 共有導線を整えて「UIがいいからシェアする」が起きる状態を作る

---

## 2) Scope

### In-scope（優先順）
P0
- Match 周辺の文字化け/制御文字/PUA を除去
- 文字化け再発防止（検知スクリプト & CI/ローカルで回せるチェック）
- share/actions/intro など “人目に触れる文言” の整備

P1
- ボード/セル/ボタン質感の底上げ（主に assets + CSS tuning）
- 押下/選択/決定のフィードバック統一（MintPressable の徹底 / 同じモーション言語）

P2
- シェアされる体験の追加（軽量な “結果カード” or share sheet polish）
- 背景/演出の “死んでないUI” を 1段上げる（ただし主役を邪魔しない）

### Out-of-scope
- ゲームロジック（triad-engine）のルール追加や大改修
- アカウント/DB/オンライン対戦など大型機能

---

## 3) Preflight: 現状確認（作業前に必ずやる）

- `apps/web/src/pages/Match.tsx` を開いて、UI文言に mojibake が混入していないか確認
- `apps/web/src/features/match/` を grep し、以下を検出:
  - 文字化けの典型文字: `繧` `縺` `繝`
  - 制御文字: `\u0080`（U+0080）
  - PUA: `\uE***` `\uF8**`
- `apps/web/public/assets/gen/*.png` のサイズを確認（placeholder かどうか）
- reduced motion / vfx low の挙動を 1 回見て、破綻がないか確認

---

## 4) Work Orders（この ExecPlan の実行単位）

- WO-044: Match文字化け/文言健全化 + 再発防止チェック
- WO-045: Board/Buttons の素材差し替え + CSS tuning（質感の底上げ）
- WO-046: Shareworthy polish（共有導線 + micro-delight）

> 進め方: まず WO-044 を完了しないと見た目改善が無意味になるため、P0 を最優先。

---

## 5) Implementation Notes（重要な設計メモ）

### 5-1. 文字化け修正の方針
- **最終目標**: UIに表示される日本語が自然で、英語は必要な箇所だけ（2言語併記は控えめ）
- 修正対象は “人が見る文言” が中心。コメントも読める状態へ
- 可能なら文言は `lib/i18n`（または `features/match/copy.ts`）へ寄せ、散在を減らす

### 5-2. VFX/SFX の制御
- `prefers-reduced-motion` と `VisualSettings(vfxQuality)` に必ず従う
- “勝ち/反転/確定” のみ派手にして、中毒性（カタルシス）を稼ぐ

### 5-3. 素材（assets）の扱い
- まず placeholder でも壊れない CSS にしておく（fallback）
- 実際の品質は `apps/web/public/assets/gen/` に差し替えるだけで上がる構造にする

---

## 6) Acceptance Criteria（合格条件）

P0（必須）
- Match周辺で mojibake 文字（`繧` `縺` `繝`）が UI 表示に出ない
- U+0080 の制御文字がコードベースに残っていない
- PUA 文字（\uE*** / \uF8**）が残っていない（アイコンは SVG/emoji/既存 MintIcon へ）
- 再発防止のチェックが `pnpm lint` 相当で実行できる

P1（強く推奨）
- Match の主要操作（カード選択→置く→反転→ターン進行）のフィードバックが一貫
- ボード/セル/ボタンの “厚み” が 1段上がり、参照画像との差分が縮む

P2（任意）
- 共有導線が分かりやすく、押したくなる（“共有してね” を強要しない）
- ミニ結果カード（ShareCard）が実装できるなら、1クリックで保存/共有できる

---

## 7) Test Plan（手動 + 自動）

自動
- 追加する “text hygiene” スクリプトで mojibake/PUA/control を検出→失敗すること
- `pnpm -C apps/web test`（存在するなら） / 型チェック / lint

手動
- Match をプレイして、文字・ボタン・結果・共有が破綻しない
- vfx low + reduced motion で演出が控えめになり、UIが崩れない
- モバイル幅でタップ領域が狭すぎない（最小 44px 目安）

---

## Progress

- [x] WO-044
- [x] WO-045
- [x] WO-046

## Decision Log
- 2026-02-20: WO-044 を先行し、Match copy の mojibake/control-char/PUA を先に除去してから演出系 polish を継続（品質事故を先に閉じる方針）。
- 2026-02-20: 素材導入は CSS fallback-first を維持し、placeholder が残る環境でも UI が破綻しない構成を優先。
- 2026-02-20: Share actions は native-share-first + clipboard fallback で統一し、端末差分を吸収。
- 2026-02-20: stage-focus E2E 安定化として `stage-focus-announcer-stack` に `min-h-[1px]` を追加し、空状態の 0-height collapse を防止。

## Outcome
- WO-044/045/046 の v1 scope は完了。
- P0 の text hygiene は `lint:text` で再発防止ラインを確立し、Match/Replayshare copy を正規化。
- 背景/素材/ボタン質感と share micro-delight は実装済みで、`apps/web` の lint/typecheck/test/build と stage-focus E2E が通過。
