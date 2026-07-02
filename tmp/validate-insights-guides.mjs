import { chromium } from 'playwright';
import fs from 'fs/promises';

const base = process.env.BASE_URL || 'http://127.0.0.1:5177';
const outDir = '/mnt/documents/insights-guides-validation';
await fs.mkdir(outDir, { recursive: true });

const routes = [
  ['/news', 'news'],
  ['/market-intelligence/overview', 'market-overview'],
  ['/market-intelligence/areas', 'area-intelligence'],
  ['/market-intelligence/reports', 'reports-archive'],
  ['/market-intelligence/methodology', 'methodology'],
  ['/guides', 'guides-library'],
  ['/buyer-guide', 'buyer-guide'],
  ['/seller-guide', 'seller-guide'],
  ['/rent-guide', 'rental-guide'],
  ['/tenant-guide', 'tenant-guide'],
  ['/landlord-guide', 'landlord-guide'],
  ['/investor-education', 'investor-education'],
  ['/faq', 'faq'],
];

const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(45000);

const results = [];
for (const [route, name] of routes) {
  await page.goto(base + route, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(()=>{});
  await page.addStyleTag({ content: `*,*::before,*::after{animation-duration:.01ms!important;animation-delay:0ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}` }).catch(()=>{});
  await page.waitForTimeout(900);

  const shotPath = `${outDir}/${name}.png`;
  await page.screenshot({ path: shotPath, fullPage: true });

  const metrics = await page.evaluate(() => {
    const isVisible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const textColor = (el) => getComputedStyle(el).color;
    const bg = (el) => getComputedStyle(el).backgroundImage + ' ' + getComputedStyle(el).backgroundColor;
    const emeraldish = (el) => /6, 78, 59|4, 120, 87|2, 44, 34|1, 8, 6|linear-gradient/i.test(bg(el));
    const notWhite = (c) => !/rgba?\(255, 255, 255/.test(c);

    const hero = document.querySelector('[data-mi-hero], [data-guide-hero], [data-faq-hero]');
    const heroRect = hero?.getBoundingClientRect();
    const sections = [...document.querySelectorAll('[data-mi-page] section:not([data-mi-hero]):not([data-guide-hero]):not([data-faq-hero]), [data-neon-page] section:not([data-guide-hero]):not([data-mi-hero]):not([data-faq-hero])')].filter(isVisible);
    const firstSection = sections.find(el => !el.hasAttribute('data-no-section-frame'));
    const firstSectionRect = firstSection?.getBoundingClientRect();

    const emeraldBad = [...document.querySelectorAll('[data-insights-page] *')]
      .filter(isVisible)
      .filter(el => emeraldish(el))
      .flatMap(el => [el, ...el.querySelectorAll('svg,span,p,h1,h2,h3,h4,div,a,li')])
      .filter((el, idx, arr) => arr.indexOf(el) === idx && isVisible(el))
      .filter(el => notWhite(textColor(el)))
      .slice(0, 12)
      .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim().slice(0, 45), color: textColor(el), cls: String(el.className).slice(0, 80) }));

    const toc = document.querySelector('[data-mi-toc], [data-guide-toc]');
    const activeToc = toc?.querySelector('[data-toc-state="active"]');
    const activeTocRect = activeToc?.getBoundingClientRect();
    const tocRows = toc ? [...toc.querySelectorAll('[data-toc-item]')].filter(isVisible).map(el => el.getBoundingClientRect().height) : [];

    const sidebarActive = [...document.querySelectorAll('[data-chrome="sidebar"] [data-sidebar-subitem][data-active="true"], [data-chrome="sidebar"] [data-sidebar-subitem][aria-current="page"]')]
      .filter(isVisible)
      .map(el => (el.textContent || '').trim());

    const purpleCount = [...document.querySelectorAll('[data-insights-page] *')]
      .filter(el => /purple|violet|fuchsia|pink/i.test(String(el.className)) && isVisible(el)).length;
    const goldBorderCount = [...document.querySelectorAll('[data-insights-page] *')]
      .filter(el => /B89555|gold/i.test(String(el.className) + (el.getAttribute('style') || '')) && isVisible(el)).length;

    return {
      url: location.pathname,
      heroLeft: heroRect ? Math.round(heroRect.left) : null,
      heroWidth: heroRect ? Math.round(heroRect.width) : null,
      viewportWidth: innerWidth,
      firstSectionWidth: firstSectionRect ? Math.round(firstSectionRect.width) : null,
      firstSectionLeft: firstSectionRect ? Math.round(firstSectionRect.left) : null,
      emeraldBad,
      activeTocBg: activeToc ? bg(activeToc).slice(0, 140) : null,
      activeTocColor: activeToc ? textColor(activeToc) : null,
      tocRowMin: tocRows.length ? Math.min(...tocRows) : null,
      tocRowMax: tocRows.length ? Math.max(...tocRows) : null,
      sidebarActive,
      purpleCount,
      goldBorderCount,
      shotPath: '',
    };
  });
  metrics.shotPath = shotPath;
  results.push(metrics);

  if (route === '/market-intelligence/reports') {
    const link = page.locator('[data-chrome="sidebar"] [data-sidebar-subitem]', { hasText: 'Reports Archive' }).first();
    if (await link.count()) {
      await link.click({ force: true });
      await page.waitForTimeout(350);
      results.push({ url: 'after-click-reports-archive', pathname: await page.evaluate(() => location.pathname) });
    }
  }
}

await fs.writeFile(`${outDir}/summary.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
