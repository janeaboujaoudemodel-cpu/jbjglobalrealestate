#!/usr/bin/env node
/**
 * Static guard: fails CI if any source file reintroduces a same-tone
 * text-on-background combo (e.g. bg-foreground + text-foreground,
 * bg-[#1A1A1A] + text-[#1A1A1A]).
 *
 * Catches the worst readability bug class: invisible labels.
 */
import { execSync } from "child_process";

// NOTE: `(?!\/)` after each bg/text token excludes alpha-tinted variants
// (e.g. `bg-[#1A1A1A]/5`). `(?<![:\w-])` before each `text-…` token excludes
// state-prefixed swaps (e.g. `hover:text-[#1A1A1A]` paired with a non-ink bg
// on hover). Those represent legitimate hover/focus/data-state inversions,
// not static same-tone bugs.
const PATTERNS = [
  { id: "fg-fg",      re: /(?<![:\w-])bg-foreground(?!\/)[^"'`]*(?<![:\w-])text-foreground(?!\/)/g, msg: "bg-foreground + text-foreground" },
  { id: "primary-primary", re: /(?<![:\w-])bg-primary(?!-foreground)(?!\/)[^"'`]*(?<![:\w-])text-primary(?!-foreground)(?!\/)/g, msg: "bg-primary + text-primary" },
  { id: "ink-ink",    re: /(?<![:\w-])bg-\[#1A1A1A\](?!\/)[^"'`]*(?<![:\w-])text-\[#1A1A1A\](?!\/)/gi, msg: "bg-[#1A1A1A] + text-[#1A1A1A]" },
  { id: "champ-champ", re: /(?<![:\w-])bg-\[#FDFBF7\](?!\/)[^"'`]*(?<![:\w-])text-\[#FDFBF7\](?!\/)/gi, msg: "bg-[#FDFBF7] + text-[#FDFBF7]" },
  { id: "champ-champ-7", re: /(?<![:\w-])bg-\[#F7F2EA\](?!\/)[^"'`]*(?<![:\w-])text-\[#F7F2EA\](?!\/)/gi, msg: "bg-[#F7F2EA] + text-[#F7F2EA]" },
  { id: "black-black", re: /(?<![:\w-])bg-black(?!\/)[^"'`]*(?<![:\w-])text-black(?!\/)/g, msg: "bg-black + text-black" },
  { id: "white-white", re: /(?<![:\w-])bg-white(?!\/)[^"'`]*(?<![:\w-])text-white(?!\/)/g, msg: "bg-white + text-white" },
];

let files = [];
try {
  files = execSync(
    `rg -l --type-add 'tsx:*.{ts,tsx,jsx,js}' -ttsx "bg-(foreground|primary|black|white|\\[#)" src/`,
    { encoding: "utf8" }
  ).trim().split("\n").filter(Boolean);
} catch {
  console.log("✓ Same-tone guard: no candidate files.");
  process.exit(0);
}

const offenders = [];
for (const file of files) {
  const { readFileSync } = await import("fs");
  let content;
  try { content = readFileSync(file, "utf8"); } catch { continue; }
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    const matches = content.match(p.re);
    if (matches?.length) {
      offenders.push({ file, pattern: p.msg, count: matches.length, sample: matches[0] });
    }
  }
}

if (offenders.length === 0) {
  console.log("✓ Same-tone guard: no offenders.");
  process.exit(0);
}

console.error("✗ Same-tone guard FAILED — readability bug introduced:");
for (const o of offenders) {
  console.error(`  ${o.file}: ${o.pattern} (${o.count}x)`);
  console.error(`     sample: ${o.sample}`);
}
process.exit(1);
