import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium', args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('http://127.0.0.1:4175/faq',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(5000);
console.log(await page.evaluate(()=>({text:document.body.innerText.slice(0,2000), html:document.body.innerHTML.slice(0,500)})));
console.log(await page.evaluate(()=>[...document.querySelectorAll('a,button,h1,h2,h3,span,p')].filter(el=>(el.textContent||'').includes('Buyer FAQ')).map(el=>{let r=el.getBoundingClientRect();let cs=getComputedStyle(el);return {tag:el.tagName, cls:String(el.className), text:el.textContent.trim(), rect:{x:r.x,y:r.y,w:r.width,h:r.height}, color:cs.color,bg:cs.backgroundColor,bgImg:cs.backgroundImage,border:cs.borderColor}})));
await browser.close();
