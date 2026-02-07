# commit-0072 IMPLEMENTATION LOG

## Summary
- **P1-1（DONE）**: TurnLog の flipTraces 表示を `flipTraceDescribe.ts` に統合
  - badges: `flipTraceShort()`
  - 詳細: `flipTraceFull()`
  - summary: `flipTracesSummary()`
- TurnLog の表示を **配信/観戦向け**に微調整
  - 盤面セルは `A1..C3` の座標表示を優先（viewer提案フォーマットと整合）
  - 既存の stray JSX を除去し、TSXとして破綻しない形に整形

---

## Why
- flipTraces は「なぜ奪取が起きたか」の核心ですが、
  表示が複数箇所に分散すると **用語/表現がズレて** 観戦の理解を阻害します。
- `flipTraceDescribe.ts` に **短文/詳細/要約/読み上げ** が揃っているため、
  TurnLog 側はそこへ寄せるのが最短で “一貫した体験” を作れます。
- `A1..C3` 表記に揃えることで、
  `/stream` の視聴者提案（`#triad A2->B2`）とログの座標感覚が一致します。

---

## What
- `apps/web/src/components/FlipTraceBadges.tsx`
  - badges を `flipTraceShort()` の出力へ統合
  - 詳細パネルを `flipTraceFull()` の出力へ統合
- `apps/web/src/components/TurnLog.tsx`
  - turn header / delta 表示を `A1..C3` 優先に統一
  - `flipTracesSummary()` を turn header のバッジとして追加
  - stray JSX を除去（TSX破綻を回避）

---

## Verify
- `/match` を開き、右側 TurnLog で以下を確認
  - 1行目に **奪取要約** が表示される（例: `2枚奪取 / chain×1`）
  - badges / 詳細が日本語の理由表示になっている
  - cell 表記が `B2` のような座標中心で読める
- `/replay` でも TurnLog が同様に読める
