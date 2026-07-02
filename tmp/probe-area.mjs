import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:'/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
page.on('console', msg=>console.log('CONSOLE', msg.type(), msg.text()));
page.on('pageerror', err=>console.log('PAGEERR', err.message));
await page.goto('http://127.0.0.1:5177/market-intelligence/areas',{waitUntil:'domcontentloaded'});
await page.waitForLoadState('networkidle',{timeout:20000}).catch(()=>{});
await page.waitForTimeout(1000);
const res=await page.evaluate(()=>{
 const hero=document.querySelector('[data-mi-hero]');
 const content=hero?.textContent?.trim().slice(0,500);
 const cs=hero?getComputedStyle(hero):null;
 const rect=hero?.getBoundingClientRect();
 const children=[...document.querySelectorAll('[data-mi-hero] *')].slice(0,20).map(el=>({tag:el.tagName, text:el.textContent?.trim().slice(0,50), cls:String(el.className).slice(0,80), color:getComputedStyle(el).color, bg:getComputedStyle(el).backgroundColor, bgimg:getComputedStyle(el).backgroundImage.slice(0,120), rect:(()=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()}));
 return {body:document.body.innerHTML.slice(0,200), path:location.pathname, heroExists:!!hero, content, rect:rect&&{x:rect.x,y:rect.y,w:rect.width,h:rect.height}, cs:cs&&{display:cs.display, position:cs.position, bg:cs.backgroundColor, bgimg:cs.backgroundImage.slice(0,300), color:cs.color, minH:cs.minHeight, height:cs.height, z:cs.zIndex}, children};
});
console.log(JSON.stringify(res,null,2));
await page.screenshot({path:'/mnt/documents/probe-area.png',fullPage:true});
await browser.close();
