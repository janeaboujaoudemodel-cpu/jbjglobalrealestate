import { chromium } from '@playwright/test';
const base='http://127.0.0.1:8080';
const paths=['/owner','/owner/documents/forms','/owner/crm'];
const sizes=[{w:1216,h:900},{w:900,h:900},{w:768,h:900}];
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium', args:['--no-sandbox']});
for (const s of sizes) {
  const page=await browser.newPage({viewport:{width:s.w,height:s.h}, deviceScaleFactor:1});
  for (const path of paths) {
    await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000}).catch(e=>console.log('GOTOERR',path,e.message));
    await page.waitForLoadState('networkidle',{timeout:15000}).catch(()=>{});
    await page.waitForTimeout(1600);
    const safe=path.replace(/\//g,'_')||'home';
    await page.screenshot({path:`/mnt/documents/owner-ui-${s.w}${safe}.png`, fullPage:false});
    const result=await page.evaluate(() => {
      const overflowEls=[];
      const all=[...document.body.querySelectorAll('*')];
      for (const el of all) {
        const r=el.getBoundingClientRect();
        if (r.width>0 && r.height>0 && (r.right > window.innerWidth + 2 || r.left < -2)) {
          const cs=getComputedStyle(el);
          overflowEls.push({tag:el.tagName, cls:String(el.className).slice(0,120), text:(el.textContent||'').trim().slice(0,80), left:Math.round(r.left), right:Math.round(r.right), width:Math.round(r.width), pos:cs.position, overflowX:cs.overflowX});
          if (overflowEls.length>=8) break;
        }
      }
      const badEmerald=[];
      function isEmeraldish(bg,img){
        const vals=[bg,img].join(' ').toLowerCase();
        return vals.includes('6, 78, 59') || vals.includes('4, 44, 28') || vals.includes('0, 68, 48') || vals.includes('064e3b') || vals.includes('042c1c') || vals.includes('linear-gradient');
      }
      const candidates=[...document.querySelectorAll('button,[role="tab"],a,[data-surface="emerald"],[data-emerald="true"],[data-emerald-ok],.jj-surface-emerald,.jj-cta-primary,.jj-cta-emerald,.allow-white')];
      for (const el of candidates) {
        const cs=getComputedStyle(el);
        if (!isEmeraldish(cs.backgroundColor, cs.backgroundImage)) continue;
        const children=[el,...el.querySelectorAll('span,div,p,strong,svg')].slice(0,20);
        for (const child of children) {
          const r=child.getBoundingClientRect();
          if (r.width<=0 || r.height<=0) continue;
          const cc=getComputedStyle(child);
          const color=cc.color;
          if (!/255, 255, 255/.test(color)) {
            badEmerald.push({tag:child.tagName, parent:el.tagName, text:(child.textContent||el.textContent||'').trim().slice(0,80), color, bg:cs.backgroundColor, bgImg:cs.backgroundImage.slice(0,80), cls:String(child.className).slice(0,80)});
            break;
          }
        }
        if (badEmerald.length>=8) break;
      }
      return {path:location.pathname, bodyW:document.body.scrollWidth, docW:document.documentElement.scrollWidth, winW:innerWidth, overflowEls, badEmerald, heading:document.querySelector('h1,h2')?.textContent?.trim()};
    });
    console.log(JSON.stringify({size:s,path,...result},null,2));
  }
  await page.close();
}
await browser.close();
