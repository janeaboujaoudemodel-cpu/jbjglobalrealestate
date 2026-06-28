import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'});
const page=await browser.newPage({viewport:{width:1440,height:980}});
await page.goto('http://localhost:8080/',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(3500);
const out=await page.evaluate(()=>{
 const hs=Array.from(document.querySelectorAll('h1')).map(h=>h.textContent.trim());
 const h=Array.from(document.querySelectorAll('h1')).find(x=>x.textContent.includes('Gateway'));
 const arr=[]; let cur=h; while(cur&&cur.nodeType===1){ const cs=getComputedStyle(cur); arr.push({tag:cur.tagName, cls:cur.getAttribute('class'), surface:cur.getAttribute('data-surface'), hero:cur.hasAttribute('data-hero-dark'), bg:cs.backgroundColor, img:cs.backgroundImage.slice(0,100), color:cs.color, rect:Array.from(cur.getBoundingClientRect()).map?.(x=>x)}); cur=cur.parentElement;} return {hs, arr};
});
console.log(JSON.stringify(out,null,2)); await browser.close();
