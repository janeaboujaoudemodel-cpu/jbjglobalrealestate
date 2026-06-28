import { chromium } from 'playwright';
const routes = ['/careers', '/hr-agent', '/ai-home-finder', '/', '/properties', '/market-intelligence', '/services', '/developers-portal'];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  localStorage.setItem('jbj_user_mode', 'broker');
  localStorage.setItem('jbj_user_mode_selected', 'true');
  localStorage.setItem('qa_mode', '1');
});
const findings = [];
for (const route of routes) {
  try {
    await page.goto(`http://127.0.0.1:4177${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `/mnt/documents/jbj-ui-qa-${route.replaceAll('/','_') || 'home'}.png`, fullPage: true });
    const data = await page.evaluate(() => {
      const text = document.body.innerText || '';
      const jessica = [...document.querySelectorAll('[data-jessica-consultant-panel], img[alt*="Jessica"], [data-careers-emerald-title], [data-careers-emerald-subtitle], [data-careers-emerald-label]')].map(el => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { tag: el.tagName, text: (el.textContent || el.getAttribute('alt') || '').trim().slice(0,80), color: cs.color, bg: cs.backgroundColor, w: Math.round(r.width), h: Math.round(r.height) };
      });
      const buttons = [...document.querySelectorAll('button, a[role="button"], .jj-cta-emerald')].filter(el => el.getBoundingClientRect().width > 1).slice(0,36).map(el => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return { text: (el.textContent||'').trim().replace(/\s+/g,' ').slice(0,60), w: Math.round(r.width), h: Math.round(r.height), color: cs.color, bg: cs.backgroundColor, overflow: cs.overflow };
      });
      const header = [...document.querySelectorAll('.jj-header-icon-control, .jj-header-selector-control')].map(el => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return { text: (el.textContent||'').trim().replace(/\s+/g,' ').slice(0,30), w: Math.round(r.width), h: Math.round(r.height), color: cs.color, bg: cs.backgroundColor };
      });
      return { textHasBadJessica: /AI Interview Assistant|Jessica AI|AI review|AI-parsed|AI-powered interview assistant/.test(text), jessica, buttons, header };
    });
    findings.push({ route, ok: true, ...data });
  } catch (e) {
    findings.push({ route, ok: false, error: String(e?.message || e) });
  }
}
await browser.close();
console.log(JSON.stringify(findings, null, 2));
if (findings.some(f => !f.ok || f.textHasBadJessica)) process.exit(1);
