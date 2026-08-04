import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, executablePath: '/bin/chromium', args:['--no-sandbox'] });
for (const [w,h,tag] of [[1348,959,'desk'],[390,844,'mob']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `/mnt/documents/filter-${tag}.png` });
  console.log(tag, JSON.stringify(await p.evaluate(() => {
    const c = [...document.querySelectorAll('*')].find(e => typeof e.className==='string' && /jj-geo|geo-filter/i.test(e.className));
    const bar = document.querySelector('.jj-hero-search-bar');
    const rr = e => { if(!e) return null; const r=e.getBoundingClientRect(); return {t:Math.round(r.top),b:Math.round(r.bottom),w:Math.round(r.width),h:Math.round(r.height)}; };
    return { geoClass: c?.className||null, geo: rr(c), pill: rr(bar), innerH: innerHeight, docW: document.documentElement.scrollWidth };
  })));
  await p.close();
}
await b.close();
