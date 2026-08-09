import { chromium } from 'playwright';

const BASE = 'http://localhost:8080';
const browser = await chromium.launch({ executablePath: '/bin/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

await page.goto(`${BASE}/developers`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1000);

// dismiss cookie banner
const okBtn = page.locator('button:has-text("OKAY")').first();
if (await okBtn.isVisible({ timeout: 2000 }).catch(() => false)) await okBtn.click();

await page.waitForTimeout(1000);
await page.mouse.wheel(0, 900);
await page.waitForTimeout(2000);

const cardCount = await page.locator('[data-developer-card="true"]').count();
console.log('cardCount after scroll:', cardCount);

await page.screenshot({ path: '/tmp/dev-audit-check2.png', fullPage: true });
await browser.close();
