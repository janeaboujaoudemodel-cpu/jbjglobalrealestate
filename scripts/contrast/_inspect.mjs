import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: '/nix/store/nw961dvpvik5m19kbay4cg27wxgl3sdv-playwright-chromium-headless-shell/chrome-linux/headless_shell' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
for (const route of ['/properties','/resale-properties','/listing-portal','/developers']) {
  const page = await ctx.newPage();
  await page.goto('http://localhost:8080'+route, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(3500);
  const info = await page.evaluate(() => ({
    badges: document.querySelectorAll('.card-status-badge').length,
    payment: document.querySelectorAll('[data-payment-plan-line]').length,
    projectLinks: document.querySelectorAll('a[href*="/project/"]').length,
  }));
  console.log(route, JSON.stringify(info));
  await page.close();
}
await browser.close();
