# commit-0039 TODO update

## Done
- [x] `getTriad(tokenId)` が revert するケースを再現し、原因を特定（tokenId が on-chain に存在しない）
- [x] `apps/web/src/lib/nyano_rpc.ts` に `exists(tokenId)` の事前チェックを追加（revert を “未Mint/不存在” エラーへ変換）
- [x] `fetchNyanoCards()` を `Promise.allSettled` に変更し、複数 tokenId の失敗をまとめて表示
- [x] `/nyano` に「存在する tokenId のサンプル取得」ボタンを追加（`tokenByIndex()` で列挙）
- [x] `/match` の LoadCards で toast によるヒント表示（未Mint / RPC 失敗）

## Next
### UX（デッキ作成）
- [ ] wallet address から tokenId を自動インポート（`tokenOfOwnerByIndex()`）
- [ ] Deck 入力 UI に「存在確認」「無効 tokenId のハイライト」を追加
- [ ] Nyano AI / Event の初期デッキを “列挙結果” から自動セット（ハードコード排除）

### Reliability
- [ ] `chainId=1` を検証し、別チェーン RPC の誤設定を明示する
- [ ] 429/timeout のバックオフ（最小限）
