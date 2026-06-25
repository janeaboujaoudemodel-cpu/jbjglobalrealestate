import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'}); const page=await browser.newPage({viewport:{width:1440,height:1000}});
const sj=process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON, sk=process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY; if(sj&&sk) await page.addInitScript(({key,value})=>{localStorage.setItem(key,value);sessionStorage.setItem('owner_verified_once','1')},{key:sk,value:sj});
await page.goto('http://127.0.0.1:8080/owner/crm?entity=leads&view=inbox',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(2000);
console.log(await page.evaluate(()=>[...document.styleSheets].map((s,i)=>{let txt='', rules=0; try{rules=s.cssRules.length; txt=[...s.cssRules].slice(-3).map(r=>r.cssText.slice(0,100)).join(' | ')}catch(e){txt=e.message} return {i, href:s.href, owner:s.ownerNode?.tagName, id:s.ownerNode?.id, data:s.ownerNode?.getAttribute?.('data-vite-dev-id'), rules, tail:txt}})));
await browser.close();
