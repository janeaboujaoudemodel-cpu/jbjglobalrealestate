import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'}); const page=await browser.newPage({viewport:{width:1440,height:1000}});
const sj=process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON, sk=process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY; if(sj&&sk) await page.addInitScript(({key,value})=>{localStorage.setItem(key,value);sessionStorage.setItem('owner_verified_once','1')},{key:sk,value:sj});
await page.goto('http://127.0.0.1:8081/owner/crm?entity=leads&view=inbox',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(2000);
console.log(await page.evaluate(()=>{
 const el=[...document.querySelectorAll('button')].find(x=>x.textContent?.trim().startsWith('All') && x.getAttribute('data-emerald-action')==='true');
 let out=[]; for(const ss of [...document.styleSheets]){try{for(const r of [...ss.cssRules]){if(r.selectorText && r.style?.getPropertyValue('color') && (r.selectorText.includes('data-emerald-action')||r.selectorText.includes('jj-emerald-action'))){let full, err=''; try{full=el.matches(r.selectorText)}catch(e){err=e.message} out.push({full, err, color:r.style.getPropertyValue('color'), prio:r.style.getPropertyPriority('color'), selector:r.selectorText.slice(0,500)});}}}catch(e){}}
 return {computed:getComputedStyle(el).color, out};
}));
await browser.close();
