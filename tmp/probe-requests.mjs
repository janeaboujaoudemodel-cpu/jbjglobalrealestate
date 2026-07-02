import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:'/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
page.on('request', r=>{ if(r.url().includes('/src/pages')||r.url().includes('/src/components/insights')||r.url().includes('/src/components/market-intelligence')||r.url().includes('/src/routes')) console.log('REQ', r.method(), r.url());});
page.on('response', r=>{ if(r.url().includes('/src/pages')||r.url().includes('/src/components/insights')||r.url().includes('/src/components/market-intelligence')||r.url().includes('/src/routes')) console.log('RESP', r.status(), r.url());});
page.on('console', msg=>console.log('CONSOLE', msg.type(), msg.text()));
page.on('pageerror', err=>console.log('PAGEERR', err.stack||err.message));
await page.goto('http://127.0.0.1:5177/market-intelligence/areas',{waitUntil:'domcontentloaded'});
for (let i=0;i<10;i++) { await page.waitForTimeout(1000); console.log('tick',i, await page.evaluate(()=>document.querySelector('[data-mi-page]')?.textContent?.slice(0,80) || document.querySelector('main')?.innerText?.slice(0,100))); }
await browser.close();
