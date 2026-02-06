import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   DEMO: Nyano Triad League — 3つのUI改善プレビュー
   ═══════════════════════════════════════════════════════════════ */

// --- Color Tokens ---
const C = {
  nyano: { 50: "#FFF8F5", 100: "#FFEDE5", 200: "#FFD9C7", 300: "#FFC2A3", 400: "#FFA67A", 500: "#FF8A50", 600: "#E67340" },
  playerA: { 50: "#F0F9FF", 100: "#E0F2FE", 300: "#7DD3FC", 400: "#38BDF8", 500: "#0EA5E9", 600: "#0284C7", 700: "#0369A1" },
  playerB: { 50: "#FFF1F2", 100: "#FFE4E6", 300: "#FDA4AF", 400: "#FB7185", 500: "#F43F5E", 600: "#E11D48", 700: "#BE123C" },
  surface: { 50: "#FAFAF9", 100: "#F5F5F4", 200: "#E7E5E4", 300: "#D6D3D1", 400: "#A8A29E", 500: "#78716C", 600: "#57534E", 700: "#44403C", 800: "#292524", 900: "#1C1917" },
  flip: "#F59E0B",
  chain: "#8B5CF6",
  victory: "#10B981",
};

// --- Shared Styles ---
const fontDisplay = "'Nunito', 'Rounded Mplus 1c', system-ui, sans-serif";
const fontMono = "'JetBrains Mono', 'SF Mono', monospace";
const fontBody = "'Noto Sans JP', system-ui, sans-serif";

const cardShadow = "0 2px 8px -2px rgba(0,0,0,0.06), 0 4px 16px -4px rgba(0,0,0,0.08)";
const softShadow = "0 4px 16px -4px rgba(0,0,0,0.1)";

/* ═══════════════════════════════════════════════════════════════
   IMPROVEMENT 1: Board Flip Animation Demo
   ═══════════════════════════════════════════════════════════════ */

const DEMO_CARDS = [
  { id: 1, edges: { up: 7, right: 3, down: 5, left: 8 }, janken: "✊", trait: "flame" },
  { id: 2, edges: { up: 4, right: 9, down: 2, left: 6 }, janken: "✋", trait: "aqua" },
  { id: 3, edges: { up: 6, right: 5, down: 8, left: 3 }, janken: "✌️", trait: "shadow" },
  { id: 4, edges: { up: 8, right: 4, down: 3, left: 7 }, janken: "✊", trait: "cosmic" },
  { id: 5, edges: { up: 3, right: 7, down: 6, left: 5 }, janken: "✋", trait: "thunder" },
];

const DEMO_SEQUENCE = [
  { cell: 4, card: 0, owner: 0 },
  { cell: 0, card: 1, owner: 1 },
  { cell: 2, card: 2, owner: 0, flips: [0] },
  { cell: 6, card: 3, owner: 1 },
  { cell: 8, card: 4, owner: 0, flips: [6] },
  { cell: 1, card: 0, owner: 1, flips: [4, 2] },
  { cell: 3, card: 1, owner: 0 },
  { cell: 5, card: 2, owner: 1, flips: [4] },
  { cell: 7, card: 3, owner: 0, flips: [8, 6] },
];

