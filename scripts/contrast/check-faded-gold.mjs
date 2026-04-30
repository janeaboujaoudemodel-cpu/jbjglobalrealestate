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

const PATTERN = /\btext-gold\/(?:[1-7]\d?)\b/g;

let files = [];
try {
  files = execSync(`rg -l "text-gold/" src/ --type-add 'tsx:*.{ts,tsx,jsx,js}' -ttsx`, {
    encoding: "utf8",
  })
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
    const match = line.match(PATTERN);
    if (match) {
      violations.push({ file, line: i + 1, text: line.trim().slice(0, 120), match: match[0] });
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
  `\nReplace with text-gray-400…900 or solid text-gold. Add to ALLOWLIST in scripts/contrast/check-faded-gold.mjs only for branded watermarks on dark video.`
);
process.exit(1);
