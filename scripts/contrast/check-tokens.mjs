#!/usr/bin/env node
/**
 * Static design-token contrast checker.
 *
 * Parses every `:root`, `.dark`, and themed selector block in src/index.css,
 * extracts HSL design tokens, then checks every (foreground, background)-style
 * pairing against WCAG 2.1 AA.
 *
 * Pairings checked (in each scope):
 *   - foreground   vs background
 *   - card-foreground vs card
 *   - popover-foreground vs popover
 *   - primary-foreground vs primary
 *   - secondary-foreground vs secondary
 *   - muted-foreground vs muted, background, card
 *   - accent-foreground vs accent
 *   - destructive-foreground vs destructive
 *   - sidebar-foreground vs sidebar-background
 *   - sidebar-primary-foreground vs sidebar-primary
 *   - sidebar-accent-foreground vs sidebar-accent
 *   - gold-foreground vs gold, gold-dark
 *
 * Exits 1 if any unwhitelisted pair fails AA (4.5:1 for text).
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { parseHslTriplet, hslToRgb, contrastRatio, AA_TEXT } from './wcag.mjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const cssPath = path.join(root, 'src', 'index.css');
const allowlistPath = path.join(__dirname, 'allowlist.json');
const reportDir = path.join(root, 'artifacts', 'contrast');

const PAIRS = [
  ['foreground', 'background'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['muted-foreground', 'muted'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['accent-foreground', 'accent'],
  ['destructive-foreground', 'destructive'],
  ['sidebar-foreground', 'sidebar-background'],
  ['sidebar-primary-foreground', 'sidebar-primary'],
  ['sidebar-accent-foreground', 'sidebar-accent'],
  ['gold-foreground', 'gold'],
  ['gold-foreground', 'gold-dark'],
  // Global Surface Theme — 4 canonical tones
  ['surface-fg', 'surface-bg'],
  ['surface-fg-muted', 'surface-bg'],
  ['surface-cta-fg', 'surface-cta-bg'],
];

function extractScopes(css) {
  // Match top-level theme scopes: :root, .dark, [data-theme="..."],
  // and the new [data-surface="..."] rebinding blocks.
  const scopes = {};
  const re = /(:root|\.dark|\[data-theme=[^\]]+\]|\[data-surface=[^\]]+\])\s*\{([\s\S]*?)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const name = m[1];
    const body = m[2];
    const tokens = {};
    const tokenRe = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
    let t;
    while ((t = tokenRe.exec(body))) {
      tokens[t[1]] = t[2].trim();
    }
    scopes[name] = { ...(scopes[name] || {}), ...tokens };
  }
  return scopes;
}

function check() {
  const css = fs.readFileSync(cssPath, 'utf8');
  const allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  const allowed = new Set(allowlist.tokens.map((t) => t.pair));

  const scopes = extractScopes(css);
  const results = [];
  let failures = 0;

  for (const [scopeName, tokens] of Object.entries(scopes)) {
    for (const [fg, bg] of PAIRS) {
      const fgRaw = tokens[fg];
      const bgRaw = tokens[bg];
      if (!fgRaw || !bgRaw) continue;
      const fgHsl = parseHslTriplet(fgRaw);
      const bgHsl = parseHslTriplet(bgRaw);
      if (!fgHsl || !bgHsl) continue; // skip non-HSL tokens (gradients etc.)
      const ratio = contrastRatio(hslToRgb(...fgHsl), hslToRgb(...bgHsl));
      const pairKey = `${fg}/${bg}`;
      const pass = ratio >= AA_TEXT;
      const allowedHere = allowed.has(pairKey);
      if (!pass && !allowedHere) failures++;
      results.push({
        scope: scopeName,
        pair: pairKey,
        ratio: Number(ratio.toFixed(2)),
        required: AA_TEXT,
        status: pass ? 'pass' : allowedHere ? 'allowlisted' : 'fail',
      });
    }
  }

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportDir, 'tokens.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2),
  );

  // Console table
  const fails = results.filter((r) => r.status === 'fail');
  const allow = results.filter((r) => r.status === 'allowlisted');
  console.log(`\nToken contrast check — ${results.length} pairs, ${fails.length} fail(s), ${allow.length} allowlisted\n`);
  for (const r of results) {
    const icon = r.status === 'pass' ? '✓' : r.status === 'allowlisted' ? '◌' : '✗';
    console.log(`  ${icon} ${r.scope.padEnd(28)} ${r.pair.padEnd(48)} ${r.ratio}:1`);
  }

  if (failures > 0) {
    console.error(`\n✗ ${failures} token contrast violation(s) below WCAG AA (4.5:1).`);
    console.error(`  Add a justified entry to scripts/contrast/allowlist.json or fix the tokens in src/index.css.`);
    process.exit(1);
  }
  console.log('\n✓ All design-token pairs meet WCAG AA.');
}

check();
