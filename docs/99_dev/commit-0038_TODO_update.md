# commit-0038 TODO update

## Done
- [x] 公開RPCの "Failed to fetch" に対して複数RPCフォールバックを実装
- [x] /nyano に RPC Settings（Test / Use / Reset）を追加
- [x] Match 側でRPC復旧導線（RPC Settings へのリンク）を追加
- [x] 失敗Promiseのキャッシュ永続化を回避（リトライ可能に）

## Next
### UI/UX（ゲーム体験寄り）
- [ ] Arena/Match の勝敗演出（結果の“気持ちよさ”、ターンの視線誘導）
- [ ] Replay の共有導線をさらに短縮（ワンクリック共有 / OGP検討）
- [ ] Nyano AI 対戦の土台（難易度別の意思決定：easy/normal、seed固定の再現性）

### Infra / Reliability
- [ ] RPC の候補を UI で選べる「プリセット一覧」として整理（provider名表示）
- [ ] 429頻発時のバックオフ/リトライ戦略を追加（最小限）
- [ ] 将来: serverless proxy（CORS回避）をオプションとして設計
