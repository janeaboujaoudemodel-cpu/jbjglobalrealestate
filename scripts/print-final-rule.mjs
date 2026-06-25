import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'}); const page=await browser.newPage();
await page.goto('http://127.0.0.1:8081/owner/crm?entity=leads&view=inbox',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(1000);
console.log(await page.evaluate(()=>{
 let out=[]; for(const ss of [...document.styleSheets]){try{for(const r of [...ss.cssRules]){const t=r.cssText||''; if(t.includes('SITEWIDE')||t.includes('[data-emerald-action="true"]')) out.push({type:r.type, sel:r.selectorText?.slice(0,1000), color:r.style?.getPropertyValue('color'), priority:r.style?.getPropertyPriority('color'), text:t.slice(0,1200)});}}catch(e){}}
 return out.slice(-10);
}));
await browser.close();
