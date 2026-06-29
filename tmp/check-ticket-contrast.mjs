import { chromium } from '@playwright/test';
const urls = ['http://127.0.0.1:8080/ticket-hub', 'http://127.0.0.1:5173/ticket-hub'];
const browser = await chromium.launch({ headless: true });
for (const url of urls) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('goto err', url, e.message));
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('[role="tab"]')].map((tab, i) => {
      const svg = tab.querySelector('svg');
      const path = svg?.querySelector('path,rect,circle,line,polyline,polygon,ellipse,g');
      const ts = getComputedStyle(tab);
      const ss = svg ? getComputedStyle(svg) : null;
      const ps = path ? getComputedStyle(path) : null;
      return {
        i,
        text: tab.textContent?.trim(),
        state: tab.getAttribute('data-state'),
        tabColor: ts.color,
        tabFill: ts.fill,
        tabBg: ts.backgroundImage || ts.backgroundColor,
        svgColor: ss?.color,
        svgStroke: ss?.stroke,
        svgFill: ss?.fill,
        pathStroke: ps?.stroke,
        pathFill: ps?.fill,
        outer: svg?.outerHTML.slice(0, 250),
      };
    });
    return { href: location.href, title: document.title, body: document.body.innerText.slice(0, 500), tabs };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: `/mnt/documents/ticket-contrast-${url.includes('5173') ? '5173' : '8080'}.png`, fullPage: false });
  await page.close();
}
await browser.close();
