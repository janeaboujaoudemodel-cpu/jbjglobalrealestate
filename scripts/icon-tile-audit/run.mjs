#!/usr/bin/env node
/**
 * Icon Tile Audit — discovers icon tiles across the live app, screenshots them in
 * default/hover/focus/active states, validates 6 visual rules, and produces:
 *   - /mnt/documents/icon-tile-audit.html
 *   - /mnt/documents/icon-tile-audit.json
 * Optional --insert-db writes a summary row into Supabase `icon_audit_runs`.
 *
 * Usage:
 *   node scripts/icon-tile-audit/run.mjs \
 *        --base=https://www.jbj.ae \
 *        --routes=/,/ai-hub,/owner,/owner/mode-hub \
 *        [--insert-db] [--label=manual-2026-04-23] [--env=preview]
 *
 * Required env (only when --insert-db):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Dependencies (install in this folder):
 *   npm i playwright sharp @supabase/supabase-js
 *   npx playwright install chromium
 */
import { chromium } from "playwright";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAllRules, RULES } from "./rules.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- args ----------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const BASE = args.base || "http://localhost:8080";
const ROUTES = (args.routes || "/,/ai-hub,/owner,/owner/mode-hub,/services,/properties,/developers")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);
const RUN_LABEL = args.label || `manual-${new Date().toISOString().slice(0, 10)}`;
const ENVIRONMENT = args.env || (BASE.includes("localhost") ? "local" : "preview");
const INSERT_DB = !!args["insert-db"];
const VIEWPORT = { width: 1440, height: 900 };

// ---------- discovery script (runs in page context) ----------
const DISCOVER_FN = `() => {
  const isTileLike = (el) => {
    const tag = el.tagName?.toLowerCase();
    if (!tag) return false;
    if (tag === 'a' || tag === 'button') return true;
    if (el.getAttribute && el.getAttribute('role') === 'button') return true;
    // Card-like: rounded + bordered + svg child
    const cls = (el.className && typeof el.className === 'string') ? el.className : '';
    return /\\brounded(-|$)|\\bcard\\b/.test(cls) && /\\bborder(-|$)/.test(cls);
  };
  const out = [];
  const all = document.querySelectorAll('a, button, [role="button"], div');
  let idx = 0;
  for (const el of all) {
    if (!isTileLike(el)) continue;
    const svgs = el.querySelectorAll(':scope > svg, :scope > * > svg, :scope > * > * > svg');
    if (svgs.length !== 1) continue;
    const svg = svgs[0];
    const sb = svg.getBoundingClientRect();
    if (sb.width < 8 || sb.width > 96 || sb.height < 8 || sb.height > 96) continue;
    const tb = el.getBoundingClientRect();
    if (tb.width < 60 || tb.height < 40) continue;
    const labelEl = el.querySelector('h3, h4, span, p');
    const label = labelEl ? (labelEl.innerText || '').trim().slice(0, 80) : '';
    // build a stable selector
    const id = 'icon-audit-target-' + idx++;
    el.setAttribute('data-icon-audit', id);
    const cs = getComputedStyle(svg);
    const tileCs = getComputedStyle(el);
    out.push({
      selector: '[data-icon-audit="' + id + '"]',
      label,
      tileBox: { x: tb.x, y: tb.y, w: tb.width, h: tb.height },
      iconBox: { x: sb.x, y: sb.y, w: sb.width, h: sb.height },
      hasSvg: true,
      opacity: parseFloat(cs.opacity || '1'),
      visibility: cs.visibility,
      display: cs.display,
      iconColor: cs.color,
      bgColor: tileCs.backgroundColor,
    });
  }
  return out;
}`;

