import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'});
const page=await browser.newPage();
await page.goto('http://localhost:8080/ai-hub',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(1500);
const out=await page.evaluate(()=>{
 const el=[...document.querySelectorAll('*')].find(el=>el.textContent?.trim()==='Sign In / Create Account');
 if(!el) return {error:'not found', url:location.href, texts:[...document.querySelectorAll('span,a,button,h1,h2,h3')].map(e=>e.textContent?.trim()).filter(Boolean).slice(0,80)};
 const arr=[];
 for(const sheet of document.styleSheets){let rules; try{rules=sheet.cssRules}catch{continue}
  for(const r of rules){
   if(r.type===CSSRule.STYLE_RULE){
    let m=false; try{m=el.matches(r.selectorText)}catch{}
    if(m && (r.style.color||r.style.webkitTextFillColor||r.cssText.includes('text-fill'))){
      arr.push({sel:r.selectorText.slice(0,500), color:r.style.color, webkit:r.style.webkitTextFillColor, prioC:r.style.getPropertyPriority('color'), prioW:r.style.getPropertyPriority('-webkit-text-fill-color'), css:r.cssText.slice(0,600)});
    }
   }
  }
 }
 return {tag:el.tagName, class:el.className, computed:getComputedStyle(el).color, webkit:getComputedStyle(el).webkitTextFillColor, parent:el.parentElement?.outerHTML.slice(0,500), matches:arr.slice(-50)};
});
console.log(JSON.stringify(out,null,2));
await browser.close();
