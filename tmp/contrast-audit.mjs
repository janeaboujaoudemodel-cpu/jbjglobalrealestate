import { chromium } from '@playwright/test';
import fs from 'node:fs';
const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:8080';
const routes = ['/', '/properties', '/resale-properties', '/developers', '/areas', '/guides', '/investor-hub', '/ai-hub', '/property-map', '/about', '/contact', '/mortgage-calculator', '/property-evaluator', '/legal/terms', '/legal/privacy', '/owner', '/owner/documents', '/broker-dashboard', '/developers-portal'];
function lum(c) { let [r,g,b]=c; r/=255; g/=255; b/=255; const a=[r,g,b].map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)); return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]; }
function contrast(f,b){const l1=lum(f),l2=lum(b); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)}
const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const context = await browser.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
const results=[];
for (const route of routes) {
  const page = await context.newPage();
  const target = new URL(route, PREVIEW_URL).toString();
  try {
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    const data = await page.evaluate(() => {
      function parseRgb(s){ const m=String(s||'').match(/rgba?\(([^)]+)\)/); if(!m) return null; const p=m[1].split(',').map(x=>parseFloat(x)); const a=p[3] ?? 1; return [p[0],p[1],p[2],a]; }
      function effectiveBg(el){ let cur=el; let blends=[]; while(cur && cur.nodeType===1){ const cs=getComputedStyle(cur); const bg=parseRgb(cs.backgroundColor); if(bg && bg[3]>0.02) blends.push(bg); cur=cur.parentElement; } let out=[255,255,255,1]; for (const bg of blends.reverse()) { const a=bg[3]; out=[bg[0]*a+out[0]*(1-a), bg[1]*a+out[1]*(1-a), bg[2]*a+out[2]*(1-a), 1]; } return out; }
      function visible(el){ const cs=getComputedStyle(el); const r=el.getBoundingClientRect(); return cs.visibility!=='hidden' && cs.display!=='none' && parseFloat(cs.opacity)>0.05 && r.width>1 && r.height>1 && r.bottom>0 && r.right>0 && r.top<innerHeight && r.left<innerWidth; }
      function path(el){ if(el.id) return '#'+el.id; let parts=[]; let cur=el; while(cur&&cur.nodeType===1&&parts.length<5){ let s=cur.tagName.toLowerCase(); const cls=(cur.getAttribute('class')||'').split(/\s+/).filter(Boolean).slice(0,2); if(cls.length) s+='.'+cls.map(c=>c.replace(/[^a-zA-Z0-9_-]/g,'_')).join('.'); parts.unshift(s); cur=cur.parentElement;} return parts.join(' > '); }
      const selector='button,a,[role="button"],[role="tab"],input,textarea,[data-radix-select-trigger],h1,h2,h3,h4,p,label,span,li,svg';
      return Array.from(document.querySelectorAll(selector)).filter(visible).map(el=>{ const cs=getComputedStyle(el); const tf=cs.webkitTextFillColor && cs.webkitTextFillColor!=='rgba(0, 0, 0, 0)' ? cs.webkitTextFillColor : cs.color; const color=parseRgb(tf); const bg=effectiveBg(el); const r=el.getBoundingClientRect(); return { tag:el.tagName, role:el.getAttribute('role'), text:(el.innerText||el.textContent||el.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,90), selector:path(el), color, bg, colorCss:cs.color, fill:cs.webkitTextFillColor, bgCss:cs.backgroundColor, rect:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)], surface:el.getAttribute('data-surface') || el.closest('[data-surface]')?.getAttribute('data-surface') || '', classes:el.getAttribute('class')||''}; });
    });
    const bad=[];
    for (const x of data) { if(!x.color || x.color[3]<0.5) continue; const rr=contrast(x.color,x.bg); if(rr<3.0) bad.push({...x, ratio:+rr.toFixed(2)}); else { const bg=x.bg, fg=x.color; const darkBg=lum(bg)<0.18; const lightGold=(bg[0]>210&&bg[1]>185&&bg[2]>140); const whiteFg=fg[0]>235&&fg[1]>235&&fg[2]>235; const blackFg=fg[0]<50&&fg[1]<50&&fg[2]<50; if(darkBg&&blackFg) bad.push({...x, ratio:+rr.toFixed(2), token:'black-on-dark'}); if(lightGold&&whiteFg) bad.push({...x, ratio:+rr.toFixed(2), token:'white-on-light'}); } }
    results.push({ route, count: bad.length, bad: bad.slice(0,35) });
    console.log(`${bad.length?'✗':'✓'} ${route} ${bad.length}`);
    await page.screenshot({ path: `/mnt/documents/contrast-proof-${route.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'home'}.png`, fullPage: false });
  } catch(e) { console.log(`! ${route} ${e.message}`); results.push({route,error:e.message,count:0,bad:[]}); }
  await page.close();
}
fs.mkdirSync('/mnt/documents/contrast-audit', {recursive:true});
fs.writeFileSync('/mnt/documents/contrast-audit/results.json', JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(r=>({route:r.route,count:r.count,error:r.error})),null,2));
await browser.close();
