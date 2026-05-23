import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: '/nix/store/nw961dvpvik5m19kbay4cg27wxgl3sdv-playwright-chromium-headless-shell/chrome-linux/headless_shell' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
for (const route of ['/','/properties','/resale-properties']) {
  const page = await ctx.newPage();
  await page.goto('http://localhost:8080'+route, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(800);
  const hrefs = await page.$$eval('a[href]', as => as.slice(0,20).map(a=>a.getAttribute('href')).filter(h => h && (h.includes('project') || h.includes('properties') || h.includes('listing'))).slice(0,12));
  console.log(route, JSON.stringify(hrefs));
  await page.close();
}
await browser.close();
