import { chromium } from 'playwright';
import fs from 'node:fs';
const candidates = [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, '/chromium_headless_shell-1194/chrome-linux/headless_shell', '/chromium-1194/chrome-linux/chrome'].filter(Boolean);
const executablePath = candidates.find(p => { try { return fs.statSync(p).isFile(); } catch { return false; } });
const browser = await chromium.launch({headless:true, executablePath});
const base = 'http://127.0.0.1:8080';
async function restore(page){
  const sk = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
  const sj = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
  if (!sk || !sj) return false;
  await page.goto(base, {waitUntil:'domcontentloaded'});
  await page.evaluate(([k,v]) => localStorage.setItem(k,v), [sk,sj]);
  return true;
}
function luminance([r,g,b]){const a=[r,g,b].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]}
function contrast(f,b){const L1=luminance(f),L2=luminance(b);return (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05)}
for (const [name,w,h] of [['desktop',1280,900],['tablet',890,1100],['mobile',390,844]]) {
  const page = await browser.newPage({viewport:{width:w,height:h}});
  page.on('pageerror', err => console.log(name,'pageerror',err.message));
  await restore(page);
  await page.goto(`${base}/interior-design-ai`, {waitUntil:'networkidle', timeout:30000}).catch(async()=>{});
  await page.waitForTimeout(1500);
  const audit = await page.evaluate(() => {
    const root = document.querySelector('[data-interior-design-ai]');
    const buttons = [...document.querySelectorAll('[data-interior-design-ai] button, [data-interior-design-ai] [role="button"]')].map((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return { text: (el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,50), x:r.x, y:r.y, w:r.width, h:r.height, color:s.color, bg:s.backgroundColor, display:s.display };
    }).filter(b => b.w > 0 && b.h > 0);
    return {
      url: location.href,
      mounted: !!root,
      h1: [...document.querySelectorAll('h1')].map(e=>e.textContent?.trim()),
      scrollY,
      docOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth,
      buttons,
      text: document.body.innerText.slice(0,500),
    };
  });
  console.log(name, JSON.stringify(audit, null, 2));
  await page.screenshot({path:`/mnt/documents/interior-design-${name}-verified.png`, fullPage:true});
  await page.close();
}
await browser.close();
