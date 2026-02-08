# Nyano Triad League LONG TERM ROADMAP v1（超長期計画・作業指針）

最終更新: 2026-02-08

このドキュメントは、移行先作業者が **チャットを追わずに**「次に何を作り、何に注意し、どの順で改善すべきか」を把握できるようにするための **超長期ロードマップ**です。
“細部の実装”よりも、まず **品質の柱・変更の原則・作業の安全策**を共有し、迷いと手戻りを減らすことを優先します。

---

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

### Phase 0（いま〜2週間）: “イベントが壊れない”土台を固める
- [Stability]
  - [ ] 投票開始時点で state_json を必ず送る（strictAllowed lock）
  - [ ] strictAllowed hash の算出を **完全固定**（warudo と overlay が一致）
  - [ ] エラー表示の常設（nyano-warudo POST 失敗、RPC revert 等）
- [Explainability]
  - [ ] TurnLog / Overlay の flip理由表示を統一（短文・長文・要約の階層）
- [Participation]
  - [ ] `#triad` の parser/normalize を /stream の受理にも統一（票割れゼロ）
- [Operability]
  - [ ] 重要トグルの永続化（localStorage）、初期値の運用最適化

### Phase 1（〜1ヶ月）: “観戦体験”の完成（分かる・気持ちいい）
- [Visual]
  - [ ] overlay の情報設計を確定（視線誘導、余白、色、フォント、コントラスト）
  - [ ] 主要情報のレイアウト固定（OBS シーンテンプレ）
- [Explainability]
  - [ ] 盤面の「優勢/不利」の根拠を短く出す（例: corner control、threat）
  - [ ] 「なぜその手が強い/弱いか」tips（軽量なヒューリスティックでOK）
- [Stability]
  - [ ] Replay の完全再現性（turns + seed + deck）を担保
  - [ ] “壊れた時の復旧手順” を docs 化（配信中の再起動手順）

### Phase 2（1〜3ヶ月）: “運営が楽”になる（少人数運用の自動化）
- [Operability]
  - [ ] 運営向けダッシュボード（投票、状態、接続、ログ、最後のエラー）
  - [ ] “配信中に触ってはいけない設定” をロック（誤操作防止）
- [Participation]
  - [ ] 参加導線の短縮（QR/短縮URL/コピーボタン/コマンド自動生成）
  - [ ] チャット荒れ対策（レート制限、同一ユーザ重複票の扱い、bot 対応）
- [Extensibility]
  - [ ] ルールセットの抽象化（大会ルール/デッキ制限/特殊イベント）
  - [ ] “イベント設定ファイル” で差し替え可能に（コード変更不要）

### Phase 3（3〜6ヶ月）: “プロダクト品質”へ（テスト・監視・品質保証）
- [Stability]
  - [ ] E2E テスト（/match→/stream→/overlay の基本導線）
  - [ ] シミュレーションのゴールデンテスト（特定ターン列で結果固定）
  - [ ] エラートラッキング（Sentry 等）と、リリース後の回帰検知
- [Extensibility]
  - [ ] Plugin/Adapter 境界の明文化（twitch / warudo / overlay）
  - [ ] API 契約テスト（state schema を JSON schema 等で固定）
- [Operability]
  - [ ] リリース手順（versioning、changelog、rollback、feature flag）

### Phase 4（6〜12ヶ月）: “スケール”と“コミュニティの手触り”
- [Participation]
  - [ ] シーズン制（ランキング、報酬、アーカイブ）
  - [ ] 新規参加者向けチュートリアル（3分で理解→1分で参加）
- [Visual]
  - [ ] overlay のテーマプリセット（大会/配信者ごとに即切替）
  - [ ] アニメーション・演出（過剰にしない、読みやすさ優先）
- [Operability]
  - [ ] モデレーション機能（NGワード、BAN、スローモード連携）

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
