import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium', args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('http://127.0.0.1:4175/faq',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(3000);
console.log(await page.evaluate(()=>{
 const out=[];
 const texts=['Buyer FAQ','Browse by Audience','Your Questions Answered','Navigator'];
 for(const t of texts){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_ELEMENT);
  let n; while(n=walker.nextNode()){
   if((n.textContent||'').trim().includes(t)){
    const r=n.getBoundingClientRect(); if(r.width && r.height){
     const cs=getComputedStyle(n); out.push({query:t,tag:n.tagName, cls:String(n.className).slice(0,160), text:(n.textContent||'').trim().slice(0,80), rect:{x:r.x,y:r.y,w:r.width,h:r.height}, color:cs.color, bg:cs.backgroundColor, bgImg:cs.backgroundImage.slice(0,120), border:cs.borderColor}); break;
    }
   }
  }
 }
 for(const a of [...document.querySelectorAll('a')].filter(a=>a.textContent?.includes('Buyer FAQ')).slice(0,2)){
  let r=a.getBoundingClientRect(); let cs=getComputedStyle(a); out.push({query:'link Buyer FAQ',tag:a.tagName, cls:String(a.className), rect:{x:r.x,y:r.y,w:r.width,h:r.height}, color:cs.color,bg:cs.backgroundColor,bgImg:cs.backgroundImage,border:cs.borderColor});
  const icon=a.querySelector('svg'); if(icon){let r2=icon.getBoundingClientRect();let cs2=getComputedStyle(icon); out.push({query:'icon',tag:icon.tagName,cls:String(icon.className),rect:{x:r2.x,y:r2.y,w:r2.width,h:r2.height}, color:cs2.color, stroke:cs2.stroke,bg:cs2.backgroundColor});}
 }
 return out;
}));
await browser.close();
