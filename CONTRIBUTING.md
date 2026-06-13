# Contributing to Nyano Triad League

[English follows Japanese / 英語は日本語の後にあります]

Nyano Triad League は「運営がいなくても回る」プロトコル指向のゲームです。
ルールセット・リーグ・リプレイビューア・解析ツールなど、第三者による拡張を歓迎します。

## はじめに（セットアップ）

```bash
pnpm i
pnpm test            # エンジンのテスト
pnpm -C apps/web dev # フロント開発サーバー
```

NFT やウォレットがなくても遊べます・開発できます:

- `/match?mode=guest` — ゲストクイック対戦（RPC 不要）
- `/nyano` — カード図鑑（バンドル済み game index でオフライン閲覧）
- RPC が必要な機能は `.env`（`apps/web/.env.example` 参照）または `/nyano` の RPC Settings から設定できます

## 絶対に壊してはいけない不変条件（Invariants）

1. **決定論**: transcript から結果が再現できること（`packages/triad-engine` は純粋関数）
2. **URL 互換**: 既存の Match/Replay の URL パラメータ・共有リンクを壊さない
3. **プロトコル安定**: `state_json v1` / viewer command / `streamer_bus` の形状を UI 都合で変えない
4. **WebGL フォールバック**: Pixi 初期化失敗でも操作できる UI を残す

## 変更の作法

- 1 PR = 1 まとまり（Why / What / Verify を PR テンプレに沿って記述）
- 変更のたびに `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` を更新
- 変更のたびに `docs/99_dev/IMPLEMENTATION_LOG.md` に追記
- UI 文言は日本語ファースト。文字化け検査（`pnpm lint:text`）が CI で走ります
- モーションは `--mint-motion-*` トークンを使用（`transition:` にミリ秒リテラル直書き禁止。ガードテストあり）

## 検証コマンド

```bash
pnpm release:check        # lint + typecheck + build 一式
pnpm -C apps/web test     # フロント unit テスト
pnpm -C apps/web e2e:ux   # UX ガードレール e2e
cd contracts && forge test  # コントラクト
```

## 第三者ツールを作りたい方へ

プロトコル仕様は `docs/02_protocol/` にあります:

- トランスクリプト形式: `Nyano_Triad_League_TRANSCRIPT_SPEC_v1_ja.md`
- ルールセット ID（keccak256 による決定論的 ID）: `Nyano_Triad_League_RULESET_ID_SPEC_v1_ja.md`
- イベントログ（インデクサ向け）: `Nyano_Triad_League_EVENTS_SPEC_v1_ja.md`
- 共有テストベクタ: `test-vectors/`（TS と Solidity の実装一致を保証）

リファレンス実装は `packages/triad-engine`（TypeScript）と `contracts/`（Solidity）です。

---

# Contributing (English)

Nyano Triad League is a protocol-oriented game designed to "run without operators."
Third-party rulesets, leagues, replay viewers, and analytics tools are welcome.

## Getting started

```bash
pnpm i
pnpm test            # engine tests
pnpm -C apps/web dev # frontend dev server
```

You can play and develop **without any NFT or wallet**:

- `/match?mode=guest` — guest quick play (no RPC needed)
- `/nyano` — card codex (offline browsing via the bundled game index)

## Invariants (never break these)

1. **Determinism**: results must be reproducible from the transcript (pure-function engine)
2. **URL compatibility**: do not break existing Match/Replay URL params or share links
3. **Protocol stability**: do not reshape `state_json v1` / viewer commands / `streamer_bus` for UI convenience
4. **WebGL fallback**: the UI must stay operable when Pixi fails to initialize

## Workflow

- One PR = one coherent change (Why / What / Verify in the PR template)
- Update `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` and append to `docs/99_dev/IMPLEMENTATION_LOG.md` with every change
- UI copy is Japanese-first; `pnpm lint:text` (mojibake check) runs in CI
- Use `--mint-motion-*` tokens for motion (no literal durations in `transition:`; a guard test enforces this)

## Building third-party tools

Protocol specs live in `docs/02_protocol/` (transcript format, ruleset IDs, event logs).
Shared test vectors in `test-vectors/` keep the TypeScript and Solidity engines aligned.
Reference implementations: `packages/triad-engine` (TS) and `contracts/` (Solidity).
