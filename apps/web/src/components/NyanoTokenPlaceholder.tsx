import React from "react";

/**
 * Deterministic generative art placeholder for Nyano tokens.
 *
 * When NFT images from Arweave fail to load, this component generates
 * a unique, visually appealing placeholder based on the tokenId.
 * Each tokenId produces the same consistent visual (deterministic hash).
 */

// Simple deterministic hash from tokenId string
function hashToken(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Generate a stable hue from tokenId
function tokenHue(id: string): number {
  return hashToken(id) % 360;
}

// Generate a stable pattern variant
function tokenPattern(id: string): number {
  return hashToken(id + "pat") % 6;
}

const PATTERNS = [
  // Diamond grid
  (hue: number) => (
    <pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill={`hsl(${hue}, 50%, 25%)`} />
      <path d="M10 0L20 10L10 20L0 10Z" fill={`hsl(${hue}, 60%, 35%)`} opacity="0.5" />
    </pattern>
  ),
  // Circles
  (hue: number) => (
    <pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" fill={`hsl(${hue}, 45%, 22%)`} />
      <circle cx="12" cy="12" r="8" fill="none" stroke={`hsl(${hue}, 65%, 45%)`} strokeWidth="1.5" opacity="0.6" />
    </pattern>
  ),
  // Stripes
  (hue: number) => (
    <pattern id="p" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="12" height="12" fill={`hsl(${hue}, 50%, 20%)`} />
      <line x1="0" y1="0" x2="0" y2="12" stroke={`hsl(${hue}, 60%, 40%)`} strokeWidth="4" opacity="0.4" />
    </pattern>
  ),
  // Hexagonal
  (hue: number) => (
    <pattern id="p" width="28" height="24" patternUnits="userSpaceOnUse">
      <rect width="28" height="24" fill={`hsl(${hue}, 55%, 24%)`} />
      <path d="M14 0L28 8L28 16L14 24L0 16L0 8Z" fill="none" stroke={`hsl(${hue}, 65%, 42%)`} strokeWidth="1" opacity="0.5" />
    </pattern>
  ),
  // Waves
  (hue: number) => (
    <pattern id="p" width="40" height="20" patternUnits="userSpaceOnUse">
      <rect width="40" height="20" fill={`hsl(${hue}, 48%, 22%)`} />
      <path d="M0 10Q10 0 20 10T40 10" fill="none" stroke={`hsl(${hue}, 60%, 40%)`} strokeWidth="2" opacity="0.5" />
    </pattern>
  ),
  // Dots
  (hue: number) => (
    <pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill={`hsl(${hue}, 45%, 20%)`} />
      <circle cx="4" cy="4" r="2" fill={`hsl(${hue}, 60%, 45%)`} opacity="0.5" />
      <circle cx="12" cy="12" r="2" fill={`hsl(${hue}, 60%, 45%)`} opacity="0.5" />
    </pattern>
  ),
];

export interface NyanoTokenPlaceholderProps {
  tokenId: bigint;
  size?: number;
  fill?: boolean;
  className?: string;
}

export const NyanoTokenPlaceholder = React.memo(function NyanoTokenPlaceholder({
  tokenId,
  size = 72,
  fill = false,
  className = "",
}: NyanoTokenPlaceholderProps) {
  const idStr = tokenId.toString();
  const hue = tokenHue(idStr);
  const pat = tokenPattern(idStr);
  const hash = hashToken(idStr);

  // Generate unique SVG id to avoid collisions when multiple are on screen
  const svgId = `ntp-${idStr}`;

  // Secondary accent hue (complementary-ish)
  const hue2 = (hue + 140) % 360;

  // Cat face shape varies slightly based on hash
  const earAngle = 15 + (hash % 20);
  const eyeY = 38 + (hash % 5);

  const sizeStyle = fill
    ? { width: "100%", height: "100%" }
    : { width: size, height: size };

  return (
    <div
      className={[
        "overflow-hidden",
        fill ? "w-full h-full" : "rounded-xl",
        className,
      ].filter(Boolean).join(" ")}
      style={fill ? undefined : (sizeStyle as React.CSSProperties)}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Nyano #${idStr}`}
      >
        <defs>
          {PATTERNS[pat](hue)}
          <radialGradient id={`${svgId}-g`} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor={`hsl(${hue}, 70%, 55%)`} stopOpacity="0.3" />
            <stop offset="100%" stopColor={`hsl(${hue}, 50%, 15%)`} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background pattern */}
        <rect width="100" height="100" fill="url(#p)" />

        {/* Gradient overlay */}
        <rect width="100" height="100" fill={`url(#${svgId}-g)`} />

        {/* Cat silhouette */}
        <g transform="translate(50, 52)">
          {/* Ears */}
          <polygon
            points={`-${earAngle},-35 -12,-8 -${earAngle - 10},-10`}
            fill={`hsl(${hue2}, 55%, 45%)`}
            opacity="0.7"
          />
          <polygon
            points={`${earAngle},-35 12,-8 ${earAngle - 10},-10`}
            fill={`hsl(${hue2}, 55%, 45%)`}
            opacity="0.7"
          />

          {/* Head */}
          <ellipse cx="0" cy="0" rx="22" ry="20" fill={`hsl(${hue2}, 50%, 40%)`} opacity="0.8" />

          {/* Eyes */}
          <ellipse cx="-8" cy={eyeY - 52} rx="3.5" ry="4" fill={`hsl(${hue}, 90%, 75%)`} />
          <ellipse cx="8" cy={eyeY - 52} rx="3.5" ry="4" fill={`hsl(${hue}, 90%, 75%)`} />

          {/* Pupils */}
          <ellipse cx="-8" cy={eyeY - 51} rx="1.5" ry="2.5" fill={`hsl(${hue}, 80%, 15%)`} />
          <ellipse cx="8" cy={eyeY - 51} rx="1.5" ry="2.5" fill={`hsl(${hue}, 80%, 15%)`} />

          {/* Nose */}
          <polygon points="0,-4 -2,-2 2,-2" fill={`hsl(${hue2}, 60%, 60%)`} opacity="0.8" />

          {/* Mouth */}
          <path d="M-3,0Q0,3 3,0" fill="none" stroke={`hsl(${hue2}, 40%, 55%)`} strokeWidth="0.8" opacity="0.6" />
        </g>

        {/* Token ID badge */}
        <rect x="0" y="80" width="100" height="20" fill="rgba(0,0,0,0.5)" />
        <text
          x="50"
          y="93"
          textAnchor="middle"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
          fill="white"
          opacity="0.9"
        >
          #{idStr}
        </text>
      </svg>
    </div>
  );
});
