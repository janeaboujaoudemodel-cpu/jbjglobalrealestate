import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, chromiumSandbox: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
await page.goto('http://localhost:8080/careers', { waitUntil: 'networkidle', timeout: 60000 });
await page.screenshot({ path: '/mnt/documents/jbj-ui-audit/careers-before.png', fullPage: true });
const data = await page.evaluate(() => {
  function info(sel, txt){
    let el = txt ? [...document.querySelectorAll(sel)].find(e => e.textContent?.trim() === txt || e.textContent?.includes(txt)) : document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    let p=el; const chain=[]; while(p && chain.length<4){ const cps=getComputedStyle(p); chain.push({tag:p.tagName, cls:String(p.className).slice(0,120), bg:cps.backgroundColor, bgImg:cps.backgroundImage.slice(0,100), color:cps.color, fill:cps.webkitTextFillColor}); p=p.parentElement; }
    return { text: el.textContent?.trim().slice(0,120), tag: el.tagName, cls: String(el.className).slice(0,200), color: cs.color, fill: cs.webkitTextFillColor, bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0,120), width: rect.width, height: rect.height, display: cs.display, opacity: cs.opacity, chain };
  }
  return {
    url: location.href,
    meet: info('*','Meet Jessica'),
    badgeInterview: info('*','Interview Assistant'),
    badgeAI: info('*','AI Interview Assistant'),
    liveRoles: info('*','Live Roles'),
    openPositions: info('*','Open Positions'),
    subtitle: info('*','Tap Apply'),
    jessicaImg: (()=>{ const img=[...document.images].find(i=>/Jessica|jessica|interview/i.test(i.alt+i.src)); if(!img)return null; const r=img.getBoundingClientRect(); return {alt:img.alt, src:img.currentSrc, w:img.naturalWidth,h:img.naturalHeight, rect:{x:r.x,y:r.y,w:r.width,h:r.height}} })(),
    aiText: [...document.querySelectorAll('body *')].filter(e=>/AI Interview Assistant|Jessica AI|AI review|AI-powered interview assistant|AI-parsed/.test(e.textContent||'')).slice(0,20).map(e=>({tag:e.tagName,text:e.textContent.trim().slice(0,150), cls:String(e.className).slice(0,120)})),
    buttons: [...document.querySelectorAll('button,a')].filter(e=>/Apply|Start Conversation|Sign In|Next|Submit|Back|Open/.test(e.textContent||'')).slice(0,30).map(e=>{const cs=getComputedStyle(e), r=e.getBoundingClientRect(); return {text:e.textContent.trim().replace(/\s+/g,' ').slice(0,80), tag:e.tagName, color:cs.color, fill:cs.webkitTextFillColor, bg:cs.backgroundColor, bgImg:cs.backgroundImage.slice(0,70), h:r.height, w:r.width, cls:String(e.className).slice(0,140)}})
  };
});
console.log(JSON.stringify(data,null,2));
await browser.close();
