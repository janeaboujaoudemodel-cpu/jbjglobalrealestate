import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'}); const page=await browser.newPage({viewport:{width:1440,height:1000}});
const sj=process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON, sk=process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY; if(sj&&sk) await page.addInitScript(({key,value})=>{localStorage.setItem(key,value);sessionStorage.setItem('owner_verified_once','1')},{key:sk,value:sj});
await page.goto('http://127.0.0.1:8081/owner/crm?entity=leads&view=inbox',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(2000);
console.log(await page.locator('button[data-emerald-action="true"]').first().evaluate(el=>{const cs=getComputedStyle(el); return {color:cs.color, fill:cs.webkitTextFillColor, transition:cs.transition, animation:cs.animation, opacity:cs.opacity, forcedColorAdjust:cs.forcedColorAdjust, all:cs.all, classes:el.className, parent:el.parentElement?.outerHTML.slice(0,250)}}));
await browser.close();
