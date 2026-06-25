import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'}); const page=await browser.newPage({viewport:{width:1440,height:1000}});
const sessionJson=process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON; const storageKey=process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
if(sessionJson&&storageKey){await page.addInitScript(({key,value})=>{localStorage.setItem(key,value);sessionStorage.setItem('owner_verified_once','1')},{key:storageKey,value:sessionJson});}
await page.goto('http://127.0.0.1:8081/owner/crm?entity=leads&view=inbox',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(2000);
console.log(await page.evaluate(()=>{
 const b=[...document.querySelectorAll('button')].find(x=>x.textContent?.trim().startsWith('All') && x.getAttribute('data-emerald-action')==='true');
 const selectors=['[data-emerald-action="true"]','.jj-emerald-action','html body #root :is([data-emerald-action="true"]):not([data-no-contrast-guard]):not(.jj-emerald-soft):not(.jj-emerald-outline):not([data-emerald-tone="soft"]):not([data-emerald-tone="outline"])'];
 const rules=[];
 for(const ss of [...document.styleSheets]){try{for(const r of [...ss.cssRules]){if((r.cssText||'').includes('[data-emerald-action="true"]') && (r.cssText||'').includes('color')) rules.push(r.cssText.slice(0,500));}}catch{}}
 return {matches:selectors.map(s=>[s,b.matches(s)]), rules: rules.slice(-5), color:getComputedStyle(b).color, inline:b.getAttribute('style')};
}));
await browser.close();
