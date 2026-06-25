import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'}); const page=await browser.newPage(); await page.goto('http://127.0.0.1:8081/owner/crm?entity=leads&view=inbox',{waitUntil:'domcontentloaded'}); await page.waitForTimeout(1000);
console.log(await page.evaluate(()=>{
 const el=document.createElement('button'); el.setAttribute('data-emerald-action','true'); el.className='jj-emerald-action'; document.body.appendChild(el);
 const sels=[
 'html body #root :is([data-emerald-action="true"], .jj-emerald-action)',
 'html body #root :is([data-emerald-action="true"], .jj-emerald-action, [class*="bg-\\\\[\\\\#064E3B\\\\]"])',
 'html body #root :is([role="tab"][aria-selected="true"], button[aria-selected="true"], [data-emerald-ok="tab"], [data-emerald-ok="pill"], [data-emerald-ok="badge"], [data-emerald-ok="button"], [data-emerald-action="true"], .jj-emerald-action, .jj-surface-emerald, .jj-cta-emerald, .jj-pill-emerald, .jj-pill-emerald-metallic, .jj-badge-emerald, .jj-badge-dark, .jj-sidebar-item-active, [class*="bg-\\\\[\\\\#064E3B\\\\]"], [class*="bg-\\\\[\\\\#064e3b\\\\]"], [class*="bg-\\\\[\\\\#047857\\\\]"], [class*="bg-\\\\[\\\\#022C22\\\\]"], [class*="bg-\\\\[\\\\#022c22\\\\]"])',
 ];
 return sels.map(s=>{try{return {s,m:el.matches(s), q:!!document.querySelector(s)}}catch(e){return {s,e:e.message}}});
}));
await browser.close();
