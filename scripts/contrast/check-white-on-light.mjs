#!/usr/bin/env node
/**
 * Static "white-on-light" rule — fails when `text-white` (or `text-white/NN`)
 * is statically nested inside a known light wrapper class on the same element
 * or a direct ancestor in the same JSX className string.
 *
 * Heuristic-only — covers the obvious regressions; the runtime
 * `[data-surface="light"] .text-white` guard in index.css catches the rest.
 *
 * Exit 1 on violations. Allowlist via // contrast-ok comment on the line.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const SRC = path.join(root, 'src');

// Only flag SOLID light backgrounds — translucent overlays like bg-white/10
// are typically used on dark surfaces and must not match.
const LIGHT_CLASS_RE =
  /\b(bg-white(?!\/)|bg-pearl-[123](?!\/)|bg-cream(?!\/)|bg-champagne(?!\/)|bg-\[#F[0-9A-Fa-f]{2,5}\](?!\/)|bg-\[#FFF[0-9A-Fa-f]*\](?!\/))\b/;

// Same — solid text-white only (not text-white/40), and exclude any
// modifier-prefixed variant (hover:text-white, group-hover:text-white,
// focus:text-white, active:text-white, data-[…]:text-white, dark:text-white).
// Those represent state-driven swaps (usually paired with a dark hover bg)
// and are not a static contrast regression.
const WHITE_TEXT_RE = /(?<![:\w-])text-white(?!\/)\b/;

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
      // Split into class-string segments so ternary branches don't bleed into
      // each other. Anything between quotes / backticks / `?` / `:` / `,` /
      // template `${…}` boundaries is treated as its own segment.
      const segments = line.split(/['"`]|\?|:|,|\$\{|\}/);
      for (const seg of segments) {
        if (!WHITE_TEXT_RE.test(seg)) continue;
        if (LIGHT_CLASS_RE.test(seg)) {
          violations.push({
            file: path.relative(root, file),
            line: idx + 1,
            snippet: line.trim().slice(0, 200),
          });
          break; // one violation per line is enough
        }
      }
    });
  }

  if (violations.length === 0) {
    console.log('✓ No static white-on-light contrast regressions found.');
    return;
  }

  console.error(`✗ Found ${violations.length} white-on-light contrast risk(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.snippet}`);
  }
  console.error(
    '\nFix: replace text-white with text-black/text-foreground, or add // contrast-ok if intentional (e.g. dark hover swap on a dark wrapper).',
  );
  process.exit(1);
}

check();
