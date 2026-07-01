#!/usr/bin/env node
/**
 * PASS 142 — Human-readable HTML report generator.
 *
 * Runs the same dark-host heading probe used by
 * tests/dark-surface-heading-contrast.spec.ts across desktop / tablet /
 * mobile, captures a screenshot per (route × viewport), and renders a
 * self-contained, shareable HTML report with all screenshots inlined
 * as base64 (so it can be emailed / uploaded / opened offline).
 *
 * Output:
 *   /mnt/documents/pass-142-report.html      (shareable, single file)
 *   /mnt/documents/pass-142-report.json      (raw results, machine-readable)
 *
 * Usage:
 *   PREVIEW_URL=http://localhost:8080 node scripts/pass142/generate-report.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL =
  process.env.PREVIEW_URL ||
  process.env.BASE_URL ||
  'https://jbjglobalrealestate.lovable.app';

const OUT_DIR = '/mnt/documents';
const HTML_OUT = path.join(OUT_DIR, 'pass-142-report.html');
const JSON_OUT = path.join(OUT_DIR, 'pass-142-report.json');

const ROUTES = [
  '/', '/properties', '/off-plan', '/developers', '/insights',
  '/market-intelligence', '/guides', '/careers',
  '/services/property-management', '/services/buying-advisory',
  '/about', '/contact', '/ai-home-finder',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1800 },
  { name: 'tablet',  width: 820,  height: 1180 },
  { name: 'mobile',  width: 390,  height: 844  },
];

const DARK_HOSTS = [
  '[data-hero-dark]', '[data-on-dark]',
  '[data-surface="dark"]', '[data-surface="emerald"]',
  '[data-surface="ink"]', '[data-surface="navy"]',
  '.surface-dark', '.surface-ink', '.surface-navy',
  '.jj-surface-emerald', '.jj-hero-fullscreen', '.jj-hero-neon',
  '.jj-cta-primary', '.jj-cta-emerald', '.jj-emerald-metallic',
  '.jj-pill-emerald', '.jj-pill-emerald-metallic',
  '.jj-side-tile.is-active',
];

const probe = async (page) =>
  page.evaluate((hosts) => {
    const parse = (s) => {
      const m = s.match(/rgba?\(([^)]+)\)/i);
      const p = m ? m[1].split(',').map((x) => parseFloat(x.trim())) : [255,255,255,1];
      return [p[0] ?? 255, p[1] ?? 255, p[2] ?? 255];
    };
    const lum = (rgb) => {
      const f = (c) => { const s = c/255; return s<=0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4); };
      return 0.2126*f(rgb[0]) + 0.7152*f(rgb[1]) + 0.0722*f(rgb[2]);
    };
    const visible = (el) => {
      const cs = getComputedStyle(el);
      if (cs.visibility==='hidden' || cs.display==='none' || +cs.opacity<0.1) return false;
      const r = el.getBoundingClientRect();
      return r.width>=20 && r.height>=10;
    };
    const rows = [];
    document.querySelectorAll(hosts.join(',')).forEach((host) => {
      if (!visible(host)) return;
      host.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((h) => {
        if (!visible(h)) return;
        const text = (h.textContent||'').trim().slice(0,80);
        if (!text) return;
        const color = getComputedStyle(h).color;
        const fgLum = lum(parse(color));
        rows.push({
          tag: h.tagName.toLowerCase(),
          text,
          color,
          fgLum: Math.round(fgLum*1000)/1000,
          hostSelector:
            host.tagName.toLowerCase() +
            (host.getAttribute('data-hero-dark') !== null ? '[data-hero-dark]' : '') +
            (host.getAttribute('data-on-dark') !== null ? '[data-on-dark]' : '') +
            (host.getAttribute('data-surface') ? `[data-surface="${host.getAttribute('data-surface')}"]` : '') +
            (host.className && typeof host.className === 'string'
              ? '.' + host.className.split(/\s+/).filter(Boolean).slice(0,2).join('.')
              : ''),
          pass: fgLum >= 0.6,
        });
      });
    });
    return rows;
  }, hosts => hosts, DARK_HOSTS).catch(() => []);

async function auditRoute(browser, route, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.setItem('smart_popup_dismissed_until', String(Date.now()+7*864e5));
      localStorage.setItem('cookies_consent', JSON.stringify({ accepted: true, ts: Date.now() }));
      localStorage.setItem('cookiesConsent', 'accepted');
    } catch {}
  });
  let status = 0;
  try {
    const resp = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    status = resp ? resp.status() : 0;
  } catch (e) {
    await ctx.close();
    return { route, viewport: vp.name, error: e.message, status: 0, rows: [], screenshot: null };
  }
  await page.waitForTimeout(1000);
  await page.evaluate(async () => {
    const max = document.documentElement.scrollHeight;
    for (let y=0; y<max; y += Math.floor(window.innerHeight*0.8)) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
  const rows = await probe(page);
  const buf = await page.screenshot({ fullPage: false }).catch(() => null);
  await ctx.close();
  return {
    route, viewport: vp.name, status,
    rows,
    passCount: rows.filter(r => r.pass).length,
    failCount: rows.filter(r => !r.pass).length,
    screenshot: buf ? `data:image/png;base64,${buf.toString('base64')}` : null,
  };
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
));

function renderHtml(results, meta) {
  const totalFails = results.reduce((n, r) => n + (r.failCount || 0), 0);
  const totalChecks = results.reduce((n, r) => n + r.rows.length, 0);
  const routesFailing = new Set(results.filter(r => r.failCount > 0).map(r => r.route)).size;
  const overallPass = totalFails === 0;

  const groupedByRoute = new Map();
  for (const r of results) {
    if (!groupedByRoute.has(r.route)) groupedByRoute.set(r.route, []);
    groupedByRoute.get(r.route).push(r);
  }

  const routeSections = [...groupedByRoute.entries()].map(([route, entries]) => {
    const routeFails = entries.reduce((n, e) => n + (e.failCount || 0), 0);
    const badge = routeFails === 0
      ? '<span class="badge pass">PASS</span>'
      : `<span class="badge fail">${routeFails} fail</span>`;
    const cards = entries.map((e) => {
      const rowsHtml = e.rows.length
        ? `<table class="rows"><thead><tr><th>Tag</th><th>Text</th><th>Color</th><th>Lum</th><th>Host</th><th>Status</th></tr></thead><tbody>${
            e.rows.map((r) => `<tr class="${r.pass ? 'ok' : 'bad'}">
              <td><code>${esc(r.tag)}</code></td>
              <td>${esc(r.text)}</td>
              <td><span class="swatch" style="background:${esc(r.color)}"></span><code>${esc(r.color)}</code></td>
              <td>${r.fgLum.toFixed(3)}</td>
              <td><code>${esc(r.hostSelector)}</code></td>
              <td>${r.pass ? '✓' : '✗ ink-black on dark'}</td>
            </tr>`).join('')
          }</tbody></table>`
        : '<p class="empty">No dark-host headings detected at this viewport.</p>';
      return `<div class="vp-card ${e.failCount ? 'is-fail' : 'is-pass'}">
        <div class="vp-header">
          <strong>${esc(e.viewport)}</strong>
          <span class="dim">${e.status || '—'} · ${e.rows.length} heading(s) · ${e.failCount} fail</span>
        </div>
        ${e.screenshot ? `<a class="shot" href="${e.screenshot}" target="_blank" rel="noopener"><img loading="lazy" src="${e.screenshot}" alt="${esc(route)} ${esc(e.viewport)}"/></a>` : '<div class="shot empty">screenshot unavailable</div>'}
        ${rowsHtml}
        ${e.error ? `<p class="err">Error: ${esc(e.error)}</p>` : ''}
      </div>`;
    }).join('');
    return `<section class="route" id="route-${esc(route.replace(/\W+/g,'_'))}">
      <h2>${esc(route)} ${badge}</h2>
      <div class="vp-grid">${cards}</div>
    </section>`;
  }).join('');

  const tocHtml = [...groupedByRoute.keys()].map((r) => {
    const routeFails = groupedByRoute.get(r).reduce((n, e) => n + (e.failCount || 0), 0);
    return `<li><a href="#route-${esc(r.replace(/\W+/g,'_'))}">${esc(r)}</a> ${
      routeFails === 0 ? '<span class="mini pass">ok</span>' : `<span class="mini fail">${routeFails}</span>`
    }</li>`;
  }).join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>PASS 142 — Dark-surface heading contrast report</title>
<style>
  :root { --ink:#1A1A1A; --emerald:#0B6B4F; --gold:#B89555; --champagne:#F7F2EA; --page:#FDFBF7; --line:#EFE6D6; --danger:#B4241C; }
  * { box-sizing: border-box; }
  body { margin:0; font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif; color:var(--ink); background:var(--page); }
  header { padding:32px 40px 20px; border-bottom:1px solid var(--line); background:var(--champagne); }
  header h1 { margin:0 0 6px; font-size:26px; letter-spacing:-.01em; }
  header .meta { color:#555; font-size:13px; }
  .summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin:18px 0 0; }
  .summary .stat { background:#fff; border:1px solid var(--line); border-radius:12px; padding:12px 14px; }
  .summary .stat .n { font-size:22px; font-weight:700; }
  .summary .stat .l { font-size:12px; color:#666; text-transform:uppercase; letter-spacing:.06em; }
  .summary .stat.ok .n { color:var(--emerald); }
  .summary .stat.bad .n { color:var(--danger); }
  .overall { display:inline-block; margin-top:12px; padding:6px 12px; border-radius:999px; font-weight:700; font-size:13px; }
  .overall.pass { background:var(--emerald); color:#fff; }
  .overall.fail { background:var(--danger); color:#fff; }
  main { padding:24px 40px 60px; max-width:1400px; margin:0 auto; }
  nav.toc { background:#fff; border:1px solid var(--line); border-radius:12px; padding:14px 18px; margin-bottom:24px; }
  nav.toc ul { columns: 3; column-gap: 24px; list-style:none; margin:0; padding:0; }
  nav.toc li { break-inside:avoid; margin:2px 0; }
  nav.toc a { color:var(--ink); text-decoration:none; }
  nav.toc a:hover { text-decoration:underline; }
  .mini { display:inline-block; font-size:11px; padding:1px 6px; border-radius:6px; margin-left:4px; }
  .mini.pass { background:#E6F1EC; color:var(--emerald); }
  .mini.fail { background:#FCE4E3; color:var(--danger); }
  section.route { margin:32px 0; padding-top:12px; border-top:1px solid var(--line); }
  section.route h2 { margin:0 0 12px; font-size:18px; display:flex; align-items:center; gap:10px; }
  .badge { font-size:11px; padding:2px 8px; border-radius:999px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; }
  .badge.pass { background:#E6F1EC; color:var(--emerald); }
  .badge.fail { background:#FCE4E3; color:var(--danger); }
  .vp-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(360px,1fr)); gap:16px; }
  .vp-card { border:1px solid var(--line); border-radius:14px; padding:12px; background:#fff; }
  .vp-card.is-fail { border-color:var(--danger); background:#fff8f7; }
  .vp-header { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px; }
  .vp-header .dim { color:#666; font-size:12px; }
  a.shot, .shot { display:block; border:1px solid var(--line); border-radius:8px; overflow:hidden; background:#f0eadf; margin-bottom:10px; }
  a.shot img { display:block; width:100%; height:auto; }
  .shot.empty { padding:24px; text-align:center; color:#888; font-size:12px; }
  table.rows { width:100%; border-collapse:collapse; font-size:12px; }
  table.rows th, table.rows td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
  table.rows tr.bad td { background:#fce4e3; }
  table.rows tr.ok td { }
  code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px; background:#f3ede1; padding:1px 4px; border-radius:4px; }
  .swatch { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:6px; vertical-align:middle; border:1px solid rgba(0,0,0,.15); }
  .empty { color:#888; font-size:12px; margin:6px 0 0; }
  .err { color:var(--danger); font-size:12px; margin:6px 0 0; }
  footer { padding:20px 40px; color:#777; font-size:12px; border-top:1px solid var(--line); }
</style></head><body>
<header>
  <h1>PASS 142 — Dark-surface heading contrast</h1>
  <div class="meta">
    Generated ${esc(meta.generatedAt)} · Base URL <code>${esc(meta.baseUrl)}</code> · ${esc(String(meta.routes))} routes × ${esc(String(meta.viewports))} viewports
  </div>
  <div class="overall ${overallPass ? 'pass' : 'fail'}">${overallPass ? '✓ ALL HEADINGS PASS' : `✗ ${totalFails} FAILING HEADING(S)`}</div>
  <div class="summary">
    <div class="stat"><div class="n">${results.length}</div><div class="l">route × viewport checks</div></div>
    <div class="stat"><div class="n">${totalChecks}</div><div class="l">headings probed</div></div>
    <div class="stat ${totalFails===0?'ok':'bad'}"><div class="n">${totalFails}</div><div class="l">contrast failures</div></div>
    <div class="stat ${routesFailing===0?'ok':'bad'}"><div class="n">${routesFailing}</div><div class="l">routes affected</div></div>
  </div>
</header>
<main>
  <nav class="toc"><ul>${tocHtml}</ul></nav>
  ${routeSections}
</main>
<footer>
  PASS 142 lock: every heading rendered inside a dark / emerald / ink / navy host must have foreground luminance ≥ 0.6 (light-token). Paired with <code>src/test/pass-142-dark-context-exclusions.regression.test.ts</code> and <code>tests/dark-surface-heading-contrast.spec.ts</code>.
</footer>
</body></html>`;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`[pass-142] base=${BASE_URL} routes=${ROUTES.length} viewports=${VIEWPORTS.length}`);
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      process.stdout.write(`  · ${route} @ ${vp.name} … `);
      const r = await auditRoute(browser, route, vp);
      results.push(r);
      console.log(`${r.rows.length} heading(s), ${r.failCount} fail${r.error ? ' ('+r.error+')' : ''}`);
    }
  }
  await browser.close();

  const meta = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes: ROUTES.length,
    viewports: VIEWPORTS.length,
  };
  // Strip base64 out of the JSON companion for size.
  const jsonSafe = { meta, results: results.map(({ screenshot, ...rest }) => rest) };
  fs.writeFileSync(JSON_OUT, JSON.stringify(jsonSafe, null, 2));
  fs.writeFileSync(HTML_OUT, renderHtml(results, meta));
  const totalFails = results.reduce((n, r) => n + (r.failCount || 0), 0);
  console.log(`\n[pass-142] wrote ${HTML_OUT}`);
  console.log(`[pass-142] wrote ${JSON_OUT}`);
  console.log(`[pass-142] ${totalFails === 0 ? 'ALL PASS ✓' : totalFails + ' failing heading(s) ✗'}`);
})();
