#!/usr/bin/env node
/**
 * Pass 11 — CI guard: prevent regressing into blue hover/active/focus states.
 * Scans src for forbidden blue Tailwind classes and raw blue hex literals.
 * Champagne-Gold standard requires gold/champagne/ink only for state surfaces.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const ROOT = "src";
const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);

// Blue tokens that affect interactive states. We deliberately ignore
// semantic data-viz blue ("text-data-blue", "--data-blue") which is allowed.
const PATTERNS = [
  /\b(?:hover|focus|focus-visible|active|data-\[state=active\]|aria-selected):(?:ring|border|bg|outline|text)-blue-\d{2,3}\b/,
  /\bring-blue-\d{2,3}\b/,
  /\bborder-blue-\d{2,3}\b/,
  /\bbg-blue-\d{2,3}\b/,
  /\baccent-blue-\d{2,3}\b/,
  /\boutline-blue-\d{2,3}\b/,
  /\btext-blue-\d{2,3}\b/,
  /#(?:3b82f6|2563eb|1d4ed8|60a5fa|93c5fd|1e40af|1e3a8a)\b/i,
];

const ALLOW_FILES = new Set([
  // Allowlist for data-viz primitives if needed
]);

let hits = [];

async function walk(dir) {
  const entries = await readdir(dir);
  for (const e of entries) {
    const p = join(dir, e);
    const s = await stat(p);
    if (s.isDirectory()) await walk(p);
    else if (EXT.has(extname(p))) await scan(p);
  }
}

async function scan(file) {
  if (ALLOW_FILES.has(file)) return;
  const text = await readFile(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    for (const pat of PATTERNS) {
      if (pat.test(line)) {
        hits.push({ file, line: i + 1, text: line.trim().slice(0, 160), pattern: pat.source });
        break;
      }
    }
  });
}

await walk(ROOT);

if (hits.length) {
  console.error(`\n✗ Blue-state guard: ${hits.length} violation(s)\n`);
  for (const h of hits.slice(0, 50)) {
    console.error(`  ${h.file}:${h.line}\n    ${h.text}`);
  }
  if (hits.length > 50) console.error(`  …and ${hits.length - 50} more`);
  console.error(
    "\nReplace with champagne tokens: ring-[#B89555]/40, border-[#B89555]/30, bg-[#EFE6D6], text-[#1A1A1A]"
  );
  process.exit(1);
} else {
  console.log("✓ Blue-state guard: no blue interactive states found.");
}
