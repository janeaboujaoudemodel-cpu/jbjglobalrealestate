import { chromium } from '@playwright/test';
const base = 'http://127.0.0.1:5173';
const sessionJson = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
const storageKey = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
const sizes = [['desktop',1440,1100],['ipad',1024,1366],['mobile',390,1000]];
const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium', args: ['--no-sandbox'] });
for (const [name,width,height] of sizes) {
  const page = await browser.newPage({ viewport:{width,height}, deviceScaleFactor:1 });
  if (sessionJson && storageKey) await page.addInitScript(({key,value})=>{
    localStorage.setItem(key,value); sessionStorage.setItem('owner_verified_once','1');
    try { const parsed=JSON.parse(value); const uid=parsed?.currentSession?.user?.id || parsed?.session?.user?.id || parsed?.user?.id; if(uid) localStorage.setItem(`owner_v2_${uid}`, JSON.stringify({ok:true,ts:Date.now()})); } catch {}
  }, {key:storageKey,value:sessionJson});
  await page.goto(`${base}/owner/documents/forms`, { waitUntil:'domcontentloaded', timeout:60000 });
  await page.waitForTimeout(3500);
  await page.evaluate(() => {
    document.querySelectorAll('[aria-labelledby="pending-tasks-title"], [data-radix-focus-guard]').forEach(e => e.remove());
    document.querySelectorAll('div.fixed.inset-0.z-50, div.pointer-events-none.fixed.inset-0.z-50').forEach(e => { if ((e.textContent||'').includes('Pending')) e.remove(); });
  });
  await page.screenshot({ path:`/mnt/documents/documents-forms-${name}-hub.png`, fullPage:true });
  await page.getByRole('button', { name:/new envelope/i }).first().click({ force:true, timeout:10000 }).catch(async()=>{});
  await page.waitForTimeout(1000);
  await page.screenshot({ path:`/mnt/documents/documents-forms-${name}-templates.png`, fullPage:true });
  await page.getByRole('button', { name:/Warning Letter/i }).first().click({ force:true, timeout:10000 }).catch(async()=>{});
  await page.waitForTimeout(2500);
  await page.screenshot({ path:`/mnt/documents/document-studio-${name}-editor.png`, fullPage:true });
  const qa = await page.evaluate(() => {
    const required = ['Warning Letter','Form A','Form B','Form F','Form I','Agent-to-Agent','Offer Letter','Contract','NOC','Reservation','MOU','Tenancy','Custom Client','Letterhead','AI Home Finder'];
    const text=document.body.innerText;
    const buttons=[...document.querySelectorAll('[data-jbj-button],button,[role="tab"]')].slice(0,120).map(el=>{const cs=getComputedStyle(el);return {txt:(el.textContent||'').trim().slice(0,35),color:cs.color,bg:cs.backgroundColor,bgi:cs.backgroundImage.slice(0,45)}});
    return {url:location.href, overlay:!!document.querySelector('[data-document-studio-overlay]'), requiredVisible: required.filter(x=>text.includes(x)), hasLLC:text.includes('L.L.C S.O.C'), hasDocumentStudioLabel:text.includes('Document Studio'), buttons:buttons.slice(0,8)};
  });
  console.log(name, JSON.stringify(qa));
  await page.close();
}
await browser.close();
