# Nyano Triad League LONG TERM ROADMAP v1（超長期計画・作業指針）

最終更新: 2026-02-12（Sprint 24: Phase 3 品質硬化 — エラートラッキング + リリース運用手順）

このドキュメントは、移行先作業者が **チャットを追わずに**「次に何を作り、何に注意し、どの順で改善すべきか」を把握できるようにするための **超長期ロードマップ**です。
“細部の実装”よりも、まず **品質の柱・変更の原則・作業の安全策**を共有し、迷いと手戻りを減らすことを優先します。

---

## 0-1. 現状（コミットマップ / 作業の現在地）

**反映済み（apply/0070-0071）**
- commit-0070: docs update（overlay HUD）
- commit-0071: vote start → state_json 送信（strictAllowed lock）
- commit-0072: TurnLog flipTraces の JP describe 統合
- commit-0073: /replay NyanoReaction の step 再現
- commit-0074: docs sync（最新コミットの反映）
- commit-0075: viewer command spec+parser lib（triad_viewer_command.ts）
- commit-0076: /stream 票集計キーを canonical #triad に統一
- commit-0078: long-term roadmap doc 追加
- commit-0079: パッチ共有の標準をロードマップへ追加
- commit-0081: CI の pnpm バージョン二重指定を解消（packageManager を正に）
- commit-0082: strictAllowed を単一ソース化（HUD/overlay/stream の allowlist/hash を一致させる）

**次にやる（高優先）**
- commit-0083: /stream の受理（parse/normalize）を triad_viewer_command に寄せ、票割れと曖昧さを根絶
- commit-0084: overlay の「常時HUD」視認性を詰める（縮尺/余白/コントラスト/情報の優先順位）

## 0. 北極星（North Star）

- **配信イベントが、運営人数が薄くても成立する**
  - 視聴者が参加しやすい（入力が簡単、結果が分かる、荒れにくい）
  - 配信が分かりやすい（今何が起きてるか・なぜその結果かが説明できる）
  - 不具合が起きても止まりにくい（復旧手順・フェイルセーフがある）
- **ゲームの正しさは triad-engine が担保し、UI は “説明” に徹する**
  - ロジックは engine に集約（UI 側で勝手に推測しない）
  - UI は “状態の可視化” と “運用のしやすさ” を最大化
- **インターフェース（契約）を安定させ、拡張は追加で行う**
  - 既存イベント運用を壊す変更は避け、互換性を壊すなら明示的にバージョンを上げる

---

## 1. 品質の柱（Quality Pillars）と、毎回見るべきチェック

### 1-1. ビジュアル品質（Visual）
- overlay は **一瞬で読める**（0.5秒で理解できる）
- 重要情報は「常時表示」か「常時表示に準ずる」こと
  - turn/tiles、投票状態、strictAllowed件数+hash、直近手の flip理由
- 表示の優先順位
  - (1) 進行/勝敗に直結 → (2) 投票/運営判断 → (3) 演出/装飾

### 1-2. 拡張性（Extensibility）
- **新要素は “差し替え” ではなく “追加”** で入れる（破壊的変更を避ける）
- UI の表示用フォーマット・parser・正規化は **単一ソース**（`triad_viewer_command`）
- overlay state / stream vote state は **バージョン付き契約**として扱う

### 1-3. 安定性（Stability）
- “止まる” より “劣化して継続” を選ぶ（best-effort）
- 外部（RPC / nyano-warudo / twitch）失敗は UI をブロックしない
- 失敗の状態が overlay で **見える**（stale / mismatch / last error）

### 1-4. 参加のしやすさ（Participation）
- 視聴者は「コピペ1行」で参加できる（`#triad ...`）
- 表記揺れに強い（矢印や大文字小文字、余分な文字を許容）
- 荒れ防止（strictAllowed lock）が **投票開始時点**で成立する

### 1-5. 管理のしやすさ（Operability）
- 操作は “必要最小限” で誤操作しにくい
- ログは運営が読みやすい（いつ何をしたか、どの状態だったか）
- 重要な手順は docs に **手順通り**書く（属人化しない）

