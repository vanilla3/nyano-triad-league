#!/usr/bin/env node
/**
 * Text Hygiene Checker
 *
 * Detects:
 * - mojibake signature characters (common UTF-8/CP932 corruption artifacts)
 * - control characters (C0 + C1 controls, excluding \n \r \t)
 * - Private Use Area characters (PUA) that rely on special fonts and often render as tofu
 *
 * Usage:
 *   node scripts/check_text_hygiene.mjs
 *   node scripts/check_text_hygiene.mjs --root apps/web/src --root docs
 */
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);

function readArgValues(flag) {
  const values = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === flag && typeof argv[i + 1] === "string") {
      values.push(argv[i + 1]);
      i += 1;
    }
  }
  return values;
}

const roots = readArgValues("--root");
// Default to product source only. Use --root for broader scans.
const scanRoots = roots.length ? roots : ["apps/web/src"];

const exts = new Set([".ts", ".tsx", ".css", ".md", ".json"]);

const mojibakeSignatures = [
  "繧",
  "縺",
  "繝",
  "郢ｧ",
  "邵ｺ",
  "隨渉",
  "陷茨",
];

function isControl(codePoint) {
  // Exclude \n \r \t. We flag other C0 controls and all C1 controls.
  if (codePoint === 0x0a || codePoint === 0x0d || codePoint === 0x09) return false;
  if (codePoint < 0x20) return true;
  if (codePoint >= 0x7f && codePoint <= 0x9f) return true;
  return false;
}

function isPua(codePoint) {
  // BMP Private Use Area + supplementary PUAs.
  if (codePoint >= 0xe000 && codePoint <= 0xf8ff) return true;
  if (codePoint >= 0xf0000 && codePoint <= 0xffffd) return true;
  if (codePoint >= 0x100000 && codePoint <= 0x10fffd) return true;
  return false;
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".next" || entry.name === ".git") continue;
      walk(full, out);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!exts.has(ext)) continue;
      out.push(full);
    }
  }
}

function findIssues(text) {
  const issues = [];

  // Mojibake signatures
  for (const sig of mojibakeSignatures) {
    const idx = text.indexOf(sig);
    if (idx !== -1) {
      issues.push({ type: "mojibake", idx, detail: sig });
      break;
    }
  }

  // Control chars + PUA scan
  for (let i = 0; i < text.length; i += 1) {
    const codePoint = text.codePointAt(i);
    if (codePoint === undefined) continue;

    if (isControl(codePoint)) {
      issues.push({ type: "control", idx: i, detail: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}` });
      break;
    }
    if (isPua(codePoint)) {
      issues.push({ type: "pua", idx: i, detail: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}` });
      break;
    }

    // codePointAt advances for surrogate pairs; skip the next code unit if needed.
    if (codePoint > 0xffff) i += 1;
  }

  return issues;
}

function idxToLineCol(text, idx) {
  let line = 1;
  let lastNl = -1;
  for (let i = 0; i < idx; i += 1) {
    if (text.charCodeAt(i) === 10) {
      line += 1;
      lastNl = i;
    }
  }
  const col = idx - lastNl;
  return { line, col };
}

const files = [];
for (const r of scanRoots) walk(r, files);

const problems = [];

for (const file of files) {
  let text = "";
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const issues = findIssues(text);
  if (!issues.length) continue;

  for (const issue of issues) {
    const { line, col } = idxToLineCol(text, issue.idx);
    const lines = text.split(/\r?\n/);
    const contextLine = lines[Math.max(0, line - 1)] ?? "";
    problems.push({
      file,
      line,
      col,
      type: issue.type,
      detail: issue.detail,
      context: contextLine.slice(0, 200),
    });
  }
}

if (problems.length) {
  console.error("Text hygiene check failed. Problems found:\n");
  for (const p of problems) {
    console.error(`- ${p.type.toUpperCase()} ${p.detail} at ${p.file}:${p.line}:${p.col}`);
    if (p.context) console.error(`  ${p.context}`);
  }
  console.error(`\nTotal problems: ${problems.length}`);
  process.exit(1);
}

console.log("Text hygiene check passed.");
process.exit(0);