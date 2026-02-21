import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const INCLUDE_EXT = new Set([".md", ".ts", ".tsx", ".js", ".mjs", ".css", ".json", ".toml"]);
const EXCLUDE_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".turbo", "coverage"]);
const EXCLUDE_PATH_CONTAINS = [
  `${path.sep}docs${path.sep}99_dev${path.sep}commit-`,
  `${path.sep}docs${path.sep}99_dev${path.sep}_archive${path.sep}`,
  `${path.sep}apps${path.sep}web${path.sep}src${path.sep}_archive${path.sep}`,
  `${path.sep}scripts${path.sep}check_text_hygiene.mjs`,
];

// Keep this strict enough to avoid false positives when docs mention
// single-character examples like `繧`/`縺`/`繝`.
const MOJIBAKE_PATTERNS = [
  /[繧縺繝荳譛逶隕鬘蜿螳遒邱][ｦ-ﾟ]/u,
  /(?:繧.{0,2}縺|縺.{0,2}繧|繝.{0,2}繧|譛.{0,2}荳|荳.{0,2}譛)/u,
];

function parseRootsFromArgs(argv) {
  const roots = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== "--root") continue;
    const next = argv[i + 1];
    if (typeof next === "string" && next.length > 0) {
      roots.push(path.resolve(REPO_ROOT, next));
      i += 1;
    }
  }
  if (roots.length > 0) return roots;
  return [REPO_ROOT];
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (EXCLUDE_DIRS.has(ent.name)) continue;
      walk(p, out);
      continue;
    }
    out.push(p);
  }
  return out;
}

function shouldSkip(filePath) {
  const rel = path.relative(REPO_ROOT, filePath);
  const relWithLeadingSep = `${path.sep}${rel}`;
  return EXCLUDE_PATH_CONTAINS.some((frag) => relWithLeadingSep.includes(frag));
}

function isControlChar(code) {
  return (
    (code >= 0x00 && code <= 0x08) ||
    code === 0x0b ||
    code === 0x0c ||
    (code >= 0x0e && code <= 0x1f) ||
    code === 0x7f ||
    code === 0x80
  );
}

function findFirstControlCharIndex(text) {
  for (let i = 0; i < text.length; i++) {
    if (isControlChar(text.charCodeAt(i))) return i;
  }
  return -1;
}

function findFirstPuaIndex(text) {
  for (let i = 0; i < text.length; i++) {
    const cp = text.codePointAt(i);
    if (typeof cp !== "number") continue;
    if (cp >= 0xe000 && cp <= 0xf8ff) return i;
    if (cp > 0xffff) i += 1;
  }
  return -1;
}

function lineInfo(text, index) {
  const safeIndex = Math.max(0, Math.min(index, Math.max(0, text.length - 1)));
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < safeIndex; i++) {
    if (text.charCodeAt(i) === 10) {
      line += 1;
      lineStart = i + 1;
    }
  }
  const lineEndPos = text.indexOf("\n", lineStart);
  const lineEnd = lineEndPos === -1 ? text.length : lineEndPos;
  const sourceLineRaw = text.slice(lineStart, lineEnd).replace(/\r/g, "");
  const sourceLine = sourceLineRaw.length > 180 ? `${sourceLineRaw.slice(0, 180)}...` : sourceLineRaw;
  return {
    line,
    col: safeIndex - lineStart + 1,
    sourceLine,
  };
}

function report(type, filePath, text, index, extra = "") {
  const relPath = path.relative(REPO_ROOT, filePath);
  const info = lineInfo(text, index);
  const extraSuffix = extra ? ` ${extra}` : "";
  console.error(
    `[text-hygiene] ${type}${extraSuffix} in ${relPath}:${info.line}:${info.col}\n  ${info.sourceLine}`,
  );
}

const roots = parseRootsFromArgs(process.argv.slice(2));
const files = roots
  .flatMap((root) => walk(root))
  .filter((f) => INCLUDE_EXT.has(path.extname(f)))
  .filter((f) => !shouldSkip(f));

let bad = 0;

for (const filePath of files) {
  const text = fs.readFileSync(filePath, "utf8");

  const replacementIndex = text.indexOf("\uFFFD");
  if (replacementIndex !== -1) {
    report("replacement-char", filePath, text, replacementIndex, "(U+FFFD)");
    bad += 1;
  }

  const controlIndex = findFirstControlCharIndex(text);
  if (controlIndex !== -1) {
    const hex = text.charCodeAt(controlIndex).toString(16).padStart(2, "0");
    report("control-char", filePath, text, controlIndex, `(0x${hex})`);
    bad += 1;
  }

  const puaIndex = findFirstPuaIndex(text);
  if (puaIndex !== -1) {
    const cp = text.codePointAt(puaIndex).toString(16).toUpperCase();
    report("private-use-char", filePath, text, puaIndex, `(U+${cp})`);
    bad += 1;
  }

  const mojibakeHit = MOJIBAKE_PATTERNS
    .map((pattern) => ({ pattern, match: pattern.exec(text) }))
    .find((item) => item.match);
  if (mojibakeHit?.match && typeof mojibakeHit.match.index === "number") {
    report("mojibake-pattern", filePath, text, mojibakeHit.match.index);
    bad += 1;
  }
}

if (bad > 0) {
  console.error(`\n[text-hygiene] FAIL: ${bad} issue(s) found.`);
  process.exit(1);
}

console.log("[text-hygiene] OK");
