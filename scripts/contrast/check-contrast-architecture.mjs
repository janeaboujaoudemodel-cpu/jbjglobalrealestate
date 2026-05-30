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

const guard = fs.existsSync(contrastGuard) ? fs.readFileSync(contrastGuard, 'utf8') : '';
if (/new\s+MutationObserver|addEventListener\(['"](?:mouseover|focusin|pointerdown|visibilitychange|scroll)/.test(guard)) {
  violations.push('src/utils/contrastGuard.ts must remain a no-op; no runtime repaint observers/events.');
}

const stylesheet = fs.existsSync(css) ? fs.readFileSync(css, 'utf8') : '';
if (/installContrastGuard|new\s+MutationObserver|addEventListener\(['"](?:mouseover|focusin|pointerdown|scroll)/.test(stylesheet)) {
  violations.push('src/index.css must not reintroduce runtime-style contrast repainting hooks.');
}

const stableContractIndex = stylesheet.indexOf('STABLE SURFACE CONTRACT');
const stableContract = stableContractIndex >= 0 ? stylesheet.slice(stableContractIndex) : '';
const unsafeStableRules = stableContract
  .split('}')
  .map((rule) => {
    const [selector = '', body = ''] = rule.split('{');
    return { selector, body };
  })
  .filter(({ selector, body }) => /color:[^;]*!important/.test(body) && /\b(button|span|div|nav)\b|\[role/.test(selector));
const unsafeUnscoped = unsafeStableRules.filter(({ selector }) => !/jj-cta|jj-badge|surface-|data-surface|image-overlay-dark|glass-dark|glass-light|data-overlay/.test(selector));
if (unsafeUnscoped.length) {
  violations.push('The stable surface contract contains unscoped generic foreground overrides. Scope them to surface/CTA primitives.');
}

if (violations.length) {
  console.error('✗ Contrast architecture guard failed:\n');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log('✓ Contrast architecture guard passed.');