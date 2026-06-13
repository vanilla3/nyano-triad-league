# デプロイ手順（Vercel + Railway） v1

> 目的：NYTL を「とりあえず動く」ではなく、継続運用できる形でデプロイする。
>
> 前提：フロント（Vite/React）は Vercel、将来のサーバー/API（例：画像生成、署名付き処理、秘密鍵/秘密APIキーが必要な処理）は Railway 側に寄せる。

---

## 1. 現状の構成（monorepo）

- ルート：pnpm workspace
- フロント：`apps/web`（Vite）
- ビルド成果物：`apps/web/dist`

---

## 2. Vercel（フロント）

### 2.1 推奨：Vercel の Project 設定

Vercel プロジェクト作成後、Build & Output Settings を以下にする（monorepo前提）。

- **Root Directory**：リポジトリルート（変更しない）
- **Install Command**：`pnpm install --frozen-lockfile`
- **Build Command**：`pnpm build:web`
- **Output Directory**：`apps/web/dist`

> 注意：Root Directory を `apps/web` にしても動くが、その場合 Output は `dist` になり、設定が変わる。

### 2.2 SPA ルーティング（Refresh で 404 を防ぐ）

React Router を BrowserHistory で使っているため、Vercel 側で **全パスを index.html にリライト**する。

このリポジトリの `vercel.json` を使う（ルートに置く）。

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 2.3 環境変数

- 原則としてフロントに **秘密情報を入れない**。
- Vite の環境変数は `VITE_` プレフィックスが必要。

現状、フロント単体で必須の環境変数は基本なし（将来の拡張で追加）。

---

## 3. Railway（バックエンド/API）

### 3.1 Railway を使う理由

- Gemini 等の **秘密APIキー**（画像生成など）をフロントに置かない。
- 署名・検証・レート制限など「サーバーが必要」な責務を分離。

### 3.2 いまの段階で決めておくべき項目

- どの機能をサーバー化するか（例：
  - 画像生成（Gemini）
  - リプレイ保存/共有の永続化
  - NFT/chain 連携の署名が必要な処理
）
- API の URL（例：`https://nytl-api.up.railway.app`）
- フロントから呼ぶ場合の CORS 方針

### 3.3 典型の構成案（例）

- `apps/api` を追加し、Node/Express(or Hono/Fastify) で `/api/*` を提供。
- Railway では `Start Command` を `pnpm -C apps/api start` 等にする。
- 環境変数は Railway 側で管理（例：`GEMINI_API_KEY`）。

---

## 4. 古い情報を踏まえた注意点（このリポジトリ内）

- GitHub Pages のような **サブパス配下**も想定しているため、`apps/web/src/lib/appUrl.ts` が `import.meta.env.BASE_URL` を参照する。
  - Vercel は通常 `/` 配下なので問題なし。

---

## 5. チェックリスト

- [ ] `pnpm -C apps/web build` が通る
- [ ] Vercel で `/match` や `/replay` を **直叩き（直URLアクセス）しても表示**される（リライトが効いている）
- [ ] Lighthouse で極端に重くない（モーションや背景が端末で暴れない）
- [ ] `prefers-reduced-motion` が効いて「止まる」

