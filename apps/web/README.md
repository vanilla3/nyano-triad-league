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

## RPC 設定（任意）

デフォルトでは `https://cloudflare-eth.com` を利用します。  
混雑や制限がある場合は、`apps/web/.env` を作成して差し替えてください。

`apps/web/.env.example`:

```bash
VITE_RPC_URL="https://your-mainnet-rpc.example"
VITE_NYANO_ADDRESS="0xd5839db20b47a06Ed09D7c0f44d9c2A4f0A6fEC3"
```

> `VITE_NYANO_ADDRESS` は Nyano Peace NFT のコントラクトアドレスです。
