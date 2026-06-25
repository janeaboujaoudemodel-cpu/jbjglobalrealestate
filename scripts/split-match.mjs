import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'}); const page=await browser.newPage({viewport:{width:1440,height:1000}});
const sj=process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON, sk=process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY; if(sj&&sk) await page.addInitScript(({key,value})=>{localStorage.setItem(key,value);sessionStorage.setItem('owner_verified_once','1')},{key:sk,value:sj});
await page.goto('http://127.0.0.1:8081/owner/crm?entity=leads&view=inbox',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(2000);
console.log(await page.evaluate(()=>{
 const el=[...document.querySelectorAll('button')].find(x=>x.textContent?.trim().startsWith('All') && x.getAttribute('data-emerald-action')==='true');
 let rule; for(const ss of [...document.styleSheets]){try{for(const r of [...ss.cssRules]){if(r.selectorText?.includes('button[aria-selected') && r.style?.getPropertyValue('color')) rule=r;}}catch{}}
 if(!rule) return 'no rule';
 const sel=rule.selectorText; const parts=[]; let depth=0, cur=''; for(const ch of sel){if(ch==='('||ch==='[') depth++; if(ch===')'||ch===']') depth--; if(ch===','&&depth===0){parts.push(cur.trim()); cur=''} else cur+=ch} parts.push(cur.trim());
 return {computed:getComputedStyle(el).color, ruleColor:rule.style.getPropertyValue('color'), prio:rule.style.getPropertyPriority('color'), parts:parts.map(p=>{let m=false,e=''; try{m=el.matches(p)}catch(err){e=err.message} return {m,e,p:p.slice(0,300)}})};
}));
await browser.close();
