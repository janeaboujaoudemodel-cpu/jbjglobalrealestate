import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('response', res => { const u=res.url(); if (/MarketIntelligence|market-intelligence|open-data|FAQ|BuyerGuide/.test(u)) console.log('RES', res.status(), u); });
page.on('requestfailed', req => { const u=req.url(); if (/MarketIntelligence|market-intelligence/.test(u)) console.log('FAIL', u, req.failure()?.errorText); });
page.on('pageerror', e=>console.log('ERR', e.stack || e.message));
await page.goto('http://localhost:8080/market-intelligence', { waitUntil: 'load', timeout: 30000 });
for (let i=0;i<20;i++) {
  await page.waitForTimeout(1000);
  const info = await page.evaluate(() => ({
    hasHero: !!document.querySelector('[data-mi-hero]'),
    loader: !!document.querySelector('[style*="pageLoaderSlide"]'),
    mainLen: document.querySelector('main')?.innerHTML.length,
    perf: performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/MarketIntelligence|market-intelligence|open-data/.test(n))
  }));
  console.log('tick', i+1, info);
  if (info.hasHero) break;
}
await browser.close();
