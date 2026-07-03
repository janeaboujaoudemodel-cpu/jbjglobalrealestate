import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('response', async res => {
  const url = res.url();
  if (url.includes('/src/') || url.includes('/@')) console.log(res.status(), url);
});
page.on('requestfailed', req => console.log('FAIL', req.url(), req.failure()?.errorText));
page.on('pageerror', e=>console.log('ERR', e.stack || e.message));
await page.goto('http://localhost:8080/market-intelligence', { waitUntil: 'networkidle', timeout: 60000 }).catch(e=>console.log('goto',e.message));
await page.waitForTimeout(10000);
console.log('imports?', await page.evaluate(() => performance.getEntriesByType('resource').map(e=>e.name).filter(n=>n.includes('MarketIntelligence') || n.includes('market-intelligence') || n.includes('PublicRoutes')).slice(0,50)));
console.log('main', await page.evaluate(() => document.querySelector('main')?.innerHTML.slice(0,1000)));
await browser.close();
