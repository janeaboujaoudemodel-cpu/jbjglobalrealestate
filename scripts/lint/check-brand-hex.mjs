#!/usr/bin/env node
/**
 * Advisory lint — flags raw navy/gold hex literals that should be
 * migrated to the `brand-*` Tailwind tokens or `BRAND` JS constants.
 *
 *   Usage:   node scripts/lint/check-brand-hex.mjs
 *
 * Non-blocking: prints a per-file count + a few sample offenders so
 * future work can chip away at the ~10k remaining inlined hexes
 * without re-planning. Exits 0 always.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC  = join(ROOT, "src");

const HEX = /#102540|#B89555|#1a3d63|#143052/gi;

const SUGGESTIONS = {
  "#102540": "brand-blue / BRAND.blue / var(--brand-blue)",
  "#b89555": "brand-gold / BRAND.gold / var(--brand-gold)",
  "#1a3d63": "brand-blue-hover / BRAND.blueHover",
  "#143052": "brand-blue-deep / BRAND.blueDeep",
};

const ALLOWLIST = new Set([
  "src/lib/brand-tokens.ts",
  "src/styles/theme-tokens.css",
  "scripts/lint/check-brand-hex.mjs",
]);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      yield* walk(p);
    } else if (/\.(tsx?|css)$/.test(name)) {
      yield p;
    }
  }
}

let totalFiles = 0;
let totalHits  = 0;
const offenders = [];

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (ALLOWLIST.has(rel)) continue;
  const txt = readFileSync(file, "utf8");
  const matches = txt.match(HEX);
  if (!matches) continue;
  totalFiles += 1;
  totalHits  += matches.length;
  offenders.push({ rel, count: matches.length });
}

offenders.sort((a, b) => b.count - a.count);

console.log(`[brand-hex] ${totalHits} raw hex literal(s) across ${totalFiles} file(s)`);
console.log(`[brand-hex] suggested replacements:`);
for (const [hex, hint] of Object.entries(SUGGESTIONS)) {
  console.log(`            ${hex.padEnd(8)} → ${hint}`);
}
console.log(`[brand-hex] top 20 offenders:`);
for (const o of offenders.slice(0, 20)) {
  console.log(`  ${String(o.count).padStart(5)}  ${o.rel}`);
}
process.exit(0);
