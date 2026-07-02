import { chromium } from '@playwright/test';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8080';
const browser = await chromium.launch({ headless: true, executablePath: '/bin/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', msg => { if (['error'].includes(msg.type())) errors.push(msg.text()); });
page.on('pageerror', err => errors.push(err.message));
await page.goto(base + '/map', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('[data-map-page]', { timeout: 30000 });
await page.waitForSelector('.leaflet-container', { timeout: 30000 });
await page.waitForTimeout(2500);
await page.locator('.jj-map-segment').filter({ hasText: 'List' }).click({ timeout: 10000 });
await page.waitForSelector('[data-map-list-panel]', { timeout: 10000 });
await page.waitForTimeout(800);
const state = await page.evaluate(() => {
  const rgbaToRgb = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const parts = m[1].split(',').slice(0,3).map(v => Number.parseFloat(v));
    return parts.length === 3 && parts.every(Number.isFinite) ? parts : null;
  };
  const lum = (rgb) => {
    const vals = rgb.map(v => { v/=255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4); });
    return .2126*vals[0]+.7152*vals[1]+.0722*vals[2];
  };
  const isDarkEmerald = (el) => {
    if (!el) return false; const rgb = rgbaToRgb(getComputedStyle(el).backgroundColor); if (!rgb) return false;
    return lum(rgb) < 0.22 && rgb[1] >= rgb[0] && rgb[1] >= rgb[2] * 0.7;
  };
  const isWhiteText = (el) => {
    if (!el) return false; const rgb = rgbaToRgb(getComputedStyle(el).color); if (!rgb) return false;
    return rgb[0] > 235 && rgb[1] > 235 && rgb[2] > 235;
  };
  const commandBar = document.querySelector('.jj-map-command-bar');
  const panel = document.querySelector('[data-map-list-panel]');
  const cards = [...document.querySelectorAll('.jj-map-list-card,.jj-map-project-card,.jj-map-hover-card')];
  const activeButtons = [...document.querySelectorAll('.jj-map-layer-button[data-active="true"],.jj-map-segment[data-active="true"],.jj-map-count-pill')];
  const panelRect = panel?.getBoundingClientRect();
  const commandRect = commandBar?.getBoundingClientRect();
  const sampleCard = cards[0];
  const searchInput = document.querySelector('.jj-map-search-input');
  return {
    path: location.pathname,
    mapPage: !!document.querySelector('[data-map-page]'),
    leaflet: !!document.querySelector('.leaflet-container'),
    markers: document.querySelectorAll('.leaflet-marker-icon').length,
    countText: document.querySelector('.jj-map-count-pill')?.textContent?.trim() || '',
    panelExists: !!panel,
    panelBelowFilter: !!(panelRect && commandRect && panelRect.top >= commandRect.bottom - 1),
    panelTop: Math.round(panelRect?.top || 0), commandBottom: Math.round(commandRect?.bottom || 0),
    searchOpaque: !!searchInput && getComputedStyle(searchInput).backgroundColor !== 'rgba(0, 0, 0, 0)',
    searchBg: searchInput ? getComputedStyle(searchInput).backgroundColor : null,
    cardsCount: cards.length,
    sampleCardDarkEmerald: isDarkEmerald(sampleCard),
    sampleCardWhiteText: isWhiteText(sampleCard?.querySelector('h3,h4,span,p,a,button')),
    activeButtonsEmerald: activeButtons.length && activeButtons.every(isDarkEmerald),
    activeButtonsWhite: activeButtons.length && activeButtons.every(isWhiteText),
    activeButtonSamples: activeButtons.map(b => ({ text: b.textContent?.trim(), bg: getComputedStyle(b).backgroundColor, color: getComputedStyle(b).color })).slice(0,5),
  };
});
await page.screenshot({ path: '/mnt/documents/map-validation-proof.png', fullPage: true });
console.log(JSON.stringify({ errors: errors.slice(0,5), state, screenshot: '/mnt/documents/map-validation-proof.png' }, null, 2));
await browser.close();
