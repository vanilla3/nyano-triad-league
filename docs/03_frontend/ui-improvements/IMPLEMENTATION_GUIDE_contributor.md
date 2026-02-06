# 🎮 Nyano Triad League — UI "ゲーム感" 向上パッチ

## 概要

3つの改善を **破壊が少なく、効果が大きい** 順に実装します。

| # | ページ | 改善内容 | 影響範囲 |
|---|--------|---------|---------|
| 1 | `/match` | 盤面フリップ演出（短いアニメ） | Match.tsx + 新コンポーネント |
| 2 | `/replay` | 結果バナー（常設）へ切替 | Replay.tsx のみ |
| 3 | `/stream` | 運用情報HUDを最上部へ | Stream.tsx + 新コンポーネント |

---

## 新規ファイル

```
components/
├── BoardFlipAnimator.tsx     ← NEW: ボード遷移アニメーション管理
└── StreamOperationsHUD.tsx   ← NEW: Stream運用情報HUD

css/
└── game-animations.css       ← NEW: アニメーションCSS追加分
```

---

## 🔧 改善1: `/match` 盤面フリップ演出

### ステップ1: インポート追加

```tsx
// Match.tsx 先頭のインポートに追加
import { useBoardFlipAnimation, LastMoveFeedback } from "@/components/BoardFlipAnimator";
```

### ステップ2: Hook呼び出し

`Match.tsx` の `boardNow` 定義の直後（約 L350付近）に追加:

```tsx
const boardNow = sim.ok ? sim.previewHistory[turns.length] ?? EMPTY_BOARD : EMPTY_BOARD;

// ── NEW: Board flip animation tracking ──
const boardAnim = useBoardFlipAnimation(boardNow as any[], sim.ok);
```

### ステップ3: resetMatch にクリア処理追加

```tsx
const resetMatch = React.useCallback(() => {
  setTurns([]);
  setDraftCell(null);
  setDraftCardIndex(null);
  setDraftWarningMarkCell(null);
  setSelectedTurnIndex(0);
  setAiNotes({});
  setSalt(randomSalt());
  setDeadline(Math.floor(Date.now() / 1000) + 24 * 3600);
  boardAnim.clear(); // ← ADD
}, [boardAnim]); // ← boardAnim を依存配列に追加
```

### ステップ4: Draft Moves の Board グリッドを更新

Draft Moves セクションの `<div className="grid grid-cols-3 gap-2">` を以下に差し替え:

```tsx
<div className="grid grid-cols-3 gap-2">
  {Array.from({ length: 9 }, (_, idx) => {
    const cell = (boardNow as any)[idx] as any;
    const occupied = Boolean(cell);
    const selected = draftCell === idx;
    const disabled = occupied || used.cells.has(idx);
    const isPlaced = boardAnim.placedCell === idx;
    const isFlipped = boardAnim.flippedCells.includes(idx);

    return (
      <button
        key={idx}
        disabled={disabled || turns.length >= 9 || isAiTurn}
        onClick={() => setDraftCell(idx)}
        className={[
          "aspect-square rounded-xl border p-2 text-left",
          "transition-all duration-200",
          selected
            ? "border-nyano-500 ring-2 ring-nyano-400/40 bg-nyano-50/30"
            : "border-surface-200",
          disabled || isAiTurn
            ? "bg-surface-50"
            : "bg-white hover:bg-surface-50 hover:border-surface-300",
          isPlaced && "animate-cell-place ring-4 ring-flip/40 shadow-flip",
          isFlipped && "animate-cell-flip ring-4 ring-chain/40 shadow-chain",
        ].join(" ")}
      >
        {cell ? (
          <CardMini card={cell.card} owner={cell.owner} subtle />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-surface-400 font-mono">
            {idx}
          </div>
        )}
      </button>
    );
  })}
</div>
```

### ステップ5: Turn Log の BoardView にアニメーション props を追加

Turn Log セクションの `<BoardView>` を更新:

```tsx
<BoardView
  board={boardNow as any}
  focusCell={null}
  placedCell={boardAnim.placedCell}
  flippedCells={boardAnim.flippedCells}
/>
```

### ステップ6: Last Move フィードバックバナーを追加

Turn Log の `<BoardView>` の直後に追加:

```tsx
{/* Last move feedback banner */}
{boardAnim.isAnimating && (
  <LastMoveFeedback
    placedCell={boardAnim.placedCell}
    flippedCells={boardAnim.flippedCells}
    turnPlayer={
      turns.length > 0
        ? turnPlayer(firstPlayer, turns.length - 1) === 0 ? "A" : "B"
        : "A"
    }
  />
)}
```

---

## 🔧 改善2: `/replay` 結果バナー（常設）

### 方針
- 自動ポップアップ（GameResultOverlay）を **削除**
- 代わりに `GameResultBanner` を **常設表示** （step=9 のとき）
- ユーザーが明示的に閉じる必要がなく、Replay操作を妨げない

### ステップ1: インポート追加

```tsx
// Replay.tsx のインポートに追加
import { GameResultBanner } from "@/components/GameResultOverlay";
```

### ステップ2: Replay セクション上部に結果バナーを追加

`sim.ok` ブロックの最初の `<section>` の前に、以下を追加:

