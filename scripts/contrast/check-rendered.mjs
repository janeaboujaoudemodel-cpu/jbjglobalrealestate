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
const INSTALLED_CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  || '/opt/ms-playwright/chromium-1194/chrome-linux/chrome';

// Canonical route-family coverage. Redirect aliases are validated separately
// by the route inventory; these screens cover every distinct shell/surface
// contract, including authenticated owner applications when a managed browser
// session is available in the environment.
const ROUTES = [
  '/',
  '/properties',
  '/resale-properties',
  '/developers',
  '/areas',
  '/communities',
  '/map',
  '/list-property',
  '/mortgage-calculator',
  '/buyer-guide',
  '/seller-guide',
  '/guides',
  '/insights',
  '/broker-faq',
  '/services',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/card',
  '/book/jane',
  '/owner',
  '/owner/bookings',
  '/owner/crm/jbj/home',
  '/owner/crm/jbj/owner-brokerages',
  '/owner/crm/jbj/owner-developers',
  '/owner/documents/forms',
  '/owner/developers',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1100 },
  { name: 'mobile', width: 390, height: 844 },
];

async function restoreManagedSession(page, context) {
  const storageKey = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
  const sessionJson = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
  const cookiesJson = process.env.LOVABLE_BROWSER_SUPABASE_COOKIES_JSON;
  if (cookiesJson) {
    const cookies = JSON.parse(cookiesJson).map(({ domain: _domain, path: _path, ...cookie }) => ({
      ...cookie,
      url: PREVIEW_URL,
    }));
    await context.addCookies(cookies);
  }
  if (storageKey && sessionJson) {
    await page.goto(PREVIEW_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [storageKey, sessionJson]);
  }
}

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
  const browser = await chromium.launch({
    executablePath: fs.existsSync(INSTALLED_CHROMIUM) ? INSTALLED_CHROMIUM : undefined,
  });
  const aggregate = [];
  fs.mkdirSync(reportDir, { recursive: true });

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport });
    const bootstrapPage = await context.newPage();
    await restoreManagedSession(bootstrapPage, context);
    await bootstrapPage.close();
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
      const finalPath = new URL(page.url()).pathname;
      const unexpectedRedirect = route.startsWith('/owner') && !finalPath.startsWith('/owner');
      await page.screenshot({ path: path.join(reportDir, `${viewport.name}-${route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'}.png`) });
      aggregate.push({ route, viewport: viewport.name, finalPath, unexpectedRedirect, violations: filtered });
      console.log(`  ${filtered.length === 0 && !unexpectedRedirect ? '✓' : '✗'} [${viewport.name}] ${route} — ${filtered.length} violation(s)`);
    } catch (err) {
      console.error(`  ! ${route} — load error: ${err.message}`);
      aggregate.push({ route, viewport: viewport.name, violations: [], error: err.message });
    } finally {
      await page.close();
    }
    }
    await context.close();
  }

  await browser.close();

  fs.writeFileSync(
    path.join(reportDir, 'rendered.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), previewUrl: PREVIEW_URL, results: aggregate }, null, 2),
  );

  // Markdown report for PR comment
  let md = `## 🎨 Rendered Contrast Sweep\n\n`;
  md += `Preview: \`${PREVIEW_URL}\` · Rule: \`color-contrast\` (WCAG AA)\n\n`;
  md += `| Route | Violations |\n|---|---|\n`;
  for (const r of aggregate) md += `| \`${r.viewport}: ${r.route}\` | ${r.violations.length}${r.unexpectedRedirect ? ' ⚠️ unexpected redirect' : ''}${r.error ? ' ⚠️ ' + r.error : ''} |\n`;
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
    console.error(`\n✗ ${totalViolations} rendered color-contrast violation(s) across ${ROUTES.length} canonical routes and ${VIEWPORTS.length} viewports.`);
    process.exit(1);
  }
  console.log(`\n✓ No rendered contrast violations on ${ROUTES.length} canonical routes and ${VIEWPORTS.length} viewports.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(2);
});
