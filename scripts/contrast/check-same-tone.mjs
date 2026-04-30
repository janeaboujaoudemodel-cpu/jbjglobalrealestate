#!/usr/bin/env node
/**
 * Static guard: fails CI if any source file reintroduces a same-tone
 * text-on-background combo (e.g. bg-foreground + text-foreground,
 * bg-[#1A1A1A] + text-[#1A1A1A]).
 *
 * Catches the worst readability bug class: invisible labels.
 */
import { execSync } from "child_process";

const PATTERNS = [
  // Token-based same-tone
  { id: "fg-fg",      re: /bg-foreground[^"'`]*text-foreground/g, msg: "bg-foreground + text-foreground" },
  { id: "primary-primary", re: /bg-primary(?!-foreground)(?!\/)[^"'`]*text-primary(?!-foreground)/g, msg: "bg-primary + text-primary" },
  // Hex literal same-tone (ink)
  { id: "ink-ink",    re: /bg-\[#1A1A1A\][^"'`]*text-\[#1A1A1A\]/gi, msg: "bg-[#1A1A1A] + text-[#1A1A1A]" },
  // Hex literal same-tone (champagne)
  { id: "champ-champ", re: /bg-\[#FDFBF7\][^"'`]*text-\[#FDFBF7\]/gi, msg: "bg-[#FDFBF7] + text-[#FDFBF7]" },
  { id: "champ-champ-7", re: /bg-\[#F7F2EA\][^"'`]*text-\[#F7F2EA\]/gi, msg: "bg-[#F7F2EA] + text-[#F7F2EA]" },
  // Black on black
  { id: "black-black", re: /bg-black[^"'`]*text-black/g, msg: "bg-black + text-black" },
  // White on white
  { id: "white-white", re: /bg-white[^"'`]*text-white/g, msg: "bg-white + text-white" },
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
