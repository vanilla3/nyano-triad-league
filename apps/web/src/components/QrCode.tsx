import React from "react";

/**
 * Lightweight QR Code component — no external dependencies.
 * Generates a QR Code (version 1–10, error correction L) using canvas.
 *
 * Uses a simplified encoding (byte mode) suitable for short URLs.
 */

// ── QR core (tiny encoder) ──────────────────────────────────────────

// Reed-Solomon / Galois field helpers
const EXP = new Uint8Array(256);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x = x << 1;
    if (x & 0x100) x ^= 0x11d;
  }
  EXP[255] = EXP[0];
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[(LOG[a] + LOG[b]) % 255];
}

function rsGenPoly(nsym: number): Uint8Array {
  let g = new Uint8Array([1]);
  for (let i = 0; i < nsym; i++) {
    const next = new Uint8Array(g.length + 1);
    for (let j = 0; j < g.length; j++) {
      next[j] ^= g[j];
      next[j + 1] ^= gfMul(g[j], EXP[i]);
    }
    g = next;
  }
  return g;
}

function rsEncode(data: Uint8Array, nsym: number): Uint8Array {
  const gen = rsGenPoly(nsym);
  const out = new Uint8Array(data.length + nsym);
  out.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = out[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        out[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return out.subarray(data.length);
}

// QR version params for L error correction (capacity, EC codewords per block, blocks)
const VERSION_PARAMS: { cap: number; ecPerBlock: number; blocks: number }[] = [
  { cap: 0, ecPerBlock: 0, blocks: 0 }, // placeholder for index 0
  { cap: 17, ecPerBlock: 7, blocks: 1 },   // v1
  { cap: 32, ecPerBlock: 10, blocks: 1 },  // v2
  { cap: 53, ecPerBlock: 15, blocks: 1 },  // v3
  { cap: 78, ecPerBlock: 20, blocks: 1 },  // v4
  { cap: 106, ecPerBlock: 26, blocks: 1 }, // v5
  { cap: 134, ecPerBlock: 18, blocks: 2 }, // v6
  { cap: 154, ecPerBlock: 20, blocks: 2 }, // v7
  { cap: 192, ecPerBlock: 24, blocks: 2 }, // v8
  { cap: 230, ecPerBlock: 30, blocks: 2 }, // v9
  { cap: 271, ecPerBlock: 18, blocks: 4 }, // v10
];

function pickVersion(dataLen: number): number {
  // byte mode: 4 bits mode + 8/16 bits length + data + 4 bits terminator
  for (let v = 1; v <= 10; v++) {
    const p = VERSION_PARAMS[v];
    const totalData = p.cap - p.ecPerBlock * p.blocks;
    // byte mode overhead: 4 + (v < 10 ? 8 : 16) bits for length indicator
    const overhead = Math.ceil((4 + (v < 10 ? 8 : 16)) / 8);
    if (dataLen + overhead <= totalData) return v;
  }
  return 10; // max we support
}

function encodeData(text: string): { version: number; modules: boolean[][] } {
  const bytes = new TextEncoder().encode(text);
  const version = pickVersion(bytes.length);
  const p = VERSION_PARAMS[version];
  const size = 17 + version * 4;
  const totalDataCW = p.cap - p.ecPerBlock * p.blocks;

  // Build data bitstream
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  pushBits(0b0100, 4); // byte mode
  pushBits(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) pushBits(b, 8);
  pushBits(0, Math.min(4, totalDataCW * 8 - bits.length)); // terminator

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad codewords
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < totalDataCW * 8) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert to bytes
  const dataCW = new Uint8Array(totalDataCW);
  for (let i = 0; i < totalDataCW; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | (bits[i * 8 + b] || 0);
    dataCW[i] = byte;
  }

  // RS encoding per block
  const cwPerBlock = Math.floor(totalDataCW / p.blocks);
  const allCW: number[] = [];
  const allEC: number[] = [];
  for (let b = 0; b < p.blocks; b++) {
    const blockData = dataCW.subarray(b * cwPerBlock, (b + 1) * cwPerBlock);
    const ec = rsEncode(blockData, p.ecPerBlock);
    allCW.push(...blockData);
    allEC.push(...ec);
  }

  const finalBits: number[] = [];
  for (const cw of [...allCW, ...allEC]) {
    for (let i = 7; i >= 0; i--) finalBits.push((cw >> i) & 1);
  }

  // Create module grid
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Place finder patterns
  const placeFinder = (r: number, c: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const isBorder = dr === -1 || dr === 7 || dc === -1 || dc === 7;
        const isOuter = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const isInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        modules[rr][cc] = !isBorder && (isOuter || isInner);
        reserved[rr][cc] = true;
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  // Dark module
  modules[size - 8][8] = true;
  reserved[size - 8][8] = true;

  // Reserve format info areas
  for (let i = 0; i < 9; i++) {
    if (i < size) { reserved[8][i] = true; reserved[i][8] = true; }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 8 + i] = true;
    reserved[size - 8 + i][8] = true;
  }

  // Place data bits
  let bitIdx = 0;
  let upward = true;
  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5; // skip timing column
    const rows = upward ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
    for (const row of rows) {
      for (const dc of [0, -1]) {
        const c = col + dc;
        if (c < 0 || reserved[row][c]) continue;
        if (bitIdx < finalBits.length) {
          modules[row][c] = finalBits[bitIdx] === 1;
        }
        bitIdx++;
      }
    }
    upward = !upward;
  }

  // Apply mask 0 (checkerboard) and format info
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && (r + c) % 2 === 0) {
        modules[r][c] = !modules[r][c];
      }
    }
  }

  // Write format info (L, mask 0) = 0x77c4
  const formatBits = 0x77c4;
  const fmtPositions: [number, number][] = [
    // Around top-left finder
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  const fmtPositions2: [number, number][] = [
    // Around other finders
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
    [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
    [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1],
  ];

  for (let i = 0; i < 15; i++) {
    const bit = (formatBits >> (14 - i)) & 1;
    if (fmtPositions[i]) modules[fmtPositions[i][0]][fmtPositions[i][1]] = bit === 1;
    if (fmtPositions2[i]) modules[fmtPositions2[i][0]][fmtPositions2[i][1]] = bit === 1;
  }

  return { version, modules };
}

// ── React component ─────────────────────────────────────────────────

type QrCodeProps = {
  value: string;
  size?: number;
  className?: string;
};

export function QrCode({ value, size = 160, className = "" }: QrCodeProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const { modules } = encodeData(value);
      const moduleCount = modules.length;
      const scale = Math.floor(size / (moduleCount + 8)); // quiet zone of 4
      const actualSize = scale * (moduleCount + 8);
      canvas.width = actualSize;
      canvas.height = actualSize;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, actualSize, actualSize);

      ctx.fillStyle = "#000000";
      const offset = scale * 4; // quiet zone
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (modules[r][c]) {
            ctx.fillRect(offset + c * scale, offset + r * scale, scale, scale);
          }
        }
      }
    } catch {
      // If encoding fails, show nothing
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = size;
        canvas.height = size;
        ctx.fillStyle = "#f8f8f8";
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "#999";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("QR Error", size / 2, size / 2);
      }
    }
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-lg border border-slate-200 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
