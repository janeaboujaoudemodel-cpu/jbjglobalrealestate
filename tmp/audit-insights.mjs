import { chromium } from 'playwright';
import fs from 'fs';
const outDir='/mnt/documents/insights-guides-audit';
fs.mkdirSync(outDir,{recursive:true});
const base=process.env.BASE_URL || 'http://127.0.0.1:4175';
const routes=['/faq','/guides/golden-visa-uae','/landlord-guide','/market-intelligence/overview'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1200}, deviceScaleFactor:1});
for (const r of routes){
  await page.goto(base+r,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForLoadState('networkidle',{timeout:20000}).catch(()=>{});
  await page.waitForTimeout(2500);
  await page.screenshot({path:`${outDir}/before-${r.replaceAll('/','_')||'home'}.png`, fullPage:false});
  const data=await page.evaluate(()=>{
    function lum(rgb){const a=rgb.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}
    function parse(c){let m=c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?[+m[1],+m[2],+m[3]]:null}
    function ratio(f,b){const L1=lum(f),L2=lum(b);return (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05)}
    const bad=[];
    const els=[...document.querySelectorAll('h1,h2,h3,p,span,a,button,li,svg')].filter(el=> el.getBoundingClientRect().width>4 && el.getBoundingClientRect().height>4 && getComputedStyle(el).visibility!=='hidden');
    for(const el of els.slice(0,3500)){
      const cs=getComputedStyle(el); const fg=parse(cs.color); if(!fg) continue;
      let node=el, bg=null;
      while(node && node.nodeType===1){const b=parse(getComputedStyle(node).backgroundColor); if(b && getComputedStyle(node).backgroundColor !== 'rgba(0, 0, 0, 0)'){bg=b; break;} node=node.parentElement;}
      if(!bg) bg=[255,255,255];
      const rr=ratio(fg,bg);
      const rect=el.getBoundingClientRect();
      if(rr<3 && rect.top>=0 && rect.top<1200){bad.push({tag:el.tagName, text:(el.innerText||el.getAttribute('aria-label')||el.outerHTML||'').slice(0,70), color:cs.color, bg:`rgb(${bg.join(', ')})`, ratio:+rr.toFixed(2), cls:el.className?.toString().slice(0,100), top:Math.round(rect.top)});}
    }
    return {title:document.title, bad:bad.slice(0,40)};
  });
  console.log('\nROUTE',r, data.title, 'bad', data.bad.length);
  console.log(JSON.stringify(data.bad.slice(0,14),null,2));
}
await browser.close();
