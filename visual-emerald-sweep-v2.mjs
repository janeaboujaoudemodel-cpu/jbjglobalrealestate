import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const outDir = '/mnt/documents/emerald-contrast-proof-v2';
fs.mkdirSync(outDir, { recursive: true });

const routes = [
  ['home','/'],
  ['properties','/properties'],
  ['property-map','/map'],
  ['communities','/communities'],
  ['developers','/developers'],
  ['guides','/guides'],
  ['services','/services'],
  ['market-intelligence','/market-intelligence'],
  ['partners','/partners'],
  ['contact','/contact'],
  ['about','/about'],
  ['careers','/careers'],
  ['ai-home-finder','/ai-home-finder'],
  ['dashboard','/dashboard'],
  ['developer-portal','/developer-portal'],
  ['broker-portal','/broker/portal'],
  ['owner','/owner'],
  ['auth','/auth'],
];

function isEmeraldRgb(rgb) {
  const m = String(rgb || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
  if (!m) return false;
  const r = +m[1], g = +m[2], b = +m[3], a = m[4] == null ? 1 : +m[4];
  if (a < 0.45) return false;
  // dark/medium green/emerald only, not champagne/gold/gray
  return g >= 35 && g > r * 1.18 && g > b * 1.08 && r <= 35 && b <= 95;
}

const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium' });
const contexts = [
  ['desktop', { width: 1440, height: 1100 }],
  ['tablet', { width: 820, height: 1180 }],
  ['mobile', { width: 390, height: 900 }],
];
const allReports = [];

for (const [device, viewport] of contexts) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  for (const [label, route] of routes) {
    const url = 'http://localhost:8080' + route;
    let navError = null;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1800);
      await page.evaluate(() => window.scrollTo(0, 0));
    } catch (e) { navError = String(e.message || e); }

    // Open key dropdowns on home/header for validation states.
    if (label === 'home') {
      try {
        const aed = page.getByText(/^AED$/).first();
        await aed.click({ timeout: 2500 });
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(outDir, `${device}-${label}-currency-open.png`), fullPage: false, timeout: 30000 });
        await page.keyboard.press('Escape');
      } catch {}
      try {
        const mode = page.getByText(/Select your mode|Broker|Owner|Investor|Developer/i).first();
        await mode.click({ timeout: 2500 });
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(outDir, `${device}-${label}-mode-open.png`), fullPage: false, timeout: 30000 });
        await page.keyboard.press('Escape');
      } catch {}
    }

    // Hover a few emerald controls so hover states are included in the scan.
    try {
      await page.evaluate(() => {
        const candidates = [...document.querySelectorAll('button,a,[role="button"],[role="menuitem"]')]
          .filter(el => {
            const cs = getComputedStyle(el);
            const cls = String(el.className || '');
            return cs.backgroundImage.includes('064E3B') || cs.backgroundImage.includes('emerald') || cls.includes('jj-cta') || el.getAttribute('data-surface') === 'emerald';
          });
        candidates.slice(0, 3).forEach(el => el.scrollIntoView({block:'center', inline:'center'}));
      });
    } catch {}

    const report = await page.evaluate(({ label, route, device }) => {
      const white = 'rgb(255, 255, 255)';
      const lightSurfaceSelectors = [
        '[data-surface="page"]','[data-surface="light"]','[data-surface="champagne"]','[data-surface="cream"]','[data-surface="raised"]','[data-surface="gold"]',
        '.surface-page','.surface-light','.surface-champagne','.surface-cream','.surface-raised','.surface-gold','.jj-card-inner','.jj-layer-2',
        '.jj-surface-emerald-soft','.jj-emerald-soft','.jj-emerald-outline','[data-emerald-tone="soft"]','[data-emerald-tone="outline"]'
      ].join(',');
      function isVisible(el) {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') > 0.04 && rect.width > 1 && rect.height > 1;
      }
      function isEmeraldRgbLocal(rgb) {
        const m = String(rgb || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
        if (!m) return false;
        const r = +m[1], g = +m[2], b = +m[3], a = m[4] == null ? 1 : +m[4];
        if (a < 0.45) return false;
        return g >= 35 && g > r * 1.18 && g > b * 1.08 && r <= 35 && b <= 95;
      }
      function hasEmeraldToken(el) {
        const cls = String(el.className || '');
        const style = String(el.getAttribute('style') || '');
        const attrs = ['data-surface','data-studio-surface','data-icon-tile-tone','data-cta','data-emerald-action','data-emerald-filled','data-emerald-band','data-emerald-icon-surface','data-ink-emerald']
          .map(a => `${a}=${el.getAttribute(a) || ''}`).join(' ');
        const tokens = cls + ' ' + style + ' ' + attrs;
        if (/jj-surface-emerald-soft|jj-emerald-soft|jj-emerald-outline|emerald-tone="soft"/.test(tokens)) return false;
        return /data-surface=emerald|data-studio-surface=emerald|data-icon-tile-tone=emerald|data-cta=primary|data-cta=dark|jj-cta-(primary|emerald|dark)|jj-(surface-emerald|emerald-solid|emerald-fill|emerald-metallic|emerald-action|pill-emerald|chip-emerald|icon-tile-emerald)|careers-(navy-cta|pill-active|card-navy)|bg-(emerald|green)-(950|900|800|700|600)|bg-\[#[0-9A-Fa-f]*\]|from-(emerald|green)-|via-(emerald|green)-|to-(emerald|green)-|#064E3B|#042c1c|#042C1C|#0A6B53|#047857|#065F46|#022C22/i.test(tokens);
      }
      function isOwnEmerald(el) {
        if (!isVisible(el)) return false;
        if (el.matches('.jj-surface-emerald-soft,.jj-emerald-soft,.jj-emerald-outline,[data-emerald-tone="soft"],[data-emerald-tone="outline"]')) return false;
        const cs = getComputedStyle(el);
        const bg = cs.backgroundColor;
        const bgImg = cs.backgroundImage || '';
        const own = hasEmeraldToken(el) || isEmeraldRgbLocal(bg) || /#064E3B|#042c1c|#042C1C|#0A6B53|#047857|#065F46|#022C22|emerald|green/i.test(bgImg);
        if (!own) return false;
        // Skip champagne gradient cards that accidentally carry legacy emerald class names.
        const cls = String(el.className || '');
        if ((cls.includes('from-[#FDFBF7]') || cls.includes('via-[#F7F2EA]') || cls.includes('to-[#EFE6D6]')) && !el.matches('[data-surface="emerald"]')) return false;
        return true;
      }
      function isBadColor(el) {
        const cs = getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || '').replace(/\s+/g,' ').trim();
        const hasText = text.length > 0 && !['svg','path','circle','rect','line','polyline','polygon','ellipse','g'].includes(tag);
        const isSvgish = ['svg','path','circle','rect','line','polyline','polygon','ellipse','g','use'].includes(tag) || String(el.className || '').includes('lucide') || el.hasAttribute('data-lucide');
        if (!hasText && !isSvgish) return false;
        if (isSvgish) {
          const stroke = cs.stroke;
          const fill = cs.fill;
          const usesStroke = stroke && stroke !== 'none' && stroke !== 'rgba(0, 0, 0, 0)' && stroke !== white;
          const usesFill = fill && fill !== 'none' && fill !== 'rgba(0, 0, 0, 0)' && fill !== white;
          const colorBad = cs.color !== white && stroke === 'currentcolor';
          return usesStroke || usesFill || colorBad;
        }
        return cs.color !== white || (cs.webkitTextFillColor && cs.webkitTextFillColor !== white);
      }
      const bad = [];
      const surfaces = [...document.querySelectorAll('*')].filter(isOwnEmerald);
      for (const surface of surfaces) {
        if (surface.closest(lightSurfaceSelectors) && !surface.matches(lightSurfaceSelectors) && !surface.matches('[data-surface="emerald"],[data-cta="primary"],[data-cta="dark"],.jj-cta-primary,.jj-cta-emerald,.jj-cta-dark,.jj-navy-cta')) {
          // Nested inside light surface; only scan if the element itself is a control/surface.
        }
        const nodes = [surface, ...surface.querySelectorAll('*')].filter(el => {
          if (!isVisible(el)) return false;
          if (el !== surface) {
            const nestedLight = el.closest(lightSurfaceSelectors);
            if (nestedLight && surface.contains(nestedLight) && nestedLight !== surface && !el.closest('[data-surface="emerald"],[data-cta="primary"],[data-cta="dark"],.jj-cta-primary,.jj-cta-emerald,.jj-cta-dark,.jj-navy-cta')) return false;
          }
          return isBadColor(el);
        });
        for (const el of nodes.slice(0, 6)) {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          bad.push({
            text: (el.textContent || '').replace(/\s+/g,' ').trim().slice(0,90),
            tag: el.tagName.toLowerCase(),
            color: cs.color,
            webkit: cs.webkitTextFillColor,
            stroke: cs.stroke,
            fill: cs.fill,
            className: String(el.className || '').slice(0,180),
            surfaceTag: surface.tagName.toLowerCase(),
            surfaceClass: String(surface.className || '').slice(0,220),
            surfaceAttrs: ['data-surface','data-cta','data-icon-tile-tone'].map(a=>`${a}=${surface.getAttribute(a)||''}`).join(' '),
            rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]
          });
          if (bad.length >= 60) break;
        }
        if (bad.length >= 60) break;
      }
      return { label, route, device, url: location.href, surfaces: surfaces.length, badCount: bad.length, bad };
    }, { label, route, device });
    report.navError = navError;
    allReports.push(report);
    await page.screenshot({ path: path.join(outDir, `${device}-${label}.png`), fullPage: true, timeout: 30000 });
  }
  await context.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir, 'emerald-contrast-report-v2.json'), JSON.stringify(allReports, null, 2));
const summary = allReports.map(r => `${r.device}/${r.label}: surfaces=${r.surfaces} bad=${r.badCount} url=${r.url}`).join('\n');
fs.writeFileSync(path.join(outDir, 'summary.txt'), summary + '\n');
console.log(summary);