```tsx
{sim.ok ? (
  <>
    {/* ── Persistent result banner (replaces auto-popup overlay) ── */}
    {step >= 9 && (
      <section className="animate-banner-enter">
        <div className="relative overflow-hidden rounded-2xl border-2 border-surface-200 shadow-soft">
          {/* Background shimmer for winners */}
          {sim.current.winner !== null && (
            <div
              className={[
                "absolute inset-0 opacity-20 result-banner-shimmer",
                sim.current.winner === 0
                  ? "bg-gradient-to-r from-transparent via-player-a-300 to-transparent"
                  : "bg-gradient-to-r from-transparent via-player-b-300 to-transparent",
              ].join(" ")}
            />
          )}

          <div className="relative">
            <GameResultBanner
              result={{
                winner:
                  sim.current.winner === 0 || sim.current.winner === 1
                    ? sim.current.winner
                    : "draw",
                tilesA: Number(sim.current.tiles.A),
                tilesB: Number(sim.current.tiles.B),
                matchId: sim.current.matchId,
              }}
            />

            {/* Quick actions row */}
            <div className="flex items-center justify-between px-4 py-3 bg-surface-50/80 border-t border-surface-100">
              <div className="text-xs text-surface-500 font-mono truncate max-w-[50%]">
                matchId: {sim.current.matchId.slice(0, 16)}…
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-sm"
                  onClick={() =>
                    copyWithToast(
                      "transcript",
                      stringifyWithBigInt(sim.transcript)
                    )
                  }
                >
                  📋 Copy
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    void (async () => {
                      try {
                        const link = await buildShareLink();
                        await copyWithToast("share link", link);
                      } catch (e: any) {
                        setSim({ ok: false, error: e?.message ?? String(e) });
                      }
                    })();
                  }}
                >
                  🔗 Share
                </button>
                {eventId && !hasEventAttempt(eventId, sim.current.matchId) && (
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      void (async () => {
                        try {
                          await saveToMyAttempts();
                          toast.success("Saved", "Added to My Attempts");
                        } catch (e: any) {
                          setSim({ ok: false, error: e?.message ?? String(e) });
                        }
                      })();
                    }}
                  >
                    💾 Save
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    )}

    {/* ... existing <section> for Replay board and Turn log ... */}
```

### ステップ3: (任意) 既存の result 表示を簡素化

Turn Log 横の "current winner" パネル内の結果表示は残してOK（詳細情報として有用）。
ただし、結果バナーがあるため冗長に感じる場合は `Disclosure` で畳んでもよい。

---

## 🔧 改善3: `/stream` 運用情報HUDを最上部へ

### ステップ1: インポート追加

```tsx
// Stream.tsx のインポートに追加
import { StreamOperationsHUD } from "@/components/StreamOperationsHUD";
```

### ステップ2: HUDをページ最上部に配置

`StreamPage` の return 内、最初の `<div className="space-y-6">` の直後（既存の card の前）に追加:

```tsx
return (
  <div className="space-y-6">
    {/* ── NEW: Live Operations HUD (most prominent position) ── */}
    <StreamOperationsHUD
      live={live}
      controlledSide={controlledSide}
      voteOpen={voteOpen}
      voteEndsAtMs={voteEndsAtMs}
      totalVotes={Object.keys(votesByUser).length}
      voteTurn={voteTurn}
    />

    {/* ... existing <div className="card"> for Stream Studio ... */}
```

### ステップ3: 既存の "Live status" パネルを縮小

既存の Step 4 内の "Live status (from overlay bus)" パネルは情報が重複するため、
`<Disclosure>` で畳むか、削除して HUD に一本化する。

推奨: Disclosure で畳む

```tsx
<Disclosure title="Live status (raw — debug)">
  {/* 既存の Live status 内容をここに移動 */}
</Disclosure>
```

---

## 📎 CSS統合

`global_css/index.css` の末尾に `game-animations.css` の内容を追加するか、
別ファイルとしてインポート:

```css
/* index.css 末尾 */
@import './game-animations.css';
```

---

## ✅ テストチェックリスト

### /match
- [ ] カードを置いたとき、セルがポップインアニメーションする
- [ ] フリップが発生したとき、対象セルが回転+紫グローする
- [ ] チェインフリップ（複数）が順番にアニメーションする
- [ ] Undo/Reset でアニメーション状態がクリアされる
- [ ] AI (Nyano) の手番でもアニメーションが正しく表示される
- [ ] Stream mode (ctrl=A) でもアニメーションが正しく動作する

### /replay
- [ ] step=9 のとき結果バナーが常設表示される
- [ ] step<9 に戻すとバナーが非表示になる
- [ ] バナーからShare/Copy/Saveが動作する
- [ ] 従来のオーバーレイ（ポップアップ）は表示されない
- [ ] キーボード ←/→ で step を動かしても正常

### /stream
- [ ] ページ最上部にHUDが表示される
- [ ] Turn / Control / strictAllowed / Vote Status が正しい値
- [ ] Vote開始でHUDのボーダーがグロー、プログレスバー表示
- [ ] Vote終了でHUDが通常状態に戻る
- [ ] allowlist hash がターンごとに変化する
- [ ] live state の更新で sync indicator が "live" になる

---

## 📐 設計判断メモ

### なぜ `useBoardFlipAnimation` はカスタムHookか？
- Match.tsx の状態管理が既に複雑（30+ useState）
- Animation state を分離することで、Match.tsx の可読性を維持
- 将来 `/replay` にも同じHookを適用できる

### なぜ Replay は常設バナーか？
- ポップアップは「replay レビュー」のワークフローを中断する
- 配信者は step を行き来しながら解説するため、毎回閉じる手間が邪魔
- 常設バナーなら「結果を見ながら解説」が自然

### なぜ Stream HUD を最上部か？
- 配信中は「今何ターンか」「投票は開いてるか」「allowlist は正しいか」が最重要
- 現状はStep 4の深いネストに埋もれていて、スクロールが必要
- HUDとして常に見える位置に出すことで、運用ミスを防ぐ
