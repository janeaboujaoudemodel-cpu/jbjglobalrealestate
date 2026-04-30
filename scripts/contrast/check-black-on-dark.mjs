#!/usr/bin/env node
/**
 * Static "black-on-dark" rule — fails when `text-black` (or `text-black/NN`)
 * is statically nested inside a known dark wrapper class on the same element
 * or in the same JSX className segment.
 *
 * Mirror of check-white-on-light.mjs. Catches the inverse regression: black
 * (or near-black foreground tokens) sitting on bg-black / bg-zinc-950 / etc.,
 * which can sneak in when a global `text-foreground` override flips dark.
 *
 * Heuristic-only — the runtime `[data-surface="dark"] .text-black` guard in
 * index.css catches the rest at runtime.
 *
 * Exit 1 on violations. Allowlist via // contrast-ok comment on the line.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const SRC = path.join(root, 'src');

// Solid dark backgrounds only — translucent overlays (bg-black/40) are
// commonly used as scrims on dark imagery and are not a regression.
const DARK_CLASS_RE =
  /\b(bg-black(?!\/)|bg-zinc-(?:800|900|950)(?!\/)|bg-neutral-(?:800|900|950)(?!\/)|bg-slate-(?:800|900|950)(?!\/)|bg-gray-(?:800|900|950)(?!\/)|bg-obsidian(?!\/)|bg-\[#0[0-9A-Fa-f]{5}\](?!\/)|bg-\[#1[0-9A-Fa-f]{5}\](?!\/)|from-black(?!\/)|from-zinc-(?:800|900|950)(?!\/)|from-neutral-(?:800|900|950)(?!\/))\b/;

// Solid black or near-black text. Excludes state-prefixed forms (hover:,
// focus:, group-hover:, dark:, data-[…]:) — those are intentional swaps.
const BLACK_TEXT_RE =
  /(?<![:\w-])(text-black(?!\/)|text-zinc-(?:900|950)(?!\/)|text-neutral-(?:900|950)(?!\/))\b/;

const exts = new Set(['.tsx', '.jsx']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(entry.name))) out.push(p);
  }
  return out;
}

function check() {
  const files = walk(SRC);
  const violations = [];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('contrast-ok')) return;
      const segments = line.split(/['"`]|\?|:|,|\$\{|\}/);
      for (const seg of segments) {
        if (!BLACK_TEXT_RE.test(seg)) continue;
        if (DARK_CLASS_RE.test(seg)) {
          violations.push({
            file: path.relative(root, file),
            line: idx + 1,
            snippet: line.trim().slice(0, 200),
          });
          break;
        }
      }
    });
  }

  if (violations.length === 0) {
    console.log('✓ No static black-on-dark contrast regressions found.');
    return;
  }

  console.error(`✗ Found ${violations.length} black-on-dark contrast risk(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.snippet}`);
  }
  console.error(
    '\nFix: use text-white / text-foreground on dark surfaces, or add // contrast-ok if intentional (e.g. light hover swap on a dark base).',
  );
  process.exit(1);
}

check();
