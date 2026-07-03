import { chromium } from 'playwright';
const routes = ['/market-intelligence','/market-intelligence/overview','/buyer-guide','/faq','/services','/about','/terms'];
const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
const results=[];
for (const route of routes) {
  console.log('ROUTE', route);
  const errors=[];
  page.removeAllListeners('pageerror');
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto('http://localhost:8080'+route, { waitUntil: 'domcontentloaded', timeout: 30000 });
  for (let i=0;i<30;i++) {
    const ready = await page.evaluate(() => !!document.querySelector('[data-mi-hero], [data-guide-hero], [data-faq-hero], [data-brand-hero], [data-hero-dark], .jj-hero-fullscreen, section'));
    if (ready) break;
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(700);
  const metrics=await page.evaluate(() => {
    const rgba = c => { const m=c.match(/rgba?\(([^)]+)\)/); if(!m)return null; const p=m[1].split(',').map(x=>parseFloat(x)); return {r:p[0],g:p[1],b:p[2],a:p[3]??1}; };
    const hero=document.querySelector('[data-mi-hero], [data-guide-hero], [data-faq-hero], [data-brand-hero], [data-hero-dark], .jj-hero-fullscreen');
    const hr=hero?.getBoundingClientRect();
    const sections=Array.from(document.querySelectorAll('section')).filter(el=>!el.matches('[data-mi-hero], [data-guide-hero], [data-faq-hero], [data-brand-hero], [data-hero-dark], .jj-hero-fullscreen'));
    const first=sections[0]?.getBoundingClientRect();
    const actions=Array.from(hero?.querySelectorAll('a,button')||[]).filter(el=>(el.textContent||'').trim().length && el.getBoundingClientRect().width>80).slice(-3).map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {txt:(el.textContent||'').trim().replace(/\s+/g,' '),bg:s.backgroundColor,bgImg:s.backgroundImage.slice(0,80),color:s.color,w:Math.round(r.width),h:Math.round(r.height)}});
    const blackSections=sections.map((el,i)=>({i,bg:getComputedStyle(el).backgroundColor,cls:String(el.className).slice(0,80)})).filter(x=>{const c=rgba(x.bg); return c&&c.r<20&&c.g<20&&c.b<20&&c.a>.8}).slice(0,3);
    const cards=Array.from(document.querySelectorAll('.card, [data-slot="card"], .jj-card-inner, .jj-guide-card, article[class*="rounded"], div[class*="rounded-2xl"][class*="border"]')).filter(el=>{const r=el.getBoundingClientRect();return r.width>120&&r.height>60&&!el.closest('[data-mi-toc],[data-guide-toc],[data-faq-toc],[data-premium-navigator]')}).slice(0,10).map(el=>{const r=el.getBoundingClientRect(), s=getComputedStyle(el); return {x:Math.round(r.x),w:Math.round(r.width),bg:s.backgroundColor};});
    return {path:location.pathname, bodyBg:getComputedStyle(document.body).backgroundColor, hero:hero?{h:Math.round(hr.height),bg:getComputedStyle(hero).backgroundColor,bgImg:getComputedStyle(hero).backgroundImage.slice(0,100)}:null, heroGap:hr&&first?Math.round(first.top-hr.bottom):null, actions, blackSections, cardCount:cards.length, touchesEdge:cards.some(c=>c.x<16||c.x+c.w>innerWidth-16), cards:cards.slice(0,3), mainText:document.querySelector('main')?.innerText.slice(0,80)};
  });
  results.push({route,errors:errors.slice(0,2),metrics});
  if(route==='/market-intelligence'){
    await page.screenshot({path:'/mnt/documents/market-intelligence-fixed-hero.png', fullPage:false});
    await page.evaluate(()=>window.scrollTo(0, document.body.scrollHeight-innerHeight));
    await page.waitForTimeout(500);
    await page.screenshot({path:'/mnt/documents/market-intelligence-fixed-lower.png', fullPage:false});
  }
}
await browser.close();
console.log(JSON.stringify(results,null,2));
