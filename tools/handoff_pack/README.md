# Frontend Handoff Pack (Template)

このフォルダは「フロント担当が最短で現状コードを把握できる」共有パッケージを、
ローカルの `nyano-triad-league` リポジトリから自動生成するためのテンプレートです。

## 使い方（Windows / PowerShell 推奨）
リポジトリルート（`nyano-triad-league/`）で以下を実行:

```powershell
powershell -ExecutionPolicy Bypass -File tools\make_handoff_pack.ps1
```

成功すると、リポジトリルートに `nyano-triad-league-frontend-handoff.zip` が生成されます。
それをフロント担当へ渡してください。

## 使い方（macOS/Linux / bash）
```bash
bash tools/make_handoff_pack.sh
```

## 追加すると喜ばれるもの（任意）
- `screenshots/` フォルダに
  - `/match`
  - `/stream`
  - `/overlay?controls=0`
  - `/overlay?controls=1`
  - `/replay`
  のスクショを入れてから zip すると、UI改善が爆速になります。

