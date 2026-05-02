#!/usr/bin/env node
/**
 * Static guard: fails CI if any source file reintroduces faded gold text
 * (text-gold/XX where XX < 80) outside the allowlist.
 *
 * Allowlist: branded watermarks intentionally faded over dark video.
 */
import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Allowlist source-of-truth: scripts/contrast/faded-gold-allowlist.json
// Managed by owners via the admin page at /admin/faded-gold-allowlist.
const __dirname = dirname(fileURLToPath(import.meta.url));
const ALLOWLIST_PATH = join(__dirname, "faded-gold-allowlist.json");
let ALLOWLIST = new Set();
if (existsSync(ALLOWLIST_PATH)) {
  try {
    const data = JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8"));
    if (Array.isArray(data?.files)) ALLOWLIST = new Set(data.files);
  } catch (err) {
    console.error(`! Failed to parse ${ALLOWLIST_PATH}: ${err.message}`);
    process.exit(2);
  }
}

// Original tailwind faded-gold pattern (text-gold/00 … text-gold/79)
const PATTERN = /\btext-gold\/(?:[1-7]\d?)\b/g;

// Banned faded gold-tone HEX equivalents used as text colour. These muddy
// browns (#5A4A2E, #3A2D1D, plus their close siblings) sit at ~3:1 contrast
// on the #FDFBF7 champagne page and read as "champagne on champagne". They
// are the non-tailwind equivalent of `text-gold/40` and are forbidden in
// the same way. Decorative borders / backgrounds (`border-[#5A4A2E]`,
// `bg-[#5A4A2E]`) are fine — only `text-` (and its variants) is banned.
const HEX_PATTERN =
  /\b(?:hover:|focus:|group-hover:|placeholder:)?text-\[#(5A4A2E|3A2D1D|6B5A3E|7A6747|8A7556)\]/gi;

let files = [];
try {
  files = execSync(
    `rg -l "text-gold/|text-\\[#(5A4A2E|3A2D1D|6B5A3E|7A6747|8A7556)\\]" src/ --type-add 'tsx:*.{ts,tsx,jsx,js}' -ttsx`,
    { encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
} catch {
  // ripgrep returns 1 when no matches — that's a pass.
  console.log("✓ Faded-gold guard: no occurrences found.");
  process.exit(0);
}

const violations = [];
for (const file of files) {
  if (ALLOWLIST.has(file)) continue;
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    const tailwindMatch = line.match(PATTERN);
    if (tailwindMatch) {
      violations.push({ file, line: i + 1, text: line.trim().slice(0, 120), match: tailwindMatch[0] });
    }
    // Reset state for global regex
    HEX_PATTERN.lastIndex = 0;
    const hexMatch = line.match(HEX_PATTERN);
    if (hexMatch) {
      violations.push({ file, line: i + 1, text: line.trim().slice(0, 120), match: hexMatch[0] });
    }
  });
}

if (violations.length === 0) {
  console.log("✓ Faded-gold guard: clean.");
  process.exit(0);
}

console.error(`✗ Faded-gold guard: ${violations.length} violation(s) found.\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.match}]`);
  console.error(`    ${v.text}`);
}
console.error(
  `\nReplace with text-gray-400…900 or solid text-gold. To allowlist a branded watermark, use the admin page at /admin/faded-gold-allowlist (writes scripts/contrast/faded-gold-allowlist.json).`
);
process.exit(1);
