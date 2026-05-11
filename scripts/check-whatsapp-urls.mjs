#!/usr/bin/env node
/**
 * CI guard: forbids `api.whatsapp.com` and `web.whatsapp.com` URLs in source.
 * Every WhatsApp link MUST use `wa.me` (the runtime guard in
 * src/utils/whatsappGuard.ts enforces this at runtime too, but we catch it
 * at build time so reviewers see the violation immediately).
 *
 * Allowed:   https://wa.me/{digits}?text=…
 * Banned:    https://api.whatsapp.com/send?...
 *            https://web.whatsapp.com/send?...
 *
 * Run:  node scripts/check-whatsapp-urls.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = "src";
const EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);
const BANNED = /\b(?:api|web)\.whatsapp\.com\b/i;
// Files allowed to mention the banned hosts in *comments* (the guard + this script).
const ALLOWLIST = new Set([
  "src/utils/whatsappGuard.ts",
]);

const offences = [];

const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (EXT.has(extname(p))) scan(p);
  }
};

const scan = (file) => {
  if (ALLOWLIST.has(file.replace(/\\/g, "/"))) return;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (BANNED.test(line)) offences.push(`${file}:${i + 1}: ${line.trim()}`);
  });
};

walk(ROOT);

if (offences.length) {
  console.error("\n❌ Banned WhatsApp host detected — use https://wa.me/{digits} instead:\n");
  for (const o of offences) console.error("  " + o);
  console.error(
    "\nThe site-wide runtime guard (src/utils/whatsappGuard.ts) would auto-rewrite these,\n" +
    "but please replace them at the source so the codebase stays consistent.\n",
  );
  process.exit(1);
}

console.log("✓ WhatsApp URLs OK — no api.whatsapp.com / web.whatsapp.com usages.");
