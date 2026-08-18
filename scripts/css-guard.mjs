#!/usr/bin/env node
/**
 * JBJ-017: !important freeze guard.
 *
 * Counts `!important` declarations across src/**\/*.css and compares the
 * total against a frozen baseline. The baseline is not "the current count" —
 * it is the count agreed at freeze time (see docs/CSS_ARCHITECTURE.md). If
 * the live count is already above baseline, that gap is existing drift the
 * guard is meant to surface, not silently re-baseline away.
 *
 * Usage:
 *   node scripts/css-guard.mjs         # report only, always exits 0
 *   node scripts/css-guard.mjs --ci    # exits 1 if count > BASELINE
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');

const BASELINE = 7888;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      out.push(full);
    }
  }
  return out;
}

function countImportant(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const matches = text.match(/!important/g);
  return matches ? matches.length : 0;
}

const files = walk(srcDir).sort();
const perFile = files.map((f) => ({
  file: path.relative(root, f),
  count: countImportant(f),
})).filter((f) => f.count > 0);

const total = perFile.reduce((sum, f) => sum + f.count, 0);
const delta = total - BASELINE;

console.log(`css-guard: !important count = ${total} (baseline ${BASELINE}, delta ${delta >= 0 ? '+' : ''}${delta})`);

if (delta > 0) {
  console.log('');
  console.log('Top files by !important count:');
  for (const f of perFile.slice().sort((a, b) => b.count - a.count).slice(0, 15)) {
    console.log(`  ${f.count.toString().padStart(5)}  ${f.file}`);
  }
}

const isCi = process.argv.includes('--ci');

if (delta > 0) {
  console.log('');
  console.log(
    isCi
      ? 'FAIL: !important count exceeds the frozen baseline. See docs/CSS_ARCHITECTURE.md.'
      : 'WARN: !important count exceeds the frozen baseline. See docs/CSS_ARCHITECTURE.md.'
  );
  if (isCi) process.exit(1);
} else {
  console.log('OK: !important count is at or below the frozen baseline.');
}
