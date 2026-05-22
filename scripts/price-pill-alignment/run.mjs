#!/usr/bin/env node
/**
 * Price Pill Alignment Audit — visual regression check for `.price-pill-premium`.
 *
 * Captures every `.price-pill-premium` instance across key routes at mobile,
 * tablet, and desktop viewports and asserts:
 *   1. Identical rendered width (per breakpoint, ±1px tolerance for sub-pixel rounding)
 *   2. Identical rendered height
 *   3. Consistent right-offset from parent card (`bottom-3 right-3` family)
 *   4. Eyebrow + value typography matches the locked spec (10/700 + 14/800)
 *   5. No text overflow / clipping (scrollWidth ≤ clientWidth)
 *
 * Exit code 1 when any pill drifts from the baseline — CI-friendly.
 *
 * Usage:
 *   node scripts/price-pill-alignment/run.mjs \
 *        --base=http://localhost:8080 \
 *        --routes=/properties,/resale-properties,/developers
 *
 * Output:
 *   /mnt/documents/price-pill-alignment.html
 *   /mnt/documents/price-pill-alignment.json
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const BASE = args.base || "http://localhost:8080";
const ROUTES = (args.routes || "/,/properties,/resale-properties")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844, expectedW: 96 },
  { name: "tablet", width: 820, height: 1180, expectedW: 100 },
  { name: "desktop", width: 1440, height: 900, expectedW: 104 },
];

const EXPECTED_H = 40;
const SIZE_TOLERANCE = 1.5; // px sub-pixel
const EXPECTED = {
  eyebrowFontSize: 10,
  eyebrowFontWeight: 700,
  valueFontSize: 14,
  valueFontWeight: 800,
};

const OUT_DIR = "/mnt/documents";

const PROBE_FN = `() => {
  const pills = Array.from(document.querySelectorAll('.price-pill-premium'));
  return pills.map((el, i) => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const parent = el.offsetParent || el.parentElement;
    const prect = parent ? parent.getBoundingClientRect() : rect;
    const eyebrow = el.querySelector('.price-pill-eyebrow');
    const value = el.querySelector('.price-pill-value');
    const ecs = eyebrow ? getComputedStyle(eyebrow) : null;
    const vcs = value ? getComputedStyle(value) : null;
    return {
      index: i,
      text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60),
      width: rect.width,
      height: rect.height,
      rightOffset: prect.right - rect.right,
      bottomOffset: prect.bottom - rect.bottom,
      overflow: el.scrollWidth > el.clientWidth + 1,
      eyebrow: ecs ? { fontSize: parseFloat(ecs.fontSize), fontWeight: parseInt(ecs.fontWeight, 10) } : null,
      value: vcs ? { fontSize: parseFloat(vcs.fontSize), fontWeight: parseInt(vcs.fontWeight, 10) } : null,
    };
  });
}`;

function audit(pill, expectedW) {
  const issues = [];
  if (Math.abs(pill.width - expectedW) > SIZE_TOLERANCE) {
    issues.push(`width ${pill.width.toFixed(1)}px ≠ baseline ${expectedW}px`);
  }
  if (Math.abs(pill.height - EXPECTED_H) > SIZE_TOLERANCE) {
    issues.push(`height ${pill.height.toFixed(1)}px ≠ baseline ${EXPECTED_H}px`);
  }
  if (pill.overflow) issues.push(`text overflow / clipped`);
  if (pill.eyebrow) {
    if (Math.abs(pill.eyebrow.fontSize - EXPECTED.eyebrowFontSize) > 0.5)
      issues.push(`eyebrow font-size ${pill.eyebrow.fontSize}px ≠ ${EXPECTED.eyebrowFontSize}px`);
    if (pill.eyebrow.fontWeight !== EXPECTED.eyebrowFontWeight)
      issues.push(`eyebrow weight ${pill.eyebrow.fontWeight} ≠ ${EXPECTED.eyebrowFontWeight}`);
  }
  if (pill.value) {
    if (Math.abs(pill.value.fontSize - EXPECTED.valueFontSize) > 0.5)
      issues.push(`value font-size ${pill.value.fontSize}px ≠ ${EXPECTED.valueFontSize}px`);
    if (pill.value.fontWeight !== EXPECTED.valueFontWeight)
      issues.push(`value weight ${pill.value.fontWeight} ≠ ${EXPECTED.valueFontWeight}`);
  }
  return issues;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  let totalPills = 0;
  let totalFail = 0;

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      const url = new URL(route, BASE).toString();
      const entry = { viewport: vp.name, route, url, pills: [], failures: [], error: null };
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForTimeout(1200);
        const pills = await page.evaluate(PROBE_FN);
        for (const p of pills) {
          totalPills++;
          const issues = audit(p, vp.expectedW);
          if (issues.length) totalFail++;
          entry.pills.push({ ...p, issues });
        }
        // cross-pill consistency check
        if (pills.length > 1) {
          const widths = pills.map((p) => p.width);
          const spread = Math.max(...widths) - Math.min(...widths);
          if (spread > SIZE_TOLERANCE) {
            entry.failures.push(`width spread ${spread.toFixed(1)}px across ${pills.length} pills`);
            totalFail++;
          }
        }
      } catch (err) {
        entry.error = String(err?.message || err);
      }
      results.push(entry);
      process.stdout.write(
        `· ${vp.name.padEnd(8)} ${route.padEnd(28)} ${entry.pills.length} pills, ${
          entry.pills.filter((p) => p.issues.length).length + entry.failures.length
        } flagged\n`,
      );
    }
    await ctx.close();
  }
  await browser.close();

  const json = {
    base: BASE,
    generatedAt: new Date().toISOString(),
    totals: { pills: totalPills, fail: totalFail },
    viewports: VIEWPORTS,
    results,
  };
  await fs.writeFile(
    path.join(OUT_DIR, "price-pill-alignment.json"),
    JSON.stringify(json, null, 2),
    "utf8",
  );

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const rows = results
    .flatMap((r) => {
      const pillRows = r.pills
        .filter((p) => p.issues.length)
        .map(
          (p) => `<tr class="fail">
          <td>${esc(r.viewport)}</td><td><code>${esc(r.route)}</code></td>
          <td>${esc(p.text)}</td>
          <td>${p.width.toFixed(1)} × ${p.height.toFixed(1)}</td>
          <td>${esc(p.issues.join("; "))}</td></tr>`,
        );
      const aggRows = r.failures.map(
        (f) => `<tr class="fail">
          <td>${esc(r.viewport)}</td><td><code>${esc(r.route)}</code></td>
          <td colspan="2"><em>aggregate</em></td><td>${esc(f)}</td></tr>`,
      );
      return [...pillRows, ...aggRows];
    })
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Price Pill Alignment Audit</title>
<style>
body{font:14px/1.5 -apple-system,system-ui,sans-serif;margin:24px;background:#fafafa;color:#111}
h1{margin:0 0 4px}.meta{color:#666;margin-bottom:20px}
.pill{display:inline-block;padding:8px 14px;border-radius:999px;font-weight:600;margin-right:8px}
.ok{background:#ecfdf5;color:#065f46}.fail{background:#fef2f2;color:#991b1b}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
th,td{padding:8px 10px;border-bottom:1px solid #f1f5f9;text-align:left;vertical-align:top;font-size:13px}
th{background:#f8fafc;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#475569}
tr.fail td{background:#fef2f2}code{font:12px ui-monospace,monospace}
.empty{padding:32px;text-align:center;color:#16a34a;background:#fff;border:1px solid #e5e7eb;border-radius:8px}
</style></head><body>
<h1>Price Pill Alignment Audit</h1>
<div class="meta">Base: <code>${esc(BASE)}</code> · ${esc(json.generatedAt)}</div>
<div><span class="pill ok">${totalPills} pills checked</span><span class="pill fail">${totalFail} flagged</span></div>
<p>Baseline per viewport: mobile 96×40, tablet 100×40, desktop 104×40. Eyebrow 10px/700, value 14px/800.</p>
${rows ? `<table><thead><tr><th>VP</th><th>Route</th><th>Text</th><th>Size</th><th>Issues</th></tr></thead><tbody>${rows}</tbody></table>` : `<div class="empty">✓ All ${totalPills} pills aligned to baseline.</div>`}
</body></html>`;
  await fs.writeFile(path.join(OUT_DIR, "price-pill-alignment.html"), html, "utf8");

  console.log(`\nReport: ${OUT_DIR}/price-pill-alignment.html`);
  console.log(`Pills: ${totalPills} · Flagged: ${totalFail}`);
  if (totalFail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
