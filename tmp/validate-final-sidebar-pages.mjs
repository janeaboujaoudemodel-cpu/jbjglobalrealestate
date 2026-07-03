import { chromium } from 'playwright';
const routes = ['/market-intelligence','/buyer-guide','/faq','/services','/about','/terms'];
const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
const results=[];
for (const route of routes) {
  const errors=[];
  page.removeAllListeners('pageerror');
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto('http://localhost:8080'+route, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('[data-mi-hero], [data-guide-hero], [data-faq-hero], [data-brand-hero], [data-hero-dark], .jj-hero-fullscreen') || document.querySelector('[data-insights-page] > section:first-of-type, [data-insights-page] > div > section:first-of-type'), null, { timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(800);
  await page.locator('button:has-text("Accept All")').click({ timeout: 1000 }).catch(()=>{});
  await page.waitForTimeout(300);
  const metrics=await page.evaluate(() => {
    const cnum=(v)=>{const m=v.match(/rgba?\(([^)]+)\)/); if(!m)return [999,999,999,1]; const p=m[1].split(',').map(x=>parseFloat(x)); return [p[0],p[1],p[2],p[3]??1];};
    const isBlack=(bg)=>{const [r,g,b,a]=cnum(bg); return a>.8&&r<22&&g<22&&b<22;};
    const hero=document.querySelector('[data-mi-hero], [data-guide-hero], [data-faq-hero], [data-brand-hero], [data-hero-dark], .jj-hero-fullscreen') || document.querySelector('[data-insights-page] > section:first-of-type, [data-insights-page] > div > section:first-of-type');
    const hr=hero?.getBoundingClientRect();
    const sections=Array.from(document.querySelectorAll('section')).filter(el=>el.getBoundingClientRect().height>40 && !hero?.contains(el) && el!==hero);
    const first=sections[0]?.getBoundingClientRect();
    const actions=Array.from(hero?.querySelectorAll('a,button')||[]).filter(el=>{const r=el.getBoundingClientRect(); return r.width>100 && r.height>35 && (el.textContent||'').trim();}).slice(-3).map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect(); return {txt:(el.textContent||'').trim().replace(/\s+/g,' '), bg:s.backgroundColor, bgImg:s.backgroundImage.slice(0,80), color:s.color, w:Math.round(r.width), h:Math.round(r.height)}});
    const blackSections=sections.filter(el=>isBlack(getComputedStyle(el).backgroundColor)).map(el=>({text:el.innerText.slice(0,45), bg:getComputedStyle(el).backgroundColor}));
    const cards=Array.from(document.querySelectorAll('.card,[data-slot="card"],.jj-card-inner,.jj-guide-card,article[class*="rounded"],div[class*="rounded-2xl"][class*="border"]')).filter(el=>{const r=el.getBoundingClientRect(); return r.width>120 && r.height>50 && !hero?.contains(el);}).slice(0,12).map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el); return {x:Math.round(r.x),w:Math.round(r.width),bg:s.backgroundColor};});
    return {path:location.pathname, hero:!!hero, heroHeight:hr&&Math.round(hr.height), heroGap:hr&&first?Math.round(first.top-hr.bottom):null, actions, blackSections:blackSections.slice(0,3), touchesEdge:cards.some(c=>c.x<16||c.x+c.w>innerWidth-16), cards:cards.slice(0,3), bodyBg:getComputedStyle(document.body).backgroundColor, textLen:document.body.innerText.length};
  });
  results.push({route, errors, metrics});
  if(route==='/market-intelligence'){
    await page.screenshot({path:'/mnt/documents/market-intelligence-final-hero-v2.png', fullPage:false});
    await page.evaluate(()=>window.scrollTo(0, document.body.scrollHeight-innerHeight));
    await page.waitForTimeout(500);
    await page.screenshot({path:'/mnt/documents/market-intelligence-final-lower-v2.png', fullPage:false});
  }
  if(route==='/buyer-guide') await page.screenshot({path:'/mnt/documents/buyer-guide-final-hero-v2.png', fullPage:false});
  if(route==='/terms') await page.screenshot({path:'/mnt/documents/terms-final-hero-v2.png', fullPage:false});
}
await browser.close();
console.log(JSON.stringify(results,null,2));
const failed=results.filter(r=>r.errors.length||!r.metrics.hero||r.metrics.blackSections.length||r.metrics.touchesEdge);
if(failed.length){ console.error('FAILED', JSON.stringify(failed,null,2)); process.exit(1); }