function BoardFlipDemo() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [step, setStep] = useState(0);
  const [animPlaced, setAnimPlaced] = useState(null);
  const [animFlipped, setAnimFlipped] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef(null);

  const playStep = useCallback((idx) => {
    if (idx >= DEMO_SEQUENCE.length) return;
    const move = DEMO_SEQUENCE[idx];
    
    setAnimPlaced(move.cell);
    setAnimFlipped(move.flips || []);
    setIsAnimating(true);

    setBoard(prev => {
      const next = [...prev];
      const card = DEMO_CARDS[move.card];
      next[move.cell] = { card, owner: move.owner };
      if (move.flips) {
        for (const f of move.flips) {
          if (next[f]) next[f] = { ...next[f], owner: move.owner };
        }
      }
      return next;
    });

    setStep(idx + 1);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setAnimPlaced(null);
      setAnimFlipped([]);
      setIsAnimating(false);
    }, 900);
  }, []);

  const reset = () => {
    setBoard(Array(9).fill(null));
    setStep(0);
    setAnimPlaced(null);
    setAnimFlipped([]);
    setIsAnimating(false);
  };

  const autoPlay = () => {
    reset();
    let i = 0;
    const run = () => {
      if (i >= DEMO_SEQUENCE.length) return;
      playStep(i);
      i++;
      setTimeout(run, 1200);
    };
    setTimeout(run, 300);
  };

  const scoreA = board.filter(c => c?.owner === 0).length;
  const scoreB = board.filter(c => c?.owner === 1).length;
  const currentPlayer = step < DEMO_SEQUENCE.length ? DEMO_SEQUENCE[step]?.owner : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Score bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderRadius: 16, border: `1px solid ${C.surface[200]}`,
        background: "white", boxShadow: "0 2px 8px -2px rgba(0,0,0,0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.playerA[500] }} />
          <span style={{ fontFamily: fontDisplay, fontWeight: 700, color: C.playerA[700] }}>A</span>
          <span style={{ fontFamily: fontMono, color: C.surface[700] }}>{scoreA}</span>
        </div>
        <div style={{ fontFamily: fontBody, fontSize: 12, color: C.surface[500] }}>
          Turn {step}/9 · {currentPlayer === 0 ? "A" : currentPlayer === 1 ? "B" : "—"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: fontMono, color: C.surface[700] }}>{scoreB}</span>
          <span style={{ fontFamily: fontDisplay, fontWeight: 700, color: C.playerB[700] }}>B</span>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.playerB[500] }} />
        </div>
      </div>

      {/* Board grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
        padding: 16, borderRadius: 24, background: C.surface[50],
        border: `1px solid ${C.surface[200]}`, boxShadow: softShadow,
      }}>
        {board.map((cell, idx) => {
          const isPlaced = animPlaced === idx;
          const isFlipped = animFlipped.includes(idx);
          const coords = ["A1","B1","C1","A2","B2","C2","A3","B3","C3"][idx];

          return (
            <div
              key={idx}
              onClick={() => !cell && step < DEMO_SEQUENCE.length && playStep(step)}
              style={{
                position: "relative", width: "100%", aspectRatio: "1",
                borderRadius: 16, border: `2px solid ${
                  cell ? (cell.owner === 0 ? C.playerA[300] : C.playerB[300]) : C.surface[200]
                }`,
                background: cell
                  ? (cell.owner === 0 ? C.playerA[50] : C.playerB[50])
                  : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: !cell && step < DEMO_SEQUENCE.length ? "pointer" : "default",
                transition: "all 0.3s ease",
                animation: isPlaced
                  ? "cellPlace 0.5s cubic-bezier(0.34,1.56,0.64,1) both"
                  : isFlipped
                    ? "cellFlip 0.55s cubic-bezier(0.4,0,0.2,1) both"
                    : "none",
                boxShadow: isPlaced
                  ? `0 0 20px -2px ${C.flip}80`
                  : isFlipped
                    ? `0 0 20px -2px ${C.chain}80`
                    : "none",
                overflow: "hidden",
              }}
            >
              {/* Coordinate label */}
              <div style={{
                position: "absolute", top: 4, left: 8,
                fontSize: 9, fontFamily: fontMono, color: C.surface[400],
              }}>{coords}</div>

              {cell ? (
                <div style={{ textAlign: "center", position: "relative" }}>
                  {/* Edge values */}
                  <div style={{ fontSize: 11, fontFamily: fontDisplay, fontWeight: 700, color: C.surface[700] }}>
                    {cell.card.edges.up}
                  </div>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontFamily: fontDisplay, fontWeight: 700 }}>{cell.card.edges.left}</span>
                    <span style={{ fontSize: 16 }}>{cell.card.janken}</span>
                    <span style={{ fontSize: 11, fontFamily: fontDisplay, fontWeight: 700 }}>{cell.card.edges.right}</span>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: fontDisplay, fontWeight: 700, color: C.surface[700] }}>
                    {cell.card.edges.down}
                  </div>
                  {/* Owner badge */}
                  <div style={{
                    position: "absolute", bottom: -6, right: -6,
                    fontSize: 8, fontWeight: 700, fontFamily: fontDisplay,
                    color: cell.owner === 0 ? C.playerA[600] : C.playerB[600],
                  }}>{cell.owner === 0 ? "A" : "B"}</div>
                </div>
              ) : (
                <span style={{ fontSize: 11, fontFamily: fontMono, color: C.surface[300] }}>•</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Last move feedback */}
      {isAnimating && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 16px", borderRadius: 16,
          border: `1px solid ${C.flip}50`,
          background: `linear-gradient(to right, #FFFBEB, white)`,
          animation: "fadeInUp 0.3s ease-out",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.flip, animation: "pulse 1s ease-in-out infinite" }} />
            <span style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 13, color: "#92400E" }}>
              📍 Placed cell {animPlaced}
            </span>
          </div>
          {animFlipped.length > 0 && (
            <>
              <div style={{ width: 1, height: 16, background: C.surface[200] }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.chain, animation: "pulse 1s ease-in-out infinite" }} />
                <span style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 13, color: "#5B21B6" }}>
                  🔄 Flipped {animFlipped.length}
                </span>
                <span style={{ fontSize: 11, fontFamily: fontMono, color: C.surface[400] }}>
                  [{animFlipped.join(", ")}]
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => playStep(step)} disabled={step >= DEMO_SEQUENCE.length || isAnimating}
          style={{
            padding: "8px 20px", borderRadius: 12, fontFamily: fontDisplay, fontWeight: 600, fontSize: 13,
            background: step >= DEMO_SEQUENCE.length ? C.surface[100] : C.nyano[500], color: step >= DEMO_SEQUENCE.length ? C.surface[400] : "white",
            border: "none", cursor: step >= DEMO_SEQUENCE.length ? "not-allowed" : "pointer",
            boxShadow: step < DEMO_SEQUENCE.length ? `0 2px 8px -2px ${C.nyano[500]}80` : "none",
          }}>
          Next Move →
        </button>
        <button onClick={autoPlay}
          style={{
            padding: "8px 20px", borderRadius: 12, fontFamily: fontDisplay, fontWeight: 600, fontSize: 13,
            background: "white", color: C.surface[700], border: `1px solid ${C.surface[200]}`, cursor: "pointer",
          }}>
          ▶ Auto Play
        </button>
        <button onClick={reset}
          style={{
            padding: "8px 20px", borderRadius: 12, fontFamily: fontDisplay, fontWeight: 600, fontSize: 13,
            background: "white", color: C.surface[700], border: `1px solid ${C.surface[200]}`, cursor: "pointer",
          }}>
          Reset
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   IMPROVEMENT 2: Persistent Result Banner
   ═══════════════════════════════════════════════════════════════ */

