# Codex Agent Guide — packages/triad-engine

ここは対戦ルールの **決定論エンジン**（pure-ish）です。
最重要は「transcript からの再現性」と「TS ↔ Solidity の整合」です。

---

## 0) Invariants

- **決定論**：同じ入力 → 同じ出力。乱数/時刻/外部 I/O で結果が揺れない。
- **互換**：transcript/codec のフォーマットを破壊しない。
- **テストベクタ尊重**：`test-vectors/` と既存テストを壊さない。

---

## 1) コマンド

```bash
pnpm -C packages/triad-engine build
pnpm -C packages/triad-engine test
```

---

## 2) 入口ファイル

- 主要エンジン: `src/engine.ts`
- 型定義: `src/types.ts`
- transcript: `src/transcript.ts` / `src/transcript_codec.ts`
- Nyano 属性導出: `src/nyano.ts`

---

## 3) 変更方針

- 仕様変更はまず docs（`docs/02_protocol`）と整合を取り、テストを先に足す。
- リファクタは「挙動固定（テスト）→ 置換」の順で、小さく。
- なるべく関数を純粋に保ち、状態を持つ設計に寄せない。
