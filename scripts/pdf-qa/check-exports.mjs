#!/usr/bin/env node
/**
 * PDF Export QA Gate
 * --------------------------------------------------------------
 * Boots a headless Chromium against the running Vite preview,
 * triggers each registered PDF export, then validates each PDF
 * against edge-coverage and DPI thresholds. Exits non-zero if
 * any export fails so the CI build can be blocked.
 *
 * Usage:
 *   PREVIEW_URL=http://localhost:8080 node scripts/pdf-qa/check-exports.mjs
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const ARTIFACTS = join(ROOT, "artifacts", "pdf-qa");
const PREVIEW_URL = process.env.PREVIEW_URL || "http://localhost:8080";

const thresholds = JSON.parse(readFileSync(join(__dirname, "thresholds.json"), "utf8"));

/**
 * Registry of exports to validate.
 * - downloadRoute: page that exposes a button which triggers a download.
 * - downloadSelector: selector for the trigger element.
 * - staticUrl: alternative — directly fetch a PDF from the served app.
 */
const EXPORTS = [
  {
    id: "company-profile",
    label: "Company Profile",
    type: "static",
    staticUrl: "/documents/JBJ-Global-Real-Estate-Company-Profile.pdf",
  },
  {
    id: "investor-portfolio",
    label: "Investor Portfolio Summary",
    type: "download",
    downloadRoute: "/__qa/investor-portfolio",
    downloadSelector: '[data-qa="download-portfolio-pdf"]',
  },
  {
    id: "crm-client-report",
    label: "CRM Client Report",
    type: "download",
    downloadRoute: "/__qa/crm-client-report",
    downloadSelector: '[data-qa="download-crm-pdf"]',
  },
];

function ensureCleanDir(p) {
  rmSync(p, { recursive: true, force: true });
  mkdirSync(p, { recursive: true });
}

function run(cmd, args) {
  return execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
}

function getThresholds(id) {
  return { ...thresholds.defaults, ...(thresholds.exports?.[id] ?? {}) };
}

/** Rasterize PDF pages to PPM at the given DPI and return file paths. */
function rasterize(pdfPath, outDir, dpi = 150) {
  mkdirSync(outDir, { recursive: true });
  const prefix = join(outDir, "page");
  run("pdftoppm", ["-r", String(dpi), pdfPath, prefix]);
  return readdirSync(outDir)
    .filter((f) => f.startsWith("page-") && f.endsWith(".ppm"))
    .sort()
    .map((f) => join(outDir, f));
}

/** Read PPM (P6 binary). Returns { w, h, pixels: Uint8Array RGB }. */
function readPPM(path) {
  const buf = readFileSync(path);
  let i = 0;
  const readToken = () => {
    while (i < buf.length && /\s/.test(String.fromCharCode(buf[i]))) i++;
    if (buf[i] === 0x23) {
      while (i < buf.length && buf[i] !== 0x0a) i++;
      return readToken();
    }
    let s = "";
    while (i < buf.length && !/\s/.test(String.fromCharCode(buf[i]))) {
      s += String.fromCharCode(buf[i++]);
    }
    return s;
  };
  const magic = readToken();
  if (magic !== "P6") throw new Error(`Unsupported PPM format: ${magic}`);
  const w = parseInt(readToken(), 10);
  const h = parseInt(readToken(), 10);
  const max = parseInt(readToken(), 10);
  i++; // single whitespace after maxval
  if (max !== 255) throw new Error(`Unsupported PPM maxval: ${max}`);
  return { w, h, pixels: buf.subarray(i) };
}

/** Count non-white pixels within an N-pt margin band. */
function edgeCoverage(ppmPath, marginPt, dpi = 150) {
  const { w, h, pixels } = readPPM(ppmPath);
  const marginPx = Math.round((marginPt / 72) * dpi);
  const isWhite = (r, g, b) => r >= 248 && g >= 248 && b >= 248;
  let bandPx = 0;
  let nonWhite = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inBand = x < marginPx || x >= w - marginPx || y < marginPx || y >= h - marginPx;
      if (!inBand) continue;
      bandPx++;
      const idx = (y * w + x) * 3;
      if (!isWhite(pixels[idx], pixels[idx + 1], pixels[idx + 2])) nonWhite++;
    }
  }
  return { bandPx, nonWhite, ratioPct: bandPx ? (nonWhite / bandPx) * 100 : 0 };
}

/** Inspect embedded image DPI via `pdfimages -list`. */
function imageDpis(pdfPath) {
  let out = "";
  try {
    out = run("pdfimages", ["-list", pdfPath]);
  } catch {
    return [];
  }
  const lines = out.trim().split(/\r?\n/).slice(2);
  const dpis = [];
  for (const line of lines) {
    const cols = line.trim().split(/\s+/);
    const xDpi = parseInt(cols[12], 10);
    const yDpi = parseInt(cols[13], 10);
    if (Number.isFinite(xDpi)) dpis.push(xDpi);
    if (Number.isFinite(yDpi)) dpis.push(yDpi);
  }
  return dpis;
}

function pageCount(pdfPath) {
  const out = run("pdfinfo", [pdfPath]);
  const m = out.match(/^Pages:\s+(\d+)/m);
  return m ? parseInt(m[1], 10) : 0;
}

