import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium', args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('console', m=>console.log('console',m.type(),m.text().slice(0,500)));
page.on('pageerror', e=>console.log('pageerror', e.message, e.stack?.slice(0,800)));
await page.goto('http://127.0.0.1:4175/faq',{waitUntil:'domcontentloaded', timeout:60000});
await page.waitForTimeout(5000);
console.log('url',page.url());
console.log(await page.evaluate(()=>({
 title:document.title,
 body:document.body.innerText.slice(0,2000),
 main:document.querySelector('main')?.outerHTML.slice(0,1000),
 rootChildren:[...document.querySelector('#root')?.children||[]].map(el=>({tag:el.tagName, cls:el.className, text:el.textContent?.slice(0,80), rect:(()=>{let r=el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}})()})),
 faq: document.querySelector('[data-neon-page]')?.outerHTML.slice(0,500),
 hero: document.querySelector('[data-faq-hero]') && (()=>{let el=document.querySelector('[data-faq-hero]'); let r=el.getBoundingClientRect(); return {outer:el.outerHTML.slice(0,300), rect:{x:r.x,y:r.y,w:r.width,h:r.height}, disp:getComputedStyle(el).display, pos:getComputedStyle(el).position, bg:getComputedStyle(el).backgroundColor}})()
})));
await browser.close();
