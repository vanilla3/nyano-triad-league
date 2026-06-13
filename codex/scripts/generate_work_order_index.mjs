#!/usr/bin/env node
/**
 * Generate a simple index for codex/work_orders.
 *
 * Why:
 * - Work Orders are long-lived and can grow.
 * - Codex works better when it can quickly enumerate tasks by id + title.
 *
 * Output:
 * - codex/WORK_ORDERS_INDEX.md
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WO_DIR = path.join(ROOT, "codex", "work_orders");
const OUT = path.join(ROOT, "codex", "WORK_ORDERS_INDEX.md");

function listWorkOrders() {
  if (!fs.existsSync(WO_DIR)) return [];
  return fs
    .readdirSync(WO_DIR)
    .filter((f) => /^\d{3}_.+\.md$/i.test(f))
    .map((f) => path.join(WO_DIR, f));
}

function readFirstHeading(md) {
  const lines = md.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^#\s+(.+)\s*$/);
    if (m) return m[1].trim();
  }
  return "";
}

function titleFromFilename(filePath) {
  const base = path.basename(filePath).replace(/\.md$/i, "");
  const withoutId = base.replace(/^\d{3}_/, "");
  return withoutId.replace(/_/g, " ");
}

function readGoal(md) {
  const lines = md.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^(目的|Goal)\s*:\s*(.+)\s*$/);
    if (m) return m[2].trim();
  }
  return "";
}

function getId(filePath) {
  const base = path.basename(filePath);
  const m = base.match(/^(\d{3})_/);
  return m ? m[1] : "???";
}

const rows = [];
for (const file of listWorkOrders()) {
  const md = fs.readFileSync(file, "utf8");
  const heading = readFirstHeading(md);
  rows.push({
    id: getId(file),
    title: heading || titleFromFilename(file),
    goal: readGoal(md),
    rel: path.relative(ROOT, file).replace(/\\/g, "/"),
  });
}

rows.sort((a, b) => Number(a.id) - Number(b.id));

let out = "# Work Orders Index\n\n";
out += "このファイルは自動生成です。編集する場合は `codex/scripts/generate_work_order_index.mjs` を更新してください。\n\n";
out += "| ID | Title | Goal | Path |\n";
out += "|---:|---|---|---|\n";
for (const r of rows) {
  const goal = r.goal ? r.goal.replace(/\|/g, "\\|") : "";
  const title = r.title.replace(/\|/g, "\\|");
  out += `| ${r.id} | ${title} | ${goal} | \`${r.rel}\` |\n`;
}

fs.writeFileSync(OUT, out, "utf8");
console.log(`[work-order-index] wrote ${path.relative(ROOT, OUT)} (${rows.length} items)`);
