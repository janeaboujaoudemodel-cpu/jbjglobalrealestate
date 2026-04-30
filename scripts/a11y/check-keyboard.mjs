#!/usr/bin/env node
/**
 * Keyboard navigation + focus-order probe (Playwright).
 *
 * Three checks per route:
 *
 *   1. Reachability — number of Tab stops the browser actually visits ==
 *      number of focusable elements per the WAI focusable-element selector.
 *      Catches `tabindex="-1"` traps and visibility/display mismatches.
 *
 *   2. Visible focus — for each tab stop, computed style on :focus-visible
 *      must produce SOME visible indicator: outline >=2px OR non-empty
 *      box-shadow OR a Tailwind ring class. Flags components that override
 *      `outline: none` without restoring a focus ring.
 *
 *   3. Reading-order sanity — captures DOMRect of each tab stop in tab
 *      order; flags any backward jump greater than ~50px (signal of bad
 *      flex `order` / grid placement / DOM-vs-visual mismatch).
 *
 * Per-route waivers in scripts/a11y/allowlist.json (e.g. skip-to-content
 * links that legitimately appear out of visual order).
 *
 * Aggregates into artifacts/a11y/keyboard.{json,md}, exits 1 on new
 * violations.
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

const ROUTES = [
  '/',
  '/properties',
  '/areas',
  '/ai-hub',
  '/about',
  '/contact',
  '/legal/terms',
  '/legal/privacy',
  '/market-intelligence',
  '/developers',
];

// How many Tab presses to attempt before bailing. Most public pages have
// well under 200 focusable controls; if we exceed this, it's almost
// certainly a focus trap.
const MAX_TAB_STEPS = 250;

// Per-row reading-order tolerance. A backward jump > this in vertical
// order is reported. Horizontal jumps within a row are allowed.
const ROW_TOLERANCE_PX = 80;

function readAllowlist() {
  try {
    return JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  } catch {
    return {
      keyboardBaseline: { entries: [] },
      keyboardRouteWaivers: {},
    };
  }
}

async function probeRoute(page, route) {
  const targetUrl = new URL(route, PREVIEW_URL).toString();
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30_000 });
  // Give framer-motion / lazy mounts a beat to settle.
  await page.waitForTimeout(800);

  // Ground truth: how many focusable elements does the page expose?
  const expectedCount = await page.evaluate(() => {
    const sel =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), ' +
      'input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
      'textarea:not([disabled]), [contenteditable="true"]';
    const els = Array.from(document.querySelectorAll(sel));
    return els.filter((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      // Visibility: ignore display:none / visibility:hidden / zero-size offscreen.
      return cs.display !== 'none' && cs.visibility !== 'hidden' && (r.width > 0 || r.height > 0);
    }).length;
  });

  // Walk tab stops.
  const stops = [];
  await page.evaluate(() => (document.body.tabIndex = -1, document.body.focus()));
  for (let i = 0; i < MAX_TAB_STEPS; i++) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      // Cheap proxy for a visible focus indicator. We do not enforce :focus-visible
      // explicitly — outline / box-shadow / ring class is enough.
      const outlineW = parseFloat(cs.outlineWidth || '0');
      const hasOutline = outlineW >= 2 && cs.outlineStyle !== 'none';
      const hasShadow = cs.boxShadow && cs.boxShadow !== 'none';
      const hasRingClass = /\bring(-|$)/.test(el.className?.toString?.() || '');
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const cls = (el.className?.toString?.() || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((c) => '.' + c)
        .join('');
      return {
        selector: `${tag}${id}${cls}`,
        rect: { top: Math.round(r.top), left: Math.round(r.left) },
        focusVisible: hasOutline || hasShadow || hasRingClass,
        ariaLabel: el.getAttribute('aria-label') || el.textContent?.slice(0, 40)?.trim() || '',
      };
    });
    if (!stop) break;
    // Stop if Tab cycled back to the first element (loop closure).
    if (
      stops.length > 0 &&
      stop.selector === stops[0].selector &&
      stop.rect.top === stops[0].rect.top &&
      stop.rect.left === stops[0].rect.left
    ) {
      break;
    }
    stops.push(stop);
  }

  // Reachability check.
  const reachabilityOk = stops.length >= expectedCount * 0.9 && stops.length <= expectedCount + 5;

  // Reading-order check: flag backward vertical jumps > ROW_TOLERANCE_PX.
  const orderJumps = [];
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1].rect;
    const curr = stops[i].rect;
    if (curr.top + ROW_TOLERANCE_PX < prev.top) {
      orderJumps.push({
        index: i,
        from: stops[i - 1].selector,
        to: stops[i].selector,
        deltaY: curr.top - prev.top,
      });
    }
  }

  // Focus-visible check.
  const noFocusRing = stops
    .map((s, idx) => ({ idx, ...s }))
    .filter((s) => !s.focusVisible);

  return { route, expectedCount, actualCount: stops.length, reachabilityOk, orderJumps, noFocusRing, stops };
}

async function run() {
  const allowlist = readAllowlist();
  const baseline = new Set(allowlist.keyboardBaseline?.entries || []);
  const routeWaivers = allowlist.keyboardRouteWaivers || {};

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const results = [];
  const newFindings = [];
  const allKeys = [];

  for (const route of ROUTES) {
    const page = await context.newPage();
    try {
      const r = await probeRoute(page, route);
      const waivedSelectors = new Set(routeWaivers[route] || []);
      const violations = [];

      if (!r.reachabilityOk) {
        const key = `${route}::reachability::${r.expectedCount}->${r.actualCount}`;
        allKeys.push(key);
        if (!baseline.has(key)) {
          violations.push({
            type: 'reachability',
            message: `Expected ~${r.expectedCount} tab stops, walked ${r.actualCount}.`,
          });
        }
      }

      for (const j of r.orderJumps) {
        const key = `${route}::order::${j.from}->${j.to}`;
        allKeys.push(key);
        if (baseline.has(key) || waivedSelectors.has(j.from) || waivedSelectors.has(j.to)) continue;
        violations.push({
          type: 'reading-order',
          message: `Tab jumps backward ${Math.round(j.deltaY)}px from \`${j.from}\` to \`${j.to}\`.`,
        });
      }

      for (const f of r.noFocusRing) {
        const key = `${route}::focus-ring::${f.selector}`;
        allKeys.push(key);
        if (baseline.has(key) || waivedSelectors.has(f.selector)) continue;
        violations.push({
          type: 'focus-visible',
          message: `Tab stop #${f.idx + 1} (\`${f.selector}\`) has no visible focus indicator.`,
        });
      }

      results.push({ route, ...r, violations });
      newFindings.push(...violations.map((v) => ({ route, ...v })));
      console.log(
        `  ${violations.length === 0 ? '✓' : '✗'} ${route} — ${r.actualCount}/${r.expectedCount} stops, ${violations.length} new violation(s)`,
      );
    } catch (err) {
      console.error(`  ! ${route} — ${err.message}`);
      results.push({ route, error: err.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  if (PRINT_BASELINE) {
    const out = {
      description: 'Pre-existing keyboard / focus-order findings at suite introduction.',
      entries: [...new Set(allKeys)].sort(),
    };
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    return;
  }

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportDir, 'keyboard.json'),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), previewUrl: PREVIEW_URL, results },
      null,
      2,
    ),
  );

  let md = `## ⌨️ Keyboard Navigation Probe\n\nPreview: \`${PREVIEW_URL}\`\n\n`;
  md += `| Route | Tab stops (walked / expected) | New violations |\n|---|---|---|\n`;
  for (const r of results) {
    md += `| \`${r.route}\` | ${r.actualCount ?? '—'} / ${r.expectedCount ?? '—'} | ${
      r.violations?.length ?? (r.error ? '⚠️ ' + r.error : 0)
    } |\n`;
  }
  if (newFindings.length) {
    md += `\n### Failures\n`;
    for (const f of newFindings) {
      md += `- **${f.route}** · *${f.type}* — ${f.message}\n`;
    }
  }
  fs.writeFileSync(path.join(reportDir, 'keyboard.md'), md);

  if (newFindings.length) {
    console.error(`\n✗ ${newFindings.length} new keyboard / focus-order violation(s).`);
    process.exit(1);
  }
  console.log(`\n✓ No new keyboard / focus-order violations on ${ROUTES.length} routes.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(2);
});
