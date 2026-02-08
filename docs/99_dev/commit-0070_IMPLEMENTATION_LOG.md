# commit-0070 IMPLEMENTATION LOG

## Summary
- **P0-1（DONE）**: `/overlay` を配信運用できる水準へ引き上げ（HUD常設）
  - 進行（turn/tiles）、flip理由（readout）、投票状態（残り秒/票数/Top）、strictAllowed（件数+hash）、同期状態（fresh/stale）を **常時表示**
  - `NyanoReactionBadge` を overlay に追加（感情のトリガーを最小UIで伝える）
- `/match` & `/replay` の overlay publish を拡張：
  - `lastTurnSummary.flips`（flipTraces）を送る → overlay 側で “なぜひっくり返ったか” を説明可能に
  - winner が draw のときの表示崩れ/型の揺れを修正（`winner: "draw"` を一貫して扱う）
- allowlist/hashing の “ズレ” を避けるため、共通ユーティリティ `triad_vote_utils` を追加

---

## Why
- OBS overlay は「配信の土台」です。ここが弱いと、運営が薄いイベントが成立しません。
- 画面内に必要な情報（進行・理由・投票の安全性）が常に見えていないと、配信中に “説明不能” になり荒れます。
- strictAllowed（合法手 allowlist）を運用で使うには、件数/hash を画面上で監視できる必要があります。

---

## What

### /overlay（HUD常設）
- **常時HUD**:
  - `turn / tiles`（ScoreBar）
  - `flipTracesReadout`（読み上げ/要約） + 必要なら詳細
  - `vote state`（open/closed, countdown, total, top）
  - `strictAllowed`（count + hash）
  - `sync`（overlay state age / fresh判定）
- `NyanoReactionBadge` を HUD 内へ（小さくても感情が伝わる）

### /match & /replay（broadcast payload）
- `publishOverlayState()` の payload に `lastTurnSummary.flips`（flipTracesの最小構造）を追加
- winner の型/表示（drawケース）を安定化

### 共通ユーティリティ
- `apps/web/src/lib/triad_vote_utils.ts` を追加
  - 座標変換（0..8 ↔ A1..C3）
  - `#triad` viewer command の整形
  - strictAllowed allowlist + hash（FNV-1a 32-bit）
  - warning mark 残数/候補

---

## Files
### New
- `apps/web/src/lib/triad_vote_utils.ts`

### Modified
- `apps/web/src/pages/Overlay.tsx`
- `apps/web/src/components/StreamOperationsHUD.tsx`
- `apps/web/src/pages/Match.tsx`
- `apps/web/src/pages/Replay.tsx`
- `docs/00_handoff/Nyano_Triad_League_HANDOFF_v1_ja.md`
- `docs/03_frontend/Nyano_Triad_League_FRONTEND_TASK_BOARD_v4_ja.md`

---

## Verify
- Web:
  - `/match?stream=1` を開き、別タブで `/overlay` を開く
  - 1手進めるごとに overlay の HUD が更新される（turn/tiles/flip理由/strictAllowed）
  - vote open/close が overlay に反映され、残り秒が減る
- Replay:
  - `/replay?broadcast=1` で step を動かすと overlay が追従する
- 表示:
  - スマホ幅・OBSの小さめプレビューでも HUD の主要情報が読める