function ResultBannerDemo() {
  const [winner, setWinner] = useState(0);
  const [visible, setVisible] = useState(true);

  const configs = {
    0: { label: "Player A Wins", bg: C.playerA[50], border: C.playerA[200], text: C.playerA[700], accent: C.playerA[500] },
    1: { label: "Player B Wins", bg: C.playerB[50], border: C.playerB[200], text: C.playerB[700], accent: C.playerB[500] },
    draw: { label: "Draw!", bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", accent: "#F59E0B" },
  };
  const cfg = configs[winner];
  const tilesA = winner === 0 ? 6 : winner === 1 ? 3 : 5;
  const tilesB = winner === 0 ? 3 : winner === 1 ? 6 : 4;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toggle controls */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontFamily: fontBody, color: C.surface[500] }}>Winner:</span>
        {[0, 1, "draw"].map(w => (
          <button key={w} onClick={() => { setWinner(w); setVisible(true); }}
            style={{
              padding: "6px 16px", borderRadius: 10, fontFamily: fontDisplay, fontWeight: 600, fontSize: 12,
              background: winner === w ? (w === 0 ? C.playerA[500] : w === 1 ? C.playerB[500] : "#F59E0B") : "white",
              color: winner === w ? "white" : C.surface[700],
              border: `1px solid ${winner === w ? "transparent" : C.surface[200]}`, cursor: "pointer",
            }}>
            {w === 0 ? "A Wins" : w === 1 ? "B Wins" : "Draw"}
          </button>
        ))}
      </div>

      {/* Banner */}
      {visible && (
        <div style={{
          borderRadius: 16, border: `2px solid ${cfg.border}`, overflow: "hidden",
          boxShadow: softShadow,
          animation: "bannerSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        }}>
          {/* Shimmer overlay */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", inset: 0, opacity: 0.15,
              background: `linear-gradient(90deg, transparent 0%, ${cfg.accent} 50%, transparent 100%)`,
              backgroundSize: "200% auto",
              animation: "shimmerBg 3s linear infinite",
            }} />

            {/* Main result */}
            <div style={{ position: "relative", background: cfg.bg, padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 20, color: cfg.text }}>
                    {cfg.label}
                  </div>
                  <div style={{ fontFamily: fontBody, fontSize: 13, color: C.surface[600], marginTop: 2 }}>
                    Final Score: {tilesA} - {tilesB}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: fontDisplay, fontWeight: 800, fontSize: 22,
                    background: winner === 0 ? C.playerA[500] : C.playerA[100],
                    color: winner === 0 ? "white" : C.playerA[600],
                  }}>{tilesA}</div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.surface[300] }}>:</span>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: fontDisplay, fontWeight: 800, fontSize: 22,
                    background: winner === 1 ? C.playerB[500] : C.playerB[100],
                    color: winner === 1 ? "white" : C.playerB[600],
                  }}>{tilesB}</div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 24px", background: `${C.surface[50]}CC`,
              borderTop: `1px solid ${C.surface[100]}`,
            }}>
              <span style={{ fontSize: 11, fontFamily: fontMono, color: C.surface[500] }}>
                matchId: 0x3a7f2b…c9e1
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {["📋 Copy", "🔗 Share", "💾 Save"].map(label => (
                  <button key={label} style={{
                    padding: "5px 12px", borderRadius: 8, fontSize: 11, fontFamily: fontDisplay, fontWeight: 600,
                    background: label.includes("Share") ? C.nyano[500] : "white",
                    color: label.includes("Share") ? "white" : C.surface[700],
                    border: `1px solid ${label.includes("Share") ? C.nyano[600] : C.surface[200]}`,
                    cursor: "pointer",
                  }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, fontFamily: fontBody, color: C.surface[500], lineHeight: 1.6 }}>
        ↑ ポップアップではなく <strong>常設バナー</strong>。step=9で自動表示、stepを戻すと消える。<br/>
        Replay操作を中断しない＝配信中の解説がスムーズ。
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   IMPROVEMENT 3: Stream Operations HUD
   ═══════════════════════════════════════════════════════════════ */

function StreamHUDDemo() {
  const [voteOpen, setVoteOpen] = useState(false);
  const [voteTime, setVoteTime] = useState(15);
  const [timeLeft, setTimeLeft] = useState(15);
  const [turn, setTurn] = useState(3);
  const [totalVotes, setTotalVotes] = useState(0);
  const timerRef = useRef(null);

  const startVote = () => {
    setVoteOpen(true);
    setTimeLeft(voteTime);
    setTotalVotes(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setVoteOpen(false);
          setTurn(p => Math.min(9, p + 1));
          return 0;
        }
        setTotalVotes(v => v + Math.floor(Math.random() * 3));
        return t - 1;
      });
    }, 1000);
  };

  const allowlistCount = Math.max(0, (9 - turn) * (5 - Math.floor(turn / 2)));
  const hash = `0x${(0x811c9dc5 ^ (turn * 16777619) >>> 0).toString(16).padStart(8, "0")}`;
  const pct = voteOpen ? (timeLeft / voteTime) * 100 : 0;

  const HUDCell = ({ label, primary, secondary, accent = C.surface[700], large = false }) => (
    <div style={{ background: "white", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: C.surface[400], fontFamily: fontBody }}>{label}</span>
      <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: large ? 28 : 20, color: accent, fontVariantNumeric: "tabular-nums" }}>{primary}</span>
      <span style={{ fontSize: 11, color: C.surface[500], fontFamily: fontBody }}>{secondary}</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* HUD */}
      <div style={{
        borderRadius: 16, overflow: "hidden",
        border: `2px solid ${voteOpen ? C.nyano[400] : C.surface[200]}`,
        boxShadow: voteOpen ? `0 0 24px -4px ${C.nyano[500]}80` : softShadow,
        transition: "all 0.3s ease",
        animation: voteOpen ? "hudPulse 1.5s ease-in-out infinite" : "none",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 16px", borderBottom: `1px solid ${C.surface[100]}`,
          background: voteOpen ? `${C.nyano[50]}` : "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 14, color: C.surface[800] }}>⚡ Live Operations</span>
            {voteOpen && (
              <span style={{
                padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                background: C.nyano[500], color: "white",
                animation: "pulse 1s ease-in-out infinite",
              }}>VOTE OPEN</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: C.victory,
              animation: "pulse 2s ease-in-out infinite",
            }} />
            <span style={{ fontFamily: fontMono, color: C.surface[500] }}>live</span>
          </div>
        </div>

        {/* Grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1, background: C.surface[100],
        }}>
          <HUDCell label="Turn" primary={`${turn}/9`} secondary="A to play" accent={C.playerA[600]} />
          <HUDCell label="Control" primary="Side A" secondary={turn % 2 === 0 ? "✅ Your turn" : "⏳ Opponent"} accent={turn % 2 === 0 ? C.nyano[600] : C.surface[500]} />
          <HUDCell label="strictAllowed" primary={`${allowlistCount} moves`} secondary={<span style={{ fontFamily: fontMono, fontSize: 10 }}>hash {hash}</span>} accent={allowlistCount > 0 ? C.victory : C.surface[400]} />
          <HUDCell label={voteOpen ? "Vote Timer" : "Vote Status"} primary={voteOpen ? `${timeLeft}s` : "CLOSED"} secondary={voteOpen ? `${totalVotes} votes · turn ${turn}` : "Start vote to begin"} accent={voteOpen ? C.nyano[600] : C.surface[500]} large={voteOpen} />
        </div>

        {/* Progress bar */}
        {voteOpen && (
          <div style={{ height: 6, background: C.surface[100], overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              background: `linear-gradient(to right, ${C.nyano[500]}, ${C.nyano[400]})`,
              transition: "width 0.3s linear",
            }} />
          </div>
        )}

        {/* Secondary info */}
        <div style={{
          display: "flex", gap: 16, padding: "8px 16px",
          background: "rgba(255,255,255,0.6)", borderTop: `1px solid ${C.surface[100]}`,
          fontSize: 11, color: C.surface[500], fontFamily: fontBody, flexWrap: "wrap",
        }}>
          <span>Empty cells: <span style={{ fontFamily: fontMono, fontWeight: 500, color: C.surface[700] }}>A2, B2, C1, C2, C3, A3</span></span>
          <span style={{ color: C.surface[200] }}>|</span>
          <span>Hand slots: <span style={{ fontFamily: fontMono, fontWeight: 500, color: C.surface[700] }}>A1, A3, A5</span></span>
          <span style={{ color: C.surface[200] }}>|</span>
          <span>WM remaining: <span style={{ fontFamily: fontMono, fontWeight: 500, color: C.surface[700] }}>2</span></span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={startVote} disabled={voteOpen}
          style={{
            padding: "8px 20px", borderRadius: 12, fontFamily: fontDisplay, fontWeight: 600, fontSize: 13,
            background: voteOpen ? C.surface[100] : C.nyano[500], color: voteOpen ? C.surface[400] : "white",
            border: "none", cursor: voteOpen ? "not-allowed" : "pointer",
          }}>
          Start Vote ({voteTime}s)
        </button>
        <button onClick={() => setTurn(t => Math.min(9, t + 1))}
          style={{
            padding: "8px 16px", borderRadius: 12, fontFamily: fontDisplay, fontWeight: 600, fontSize: 13,
            background: "white", color: C.surface[700], border: `1px solid ${C.surface[200]}`, cursor: "pointer",
          }}>
          Turn ++
        </button>
        <button onClick={() => { setTurn(3); setVoteOpen(false); }}
          style={{
            padding: "8px 16px", borderRadius: 12, fontFamily: fontDisplay, fontWeight: 600, fontSize: 13,
            background: "white", color: C.surface[700], border: `1px solid ${C.surface[200]}`, cursor: "pointer",
          }}>
          Reset
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */

export default function App() {
  const [tab, setTab] = useState(0);
  const tabs = [
    { label: "1. /match フリップ演出", icon: "🎴" },
    { label: "2. /replay 結果バナー", icon: "🏆" },
    { label: "3. /stream OPS HUD", icon: "⚡" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: C.surface[50],
      fontFamily: fontBody, color: C.surface[900],
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;600;700&display=swap');
        @keyframes cellPlace {
          0% { transform: scale(0.85); opacity: 0.5; }
          40% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cellFlip {
          0% { transform: perspective(400px) rotateY(0deg); filter: brightness(1); }
          30% { transform: perspective(400px) rotateY(90deg); filter: brightness(1.3); }
          60% { transform: perspective(400px) rotateY(180deg); filter: brightness(1.1); }
          100% { transform: perspective(400px) rotateY(360deg); filter: brightness(1); }
        }
        @keyframes fadeInUp {
          0% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bannerSlideIn {
          0% { transform: translateY(-16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes shimmerBg {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes hudPulse {
          0%, 100% { box-shadow: 0 0 12px -2px ${C.nyano[500]}50; }
          50% { box-shadow: 0 0 24px -2px ${C.nyano[500]}80; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "24px 24px 0", maxWidth: 800, margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: C.nyano[500],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: `0 4px 12px -2px ${C.nyano[500]}60`,
          }}>🐱</div>
          <div>
            <h1 style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 20, color: C.surface[800] }}>
              Nyano Triad League
            </h1>
            <p style={{ fontSize: 12, color: C.surface[500] }}>UI "ゲーム感" 向上 — 3つの改善プレビュー</p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 4, marginTop: 16, padding: 4, borderRadius: 14,
          background: C.surface[100], border: `1px solid ${C.surface[200]}`,
        }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{
                flex: 1, padding: "10px 8px", borderRadius: 10, border: "none",
                fontFamily: fontDisplay, fontWeight: 600, fontSize: 12,
                background: tab === i ? "white" : "transparent",
                color: tab === i ? C.surface[800] : C.surface[500],
                cursor: "pointer",
                boxShadow: tab === i ? cardShadow : "none",
                transition: "all 0.2s ease",
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <div style={{
          background: "white", borderRadius: 20, border: `1px solid ${C.surface[200]}`,
          boxShadow: cardShadow, padding: 24,
        }}>
          {tab === 0 && (
            <div>
              <h2 style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 16, color: C.surface[800], marginBottom: 4 }}>
                盤面フリップ演出
              </h2>
              <p style={{ fontSize: 13, color: C.surface[500], marginBottom: 20, lineHeight: 1.6 }}>
                カードを置くとポップインアニメーション、フリップセルは3D回転+紫グロー。<br/>
                「Next Move →」か「Auto Play」で体験してください。
              </p>
              <BoardFlipDemo />
            </div>
          )}
          {tab === 1 && (
            <div>
              <h2 style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 16, color: C.surface[800], marginBottom: 4 }}>
                結果バナー（常設）
              </h2>
              <p style={{ fontSize: 13, color: C.surface[500], marginBottom: 20, lineHeight: 1.6 }}>
                自動ポップアップの代わりに、step=9で常設表示されるバナー。<br/>
                Replayのstep操作を妨げない＝配信解説がスムーズ。
              </p>
              <ResultBannerDemo />
            </div>
          )}
          {tab === 2 && (
            <div>
              <h2 style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 16, color: C.surface[800], marginBottom: 4 }}>
                Stream Operations HUD
              </h2>
              <p style={{ fontSize: 13, color: C.surface[500], marginBottom: 20, lineHeight: 1.6 }}>
                strictAllowed / hash / allowlist件数 / 投票残り を最上部に常時表示。<br/>
                「Start Vote」で投票中のHUDアニメーションを確認できます。
              </p>
              <StreamHUDDemo />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
