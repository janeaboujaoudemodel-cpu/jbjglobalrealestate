import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'}); const page=await browser.newPage({viewport:{width:1440,height:1000}});
const sj=process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON, sk=process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY; if(sj&&sk) await page.addInitScript(({key,value})=>{localStorage.setItem(key,value);sessionStorage.setItem('owner_verified_once','1')},{key:sk,value:sj});
await page.goto('http://127.0.0.1:8081/owner/crm?entity=leads&view=inbox',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(2000);
console.log(await page.evaluate(()=>{
 const el=[...document.querySelectorAll('button')].find(x=>x.textContent?.trim().startsWith('All') && x.getAttribute('data-emerald-action')==='true');
 let out=[]; let idx=0;
 function walk(rules){for(const r of [...rules]){idx++; if(r.cssRules) walk(r.cssRules); else if(r.selectorText && r.style && r.style.getPropertyValue('color')){let m=false; try{m=el.matches(r.selectorText)}catch{} if(m) out.push({idx,selector:r.selectorText.slice(0,280),color:r.style.getPropertyValue('color'),prio:r.style.getPropertyPriority('color'),fill:r.style.getPropertyValue('-webkit-text-fill-color'),css:r.cssText.slice(0,500)});}}}
 for(const ss of [...document.styleSheets]){try{walk(ss.cssRules)}catch{}}
 return {computed:getComputedStyle(el).color, out:out.slice(-20)};
}));
await browser.close();
