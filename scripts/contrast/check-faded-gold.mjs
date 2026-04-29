#!/usr/bin/env node
/**
 * Static guard: fails CI if any source file reintroduces faded gold text
 * (text-gold/XX where XX < 80) outside the allowlist.
 *
 * Allowlist: branded watermarks intentionally faded over dark video.
 */
import { readFileSync } from "fs";
import { execSync } from "child_process";

const ALLOWLIST = new Set([
  // Add full filepaths here for legitimate brand watermarks.
  // Example: "src/components/video-meet/JBJMeetRoom.tsx",
]);

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
