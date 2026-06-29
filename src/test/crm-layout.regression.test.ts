// @vitest-environment node
/**
 * CRM layout regression checks.
 *
 * Guards against future changes re-breaking small-screen responsiveness on
 * broker/CRM surfaces by asserting:
 *   1. No horizontal overflow on the document at any tested viewport.
 *   2. No primary container/card overflows its parent's content box.
 *
 * Runs against the dev server at http://localhost:8080. Skips gracefully if
 * the dev server is not reachable (e.g. CI without a live preview).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

const BASE_URL = process.env.PREVIEW_URL ?? "http://localhost:8080";

// Routes that must stay overflow-free.
const ROUTES = [
  "/broker/crm",
  "/broker/leads",
  "/broker/portal",
  "/broker/listings",
  "/broker/calendar",
  "/broker/tasks",
];

// Phone, large phone, tablet portrait, tablet landscape, small laptop.
const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 812 },
  { name: "iphone-pro-max", width: 430, height: 932 },
  { name: "ipad-portrait", width: 768, height: 1024 },
  { name: "ipad-landscape", width: 1024, height: 1366 },
  { name: "laptop", width: 1280, height: 800 },
];

// Per-route tolerance for documentElement.scrollWidth - clientWidth (px).
// 1px allowed for sub-pixel rounding.
const OVERFLOW_TOLERANCE = 1;

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let serverReachable = false;

beforeAll(async () => {
  try {
    const probe = await fetch(BASE_URL, { method: "GET" });
    serverReachable = probe.ok || probe.status < 500;
  } catch {
    serverReachable = false;
  }
  if (!serverReachable) return;

  // Prefer the sandbox's pre-installed chromium when the bundled revision is missing.
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
  await context?.close();
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

describe("CRM layout regression — no horizontal overflow", () => {
  for (const vp of VIEWPORTS) {
    for (const route of ROUTES) {
      it(`${route} @ ${vp.name} (${vp.width}px) fits without horizontal scroll`, async () => {
        if (!serverReachable || !browser) {
          // Don't fail builds when no live preview exists.
          console.warn(`[crm-layout] skipping — dev server unreachable at ${BASE_URL}`);
          return;
        }

        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 2,
        });
        const page = await ctx.newPage();
        try {
          await restoreSupabaseSession(page);
          await page.goto(`${BASE_URL}${route}`, {
            waitUntil: "networkidle",
            timeout: 30_000,
          });
          // Settle async layout (fonts, images, virtualized lists).
          await page.waitForTimeout(800);

          // 1. Document-level horizontal overflow.
          const docMetrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            bodyScrollWidth: document.body.scrollWidth,
          }));

          const docOverflow = docMetrics.scrollWidth - docMetrics.clientWidth;
          expect(
            docOverflow,
            `Document overflows viewport by ${docOverflow}px on ${route} @ ${vp.width}. ` +
              `Likely cause: a fixed-width child, an un-wrapped flex row, ` +
              `or a table/grid without min-w-0.`,
          ).toBeLessThanOrEqual(OVERFLOW_TOLERANCE);

          // 2. Find any element that overflows the viewport horizontally.
          //    Excludes intentionally horizontally-scrollable containers
          //    (overflow-x: auto/scroll) and offscreen popovers.
          const offenders = await page.evaluate((tolerance) => {
            const vw = document.documentElement.clientWidth;
            const out: Array<{ tag: string; cls: string; right: number; width: number }> = [];
            const nodes = document.querySelectorAll<HTMLElement>("main *, [data-crm] *");
            nodes.forEach((el) => {
              const style = window.getComputedStyle(el);
              if (style.position === "fixed" || style.position === "absolute") return;
              if (style.overflowX === "auto" || style.overflowX === "scroll") return;
              if (style.display === "none" || style.visibility === "hidden") return;
              const r = el.getBoundingClientRect();
              if (r.width === 0) return;
              if (r.right - vw > tolerance) {
                out.push({
                  tag: el.tagName.toLowerCase(),
                  cls: (el.className || "").toString().slice(0, 120),
                  right: Math.round(r.right),
                  width: Math.round(r.width),
                });
              }
            });
            // Cap to first 5 to keep failure output readable.
            return out.slice(0, 5);
          }, OVERFLOW_TOLERANCE);

          expect(
            offenders,
            `Elements overflow viewport on ${route} @ ${vp.width}:\n` +
              offenders.map((o) => `  <${o.tag} class="${o.cls}"> right=${o.right} width=${o.width}`).join("\n"),
          ).toEqual([]);
        } finally {
          await page.close();
          await ctx.close();
        }
      }, 60_000);
    }
  }
});
