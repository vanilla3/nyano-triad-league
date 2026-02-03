# commit-0024 — Implementation Log（差分）

## Why
- このプロジェクトの核心は **「運営が消えても検証と共有が回る」** こと。
- そのために必要なのは、まず “対戦結果の再現” を誰でもできる形で提供すること。
- しかし UI が存在しない状態だと、コミュニティはコードを読むしかなく、議論が持続しません。
- よって今回は、最小の“運営不要”インフラとして  
  - **リプレイ可能なUI**
  - **UIが依存できる安定したエンジン出力（boardHistory）**
  - **transcript の共通符号化（hex codec）**
  を揃えます。

## What
### 1) triad-engine: boardHistory を追加
- `simulateMatchV1WithHistory()` を追加
  - `boardHistory[0]` は初期盤面
  - `boardHistory[1..9]` は各ターン後の盤面スナップショット
- これにより UI 側は「再計算やロジック複製なし」にリプレイを描画できます。

### 2) triad-engine: transcript codec を追加
- `decodeTurnsFromHex()` / `encodeTurnsToHex()` を追加
- test-vectors（movesHex 等）や外部ツールが **同一表現** で transcript を扱えるようにしました。

### 3) apps/web: Playground UI を追加
- Vite + React + Tailwind で軽量なUI基盤を用意
- 公式テストベクタを読み込み、ケース選択 → 再現 → リプレイ
- Turn log と board を同期し、対戦の“読み物化”を支える

## Notes / Open Questions
- 次の段階で “現物 Nyano NFT” を UI に流し込みます（RPCで tokenId を読んで CardData 化）。
- リプレイ共有は URL で完結させたい（圧縮 + hash 格納）。改ざん検出（hash）も同時に検討。
