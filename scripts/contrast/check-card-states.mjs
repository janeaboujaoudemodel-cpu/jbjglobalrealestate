#!/usr/bin/env node
/**
 * Card-state contrast sweep — checks every card on representative
 * routes under three interaction states: default, :hover, :focus-visible.
 *
 * Why a dedicated script?
 *   scripts/contrast/check-rendered.mjs already runs axe color-contrast
 *   on the *resting* DOM. Hover / focus styles introduce new colour
 *   pairs (gold ring, cream tint, badge translucency) that the default
 *   sweep never exercises. This script forces the pseudo-classes via
 *   CDP `CSS.forcePseudoState` so axe-core re-evaluates the same nodes
 *   with the hover/focus rules applied.
 *
 * Output:  artifacts/contrast/card-states.{json,md}
 * Exit 1   if any non-allowlisted color-contrast violation is found.
 *
 * ENV:
 *   PREVIEW_URL       (default http://localhost:8080)
 *   MAX_CARDS_PER_ROUTE (default 4 — keeps runtime reasonable)
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
const MAX_CARDS_PER_ROUTE = Number(process.env.MAX_CARDS_PER_ROUTE || 4);

// Routes that reliably render project/property cards in the public UI
// without authentication. /properties, /resale-properties and
// /listing-portal gate their grids behind auth and don't paint cards
// in a headless context — they're covered separately by the rendered
// sweep against an authenticated fixture.
const ROUTES = [
  { path: '/',           cardSelector: 'a[href*="/project/"]' },
  { path: '/developers', cardSelector: 'a[href*="/project/"]' },
];

const STATES = ['default', 'hover', 'focus-visible'];

function loadAxeSource() {
  const req = (createRequire) => createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createRequire } = require('node:module');
  const r = createRequire(import.meta.url);
  const axePath = r.resolve('axe-core');
  return fs.readFileSync(path.join(path.dirname(axePath), 'axe.min.js'), 'utf8');
}

// Top-level async via dynamic import-friendly wrapper.
async function run() {
  const { createRequire } = await import('node:module');
  const req = createRequire(import.meta.url);
  const axeSource = fs.readFileSync(
    path.join(path.dirname(req.resolve('axe-core')), 'axe.min.js'),
    'utf8',
  );

  const allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  const allowedSelectors = new Set(allowlist.axeNodeSelectors.map((a) => a.selector));

  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    '/nix/store/nw961dvpvik5m19kbay4cg27wxgl3sdv-playwright-chromium-headless-shell/chrome-linux/headless_shell';
  const browser = await chromium.launch({ executablePath });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const aggregate = [];

  for (const route of ROUTES) {
    const page = await context.newPage();
    const targetUrl = new URL(route.path, PREVIEW_URL).toString();
    const routeResult = { route: route.path, cards: 0, states: {} };
    for (const s of STATES) routeResult.states[s] = [];

    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 45000 });
      // Scroll once + dwell to trigger lazy-mounted card grids
      // (Intersection-observed / below-the-fold sections).
      await page.evaluate(() => window.scrollTo(0, 800));
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await page.addScriptTag({ content: axeSource });

      // Sample up to MAX_CARDS_PER_ROUTE cards.
      const handles = await page.$$(route.cardSelector);
      const sample = handles.slice(0, MAX_CARDS_PER_ROUTE);
      routeResult.cards = sample.length;
      const totalLinks = await page.evaluate(() => document.querySelectorAll('a[href]').length);
      console.log(`    [debug] total <a>=${totalLinks}, matched cardSelector=${handles.length}`);

      if (sample.length === 0) {
        console.log(`  · ${route.path} — no cards matched, skipping`);
        aggregate.push(routeResult);
        await page.close();
        continue;
      }

      const client = await page.context().newCDPSession(page);
      await client.send('DOM.enable');
      await client.send('CSS.enable');
      const { root: docRoot } = await client.send('DOM.getDocument');

      // Tag each sample with a unique data attribute so axe can re-scope.
      for (let i = 0; i < sample.length; i++) {
        await sample[i].evaluate((el, idx) => {
          el.setAttribute('data-card-state-probe', String(idx));
        }, i);
      }

      for (let i = 0; i < sample.length; i++) {
        const probeSel = `[data-card-state-probe="${i}"]`;
        // Resolve the live nodeId for forcePseudoState.
        const { nodeId } = await client.send('DOM.querySelector', {
          nodeId: docRoot.nodeId,
          selector: probeSel,
        });
        if (!nodeId) continue;

        for (const state of STATES) {
          const forced =
            state === 'default'
              ? []
              : state === 'hover'
                ? ['hover']
                : ['focus', 'focus-visible'];

          await client.send('CSS.forcePseudoState', {
            nodeId,
            forcedPseudoClasses: forced,
          });

          // Let any transitions settle before reading paint colours.
          await page.waitForTimeout(120);

          const violations = await page.evaluate(
            async ({ sel, allowed }) => {
              const el = document.querySelector(sel);
              if (!el) return [];
              // eslint-disable-next-line no-undef
              const result = await axe.run(el, {
                runOnly: { type: 'rule', values: ['color-contrast'] },
                resultTypes: ['violations'],
              });
              return (result.violations || []).flatMap((v) =>
                v.nodes
                  .filter((n) => !n.target.some((s) => allowed.includes(s)))
                  .map((n) => ({
                    target: Array.isArray(n.target) ? n.target.join(' ') : String(n.target),
                    html: (n.html || '').slice(0, 240),
                    summary: n.failureSummary || '',
                  })),
              );
            },
            { sel: probeSel, allowed: Array.from(allowedSelectors) },
          );

          routeResult.states[state].push({
            cardIndex: i,
            violations,
          });
        }

        // Reset before moving to next card.
        await client.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
      }

      const stateCounts = STATES.map(
        (s) =>
          `${s}:${routeResult.states[s].reduce((n, c) => n + c.violations.length, 0)}`,
      ).join(' ');
      console.log(`  ✓ ${route.path} — ${sample.length} card(s) · ${stateCounts}`);
    } catch (err) {
      console.error(`  ! ${route.path} — load error: ${err.message}`);
      routeResult.error = err.message;
    } finally {
      aggregate.push(routeResult);
      await page.close();
    }
  }

  await browser.close();

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportDir, 'card-states.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        previewUrl: PREVIEW_URL,
        states: STATES,
        results: aggregate,
      },
      null,
      2,
    ),
  );

  let total = 0;
  let md = `## 🎨 Card-State Contrast Sweep\n\nPreview: \`${PREVIEW_URL}\` · Rule: \`color-contrast\` (WCAG AA)\n\nStates probed: ${STATES.map((s) => `\`${s}\``).join(', ')}\n\n| Route | Cards | Default | Hover | Focus |\n|---|---|---|---|---|\n`;
  for (const r of aggregate) {
    const c = (s) => r.states?.[s]?.reduce((n, x) => n + x.violations.length, 0) ?? 0;
    total += c('default') + c('hover') + c('focus-visible');
    md += `| \`${r.route}\` | ${r.cards} | ${c('default')} | ${c('hover')} | ${c('focus-visible')}${r.error ? ' ⚠️ ' + r.error : ''} |\n`;
  }
  if (total > 0) {
    md += `\n### Failures\n`;
    for (const r of aggregate) {
      for (const state of STATES) {
        for (const card of r.states?.[state] || []) {
          for (const v of card.violations) {
            md += `\n**${r.route}** · card #${card.cardIndex} · \`${state}\` — \`${v.target}\`\n\n\`\`\`html\n${v.html}\n\`\`\`\n\n> ${v.summary.replace(/\n/g, ' ')}\n`;
          }
        }
      }
    }
  }
  fs.writeFileSync(path.join(reportDir, 'card-states.md'), md);

  if (total > 0) {
    console.error(`\n✗ ${total} card-state color-contrast violation(s).`);
    process.exit(1);
  }
  console.log(`\n✓ No card-state contrast violations across ${ROUTES.length} route(s) × ${STATES.length} states.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(2);
});
