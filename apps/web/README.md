# Nyano Triad League - Web UI (Vite + React)

このWeb UIは、**運営が薄くてもコミュニティが検証・共有・再現を回せる**ことを最優先に作ります。

- Playground：公式テストベクタを再現し、盤面をリプレイする（検証の起点）
- Replay：transcript JSON を貼り付けて、オンチェーン属性を読み取り再現する（共有の中心）
- Nyano：tokenId を入力してカード性能に変換して観察する（実物を語る土台）
- Rulesets：公式 rulesetId スナップショット（合意の核）

## Dev

```bash
pnpm i
pnpm -C packages/triad-engine build
pnpm -C apps/web dev
```

## RPC 設定（任意 / 推奨）

ブラウザからMainnetのデータを読むために RPC が必要です。  
公開RPCは **CORS / 混雑 / レート制限**で「Failed to fetch」になることがあります。

### ✅ まずは UI で切り替え（簡単）

`/nyano` の **RPC Settings** から、RPC を試験して切り替えできます（localStorage に保存）。

- 「Test」で疎通確認（chainId=0x1 を期待）
- 「Use this RPC」で適用
- 「Reset」で env/default に戻す

### ✅ 確実にするなら .env（本番向け）

`apps/web/.env` を作成して差し替えてください（最も安定）。

`apps/web/.env.example`:

```bash
VITE_RPC_URL="https://your-mainnet-rpc.example"
VITE_NYANO_ADDRESS="0xd5839db20b47a06Ed09D7c0f44d9c2A4f0A6fEC3"
```

> `VITE_NYANO_ADDRESS` は Nyano Peace NFT のコントラクトアドレスです。
