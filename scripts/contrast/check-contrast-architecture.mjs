#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');

const appTsx = path.join(root, 'src', 'App.tsx');
const contrastGuard = path.join(root, 'src', 'utils', 'contrastGuard.ts');
const css = path.join(root, 'src', 'index.css');

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

const finalContractIndex = stylesheet.lastIndexOf('GLOBAL SEMANTIC CONTRAST CONTRACT');
// The contract is bounded by the next banner comment (currently "PASS 200"),
// which is written as a multi-line "/* ===...\n   PASS 200..." banner, not a
// literal "/* PASS 200" prefix — so we locate the banner's label text first,
// then walk back to the "/*" that opens its comment block.
const nextBannerLabelIndex = stylesheet.indexOf('PASS 200', finalContractIndex);
const finalContractEnd = nextBannerLabelIndex >= 0
  ? stylesheet.lastIndexOf('/*', nextBannerLabelIndex)
  : -1;
const finalContract = finalContractIndex >= 0
  ? stylesheet.slice(finalContractIndex, finalContractEnd >= 0 ? finalContractEnd : undefined)
  : '';
if (/\[data-on-dark\][^{]*\{[^}]*color:\s*#fff(?:fff)?\s*!important/i.test(finalContract)) {
  violations.push('[data-on-dark] must not be a broad final paint rule; own dark surfaces decide white foregrounds.');
}

const unsafeFinalRules = finalContract
  .split('}')
  .map((rule) => {
    const [selector = '', body = ''] = rule.split('{');
    return { selector, body };
  })
  .filter(({ selector, body }) => {
    const positiveSelector = selector.replace(/:not\([^)]*\)/g, '');
    return /color:\s*(?:#fff(?:fff)?|#1a1a1a|var\(--jj-contrast-on-(?:light|dark)\))\s*!important/i.test(body)
      && /\bdiv\b|\[role/.test(positiveSelector);
  });
if (unsafeFinalRules.length) {
  violations.push('The final contrast contract must not target generic div/[role] descendants; use text/icon/control tags only.');
}

// Matches each color/-webkit-text-fill-color declaration and captures its
// value, so the inherit/currentColor exception checks the actual value
// rather than a lookahead position — a bare `\s*` before the lookahead can
// backtrack to zero width and let leading whitespace hide the excluded
// keyword from the lookahead, silently defeating the exception.
function hasLeakingPaint(body) {
  const declRe = /(?:color|-webkit-text-fill-color):\s*([^;]+?)\s*!important/gi;
  let m;
  while ((m = declRe.exec(body)) !== null) {
    if (!/^(?:inherit|currentColor)\b/i.test(m[1])) return true;
  }
  return false;
}

const surfaceDescendantPaint = finalContract
  .split('}')
  .map((rule) => {
    const [selector = '', body = ''] = rule.split('{');
    return { selector, body };
  })
  .filter(({ selector, body }) =>
    /\[data-surface\]/.test(selector)
    && /\s:(?:where|is)\(/.test(selector)
    && hasLeakingPaint(body)
  );
if (surfaceDescendantPaint.length) {
  violations.push('Surface contrast must paint the surface boundary only; descendant paint leaks across nested surfaces.');
}

if (violations.length) {
  console.error('✗ Contrast architecture guard failed:\n');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log('✓ Contrast architecture guard passed.');