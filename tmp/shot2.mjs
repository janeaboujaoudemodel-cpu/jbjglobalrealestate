import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, executablePath: '/bin/chromium', args:['--no-sandbox'] });
for (const [w,h,tag] of [[1348,959,'desk'],[390,844,'mob']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(9000);
  await p.screenshot({ path: `/mnt/documents/filter2-${tag}.png` });
  console.log(tag, JSON.stringify(await p.evaluate(() => {
    const rr = e => { if(!e) return null; const r=e.getBoundingClientRect(); return {t:Math.round(r.top),b:Math.round(r.bottom),w:Math.round(r.width),h:Math.round(r.height)}; };
    return { geo: rr(document.querySelector('[data-geo-filter-bar]')), pill: rr(document.querySelector('.jj-hero-search-bar')), h1: rr(document.querySelector('h1')), innerH: innerHeight };
  })));
  await p.close();
}
await b.close();
