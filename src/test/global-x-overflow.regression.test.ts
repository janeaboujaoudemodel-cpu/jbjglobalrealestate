// @vitest-environment node
/**
 * Global horizontal-overflow guard.
 *
 * Visits a broad set of public + portal routes at three viewport widths and
 * fails if any route's document scrolls horizontally OR if any non-scrollable
 * descendant of <main>/<body> renders outside the viewport. This catches
 * off-screen content (fixed-width children, un-wrapped flex rows, tables/grids
 * without `min-w-0`) before it reaches users.
 *
 * Skips gracefully when the dev server is unreachable.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "playwright";

const BASE_URL = process.env.PREVIEW_URL ?? "http://localhost:8080";

// Curated routes that cover marketing, tools, and portal surfaces.
const ROUTES = [
  "/",
  "/projects",
  "/developers",
  "/careers",
  "/guides",
  "/contact",
  "/tools/ai-home-finder",
  "/tools/mortgage-calculator",
  "/tools/compare-projects",
  "/broker/crm",
  "/broker/leads",
  "/broker/calendar",
  "/broker/tasks",
  "/broker/inbox",
  "/broker/portal",
];

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1366, height: 900 },
] as const;

const TOLERANCE = 1; // px — sub-pixel rounding

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

describe("global x-overflow guard", () => {
  for (const vp of VIEWPORTS) {
    for (const route of ROUTES) {
      it(`${route} @ ${vp.name} (${vp.width}px) has no horizontal overflow`, async () => {
        if (!serverReachable || !browser) {
          console.warn(`[x-overflow] skipping — dev server unreachable at ${BASE_URL}`);
          return;
        }

        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
        });
        const page = await ctx.newPage();
        try {
          await restoreSupabaseSession(page);
          await page.goto(`${BASE_URL}${route}`, {
            waitUntil: "networkidle",
            timeout: 30_000,
          });
          await page.waitForTimeout(700);

          // 1) Document never scrolls horizontally.
          const doc = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            bodyScrollWidth: document.body.scrollWidth,
            bodyOverflowX: window.getComputedStyle(document.body).overflowX,
            htmlOverflowX: window.getComputedStyle(document.documentElement).overflowX,
          }));
          const docOverflow = Math.max(
            doc.scrollWidth - doc.clientWidth,
            doc.bodyScrollWidth - doc.clientWidth,
          );
          expect(
            docOverflow,
            `Document scrolls horizontally by ${docOverflow}px on ${route} @ ${vp.width} ` +
              `(html overflow-x="${doc.htmlOverflowX}", body overflow-x="${doc.bodyOverflowX}").`,
          ).toBeLessThanOrEqual(TOLERANCE);

          // 2) No non-scrollable descendant of <main>/<body> renders off-screen.
          const offenders = await page.evaluate((tolerance) => {
            const vw = document.documentElement.clientWidth;
            const isScrollable = (el: Element) => {
              const s = window.getComputedStyle(el);
              return (
                s.overflowX === "auto" || s.overflowX === "scroll" ||
                s.overflow === "auto" || s.overflow === "scroll"
              );
            };
            const hasScrollableAncestor = (el: Element) => {
              let p: Element | null = el.parentElement;
              while (p && p !== document.body) {
                if (isScrollable(p)) return true;
                p = p.parentElement;
              }
              return false;
            };
            const out: Array<{ tag: string; cls: string; right: number; width: number }> = [];
            const nodes = document.querySelectorAll<HTMLElement>("main *, body > *");
            nodes.forEach((el) => {
              const s = window.getComputedStyle(el);
              if (s.position === "fixed" || s.position === "absolute") return;
              if (s.display === "none" || s.visibility === "hidden") return;
              if (isScrollable(el) || hasScrollableAncestor(el)) return;
              const r = el.getBoundingClientRect();
              if (r.width === 0) return;
              if (r.right - vw > tolerance) {
                out.push({
                  tag: el.tagName.toLowerCase(),
                  cls: (el.className || "").toString().slice(0, 140),
                  right: Math.round(r.right),
                  width: Math.round(r.width),
                });
              }
            });
            return out.slice(0, 5);
          }, TOLERANCE);

          expect(
            offenders,
            `Off-screen elements on ${route} @ ${vp.width}:\n` +
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
