import { chromium } from 'playwright';import fs from 'node:fs';
const executablePath=['/chromium_headless_shell-1194/chrome-linux/headless_shell','/chromium-1194/chrome-linux/chrome'].find(p=>fs.existsSync(p));
const browser=await chromium.launch({headless:true,executablePath});const page=await browser.newPage({viewport:{width:1280,height:900}});
page.on('console',m=>console.log('console',m.type(),m.text().slice(0,500)));page.on('pageerror',e=>console.log('pageerror',e.stack||e.message));
await page.goto('http://127.0.0.1:8080/interior-design-ai',{waitUntil:'domcontentloaded'});await page.waitForTimeout(8000);
console.log(await page.evaluate(()=>({mainHTML:document.querySelector('main')?.innerHTML.slice(0,2000),content:document.querySelector('[data-content-gutter]')?.innerHTML.slice(0,1000),scripts:[...document.scripts].length, errors:window.__JBJ_CLIENT_ERRORS__||null, bodyClasses:document.body.className, html:document.documentElement.outerHTML.includes('InteriorDesignAI')})));
await browser.close();
