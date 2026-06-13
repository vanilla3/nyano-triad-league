# Nyano Triad League — コードベース・オンボーディングマップ (v1)

> 新規開発者・コントリビュータが最初に全体像を掴むためのリポジトリ地図。
> 対象読者: 初めてこのコードベースを触る人 / 第三者ツールを作る人。
> 最終更新: 2026-06-13 ／ 種別: overview（読み物・実装変更なし）

一言で言うと:
**「Nyano Peace NFT のオンチェーン属性をカード性能にした 3×3 制圧ゲーム」を、決定論エンジン（TS）＋オンチェーン決済（Solidity）＋Web フロント（React/Pixi）で実装した pnpm モノレポ。**
カジュアル対戦はウォレット不要・0tx、公式戦は transcript から 1tx で決済（決定論で再計算）。

関連ドキュメント:
- フロント構造の詳細: `docs/03_frontend/Nyano_Triad_League_FRONTEND_CODEMAP_v1_ja.md`
- プロトコル仕様（契約書）: `docs/02_protocol/`（transcript / ruleset id / events / trait / settlement）
- 不変条件と作業作法: `AGENTS.md`（および各ディレクトリの `AGENTS.md`）

---

## 1. 主要ディレクトリの役割

| ディレクトリ | 役割 | 特徴 |
|---|---|---|
| `packages/triad-engine/` | **対戦ルールの純粋関数エンジン（決定論・TS）** | プロジェクトの心臓。RNG・I/O・チェーン呼び出しを持たない。`simulateMatchV1` が transcript → 結果を計算。Solidity と**ビット単位で一致**する必要がある。 |
| `contracts/` | **公式戦のオンチェーン検証/決済（Foundry/Solidity）** | `TriadEngineV1/V2.sol` が TS エンジンのサブセットを再実装。EIP-712 署名・`NyanoPeace.ownerOf` 所有確認・`RulesetRegistry` ガバナンス。 |
| `apps/web/` | **フロント（Vite + React + TS + Tailwind + Pixi）** | 約 600 ファイル。下記 4 サブディレクトリが主要部。 |
| `apps/web/src/features/match/` | **対戦/リプレイ体験の状態ロジック（最大サブシステム）** | 220 ファイル。`Match.tsx`（2641 行）から抽出された hooks / 純関数群。`useMatchStage*`・`matchBoardDerived`・`matchCardLoaders` 等。 |
| `apps/web/src/lib/` | **共有ユーティリティ・データ層** | 145 ファイル。ルールセット解決・デッキ保存・カード解決・リプレイ URL・配信バス・AI 対戦・Nyano アセット。 |
| `apps/web/src/components/` | **UI コンポーネント層・テーマ** | 盤面表示（DOM 版 / Mint 版 / RPG 版）、`mint/` シェル、`stream/` パネル。 |
| `apps/web/src/engine/` | **Pixi/WebGL バトルステージ・レンダラ** | `IBattleRenderer` 抽象 + `PixiBattleRenderer` 実装。React がライフサイクル、レンダラが描画ループ。 |
| `apps/web/src/pages/` | ルートごとのページ（Home/Match/Arena/Decks/Replay/Stream/Nyano…） | `Match.tsx` のみ巨大、他は薄い。 |
| `docs/` | **仕様（プロトコル/設計/運用/フロント）** | 282 ファイル。特に `docs/02_protocol/` が「契約書」。 |
| `test-vectors/` | **TS⇔Solidity 実装一致を保証する共有テストベクタ** | `core_tactics_v1.json` 等。スクリプトで生成し両言語のテストが消費。 |
| `rulesets/` | 公式オンチェーンルールセットの registry JSON | |
| `scripts/` | コード生成・lint（game index 構築、テストベクタ生成、テキスト/モーション監査） | CI が呼ぶ。 |
| `codex/` / `.agents/` / `handoff_pack/` | エージェント自走用の作業指示・スキル・ハンドオフ | コードではなく運用メタ。 |

各ディレクトリに **`AGENTS.md`** が置かれ、ルールを階層的に上書きする
（`AGENTS.md` / `packages/triad-engine/AGENTS.md` / `contracts/AGENTS.md` / `apps/web/AGENTS.md`）。

---

## 2. 主要なデータフロー

