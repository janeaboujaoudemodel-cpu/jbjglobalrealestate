import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'});
const page=await browser.newPage();
await page.goto('http://localhost:8080/careers',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(1000);
const out=await page.evaluate(()=>{
 const el=[...document.querySelectorAll('*')].find(el=>el.textContent?.trim()==='Sign In / Create Account');
 if(!el) return {error:'not found', texts:[...document.querySelectorAll('span,a,button')].map(e=>e.textContent?.trim()).filter(Boolean).slice(0,60)};
 const arr=[];
 for(const sheet of document.styleSheets){let rules; try{rules=sheet.cssRules}catch{continue}
  for(const r of rules){
   if(r.type===CSSRule.STYLE_RULE){
    try{ if(el.matches(r.selectorText)){} }catch{}
    let m=false; try{m=el.matches(r.selectorText)}catch{}
    if(m && (r.style.color||r.style.webkitTextFillColor||r.style.stroke||r.cssText.includes('text-fill'))){
      arr.push({sel:r.selectorText.slice(0,300), color:r.style.color, webkit:r.style.webkitTextFillColor, important:r.style.getPropertyPriority('color'), css:r.cssText.slice(0,500)});
    }
   }
  }
 }
 return {computed:getComputedStyle(el).color, webkit:getComputedStyle(el).webkitTextFillColor, matches:arr.slice(-30)};
});
console.log(JSON.stringify(out,null,2));
await browser.close();
