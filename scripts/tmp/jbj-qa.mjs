import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const base = 'http://127.0.0.1:8080';
const out = '/mnt/documents/jbj-design-system-qa';
fs.mkdirSync(out, { recursive: true });
const pages = [
  ['homepage','/'],
  ['careers','/careers'],
  ['ai-home-finder','/ai-home-finder'],
  ['market-intelligence','/market-intelligence'],
  ['broker-portal','/broker-dashboard'],
  ['owner-portal','/owner'],
  ['documents-forms','/documents-forms'],
  ['services','/services'],
  ['insights-guides','/guides'],
];
const viewports = [
  ['desktop', { width: 1440, height: 1000 }],
  ['ipad', { width: 820, height: 1180 }],
];

async function safeClick(locator, timeout = 1200) {
  try { if (await locator.count()) { const first = locator.first(); if (await first.isVisible({ timeout })) { await first.click({ timeout }); return true; } } } catch {}
  return false;
}
async function safeHover(locator) {
  try { if (await locator.count()) { const first = locator.first(); if (await first.isVisible({ timeout: 800 })) { await first.hover({ timeout: 800 }); return true; } } } catch {}
  return false;
}
function slug(s){ return s.replace(/[^a-z0-9]+/gi,'-').toLowerCase(); }

const browser = await chromium.launch({ headless: true });
const report = [];
for (const [vpName, viewport] of viewports) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(3500);
  for (const [name, url] of pages) {
    const record = { name, viewport: vpName, url, interactions: [], contrastIssues: [] };
    try {
      await page.goto(base + url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(1800);
      await page.screenshot({ path: path.join(out, `${vpName}-${name}-initial.png`), fullPage: true });

      // Header dropdowns / controls
      const controls = [
        ['search', page.getByLabel(/search/i)],
        ['filter', page.getByLabel(/filter/i)],
        ['currency', page.getByLabel(/currency/i)],
        ['mode', page.locator('[data-mode-trigger="header"], [data-mode-trigger="compact"]').first()],
        ['avatar', page.getByLabel(/account menu/i)],
      ];
      for (const [label, loc] of controls) {
        if (await safeClick(loc)) {
          record.interactions.push(`clicked ${label}`);
          await page.waitForTimeout(250);
          await page.screenshot({ path: path.join(out, `${vpName}-${name}-${slug(label)}-open.png`), fullPage: false });
          await page.keyboard.press('Escape').catch(()=>{});
          await page.waitForTimeout(150);
        }
      }

      // Hover buttons / CTAs.
      const btns = page.locator('button:visible, a[role="button"]:visible, [data-jbj-button]:visible');
      const n = Math.min(await btns.count(), 8);
      for (let i=0;i<n;i++) { await safeHover(btns.nth(i)); }
      if (n) record.interactions.push(`hovered ${n} buttons/ctas`);

      // FAQ / accordion triggers.
      const accordions = page.locator('[data-radix-accordion-trigger], button:has(svg):has-text("FAQ"), .faq-trigger, [data-faq-trigger]');
      const ac = Math.min(await accordions.count(), 3);
      for (let i=0;i<ac;i++) { await safeClick(accordions.nth(i)); await page.waitForTimeout(180); }
      if (ac) record.interactions.push(`opened ${ac} faq/accordion triggers`);

      // Careers: select + unselect first open job card / CTA.
      if (name === 'careers') {
        const apply = page.getByRole('button', { name: /^Apply$/i }).first();
        if (await safeClick(apply, 2500)) {
          record.interactions.push('selected first job via Apply');
          await page.waitForTimeout(250);
          await page.screenshot({ path: path.join(out, `${vpName}-${name}-job-selected.png`), fullPage: false });
          const selected = page.getByRole('button', { name: /Selected/i }).first();
          if (await safeClick(selected, 2500)) {
            record.interactions.push('unselected selected job via Selected button');
            await page.waitForTimeout(250);
            await page.screenshot({ path: path.join(out, `${vpName}-${name}-job-unselected.png`), fullPage: false });
          }
        }
      }

      // Readability audit for visible text/buttons/icons using computed colors and effective background.
      record.contrastIssues = await page.evaluate(() => {
        const parse = (c) => {
          const m = String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (!m) return null;
          return { r:+m[1], g:+m[2], b:+m[3], a:m[4]===undefined?1:+m[4] };
        };
        const lum = ({r,g,b}) => {
          const srgb=[r,g,b].map(v=>{v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});
          return 0.2126*srgb[0]+0.7152*srgb[1]+0.0722*srgb[2];
        };
        const effBg = (el) => {
          let n=el;
          while(n && n.nodeType===1){
            const cs=getComputedStyle(n);
            const bg=parse(cs.backgroundColor);
            if(bg && bg.a>0.65) return bg;
            n=n.parentElement;
          }
          return {r:253,g:251,b:247,a:1};
        };
        const out=[];
        const candidates=[...document.querySelectorAll('button, a, [role="button"], [role="menuitem"], [data-jbj-button], [data-jj-badge], h1,h2,h3,h4,p,span,label')]
          .filter(el => el instanceof HTMLElement && el.offsetParent !== null)
          .slice(0,900);
        for (const el of candidates) {
          const txt=(el.innerText||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,80);
          if(!txt && !el.matches('button,a,[role="button"],[data-jbj-button]')) continue;
          const cs=getComputedStyle(el), fg=parse(cs.color), bg=effBg(el);
          if(!fg || !bg) continue;
          const ratio=(Math.max(lum(fg),lum(bg))+0.05)/(Math.min(lum(fg),lum(bg))+0.05);
          const fgWhite=fg.r>235&&fg.g>235&&fg.b>235;
          const fgBlack=fg.r<45&&fg.g<45&&fg.b<45;
          const bgLight=lum(bg)>0.72;
          const bgDark=lum(bg)<0.18;
          if ((bgLight && fgWhite) || (bgDark && fgBlack) || (txt && ratio < 3.0)) {
            out.push({ tag: el.tagName, text: txt, color: cs.color, bg: `rgb(${bg.r},${bg.g},${bg.b})`, ratio: +ratio.toFixed(2), cls: el.className?.toString().slice(0,90) });
          }
          if(out.length>=12) break;
        }
        return out;
      });

      await page.screenshot({ path: path.join(out, `${vpName}-${name}-validated.png`), fullPage: true });
    } catch (e) {
      record.error = String(e?.message || e).slice(0, 500);
    }
    report.push(record);
  }
  await context.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'qa-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ out, pages: report.length, issues: report.reduce((a,r)=>a+(r.contrastIssues?.length||0),0), errored: report.filter(r=>r.error).map(r=>`${r.viewport}:${r.name}:${r.error}`) }, null, 2));
