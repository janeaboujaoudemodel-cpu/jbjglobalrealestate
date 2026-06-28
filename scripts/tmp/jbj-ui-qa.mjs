import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const base = 'http://127.0.0.1:8080';
const outDir = '/mnt/documents/jbj-design-system-qa';
fs.mkdirSync(outDir, { recursive: true });

const pages = [
  ['Homepage', '/'],
  ['Careers', '/join'],
  ['AI Home Finder', '/ai-home-finder'],
  ['Market Intelligence', '/market-intelligence'],
  ['Broker Portal', '/broker/portal'],
  ['Owner Portal', '/owner'],
  ['Documents & Forms', '/documents'],
  ['Services', '/services'],
  ['Insights & Guides', '/guides'],
];
const viewports = [
  ['desktop', { width: 1440, height: 1100 }],
  ['ipad', { width: 820, height: 1180 }],
];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fileSafe = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function dismiss(page) {
  for (const text of ['Accept', 'Got it', 'Close', 'Skip', 'Maybe later']) {
    const loc = page.getByRole('button', { name: new RegExp(text, 'i') }).first();
    if (await loc.isVisible().catch(() => false)) await loc.click({ timeout: 800 }).catch(() => {});
  }
  await page.keyboard.press('Escape').catch(() => {});
}

async function interactions(page, label) {
  const notes = [];
  await dismiss(page);
  // Hover visible shared buttons/links without changing page by limiting count.
  const buttons = page.locator('button:visible, a[role="button"]:visible, [data-jbj-button]:visible');
  const bCount = Math.min(await buttons.count().catch(() => 0), 14);
  for (let i = 0; i < bCount; i++) {
    const b = buttons.nth(i);
    const box = await b.boundingBox().catch(() => null);
    if (box && box.width > 6 && box.height > 6) {
      await b.hover({ timeout: 500 }).catch(() => {});
      notes.push(`hovered button ${i + 1}`);
      await sleep(60);
    }
  }

  // Click actual dropdown/listbox/menu triggers and capture hover/open state.
  const dropdownTriggers = page.locator('[data-radix-dropdown-menu-trigger]:visible, [aria-haspopup="menu"]:visible, [aria-haspopup="listbox"]:visible, [role="combobox"]:visible');
  const dCount = Math.min(await dropdownTriggers.count().catch(() => 0), 8);
  for (let i = 0; i < dCount; i++) {
    const t = dropdownTriggers.nth(i);
    const box = await t.boundingBox().catch(() => null);
    if (box && box.width > 8 && box.height > 8) {
      await t.click({ timeout: 700 }).catch(() => {});
      notes.push(`opened dropdown ${i + 1}`);
      await sleep(160);
      const item = page.locator('[role="menuitem"]:visible, [role="option"]:visible, [data-radix-collection-item]:visible').first();
      if (await item.isVisible().catch(() => false)) await item.hover({ timeout: 500 }).catch(() => {});
      await page.keyboard.press('Escape').catch(() => {});
      await sleep(80);
    }
  }

  // FAQ accordions.
  const faqTriggers = page.locator('button:visible').filter({ hasText: /\?$/ });
  const fCount = Math.min(await faqTriggers.count().catch(() => 0), 4);
  for (let i = 0; i < fCount; i++) {
    await faqTriggers.nth(i).click({ timeout: 700 }).catch(() => {});
    notes.push(`opened FAQ ${i + 1}`);
    await sleep(100);
  }

  // Careers selection/unselection.
  if (label === 'Careers') {
    const apply = page.getByRole('button', { name: /apply|selected/i }).first();
    if (await apply.isVisible().catch(() => false)) {
      await apply.click({ timeout: 1000 }).catch(() => {});
      await sleep(250);
      notes.push('selected job card');
      const selected = page.getByRole('button', { name: /selected/i }).first();
      if (await selected.isVisible().catch(() => false)) await selected.click({ timeout: 1000 }).catch(() => {});
      else await apply.click({ timeout: 1000 }).catch(() => {});
      await sleep(250);
      notes.push('unselected job card');
    }
  }
  return notes;
}

function luminance([r,g,b]) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
}
function ratio(fg,bg) {
  const a = luminance(fg), b = luminance(bg);
  return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}

async function contrastAudit(page) {
  return await page.evaluate(() => {
    const parse = (c) => {
      const m = String(c || '').match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const vals = m[1].split(',').map(v => Number.parseFloat(v.trim()));
      if (vals.length < 3) return null;
      const a = vals.length >= 4 ? vals[3] : 1;
      return [vals[0], vals[1], vals[2], a];
    };
    const composite = (fg, bg) => {
      const a = fg?.[3] ?? 1;
      if (a >= 1) return fg;
      return [fg[0]*a + bg[0]*(1-a), fg[1]*a + bg[1]*(1-a), fg[2]*a + bg[2]*(1-a), 1];
    };
    const bgFor = (el) => {
      let n = el;
      let bg = [253,251,247,1];
      while (n && n.nodeType === 1) {
        const cs = getComputedStyle(n);
        const p = parse(cs.backgroundColor);
        if (p && p[3] > 0) { bg = composite(p, bg); if (bg[3] >= 0.98) break; }
        n = n.parentElement;
      }
      return bg;
    };
    const els = [...document.querySelectorAll('body *')].filter(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none' && (el.innerText?.trim() || el.tagName === 'svg' || el.querySelector('svg'));
    }).slice(0, 1200);
    const samples = [];
    for (const el of els) {
      const cs = getComputedStyle(el);
      const fg = parse(cs.color);
      const bg = bgFor(el);
      const txt = (el.innerText || el.getAttribute('aria-label') || el.tagName).trim().slice(0,80);
      const rect = el.getBoundingClientRect();
      const darkBg = (bg[0]+bg[1]+bg[2])/3 < 95;
      const brightBg = (bg[0]+bg[1]+bg[2])/3 > 185;
      const blackish = fg && fg[0] < 45 && fg[1] < 45 && fg[2] < 45;
      const whiteish = fg && fg[0] > 238 && fg[1] > 238 && fg[2] > 238;
      if ((darkBg && blackish) || (brightBg && whiteish)) samples.push({txt, tag: el.tagName, cls: String(el.className).slice(0,100), fg, bg, rect:{x:Math.round(rect.x),y:Math.round(rect.y),w:Math.round(rect.width),h:Math.round(rect.height)}});
      if (samples.length >= 20) break;
    }
    return samples;
  });
}

const browser = await chromium.launch({ headless: true });
const manifest = [];
for (const [vpName, viewport] of viewports) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(2500);
  for (const [label, route] of pages) {
    const slug = `${fileSafe(label)}-${vpName}`;
    const url = base + route;
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(async () => {
      await page.goto(url, { waitUntil: 'load', timeout: 25000 }).catch(() => {});
    });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await sleep(800);
    await dismiss(page);
    const initial = path.join(outDir, `${slug}-01-loaded.png`);
    await page.screenshot({ path: initial, fullPage: false });
    const notes = await interactions(page, label);
    const after = path.join(outDir, `${slug}-02-interactions.png`);
    await page.screenshot({ path: after, fullPage: false });
    const contrast = await contrastAudit(page).catch(e => [{ error: e.message }]);
    manifest.push({ label, route, viewport: vpName, initial, after, notes, contrastIssues: contrast, pageErrors: errors.slice(0,5) });
  }
  await context.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ outDir, pages: pages.length, screenshots: manifest.length * 2, manifest: path.join(outDir, 'manifest.json') }, null, 2));
