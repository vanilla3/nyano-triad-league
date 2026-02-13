# Work Order: 004 Pixi UI Unification (High Quality)

## 1) 背景 / 目的
- 現状は `mint` / `rpg` / `engine(pixi)` の見た目と情報密度が分かれており、体験の一貫性が弱い。
- ユーザー要望:
  - Nyanoコメントの語尾を「にゃ」から「ぴかっ✨」へ変更
  - `engine(pixi)` 盤面をより大きく表示
  - 将来的に pixi 風の高品質UIへ統一するため、要件を明文化

## 2) このPRで実施する範囲
- [x] Nyanoコメント語尾の新ルール適用（`にゃ` 終端を `ぴかっ✨` へ統一）
- [x] `BattleStageEngine` の盤面最大表示サイズを拡大
- [x] `focus=1` で Match/Replay を盤面優先レイアウトへ切替（header/footer非表示 + 盤面領域優先）
- [x] pixi統一UIの要件を Work Order 化
- [x] フルスクリーン専用ページ実装（`/battle-stage` / `/replay-stage` + Fullscreen toggle）

## 3) 要件
### MUST
- `ui=engine` で盤面が現状より明確に大きく表示されること。
- `ui=engine` でも Nyano コメントが常時視認できること（既存反映済み）。
- Nyanoコメントの日本語語尾が `にゃ` 終端のまま残らず、`ぴかっ✨` 系に統一されること。
- WebGL初期化失敗時にフォールバックUIで詰まらないこと。
- 既存の Match/Replay URL 互換を壊さないこと。

### SHOULD
- `ui=engine` 向けに「盤面フォーカスレイアウト」を追加し、HUD/ログを折りたたみ可能にする。
- 将来的に `layout=focus`（または専用ルート）で盤面中心体験へ切り替え可能にする。
- pixi盤面とHUDのトーン（色、質感、モーション）を段階的に揃える。

### COULD
- `engine` 専用の別ページ（例: `/battle-stage`）を追加し、全画面シアターモードを提供する。
- 演出レイヤー（軽量VFX、被写界風ブラー、試合終盤演出）を quality tier に応じて切替する。

## 4) 非ゴール
- 1PRで全ページのUIを完全置換しない。
- 既存 `rpg` / `mint` モードの削除は行わない。
- replay/transcript 仕様変更は行わない。

## 5) 受け入れ基準
- 390px幅端末で `ui=engine` 盤面が横スクロールなしで表示される。
- デスクトップで `ui=engine` 盤面が旧 `max-w-md` 時代より明確に大きい。
- `pickDialogue/pickReasonDialogue` の日本語結果に `ぴかっ✨` が含まれ、末尾 `にゃ` 終端が残らない。
- `pnpm -C apps/web test` と `pnpm -C apps/web build` が通る。

## 6) 調査ポイント
- フォーカスレイアウト時の「手札選択→盤面タップ→確定」導線の最短化。
- スマホ縦持ちでの HUD 密度と誤タップ率。
- quality tier (`off/low/medium/high`) ごとのFPS劣化閾値。

## 7) 実装アプローチ（次フェーズ）
- 004-A: `engine` 向けフォーカスレイアウト導入（ログ/設定をドロワーへ退避）
- 004-B: pixi向けHUDスキン追加（NyanoReaction/Score/Tip を同トーン化）
- 004-C: 専用ページ or URLパラメータでシアターモード切替
- 004-D: モバイル最適化（タップ領域、余白、アニメ削減）
- 004-E: スクショ比較とUX検証を docs に記録

## 8) 検証
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`
- 手動:
  - `/match?ui=engine` で盤面サイズ確認
  - `/replay?ui=engine` で盤面サイズとNyanoコメント確認
  - `ui=mint/rpg` への副作用がないことを確認

## 9) リスク / ロールバック
- リスク: 盤面拡大で一部端末の縦レイアウト圧迫が増える可能性。
- ロールバック: `BattleStageEngine` の `maxWidth` と `minHeight` を従来値へ戻す。
- 追加策: `layout=focus` を feature flag で段階導入する。

## 10) 2026-02 update
- [x] AI auto move pacing tuned for "thinking" feel: slower base delay + live countdown text on Match page.
- [x] Dedicated stage routes added: `/battle-stage` and `/replay-stage` force `ui=engine&focus=1` and hide global chrome.
- [x] Stage route board scaling: `BattleStageEngine` now accepts size overrides; `/battle-stage` and `/replay-stage` use larger board dimensions.
- [x] Replay stage panel toggle: `/replay-stage` can collapse timeline/details to keep board-first view.
- [x] Stage full-screen polish: stage routes now run in full-bleed layout with browser Fullscreen toggle and setup panel toggle (replay).
- [x] 004-B first pass: `ui=engine` uses pixi-tone HUD/Reaction styling (BattleHud + NyanoReaction) for visual coherence.
- [x] 004-D first pass: mobile stage controls can be collapsed (`Show/Hide Controls`) and stage action inputs use larger tap targets.
- [x] 004-D replay follow-up: `/replay-stage` now supports collapsing replay transport controls and uses larger touch targets for transport/timeline actions.
- [x] 004-D desktop follow-up: Match page adds a board-adjacent quick commit bar on desktop to avoid scrolling to the lower control section.
- [x] 004-B pixi card polish follow-up: `PixiBattleRenderer` now shows center R/P/S (janken) badge and upgraded edge-number typography/pills.
- [x] 004-B reaction cut-in follow-up: `NyanoReaction` now plays a cinematic cut-in entrance (flash + scanline accent) in mint/pixi tone while preserving reduced-motion behavior.
- [x] 004-B reaction cut-in v2: cut-in now has impact tiers (`low/mid/high`) based on reaction kind, with stronger burst timing/visuals for high-impact moments (chain/fever/win/lose).
- [x] 004-B stage impact sync: `DuelStageMint` now receives Nyano reaction impact and plays short board-side burst lighting (`mid/high`) in Match/Replay pixi focus, with reduced-motion and VFX-tier fallbacks.
- [x] 004-B reaction cut-in v3: high-impact reactions now show a brave-burst style diagonal banner layer (`NYANO BURST`-like callout) synchronized to cut-in burst timing.
- [x] 004-A drag-drop first pass: hand cards can now be dragged and dropped onto mint/pixi board cells to commit placement directly (desktop flow).
- [x] 004-B card art emphasis polish: mint/pixi card surface tuning reduces tint wash and improves highlight/vignette balance so NFT art stays readable and premium.
