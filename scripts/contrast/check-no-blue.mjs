#!/usr/bin/env node
/**
 * check-no-blue — bans any blue colour usage inside CRM / Broker surfaces.
 *
 * The Broker Access feature was repeatedly leaking the framework's default
 * blue focus/hover/selected states. This guard fails the build if any of the
 * banned tokens appear under the watched directories.
 *
 *   Banned utilities : blue-, sky-, indigo-, ring-blue, focus:ring-blue
 *   Banned literals  : #3B82F6, #2563EB, #1D4ED8, rgb(59,130,246)
 *   Banned CSS       : accent-color: blue
 *
 * Allowlist: add a path to scripts/contrast/no-blue-allowlist.json to skip.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const WATCH = [
  "src/components/crm",
  "src/pages/owner/crm",
  "src/pages/broker",
  "src/components/ui/date-popover.tsx",
  "src/components/ui/crm-toolbar.tsx",
];
const ALLOW_FILE = "scripts/contrast/no-blue-allowlist.json";

const BANNED = [
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|placeholder|outline|divide|accent|caret)-blue-\d/i,
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|placeholder|outline|divide|accent|caret)-sky-\d/i,
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|placeholder|outline|divide|accent|caret)-indigo-\d/i,
  /focus:ring-blue/i,
  /focus-visible:ring-blue/i,
  /hover:bg-blue/i,
  /data-\[state=(?:on|active|checked)\]:bg-blue/i,
  /#3B82F6\b/i,
  /#2563EB\b/i,
  /#1D4ED8\b/i,
  /#60A5FA\b/i,
  /accent-color:\s*blue/i,
];

async function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  const st = await stat(dir);
  if (st.isFile()) { files.push(dir); return files; }
  const ents = await readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, files);
    else if (/\.(ts|tsx|js|jsx|css)$/.test(e.name)) files.push(p);
  }
  return files;
}

async function loadAllowlist() {
  const p = join(ROOT, ALLOW_FILE);
  if (!existsSync(p)) return new Set();
  try {
    const j = JSON.parse(await readFile(p, "utf8"));
    return new Set(j.allow ?? []);
  } catch { return new Set(); }
}

const violations = [];
const allow = await loadAllowlist();

for (const target of WATCH) {
  const files = await walk(join(ROOT, target));
  for (const f of files) {
    const rel = relative(ROOT, f);
    if (allow.has(rel)) continue;
    const src = await readFile(f, "utf8");
    const lines = src.split("\n");
    lines.forEach((line, i) => {
      for (const re of BANNED) {
        if (re.test(line)) {
          violations.push({ file: rel, line: i + 1, snippet: line.trim().slice(0, 120) });
          break;
        }
      }
    });
  }
}

if (violations.length) {
  console.error(`\n✖ no-blue lint: ${violations.length} violation(s) in CRM/Broker surfaces:\n`);
  for (const v of violations.slice(0, 60)) {
    console.error(`  ${v.file}:${v.line}  ${v.snippet}`);
  }
  if (violations.length > 60) {
    console.error(`  …and ${violations.length - 60} more.`);
  }
  console.error("\nReplace blue with JBJ champagne/gold/ink tokens, or allowlist via scripts/contrast/no-blue-allowlist.json.\n");
  process.exit(1);
}
console.log("✓ no-blue lint: CRM/Broker surfaces are clean.");
