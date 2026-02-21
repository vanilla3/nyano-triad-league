# デプロイ手順（Vercel + Railway）v1

目的：
- **Vercel**：フロント（Vite/React）を高速に配信
- **Railway**：将来の拡張用バックエンド（例：nyano-warudo / エラートラッキング / 画像生成プロキシ）

> 現状のリポジトリは **フロント中心**です。
> Railway は「バックエンドを置く場所」として先に型を作っておくと、後々ラクになります。

---

## 0. 事前確認（ここで詰まるポイント）

### 0-1. パッケージマネージャ
- このリポジトリは **pnpm** を前提にしています。
- `package-lock.json` があるとデプロイ側の自動判定がブレることがあるので、残さない方針が安全です。

### 0-2. SPA（React Router）
- Vite の SPA は、**直URLアクセス**（例：`/battle`）で 404 になりがちです。
- Vercel 側で `index.html` へリライト（fallback）を入れます。
- ルートに `vercel.json` を置く運用が分かりやすいです。

### 0-3. 環境変数（Vite）
- フロントで参照する env は **`VITE_` プレフィックス**が必須。
- 例：`VITE_RPC_URL` / `VITE_NYANO_ADDRESS` など。

---

## 1. Vercel（フロント）デプロイ

### 1-1. 推奨構成
- **Root Directory**：リポジトリルート
- **Build Command**：`pnpm build:web`
- **Output Directory**：`apps/web/dist`
- **Install Command**：`pnpm install --frozen-lockfile`

> モノレポ（shared package を含む）なので、`apps/web` を Root にすると workspace 参照が詰まることがあります。

### 1-2. 手順（GUI）
1) Vercel にログイン → New Project
2) GitHub リポジトリを Import
3) 設定（Build & Development Settings）
   - Root Directory：空（ルート）
   - Install Command：`pnpm install --frozen-lockfile`
   - Build Command：`pnpm build:web`
   - Output Directory：`apps/web/dist`
4) Environment Variables を追加（Production / Preview それぞれ）
5) Deploy

### 1-3. `vercel.json`（SPA fallback）
- ルートの `vercel.json` で、全パスを `index.html` にリライトします。
- 既にファイルを追加済み：`/vercel.json`

---

## 2. Vercel：環境変数一覧（現状コードから抽出）

`apps/web/src` の `import.meta.env` 参照から抽出したものです。

| 変数 | 必須 | 用途 | 例 |
|---|---:|---|---|
| `VITE_RPC_URL` | △ | RPC URL | `https://...` |
| `VITE_NYANO_ADDRESS` | △ | Nyano コントラクトアドレス | `0x...` |
| `VITE_NYANO_METADATA_BASE` | △ | メタデータ base URL | `https://.../` |
| `VITE_NYANO_WARUDO_BASE_URL` | △ | nyano-warudo 連携先 | `https://<railway-domain>` |
| `VITE_ERROR_TRACKING_MODE` | ○ | エラー追跡モード | `off` / `local` / `remote` |
| `VITE_ERROR_TRACKING_ENDPOINT` | △ | remote の送信先 | `https://<railway-domain>/v1/telemetry` |
| `VITE_ERROR_TRACKING_SAMPLE_RATE` | × | 送信サンプル率 | `0.05` |
| `VITE_ERROR_TRACKING_DEBUG` | × | debug ログ | `true/false` |

※「必須」は、サイトの目的（NFT連携/Warudo連携/テレメトリ）により変わります。

---

## 3. Railway（バックエンド）デプロイ

### 3-1. 何を Railway に置くか（おすすめ）
- `nyano-warudo`：スクショ/リプレイ/外部連携の受け口
- `telemetry`：`VITE_ERROR_TRACKING_ENDPOINT` の受け口（収集→ログ/DB/Slack 等）
- `image-gen`：Gemini 画像生成APIの **プロキシ**（キーをフロントへ出さない）

> まだバックエンド実装が無い場合は、**Railway は先にプロジェクトだけ作っておく**のが◎。

### 3-2. 手順（GUI）
1) Railway にログイン → New Project
2) 「Deploy from GitHub Repo」または Empty service
3) Service Settings
   - Root Directory：バックエンドの場所に合わせる（モノレポならここ重要）
   - Build Command / Start Command：必要なら上書き
4) Variables
   - Secret（APIキー等）は Railway の Variables で管理
   - 必要なら Shared Variables / Sealed Variables を使う
5) Domain
   - `RAILWAY_PUBLIC_DOMAIN` を確認
6) Vercel 側の `VITE_*_BASE_URL` を Railway ドメインへ向ける

### 3-3. Start Command の注意
- Railway は自動推定しますが、モノレポや複数サービスでは **明示指定**が安全です。
- Node サービスは **`PORT` を listen** する必要があります（Railway が割り当て）。

### 3-4. Config as Code（railway.toml / railway.json）
- Railway は `railway.toml` / `railway.json` で **デプロイ設定をコード管理**できます。
- モノレポで Root Directory を変える場合でも、Config file のパスは **絶対パス**指定が必要になる点に注意。

---

## 4. “古い情報”の疑いポイント（このリポジトリ周り）

- `package-lock.json` が残っている場合：pnpm前提の運用と矛盾しやすい
- 「GitHub Pages 前提の base path」など：Vercel は基本ルート配信なので前提が変わる
- SPA fallback：Vercel の設定が無いと直URLアクセスで詰む