### A. カジュアル対戦（0tx・コア）
```
デッキ(localStorage / demo_decks / guest)
  → tokenIds
  → resolveCards()              [apps/web/src/lib/resolveCards.ts] ゲームインデックス優先 → RPCフォールバック
  → Map<bigint, CardData>
  → ユーザーの着手で Turn[] を構築（cell / cardIndex / 警戒マーク / Earth）
  → simulateMatchV1WithHistory(transcript, cards, ruleset)   [packages/triad-engine/src/engine.ts]
  → MatchResult { winner, board, turns(TurnSummary[]), matchId, boardHistory, formations }
  → BoardView* / BattleStageEngine が描画
  → （任意）publishOverlayState() で配信オーバーレイへ
```
カード解決は **「ゲームインデックス(静的JSON) → RPC」の 2 段フォールバック**
（`apps/web/src/lib/resolveCards.ts`）で、公開 RPC が落ちても共有リプレイが壊れないようにしている。

### B. ルールセット解決
```
RulesetKey("v1"/"v2"/"classic_*" …, URLパラメータ)
  → REGISTRY [apps/web/src/lib/ruleset_registry.ts]  → RulesetConfig(V1|V2)
  → computeRulesetId() [packages/triad-engine/src/ruleset_id.ts] でcanonical keccak256 → bytes32 id
逆方向: transcript.header.rulesetId → resolveRulesetById() → RulesetConfig
```

### C. リプレイ共有URL（往復）
```
TranscriptV1 → JSON → gzip(fflate) → base64url → "?z=..."   (?t= は無圧縮)
復号: ?z / ?t → decodeReplaySharePayload()  [apps/web/src/lib/replay_share_params.ts]
      → transcript_import → simulateMatchV1 → replay_timeline でステップ再生
```

### D. 公式戦（オンチェーン決済・1tx）
```
TranscriptV1 → hashTranscriptCanonical()  [engine.ts] ABIエンコード + keccak256 = matchId
  → NyanoTriadLeague.sol に 1tx で提出
  → TranscriptV1.sol / TriadEngineV1|V2.sol がオンチェーンで再シミュレート＆検証
パリティ保証: test-vectors/*.json を scripts/generate_core_tactics_vectors_v1.mjs が生成し、
  TS側(core_tactics_vectors.test.js) と Solidity側(contracts/test/generated/*Test.sol) が同じベクタを検証。
  CI が「生成 → git diff --exit-code」でドリフトを検出。
```

### E. 配信/オーバーレイ（バックエンドレス）
```
Match → publishOverlayState(OverlayStateV1)  [apps/web/src/lib/streamer_bus.ts]
  → BroadcastChannel（無ければ localStorage storageイベント）でタブ間配信
  → /overlay ページが subscribe（リフレッシュ後も localStorage から復旧）
Stream Studio(/stream) → StreamCommandV1 → Match（stream=1 のときだけ適用）
全メッセージに isValid*V1() ランタイムバリデータあり。
```

---

## 3. 重要なエントリーポイント

| 種別 | ファイル | 役割 |
|---|---|---|
| Web 起動 | `apps/web/src/main.tsx` | `createBrowserRouter` のルート表、react-query / Router プロバイダ、グローバルエラートラッキング。Home/Match/BattleStage は eager、他は `React.lazy`。 |
| レイアウト | `apps/web/src/App.tsx` | テーマ（mint/rpg/default）と focus/stage ルート分岐、ヘッダ/フッタ。 |
| 対戦オーケストレータ | `apps/web/src/pages/Match.tsx` | 2641 行。対戦・配信・AI・共有・ステージ演出のハブ。 |
| エンジン公開 API | `packages/triad-engine/src/index.ts` → `engine.ts` | `simulateMatchV1` / `*WithHistory` / `computeRulesetId` / `verifyReplayV1`。 |
| レンダラ | `apps/web/src/engine/components/BattleStageEngine.tsx` | Pixi を `dynamic import` でマウント、状態を `setState` で push。 |
| オンチェーン | `contracts/src/NyanoTriadLeague.sol` | 公式戦決済のメインコントラクト。 |
| ビルド/デプロイ | `vercel.json` / `package.json` / `.github/workflows/ci.yml` | Vite SPA（`/(.*) → /index.html`）。`build:web` は **engine をビルドしてから** web をビルド。 |
| コード生成 | `scripts/build_game_index_v1.mjs` / `scripts/generate_core_tactics_vectors_v1.mjs` | ゲームインデックス・テストベクタ生成。 |

---

## 4. 変更時に壊れやすい箇所

`AGENTS.md` が掲げる 4 不変条件（決定論／URL互換／プロトコル安定／WebGLフォールバック）に直結する箇所が要注意。