async function downloadStatic(browser, baseUrl, staticUrl, savePath) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const resp = await page.request.get(baseUrl + staticUrl);
  if (!resp.ok()) {
    await ctx.close();
    throw new Error(`HTTP ${resp.status()} fetching ${staticUrl}`);
  }
  writeFileSync(savePath, await resp.body());
  await ctx.close();
}

async function downloadViaUI(browser, baseUrl, route, selector, savePath) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  await page.goto(baseUrl + route, { waitUntil: "networkidle" });
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 30_000 }),
    page.click(selector),
  ]);
  await download.saveAs(savePath);
  await ctx.close();
}

async function validateExport(browser, exp) {
  const t = getThresholds(exp.id);
  const exportDir = join(ARTIFACTS, exp.id);
  ensureCleanDir(exportDir);
  const pdfPath = join(exportDir, `${exp.id}.pdf`);
  const failures = [];

  try {
    if (exp.type === "static") {
      await downloadStatic(browser, PREVIEW_URL, exp.staticUrl, pdfPath);
    } else {
      await downloadViaUI(browser, PREVIEW_URL, exp.downloadRoute, exp.downloadSelector, pdfPath);
    }
  } catch (err) {
    return { id: exp.id, label: exp.label, pass: false, reasons: [`download failed: ${err.message}`] };
  }

  let pages = 0;
  try {
    pages = pageCount(pdfPath);
  } catch (err) {
    failures.push(`pdfinfo failed: ${err.message}`);
  }
  if (pages < (t.minPages ?? 1)) failures.push(`page count ${pages} < ${t.minPages ?? 1}`);
  if (t.maxPages !== undefined && pages > t.maxPages) {
    const extra = pages - t.maxPages;
    failures.push(
      `page count ${pages} > ${t.maxPages} (spec max) — ${extra} extra page(s); likely app chrome (cookie banner, sidebar, header) leaked into the export`,
    );
  }
  if (t.expectedPages !== undefined && pages !== t.expectedPages) {
    failures.push(
      `page count ${pages} ≠ ${t.expectedPages} (institutional spec); the Company Profile must be exactly ${t.expectedPages} pages`,
    );
  }

  // Edge coverage on every page
  const rasterDir = join(exportDir, "raster");
  let pageImages = [];
  try {
    pageImages = rasterize(pdfPath, rasterDir, 150);
  } catch (err) {
    failures.push(`rasterize failed: ${err.message}`);
  }
  const edgeReports = [];
  for (const img of pageImages) {
    try {
      const r = edgeCoverage(img, t.edgeMarginPt, 150);
      edgeReports.push({ page: img.split("page-").pop(), ratioPct: +r.ratioPct.toFixed(3) });
      if (r.ratioPct > t.edgePixelTolerancePct) {
        failures.push(
          `edge coverage on ${img.split("/").pop()}: ${r.ratioPct.toFixed(2)}% > ${t.edgePixelTolerancePct}%`,
        );
      }
    } catch (err) {
      failures.push(`edge scan ${img}: ${err.message}`);
    }
  }

  // DPI check
  const dpis = imageDpis(pdfPath);
  const lowDpi = dpis.filter((d) => d < t.minImageDpi);
  if (lowDpi.length) {
    failures.push(`${lowDpi.length} embedded image(s) below ${t.minImageDpi} DPI (min: ${Math.min(...dpis)})`);
  }

  // Cleanup raster dir to keep artifact small
  rmSync(rasterDir, { recursive: true, force: true });

  return {
    id: exp.id,
    label: exp.label,
    pass: failures.length === 0,
    reasons: failures,
    metrics: { pages, edgeReports, imageDpis: dpis },
  };
}

function writeReport(results) {
  writeFileSync(join(ARTIFACTS, "report.json"), JSON.stringify(results, null, 2));
  const lines = [];
  const allPass = results.every((r) => r.pass);
  lines.push(`# PDF Export QA Report`);
  lines.push(``);
  lines.push(`**Status:** ${allPass ? "✅ PASS" : "❌ FAIL"}`);
  lines.push(``);
  lines.push(`| Export | Result | Pages | Notes |`);
  lines.push(`| --- | --- | --- | --- |`);
  for (const r of results) {
    const notes = r.pass ? "—" : r.reasons.map((x) => `\`${x}\``).join("<br/>");
    lines.push(`| ${r.label} | ${r.pass ? "✅ PASS" : "❌ FAIL"} | ${r.metrics?.pages ?? "?"} | ${notes} |`);
  }
  writeFileSync(join(ARTIFACTS, "report.md"), lines.join("\n"));
}

async function main() {
  ensureCleanDir(ARTIFACTS);
  const browser = await chromium.launch();
  const results = [];
  for (const exp of EXPORTS) {
    process.stdout.write(`→ ${exp.label} ... `);
    const r = await validateExport(browser, exp);
    results.push(r);
    process.stdout.write(r.pass ? "PASS\n" : `FAIL\n  ${r.reasons.join("\n  ")}\n`);
  }
  await browser.close();
  writeReport(results);
  const allPass = results.every((r) => r.pass);
  console.log(`\nReport: ${join(ARTIFACTS, "report.md")}`);
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