### 1-6. わかりやすさ（Explainability）
- “なぜその結果か” が説明できる（flipTraces / chain / fever 等）
- Replay で検証できる（同じ結果が再現できる）

---

## 2. 変更の原則（破壊的変更を防ぐルール）

- **UI が engine の結果を作らない**
  - UI で「おそらくこう」の推測は禁止。必ず engine の出力に基づく
- **フォーマット・仕様は 1 箇所**
  - `#triad` の spec/parse/normalize/format は `triad_viewer_command.ts` に集約
- **Overlay/Stream の state は “互換性のある拡張”**
  - 追加フィールドは OK
  - 既存フィールドの意味変更は NG（必要なら `V2` を作り段階移行）
- **外部連携は “止めない”**
  - POST 失敗 → ログに残す、UI は継続
  - 成功/失敗を overlay/stream HUD に表示（運営が判断できる）

---

## 3. アーキテクチャの要点（作業者が迷いやすい境界）

- `triad-engine`: 正しさ・決定性の中心
  - flip traces / chain 等の **説明素材**もここがソース
- `apps/web /match`: プレイ体験の中心（人間の入力）
- `apps/web /stream`: 配信運用の中心（投票、nyano-warudo 連携）
- `apps/web /overlay`: 視認性の中心（OBS で読む）
- `streamer_bus`: タブ間通信（BroadcastChannel/localStorage）
  - “壊れたら困る契約” なので、変更は慎重に（後方互換・versioning）

---

## 4. 超長期ロードマップ（フェーズ別）

> 重要: 各フェーズは **並行**して良いですが、依存関係（先に固めるべき契約）を崩さないこと。

### Phase 0（完了 ✅ Sprint 20）: "イベントが壊れない"土台を固める
- [Stability]
  - [x] 投票開始時点で state_json を必ず送る（strictAllowed lock）
  - [x] strictAllowed hash の算出を **完全固定**（warudo と overlay が一致）
  - [x] エラー表示の常設（nyano-warudo POST 失敗、RPC revert 等） — P0-ERR: Stream HUD LastErrorBanner + Overlay 30s sticky
- [Explainability]
  - [x] TurnLog / Overlay の flip理由表示を統一（短文・長文・要約の階層） — P0-FLIP: TurnLog → flipTraceFull() 統一
- [Participation]
  - [x] `#triad` の parser/normalize を /stream の受理にも統一（票割れゼロ） — P0-PARSE: moveDisplay() に controlledSide 反映
- [Operability]
  - [x] 重要トグルの永続化（localStorage）、初期値の運用最適化 — P0-PERSIST: stream.eventId 永続化

### Phase 1（〜1ヶ月）: "観戦体験"の完成（分かる・気持ちいい）
- [Visual]
  - [x] overlay の情報設計を確定（視線誘導、余白、色、フォント、コントラスト） — Sprint 21: セルビジュアル強化(owner glow + flip animation)、ドラマティックパネル(ol-panel-dramatic)、パネル階層(primary/secondary/tertiary)
  - [x] 主要情報のレイアウト固定（OBS シーンテンプレ） — Sprint 21: OBS_SCENE_TEMPLATES.md (720p/1080p presets, URL params, 透過BG)
- [Explainability]
  - [x] 盤面の「優勢/不利」の根拠を短く出す（例: corner control、threat） — Sprint 21: assessBoardAdvantageDetailed + AdvantageBar reason tags (tile_lead, corner_control, center_control, edge_superiority, vulnerability)
  - [x] 「なぜその手が強い/弱いか」tips（軽量なヒューリスティックでOK） — Sprint 21: generateMoveTipWithNarrative + MoveQualityTip narrative display
- [Stability]
  - [x] Replay の完全再現性（turns + seed + deck）を担保 — Sprint 22: verifyReplayV1() API + Replay ページ Verify ボタン（Phase 1 完結）
  - [x] "壊れた時の復旧手順" を docs 化（配信中の再起動手順） — Sprint 21: STREAM_RECOVERY_RUNBOOK.md (症状別トラブルシューティング + 配信前チェックリスト)

