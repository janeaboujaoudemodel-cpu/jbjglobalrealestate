import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium', args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}, deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4175/faq',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(5000);
await page.screenshot({path:'/mnt/documents/insights-guides-audit/recheck-faq.png', fullPage:false});
const loc=page.locator('[data-faq-hero]');
await loc.screenshot({path:'/mnt/documents/insights-guides-audit/recheck-faq-hero.png'});
await browser.close();
