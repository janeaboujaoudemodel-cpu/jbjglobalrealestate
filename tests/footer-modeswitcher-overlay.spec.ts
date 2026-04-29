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

    test(`${vp.name} (${vp.width}x${vp.height}): keyboard nav (Tab/Enter/Escape) opens upward and restores focus`, async ({
      browser,
    }) => {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await ctx.newPage();

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
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.scrollIntoViewIfNeeded();

      // Programmatically focus the trigger (simulates Tab landing on it)
      await trigger.focus();
      await expect
        .poll(async () => await trigger.evaluate((el) => el === document.activeElement))
        .toBe(true);

      // 1) Enter opens the menu
      await page.keyboard.press('Enter');
      const menu = page.locator('[role="menu"]').first();
      await expect(menu, 'menu opens via keyboard Enter').toBeVisible({ timeout: 5_000 });
      await page.waitForTimeout(250);

      // 2) Verify upward open + clears header (parity with mouse path)
      const menuBox = await menu.boundingBox();
      const triggerBox = await trigger.boundingBox();
      expect(menuBox).not.toBeNull();
      expect(triggerBox).not.toBeNull();
      expect(
        menuBox!.y + menuBox!.height,
        `[${vp.name}] keyboard-opened panel must open upward`,
      ).toBeLessThanOrEqual(triggerBox!.y + 2);
      expect(
        menuBox!.y,
        `[${vp.name}] keyboard-opened panel top must clear ${HEADER_PX}px header`,
      ).toBeGreaterThanOrEqual(HEADER_PX);

      // 3) ArrowDown / Tab moves focus into the menu (Radix focuses first item on open)
      const focusInsideMenu = async () =>
        await page.evaluate(() => {
          const a = document.activeElement;
          if (!a) return false;
          return !!a.closest('[role="menu"]');
        });
      // Radix typically auto-focuses the first item; nudge with ArrowDown if not
      if (!(await focusInsideMenu())) {
        await page.keyboard.press('ArrowDown');
      }
      await expect
        .poll(focusInsideMenu, { timeout: 3_000 })
        .toBe(true);

      // 4) Escape closes the menu and restores focus to the trigger
      await page.keyboard.press('Escape');
      await expect(menu, 'menu closes on Escape').toBeHidden({ timeout: 5_000 });
      await expect
        .poll(
          async () => await trigger.evaluate((el) => el === document.activeElement),
          { timeout: 3_000 },
        )
        .toBe(true);

      // 5) Re-open with Space, then close with Escape again — no focus trap regression
      await page.keyboard.press(' ');
      await expect(menu).toBeVisible({ timeout: 5_000 });
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden({ timeout: 5_000 });
      await expect
        .poll(async () => await trigger.evaluate((el) => el === document.activeElement))
        .toBe(true);

      await ctx.close();
    });
  }
});
