import { chromium } from 'playwright';
const base=process.env.BASE_URL||'http://127.0.0.1:8081';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const sessionJson=process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON; const storageKey=process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
if(sessionJson&&storageKey){await page.addInitScript(({key,value})=>{localStorage.setItem(key,value);sessionStorage.setItem('owner_verified_once','1')},{key:storageKey,value:sessionJson});}
await page.goto(`${base}/owner/crm?entity=leads&view=inbox`, {waitUntil:'domcontentloaded'}); await page.waitForTimeout(6000);
console.log(await page.evaluate(()=>{
 const css=[...document.styleSheets].some(s=>{try{return [...s.cssRules].some(r=>(r.cssText||'').includes('SITEWIDE RENDERED') || (r.cssText||'').includes('[data-emerald-action="true"]'))}catch{return false}});
 const b=[...document.querySelectorAll('button')].find(x=>x.textContent?.trim().startsWith('All') && x.getAttribute('data-emerald-action')==='true');
 if(!b) return {css, found:false, url:location.href, body:document.body.innerText.slice(0,500)};
 return {css, found:true, outer:b.outerHTML.slice(0,400), color:getComputedStyle(b).color, webkit:getComputedStyle(b).webkitTextFillColor, bg:getComputedStyle(b).backgroundImage, data:b.getAttribute('data-emerald-action'), sheets:[...document.styleSheets].length};
}));
await browser.close();
