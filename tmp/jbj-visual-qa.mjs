import { chromium } from 'playwright';
const routes = ['/careers', '/hr-agent', '/ai-home-finder', '/', '/properties', '/market-intelligence', '/services', '/developers-portal'];
const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
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
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `/tmp/jbj-ui-qa-${route.replaceAll('/','_') || 'home'}.png`, fullPage: true });
    const data = await page.evaluate(() => {
      const text = document.body.innerText || '';
      const visible = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
      const jessica = [...document.querySelectorAll('[data-jessica-consultant-panel], img[alt*="Jessica"], [data-careers-emerald-title], [data-careers-emerald-subtitle], [data-careers-emerald-label]')].filter(visible).map(el => {
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        return { tag: el.tagName, text: (el.textContent || el.getAttribute('alt') || '').trim().replace(/\s+/g,' ').slice(0,100), color: cs.color, bg: cs.backgroundColor, w: Math.round(r.width), h: Math.round(r.height) };
      });
      const buttons = [...document.querySelectorAll('button, a[role="button"], .jj-cta-emerald')].filter(visible).slice(0,50).map(el => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return { text: (el.textContent||'').trim().replace(/\s+/g,' ').slice(0,70), w: Math.round(r.width), h: Math.round(r.height), color: cs.color, bg: cs.backgroundColor, overflow: cs.overflow, scrollW: Math.round(el.scrollWidth), scrollH: Math.round(el.scrollHeight) };
      });
      const header = [...document.querySelectorAll('.jj-header-icon-control, .jj-header-selector-control')].filter(visible).map(el => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return { text: (el.textContent||'').trim().replace(/\s+/g,' ').slice(0,30), w: Math.round(r.width), h: Math.round(r.height), color: cs.color, bg: cs.backgroundColor };
      });
      const compressed = buttons.filter(b => b.h < 38 || b.scrollW > b.w + 2 || b.scrollH > b.h + 2);
      return { textHasBadJessica: /AI Interview Assistant|Jessica AI|AI review|AI-parsed|AI-powered interview assistant/.test(text), jessica, compressed, headerCount: header.length, header };
    });
    findings.push({ route, ok: true, ...data });
  } catch (e) {
    findings.push({ route, ok: false, error: String(e?.message || e) });
  }
}
await browser.close();
console.log(JSON.stringify(findings, null, 2));
if (findings.some(f => !f.ok || f.textHasBadJessica || (f.route === '/careers' && f.jessica.length < 4))) process.exit(1);