### Phase 2（1〜3ヶ月）: "運営が楽"になる（少人数運用の自動化）
- [Operability]
  - [x] 運営向けダッシュボード（投票、状態、接続、ログ、最後のエラー） — Sprint 22: BoardMiniPreview + Export log ボタン + opsLog クリップボード出力
  - [x] "配信中に触ってはいけない設定" をロック（誤操作防止） — Sprint 22: ロック解除確認ダイアログ + lockTimestamp 表示
- [Participation]
  - [x] 参加導線の短縮（QR/短縮URL/コピーボタン/コマンド自動生成） — Sprint 22: StreamSharePanel Quick Commands + Nightbot テンプレート + stream_command_generator.ts
  - [x] チャット荒れ対策（レート制限、同一ユーザ重複票の扱い、bot 対応） — Sprint 23: anti_spam モジュール（validateUsername / checkRateLimit / checkVoteChangeLimit）+ VoteControlPanel 設定 UI
- [Extensibility]
  - [x] ルールセットの抽象化（大会ルール/デッキ制限/特殊イベント） — Sprint 23: deck_restriction モジュール（parseDeckRestriction / validateDeckAgainstRestriction）+ Match.tsx 実行時強制 + voteTimeSeconds イベント連動
  - [x] "イベント設定ファイル" で差し替え可能に（コード変更不要） — Sprint 22: NyanoAiEventV1 に voteTimeSeconds/maxAttempts/deckRestriction 追加

### Phase 3（3〜6ヶ月）: "プロダクト品質"へ（テスト・監視・品質保証）
- [Stability]
  - [x] E2E テスト（/match→/stream→/overlay の基本導線） — Sprint 23: cross-tab-overlay.spec.ts（BroadcastChannel 経由のオーバーレイ状態受信・投票受信・localStorage 復旧の 3 テスト）
  - [x] シミュレーションのゴールデンテスト（特定ターン列で結果固定） — Sprint 23: golden_vectors.json（3 ベクタ）+ golden_vectors.test.ts（12 tests）+ replay_determinism verifyReplayV1 合意テスト
  - [x] エラートラッキング（Sentry 等）と、リリース後の回帰検知
    - Sprint 24: `apps/web/src/lib/error_tracking.ts` で global error / unhandledrejection を収集（local/console/remote 切替）
- [Extensibility]
  - [x] Plugin/Adapter 境界の明文化（twitch / warudo / overlay） — Sprint 24: ADAPTER_INTERFACES.md（BroadcastChannel Bus 3ch 契約 + Nyano Warudo HTTP Bridge 契約 + Twitch Bridge 設計方針）
  - [x] API 契約テスト（state schema を JSON schema 等で固定） — Sprint 24: streamer_bus ランタイムバリデータ 4 関数（isValidOverlayStateV1 / isValidStreamVoteStateV1 / isValidStreamCommandV1 / isValidBoardCellLite）+ 66 テスト + subscribe/read 組み込み
- [Operability]
  - [x] リリース手順（versioning、changelog、rollback、feature flag）
    - Sprint 24: `docs/99_dev/RELEASE_RUNBOOK_v1_ja.md` を追加し、`pnpm run release:check` を標準化

### Phase 4（6〜12ヶ月）: “スケール”と“コミュニティの手触り”
- [Participation]
  - [ ] シーズン制（ランキング、報酬、アーカイブ）
  - [x] 新規参加者向けチュートリアル（3分で理解→1分で参加）
    - Sprint 24: Home に quickstart checklist（進捗保存）を追加し、Match の初手確定で進捗を自動更新
- [Visual]
  - [ ] overlay のテーマプリセット（大会/配信者ごとに即切替）
  - [ ] アニメーション・演出（過剰にしない、読みやすさ優先）
- [Operability]
  - [x] モデレーション機能（NGワード、BAN、スローモード連携）
    - Sprint 24: Stream vote console に moderation 設定（slow mode / banned users / blocked words）を追加し、投票受理前に判定を適用

### Phase 5（1〜2年）: “エコシステム化”（外部が作れる）
- [Extensibility]
  - [ ] 外部 bot / 外部 UI が参照できる公開仕様（Viewer command / state）
  - [ ] ルール・UI の拡張点をドキュメント化（例: 特殊カード、イベント）
- [Stability]
  - [ ] 互換性維持ポリシー（V1→V2 移行計画、deprecation）
