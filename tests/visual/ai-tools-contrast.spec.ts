/**
 * Visual regression tests for AI-tool surfaces.
 *
 * Guards against:
 *  - Blue / gold / black text or icons leaking onto emerald surfaces
 *  - Dropdown open/hover states losing white contrast
 *  - Meta-chip / feature-card / CTA pill alignment drifting
 *
 * Run with: npx playwright test tests/visual/ai-tools-contrast.spec.ts
 */
import { test, expect } from "@playwright/test";

const TOOLS = [
  { path: "/ai-home-finder",       name: "ai-home-finder" },
  { path: "/mortgage-calculator",  name: "mortgage-calculator" },
  { path: "/property-evaluator",   name: "property-evaluator" },
  { path: "/request-valuation",    name: "request-valuation" },
];

const FORBIDDEN = [
  /rgb\(\s*0,\s*0,\s*0\s*\)/,          // pure black text on emerald = fail
  /rgb\(\s*30,\s*64,\s*175\s*\)/,      // blue-800
  /rgb\(\s*184,\s*149,\s*85\s*\)/,     // legacy gold #B89555
];

test.describe("AI tools — emerald contrast lock", () => {
  for (const tool of TOOLS) {
    test(`${tool.name} has no black/blue/gold text on emerald surfaces`, async ({ page }) => {
      await page.goto(`http://localhost:8080${tool.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      const offenders = await page.evaluate((forbiddenSrc) => {
        const forbidden = forbiddenSrc.map((s) => new RegExp(s));
        const roots = document.querySelectorAll(
          '.aihf-root, [data-surface="emerald"], .jj-surface-emerald, .jj-pill-emerald-metallic'
        );
        const bad: string[] = [];
        roots.forEach((root) => {
          root.querySelectorAll<HTMLElement>("*").forEach((el) => {
            const cs = getComputedStyle(el);
            const c = cs.color;
            if (forbidden.some((rx) => rx.test(c))) {
              bad.push(`${el.tagName}.${el.className} color=${c}`);
            }
          });
        });
        return bad.slice(0, 20);
      }, FORBIDDEN.map((r) => r.source));

      expect(offenders, `Forbidden text colors found: ${offenders.join("\n")}`).toEqual([]);
    });
  }

  test("dropdown open state stays white-on-emerald", async ({ page }) => {
    await page.goto("http://localhost:8080/mortgage-calculator", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const trigger = page.locator('[role="combobox"], [data-radix-select-trigger]').first();
    if (await trigger.count()) {
      await trigger.click();
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot("mortgage-dropdown-open.png", { maxDiffPixels: 500 });
    }
  });

  test("AI Home Finder intro — meta chips align with feature cards", async ({ page }) => {
    await page.goto("http://localhost:8080/ai-home-finder", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot("aihf-intro.png", {
      fullPage: false,
      maxDiffPixels: 800,
    });
  });
});
