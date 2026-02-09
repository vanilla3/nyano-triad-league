import React from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   FlipArrowOverlay.tsx — Causality Arrow SVG Overlay (NIN-UX-030, D-1/D-2)

   Renders SVG arrows on top of the Mint board grid to visualize flip traces.
   - Direct flip: amber solid line  (--mint-flip)
   - Chain flip:  violet solid line (--mint-chain)
   - Janken flip: amber dashed line
   - Value label: midpoint "7>6"
   - Staged animation synced to flip-delay classes (150ms stagger)
   - Respects prefers-reduced-motion
   ═══════════════════════════════════════════════════════════════════════════ */

export interface FlipTraceArrow {
  from: number;
  to: number;
  isChain: boolean;
  kind: "diag" | "ortho";
  aVal: number;
  dVal: number;
  tieBreak: boolean;
}

export interface FlipArrowOverlayProps {
  traces: readonly FlipTraceArrow[];
  /** Ref to the .mint-grid element for coordinate calculation */
  gridRef: React.RefObject<HTMLDivElement | null>;
  /** Whether animation is currently running */
  isAnimating?: boolean;
}

// Cell center coordinates as fraction of grid (3x3 layout)
// row-major: 0=A1, 1=B1, 2=C1, 3=A2, 4=B2, 5=C2, 6=A3, 7=B3, 8=C3
function cellCenter(idx: number): { x: number; y: number } {
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  return {
    x: (col + 0.5) / 3,
    y: (row + 0.5) / 3,
  };
}

const STAGGER_MS = 150;

// Check prefers-reduced-motion
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export function FlipArrowOverlay({
  traces,
  gridRef,
  isAnimating: _isAnimating = false,
}: FlipArrowOverlayProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [dimensions, setDimensions] = React.useState({ w: 0, h: 0 });

  // Track grid size with ResizeObserver
  React.useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setDimensions({ w: rect.width, h: rect.height });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gridRef]);

  if (!traces || traces.length === 0 || dimensions.w === 0) return null;

  const { w, h } = dimensions;

  return (
    <svg
      className="mint-arrow-overlay"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
    >
      <defs>
        {/* Direct flip arrowhead (amber) */}
        <marker
          id="mint-arrow-direct"
          viewBox="0 0 10 7"
          refX="10"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--mint-flip, #F59E0B)" />
        </marker>

        {/* Chain flip arrowhead (violet) */}
        <marker
          id="mint-arrow-chain"
          viewBox="0 0 10 7"
          refX="10"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--mint-chain, #8B5CF6)" />
        </marker>
      </defs>

      {traces.map((trace, i) => {
        const from = cellCenter(trace.from);
        const to = cellCenter(trace.to);

        const x1 = from.x * w;
        const y1 = from.y * h;
        const x2 = to.x * w;
        const y2 = to.y * h;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        const isChain = trace.isChain;
        const isJanken = trace.tieBreak;

        const color = isChain ? "var(--mint-chain, #8B5CF6)" : "var(--mint-flip, #F59E0B)";
        const markerId = isChain ? "url(#mint-arrow-chain)" : "url(#mint-arrow-direct)";
        const dashArray = isJanken ? "6 4" : "none";

        const delay = reducedMotion ? 0 : i * STAGGER_MS;
        const animStyle: React.CSSProperties = reducedMotion
          ? { opacity: 1 }
          : {
              opacity: 0,
              animation: `mint-arrow-appear 0.3s ease-out ${delay}ms forwards`,
            };

        const valueLabel = trace.aVal > 0 && trace.dVal > 0
          ? `${trace.aVal}>${trace.dVal}`
          : null;

        return (
          <g key={`${trace.from}-${trace.to}-${i}`} style={animStyle}>
            {/* Arrow line */}
            <line
              className={[
                "mint-arrow-line",
                isChain && "mint-arrow-line--chain",
              ].filter(Boolean).join(" ")}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={2.5}
              strokeDasharray={dashArray}
              markerEnd={markerId}
              strokeLinecap="round"
            />

            {/* Value label at midpoint */}
            {valueLabel && (
              <>
                <rect
                  x={midX - 16}
                  y={midY - 8}
                  width={32}
                  height={16}
                  rx={4}
                  fill="white"
                  fillOpacity={0.9}
                  stroke={color}
                  strokeWidth={0.5}
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fontFamily="'Nunito', system-ui, sans-serif"
                  fill={isChain ? "var(--mint-chain, #8B5CF6)" : "var(--mint-flip, #F59E0B)"}
                >
                  {valueLabel}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