- [Operability]
  - [ ] 権限モデル（運営/配信者/モデレーター/ゲスト）

### Phase 6（2〜3年+）: “研究・実験領域”
- [Explainability]
  - [ ] AI 解説（ただし “勝手に断定しない” ルール：確率と根拠を出す）
- [Extensibility]
  - [ ] 複数フォーマット（別ゲーム/別モード）への一般化
- [Participation]
  - [ ] コミュニティガバナンス（提案→投票→採択の仕組み）

---

## 5. 作業者向けガイド（何に気をつけて、どう作業するか）

### 5-1. “契約”を壊さない
- 変更前に必ず確認
  - `OverlayStateV1` / `StreamVoteState` の schema
  - `triad_viewer_command` の spec（parse/normalize/format）
- 互換性を壊すなら
  - `V2` を新設し、両対応期間を設ける（段階移行）

### 5-2. “表示”は運営の意思決定を助ける
- overlay は「美しさ」より「判断の速さ」
- HUD は “常時読める” が基本
  - 情報が増えるほど、**省略と階層化**が重要（短→長→詳細）

### 5-3. “外部失敗”は運用設計で吸収する
- RPC revert / warudo POST 失敗は必ず起こる前提
- UI をブロックしない
- “最後の成功時刻/失敗理由” を表示して、運営が判断できるようにする

### 5-4. PR/Commit の最低基準（Definition of Done）
- [ ] 変更の目的が docs に残っている（commit-XXXX_IMPLEMENTATION_LOG）
- [ ] 仕様変更があれば spec（`triad_viewer_command` など）が更新されている
- [ ] /match /stream /overlay のどれかに影響するなら、簡易動作確認手順が書いてある
- [ ] 破壊的変更が無い（あるなら V2 を作って段階移行）

### 5-5. パッチ共有の標準（手戻りと待ちを消す）
- 共有する側は「受け手が *コピペ一発で適用* できる」ことを最優先にする
  - **SHA256** を必ず添える（取り違え防止）
  - `git apply --check` が通ることを確認してから共有
- 推奨フロー（Windows cmd 前提）
  - 受け手: `..\_patches` に集約 → `certutil -hashfile ... SHA256` → `git apply --check` → `git apply` → `git add` → `git commit`
  - 共有者: `git diff` / `git format-patch` を **手で編集しない**（diff が壊れる原因になる）
- 失敗時の切り分け
  - `git apply --include=docs/...` で docs だけ先に取り込む（作業の待ちを減らす）
  - `git apply --reject` で `.rej` を出し、当たらない箇所を局所化

### 5-6. CI / pnpm バージョン管理の標準（再現性と安定運用）
- **single source of truth**: ルートの `package.json#packageManager` を正とする（例: `pnpm@9.0.0`）
- GitHub Actions の `pnpm/action-setup@v4` では **`version:` を指定しない**
  - `version:` と `packageManager:` が同時に存在すると action が失敗する（ERR_PNPM_BAD_PM_VERSION 互換）
- `pnpm install --frozen-lockfile` を基本（lock 無しは install）
- CI が落ちたらまず確認する順
  - (1) `packageManager` と workflow の pnpm 設定が二重指定になっていないか
  - (2) Node version（推奨: 20）
  - (3) lockfile の更新漏れ（`pnpm-lock.yaml`）

---

## 6. よくある落とし穴（必読）
- **RPC revert**: 失敗は前提。UI は止めず、ログと “最後に成功した状態” を保持
- **BigInt**: JSON serialize/parse、UI 表示、比較で事故が起きやすい
- **テーマ衝突**: overlay は “単独 CSS” を優先（アプリ全体の theme と混ざらないように）
- **タブ間通信**: localStorage の stale、BroadcastChannel の欠落、updatedAt の信頼性
- **票割れ**: parser/normalize が複数実装になると必ず起きる（単一ソース化）

---

## 7. このロードマップの運用
- このファイルは “完成” しません。イベント運用で得た知見で更新します。
- 更新ルール
  - 重要度が高いものは Phase 0/1 に寄せる
  - “手戻りが出た原因” を必ず追記（同じ事故を二度起こさない）