1. **エンジンのゲームロジック全般** — `packages/triad-engine/src/engine.ts`。フリップ判定・コンボ・警戒マーク・trait 効果のどれを変えても結果（=`matchId`）が変わり、**オンチェーン決済とリプレイ検証が全滅**する。`contracts/src/lib/TriadEngineV1|V2.sol` と必ず同時に整合させ、`test-vectors` を再生成すること。
2. **`hashTranscriptCanonical` の ABI レイアウト** — `engine.ts` 内。型順序を 1 つ変えるだけで matchId が全変化。`contracts/src/lib/TranscriptV1.sol` と一致必須。
3. **ルールセット ID の正規化** — `packages/triad-engine/src/ruleset_id.ts`。canonicalize ロジックを変えると全 rulesetId が変わり、`REGISTRY_BY_RULESET_ID` の逆引きやオンチェーンの同一性が崩れる。**`meta` と `onchainSettlementCompat` は意図的に正規化から除外**されている。
4. **transcript コーデックのビット詰め** — `packages/triad-engine/src/transcript_codec.ts`。`moves[i] = (cell<<4)|cardIndex`、`255=none`。Solidity 側と一致必須。
5. **URL/共有パラメータ** — `apps/web/src/lib/replay_share_params.ts`（`?z/?t`）、`apps/web/src/lib/classic_rules_param.ts`（classic ビットマスク）、`apps/web/src/lib/first_player_params.ts`、`apps/web/src/features/match/urlParams.ts`。既存の共有リンクが壊れる（不変条件#2）。
6. **配信バス／state_json スキーマ** — `apps/web/src/lib/streamer_bus.ts` の `OverlayStateV1`/`StreamCommandV1`/`StreamVoteStateV1`。タブ間通信と外部連携が依存。UI の都合で形を変えない（不変条件#3）。
7. **WebGL/Pixi フォールバック** — `apps/web/src/engine/components/BattleStageEngine.tsx`。`hasWebGlContextSupport()` 判定 → init の try/catch → `initError` フォールバック UI → テクスチャ失敗時の「プレースホルダ続行＋Retry」。壊すと WebGL 非対応端末で詰む（不変条件#4）。
8. **オンチェーン互換制約** — `validateTranscriptForRuleset`（`engine.ts`）。`onchainSettlementCompat` 時は **firstPlayer=playerA 固定・earthBoostEdge 不可**。
9. **`Match.tsx`（2641 行）** — 巨大な単一オーケストレータで結合が強く、**ページ直接のテストが無い**（ロジックは features/match に抽出済みだが配線は手薄）。
10. **on-chain ⇔ engine の表現差** — Nyano triad のオンチェーン順序は `{up,right,left,down}` だが engine `Edges` は `{up,right,down,left}`。エッジ値域も **engine 0..10 / Nyano 1..10**（`packages/triad-engine/src/nyano.ts`）。変換時の取り違えが起きやすい。

---

## 5. テストが薄い箇所

ソース/テストファイル数の実測比（`*.test` / `*.spec` / `*Test.sol` をカウント, 2026-06-13 時点）:

| 領域 | ソース / テスト | 評価 |
|---|---|---|
| `packages/triad-engine/src` | 14 / 27 | ✅ 非常に手厚い（コアなので妥当） |
| `apps/web/src/features/match` | 112 / 108 | ✅ 手厚い |
| `apps/web/src/lib` | 71 / 59 | ◯ 概ね良いが穴あり |
| `apps/web/src/engine`（Pixi） | 10 / 12 | ⚠️ **数はあるが node 環境のユニットのみ。実 WebGL 描画は未カバー**（実機描画は e2e の視覚回帰頼み） |
| `contracts/src` | 10 / 7 | ◯ |
| `apps/web/src/hooks` | 3 / 2 | ◯ |
| `apps/web/src/components` | 67 / 21 | ⚠️ **約 31%。盤面/カード描画・mint シェル・stream パネルの多くが無テスト** |
| `apps/web/src/pages` | 18 / 3 | ❗ **最薄。`Match.tsx`(2641 行) 含めページ統合テストがほぼ無い**（Events/Stream/overlay のみ） |

**テスト未保有の lib トップレベル**: `arweave_gateways`, `build`, `mint_page_guides`, `sfx`, `vectors`。

**特に薄い実体**:
- **ページレベルの統合**（特に Match の 着手 → シミュレート → 描画 の通し）。
- **Pixi レンダラの実行時挙動**（テクスチャ解決・preload・foilFx は node ユニットのみ、GPU 経路は `apps/web/e2e/engine-stage-visual-regression.spec.ts` のスナップショットのみ。しかも**スナップショットは win32 限定**＝直近コミット 55d5c22 で OS 固定）。
- **コンポーネント描画層**（BoardView 系/mint/stream の見た目）。

> 補強テストの起点は `apps/web/e2e/`（Playwright, `e2e:ux` ガードレール）と engine の `test-vectors`。

---

## 6. 新規開発者が最初に読むべきファイル10個

