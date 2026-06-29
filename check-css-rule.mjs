import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'});
const page=await browser.newPage();
await page.goto('http://localhost:8080/careers',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(1500);
const data=await page.evaluate(()=>{
 let passRules=[]; let errors=[];
 for (const sheet of document.styleSheets){
  let rules;
  try{rules=sheet.cssRules}catch(e){errors.push(String(e)); continue}
  for (const r of rules){
   const txt=r.cssText||'';
   if(txt.includes('PASS 106')||txt.includes('SITEWIDE EMERALD')) passRules.push(txt.slice(0,200));
   if(txt.includes('.jj-cta-primary') && txt.includes('-webkit-text-fill-color') && txt.includes('#FFFFFF')) passRules.push(txt.slice(0,500));
  }
 }
 const span=[...document.querySelectorAll('span')].find(el=>el.textContent?.includes('Sign In / Create Account'));
 const a=span?.closest('a');
 const cs=span?getComputedStyle(span):null;
 const acs=a?getComputedStyle(a):null;
 return {passRulesLen:passRules.length, passRules:passRules.slice(-5), spanClass:span?.className, spanColor:cs?.color, spanWebkit:cs?.webkitTextFillColor, aClass:a?.className, aData:a?.outerHTML.slice(0,500), aColor:acs?.color, aDataSurface:a?.getAttribute('data-surface'), aDataCta:a?.getAttribute('data-cta')};
});
console.log(JSON.stringify(data,null,2));
await browser.close();
