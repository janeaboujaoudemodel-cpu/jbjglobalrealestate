#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const SRC = path.join(root, 'src');
const baselinePath = path.join(__dirname, 'interactive-contrast-baseline.json');
const PRINT_BASELINE = process.argv.includes('--print-baseline');

let BASELINE = new Set();
try {
  const bl = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  BASELINE = new Set(bl.entries ?? []);
} catch {
  // baseline optional during initial bootstrap
}

const exts = new Set(['.tsx', '.jsx']);
const INTERACTIVE_RE = /<(Button|button|a|Badge|TabsTrigger)\b|role=["'](?:button|tab|menuitem|status|switch)["']/;
// `(?!\/)` after every token: an alpha-tinted utility (`bg-white/10`,
// `bg-muted/50`) is a translucent wash over whatever surface is behind it, not
// an opaque light background. The hex tokens already carried the guard but the
// named ones did not, so translucent-white controls sitting on dark surfaces —
// where `text-white` is the correct choice — were reported as violations.
const LIGHT_BG_RE = /(?<![:\w-])(bg-\[#(?:FDFBF7|F7F2EA|F7F1E6|EFE6D6|ECE2D2|B89555|A68444|D4AF37)\](?!\/)|bg-white(?!\/)|bg-background(?!\/)|bg-card(?!\/)|bg-popover(?!\/)|bg-secondary(?!\/)|bg-accent(?!\/)|bg-muted(?!\/)|from-\[#(?:FDFBF7|F7F2EA|F7F1E6|EFE6D6|ECE2D2)\](?!\/))/;
const DARK_BG_RE = /(?<![:\w-])(bg-\[#(?:102540|1a3d63|1A1A1A|0F0F0F|111111)\](?!\/)|bg-black(?!\/)|bg-primary|bg-foreground|from-\[#(?:102540|1a3d63|1A1A1A)\](?!\/)|from-black(?!\/))/;
const WHITE_TEXT_RE = /(?<![:\w-])(text-white(?:\/[0-9]{1,3})?|text-\[#(?:FDFBF7|F7F2EA|FFFFFF)\](?:\/[0-9]{1,3})?)/;
const DARK_TEXT_RE = /(?<![:\w-])(text-black(?:\/[0-9]{1,3})?|text-\[#1A1A1A\](?:\/[0-9]{1,3})?|text-zinc-(?:900|950)(?:\/[0-9]{1,3})?|text-neutral-(?:900|950)(?:\/[0-9]{1,3})?)/;
const BAD_ACTIVE_TAB_RE = /data-\[state=active\]:bg-\[#(?:102540|1a3d63|1A1A1A)\][^`"']*data-\[state=active\]:text-\[#1A1A1A\]|data-\[state=active\]:bg-\[#(?:FDFBF7|F7F2EA|EFE6D6|B89555)\][^`"']*data-\[state=active\]:text-white/;

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
  const violations = [];
  for (const file of walk(SRC)) {
    const rel = path.relative(root, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('contrast-ok')) return;
      if (!INTERACTIVE_RE.test(line)) return;
      const segments = line.split(/['"`]\s*(?:\?|:|,|\+|\)|\}|$)|(?:\?|:|,)\s*['"`]|\$\{|\}/).filter(Boolean);
      const textRisk = segments.some((seg) => (LIGHT_BG_RE.test(seg) && WHITE_TEXT_RE.test(seg)) || (DARK_BG_RE.test(seg) && DARK_TEXT_RE.test(seg)) || BAD_ACTIVE_TAB_RE.test(seg));
      if (!textRisk) return;
      violations.push({ file: rel, line: idx + 1, key: `${rel}:${idx + 1}`, snippet: line.trim().slice(0, 220) });
    });
  }

  if (PRINT_BASELINE) {
    const out = {
      _comment: 'Pre-existing interactive contrast hits captured when baseline tolerance was introduced. New regressions are blocked; historical hits are tolerated until cleaned up. Refresh with --print-baseline after fixing entries.',
      entries: violations.map((v) => v.key).sort(),
    };
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    return;
  }

  const newViolations = violations.filter((v) => !BASELINE.has(v.key));
  const tolerated = violations.length - newViolations.length;

  if (tolerated) {
    console.log(`ⓘ Interactive contrast baseline: ${tolerated} pre-existing hit(s) tolerated (see scripts/contrast/interactive-contrast-baseline.json).`);
  }

  if (!newViolations.length) {
    console.log('✓ Interactive contrast contract passed (no new violations).');
    return;
  }
  console.error(`✗ Found ${newViolations.length} new interactive contrast contract violation(s):\n`);
  for (const v of newViolations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.snippet}`);
  }
  console.error('\nFix: use jj-cta-dark, jj-cta-champagne, jj-cta-outline, jj-pill-active, or matching readable text/icon colors.');
  console.error('\nRun `node scripts/contrast/check-interactive-contrast-contract.mjs --print-baseline > scripts/contrast/interactive-contrast-baseline.json` to refresh the baseline (only after fixing or explicitly waiving).');
  process.exit(1);
}

check();