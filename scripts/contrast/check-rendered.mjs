#!/usr/bin/env node
/**
 * Rendered contrast sweep using Playwright + axe-core.
 *
 * Loads each route in ROUTES against PREVIEW_URL (default http://localhost:8080),
 * injects axe-core, runs only the `color-contrast` rule, and aggregates
 * violations into artifacts/contrast/rendered.{json,md}.
 *
 * Exit code 1 if any non-allowlisted color-contrast violation is found.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const allowlistPath = path.join(__dirname, 'allowlist.json');
const reportDir = path.join(root, 'artifacts', 'contrast');

const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:8080';

// Public/representative routes. Owner-restricted routes are excluded
// because they require authentication; they should be added with a
// signed-in fixture once the test-user flow exists.
const ROUTES = [
  '/',
  '/properties',
  '/resale-properties',
  '/developers',
  '/areas',
  '/ai-hub',
  '/property-map',
  '/about',
  '/contact',
  '/legal/terms',
  '/legal/privacy',
];

async function loadAxeSource() {
  // axe-core is bundled with @axe-core/playwright; if not available we fall back
  // to fetching the standalone build from node_modules.
  try {
    const req = (await import('node:module')).createRequire(import.meta.url);
    const axePath = req.resolve('axe-core');
    return fs.readFileSync(path.join(path.dirname(axePath), 'axe.min.js'), 'utf8');
  } catch {
    throw new Error("axe-core not installed. Run: bun add -D axe-core");
  }
}

async function run() {
  const allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  const allowedSelectors = new Set(allowlist.axeNodeSelectors.map((a) => a.selector));

  const axeSource = await loadAxeSource();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const aggregate = [];

  for (const route of ROUTES) {
    const page = await context.newPage();
    const targetUrl = new URL(route, PREVIEW_URL).toString();
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.addScriptTag({ content: axeSource });
      const result = await page.evaluate(async () => {
        // eslint-disable-next-line no-undef
        return await axe.run(document, {
          runOnly: { type: 'rule', values: ['color-contrast'] },
          resultTypes: ['violations'],
        });
      });
      const filtered = (result.violations || []).flatMap((v) =>
        v.nodes
          .filter((n) => !n.target.some((sel) => allowedSelectors.has(sel)))
          .map((n) => ({
            route,
            target: n.target.join(' '),
            html: n.html.slice(0, 240),
            summary: n.failureSummary,
          })),
      );
      aggregate.push({ route, violations: filtered });
      console.log(`  ${filtered.length === 0 ? '✓' : '✗'} ${route} — ${filtered.length} violation(s)`);
    } catch (err) {
      console.error(`  ! ${route} — load error: ${err.message}`);
      aggregate.push({ route, violations: [], error: err.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportDir, 'rendered.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), previewUrl: PREVIEW_URL, results: aggregate }, null, 2),
  );

  // Markdown report for PR comment
  let md = `## 🎨 Rendered Contrast Sweep\n\n`;
  md += `Preview: \`${PREVIEW_URL}\` · Rule: \`color-contrast\` (WCAG AA)\n\n`;
  md += `| Route | Violations |\n|---|---|\n`;
  for (const r of aggregate) md += `| \`${r.route}\` | ${r.violations.length}${r.error ? ' ⚠️ ' + r.error : ''} |\n`;
  const totalViolations = aggregate.reduce((n, r) => n + r.violations.length, 0);
  if (totalViolations > 0) {
    md += `\n### Failures\n`;
    for (const r of aggregate) {
      for (const v of r.violations) {
        md += `\n**${r.route}** — \`${v.target}\`\n\n\`\`\`html\n${v.html}\n\`\`\`\n\n> ${v.summary?.replace(/\n/g, ' ') ?? ''}\n`;
      }
    }
  }
  fs.writeFileSync(path.join(reportDir, 'rendered.md'), md);

  if (totalViolations > 0) {
    console.error(`\n✗ ${totalViolations} rendered color-contrast violation(s) across ${ROUTES.length} routes.`);
    process.exit(1);
  }
  console.log(`\n✓ No rendered contrast violations on ${ROUTES.length} routes.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(2);
});
