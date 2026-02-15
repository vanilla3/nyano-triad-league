#!/usr/bin/env node
/**
 * Gemini image generation helper for UI prototyping.
 *
 * - Uses Gemini API REST endpoint (no extra deps)
 * - Supports single prompt or batch JSON.
 *
 * Required:
 *   GEMINI_API_KEY
 *
 * Examples:
 *   GEMINI_API_KEY=... node scripts/gemini_image_gen.mjs --prompt "..." --out apps/web/public/assets/gen/test.png
 *   GEMINI_API_KEY=... node scripts/gemini_image_gen.mjs --batch scripts/asset_prompts/nytl_ui_assets.v1.json
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    const isValue = next != null && !next.startsWith("--");
    if (isValue) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function readTextFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickEnvApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GENERATIVE_LANGUAGE_API_KEY;
}

function normalizeModalities(value) {
  if (!value) return ["Image"];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return ["Image"];
}

async function callGeminiGenerateContent({ apiKey, model, parts, generationConfig }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = JSON.stringify(json, null, 2);
    throw new Error(`Gemini API error: HTTP ${res.status} ${res.statusText}\n${details}`);
  }
  return json;
}

function extractImagesFromResponse(json) {
  const parts = json?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return { images: [], text: [] };

  const images = [];
  const text = [];
  for (const part of parts) {
    if (typeof part?.text === "string" && part.text.trim().length) {
      text.push(part.text);
    }

    const inline = part?.inlineData || part?.inline_data;
    const data = inline?.data;
    if (typeof data === "string" && data.length) {
      images.push({
        mimeType: inline?.mimeType || inline?.mime_type || "image/png",
        data,
      });
    }
  }
  return { images, text };
}

async function writeImageBuffer({ buffer, outPath, alsoWebp }) {
  ensureDir(outPath);

  const ext = path.extname(outPath).toLowerCase();
  const wantsWebp = alsoWebp === true;

  if (ext === ".png" && !wantsWebp) {
    fs.writeFileSync(outPath, buffer);
    return;
  }

  // Lazy import sharp to avoid hard dependency for users who only want raw PNG.
  const { default: sharp } = await import("sharp");

  if (ext === ".png") {
    fs.writeFileSync(outPath, buffer);
  } else {
    // Convert based on extension.
    const img = sharp(buffer);
    if (ext === ".webp") {
      await img.webp({ quality: 92 }).toFile(outPath);
    } else if (ext === ".jpg" || ext === ".jpeg") {
      await img.jpeg({ quality: 92 }).toFile(outPath);
    } else if (ext === ".avif") {
      await img.avif({ quality: 60 }).toFile(outPath);
    } else {
      // Default: keep original bytes
      fs.writeFileSync(outPath, buffer);
    }
  }

  if (wantsWebp && ext !== ".webp") {
    const webpPath = outPath.replace(/\.[^.]+$/, ".webp");
    await import("sharp").then(({ default: sharp2 }) => sharp2(buffer).webp({ quality: 92 }).toFile(webpPath));
  }
}

function resolveOutPaths(outTemplate, count) {
  if (count <= 1) return [outTemplate];
  if (outTemplate.includes("%d")) {
    return Array.from({ length: count }, (_, i) => outTemplate.replace(/%d/g, String(i + 1)));
  }
  // If multiple images but no placeholder, suffix.
  const ext = path.extname(outTemplate);
  const base = outTemplate.slice(0, -ext.length);
  return Array.from({ length: count }, (_, i) => `${base}_${i + 1}${ext}`);
}

async function runSingleJob(job) {
  const {
    apiKey,
    model,
    prompt,
    out,
    aspect,
    size,
    responseModalities,
    alsoWebp,
    skipExisting,
    force,
    sleepMs,
    printText,
  } = job;

  if (!force && skipExisting && fs.existsSync(out)) {
    console.log(`[skip] exists: ${out}`);
    return;
  }

  const generationConfig = {
    responseModalities: normalizeModalities(responseModalities),
    imageConfig: {
      aspectRatio: aspect,
    },
  };

  // imageSize is only documented for gemini-3-pro-image-preview, but we can still send it.
  if (size) {
    generationConfig.imageConfig.imageSize = size;
  }

  const json = await callGeminiGenerateContent({
    apiKey,
    model,
    parts: [{ text: prompt }],
    generationConfig,
  });

  const { images, text } = extractImagesFromResponse(json);

  if (printText && text.length) {
    console.log(text.join("\n\n"));
  }

  if (!images.length) {
    throw new Error(`No image parts returned by Gemini (model=${model}).`);
  }

  const outPaths = resolveOutPaths(out, images.length);
  for (let i = 0; i < images.length; i += 1) {
    const image = images[i];
    const outPath = outPaths[Math.min(i, outPaths.length - 1)];
    const buffer = Buffer.from(image.data, "base64");
    await writeImageBuffer({ buffer, outPath, alsoWebp });
    console.log(`[ok] ${outPath} (${image.mimeType}, ${buffer.byteLength} bytes)`);
  }

  if (sleepMs && Number.isFinite(Number(sleepMs)) && Number(sleepMs) > 0) {
    await sleep(Number(sleepMs));
  }
}

function coerceBool(value, defaultValue) {
  if (value === undefined) return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.toLowerCase();
    if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
    if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  }
  return defaultValue;
}

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = pickEnvApiKey();

  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY. Example:\n  GEMINI_API_KEY=... node scripts/gemini_image_gen.mjs --prompt \"...\" --out apps/web/public/assets/gen/test.png");
    process.exit(1);
  }

  const skipExisting = coerceBool(args["skip-existing"], true);
  const force = coerceBool(args["force"], false);
  const alsoWebp = coerceBool(args["also-webp"], false);
  const printText = coerceBool(args["print-text"], false);
  const sleepMs = args["sleep-ms"] ?? "0";

  if (args.batch) {
    const batchPath = String(args.batch);
    const raw = readTextFile(batchPath);
    const spec = JSON.parse(raw);
    const defaults = spec.defaults || {};
    const jobs = Array.isArray(spec.jobs) ? spec.jobs : [];

    console.log(`[batch] ${jobs.length} jobs from ${batchPath}`);

    for (const job of jobs) {
      const merged = {
        apiKey,
        model: job.model || defaults.model || args.model || "gemini-3-pro-image-preview",
        prompt: job.prompt,
        out: job.out,
        aspect: job.aspect || defaults.aspect || args.aspect || "1:1",
        size: job.size || defaults.size || args.size || undefined,
        responseModalities: job.responseModalities || defaults.responseModalities || args.modalities || ["Image"],
        alsoWebp: coerceBool(job.alsoWebp, alsoWebp || coerceBool(defaults.alsoWebp, false)),
        skipExisting,
        force,
        sleepMs: job.sleepMs ?? defaults.sleepMs ?? sleepMs,
        printText,
      };

      if (!merged.prompt || !merged.out) {
        console.warn(`[skip] invalid job: ${job?.id || "(no id)"}`);
        continue;
      }

      console.log(`\n[job] ${job.id || merged.out}`);
      await runSingleJob(merged);
    }
    return;
  }

  const model = String(args.model || "gemini-3-pro-image-preview");
  const prompt = args.prompt ? String(args.prompt) : args["prompt-file"] ? readTextFile(String(args["prompt-file"])) : "";
  const out = String(args.out || "image.png");
  const aspect = String(args.aspect || "1:1");
  const size = args.size ? String(args.size) : undefined;
  const modalities = args.modalities || ["Image"];

  if (!prompt.trim()) {
    console.error("Missing --prompt (or --prompt-file).\nExample: node scripts/gemini_image_gen.mjs --prompt \"...\" --out out.png");
    process.exit(1);
  }

  await runSingleJob({
    apiKey,
    model,
    prompt,
    out,
    aspect,
    size,
    responseModalities: modalities,
    alsoWebp,
    skipExisting,
    force,
    sleepMs,
    printText,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
