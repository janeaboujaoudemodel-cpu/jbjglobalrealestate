import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1800}});
await page.goto('http://localhost:8080/careers',{waitUntil:'networkidle'});
const data=await page.evaluate(()=>{
 const spans=[...document.querySelectorAll('[data-surface="champagne"]')];
 const top=spans.find(s=>s.textContent?.includes('Top Opportunity'));
 const path=top?.querySelector('path,circle');
 const svg=top?.querySelector('svg');
 function info(el){ if(!el) return null; const cs=getComputedStyle(el); return {tag:el.tagName, class: String(el.getAttribute('class')), attrStroke: el.getAttribute('stroke'), attrStyle: el.getAttribute('style'), styleStroke: el.style.stroke, stylePrio: el.style.getPropertyPriority('stroke'), color: cs.color, stroke: cs.stroke, fill: cs.fill, cssText: el.style.cssText, parentTag: el.parentElement?.tagName, parentDataset: JSON.stringify(el.parentElement?.dataset||{})};}
 return {top: info(top), svg:info(svg), path:info(path)};
});
console.log(JSON.stringify(data,null,2));
await browser.close();
