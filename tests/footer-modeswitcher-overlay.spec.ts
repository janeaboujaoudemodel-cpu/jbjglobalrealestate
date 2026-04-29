import { test, expect } from '@playwright/test';

/**
 * Regression: opening the footer ModeSwitcher must NEVER overlay the
 * 88px fixed header. The dropdown must open upward and its top edge
 * must clear the header at every supported viewport.
 *
 * Pairs with scripts/verify-footer-modeswitcher.mjs (visual capture).
 */

const BASE_URL =
  process.env.PREVIEW_URL ||
  process.env.BASE_URL ||
  'https://jbjglobalrealestate.lovable.app';

const HEADER_PX = 88;

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

test.describe('Footer ModeSwitcher header overlay regression', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name} (${vp.width}x${vp.height}): panel opens upward and clears header`, async ({
      browser,
    }) => {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await ctx.newPage();

      // Suppress popups/cookie banners + remove any high-z fixed overlays
      await page.addInitScript(() => {
        try {
          localStorage.setItem(
            'smart_popup_dismissed_until',
            String(Date.now() + 7 * 864e5),
          );
          localStorage.setItem('smart_popup_shown_count', '99');
          localStorage.setItem('smart_popup_session_shown', '1');
          localStorage.setItem(
            'cookies_consent',
            JSON.stringify({ accepted: true, ts: Date.now() }),
          );
          localStorage.setItem('cookiesConsent', 'accepted');
        } catch {}
        const killOverlays = () => {
          document.querySelectorAll('div.fixed.inset-0').forEach((el) => {
            const z =
              (el as HTMLElement).style.zIndex ||
              getComputedStyle(el).zIndex;
            if (parseInt(z, 10) >= 10000) el.remove();
          });
        };
        const start = () => {
          killOverlays();
          new MutationObserver(killOverlays).observe(document.body, {
            childList: true,
            subtree: true,
          });
        };
        if (document.body) start();
        else document.addEventListener('DOMContentLoaded', start);
      });

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      try {
        await page.waitForLoadState('networkidle', { timeout: 12_000 });
      } catch {}

      // Reveal footer
      await page.evaluate(() =>
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' as ScrollBehavior }),
      );
      await page.waitForTimeout(600);

      const trigger = page
        .locator('footer button[aria-haspopup="menu"]:has-text("Mode")')
        .first();
      await expect(
        trigger,
        'Footer ModeSwitcher trigger must exist',
      ).toBeVisible({ timeout: 10_000 });

      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();

      const menu = page.locator('[role="menu"]').first();
      await expect(menu).toBeVisible({ timeout: 5_000 });
      // Let Radix finish positioning
      await page.waitForTimeout(250);

      const menuBox = await menu.boundingBox();
      const triggerBox = await trigger.boundingBox();
      expect(menuBox, 'menu bounding box').not.toBeNull();
      expect(triggerBox, 'trigger bounding box').not.toBeNull();

      const m = menuBox!;
      const t = triggerBox!;

      // 1) Panel must open UPWARD (sit above the trigger)
      expect(
        m.y + m.height,
        `[${vp.name}] panel must open upward: menu.bottom (${(m.y + m.height).toFixed(1)}) <= trigger.top (${t.y.toFixed(1)})`,
      ).toBeLessThanOrEqual(t.y + 2);

      // 2) Panel top must CLEAR the 88px fixed header
      expect(
        m.y,
        `[${vp.name}] panel top (${m.y.toFixed(1)}px) must be >= header height (${HEADER_PX}px) — overlay regression`,
      ).toBeGreaterThanOrEqual(HEADER_PX);

      // 3) Sanity: panel must be fully within the viewport vertically
      expect(
        m.y + m.height,
        `[${vp.name}] panel must fit inside viewport (${vp.height}px)`,
      ).toBeLessThanOrEqual(vp.height + 1);

      await ctx.close();
    });
  }
});
