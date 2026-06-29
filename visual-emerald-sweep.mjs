import { chromium } from '@playwright/test';
import fs from 'fs/promises';

const base = 'http://localhost:8080';
const outDir = '/mnt/documents/emerald-contrast-proof';
await fs.mkdir(outDir, { recursive: true });

const routes = [
  ['home', '/'],
  ['properties', '/properties'],
  ['developers', '/developers'],
  ['communities', '/communities'],
  ['services', '/services'],
  ['careers', '/careers'],
  ['ai-home-finder', '/ai-home-finder'],
  ['contact', '/contact'],
  ['owner-guard', '/owner'],
  ['admin-public', '/owner/admin'],
  ['document-studio-guard', '/document-studio'],
];

const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const allReports = [];

async function scan(label, stage) {
  const results = await page.evaluate(() => {
    const rgba = (s) => {
      const m = String(s || '').match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map(v => parseFloat(v.trim()));
      return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
    };
    const white = (c) => {
      const rgb = rgba(c);
      return rgb && rgb.r >= 245 && rgb.g >= 245 && rgb.b >= 245 && rgb.a > .75;
    };
    const transparent = (c) => {
      const rgb = rgba(c);
      return !rgb || rgb.a === 0;
    };
    const emeraldish = (el, cs) => {
      const bg = cs.backgroundColor;
      const img = cs.backgroundImage || '';
      const attr = el.getAttribute('data-surface') === 'emerald' || el.getAttribute('data-emerald-ok') !== null || el.getAttribute('data-emerald-action') !== null || el.getAttribute('data-studio-surface') === 'emerald';
      const cls = String(el.className || '');
      const bgc = rgba(bg);
      const ownStyle = `${bg} ${img} ${cls} ${el.getAttribute('style') || ''}`.toLowerCase();
      const token = /064e3b|042c1c|0a6b53|047857|065f46|022c22|jj-cta-primary|jj-cta-emerald|jj-pill-active|jj-surface-emerald|jj-emerald-solid|jj-emerald-metallic|jj-pill-emerald|careers-navy-cta/.test(ownStyle)
        || /(^|\s)(bg-emerald-(900|800|700|600)|bg-green-(900|800|700|600))(\/|\s|$)/.test(cls);
      const colorBased = bgc && bgc.a > 0.55 && bgc.g >= bgc.r * 1.2 && bgc.g >= bgc.b * 0.75 && bgc.g > 45 && bgc.r < 40 && bgc.b < 110;
      return attr || token || colorBased;
    };
    const bad = [];
    const emeraldSurfaces = Array.from(document.querySelectorAll('*')).filter(el => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return false;
      return emeraldish(el, cs);
    });
    for (const surf of emeraldSurfaces) {
      const descendants = [surf, ...Array.from(surf.querySelectorAll('*'))];
      for (const el of descendants) {
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        const cs = getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        const hasOwnText = Array.from(el.childNodes || []).some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
        const isSvg = tag === 'svg' || tag === 'path' || tag === 'circle' || tag === 'rect' || tag === 'line' || tag === 'polyline' || tag === 'polygon' || el.hasAttribute('data-lucide') || String(el.className || '').includes('lucide');
        if (!hasOwnText && !isSvg) continue;
        // approved champagne mini-pills sitting inside emerald rows
        if (el.closest('[data-mode-active-pill]') || el.closest('[data-mode-select-pill]')) continue;
        // ignore flag emoji spans: their glyph color is intrinsic, not CSS ink
        if (!isSvg && /^\p{Regional_Indicator}{2}$/u.test((el.textContent || '').trim())) continue;
        const colorOk = white(cs.color);
        const svgOk = !isSvg || white(cs.color) || white(cs.stroke) || (!transparent(cs.fill) && white(cs.fill));
        if (!colorOk || !svgOk) {
          bad.push({
            tag,
            text: (el.textContent || '').trim().slice(0, 80),
            className: String(el.className || '').slice(0, 180),
            color: cs.color,
            stroke: cs.stroke,
            fill: cs.fill,
            surfaceTag: surf.tagName.toLowerCase(),
            surfaceText: (surf.textContent || '').trim().slice(0, 80),
            surfaceClass: String(surf.className || '').slice(0, 180),
            surfaceBg: getComputedStyle(surf).backgroundColor,
            surfaceImg: getComputedStyle(surf).backgroundImage.slice(0, 180),
          });
          if (bad.length >= 50) break;
        }
      }
      if (bad.length >= 50) break;
    }
    return { url: location.href, emeraldSurfaceCount: emeraldSurfaces.length, bad };
  });
  allReports.push({ label, stage, ...results });
  return results;
}

async function openMenuByLabel(re, screenshotName) {
  const btn = page.getByRole('button', { name: re }).first();
  if (await btn.count()) {
    try {
      await btn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${outDir}/${screenshotName}.png`, fullPage: false });
      const rr = await scan(screenshotName, 'dropdown-open');
      console.log(`${screenshotName}: emerald surfaces ${rr.emeraldSurfaceCount}, issues ${rr.bad.length}`);
      await page.keyboard.press('Escape').catch(()=>{});
      await page.waitForTimeout(100);
    } catch (e) { console.log(`${screenshotName}: menu error ${e?.message || e}`); }
  } else {
    console.log(`${screenshotName}: trigger not found`);
  }
}

for (const [label, path] of routes) {
  try {
    await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${outDir}/${label}.png`, fullPage: false });
    const r = await scan(label, 'initial');
    const handles = await page.locator('button:visible, a:visible').elementHandles();
    let hovered = 0;
    for (const h of handles.slice(0, 30)) {
      try {
        const box = await h.boundingBox();
        if (!box || box.width < 20 || box.height < 20) continue;
        await h.hover({ timeout: 1000 });
        await page.waitForTimeout(70);
        hovered++;
        if (hovered >= 8) break;
      } catch {}
    }
    await page.screenshot({ path: `${outDir}/${label}-hover-sweep.png`, fullPage: false });
    const rh = await scan(label, 'after-hover');
    if (label === 'home') {
      await openMenuByLabel(/Currency|AED/i, 'home-currency-menu');
      await openMenuByLabel(/Mode|Broker|Investor|Developer/i, 'home-mode-menu');
      await openMenuByLabel(/Account menu/i, 'home-account-menu');
    }
    console.log(`${label}: initial issues ${r.bad.length}, hover issues ${rh.bad.length}, emerald surfaces ${r.emeraldSurfaceCount}/${rh.emeraldSurfaceCount}`);
  } catch (e) {
    allReports.push({ label, path, error: String(e?.message || e) });
    console.log(`${label}: ERROR ${e?.message || e}`);
  }
}

await fs.writeFile(`${outDir}/emerald-contrast-report.json`, JSON.stringify(allReports, null, 2));
console.log('SUMMARY');
console.log(JSON.stringify(allReports.map(r => ({ label: r.label, stage: r.stage, surfaces: r.emeraldSurfaceCount, bad: r.bad?.length || 0, error: r.error })), null, 2));
await browser.close();
