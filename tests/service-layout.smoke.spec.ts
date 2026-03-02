import { test, expect } from '@playwright/test';

const BASE_URL = 'https://jbjglobalrealestate.lovable.app';

const pages = [
  'property-management',
  'buying-advisory',
  'investment-advisory',
] as const;

test.describe('service layout real-browser smoke', () => {
  for (const slug of pages) {
    test(`/services/${slug} has visible body section > 120px`, async ({ page }) => {
      await page.goto(`${BASE_URL}/services/${slug}?layoutDebug=1`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);

      await page.evaluate(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.max(0, max * 0.5));
      });
      await page.waitForTimeout(500);

      const bodyHeights = await page.evaluate(() => {
        const sections = Array.from(document.querySelectorAll('main section')) as HTMLElement[];
        return sections.slice(1).map((el) => {
          const rect = el.getBoundingClientRect();
          return Math.round(rect.height);
        });
      });

      expect(bodyHeights.some((h) => h > 120)).toBeTruthy();

      await page.screenshot({
        path: `e2e-artifacts/${slug}-50.png`,
        fullPage: true,
      });
    });
  }
});
