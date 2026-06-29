import { chromium } from '@playwright/test';
import fs from 'fs';
const out='/mnt/documents/emerald-contrast-proof-v2/final-targeted'; fs.mkdirSync(out,{recursive:true});
const routes=[['home','/'],['properties','/properties'],['developers','/developers'],['careers','/careers'],['ai-home-finder','/ai-home-finder'],['services','/services'],['contact','/contact'],['developer-portal','/developer-portal'],['auth','/auth']];
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const results=[];
for(const [label,route] of routes){
 await page.goto('http://localhost:8080'+route,{waitUntil:'domcontentloaded',timeout:20000}).catch(e=>{});
 await page.waitForTimeout(1200);
 const res=await page.evaluate(({label,route})=>{
  const white='rgb(255, 255, 255)';
  const emeraldSel='[data-surface="emerald"],[data-studio-surface="emerald"],[data-icon-tile-tone="emerald"],[data-cta="primary"],[data-cta="dark"],.jj-cta-primary,.jj-cta-emerald,.jj-cta-dark,.jj-navy-cta,.jj-surface-emerald,.jj-emerald-solid,.jj-emerald-fill,.jj-emerald-metallic,.jj-emerald-action,.jj-pill-emerald,.jj-pill-emerald-metallic,.jj-chip-emerald,.jj-icon-tile-emerald,.careers-navy-cta,.careers-pill-active,.careers-card-navy,.jj-header-premium-control,.jj-side-tile,.jbj-sidebar-collapse-control,[data-sidebar-collapse-control],[data-jj-nav-collapse-toggle],[class~="bg-emerald-900"],[class~="bg-emerald-800"],[class~="bg-emerald-700"],[class~="bg-emerald-600"],[class~="bg-green-900"],[class~="bg-green-800"],[class~="bg-green-700"],[class~="bg-green-600"],[class*="bg-[#064E3B]"],[class*="bg-[#042c1c]"],[class*="bg-[#042C1C]"],[class*="bg-[#0A6B53]"],[class*="bg-[#047857]"],[class*="bg-[#065F46]"],[class*="bg-[#022C22]"]';
  const lightNested='[data-surface="champagne"],[data-surface="cream"],[data-surface="light"],[data-surface="page"],[data-surface="gold"],.surface-champagne,.surface-cream,.surface-light,.surface-page,.surface-gold,.jj-card-inner,.jj-layer-2,.jj-surface-emerald-soft,.jj-emerald-soft,.jj-emerald-outline';
  const bad=[]; const surfaces=[...document.querySelectorAll(emeraldSel)].filter(el=>!el.matches('.jj-surface-emerald-soft,.jj-emerald-soft,.jj-emerald-outline,[data-emerald-tone="soft"],[data-emerald-tone="outline"]'));
  function vis(el){const cs=getComputedStyle(el),r=el.getBoundingClientRect();return cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0.05&&r.width>1&&r.height>1;}
  for(const surf of surfaces){ if(!vis(surf)) continue;
    const nodes=[surf,...surf.querySelectorAll('*')];
    for(const el of nodes){ if(!vis(el)) continue; if(el!==surf){const l=el.closest(lightNested); if(l&&surf.contains(l)&&l!==surf&&!el.closest('[data-surface="emerald"],[data-cta="primary"],[data-cta="dark"],.jj-cta-primary,.jj-cta-emerald,.jj-cta-dark,.jj-navy-cta,.jj-header-premium-control')) continue;}
      const cs=getComputedStyle(el); const tag=el.tagName.toLowerCase(); const txt=(el.textContent||'').replace(/\s+/g,' ').trim();
      const svgish=['svg','path','circle','rect','line','polyline','polygon','ellipse','g','use'].includes(tag)||String(el.className||'').includes('lucide')||el.hasAttribute('data-lucide');
      const textish=txt&& !['svg','path','circle','rect','line','polyline','polygon','ellipse','g','use'].includes(tag);
      let fail=false; if(svgish){ if(cs.stroke&&cs.stroke!=='none'&&cs.stroke!==white) fail=true; if(cs.fill&&cs.fill!=='none'&&cs.fill!==white&&cs.fill!=='rgba(0, 0, 0, 0)') fail=true; } else if(textish){ if(cs.color!==white || (cs.webkitTextFillColor&&cs.webkitTextFillColor!==white)) fail=true; }
      if(fail) bad.push({tag,text:txt.slice(0,80),color:cs.color,webkit:cs.webkitTextFillColor,stroke:cs.stroke,fill:cs.fill,className:String(el.className||'').slice(0,140),surface:String(surf.className||'').slice(0,140)});
      if(bad.length>20) break;
    }
    if(bad.length>20) break;
  }
  return {label,route,url:location.href,surfaces:surfaces.length,badCount:bad.length,bad};
 },{label,route});
 results.push(res);
 await page.screenshot({path:`${out}/${label}.png`,fullPage:false,timeout:20000});
}
await browser.close();
fs.writeFileSync(`${out}/targeted-report.json`,JSON.stringify(results,null,2));
console.log(results.map(r=>`${r.label}: surfaces=${r.surfaces} bad=${r.badCount}`).join('\n'));
