#!/usr/bin/env node
/**
 * Codex Doctor
 *
 * A lightweight, dependency-free sanity checker that helps ensure the repo is
 * in a "Codex can self-drive" state.
 *
 * Philosophy:
 * - Fail on things that commonly cause silent breakage (duplicate work orders,
 *   encoding corruption, missing motion wiring).
 * - Warn on optional-but-important setup (deploy docs, vercel.json, bootstrap).
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function readText(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function warn(msg) {
  console.warn(`⚠️  ${msg}`);
}

function listMdFiles(dir) {
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .map((f) => path.join(dir, f));
}

function getWorkOrderPrefix(file) {
  const base = path.basename(file);
  const m = base.match(/^(\d{3})_/);
  return m ? m[1] : null;
}

function checkWorkOrdersUnique() {
  const dir = path.join(ROOT, "codex", "work_orders");
  const files = listMdFiles(dir);
  const byPrefix = new Map();
  for (const f of files) {
    const p = getWorkOrderPrefix(f);
    if (!p) continue;
    const list = byPrefix.get(p) ?? [];
    list.push(f);
    byPrefix.set(p, list);
  }

  const dups = [...byPrefix.entries()].filter(([, v]) => v.length > 1);
  if (dups.length) {
    fail(`Duplicate work order id prefixes detected in ${dir}`);
    for (const [p, v] of dups) {
      console.error(`  - ${p}:`);
      for (const f of v) console.error(`    - ${path.relative(ROOT, f)}`);
    }
    return;
  }
  ok(`Work order ids are unique (${files.length} files)`);
}

function checkPnpmPolicy() {
  const lock = path.join(ROOT, "pnpm-lock.yaml");
  const pkgLock = path.join(ROOT, "package-lock.json");

  if (!exists(lock)) warn("pnpm-lock.yaml not found (is this repo initialized with pnpm?)");
  else ok("pnpm-lock.yaml present");

  if (exists(pkgLock)) fail("package-lock.json exists — remove it to keep pnpm policy consistent");
  else ok("No package-lock.json");
}

function checkTextHygiene() {
  const script = path.join(ROOT, "scripts", "check_text_hygiene.mjs");
  if (!exists(script)) {
    fail("scripts/check_text_hygiene.mjs missing");
    return;
  }

  try {
    execSync(`node ${script} --root apps/web/src --root codex --root docs`, {
      stdio: "inherit",
    });
    ok("Text hygiene OK (apps/web/src + codex + docs)");
  } catch {
    fail("Text hygiene failed — fix mojibake/control/PUA/replacement chars before running Codex");
  }
}

function checkMotionLint() {
  const script = path.join(ROOT, "scripts", "audit_motion_usage_v1.mjs");
  if (!exists(script)) {
    warn("scripts/audit_motion_usage_v1.mjs missing (motion lint will be skipped)");
    return;
  }

  try {
    execSync(`node ${script}`, { stdio: "inherit" });
    ok("Motion usage lint OK (animate-* classes are defined)");
  } catch {
    fail("Motion usage lint failed — missing CSS/Tailwind animation definitions");
  }
}

function checkMotionWiring() {
  const main = path.join(ROOT, "apps", "web", "src", "main.tsx");
  if (!exists(main)) {
    fail("apps/web/src/main.tsx missing");
    return;
  }
  const mainText = readText(main);

  const hasStyles = mainText.includes('import "./styles.css"') || mainText.includes("import './styles.css'");
  const hasMotions = mainText.includes('import "./motions.css"') || mainText.includes("import './motions.css'");

  if (!hasStyles) warn("apps/web/src/main.tsx does not import ./styles.css (global tokens may be missing)");
  else ok("Global styles wired (styles.css)");

  if (!hasMotions) {
    fail("apps/web/src/main.tsx does not import ./motions.css — legacy motion utilities may not apply");
  } else {
    ok("Motion utilities wired (motions.css)");
  }

  const motionsCss = path.join(ROOT, "apps", "web", "src", "motions.css");
  if (!exists(motionsCss)) fail("apps/web/src/motions.css missing");
  else {
    const css = readText(motionsCss);
    // Tailwind's PostCSS pipeline can error if a *separately imported* CSS file
    // contains `@layer utilities` without `@tailwind utilities` in the same file.
    // We intentionally keep motions.css as plain CSS.
    if (/^\s*@layer\s+/m.test(css)) {
      fail(
        "apps/web/src/motions.css contains @layer directives — remove them (Tailwind may error). Move layered rules into styles.css instead.",
      );
    }
  }

  const indexHtml = path.join(ROOT, "apps", "web", "index.html");
  if (exists(indexHtml)) {
    const html = readText(indexHtml);
    const hasBootstrap = html.includes("nytl.vfx.quality") && html.includes("nytl.theme");
    if (hasBootstrap) ok("index.html bootstrap present (theme/vfx early)");
    else warn("index.html bootstrap not found — may see 1st-frame flash of theme/VFX");
  } else {
    warn("apps/web/index.html missing");
  }
}

function checkDeployDocs() {
  const deployCandidates = [
    path.join(ROOT, "docs", "03_ops", "DEPLOYMENT_VERCEL_RAILWAY_v1_ja.md"),
    path.join(ROOT, "docs", "deploy", "VERCEL_RAILWAY_DEPLOY.md"),
  ];
  const found = deployCandidates.find((p) => exists(p));
  if (found) ok(`Deploy doc present: ${path.relative(ROOT, found)}`);
  else warn("Deploy doc missing (expected docs/03_ops/DEPLOYMENT_VERCEL_RAILWAY_v1_ja.md)");

  const vercelJson = path.join(ROOT, "vercel.json");
  if (exists(vercelJson)) ok("vercel.json present");
  else warn("vercel.json missing (Vercel deploy will need manual setup)");
}

function checkCodexRules() {
  const rules = path.join(ROOT, "codex", "rules", "nyano.project.rules");
  if (!exists(rules)) {
    warn("codex/rules/nyano.project.rules missing (command approvals may be noisy)");
    return;
  }

  const t = readText(rules);
  if (t.includes("on-failure")) warn("codex rules mention deprecated approval mode 'on-failure' — consider removing");
  else ok("Codex rules file present");
}

function checkIndexes() {
  const woIndex = path.join(ROOT, "codex", "WORK_ORDERS_INDEX.md");
  if (exists(woIndex)) ok("Work order index present (codex/WORK_ORDERS_INDEX.md)");
  else warn("Work order index missing — optional but helps navigation");
}

console.log("=== Codex Doctor ===");

checkWorkOrdersUnique();
checkPnpmPolicy();
checkTextHygiene();
checkMotionLint();
checkMotionWiring();
checkDeployDocs();
checkCodexRules();
checkIndexes();

if (process.exitCode && process.exitCode !== 0) {
  console.error("\nDoctor found problems. Fix them before handing the repo to Codex.");
  process.exit(process.exitCode);
}

console.log("\nAll good — repo looks ready for Codex automation.");
