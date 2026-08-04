import { chromium } from 'playwright';

const browser = await chromium.launch();
const results = {};

async function audit(viewport, label) {
  const page = await browser.newPage({ viewport });
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('[data-property-search-bar]', { timeout: 20000 });
  await page.waitForTimeout(1500); // motion animations settle

  const capture = async (tag) => {
    return await page.evaluate((tag) => {
      const bar = document.querySelector('[data-property-search-bar]');
      if (!bar) return null;
      const segs = Array.from(bar.querySelectorAll('[data-search-segment]'));
      const out = [];
      for (const el of segs) {
        const cs = getComputedStyle(el);
        out.push({
          tag,
          outerTagPreview: el.outerHTML.slice(0, 160),
          classes: el.className,
          dataAttrs: [...el.attributes].filter(a=>a.name.startsWith('data-')).map(a=>`${a.name}=${a.value}`),
          bg: cs.backgroundColor,
          bgImage: cs.backgroundImage,
          color: cs.color,
          border: cs.border,
          borderColor: cs.borderColor,
          backdropFilter: cs.backdropFilter,
          boxShadow: cs.boxShadow,
        });
      }
      // search input
      const input = bar.querySelector('input');
      const inputCs = input ? getComputedStyle(input) : null;
      // consultation CTA
      const cta = bar.querySelector('.jj-emerald-action');
      const ctaCs = cta ? getComputedStyle(cta) : null;
      // main search button
      const searchBtn = Array.from(bar.querySelectorAll('button')).find(b => /Search|Show \d/.test(b.textContent||''));
      const searchBtnCs = searchBtn ? getComputedStyle(searchBtn) : null;
      return {
        segs: out,
        input: input ? { color: inputCs.color, caretColor: inputCs.caretColor, bg: inputCs.backgroundColor } : null,
        cta: cta ? { bg: ctaCs.backgroundColor, bgImage: ctaCs.backgroundImage, color: ctaCs.color, border: ctaCs.border } : null,
        searchBtn: searchBtn ? { bg: searchBtnCs.backgroundColor, bgImage: searchBtnCs.backgroundImage, color: searchBtnCs.color, text: searchBtn.textContent } : null,
      };
    }, tag);
  };

  const idle = await capture('idle');

  // Hover first segment (Location)
  const firstSeg = await page.$('[data-search-segment][aria-label]');
  let hover = null, open = null, focus = null;
  if (firstSeg) {
    await firstSeg.hover();
    await page.waitForTimeout(300);
    hover = await capture('hover');

    await firstSeg.click();
    await page.waitForTimeout(400);
    open = await capture('open-trigger');

    // capture popover content styles
    open.popover = await page.evaluate(() => {
      const pop = document.querySelector('[data-search-dropdown]');
      if (!pop) return null;
      const cs = getComputedStyle(pop);
      return { bg: cs.backgroundColor, color: cs.color, border: cs.border, classes: pop.className };
    });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // Focus search input
  const input = await page.$('[data-property-search-bar] input');
  if (input) {
    await input.focus();
    await page.waitForTimeout(200);
    focus = await capture('focus-input');
    await input.type('Marina');
    await page.waitForTimeout(200);
    const selected = await capture('typed-value');
    focus.selected = selected;
  }

  await page.screenshot({ path: `/tmp/hero-${label}.png` });
  await page.close();
  return { idle, hover, open, focus };
}

results.desktop = await audit({ width: 1440, height: 900 }, 'desktop');
results.mobile = await audit({ width: 390, height: 844 }, 'mobile');

console.log(JSON.stringify(results, null, 2));
await browser.close();
