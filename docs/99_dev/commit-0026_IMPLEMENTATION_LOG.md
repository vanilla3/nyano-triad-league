# commit-0026 — Implementation Log（差分）

## Why
- “運営がいなくなっても勝手に盛り上がる”の根っこは、**検証の入口の軽さ**と**共有の簡潔さ**。
- これまでは公式テストベクタ中心で、Nyano実物（tokenId）を使った検証がしづらかった。
- コミュニティは「このtokenId、どんな性能？」と「このtranscript、本当に再現できる？」を繰り返すため、
  read-only で
  1) オンチェーン属性の観察
  2) transcript貼り付け→再現
  の導線を用意する必要がある。

## What
### Web UI
- 新ページ追加
  - `/nyano`：tokenId を入力し、オンチェーン属性を読み出して CardData に変換して表示
  - `/replay`：transcript JSON を貼り付け、デッキ tokenId をオンチェーンから読み出して再現（v1/v2/compare対応）
- ナビゲーションに追加（Home/Playground/Replay/Nyano/Rulesets）

### RPC module
- `apps/web/src/lib/nyano_rpc.ts`
  - viem public client（mainnet）
  - `fetchNyanoCard` / `fetchNyanoCards`（cache付き）
  - env: `VITE_RPC_URL`, `VITE_NYANO_ADDRESS`（デフォルトあり）

### Transcript import
- `apps/web/src/lib/transcript_import.ts`
  - Playground の “Copy transcript JSON” 形式（BigInt→string）を受け取り、TranscriptV1 に復元

### DX
- `apps/web/.env.example`
- `apps/web/README.md` 更新

## Verify
- `pnpm -C apps/web dev`
- `/nyano` で tokenId 読み込み → CardMini 表示
- `/replay` で transcript 貼り付け → デッキ読み取り → 再現（v1/v2/compare）
