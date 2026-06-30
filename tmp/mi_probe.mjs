import { chromium } from 'playwright';
const url = process.env.URL || 'http://localhost:5173/market-intelligence';
const browser = await chromium.launch({ headless: true, chromiumSandbox: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
page.on('console', msg => { if (msg.type()==='error') console.log('console-error', msg.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(()=>{});
await page.waitForTimeout(1500);
const metrics = await page.evaluate(() => {
 const rect = (el) => { if (!el) return null; const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom}; };
 const hero = document.querySelector('[data-mi-hero]');
 const main = document.querySelector('main.jj-main-shell');
 const miPage = document.querySelector('[data-mi-page]');
 const sidebar = document.querySelector('[data-chrome="sidebar"]');
 const sourceCards = [...document.querySelectorAll('[data-mi-source-card]')].map((el, i) => {
   const btn = el.querySelector('a,button');
   return {i, text: el.textContent?.trim().replace(/\s+/g,' ').slice(0,140), rect:rect(el), btn: !!btn, btnText: btn?.textContent?.trim(), btnRect: rect(btn)};
 });
 const kpiCards = [...document.querySelectorAll('[data-dld-kpi-card]')].map((el,i)=>({i,text:el.textContent?.trim().replace(/\s+/g,' ').slice(0,100),rect:rect(el),icons:el.querySelectorAll('[data-icon-tile], .mi-icon-tile, [data-dld-emerald-tile]').length}));
 const rankRows = [...document.querySelectorAll('[data-dld-area-row]')].slice(0,5).map(el=>({text:el.textContent?.trim().replace(/\s+/g,' '), rect:rect(el), cols:getComputedStyle(el).gridTemplateColumns, nameRect:rect(el.querySelector('[data-dld-area-name]')), badgeRect:rect(el.querySelector('[data-dld-rank-badge]'))}));
 return {location: location.href, viewport:{w:innerWidth,h:innerHeight}, doc:{sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth, sh:document.documentElement.scrollHeight}, hero:rect(hero), main:rect(main), miPage:rect(miPage), sidebar:rect(sidebar), sourceCards, kpiCards, rankRows};
});
console.log(JSON.stringify(metrics,null,2));
await page.screenshot({ path: '/mnt/documents/market-intelligence-before.png', fullPage: true });
await browser.close();
