import { chromium } from 'playwright';import fs from 'node:fs';
const executablePath=['/chromium_headless_shell-1194/chrome-linux/headless_shell','/chromium-1194/chrome-linux/chrome'].find(p=>fs.existsSync(p));
const browser=await chromium.launch({headless:true,executablePath});const page=await browser.newPage({viewport:{width:1280,height:900}});
await page.goto('http://127.0.0.1:8080/interior-design-ai',{waitUntil:'networkidle',timeout:30000}).catch(()=>{});await page.waitForTimeout(3000);
console.log(await page.evaluate(()=>{
 const html=document.querySelector('main')?.innerHTML||'';
 return {len:html.length, hasInterior: html.includes('data-interior-design-ai'), hasH1: html.includes('AI Interior'), frame: !!document.querySelector('[data-tool-frame]'), frameText: document.querySelector('[data-tool-frame]')?.textContent?.slice(0,500), sectionCount: document.querySelectorAll('section').length, display: document.querySelector('[data-tool-frame]') ? getComputedStyle(document.querySelector('[data-tool-frame]')).display : null};
}));
await browser.close();
