# commit-0038 IMPLEMENTATION LOG

## What
LoadCards / Load from chain が **"Failed to fetch"** で落ちる問題（ブラウザ→公開RPCの接続失敗）に対して、
Web UI側で **RPCフォールバック + 切替UI** を実装しました。

- 失敗しやすい公開RPCを単発で固定せず、複数候補を順に試す
- /nyano から RPC をテストして切り替えできる（localStorage override）
- エラーが出たときに「次に何をすればいいか」へ導く（Match→RPC Settings）

## Why
- 公開RPCは「混雑・制限・CORS」などでブラウザから弾かれることがある（特にイベント時に顕在化しやすい）
- ゲームが成立する以前の段階で “読めない” 体験が起きると、コミュニティ検証フローが止まる
- 運営が薄い世界観を目指すなら、インフラ依存ポイント（RPC）を吸収して復元力を上げる必要がある

## Changes
### Web UI
- Nyano Inspector:
  - RPC Settings UI を追加（Test / Use / Reset）
  - active RPC / override 状態を可視化
- Match:
  - RPC系のエラーっぽい場合に /nyano への導線を追加（RPC Settings）

### Web lib
- `apps/web/src/lib/nyano_rpc.ts`
  - 既定RPCを単一から複数候補へ（PublicNode / Ankr / Llama / Cloudflare）
  - ローカルoverride（localStorage）と last-ok RPC の保存
  - readContract に失敗した場合、RPC候補を順に試して復旧
  - 失敗Promiseを永続キャッシュしない（失敗時は cache から削除）
  - UI用に `pingRpcUrl()` を追加（chainIdで疎通確認）

### Docs
- `apps/web/README.md` を更新（/nyano で切り替え & .env 推奨）
- `apps/web/.env.example` を更新（よりブラウザ向きのRPCを例示）

## How to test
- Web:
  - `pnpm -C apps/web dev`
  - `/match` → Load Cards（失敗時は RPC Settings へ）
  - `/nyano` → RPC Settings で Test → Use this RPC → Load from chain
- Expected:
  - 何らかのRPCが生きていれば自動で復旧しやすい
  - 全滅時は actionable なエラーメッセージが出る

## Notes / Limitations
- 公開RPCは永続保証がないため、イベントで確実性が必要なら `.env` で専用RPCを指定するのが最善です。
