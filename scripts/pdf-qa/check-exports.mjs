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

/**
 * Inspect embedded image resolution via `pdfimages -list`.
 *
 * One record per image, keyed by page, taking the lower of the two axes. The
 * previous version pushed x-ppi and y-ppi as separate entries into a flat list,
 * so a document with ten under-resolution photos was reported as "20 embedded
 * image(s) below 150 DPI" — double the real count, with no page to look at.
 *
 * `smask` rows are alpha channels for another image, not artwork of their own,
 * so they are not counted.
 */
function imageDpis(pdfPath) {
  let out = "";
  try {
    out = run("pdfimages", ["-list", pdfPath]);
  } catch {
    return [];
  }
  const lines = out.trim().split(/\r?\n/).slice(2);
  const images = [];
  for (const line of lines) {
    const cols = line.trim().split(/\s+/);
    const page = parseInt(cols[0], 10);
    const type = cols[2];
    const xDpi = parseInt(cols[12], 10);
    const yDpi = parseInt(cols[13], 10);
    if (type !== "image") continue;
    if (!Number.isFinite(xDpi) || !Number.isFinite(yDpi)) continue;
    images.push({ page, dpi: Math.min(xDpi, yDpi) });
  }
  return images;
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

  // Edge coverage on every page.
  //
  // This looks for app chrome that leaked into an export the app renders from a
  // live page, so it only means anything on a document with white margins. A
  // designed full-bleed asset paints its brand ground to the trim on every
  // page, which reads as ~100% coverage no matter how good the PDF is — see
  // `checkEdgeCoverage` in thresholds.json. Measure it either way so the report
  // still carries the numbers; only the pass/fail is opt-out.
  const rasterDir = join(exportDir, "raster");
  let pageImages = [];
  try {
    pageImages = rasterize(pdfPath, rasterDir, 150);
  } catch (err) {
    failures.push(`rasterize failed: ${err.message}`);
  }
  const edgeEnforced = t.checkEdgeCoverage !== false;
  const edgeReports = [];
  for (const img of pageImages) {
    try {
      const r = edgeCoverage(img, t.edgeMarginPt, 150);
      edgeReports.push({ page: img.split("page-").pop(), ratioPct: +r.ratioPct.toFixed(3), enforced: edgeEnforced });
      if (edgeEnforced && r.ratioPct > t.edgePixelTolerancePct) {
        failures.push(
          `edge coverage on ${img.split("/").pop()}: ${r.ratioPct.toFixed(2)}% > ${t.edgePixelTolerancePct}%`,
        );
      }
    } catch (err) {
      failures.push(`edge scan ${img}: ${err.message}`);
    }
  }

  // DPI check.
  //
  // `lowDpiBaseline` records artwork that is already below the print bar and
  // cannot be fixed from this repo — the asset is a designer-authored binary
  // and the source files live outside version control. Upscaling it to clear
  // the check would add pixels without adding detail: the number would pass
  // and the print quality would be unchanged, which is worse than a red
  // check because it erases the debt instead of tracking it.
  //
  // The bar itself stays at minImageDpi, so any image that gets WORSE, and
  // any newly added low-resolution image, still fails. Only the exact count
  // already recorded is tolerated. Shrink the baseline when better artwork
  // arrives; never raise it to silence a new regression.
  const images = imageDpis(pdfPath);
  const lowDpi = images.filter((i) => i.dpi < t.minImageDpi);
  const baseline = t.lowDpiBaseline ?? 0;
  if (lowDpi.length > baseline) {
    const byPage = [...new Set(lowDpi.map((i) => i.page))].sort((a, b) => a - b);
    failures.push(
      `${lowDpi.length} of ${images.length} embedded image(s) below ${t.minImageDpi} DPI ` +
        `(baseline tolerates ${baseline}; lowest ${Math.min(...lowDpi.map((i) => i.dpi))}; ` +
        `pages ${byPage.join(", ")}) — re-export the source artwork at higher ` +
        `resolution. Do not raise lowDpiBaseline to clear this.`,
    );
  } else if (lowDpi.length) {
    console.log(
      `  note: ${lowDpi.length} image(s) below ${t.minImageDpi} DPI, within the ` +
        `recorded baseline of ${baseline} (lowest ${Math.min(...lowDpi.map((i) => i.dpi))} DPI)`,
    );
  }

  // Cleanup raster dir to keep artifact small
  rmSync(rasterDir, { recursive: true, force: true });

  return {
    id: exp.id,
    label: exp.label,
    pass: failures.length === 0,
    reasons: failures,
    metrics: { pages, edgeReports, images, lowDpiImages: lowDpi },
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
  // PW_CHROMIUM lets a local run point at an already-installed Chromium when
  // the pinned browser revision isn't downloaded. Unset in CI, which installs
  // the matching revision — see the install step in pdf-export-qa.yml.
  const browser = await chromium.launch(
    process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  );
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
