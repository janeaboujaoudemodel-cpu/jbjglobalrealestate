import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => {
  localStorage.setItem('jbj_user_mode_greeter_seen', '1');
  localStorage.setItem('cookie-consent', 'accepted');
});
await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);
for (let i = 0; i < 30; i++) {
  if (await page.locator('#top-areas-dubai').count()) break;
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(250);
}
await page.locator('#top-areas-dubai').scrollIntoViewIfNeeded({ timeout: 20000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: '/mnt/documents/top-areas-emerald-proof.png', fullPage: false });
await page.locator('.jj-area-explore-pill').first().hover();
await page.waitForTimeout(500);
await page.screenshot({ path: '/mnt/documents/top-areas-emerald-hover-proof.png', fullPage: false });
await browser.close();
console.log('/mnt/documents/top-areas-emerald-proof.png\n/mnt/documents/top-areas-emerald-hover-proof.png');
