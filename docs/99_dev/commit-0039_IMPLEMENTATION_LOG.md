# commit-0039 IMPLEMENTATION LOG

## What
`LoadCards` で **The contract function "getTriad" reverted** が発生する件に対応しました。

これは RPC の不調ではなく、**指定した tokenId が on-chain に存在しない（未Mint）** 場合に起きます。
Nyano Peace コントラクト側は `getTriad/getTrait/getCombatStats` で `requireMinted` 相当を通すため、
存在しない tokenId を叩くと revert します。

## Why
- デッキに tokenId を手入力している現状では、存在しないIDを混ぜやすい
- NFTの tokenId は「1,2,3…が必ず存在する」設計とは限らず、VRF等でランダム配布されることがある
- ゲームとしては “落ちる” よりも “直し方が分かる” ほうが重要（コミュニティ検証が止まらない）

## Changes
### Web lib
- `apps/web/src/lib/nyano_rpc.ts`
  - ABI に `exists/tokenByIndex/totalSupply` 等を追加
  - `fetchNyanoCard()` で `exists(tokenId)` を事前チェックし、未Mintを **NyanoTokenNotMintedError** として扱う
  - `fetchNyanoCards()` を `Promise.allSettled()` に変更し、複数 tokenId の失敗をまとめて返す

### Web UI
- `apps/web/src/pages/Nyano.tsx`
  - 「サンプル（存在するtokenId）を取得」ボタンを追加（列挙で取得 → 入力欄に反映）
  - 例の tokenId は “存在しない可能性あり” を明示

- `apps/web/src/pages/Match.tsx`
  - LoadCards の失敗時に toast を出し、/nyano で検証できることを示す

## How to test
- Web:
  - `pnpm -C apps/web dev`
  - `/nyano` → 「サンプル（存在するtokenId）を取得」→ Load from chain
  - `/match` → Deck に存在しない tokenId を混ぜて LoadCards → “存在しない tokenId” が分かる形で表示される

## Notes / Limitations
- 今回は “落ちない” ことと “原因が分かる” ことを優先。
- 次は Deck 作成 UI を改善し、wallet address から tokenId をインポートできるようにして入力ミス自体を減らします。
