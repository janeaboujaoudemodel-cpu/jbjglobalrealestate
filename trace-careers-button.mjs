import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('http://localhost:8080/careers',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(1200);
const out=await page.evaluate(()=>{
 const el=[...document.querySelectorAll('span')].find(e=>e.textContent?.trim()==='Sign In / Create Account');
 const parent=el?.closest('[data-cta="primary"],.jj-cta-primary,.jj-cta-emerald,[data-surface="emerald"]');
 const rules=[];
 for(const sheet of document.styleSheets){let rs;try{rs=sheet.cssRules}catch{continue}
  for(const r of rs){if(r.type===CSSRule.STYLE_RULE){let m=false;try{m=el.matches(r.selectorText)}catch{}; if(m&&(r.style.color||r.style.webkitTextFillColor||r.cssText.includes('text-fill'))) rules.push({sel:r.selectorText.slice(0,500), color:r.style.color, web:r.style.webkitTextFillColor, pc:r.style.getPropertyPriority('color'), pw:r.style.getPropertyPriority('-webkit-text-fill-color')});}}
 }
 return {found:!!el, color:getComputedStyle(el).color, web:getComputedStyle(el).webkitTextFillColor, span:el?.outerHTML, parent:parent?.outerHTML.slice(0,800), rules:rules.slice(-20)};
});
console.log(JSON.stringify(out,null,2));
await browser.close();
