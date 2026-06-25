import { chromium } from 'playwright';
import fs from 'fs';
const base = process.env.BASE_URL || 'http://127.0.0.1:8081';
const email = process.env.OWNER_EMAIL || process.env.E2E_EMAIL || process.env.TEST_EMAIL || process.env.PLAYWRIGHT_EMAIL;
const password = process.env.OWNER_PASSWORD || process.env.E2E_PASSWORD || process.env.TEST_PASSWORD || process.env.PLAYWRIGHT_PASSWORD;
if (!email || !password) throw new Error('Missing login credentials');
fs.mkdirSync('/mnt/documents/contrast-proof', { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
page.on('console', msg => { if (msg.type() === 'error') console.log('[browser error]', msg.text()); });
page.on('pageerror', err => console.log('[pageerror]', err.message));
async function waitReady() { await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(1600); }
async function login() {
  await page.goto(`${base}/auth?redirect=${encodeURIComponent('/owner/crm?entity=leads&view=inbox')}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitReady();
  const emailBox = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  if (await emailBox.count()) {
    await emailBox.fill(email);
    await page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first().fill(password);
    await Promise.race([
      page.waitForURL(/owner\/crm|\/$/, { timeout: 30000 }).catch(()=>{}),
      (async () => { await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Sign In")').first().click(); await page.waitForTimeout(3000); })()
    ]);
    await waitReady();
  }
}
function contrastAuditScript() {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity || '1') > 0.25;
  };
  const isEmeraldSurface = (el) => {
    const s = getComputedStyle(el);
    const bg = `${s.backgroundColor} ${s.backgroundImage}`.toLowerCase();
    const cls = (el.className || '').toString().toLowerCase();
    const data = `${el.getAttribute('data-surface')||''} ${el.getAttribute('data-emerald-action')||''} ${el.getAttribute('data-emerald-ok')||''}`.toLowerCase();
    return bg.includes('4, 78, 59') || bg.includes('6, 78, 59') || bg.includes('3, 27, 18') || cls.includes('emerald') || data.includes('emerald') || el.getAttribute('aria-selected') === 'true';
  };
  const isWhiteish = (color) => {
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
    if (!m) return color.toLowerCase().includes('#fff') || color.toLowerCase().includes('white');
    const [r,g,b,a] = [m[1],m[2],m[3],m[4] ?? '1'].map(Number);
    return a >= 0.65 && r >= 235 && g >= 235 && b >= 235;
  };
  const offenders = [];
  for (const surface of Array.from(document.querySelectorAll('button, a, [role="tab"], [data-surface], [data-emerald-action], [data-emerald-ok], .jj-surface-emerald, .jj-emerald-action, .jj-pill-emerald, .jj-cta-emerald'))) {
    if (!visible(surface) || !isEmeraldSurface(surface)) continue;
    const candidates = [surface, ...Array.from(surface.querySelectorAll('span, div, p, strong, svg, [class*="lucide"]'))].filter(visible);
    for (const el of candidates) {
      const cs = getComputedStyle(el);
      const isSvg = el.tagName.toLowerCase() === 'svg' || (el.className||'').toString().includes('lucide');
      const color = isSvg && cs.stroke !== 'none' ? cs.stroke : cs.color;
      if (!isWhiteish(color)) {
        offenders.push({ text: (surface.innerText || surface.getAttribute('aria-label') || surface.className || surface.tagName).trim().slice(0,80), tag: el.tagName, color, html: surface.outerHTML.slice(0,220) });
        break;
      }
    }
  }
  return offenders.slice(0, 30);
}
async function shot(path, name) {
  await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitReady();
  await page.keyboard.press('Escape').catch(()=>{});
  const offenders = await page.evaluate(contrastAuditScript);
  console.log(`AUDIT ${name}: ${offenders.length} emerald contrast offenders`);
  if (offenders.length) console.log(JSON.stringify(offenders.slice(0,5), null, 2));
  await page.screenshot({ path: `/mnt/documents/contrast-proof/${name}.png`, fullPage: false });
}
await login();
await shot('/', '01-home');
await shot('/properties', '02-properties');
await shot('/off-plan-projects', '03-off-plan-projects');
await shot('/quiz', '04-ai-home-finder');
await shot('/owner/crm?entity=leads&view=inbox', '05-owner-crm-inbox');
await shot('/owner/crm?entity=leads&view=overview', '06-owner-crm-dashboard');
await shot('/owner/crm?entity=leads&view=all', '07-owner-crm-leads');
await browser.close();
