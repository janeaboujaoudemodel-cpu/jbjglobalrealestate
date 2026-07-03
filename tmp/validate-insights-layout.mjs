import { chromium } from 'playwright';

const routes = [
  '/market-intelligence',
  '/market-intelligence/overview',
  '/buyer-guide',
  '/faq',
  '/services',
  '/services/fit-out',
  '/about',
  '/terms',
  '/privacy',
  '/disclaimers'
];
const base = 'http://localhost:8080';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
const results = [];
for (const route of routes) {
  const errors = [];
  page.removeAllListeners('pageerror');
  page.on('pageerror', e => errors.push(String(e.message || e)));
  await page.goto(base + route, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(900);
  const metrics = await page.evaluate(() => {
    const rgba = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
      const p = m[1].split(',').map(x => Number.parseFloat(x.trim()));
      return {r:p[0],g:p[1],b:p[2],a:p[3]??1, raw:c};
    };
    const hero = document.querySelector('[data-mi-hero], [data-guide-hero], [data-faq-hero], [data-brand-hero], [data-hero-dark], .jj-hero-fullscreen');
    const heroRect = hero?.getBoundingClientRect();
    const firstAfterHero = hero?.nextElementSibling;
    const actions = Array.from(hero?.querySelectorAll('a,button') || []).filter(el => (el.textContent || '').trim().length && el.getBoundingClientRect().width > 80);
    const actionStyles = actions.slice(-3).map(el => {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      return { text: (el.textContent||'').trim().replace(/\s+/g,' '), bg: cs.backgroundColor, bgImg: cs.backgroundImage, color: cs.color, w:Math.round(r.width), h:Math.round(r.height) };
    });
    const sections = Array.from(document.querySelectorAll('section')).filter(el => !el.matches('[data-mi-hero], [data-guide-hero], [data-faq-hero], [data-brand-hero], [data-hero-dark], .jj-hero-fullscreen'));
    const blackSections = sections.map((el, i) => ({i, bg: getComputedStyle(el).backgroundColor, cls: el.className?.toString()?.slice(0,100)})).filter(x => {
      const c = rgba(x.bg); return c && c.r < 20 && c.g < 20 && c.b < 20 && c.a > 0.8;
    });
    const firstContent = sections[0];
    const firstContentRect = firstContent?.getBoundingClientRect();
    const cards = Array.from(document.querySelectorAll('.card, [data-slot="card"], .jj-card-inner, .jj-guide-card, article[class*="rounded"], div[class*="rounded-2xl"][class*="border"]')).filter(el => {
      const r = el.getBoundingClientRect(); return r.width > 120 && r.height > 60 && !el.closest('[data-mi-toc], [data-guide-toc], [data-faq-toc], [data-premium-navigator]');
    }).slice(0, 12).map(el => { const r=el.getBoundingClientRect(), cs=getComputedStyle(el); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bg:cs.backgroundColor,border:cs.borderTopColor}; });
    const touchesEdge = cards.some(c => c.x < 16 || c.x + c.w > innerWidth - 16);
    return {
      path: location.pathname,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      scopeBg: getComputedStyle(document.querySelector('[data-insights-page]') || document.body).backgroundColor,
      hero: hero ? {h: Math.round(heroRect.height), bg: getComputedStyle(hero).backgroundColor, bgImg: getComputedStyle(hero).backgroundImage.slice(0,120)} : null,
      heroGap: heroRect && firstContentRect ? Math.round(firstContentRect.top - heroRect.bottom) : null,
      actionStyles,
      blackSections: blackSections.slice(0, 5),
      cardCount: cards.length,
      touchesEdge,
      cards: cards.slice(0, 4)
    };
  });
  results.push({ route, errors: errors.slice(0,2), metrics });
  if (route === '/market-intelligence') {
    await page.screenshot({ path: '/mnt/documents/market-intelligence-fixed-hero.png', fullPage: false });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - innerHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/mnt/documents/market-intelligence-fixed-lower.png', fullPage: false });
  }
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
