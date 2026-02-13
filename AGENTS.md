# Codex Agent Guide — Nyano Triad League

このリポジトリは **Nyano Peace NFT** のオンチェーン属性をカード性能として使う、**3×3 盤面制圧ゲーム**（オフチェーン即対戦 + 公式戦は1tx確定）です。

Codex が迷わず高品質に作業できるように、プロジェクトの「守るべき不変条件」「よく使うコマンド」「変更の作法」を最小限でまとめます。

---

## 0) リポジトリ構成（最重要）

- `apps/web/` : Web フロント（Vite + React + TS + Tailwind + Pixi）
- `packages/triad-engine/` : 対戦エンジン（純粋関数・決定論・TS）
- `contracts/` : 公式戦のオンチェーン検証/決済（Foundry）
- `docs/` : 仕様（UI/プロトコル/運用/設計）

各ディレクトリに `AGENTS.md` を置き、詳細ルールはそこで上書きします（Codex は階層的に読み込みます）。

---

## 1) 絶対に壊してはいけない不変条件（Invariant）

1. **決定論の維持**：transcript から結果が再現できること（UI 改修でもロジック・codec を破壊しない）。
2. **URL互換の維持**：既存の Match/Replay の URL パラメータや share link を壊さない。
3. **プロトコルの安定**：`state_json v1` / viewer command / `streamer_bus` の形状は慎重に扱う（UI のために schema を変えない）。
4. **WebGL 失敗のフォールバック**：Pixi 初期化失敗でも詰まらずに操作できる UI を残す。

---

## 2) よく使うコマンド（必ず実行して検証）

### ルート
```bash
pnpm i
pnpm test
pnpm build:web
pnpm release:check
```

### フロント
```bash
pnpm -C apps/web dev
pnpm -C apps/web test
pnpm -C apps/web typecheck
pnpm -C apps/web build
```

### エンジン
```bash
pnpm -C packages/triad-engine test
pnpm -C packages/triad-engine build
```

### コントラクト
```bash
cd contracts
forge test
```

---

## 3) 変更の作法（Codex の作業手順）

- **大きめの改修は、先に実行計画（ExecPlan）を書く**
  - `codex/PLANS.md` の型に沿って、目的・非ゴール・手順・検証を文章化してから着手。
  - 目標は「長い自律作業でも迷子にならない」こと。
- **UI/UX を上げるほど、テストと観測性は強くする**
  - 破壊的変更は避け、可能なら **小さな差分の積み上げ**（1PR=1まとまり）。
- **ドキュメント運用**
  - 変更のたびに `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` を更新。
  - 変更のたびに `docs/99_dev/IMPLEMENTATION_LOG.md` を追記。

---

## 4) 参照すべきドキュメント（UI/UX 改善の芯）

- UI 分析フレーム: `docs/03_frontend/UI_ANALYSIS.md`
- フロント構造: `docs/03_frontend/Nyano_Triad_League_FRONTEND_CODEMAP_v1_ja.md`
- 依頼/安全な変更範囲: `docs/03_frontend/Nyano_Triad_League_FRONTEND_COLLAB_SPEC_v1_ja.md`
- UI トーン: `docs/01_product/Nyano_Triad_League_UI_STYLE_GUIDE_v1_ja.md`
- プロダクト/UI 仕様: `docs/01_product/Nyano_Triad_League_GAME_UI_SPEC_v1_ja.md`

---

## 5) Done の基準（最低限）

- 変更対象に応じてテスト/ビルドが通ること（上記コマンド）。
- 体験が改善していること（before/after スクショ or 具体的な操作手順）。
- Invariant を破っていないこと。
