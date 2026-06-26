import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 });
page.on('console', msg => { if (msg.type() === 'error') console.log('console-error:', msg.text()); });
page.on('pageerror', err => console.log('page-error:', err.message));
await page.goto('http://localhost:8080/owner/documents/forms', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);
for (const name of ['Later','Close','Cancel']) {
  const btn = page.getByRole('button', { name, exact: false }).first();
  if (await btn.isVisible().catch(() => false)) await btn.click().catch(() => {});
}
const gen = page.getByRole('button', { name: /generate document/i }).first();
if (await gen.isVisible().catch(() => false)) await gen.click();
await page.waitForTimeout(600);
const offer = page.getByRole('button', { name: /offer letter/i }).first();
if (await offer.isVisible().catch(() => false)) await offer.click();
await page.waitForTimeout(2500);
await page.screenshot({ path: '/mnt/documents/document-studio-offer-letter-validation.png', fullPage: false });
console.log('url=', page.url());
console.log('studio=', await page.locator('[data-document-studio-overlay]').count());
console.log('aiPanel=', await page.locator('.studio-ai-panel').count());
await browser.close();
