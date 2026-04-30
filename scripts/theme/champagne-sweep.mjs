#!/usr/bin/env node
/**
 * Champagne sweep — replace raw Tailwind grays with the champagne/gold palette.
 *
 * Maps applied to every .ts/.tsx file under src/ (minus allowlist):
 *   bg-white            → bg-[#FDFBF7]
 *   bg-gray-50/100      → bg-[#F7F2EA]
 *   bg-gray-200/300     → bg-[#EFE6D6]
 *   bg-gray-800/900/950 → bg-[#1A1A1A]   (preserve dark surfaces)
 *   text-gray-400/500   → text-[#8A7556]
 *   text-gray-600/700   → text-[#5A4A2E]
 *   text-gray-800/900   → text-[#1A1A1A]
 *   text-black          → text-[#1A1A1A]
 *   text-white          → text-white     (left alone — used on dark surfaces)
 *   border-gray-100..400→ border-[#B89555]/30
 *   border-gray-700..900→ border-[#1A1A1A]
 *   ring-gray-*         → ring-[#B89555]/30
 *   divide-gray-*       → divide-[#B89555]/20
 *   from/to/via-gray-*  → preserved hex equivalent for #1A1A1A or champagne
 *
 * Runs in DRY mode by default; pass --write to apply.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(ROOT, "src");
const ALLOWLIST = JSON.parse(
  fs.readFileSync(path.join(__dirname, "champagne-sweep.allowlist.json"), "utf8"),
);

const WRITE = process.argv.includes("--write");

const REPLACEMENTS = [
  // Backgrounds
  [/\bbg-white\b/g, "bg-[#FDFBF7]"],
  [/\bbg-gray-(?:50|100)\b/g, "bg-[#F7F2EA]"],
  [/\bbg-gray-(?:200|300)\b/g, "bg-[#EFE6D6]"],
  [/\bbg-gray-(?:400|500)\b/g, "bg-[#B89555]"],
  [/\bbg-gray-(?:600|700|800|900|950)\b/g, "bg-[#1A1A1A]"],
  [/\bbg-black\b/g, "bg-[#1A1A1A]"],

  // Text
  [/\btext-black\b/g, "text-[#1A1A1A]"],
  [/\btext-gray-(?:300|400)\b/g, "text-[#8A7556]"],
  [/\btext-gray-500\b/g, "text-[#8A7556]"],
  [/\btext-gray-(?:600|700)\b/g, "text-[#5A4A2E]"],
  [/\btext-gray-(?:800|900)\b/g, "text-[#1A1A1A]"],

  // Borders
  [/\bborder-gray-(?:100|200|300|400|500)\b/g, "border-[#B89555]/30"],
  [/\bborder-gray-(?:600|700|800|900)\b/g, "border-[#1A1A1A]"],
  [/\bborder-black\b/g, "border-[#1A1A1A]"],

  // Rings & dividers
  [/\bring-gray-\d{2,3}\b/g, "ring-[#B89555]/30"],
  [/\bdivide-gray-\d{2,3}\b/g, "divide-[#B89555]/20"],

  // Hover variants (most common patterns)
  [/\bhover:bg-gray-(?:50|100)\b/g, "hover:bg-[#F7F2EA]"],
  [/\bhover:bg-gray-(?:200|300)\b/g, "hover:bg-[#EFE6D6]"],
  [/\bhover:bg-gray-(?:600|700|800|900)\b/g, "hover:bg-[#1A1A1A]"],
  [/\bhover:text-gray-(?:600|700|800|900)\b/g, "hover:text-[#1A1A1A]"],
  [/\bhover:border-gray-\d{2,3}\b/g, "hover:border-[#B89555]"],
];

function shouldSkip(rel) {
  if (ALLOWLIST.skipFiles.includes(rel)) return true;
  return ALLOWLIST.skipDirs.some((d) => rel.startsWith(d + "/") || rel === d);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

let filesChanged = 0;
let totalReplacements = 0;
const sample = [];

for (const file of walk(SRC)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const relSrc = rel.replace(/^src\//, "src/");
  if (shouldSkip(relSrc.replace(/^src\//, ""))) continue;

  const original = fs.readFileSync(file, "utf8");
  let next = original;
  let fileCount = 0;
  for (const [re, to] of REPLACEMENTS) {
    next = next.replace(re, (m) => {
      fileCount++;
      return typeof to === "function" ? to(m) : to;
    });
  }
  if (fileCount > 0 && next !== original) {
    filesChanged++;
    totalReplacements += fileCount;
    if (sample.length < 10) sample.push(`${rel} (${fileCount})`);
    if (WRITE) fs.writeFileSync(file, next, "utf8");
  }
}

console.log(`\nChampagne sweep ${WRITE ? "APPLIED" : "(dry run)"}`);
console.log(`  files changed:  ${filesChanged}`);
console.log(`  replacements:   ${totalReplacements}`);
console.log(`  sample:`);
for (const s of sample) console.log(`    ${s}`);
console.log(WRITE ? "\nDone." : "\nRun with --write to apply.\n");
