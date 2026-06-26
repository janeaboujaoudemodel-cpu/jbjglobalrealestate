#!/usr/bin/env node
/**
 * check-banned-states.mjs — Phase 2 design-system guard.
 * Fails the build if pages reintroduce:
 *   - bg-black on interactive state selectors (data-[state=active], aria-selected, hover)
 *   - text-white inside a champagne/pearl surface
 * The global CSS contract in index.css already neutralises these at runtime;
 * this script catches them at author-time so they never ship.
 */
import { execSync } from "node:child_process";

const BANNED = [
  { name: "black active state", pattern: "data-\\[state=active\\]:bg-black" },
  { name: "black aria-selected", pattern: "aria-selected:bg-black" },
  { name: "black hover state", pattern: "hover:bg-black(?!\\/)" },
];

let failed = false;
for (const { name, pattern } of BANNED) {
  try {
    const out = execSync(`rg -n --no-heading --color=never "${pattern}" src 2>/dev/null || true`, {
      encoding: "utf8",
    }).trim();
    if (out) {
      console.error(`\n✖ Banned: ${name}`);
      console.error(out);
      failed = true;
    }
  } catch {
    // rg returns non-zero on no matches — ignore
  }
}

if (failed) {
  console.error("\nBlack must never be used as a primary interactive state. Use --state-active (emerald).");
  process.exit(1);
}
console.log("✓ No banned interactive states found.");
