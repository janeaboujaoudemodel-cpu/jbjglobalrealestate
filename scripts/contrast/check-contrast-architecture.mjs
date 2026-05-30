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
const forbiddenBroadSelectors = [
  /:where\([^)]*(?:button|span|div|nav|\[role)[^)]*\)[^{]*\{[^}]*color:[^}]*!important/gs,
  /:is\([^)]*(?:button|span|div|nav|\[role)[^)]*\)[^{]*\{[^}]*color:[^}]*!important/gs,
];
for (const re of forbiddenBroadSelectors) {
  const matches = stylesheet.match(re) ?? [];
  const unsafe = matches.filter((m) => !/jj-cta|jj-badge|surface-|data-surface|image-overlay-dark|glass-dark|glass-light/.test(m));
  if (unsafe.length) {
    violations.push(`src/index.css contains ${unsafe.length} broad generic foreground !important override(s). Use surface/CTA primitives instead.`);
  }
}

if (violations.length) {
  console.error('✗ Contrast architecture guard failed:\n');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log('✓ Contrast architecture guard passed.');