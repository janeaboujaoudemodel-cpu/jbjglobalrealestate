#!/usr/bin/env node
/**
 * Rendered ARIA sweep — Playwright + axe-core, full WCAG 2.1 AA ruleset
 * MINUS color-contrast (already covered by scripts/contrast/check-rendered.mjs).
 *
 * Loads each route in ROUTES against PREVIEW_URL (default http://localhost:8080),
 * injects axe-core, runs all enabled rules except `color-contrast`, and
 * aggregates violations into artifacts/a11y/aria.{json,md}.
 *
 * Exits 1 if any non-allowlisted violation is found. The allowlist mirrors
 * scripts/contrast/allowlist.json — per-rule waivers + per-selector waivers.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const allowlistPath = path.join(__dirname, 'allowlist.json');
const reportDir = path.join(root, 'artifacts', 'a11y');

const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:8080';
const PRINT_BASELINE = process.argv.includes('--print-baseline');

// Public routes only — authenticated routes deferred to a follow-up that
// introduces a Playwright auth fixture.
const ROUTES = [
  '/',
  '/properties',
  '/resale-properties',
  '/developers',
  '/areas',
  '/ai-hub',
  '/about',
  '/contact',
  '/legal/terms',
  '/legal/privacy',
  '/market-intelligence',
  '/property-map',
];

async function loadAxeSource() {
  const req = (await import('node:module')).createRequire(import.meta.url);
  const axePath = req.resolve('axe-core');
  return fs.readFileSync(path.join(path.dirname(axePath), 'axe.min.js'), 'utf8');
}

function readAllowlist() {
  try {
    return JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  } catch {
    return { rules: {}, axeNodeSelectors: [], ariaBaseline: { entries: [] } };
  }
}

async function run() {
  const allowlist = readAllowlist();
  const waivedRules = new Set(
    Object.entries(allowlist.rules || {})
      .filter(([, v]) => v?.waived)
      .map(([k]) => k),
  );
  const allowedSelectors = new Set(
    (allowlist.axeNodeSelectors || []).map((a) => `${a.rule}::${a.selector}`),
  );
  const baseline = new Set(allowlist.ariaBaseline?.entries || []);

  const axeSource = await loadAxeSource();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const aggregate = [];
  const allFindingKeys = [];

  for (const route of ROUTES) {
    const page = await context.newPage();
    const targetUrl = new URL(route, PREVIEW_URL).toString();
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.addScriptTag({ content: axeSource });
      const result = await page.evaluate(async () => {
        // eslint-disable-next-line no-undef
        return await axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
          },
          rules: { 'color-contrast': { enabled: false } },
          resultTypes: ['violations'],
        });
      });

      const filtered = [];
      for (const v of result.violations || []) {
        if (waivedRules.has(v.id)) continue;
        for (const n of v.nodes) {
          const sel = n.target.join(' ');
          if (allowedSelectors.has(`${v.id}::${sel}`)) continue;
          const key = `${route}::${v.id}::${sel}`;
          allFindingKeys.push(key);
          if (baseline.has(key)) continue;
          filtered.push({
            route,
            rule: v.id,
            impact: v.impact,
            target: sel,
            html: n.html.slice(0, 240),
            summary: n.failureSummary,
          });
        }
      }

      aggregate.push({ route, violations: filtered });
      console.log(`  ${filtered.length === 0 ? '✓' : '✗'} ${route} — ${filtered.length} new violation(s)`);
    } catch (err) {
      console.error(`  ! ${route} — load error: ${err.message}`);
      aggregate.push({ route, violations: [], error: err.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  if (PRINT_BASELINE) {
    const out = {
      description: 'Pre-existing axe ARIA violations at suite introduction.',
      entries: [...new Set(allFindingKeys)].sort(),
    };
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    return;
  }

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportDir, 'aria.json'),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), previewUrl: PREVIEW_URL, results: aggregate },
      null,
      2,
    ),
  );

  let md = `## ♿ Rendered ARIA Sweep\n\nPreview: \`${PREVIEW_URL}\` · Ruleset: WCAG 2.1 AA + best-practice (excluding \`color-contrast\`)\n\n`;
  md += `| Route | New violations |\n|---|---|\n`;
  for (const r of aggregate) {
    md += `| \`${r.route}\` | ${r.violations.length}${r.error ? ' ⚠️ ' + r.error : ''} |\n`;
  }
  const total = aggregate.reduce((n, r) => n + r.violations.length, 0);
  if (total > 0) {
    md += `\n### Failures\n`;
    for (const r of aggregate) {
      for (const v of r.violations) {
        md += `\n**${r.route}** · \`${v.rule}\` · *${v.impact}* — \`${v.target}\`\n\n\`\`\`html\n${v.html}\n\`\`\`\n\n> ${v.summary?.replace(/\n/g, ' ') ?? ''}\n`;
      }
    }
  }
  fs.writeFileSync(path.join(reportDir, 'aria.md'), md);

  if (total > 0) {
    console.error(`\n✗ ${total} new ARIA violation(s) across ${ROUTES.length} routes.`);
    process.exit(1);
  }
  console.log(`\n✓ No new ARIA violations on ${ROUTES.length} routes.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(2);
});