// ---------- helpers ----------
function parseRgb(str) {
  if (!str) return null;
  const m = str.match(/rgba?\\((\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3] };
}

async function cropToBase64(pngBuffer, box, scale = 1) {
  const safe = {
    left: Math.max(0, Math.floor(box.x * scale) - 4),
    top: Math.max(0, Math.floor(box.y * scale) - 4),
    width: Math.ceil(box.w * scale) + 8,
    height: Math.ceil(box.h * scale) + 8,
  };
  try {
    const buf = await sharp(pngBuffer).extract(safe).png().toBuffer();
    return buf.toString("base64");
  } catch {
    return null;
  }
}

async function countNonBgPixels(pngBuffer, box, bgRgb, scale = 1) {
  if (!bgRgb) return null;
  const safe = {
    left: Math.max(0, Math.floor(box.x * scale)),
    top: Math.max(0, Math.floor(box.y * scale)),
    width: Math.max(1, Math.ceil(box.w * scale)),
    height: Math.max(1, Math.ceil(box.h * scale)),
  };
  try {
    const { data, info } = await sharp(pngBuffer)
      .extract(safe)
      .raw()
      .toBuffer({ resolveWithObject: true });
    let n = 0;
    const stride = info.channels;
    for (let i = 0; i < data.length; i += stride) {
      const dr = data[i] - bgRgb.r;
      const dg = data[i + 1] - bgRgb.g;
      const db = data[i + 2] - bgRgb.b;
      if (dr * dr + dg * dg + db * db > 900) n++; // > ~30 per channel diff
    }
    return n;
  } catch {
    return null;
  }
}

// ---------- main ----------
async function main() {
  console.log(`[icon-audit] base=${BASE} routes=${ROUTES.length} env=${ENVIRONMENT}`);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const failures = [];
  const failuresByRule = Object.fromEntries(Object.values(RULES).map((r) => [r, 0]));
  let tilesScanned = 0;
  let routesScanned = 0;

  for (const route of ROUTES) {
    const url = BASE.replace(/\\/$/, "") + route;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(800);
    } catch (e) {
      console.warn(`[icon-audit] skip ${url}: ${e.message}`);
      continue;
    }
    routesScanned++;

    let tiles = [];
    try {
      tiles = await page.evaluate(eval(`(${DISCOVER_FN})`));
    } catch (e) {
      console.warn(`[icon-audit] discover failed on ${url}: ${e.message}`);
      continue;
    }
    if (tiles.length < 1) {
      console.log(`[icon-audit] ${route} → 0 tiles`);
      continue;
    }
    console.log(`[icon-audit] ${route} → ${tiles.length} tiles`);

    const fullPngDefault = await page.screenshot({ fullPage: false, type: "png" });

    for (const tile of tiles) {
      tilesScanned++;
      const iconColor = parseRgb(tile.iconColor);
      const bgColor = parseRgb(tile.bgColor);
      const baseRules = runAllRules({
        ...tile,
        iconColor,
        bgColor,
      });

      // Capture default crop once
      const cropDefault = await cropToBase64(fullPngDefault, tile.tileBox);
      const defaultInkPx = await countNonBgPixels(fullPngDefault, tile.iconBox, bgColor);

      // For each interaction state, re-snapshot only that tile region for "obscured" check
      for (const state of ["hover", "focus", "active"]) {
        try {
          if (state === "hover") await page.hover(tile.selector, { timeout: 1500 });
          if (state === "focus") await page.focus(tile.selector, { timeout: 1500 });
          if (state === "active") {
            await page.hover(tile.selector, { timeout: 1500 });
            await page.mouse.down();
          }
          await page.waitForTimeout(150);
        } catch {
          continue;
        }
        const fullPngState = await page.screenshot({ fullPage: false, type: "png" });
        if (state === "active") await page.mouse.up().catch(() => {});
        const stateInkPx = await countNonBgPixels(fullPngState, tile.iconBox, bgColor);

        const stateRules = runAllRules({
          ...tile,
          iconColor,
          bgColor,
          state,
          defaultInkPx,
          stateInkPx,
        });
        const newFailures = stateRules.filter((r) => r.rule === RULES.OBSCURED);
        for (const r of newFailures) {
          const cropState = await cropToBase64(fullPngState, tile.tileBox);
          failures.push({
            route,
            selector: tile.selector,
            label: tile.label,
            rule: r.rule,
            state,
            contrast: r.contrast ?? null,
            bbox: tile.iconBox,
            crop_default_b64: cropDefault,
            crop_failing_b64: cropState,
          });
          failuresByRule[r.rule] = (failuresByRule[r.rule] || 0) + 1;
        }
      }

      // Persist non-state rule failures with default crop
      for (const r of baseRules) {
        failures.push({
          route,
          selector: tile.selector,
          label: tile.label,
          rule: r.rule,
          state: "default",
          contrast: r.contrast ?? null,
          bbox: tile.iconBox,
          crop_default_b64: cropDefault,
          crop_failing_b64: cropDefault,
        });
        failuresByRule[r.rule] = (failuresByRule[r.rule] || 0) + 1;
      }
    }
  }

  await browser.close();

  // ---------- write artifacts ----------
  const outDir = "/mnt/documents";
  await fs.mkdir(outDir, { recursive: true });

  const summary = {
    run_label: RUN_LABEL,
    environment: ENVIRONMENT,
    base: BASE,
    routes_scanned: routesScanned,
    tiles_scanned: tilesScanned,
    total_failures: failures.length,
    failures_by_rule: failuresByRule,
    failures,
    created_at: new Date().toISOString(),
  };

  await fs.writeFile(path.join(outDir, "icon-tile-audit.json"), JSON.stringify(summary, null, 2));

  const tplPath = path.join(__dirname, "report-template.html");
  const tpl = await fs.readFile(tplPath, "utf8");
  const html = tpl.replace("__DATA__", JSON.stringify(summary));
  await fs.writeFile(path.join(outDir, "icon-tile-audit.html"), html);
  console.log(`[icon-audit] wrote ${outDir}/icon-tile-audit.{html,json}`);
  console.log(
    `[icon-audit] scanned ${tilesScanned} tiles across ${routesScanned} routes — ${failures.length} failures`,
  );

  // ---------- optional DB insert ----------
  if (INSERT_DB) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("[icon-audit] --insert-db requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
      process.exit(2);
    }
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(url, key);
    const { error } = await sb.from("icon_audit_runs").insert({
      run_label: RUN_LABEL,
      environment: ENVIRONMENT,
      routes_scanned: routesScanned,
      tiles_scanned: tilesScanned,
      total_failures: failures.length,
      failures_by_rule: failuresByRule,
      failures,
      report_url: null,
    });
    if (error) {
      console.error("[icon-audit] DB insert failed:", error.message);
      process.exit(3);
    }
    console.log("[icon-audit] inserted run into icon_audit_runs");
  }

  // exit code: 1 if any "major" rule fired
  const major =
    (failuresByRule[RULES.MISSING_ICON] || 0) +
    (failuresByRule[RULES.LOW_CONTRAST] || 0) +
    (failuresByRule[RULES.INVISIBLE] || 0);
  process.exit(major > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(99);
});