1. `README.md` — プロダクト像とリポジトリレイアウト、遊び方。
2. `AGENTS.md`（root） — **4 つの不変条件**と作業作法。最初に頭に入れるべき制約。
3. `packages/triad-engine/src/types.ts` — `TranscriptV1`/`CardData`/`RulesetConfig`/`MatchResult` の**データモデル全体**。
4. `packages/triad-engine/src/engine.ts` — `simulateMatchV1`。ゲームの全ルールがここに集約（コア → 戦術 → synergy → classic）。
5. `apps/web/src/main.tsx` — ルート表とアプリ起動の全体像。
6. `apps/web/src/App.tsx` — テーマ/フォーカス/ステージのレイアウト分岐。
7. `apps/web/src/pages/Match.tsx` — 巨大だが**フロントの中心**。まずは冒頭の import 群（1–177 行）で features/match の地図を掴む。
8. `apps/web/src/lib/ruleset_registry.ts` — `RulesetKey` ⇄ `RulesetConfig` ⇄ `rulesetId` の対応。ルール体系の入口。
9. `apps/web/src/lib/resolveCards.ts` — tokenId → CardData のデータ取得（index → RPC フォールバック）。
10. `apps/web/src/engine/components/BattleStageEngine.tsx` — Pixi 連携と **WebGL フォールバック**の実装パターン。

**次点（11〜）**: `apps/web/src/lib/streamer_bus.ts`（プロトコル形）、`packages/triad-engine/src/transcript_codec.ts`、`contracts/src/NyanoTriadLeague.sol`、`docs/03_frontend/Nyano_Triad_League_FRONTEND_CODEMAP_v1_ja.md`、`docs/02_protocol/` の各 SPEC。

---

## 7. 触る前に確認すべき前提

- **エンジンは純粋・決定論**: RNG/シャッフル/外部 I/O 無し。カードデータは呼び出し側が渡す。9 ターン・各デッキ 5 枚・全枚数使用・cell/cardIndex は一意。
- **TS と Solidity は同一仕様の二重実装**: `engine.ts` を触ったら `contracts/src/lib/TriadEngine*.sol` と `test-vectors/*.json` も連動。CI が `generate_core_tactics_vectors_v1.mjs` の出力ドリフトを `git diff --exit-code` で弾く。
- **rulesetId 正規化は「同じ挙動＝同じ ID」**: 無効化された trait のパラメータは正規化で潰される。**`meta`/`onchainSettlementCompat` は ID に含めない**（=エンジン専用ノブ）。
- **ルールセットは v1/v2 がある**: V2 は classic ルール（plus/same/reverse/order/swap…）を追加。`simulateMatchV1` 内部で V2→V1 にダウンキャストしつつ classic は別途解決。
- **オンチェーン互換モード**では firstPlayer=playerA 固定・earthBoost 不可。`v1`(`ONCHAIN_CORE_TACTICS`)・`v2`(+Shadow のみ) がその系統。
- **trait は「オンチェーン trait」とは別物**: ゲーム側 `TraitType` は ruleset の derivation 設定から導出。フロントの `resolveCards` はインデックス由来カードの `trait` を **`"none"`** で入れる点に注意（trait 有効プレイは RPC 由来 or 派生設定が前提）。
- **エッジ値域/順序の差異**: engine `Edges{up,right,down,left}` 0..10、Nyano on-chain triad `{up,right,left,down}` 1..10。`packages/triad-engine/src/nyano.ts` の変換を経由する。
- **ビルド順序**: `@nyano/triad-engine` は `.js` を import する（`./engine.js`）ので **engine を先にビルド**してから web の typecheck/build（`build:web`/`release:check` がこの順）。
- **テストランナーが領域ごとに別**: engine=node `*.test.js`、web=Vitest（`environment:"node"` のため Pixi は実描画されない）、e2e=Playwright、contracts=`forge test`。
- **検証コマンド**: `pnpm release:check`（engine lint/build → web typecheck/lint/build）、`pnpm handoff:check`（+ codex doctor / motion lint）。
- **配信/オーバーレイはバックエンドレス**: BroadcastChannel → localStorage フォールバックで動く前提。スキーマ（`OverlayStateV1` 等）は外部連携の契約。
- **ドキュメント運用が必須作法**: 変更ごとに `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` と `docs/99_dev/IMPLEMENTATION_LOG.md` を更新（`AGENTS.md`）。

---

## 付録: よく使うコマンド

```bash
pnpm i                 # 依存インストール
pnpm dev:web           # フロント開発サーバ (http://localhost:5173)
pnpm test              # engine + web テスト
pnpm typecheck         # engine build → web typecheck
pnpm build:web         # engine build → web build
pnpm release:check     # リリース前チェック一式
pnpm -C packages/triad-engine test   # エンジンのみ
cd contracts && forge test           # コントラクト
```
