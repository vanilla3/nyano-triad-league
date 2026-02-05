# commit-0056 IMPLEMENTATION LOG

## What
- state_json v1: strictAllowed を明示（allowlist + hash）
  - allowlist = legalMoves.viewer を正規化した文字列の配列（sorted）
  - hash = FNV-1a(32) の安定ハッシュ（dedupe / change-detection 用）
- state_json v1: status を追加（finished/winner/tiles/matchId を best-effort で含める）
- transcript download: result(status) を含めて「1ゲーム分サンプル」として渡しやすく
- viewer command parser: 入力の揺れ吸収を強化
  - unicode 矢印（→/⇒ 等）を `->` に正規化
  - "<card> <cell>" 形式（例: `#triad 3 B2`）も許容

## Why
nyano-warudo 側の strictAllowed を “投票開始時点で固定” しやすくし、荒れにくい視聴者参加を実現するため。  
また、開発確定に必要な「実戦サンプル」を結果つきで共有できるようにする。

## Manual test checklist
- /stream:
  - vote start → state_json + ai_prompt がONの時、state_jsonに strictAllowed/hash が含まれる
  - Download transcript に result(status) が含まれる
- chat parse:
  - `#triad A2→B2`
  - `#triad 3 B2`
  が move として解釈される
