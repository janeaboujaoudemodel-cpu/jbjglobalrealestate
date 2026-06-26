import { chromium } from '@playwright/test';
const base = 'http://127.0.0.1:5173';
const sessionJson = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
const storageKey = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
const sizes = [
  ['desktop', 1440, 1100],
  ['ipad', 1024, 1366],
  ['mobile', 390, 1000],
];
const browser = await chromium.launch({ headless: true });
for (const [name, width, height] of sizes) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  if (sessionJson && storageKey) {
    await page.addInitScript(({ key, value }) => {
      localStorage.setItem(key, value);
      sessionStorage.setItem('owner_verified_once', '1');
      try {
        const parsed = JSON.parse(value);
        const uid = parsed?.currentSession?.user?.id || parsed?.session?.user?.id || parsed?.user?.id;
        if (uid) localStorage.setItem(`owner_v2_${uid}`, JSON.stringify({ ok: true, ts: Date.now() }));
      } catch {}
    }, { key: storageKey, value: sessionJson });
  }
  await page.goto(`${base}/owner/documents/forms`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `/mnt/documents/documents-forms-${name}-hub.png`, fullPage: true });
  const newEnvelope = page.getByRole('button', { name: /new envelope/i }).first();
  if (await newEnvelope.count()) {
    await newEnvelope.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `/mnt/documents/documents-forms-${name}-templates.png`, fullPage: true });
    const target = page.getByRole('button', { name: /Warning Letter/i }).first();
    if (await target.count()) await target.click();
    else await page.locator('[role="dialog"] button').filter({ hasText: /Form A|Offer Letter|MOU|AI Home Finder/i }).first().click({ timeout: 3000 }).catch(()=>{});
  }
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `/mnt/documents/document-studio-${name}-editor.png`, fullPage: true });
  const qa = await page.evaluate(() => {
    const overflow = [...document.querySelectorAll('*')].filter(el => el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX !== 'visible').slice(0, 8).map(el => ({tag: el.tagName, cls: String(el.className).slice(0,80), w: el.clientWidth, sw: el.scrollWidth}));
    const templateNames = [...document.querySelectorAll('button')].map(b => b.textContent || '').filter(t => /Warning Letter|Form A|Form B|Form F|Form I|Agent-to-Agent|Offer Letter|Contract|NOC|Reservation|MOU|Tenancy|Custom Client|Letterhead|AI Home Finder/i.test(t)).length;
    const overlay = document.querySelector('[data-document-studio-overlay]');
    const footer = overlay?.querySelector('footer');
    const header = overlay?.querySelector('header');
    return {
      path: location.pathname,
      hasOverlay: !!overlay,
      templateMatchesVisible: templateNames,
      bodyHasLLC: document.body.innerText.includes('L.L.C S.O.C'),
      bodyHasDocumentStudio: document.body.innerText.includes('Document Studio'),
      headerText: header?.textContent?.trim().slice(0,120) || '',
      footerColor: footer ? getComputedStyle(footer).color : null,
      overflowing: overflow,
    };
  });
  console.log(name, JSON.stringify(qa));
  await page.close();
}
await browser.close();
