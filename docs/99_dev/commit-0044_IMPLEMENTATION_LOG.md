# commit-0044 IMPLEMENTATION LOG

## What
配信体験の“視聴者参加”を成立させるため、投票状況を OBS Overlay に表示できるようにしました。

- /stream: vote state を broadcast（OPEN/CLOSED、残り秒数、Top votes、投票数）
- /overlay: vote state を購読し、投票中のみコンパクトに表示（vote=0 で非表示）
- overlay: last move の flip 数を推定し、視覚的にハイライト（sky ring）

また、前回パッチで /stream の内容が古い版に戻るリスクがあったため、
本コミットでは **投票コンソール（Nyano vs Chat prototype）** を含む最新の Stream Studio を同梱して整合性を回復しました。

## Why
配信におけるUIは「理解の速度」が命です。  
投票の存在と残り時間、どの手が優勢かが一瞬で分かると、視聴者は参加しやすくなります。fileciteturn1file0

## Manual test checklist
- /stream を開く
- Host match を /match?stream=1 で開く（別タブ）
- /overlay?controls=1 を開く（別タブ）
- /stream で Start vote → votes を追加
- overlay で OPEN/残り秒数/Top votes が見える
- End & send で overlay の vote UI が消える
