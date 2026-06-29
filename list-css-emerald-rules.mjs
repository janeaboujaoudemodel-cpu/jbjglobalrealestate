import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'});
const page=await browser.newPage();
await page.goto('http://localhost:8080/properties',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(1000);
const out=await page.evaluate(()=>{
 const arr=[];
 for(const sheet of document.styleSheets){let rules; try{rules=sheet.cssRules}catch{continue}
  for(const r of rules){
   const txt=r.cssText||'';
   if(txt.includes('jj-cta-emerald') || txt.includes('data-surface="emerald"') || txt.includes('bg-emerald-')) arr.push(txt.slice(0,800));
  }
 }
 return arr.slice(-30);
});
console.log(out.join('\n---RULE---\n'));
await browser.close();
