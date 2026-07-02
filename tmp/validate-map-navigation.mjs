import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
const errors=[]; page.on('console', msg=>{if(msg.type()==='error') errors.push(msg.text())}); page.on('pageerror', e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);
const mapLink = page.locator('a[href="/map"]').filter({ hasText: 'Map' }).first();
await mapLink.waitFor({ state: 'attached', timeout: 15000 });
const start = Date.now();
await mapLink.click({ force: true, timeout: 10000 });
await page.waitForURL('**/map', { timeout: 15000 });
await page.waitForSelector('[data-map-page]', { timeout: 15000 });
await page.waitForSelector('.leaflet-container', { timeout: 15000 });
const navMs = Date.now() - start;
await page.waitForTimeout(2000);
await page.screenshot({ path: '/mnt/documents/map-navigation-proof.png', fullPage: true });
const result = await page.evaluate(() => ({
  path: location.pathname,
  count: document.querySelector('.jj-map-count-pill')?.textContent?.trim(),
  markerCount: document.querySelectorAll('.leaflet-marker-icon').length,
  commandBarVisible: !!document.querySelector('.jj-map-command-bar'),
}));
console.log(JSON.stringify({ navMs, result, errors: errors.slice(0,3), screenshot: '/mnt/documents/map-navigation-proof.png' }, null, 2));
await browser.close();
