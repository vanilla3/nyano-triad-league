# commit-0024 TODO update（差分）

## Done（commit-0024）
- triad-engine に **boardHistory**（初期 + 9ターンの盤面スナップショット）を追加  
  - リプレイUI/検証UIの基礎データとして使える形にした
- triad-engine に **transcript codec**（`decodeTurnsFromHex` / `encodeTurnsToHex`）を追加  
  - test-vectors / UI / 外部ツールが同じ表現に寄せられる
- `apps/web` を “予定” から **実体のある Playground UI** に昇格  
  - 公式テストベクタからケース選択 → 再現 → リプレイ  
  - ルールセット v1 / v2（Shadow）を UI で比較できる導線
- ルート scripts を補強（`dev:web`, `build:web`, `test:engine`）

## Next（commit-0025）
- Web Playground に **Nyano NFT（tokenId）入力 → RPC読み込み → CardData化** を追加  
  - “テストベクタ” から “現物” へ
- Web に **transcript 編集UI** を追加（moves/marks/earthBoostEdges の encode/decode）
- リプレイ共有を「URLで完結」させる（transcript+deck を圧縮して hash に載せる）
- M5系：テストネット総合リハーサルの手順書と E2E チェックリストを更新
