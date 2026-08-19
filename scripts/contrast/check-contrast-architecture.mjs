#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import os from 'node:os';
import { resolveWithinRoot } from '../lib/safePath.mjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');

const appTsx = path.join(root, 'src', 'App.tsx');
const contrastGuard = path.join(root, 'src', 'utils', 'contrastGuard.ts');
// `--css=<path>` points the stylesheet checks at a fixture so the guard's own
// regression tests can prove it still fails on a genuinely leaking rule.
const cssOverride = process.argv.find((a) => a.startsWith('--css='))?.slice('--css='.length);
// Confined to the repo or the system temp dir: the override exists so the
// guard's own tests can point it at a generated fixture, not so a caller can
// read arbitrary files.
const css = cssOverride
  ? resolveWithinRoot(root, cssOverride, { mustExist: true, alsoAllow: [os.tmpdir()] })
  : path.join(root, 'src', 'index.css');

const violations = [];

const app = fs.existsSync(appTsx) ? fs.readFileSync(appTsx, 'utf8') : '';
if (/installContrastGuard\s*\(/.test(app) || /contrastGuard/.test(app)) {
  violations.push('src/App.tsx must not import/call contrastGuard; contrast is static CSS only.');
}
if (/ChampagneCtaInkGuard/.test(app)) {
  violations.push('src/App.tsx must not mount ChampagneCtaInkGuard; contrast is static CSS only.');
}


const guard = fs.existsSync(contrastGuard) ? fs.readFileSync(contrastGuard, 'utf8') : '';
if (/new\s+MutationObserver|addEventListener\(['"](?:mouseover|focusin|pointerdown|visibilitychange|scroll)/.test(guard)) {
  violations.push('src/utils/contrastGuard.ts must remain a no-op; no runtime repaint observers/events.');
}

const stylesheet = fs.existsSync(css) ? fs.readFileSync(css, 'utf8') : '';
if (/installContrastGuard|new\s+MutationObserver|addEventListener\(['"](?:mouseover|focusin|pointerdown|scroll)/.test(stylesheet)) {
  violations.push('src/index.css must not reintroduce runtime-style contrast repainting hooks.');
}

const finalContractLabels = [
  'GLOBAL SEMANTIC CONTRAST CONTRACT',
  'STABLE SURFACE CONTRACT',
  'TRUE FINAL LIGHT-OWN-BACKGROUND LOCK',
  'ABSOLUTE OWN-LIGHT-SURFACE CONTRAST LOCK',
  'GLOBAL CONTRAST ENGINE — PASS 7',
  'PASS 8 — FINAL INHERITED-FILL RESET',
  'FINAL SURFACE CONTRACT — own-background wins',
];
const presentFinalContracts = finalContractLabels.filter((label) => stylesheet.includes(label));
if (presentFinalContracts.length !== 1 || presentFinalContracts[0] !== 'GLOBAL SEMANTIC CONTRAST CONTRACT') {
  violations.push(`src/index.css must contain exactly one final contrast contract: GLOBAL SEMANTIC CONTRAST CONTRACT. Found: ${presentFinalContracts.join(', ') || 'none'}.`);
}

// Scope the scan to the contract's own block: from its closing banner line (a
// line of "====" ending in "*/") to the next banner-open line ("/* ====").
// Do NOT pin this to a named pass — the section that follows gets renamed and
// reformatted by every contrast pass, and when the old "/* PASS 200" sentinel
// stopped matching, indexOf returned -1 and the slice silently widened to
// end-of-file, auditing the whole stylesheet as if it were the contract.
const bannerCloseLineRe = /^[ \t]*=+[ \t]*\*\/[ \t]*$/m;
const bannerOpenLineRe = /^\/\*[ \t]*=+[ \t]*$/m;

function sliceFinalContract(source) {
  const start = source.lastIndexOf('GLOBAL SEMANTIC CONTRAST CONTRACT');
  if (start < 0) return '';
  const closeMatch = bannerCloseLineRe.exec(source.slice(start));
  if (!closeMatch) return source.slice(start);
  const closeEnd = start + closeMatch.index + closeMatch[0].length;
  const nextOpen = bannerOpenLineRe.exec(source.slice(closeEnd));
  return source.slice(start, nextOpen ? closeEnd + nextOpen.index : undefined);
}

// Comment prose contains braces, colons and words like `div`, so a naive
// `split('}')` parse reads it as selectors and bodies. Strip comments first.
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, ' ');

const finalContract = stripComments(sliceFinalContract(stylesheet));
if (/\[data-on-dark\][^{]*\{[^}]*color:\s*#fff(?:fff)?\s*!important/i.test(finalContract)) {
  violations.push('[data-on-dark] must not be a broad final paint rule; own dark surfaces decide white foregrounds.');
}

const rulesOf = (block) =>
  block.split('}').map((rule) => {
    const [selector = '', body = ''] = rule.split('{');
    return { selector, body };
  });

// Declarations that hand an element an explicit foreground. `inherit` and
// `currentColor` are the opposite of a paint — they defer to the nearest
// surface — so they never count as one.
const DECLARATION = /(?:^|[;{\s])(-webkit-text-fill-color|color)\s*:\s*([^;!]+?)\s*!important/gi;
const DEFERRING = /^(?:inherit|currentColor|unset|revert)$/i;

function paintsExplicitForeground(body) {
  DECLARATION.lastIndex = 0;
  let m;
  while ((m = DECLARATION.exec(body)) !== null) {
    if (!DEFERRING.test(m[2])) return true;
  }
  return false;
}

const summarise = (rule) => rule.selector.trim().replace(/\s+/g, ' ').slice(0, 160);

const unsafeFinalRules = rulesOf(finalContract).filter(({ selector, body }) => {
  const positiveSelector = selector.replace(/:not\([^)]*\)/g, '');
  return /color:\s*(?:#fff(?:fff)?|#1a1a1a|var\(--jj-contrast-on-(?:light|dark)\))\s*!important/i.test(body)
    && /\bdiv\b|\[role/.test(positiveSelector);
});
if (unsafeFinalRules.length) {
  violations.push(
    'The final contrast contract must not target generic div/[role] descendants; use text/icon/control tags only.',
    ...unsafeFinalRules.map((r) => `    ↳ ${summarise(r)}`),
  );
}

const surfaceDescendantPaint = rulesOf(finalContract).filter(({ selector, body }) =>
  /\[data-surface\]/.test(selector)
  && /\s:(?:where|is)\(/.test(selector)
  && paintsExplicitForeground(body)
);
if (surfaceDescendantPaint.length) {
  violations.push(
    'Surface contrast must paint the surface boundary only; descendant paint leaks across nested surfaces.',
    ...surfaceDescendantPaint.map((r) => `    ↳ ${summarise(r)}`),
  );
}

if (violations.length) {
  console.error('✗ Contrast architecture guard failed:\n');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log('✓ Contrast architecture guard passed.');