// @vitest-environment node
/**
 * Broker CRM / Leads visual regression checks.
 *
 * Catches two specific classes of regression:
 *   1. KPI / Pipeline tile clipping on /broker/crm — value or label rendered
 *      with scrollWidth > clientWidth (truncated to "C", "O", "ASSIGNE…").
 *   2. /broker/leads "Add Lead" CTA rendering with a black/non-emerald fill,
 *      violating the Emerald CTA Hierarchy.
 *
 * Runs against the dev server at http://localhost:8080. Skips gracefully if
 * the dev server is not reachable or the broker portal redirects to /auth.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser, type Page } from "playwright";

const BASE_URL = process.env.PREVIEW_URL ?? "http://localhost:8080";
const SCREENSHOT_DIR = resolve(process.cwd(), "tmp/broker-visual");

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const;

let browser: Browser | null = null;
let serverReachable = false;

beforeAll(async () => {
  try {
    const probe = await fetch(BASE_URL, { method: "GET" });
    serverReachable = probe.ok || probe.status < 500;
  } catch {
    serverReachable = false;
  }
  if (!serverReachable) return;
  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const fs = await import("node:fs");
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    "/chromium_headless_shell-1194/chrome-linux/headless_shell",
    "/chromium-1194/chrome-linux/chrome",
  ].filter(Boolean) as string[];
  const executablePath = candidates.find((p) => {
    try { return fs.statSync(p).isFile(); } catch { return false; }
  });
  browser = await chromium.launch({ headless: true, executablePath });
}, 30_000);

afterAll(async () => {
  await browser?.close();
});

async function restoreSupabaseSession(page: Page) {
  const sk = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
  const sj = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
  if (!sk || !sj) return;
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ([k, v]) => window.localStorage.setItem(k, v),
    [sk, sj] as const,
  );
}

/** Parse "rgb(r, g, b)" / "rgba(r, g, b, a)" → [r,g,b]. */
function parseRgb(input: string): [number, number, number] | null {
  const m = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Emerald means green channel dominates; pure black means all <= 24. */
function classifyFill(rgb: [number, number, number]): "emerald" | "black" | "other" {
  const [r, g, b] = rgb;
  if (r <= 24 && g <= 24 && b <= 24) return "black";
  if (g > r + 20 && g > b + 20 && g >= 60) return "emerald";
  return "other";
}

describe("broker visual regression", () => {
  for (const vp of VIEWPORTS) {
    it(`/broker/crm KPI + Pipeline tiles render without clipping @ ${vp.name}`, async () => {
      if (!serverReachable || !browser) {
        console.warn(`[broker-visual] skipping — dev server unreachable at ${BASE_URL}`);
        return;
      }

      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      try {
        await restoreSupabaseSession(page);
        const resp = await page.goto(`${BASE_URL}/broker/crm`, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });
        await page.waitForTimeout(900);

        // Gracefully skip when auth gate redirects out of /broker/crm.
        if (!page.url().includes("/broker/crm")) {
          console.warn(`[broker-visual] skipping — redirected to ${page.url()}`);
          return;
        }
        expect(resp?.status() ?? 0).toBeLessThan(500);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/crm-${vp.name}.png`,
          fullPage: false,
        });

        // Inspect every button rendered inside the two KPI grids — KPI tiles
        // are <button> children of a grid container that begins with
        // `grid-cols-2`. We probe every text node child for clipping.
        const clippedTiles = await page.evaluate(() => {
          const TOL = 1;
          const out: Array<{ where: string; text: string; sw: number; cw: number }> = [];
          // Heuristic: scan all <button> nodes inside <main> that wrap an
          // IconTile + value + label (our KPI + Pipeline tiles).
          const root = document.querySelector("main") ?? document.body;
          const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button"));
          for (const btn of buttons) {
            const hasIconTile = btn.querySelector('[class*="rounded-xl"] svg, .jj-icon-tile') !== null;
            if (!hasIconTile) continue;
            const divs = Array.from(btn.querySelectorAll<HTMLDivElement>("div"));
            for (const d of divs) {
              // Skip wrappers without direct text content.
              const text = (d.textContent || "").trim();
              if (!text || d.children.length > 0) continue;
              const overflowsX = d.scrollWidth - d.clientWidth > TOL;
              const overflowsY = d.scrollHeight - d.clientHeight > TOL;
              if (overflowsX || overflowsY) {
                out.push({
                  where: btn.className.slice(0, 80),
                  text: text.slice(0, 40),
                  sw: d.scrollWidth,
                  cw: d.clientWidth,
                });
              }
            }
          }
          return out.slice(0, 8);
        });

        expect(
          clippedTiles,
          `Clipped KPI / Pipeline cells on /broker/crm @ ${vp.name}:\n` +
            clippedTiles.map((c) => `  "${c.text}" (sw=${c.sw} cw=${c.cw})`).join("\n"),
        ).toEqual([]);
      } finally {
        await page.close();
        await ctx.close();
      }
    }, 60_000);

    it(`/broker/leads Add Lead CTA uses emerald-metallic fill @ ${vp.name}`, async () => {
      if (!serverReachable || !browser) {
        console.warn(`[broker-visual] skipping — dev server unreachable at ${BASE_URL}`);
        return;
      }

      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      try {
        await restoreSupabaseSession(page);
        const resp = await page.goto(`${BASE_URL}/broker/leads`, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });
        await page.waitForTimeout(900);

        if (!page.url().includes("/broker/leads")) {
          console.warn(`[broker-visual] skipping — redirected to ${page.url()}`);
          return;
        }
        expect(resp?.status() ?? 0).toBeLessThan(500);

        const cta = page.getByRole("button", { name: /add lead/i }).first();
        await cta.waitFor({ state: "visible", timeout: 10_000 });

        await cta.screenshot({ path: `${SCREENSHOT_DIR}/leads-cta-${vp.name}.png` });

        const styling = await cta.evaluate((el) => {
          const cs = window.getComputedStyle(el);
          return {
            backgroundColor: cs.backgroundColor,
            backgroundImage: cs.backgroundImage,
            color: cs.color,
            className: (el as HTMLElement).className,
          };
        });

        // CTA must be flagged as the locked emerald-metallic primitive.
        expect(
          styling.className,
          `Add Lead CTA missing emerald-metallic class. className="${styling.className}"`,
        ).toMatch(/jj-pill-emerald-metallic|jj-cta-emerald/);

        // Foreground must be white (≥ 240 on all channels).
        const fg = parseRgb(styling.color);
        expect(fg, `Add Lead CTA color="${styling.color}" not parseable`).not.toBeNull();
        const [fr, fg2, fb] = fg!;
        expect(
          Math.min(fr, fg2, fb),
          `Add Lead CTA foreground not white (rgb ${fr},${fg2},${fb}).`,
        ).toBeGreaterThanOrEqual(230);

        // Background must be emerald (solid color OR linear-gradient containing emerald).
        const solid = parseRgb(styling.backgroundColor);
        const solidKind = solid ? classifyFill(solid) : "other";
        const gradientHasEmerald = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+/.test(styling.backgroundImage)
          && (styling.backgroundImage.match(/rgba?\([^)]+\)/g) ?? [])
              .map(parseRgb)
              .some((c) => c && classifyFill(c) === "emerald");

        const looksEmerald = solidKind === "emerald" || gradientHasEmerald;
        const looksBlack = solidKind === "black" && !gradientHasEmerald;

        expect(
          looksBlack,
          `Add Lead CTA rendered with black fill (bg="${styling.backgroundColor}", img="${styling.backgroundImage.slice(0, 120)}").`,
        ).toBe(false);
        expect(
          looksEmerald,
          `Add Lead CTA fill is not emerald (bg="${styling.backgroundColor}", img="${styling.backgroundImage.slice(0, 120)}").`,
        ).toBe(true);
      } finally {
        await page.close();
        await ctx.close();
      }
    }, 60_000);
  }
});
