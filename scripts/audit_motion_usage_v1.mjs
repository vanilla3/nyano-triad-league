#!/usr/bin/env node
/**
 * audit_motion_usage_v1.mjs
 *
 * Goal:
 *  - Prevent "cute motion" regressions where UI references motion classes
 *    that are not actually defined (dead CSS / missing Tailwind animation keys).
 *
 * Checks:
 *  - Scan apps/web/src (recursive) for motion-ish class tokens.
 *  - Build an allowlist from:
 *      - apps/web/src/motions.css (utility classes)
 *      - apps/web/tailwind.config.ts (extend.animation keys → animate-*)
 *      - Tailwind default animate utilities (animate-spin/ping/pulse/bounce/none)
 *  - Fail if any referenced token is unknown.
 *
 * Usage:
 *   node scripts/audit_motion_usage_v1.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const SRC_DIR = path.join(repoRoot, "apps", "web", "src");
const MOTIONS_CSS = path.join(SRC_DIR, "motions.css");
const TAILWIND_CFG = path.join(repoRoot, "apps", "web", "tailwind.config.ts");

const DEFAULT_TW_ANIMATE = new Set([
  "animate-none",
  "animate-spin",
  "animate-ping",
  "animate-pulse",
  "animate-bounce",
]);

/** Walk a directory recursively and return file paths. */
function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

/** Extract motion-ish tokens from a source file. */
function extractMotionTokens(text) {
  const tokens = new Set();

  // Core: any animate-xxx token
  for (const m of text.matchAll(/\banimate-[a-z0-9-]+\b/g)) tokens.add(m[0]);

  // Legacy motion utilities (non animate-* names)
  for (const m of text.matchAll(/\bflip-delay-[0-9]+\b/g)) tokens.add(m[0]);
  for (const m of text.matchAll(/\bresult-banner-shimmer\b/g)) tokens.add(m[0]);

  // Optional: chain highlight token
  for (const m of text.matchAll(/\banimate-chain\b/g)) tokens.add(m[0]);

  return tokens;
}

/** Extract utility class selectors from motions.css. */
function extractCssClasses(cssText) {
  const out = new Set();
  // Very small parser: capture `.className` in selectors.
  // We keep it conservative: class must start with [a-zA-Z_]
  for (const m of cssText.matchAll(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g)) {
    out.add(m[1]);
  }
  return out;
}

/** Extract Tailwind extend.animation keys and convert to animate-* utilities. */
function extractTailwindAnimateClasses(cfgText) {
  const out = new Set();

  // Grab the animation object body (best-effort).
  const m = cfgText.match(/animation\s*:\s*\{([\s\S]*?)\}\s*,/);
  if (!m) return out;
  const body = m[1];

  // Keys are typically quoted due to hyphens.
  for (const km of body.matchAll(/["']([a-zA-Z0-9-]+)["']\s*:/g)) {
    const key = km[1];
    out.add(`animate-${key}`);
  }

  return out;
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`[motion-audit] Missing src dir: ${SRC_DIR}`);
    process.exit(2);
  }

  const used = new Set();
  const files = walk(SRC_DIR).filter((p) => /\.(ts|tsx|js|jsx)$/.test(p));

  for (const p of files) {
    const txt = fs.readFileSync(p, "utf-8");
    for (const t of extractMotionTokens(txt)) used.add(t);
  }

  const allowed = new Set(DEFAULT_TW_ANIMATE);

  if (fs.existsSync(MOTIONS_CSS)) {
    const css = fs.readFileSync(MOTIONS_CSS, "utf-8");
    for (const c of extractCssClasses(css)) {
      // Add both raw class name and animate-xxx forms if present.
      allowed.add(c);
      allowed.add(`.${c}`);
    }
  }

  if (fs.existsSync(TAILWIND_CFG)) {
    const cfg = fs.readFileSync(TAILWIND_CFG, "utf-8");
    for (const c of extractTailwindAnimateClasses(cfg)) allowed.add(c);
  }

  const unknown = [...used].filter((t) => !allowed.has(t)).sort();

  console.log(`[motion-audit] scanned: ${files.length} files`);
  console.log(`[motion-audit] used motion tokens: ${used.size}`);
  console.log(`[motion-audit] allowed tokens: ${allowed.size}`);

  if (unknown.length) {
    console.error(`\n[motion-audit] ❌ Unknown motion tokens (${unknown.length})`);
    for (const t of unknown) console.error(` - ${t}`);
    console.error("\nHint: define missing tokens in tailwind.config.ts (extend.animation) or src/motions.css.");
    process.exit(1);
  }

  console.log("[motion-audit] ✅ OK — all motion tokens are defined.");
}

main();
