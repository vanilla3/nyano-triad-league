# Nyano Triad League (ETH-only)

Nyano Peace NFTのオンチェーン属性（Triad / じゃんけん / CombatStats / Trait）を、そのままカード性能として使う **3×3 盤面制圧ゲーム**です。

- **カジュアル**：オフチェーン（0 tx）で即対戦
- **公式戦**：Ethereum上で **1 tx** で結果を確定（トランスクリプトから決定論で再計算）
- **運営がいなくても回る設計**：ルールセット/リーグ作成、解析、リプレイUIなどを第三者が作れる“プロトコル”指向

## Repository layout (initial)
- `packages/triad-engine/` : 対戦ルールの純粋関数エンジン（TS）
- `contracts/` : 公式戦の決済（予定：TriadEngine + League）
- `apps/web/` : フロント（予定）
- `docs/` : 仕様、プロトコル、運用設計

## Docs
- Design Document v2（Deep Strategy Edition）: `docs/01_design/Nyano_Triad_League_Design_Document_v2.docx`
- Protocol specs（トランスクリプト/ルールセット/イベント）: `docs/02_protocol/`
- Autonomy roadmap（自律運営までの道筋）: `docs/03_autonomy/`
- Dev TODO / Implementation log template: `docs/99_dev/`

## Quick start (triad-engine)
```bash
pnpm i
pnpm -C packages/triad-engine test
```

## Development workflow (important)
- 変更のたびに `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` を更新
- 変更のたびに `docs/99_dev/IMPLEMENTATION_LOG.md`（ログ）を追記
- 1コミット = 1まとまり（Why/What/Verify）

---
Contract reference (Nyano Peace): https://etherscan.io/token/0xd5839db20b47a06Ed09D7c0f44d9c2A4f0A6fEC3#code

Generated: 2026-02-01
