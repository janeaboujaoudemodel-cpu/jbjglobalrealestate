import { chromium } from '@playwright/test';
import fs from 'fs';
const base = 'http://127.0.0.1:8080';
const outDir = '/mnt/documents/gold-green-audit';
fs.mkdirSync(outDir, { recursive: true });
const routes = [
  ['/ai-home-finder','ai-home-finder'],
  ['/list-property','list-property'],
  ['/interior-design-ai','interior-design-ai'],
  ['/business-card-scanner','business-card-scanner'],
];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
const results = [];
for (const [route, name] of routes) {
  await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const screenshot = `${outDir}/${name}.png`;
  await page.screenshot({ path: screenshot, fullPage: true });
  const violations = await page.evaluate(() => {
    const goldNeedles = ['184, 149, 85', '184,149,85', '#b89555', 'rgb(184, 149, 85)'];
    const brightGreenNeedles = ['16, 185, 129', '52, 211, 153', '34,197,94', '34, 197, 94'];
    const isVisible = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 2 && r.height > 2 && r.bottom >= 0 && r.right >= 0 && r.top <= innerHeight * 2;
    };
    const describe = (el) => `${el.tagName.toLowerCase()}${el.id ? '#'+el.id : ''}${el.className && typeof el.className === 'string' ? '.'+el.className.trim().split(/\s+/).slice(0,4).join('.') : ''}`;
    const hits = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!isVisible(el)) continue;
      const cs = getComputedStyle(el);
      const vals = {
        color: cs.color,
        background: cs.background,
        backgroundColor: cs.backgroundColor,
        borderTopColor: cs.borderTopColor,
        borderRightColor: cs.borderRightColor,
        borderBottomColor: cs.borderBottomColor,
        borderLeftColor: cs.borderLeftColor,
        outlineColor: cs.outlineColor,
        boxShadow: cs.boxShadow,
      };
      const joined = Object.values(vals).join(' | ').toLowerCase();
      const hasGold = goldNeedles.some(n => joined.includes(n.toLowerCase()));
      const hasBrightGreen = brightGreenNeedles.some(n => joined.includes(n.toLowerCase()));
      const vividGreen = Object.entries(vals).some(([k, v]) => {
        const m = String(v).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!m) return false;
        const [r,g,b] = m.slice(1).map(Number);
        return (k.toLowerCase().includes('background') || k.toLowerCase().includes('border')) && g >= 170 && r <= 70 && b >= 80;
      });
      if (hasGold || hasBrightGreen || vividGreen) hits.push({ el: describe(el), text: (el.textContent || '').trim().slice(0,80), vals, reason: { hasGold, hasBrightGreen, vividGreen } });
    }
    return hits.slice(0,30);
  });
  results.push({ route, screenshot, violationCount: violations.length, violations });
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
