#!/usr/bin/env node
/**
 * Price Color Audit — scans key routes and flags any price element whose
 * computed color isn't within tolerance of the price-orange tokens.
 *
 * Usage:
 *   node scripts/price-color-audit/run.mjs \
 *        --base=https://www.jbj.ae \
 *        --routes=/,/properties,/property-map,/resale-properties,/developers
 *
 * Output:
 *   /mnt/documents/price-color-audit.html
 *   /mnt/documents/price-color-audit.json
 *
 * Exit code 1 when any fail-severity issue is found (CI-friendly).
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

// ---------- args ----------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const BASE = args.base || "http://localhost:8080";
const ROUTES = (
  args.routes ||
  "/,/properties,/property-map,/resale-properties,/developers,/ai-hub"
)
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);
const VIEWPORT = { width: 1440, height: 900 };
const OUT_DIR = "/mnt/documents";

// ---------- canonical tokens ----------
// Light surfaces use --price-orange; dark surfaces use --price-orange-glow.
// Tolerance is generous (Δ ≤ 28 in RGB Manhattan distance) to allow for
// font anti-aliasing and slight HSL rounding by the browser.
const PRICE_ORANGE_RGB = { r: 0xf9, g: 0x73, b: 0x16 }; // #F97316
const PRICE_ORANGE_GLOW_RGB = { r: 0xfb, g: 0x92, b: 0x3c }; // #FB923C
const WHITE_RGB = { r: 0xff, g: 0xff, b: 0xff };
const TOLERANCE = 28;

// ---------- discovery + computed-style probe (runs in page) ----------
const PROBE_FN = `() => {
  const SELECTORS = [
    '.text-price-orange',
    '[class*="text-price-orange"]',
    '.jj-price',
    '[data-price]',
    '[data-jj-price]',
    '[data-price-badge]',
    '.price-display',
    '.price-value',
    '.property-price',
    '.listing-price',
    '.starting-price',
  ];
  const explicit = new Set(document.querySelectorAll(SELECTORS.join(',')));
  // Heuristic: any small leaf element whose text matches a price pattern.
  const PRICE_RE = /(AED|USD|EUR|GBP|\\$|€|£|₹|SAR)\\s?\\d|\\d{1,3}(,\\d{3})+\\s?(AED|USD|EUR|GBP)?/i;
  const heuristic = [];
  document.querySelectorAll('span, div, p, strong, b, h1, h2, h3, h4, h5, h6').forEach((el) => {
    if (explicit.has(el)) return;
    if (el.children.length > 2) return;
    const txt = (el.textContent || '').trim();
    if (txt.length < 3 || txt.length > 40) return;
    if (!PRICE_RE.test(txt)) return;
    // Skip if any ancestor is already explicit (avoid double-flagging children).
    let p = el.parentElement, skip = false;
    for (let i = 0; i < 4 && p; i++, p = p.parentElement) {
      if (explicit.has(p)) { skip = true; break; }
    }
    if (!skip) heuristic.push(el);
  });

  const all = [...explicit, ...heuristic];
  const findings = [];
  for (const el of all) {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const text = (el.textContent || '').trim().slice(0, 80);
    if (!text) continue;
    findings.push({
      tag: el.tagName.toLowerCase(),
      classes: (el.className && typeof el.className === 'string') ? el.className.slice(0, 200) : '',
      text,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      isExplicit: explicit.has(el),
      box: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
    });
  }
  return findings;
}`;

// ---------- color utilities ----------
function parseRgb(str) {
  const m = String(str).match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
  return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
}
function dist(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
}
function isWithin(c, target) {
  return dist(c, target) <= TOLERANCE;
}
function isOnOrangeBackground(bg) {
  if (!bg || bg.a === 0) return false;
  return dist(bg, PRICE_ORANGE_RGB) <= 60 || dist(bg, PRICE_ORANGE_GLOW_RGB) <= 60;
}
function classify(finding) {
  const c = parseRgb(finding.color);
  const bg = parseRgb(finding.backgroundColor);
  if (!c) return { ok: true, reason: "unparseable color (skipped)" };

  // Solid orange pill → expect white text
  if (isOnOrangeBackground(bg)) {
    if (isWithin(c, WHITE_RGB)) return { ok: true, reason: "white-on-orange (solid pill)" };
    return {
      ok: false,
      severity: "fail",
      reason: `Solid orange pill but text color ${finding.color} is not white`,
    };
  }

  if (isWithin(c, PRICE_ORANGE_RGB) || isWithin(c, PRICE_ORANGE_GLOW_RGB)) {
    return { ok: true, reason: "matches price-orange token" };
  }

  // Heuristic finds get a softer warning so we don't drown in noise.
  return {
    ok: false,
    severity: finding.isExplicit ? "fail" : "warn",
    reason: `Color ${finding.color} differs from price-orange token (Δ=${Math.min(
      dist(c, PRICE_ORANGE_RGB),
      dist(c, PRICE_ORANGE_GLOW_RGB),
    )})`,
  };
}

// ---------- main ----------
async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  const results = [];
  let totalFail = 0;
  let totalWarn = 0;
  let totalChecked = 0;

  for (const route of ROUTES) {
    const url = new URL(route, BASE).toString();
    const routeResult = { route, url, findings: [], errors: [] };
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(1200); // settle lazy content
      const findings = await page.evaluate(PROBE_FN);
      for (const f of findings) {
        totalChecked++;
        const verdict = classify(f);
        if (!verdict.ok) {
          if (verdict.severity === "fail") totalFail++;
          else totalWarn++;
        }
        routeResult.findings.push({ ...f, verdict });
      }
    } catch (err) {
      routeResult.errors.push(String(err?.message || err));
    }
    results.push(routeResult);
    process.stdout.write(
      `· ${route.padEnd(32)} ${routeResult.findings.length} prices, ${routeResult.findings.filter((f) => !f.verdict.ok).length} flagged\n`,
    );
  }

  await browser.close();

  // ---------- write JSON ----------
  const json = {
    base: BASE,
    generatedAt: new Date().toISOString(),
    totals: { checked: totalChecked, fail: totalFail, warn: totalWarn },
    results,
  };
  await fs.writeFile(
    path.join(OUT_DIR, "price-color-audit.json"),
    JSON.stringify(json, null, 2),
    "utf8",
  );

  // ---------- write HTML ----------
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const rows = results
    .flatMap((r) =>
      r.findings
        .filter((f) => !f.verdict.ok)
        .map(
          (f) => `
        <tr class="${f.verdict.severity}">
          <td><code>${esc(r.route)}</code></td>
          <td>${esc(f.text)}</td>
          <td><span class="swatch" style="background:${esc(f.color)}"></span><code>${esc(f.color)}</code></td>
          <td><span class="swatch" style="background:${esc(f.backgroundColor)}"></span><code>${esc(f.backgroundColor)}</code></td>
          <td>${esc(f.fontSize)} / ${esc(f.fontWeight)}</td>
          <td><code>${esc(f.classes)}</code></td>
          <td>${esc(f.verdict.reason)}</td>
        </tr>`,
        ),
    )
    .join("");

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>Price Color Audit — ${esc(BASE)}</title>
<style>
  body { font: 14px/1.5 -apple-system, system-ui, sans-serif; margin: 24px; color: #111; background: #fafafa; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #666; margin-bottom: 20px; }
  .summary { display: flex; gap: 12px; margin-bottom: 20px; }
  .pill { padding: 8px 14px; border-radius: 999px; font-weight: 600; }
  .pill.ok { background: #ecfdf5; color: #065f46; }
  .pill.warn { background: #fffbeb; color: #92400e; }
  .pill.fail { background: #fef2f2; color: #991b1b; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: left; vertical-align: top; }
  th { background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; }
  tr.fail td { background: #fef2f2; }
  tr.warn td { background: #fffbeb; }
  code { font: 12px/1.4 ui-monospace, monospace; }
  .swatch { display: inline-block; width: 14px; height: 14px; border-radius: 3px; border: 1px solid #cbd5e1; vertical-align: -3px; margin-right: 6px; }
  .empty { padding: 32px; text-align: center; color: #16a34a; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
</style>
</head><body>
<h1>Price Color Audit</h1>
<div class="meta">Base: <code>${esc(BASE)}</code> · ${esc(json.generatedAt)} · ${ROUTES.length} routes</div>
<div class="summary">
  <span class="pill ok">${totalChecked} checked</span>
  <span class="pill fail">${totalFail} fail</span>
  <span class="pill warn">${totalWarn} warn</span>
</div>
${
  rows
    ? `<table>
<thead><tr>
  <th>Route</th><th>Text</th><th>Color</th><th>Background</th><th>Size / Weight</th><th>Classes</th><th>Reason</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>`
    : `<div class="empty">✓ All ${totalChecked} price elements use the price-orange token.</div>`
}
</body></html>`;
  await fs.writeFile(path.join(OUT_DIR, "price-color-audit.html"), html, "utf8");

  console.log(`\nReport: ${OUT_DIR}/price-color-audit.html`);
  console.log(`JSON:   ${OUT_DIR}/price-color-audit.json`);
  console.log(`Totals: ${totalChecked} checked · ${totalFail} fail · ${totalWarn} warn\n`);

  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
