import { chromium } from '@playwright/test';

const baseURL = process.env.PREVIEW_URL || 'http://localhost:8080';
const cases = [
  { name: 'Broker dashboard canonicalizes to broker portal', mode: 'broker', path: '/broker-dashboard', expected: /\/broker\/portal/ },
  { name: 'Broker route remains broker in broker mode', mode: 'broker', path: '/broker/portal', expected: /\/broker\/portal/ },
  { name: 'Developer dashboard remains developer portal', mode: 'developer', path: '/developers-portal', expected: /\/developers-portal/ },
  { name: 'Investor dashboard remains investor dashboard', mode: 'investor', path: '/investor-dashboard', expected: /\/investor-dashboard/ },
  { name: 'Owner backend denies unauthenticated/non-owner', mode: 'owner', path: '/owner', expected: /(\/auth|\/403)/ },
  { name: 'Owner alias route denies unauthenticated/non-owner', mode: 'owner', path: '/owner-dashboard', expected: /(\/auth|\/403)/ },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.addInitScript(({ mode }) => {
  try {
    localStorage.setItem('smart_popup_dismissed_until', String(Date.now() + 7 * 864e5));
    localStorage.setItem('smart_popup_shown_count', '99');
    localStorage.setItem('smart_popup_session_shown', '1');
    localStorage.setItem('cookies_consent', JSON.stringify({ accepted: true, ts: Date.now() }));
    localStorage.setItem('cookiesConsent', 'accepted');
    localStorage.setItem('jj_user_mode', mode);
    localStorage.setItem('jj_mode_selected', 'true');
  } catch {}
}, { mode: 'broker' });

for (const c of cases) {
  await page.evaluate((mode) => {
    localStorage.setItem('jj_user_mode', mode);
    localStorage.setItem('jj_mode_selected', 'true');
    sessionStorage.removeItem('owner_verified_once');
  }, c.mode);
  await page.goto(new URL(c.path, baseURL).toString(), { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1200);
  const url = page.url();
  const path = new URL(url).pathname;
  if (!c.expected.test(path)) {
    throw new Error(`${c.name}: expected ${c.expected}, got ${url}`);
  }
  console.log(`PASS ${c.name}: ${url}`);
}

await browser.close();
