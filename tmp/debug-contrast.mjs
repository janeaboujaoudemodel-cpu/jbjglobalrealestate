import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'});
const page=await browser.newPage({viewport:{width:1440,height:980}});
await page.goto('http://localhost:8080/',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(1500);
const out=await page.evaluate(()=>{
 const h=document.querySelector('h1');
 const arr=[]; let cur=h; while(cur&&cur.nodeType===1){ const cs=getComputedStyle(cur); arr.push({tag:cur.tagName, cls:cur.getAttribute('class'), surface:cur.getAttribute('data-surface'), hero:cur.hasAttribute('data-hero-dark'), bg:cs.backgroundColor, img:cs.backgroundImage.slice(0,100), color:cs.color}); cur=cur.parentElement;} return arr;
});
console.log(JSON.stringify(out,null,2)); await browser.close();
