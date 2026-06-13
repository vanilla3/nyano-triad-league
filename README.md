# Nyano Triad League (ETH-only)

Nyano Peace NFTのオンチェーン属性（Triad / じゃんけん / CombatStats / Trait）を、そのままカード性能として使う **3×3 盤面制圧ゲーム**です。

- **カジュアル**：オフチェーン（0 tx）で即対戦 — **NFT・ウォレット不要で誰でも遊べます**
- **公式戦**：Ethereum上で **1 tx** で結果を確定（トランスクリプトから決定論で再計算）
- **運営がいなくても回る設計**：ルールセット/リーグ作成、解析、リプレイUIなどを第三者が作れる"プロトコル"指向

> **English**: A 3×3 board-control card game powered by on-chain Nyano Peace NFT attributes.
> Casual play is free for everyone (no NFT / no wallet needed); official matches settle on Ethereum in a single transaction, deterministically re-simulated from a transcript. The protocol is open: anyone can build rulesets, leagues, replay viewers, and indexers. See [CONTRIBUTING.md](CONTRIBUTING.md).

## 今すぐ遊ぶ (Play now)

**🎮 公開版: https://v0-nyano-triad-league.vercel.app** （インストール不要・ウォレット不要）

ローカルで動かす場合:

```bash
pnpm i
pnpm dev:web   # → http://localhost:5173
```

- `/match?mode=guest` … ゲストクイック対戦（デッキ不要・RPC不要）
- `/nyano` … カード図鑑（全カードをオフライン閲覧）
- `/decks` … デッキビルダー（おすすめデッキ自動生成つき）
- `/replay?z=...` … リプレイ共有URL（gzip圧縮transcriptをURLに内包）

## Repository layout

- `packages/triad-engine/` : 対戦ルールの純粋関数エンジン（TS・決定論）
- `contracts/` : 公式戦の決済（Foundry / TriadEngine + League + RulesetRegistry）
- `apps/web/` : フロント（Vite + React + Tailwind + Pixi）
- `docs/` : 仕様、プロトコル、運用設計
- `test-vectors/` : TS ⇔ Solidity の実装一致を保証する共有テストベクタ
- `rulesets/` : 公式オンチェーンルールセットの registry JSON

## コミュニティで作る (Build with the community)

第三者ツールを作るための入口:

- **プロトコル仕様**: `docs/02_protocol/`（transcript / ruleset id / events / state_json v1）
- **自律運営ロードマップ**: `docs/03_autonomy/`（Phase A〜D: 決済固定 → イベント公開 → 許可不要レジストリ → リーグファクトリ）
- **コントリビュートガイド**: [CONTRIBUTING.md](CONTRIBUTING.md) / [行動規範](CODE_OF_CONDUCT.md)
- **ライセンス**: [MIT](LICENSE) — フォーク・改変・再配布は自由です

## Docs

- Design Document v2（Deep Strategy Edition）: `docs/01_design/Nyano_Triad_League_Design_Document_v2.docx`
- Protocol specs（トランスクリプト/ルールセット/イベント）: `docs/02_protocol/`
- Autonomy roadmap（自律運営までの道筋）: `docs/03_autonomy/`
- Dev TODO / Implementation log: `docs/99_dev/`

## Quick start (triad-engine)

```bash
pnpm i
pnpm -C packages/triad-engine test
```

## Development workflow (important)

- 変更のたびに `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` を更新
- 変更のたびに `docs/99_dev/IMPLEMENTATION_LOG.md`（ログ）を追記
- 1コミット = 1まとまり（Why/What/Verify）
- リリース前チェック: `pnpm release:check`

---
Contract reference (Nyano Peace): https://etherscan.io/token/0xd5839db20b47a06Ed09D7c0f44d9c2A4f0A6fEC3#code

License: MIT
